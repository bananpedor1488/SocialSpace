import React from 'react';
import Notification from './Notification';
import './Notification.css';

const NotificationContainer = ({ notifications, onRemoveNotification }) => {
  return (
    <div className="notifications-container">
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          id={notification.id}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          duration={notification.duration}
          onClose={onRemoveNotification}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;
