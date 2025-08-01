import React, { useState, useEffect } from 'react';

const OnlineStatus = ({ 
  userId, 
  isOnline, 
  lastSeen, 
  showText = false, 
  size = 'small' // 'small', 'medium', 'large'
}) => {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (!isOnline && lastSeen) {
      const updateTimeAgo = () => {
        const now = new Date();
        const lastSeenDate = new Date(lastSeen);
        const diffInSeconds = Math.floor((now - lastSeenDate) / 1000);
        
        if (diffInSeconds < 60) {
          setTimeAgo('только что');
        } else if (diffInSeconds < 3600) {
          const minutes = Math.floor(diffInSeconds / 60);
          setTimeAgo(`${minutes} мин назад`);
        } else if (diffInSeconds < 86400) {
          const hours = Math.floor(diffInSeconds / 3600);
          setTimeAgo(`${hours} ч назад`);
        } else {
          const days = Math.floor(diffInSeconds / 86400);
          setTimeAgo(`${days} дн назад`);
        }
      };

      updateTimeAgo();
      const interval = setInterval(updateTimeAgo, 60000); // Обновляем каждую минуту

      return () => clearInterval(interval);
    }
  }, [isOnline, lastSeen]);

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'status-small';
      case 'medium': return 'status-medium';
      case 'large': return 'status-large';
      default: return 'status-small';
    }
  };

  return (
    <div className={`online-status ${getSizeClass()}`}>
      <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
        <div className="status-dot"></div>
        {isOnline && <div className="status-pulse"></div>}
      </div>
      
      {showText && (
        <span className="status-text">
          {isOnline ? 'В сети' : timeAgo || 'Был давно'}
        </span>
      )}
    </div>
  );
};

export default OnlineStatus;