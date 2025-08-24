import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import EmailVerification from '../components/EmailVerification';

const EmailVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndVerification = async () => {
      try {
        // Проверяем, есть ли временные данные верификации в localStorage (для регистрации)
        const tempVerificationData = localStorage.getItem('tempVerificationData');
        if (tempVerificationData) {
          const tempData = JSON.parse(tempVerificationData);
          setVerificationData({
            userId: tempData.userId,
            email: tempData.email,
            isFromLogin: tempData.isFromLogin
          });
          // Очищаем временные данные
          localStorage.removeItem('tempVerificationData');
          setLoading(false);
          return;
        }

        // Проверяем аутентификацию (для входа)
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          navigate('/');
          return;
        }

        // Получаем данные пользователя
        const response = await axios.get('https://server-pqqy.onrender.com/api/me');
        const userData = response.data.user;

        // Проверяем верификацию email
        if (userData.emailVerified) {
          // Если email уже верифицирован, перенаправляем на домашнюю страницу
          navigate('/home');
          return;
        }

        // Устанавливаем данные для верификации из данных пользователя
        setVerificationData({
          userId: userData._id,
          email: userData.email,
          isFromLogin: location.state?.isFromLogin || false
        });

      } catch (error) {
        console.error('Auth check failed:', error);
        // Очищаем токены и перенаправляем на вход
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndVerification();
  }, [navigate, location.state]);

  const handleVerificationSuccess = (verifiedUser) => {
    // Обновляем данные пользователя в localStorage
    localStorage.setItem('user', JSON.stringify(verifiedUser));
    
    // Если есть токены, сохраняем их
    if (verifiedUser.accessToken && verifiedUser.refreshToken) {
      localStorage.setItem('accessToken', verifiedUser.accessToken);
      localStorage.setItem('refreshToken', verifiedUser.refreshToken);
    }
    
    // Перенаправляем на домашнюю страницу
    navigate('/home');
  };

  const handleVerificationBack = () => {
    // Очищаем токены и перенаправляем на вход
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #1e1e2e 0%, #2a2a40 25%, #3c3c5c 50%, #2a2a40 75%, #1e1e2e 100%)',
        color: 'white',
        fontSize: '18px'
      }}>
        Загрузка...
      </div>
    );
  }

  if (!verificationData) {
    return null;
  }

  return (
    <EmailVerification
      userId={verificationData.userId}
      email={verificationData.email}
      onVerificationSuccess={handleVerificationSuccess}
      onBack={handleVerificationBack}
      isFromLogin={verificationData.isFromLogin}
    />
  );
};

export default EmailVerificationPage;
