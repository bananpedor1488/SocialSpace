import React, { useState, useEffect } from 'react';
import { LogOut, Shield, X } from 'lucide-react';

const ExternalLinkWarning = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');

  useEffect(() => {
    // Функция для перехвата кликов по ссылкам
    const handleLinkClick = (e) => {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      // Проверяем, является ли ссылка внешней
      const isExternal = href.startsWith('http://') || 
                        href.startsWith('https://') || 
                        href.startsWith('www.');

      // Проверяем, не является ли это ссылкой на наш домен
      const currentDomain = window.location.hostname;
      const isOwnDomain = href.includes(currentDomain);

      if (isExternal && !isOwnDomain) {
        e.preventDefault();
        setTargetUrl(href);
        setIsVisible(true);
      }
    };

    // Добавляем обработчик на документ
    document.addEventListener('click', handleLinkClick);

    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

  const handleConfirm = () => {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    setIsVisible(false);
    setTargetUrl('');
  };

  const handleCancel = () => {
    setIsVisible(false);
    setTargetUrl('');
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`external-link-overlay ${isVisible ? 'show' : ''}`} onClick={handleOverlayClick}>
      <div className="external-link-modal">
        <div className="external-link-icon">
          <LogOut size={48} />
        </div>
        
        <h3 className="external-link-title">
          Переход на внешний ресурс
        </h3>
        
        <p className="external-link-message">
          Вы покидаете безопасный <strong>SocialSpace</strong> и переходите на внешний источник. 
          Мы не можем гарантировать безопасность данного ресурса.
        </p>
        
        <div className="external-link-url">
          {targetUrl}
        </div>
        
        <p className="external-link-message">
          Вы уверены, что хотите продолжить?
        </p>
        
        <div className="external-link-buttons">
          <button 
            className="external-link-btn confirm" 
            onClick={handleConfirm}
          >
            <LogOut size={16} />
            Да, перейти
          </button>
          
          <button 
            className="external-link-btn cancel" 
            onClick={handleCancel}
          >
            <X size={16} />
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExternalLinkWarning;
