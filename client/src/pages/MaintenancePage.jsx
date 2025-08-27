import React from 'react';
import './MaintenancePage.css';

const MaintenancePage = () => {
  return (
    <div className="maintenance-container">
      <div className="maintenance-content">
        <div className="maintenance-icon">
          <span role="img" aria-label="tools">🔧</span>
        </div>
        
        <h1 className="maintenance-title">
          Сайт закрыт на доработку
        </h1>
        
        <p className="maintenance-message">
          Мы работаем над улучшением нашего сервиса, чтобы сделать его еще лучше для вас!
        </p>
        
        <div className="maintenance-emoji">
          <span role="img" aria-label="wave">👋</span>
        </div>
        
        <p className="maintenance-subtitle">
          До встречи в скором времени!
        </p>
        
        <div className="maintenance-footer">
          <p>Спасибо за понимание</p>
          <div className="maintenance-hearts">
            <span role="img" aria-label="heart">❤️</span>
            <span role="img" aria-label="heart">💙</span>
            <span role="img" aria-label="heart">💚</span>
          </div>
        </div>
      </div>
      
      <div className="maintenance-background">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
        <div className="floating-shape shape-4"></div>
      </div>
    </div>
  );
};

export default MaintenancePage;
