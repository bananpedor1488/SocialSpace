import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenManager, apiClient } from './AuthPage';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = checking, true = auth, false = not auth
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const accessToken = tokenManager.getAccessToken();
      const refreshToken = tokenManager.getRefreshToken();
      
      // Если нет токенов вообще
      if (!accessToken && !refreshToken) {
        console.log('No tokens found, redirecting to login');
        setIsAuthenticated(false);
        setIsLoading(false);
        navigate('/');
        return;
      }

      // Если есть access token, проверяем его
      if (accessToken) {
        try {
          const response = await apiClient.get('/me');
          console.log('Access token valid, user authenticated');
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        } catch (error) {
          console.log('Access token invalid or expired:', error.response?.status);
          // Продолжаем к попытке обновления токена
        }
      }

      // Если access token не работает, пробуем refresh token
      if (refreshToken) {
        try {
          console.log('Attempting to refresh token...');
          const response = await apiClient.post('/auth/refresh', { refreshToken });
          
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
          tokenManager.setTokens(newAccessToken, newRefreshToken);
          
          console.log('Token refreshed successfully');
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        } catch (refreshError) {
          console.log('Refresh token failed:', refreshError.response?.status);
          // Refresh token тоже не работает
        }
      }

      // Если все попытки не удались
      console.log('All authentication attempts failed, clearing tokens');
      tokenManager.clearTokens();
      setIsAuthenticated(false);
      setIsLoading(false);
      navigate('/');

    } catch (error) {
      console.error('Authentication check error:', error);
      tokenManager.clearTokens();
      setIsAuthenticated(false);
      setIsLoading(false);
      navigate('/');
    }
  };

  // Показываем загрузку пока проверяем авторизацию
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        backgroundColor: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{
          marginTop: '16px',
          color: '#6b7280',
          fontSize: '16px'
        }}>
          Проверяем авторизацию...
        </p>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // Если пользователь авторизован, показываем защищенный контент
  if (isAuthenticated) {
    return children;
  }

  // Если не авторизован, показываем сообщение (хотя должен уже редиректить)
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      backgroundColor: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '24px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        maxWidth: '400px'
      }}>
        <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>
          Доступ запрещен
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          Для доступа к этой странице необходимо войти в систему
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Перейти к входу
        </button>
      </div>
    </div>
  );
};

export default ProtectedRoute;