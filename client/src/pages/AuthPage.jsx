import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AuthPage.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [data, setData] = useState({ username: '', identifier: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();

  const showMessage = (text, type = 'error') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  const toggleForm = () => {
    setData({ username: '', identifier: '', password: '' });
    setMessage('');
    setIsLogin(!isLogin);
  };

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!isLogin && !isValidEmail(data.identifier)) {
      showMessage("Введите корректный email");
      setIsLoading(false);
      return;
    }

    try {
      const url = isLogin
        ? 'https://server-1-vr19.onrender.com/api/auth/login'
        : 'https://server-1-vr19.onrender.com/api/auth/register';

      const payload = isLogin
        ? { email: data.identifier, password: data.password }
        : { username: data.username, email: data.identifier, password: data.password };

      const res = await axios.post(url, payload, { withCredentials: true });

      showMessage(
        `${isLogin ? 'Добро пожаловать' : 'Регистрация прошла успешно'}: ${res.data.user?.username || data.username}`,
        'success'
      );

      setTimeout(() => navigate('/home'), 1000);
    } catch (err) {
      showMessage(
        isLogin ? 'Неверный email/ник или пароль' : 'Ошибка регистрации. Попробуйте еще раз'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="particles">
        {[...Array(50)].map((_, i) => (
          <div key={i} className={`particle particle-${i % 5}`}></div>
        ))}
      </div>

      <div className={`form-wrapper ${isLogin ? 'login-mode' : 'register-mode'}`}>
        <div className="mode-switcher">
          <div className="switcher-track">
            <div className={`switcher-thumb ${isLogin ? 'login-active' : 'register-active'}`}></div>
            <div
              className={`switcher-option ${isLogin ? 'active' : ''}`}
              onClick={() => !isLogin && toggleForm()}
            >
              <svg className="option-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>Вход</span>
            </div>
            <div
              className={`switcher-option ${!isLogin ? 'active' : ''}`}
              onClick={() => isLogin && toggleForm()}
            >
              <svg className="option-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span>Регистрация</span>
            </div>
          </div>
        </div>

        <div className="form-box">
          <div className="form-header">
            <div className="header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="form-title">
              {isLogin ? 'С возвращением!' : 'Присоединяйся к нам!'}
            </h2>
            <p className="form-subtitle">
              {isLogin
                ? 'Войдите в свой аккаунт для продолжения'
                : 'Создайте аккаунт и начните использовать платформу'}
            </p>
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

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="input-group">
                <div className="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="username"
                  placeholder="Имя пользователя"
                  value={data.username}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
            )}

            <div className="input-group">
              <div className="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type={isLogin ? 'text' : 'email'}
                name="identifier"
                placeholder={isLogin ? 'Email или никнейм' : 'Email'}
                value={data.identifier}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="input-group">
              <div className="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <circle cx="12" cy="16" r="1"></circle>
                  <path d="m7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <input
                type="password"
                name="password"
                placeholder="Пароль"
                value={data.password}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <button
              type="submit"
              className={`submit-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loading-spinner">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              ) : (
                <>
                  <span>{isLogin ? 'Войти' : 'Создать аккаунт'}</span>
                  <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
