import React, { useState, useEffect, useRef } from 'react';
import { Phone, CheckCircle, AlertCircle, Copy, ExternalLink, Clock, CheckSquare } from 'lucide-react';
import API_CONFIG from '../config/api';
import './PhoneVerification.css';
import { formatDate } from '../utils/timeUtils';

const PhoneVerification = ({ onClose }) => {
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [instructions, setInstructions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [verificationStep, setVerificationStep] = useState('initial'); // initial, started, completed
  const [requestId, setRequestId] = useState(null);
  const [checkCount, setCheckCount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const checkIntervalRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    checkVerificationStatus();
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const checkVerificationStatus = async () => {
    try {
      setIsChecking(true);
      const token = localStorage.getItem('accessToken');
      
      console.log('🔍 Checking verification status...');
      console.log('Token present:', !!token);
      console.log('Token length:', token ? token.length : 0);
      
      if (!token) {
        console.error('❌ No token found in localStorage');
        setMessage('Токен авторизации не найден. Пожалуйста, войдите в систему заново.');
        setMessageType('error');
        return;
      }
      
      // Используем конфигурацию API для определения правильного URL
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? API_CONFIG.getRelativeUrl('/api/phone-verification/status')
        : API_CONFIG.getApiUrl('/api/phone-verification/status');
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        setMessage('Сессия истекла. Пожалуйста, войдите в систему заново.');
        setMessageType('error');
        // Очищаем токены и перенаправляем на страницу входа
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/auth';
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setVerificationStatus(data);
        
        // Если номер верифицирован, останавливаем проверку
        if (data.phoneVerified) {
          setVerificationStep('completed');
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
          }
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          setMessage('🎉 Номер телефона успешно верифицирован!');
          setMessageType('success');
        } else if (verificationStep === 'initial') {
          // Если номер не верифицирован и мы еще не начали процесс, получаем инструкции
          await getInstructions();
        }
      } else {
        setMessage(data.message || 'Ошибка при получении статуса');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      setMessage('Ошибка при проверке статуса верификации: ' + error.message);
      setMessageType('error');
    } finally {
      setIsChecking(false);
    }
  };

  const getInstructions = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        return;
      }
      
      // Используем конфигурацию API для определения правильного URL
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? API_CONFIG.getRelativeUrl('/api/phone-verification/instructions')
        : API_CONFIG.getApiUrl('/api/phone-verification/instructions');
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        setMessage('Сессия истекла. Пожалуйста, войдите в систему заново.');
        setMessageType('error');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/auth';
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setInstructions(data);
      }
    } catch (error) {
      console.error('Error getting instructions:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage('Ссылка скопирована в буфер обмена');
    setMessageType('success');
    setTimeout(() => setMessage(''), 3000);
  };

  const openTelegramBot = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      
      console.log('🚀 Opening Telegram bot...');
      console.log('Token present:', !!token);
      console.log('Token length:', token ? token.length : 0);
      
      if (!token) {
        console.error('❌ No token found in localStorage for Telegram bot');
        setMessage('Токен авторизации не найден. Пожалуйста, войдите в систему заново.');
        setMessageType('error');
        return;
      }
      
      // Используем конфигурацию API для определения правильного URL
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? API_CONFIG.getRelativeUrl('/api/phone-verification/start-auto-verification')
        : API_CONFIG.getApiUrl('/api/phone-verification/start-auto-verification');
      
      // Инициация автоматической верификации
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        setMessage('Сессия истекла. Пожалуйста, войдите в систему заново.');
        setMessageType('error');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/auth';
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setVerificationStep('started');
        setRequestId(data.chatId);
        setMessage('Автоматическая верификация инициирована! Откройте бота в Telegram.');
        setMessageType('success');
        
        // Открываем бота в новой вкладке
        window.open('https://t.me/SocialSpaceWEB_bot', '_blank');
        
        // Начинаем проверку статуса каждые 3 секунды
        checkIntervalRef.current = setInterval(async () => {
          setCheckCount(prev => prev + 1);
          await checkVerificationStatus();
        }, 3000);
        
        // Останавливаем проверку через 2 минуты
        timeoutRef.current = setTimeout(() => {
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
          }
          setMessage('Время ожидания истекло. Попробуйте еще раз.');
          setMessageType('error');
        }, 120000);
        
      } else {
        setMessage(data.message || 'Ошибка при инициации верификации');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error starting auto-verification:', error);
      setMessage('Ошибка при инициации автоматической верификации: ' + error.message);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (verificationStatus?.phoneVerified) {
      return (
        <div className="verification-success">
          <div className="success-animation">
            <div className="success-icon">
              <CheckCircle size={64} />
            </div>
            <div className="success-ripple"></div>
          </div>
          <h3>Номер телефона верифицирован!</h3>
          <p className="phone-number">+{verificationStatus.phoneNumber}</p>
          <p className="verification-date">
            Верифицирован: {formatDate(verificationStatus.phoneVerifiedAt)}
          </p>
          <div className="success-benefits">
            <h4>Преимущества верификации:</h4>
            <ul>
              <li>✅ Повышенная безопасность аккаунта</li>
              <li>✅ Быстрое восстановление доступа</li>
              <li>✅ Доступ ко всем функциям платформы</li>
              <li>✅ Защита от мошенничества</li>
            </ul>
          </div>
        </div>
      );
    }

    if (verificationStep === 'started') {
      return (
        <div className="verification-progress">
          <div className="progress-animation">
            <div className="progress-icon">
              <Clock size={48} />
            </div>
            <div className="progress-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          
          <h3>Ожидание подтверждения...</h3>
          
          {requestId && (
            <div className="request-info">
              <p className="request-id">
                <strong>Номер заявки:</strong> 
                <span className="request-number">{requestId}</span>
              </p>
              <p className="request-instructions">
                Покажите этот номер боту в Telegram для быстрой обработки
              </p>
            </div>
          )}
          
          <div className="progress-status">
            <p>Проверка статуса: {checkCount} раз</p>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min((checkCount * 3) / 120 * 100, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="progress-tips">
            <h4>💡 Что делать дальше:</h4>
            <ul>
              <li>Откройте Telegram и найдите бота @SocialSpaceWEB_bot</li>
              <li>Отправьте команду /start</li>
              <li>Нажмите кнопку "📱 Отправить номер телефона"</li>
              <li>Верификация произойдет автоматически!</li>
            </ul>
          </div>
        </div>
      );
    }

    return (
      <div className="verification-process">
        <div className="verification-info">
          <h3>Зачем нужна верификация?</h3>
          <p>
            Верификация номера телефона помогает обеспечить безопасность вашего аккаунта 
            и защитить его от несанкционированного доступа.
          </p>
        </div>

        {instructions && (
          <div className="verification-steps">
            <h3>Как верифицировать номер:</h3>
            
            <div className="steps-list">
              {instructions.steps.map((step) => (
                <div key={step.step} className="step-item">
                  <div className="step-number">{step.step}</div>
                  <div className="step-content">
                    <h4>{step.title}</h4>
                    <p>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bot-actions">
              <button 
                className="btn btn-primary"
                onClick={openTelegramBot}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="btn-spinner"></div>
                    Инициализация...
                  </>
                ) : (
                  <>
                    <ExternalLink size={16} />
                    Перейти в бота (автоматическая верификация)
                  </>
                )}
              </button>
              
              <button 
                className="btn btn-secondary"
                onClick={() => copyToClipboard('https://t.me/SocialSpaceWEB_bot')}
              >
                <Copy size={16} />
                Скопировать ссылку
              </button>
            </div>
          </div>
        )}

        <div className="verification-info">
          <h3>🚀 Автоматическая верификация</h3>
          <p>
            После нажатия кнопки "Перейти в бота" и отправки контакта в Telegram, 
            ваш номер телефона будет автоматически верифицирован на сайте.
          </p>
          
          <div className="verification-tips">
            <h4>💡 Как это работает:</h4>
            <ul>
              <li>Нажмите кнопку "Перейти в бота"</li>
              <li>Отправьте команду /start в Telegram</li>
              <li>Нажмите кнопку "📱 Отправить номер телефона"</li>
              <li>Верификация произойдет автоматически!</li>
              <li>Вернитесь на сайт - статус обновится</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="phone-verification-overlay">
      <div className="phone-verification">
        <div className="phone-verification-header">
          <div className="header-content">
            <Phone size={24} />
            <h2>Автоматическая верификация номера телефона</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="phone-verification-content">
          {message && (
            <div className={`message ${messageType}`}>
              {messageType === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span>{message}</span>
            </div>
          )}

          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default PhoneVerification;
