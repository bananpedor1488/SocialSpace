import React from 'react';
import { User } from 'lucide-react';
import './Avatar.css';

const Avatar = ({ 
  src, 
  alt, 
  size = 'medium', 
  showOnline = false, 
  isOnline = false,
  className = '',
  onClick 
}) => {
  const sizeClasses = {
    small: 'avatar-small',
    medium: 'avatar-medium', 
    large: 'avatar-large',
    xlarge: 'avatar-xlarge'
  };

  return (
    <div 
      className={`avatar-container ${sizeClasses[size]} ${className} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      <div className="avatar-wrapper">
        {src ? (
          <img 
            src={src} 
            alt={alt || 'Avatar'} 
            className="avatar-image"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className="avatar-fallback" style={{ display: src ? 'none' : 'flex' }}>
          <User size={size === 'small' ? 16 : size === 'medium' ? 20 : size === 'large' ? 28 : 36} />
        </div>
      </div>
      
      {showOnline && (
        <div className={`online-indicator ${isOnline ? 'online' : 'offline'}`} />
      )}
    </div>
  );
};

export default Avatar;