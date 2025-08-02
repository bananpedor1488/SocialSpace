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
  // Логирование для отладки
  if (className && className.includes('search-result-avatar')) {
    console.log('🖼️ AVATAR В ПОИСКЕ:', {
      src: src,
      srcType: typeof src,
      srcLength: src ? src.length : 0,
      alt: alt,
      hasData: src && src.startsWith && src.startsWith('data:'),
      isEmpty: !src || !src.trim()
    });
  }
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
        {src && src.trim() ? (
          <img 
            src={src.startsWith('data:') ? src : `data:image/jpeg;base64,${src}`} 
            alt={alt || 'Avatar'} 
            className="avatar-image"
            onError={(e) => {

              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className="avatar-fallback" style={{ display: (src && src.trim()) ? 'none' : 'flex' }}>
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