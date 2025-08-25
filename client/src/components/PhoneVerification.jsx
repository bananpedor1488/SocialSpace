import React, { useState, useEffect } from 'react';
import { Phone, CheckCircle, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import './PhoneVerification.css';

const PhoneVerification = () => {
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [instructions, setInstructions] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/phone-verification/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setVerificationStatus(data);
        
        // Если номер не верифицирован, получаем инструкции
        if (!data.phoneVerified) {
          await getInstructions();
        }
      } else {
        setMessage(data.message);
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      setMessage('Ошибка при проверке статуса верификации');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const getInstructions = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/phone-verification/instructions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setInstructions(data);
      }
    } catch (error) {
      console.error('Error getting instructions:', error);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    
    if (!verificationCode.trim()) {
      setMessage('Введите код верификации');
      setMessageType('error');
      return;
    }

    try {
      setIsVerifying(true);
      setMessage('');
      
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/phone-verification/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: verificationCode })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage(data.message);
        setMessageType('success');
        setVerificationCode('');
        await checkVerificationStatus(); // Обновляем статус
      } else {
        setMessage(data.message);
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      setMessage('Ошибка при верификации кода');
      setMessageType('error');
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage('Ссылка скопирована в буфер обмена');
    setMessageType('success');
    setTimeout(() => setMessage(''), 3000);
  };

  const openTelegramBot = () => {
    window.open('https://t.me/SocialSpaceWEB_bot', '_blank');
  };

  if (isLoading) {
    return (
      <div className="phone-verification">
        <div className="phone-verification-loading">
          <div className="loading-spinner"></div>
          <p>Проверяем статус верификации...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="phone-verification">
      <div className="phone-verification-header">
        <Phone size={24} />
        <h2>Верификация номера телефона</h2>
      </div>

      {message && (
        <div className={`message ${messageType}`}>
          {messageType === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{message}</span>
        </div>
      )}

      {verificationStatus?.phoneVerified ? (
        <div className="verification-success">
          <div className="success-icon">
            <CheckCircle size={48} />
          </div>
          <h3>Номер телефона верифицирован!</h3>
          <p className="phone-number">+{verificationStatus.phoneNumber}</p>
          <p className="verification-date">
            Верифицирован: {new Date(verificationStatus.phoneVerifiedAt).toLocaleDateString('ru-RU')}
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
      ) : (
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
                >
                  <ExternalLink size={16} />
                  Открыть Telegram бота
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

          <div className="verification-form">
            <h3>Введите код верификации</h3>
            <p>После отправки контакта боту, введите полученный код:</p>
            
            <form onSubmit={handleVerifyCode}>
              <div className="input-group">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Введите код (например: 123456789)"
                  maxLength="20"
                  disabled={isVerifying}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isVerifying || !verificationCode.trim()}
                >
                  {isVerifying ? 'Проверяем...' : 'Подтвердить'}
                </button>
              </div>
            </form>

            <div className="verification-tips">
              <h4>💡 Советы:</h4>
              <ul>
                <li>Код действителен 10 минут</li>
                <li>Код состоит только из цифр</li>
                <li>Не передавайте код третьим лицам</li>
                <li>Если код не приходит, попробуйте еще раз</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneVerification;
