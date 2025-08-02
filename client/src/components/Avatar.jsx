import React, { useState, useEffect, useRef } from 'react';
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
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const imgRef = useRef(null);

  const sizeClasses = {
    small: 'avatar-small',
    medium: 'avatar-medium', 
    large: 'avatar-large',
    xlarge: 'avatar-xlarge'
  };

  useEffect(() => {
    // Очистка предыдущего изображения
    setImageError(false);
    

    
    if (src && src.trim()) {
      // Оптимизация для Android: создаем новый URL для изображения
      if (src.startsWith('data:')) {
        setImageSrc(src);
      } else {
        // Для base64 строк добавляем префикс
        setImageSrc(`data:image/jpeg;base64,${src}`);
      }
    } else {
      setImageSrc(null);
    }

    // Очистка при размонтировании
    return () => {
      // Освобождаем память от изображения
      if (imgRef.current) {
        imgRef.current.src = '';
      }
      setImageSrc(null);
    };
  }, [src]);

  const handleImageError = () => {
    setImageError(true);
    // Очищаем src для освобождения памяти
    if (imgRef.current) {
      imgRef.current.src = '';
    }
  };

  return (
    <div 
      className={`avatar-container ${sizeClasses[size]} ${className} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      <div className="avatar-wrapper">
        {imageSrc && !imageError ? (
          <img 
            ref={imgRef}
            src={imageSrc} 
            alt={alt || 'Avatar'} 
            className="avatar-image"
            onError={handleImageError}
            loading="lazy"
            decoding="async"
          />
        ) : null}
        <div className="avatar-fallback" style={{ display: (!imageSrc || imageError) ? 'flex' : 'none' }}>
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