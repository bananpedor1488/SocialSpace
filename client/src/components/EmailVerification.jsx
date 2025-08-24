import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EmailVerification.css';

const EmailVerification = ({ userId, email, onVerificationSuccess, onBack, isFromLogin = false }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  const showMessage = (text, type = 'error') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  // Обработка ввода кода
  const handleCodeChange = (index, value) => {
    if (value.length > 1) return; // Только один символ
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Автоматический переход к следующему полю
    if (value && index < 5) {
      const nextInput = document.querySelector(`input[data-index="${index + 1}"]`);
      if (nextInput) nextInput.focus();
    }
  };

  // Обработка удаления
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.querySelector(`input[data-index="${index - 1}"]`);
      if (prevInput) prevInput.focus();
    }
  };

  // Отправка кода на сервер
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const verificationCode = code.join('');
    if (verificationCode.length !== 6) {
      showMessage('Введите полный код подтверждения');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('https://server-pqqy.onrender.com/api/auth/verify-email', {
        userId,
        code: verificationCode
      });

      const { accessToken, refreshToken, user } = response.data;
      
      // Сохраняем токены
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      showMessage(
        isFromLogin 
          ? 'Email подтвержден! Теперь вы можете войти в аккаунт' 
          : 'Email подтвержден успешно!', 
        'success'
      );
      
      setTimeout(() => {
        onVerificationSuccess(user);
      }, 1500);

    } catch (error) {
      console.error('Verification error:', error);
      
      let errorMessage = 'Ошибка подтверждения';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      showMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Повторная отправка кода
  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    try {
      await axios.post('https://server-pqqy.onrender.com/api/auth/resend-verification', {
        userId
      });
      
      showMessage('Новый код отправлен на ваш email', 'success');
      setCountdown(60); // 60 секунд до следующей отправки
      
    } catch (error) {
      console.error('Resend error:', error);
      let errorMessage = 'Ошибка отправки кода';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      showMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Изменение email
  const handleChangeEmail = async () => {
    if (!newEmail || !isValidEmail(newEmail)) {
      showMessage('Введите корректный email адрес');
      return;
    }

    setIsChangingEmail(true);
    try {
      const response = await axios.post('https://server-pqqy.onrender.com/api/auth/change-email', {
        userId,
        newEmail
      });

      showMessage('Email изменен. Новый код отправлен на указанный адрес', 'success');
      // Обновляем email в родительском компоненте через callback
      if (response.data.email) {
        // Можно добавить callback для обновления email в родительском компоненте
      }
      setShowEmailChange(false);
      setNewEmail('');
      setCountdown(60);
      
    } catch (error) {
      console.error('Change email error:', error);
      let errorMessage = 'Ошибка изменения email';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      showMessage(errorMessage);
    } finally {
      setIsChangingEmail(false);
    }
  };

  // Валидация email
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Обратный отсчет для повторной отправки
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  return (
    <div className="email-verification-container">
      {/* Частицы на фоне */}
      <div className="particles">
        {Array.from({ length: 50 }, (_, i) => (
          <div key={i} className={`particle particle-${i % 5}`}></div>
        ))}
      </div>
      
      <div className="verification-wrapper">
        <div className="verification-box">
        <div className="verification-header">
          <div className="header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="verification-title">
            {isFromLogin ? 'Подтвердите email для входа' : 'Подтверждение email'}
          </h2>
          <p className="verification-subtitle">
            {isFromLogin 
              ? `Для входа в аккаунт необходимо подтвердить email. Код отправлен на <strong>${email}</strong>`
              : `Мы отправили код подтверждения на <strong>${email}</strong>`
            }
          </p>
          {isFromLogin && (
            <p className="verification-note">
              После подтверждения email вы сможете войти в аккаунт
            </p>
          )}
        </div>

        {message && (
          <div className={`message ${messageType}`}>
            <svg className="message-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              {messageType === 'success' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              )}
            </svg>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="verification-form">
          <div className="code-input-group">
            <label className="code-label">Введите код подтверждения:</label>
            <div className="code-inputs">
              {code.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  data-index={index}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="code-input"
                  maxLength={1}
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className={`submit-btn ${isLoading ? 'loading' : ''}`}
            disabled={isLoading || code.join('').length !== 6}
          >
            {isLoading ? (
              <div className="loading-spinner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            ) : (
              <>
                <span>Подтвердить</span>
                <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="verification-actions">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={countdown > 0 || isLoading}
            className="resend-btn"
          >
            {countdown > 0 
              ? `Отправить снова через ${countdown}с` 
              : 'Отправить код повторно'
            }
          </button>
          
          <button
            type="button"
            onClick={() => setShowEmailChange(!showEmailChange)}
            disabled={isLoading}
            className="change-email-btn"
          >
            Изменить email
          </button>
          
          {!isFromLogin && (
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              className="back-btn"
            >
              Назад к регистрации
            </button>
          )}
          
          {isFromLogin && (
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              className="back-btn"
            >
              Назад к входу
            </button>
          )}
        </div>

        {/* Форма изменения email */}
        {showEmailChange && (
          <div className="email-change-form">
            <h3>Изменить email</h3>
            <div className="input-group">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Новый email адрес"
                className="email-input"
                disabled={isChangingEmail}
              />
            </div>
            <div className="email-change-actions">
              <button
                type="button"
                onClick={handleChangeEmail}
                disabled={!newEmail || !isValidEmail(newEmail) || isChangingEmail}
                className="change-btn"
              >
                {isChangingEmail ? 'Изменение...' : 'Изменить email'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEmailChange(false);
                  setNewEmail('');
                }}
                disabled={isChangingEmail}
                className="cancel-btn"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
