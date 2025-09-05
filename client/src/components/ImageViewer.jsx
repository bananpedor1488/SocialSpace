    import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Download, Maximize2 } from 'lucide-react';
import './ImageViewer.css';

const ImageViewer = ({ 
  images = [], 
  currentIndex = 0, 
  isOpen = false, 
  onClose 
}) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(currentIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  // Обновляем индекс при изменении пропса
  useEffect(() => {
    setCurrentImgIndex(currentIndex);
    setZoom(1);
    setRotation(0);
    setImagePosition({ x: 0, y: 0 });
    setIsLoading(true);
    setImageError(false);
  }, [currentIndex, isOpen]);

  // Обработка клавиатуры
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (images.length > 1) {
            setCurrentImgIndex(prev => prev > 0 ? prev - 1 : images.length - 1);
          }
          break;
        case 'ArrowRight':
          if (images.length > 1) {
            setCurrentImgIndex(prev => prev < images.length - 1 ? prev + 1 : 0);
          }
          break;
        case '+':
        case '=':
          setZoom(prev => Math.min(prev * 1.2, 5));
          break;
        case '-':
          setZoom(prev => Math.max(prev / 1.2, 0.1));
          break;
        case 'r':
        case 'R':
          setRotation(prev => (prev + 90) % 360);
          break;
        case '0':
          setZoom(1);
          setImagePosition({ x: 0, y: 0 });
          setRotation(0);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length, onClose]);

  // Предотвращаем скролл страницы
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const currentImage = images[currentImgIndex];

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setImagePosition({ x: 0, y: 0 });
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    if (currentImage?.url) {
      const link = document.createElement('a');
      link.href = currentImage.url;
      link.download = currentImage.originalName || 'image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(5, prev * delta)));
  };

  const goToPrevious = () => {
    if (images.length > 1) {
      setCurrentImgIndex(prev => prev > 0 ? prev - 1 : images.length - 1);
    }
  };

  const goToNext = () => {
    if (images.length > 1) {
      setCurrentImgIndex(prev => prev < images.length - 1 ? prev + 1 : 0);
    }
  };

  const handleBackdropClick = (e) => {
    // Закрываем при клике по любому месту за пределами картинки
    if (e.target === e.currentTarget || 
        e.target.classList.contains('image-viewer-overlay') ||
        e.target.classList.contains('image-viewer-container') ||
        e.target.classList.contains('image-viewer-content') ||
        e.target.classList.contains('image-container')) {
      onClose();
    }
  };

  if (!isOpen || !currentImage) return null;

  return (
    <div 
      className="image-viewer-overlay" 
      onClick={handleBackdropClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      <div className="image-viewer-container" ref={containerRef}>
        {/* Заголовок */}
        <div className="image-viewer-header" onClick={(e) => e.stopPropagation()}>
          <div className="image-info">
            <span className="image-name">{currentImage.originalName}</span>
            {images.length > 1 && (
              <span className="image-counter">
                {currentImgIndex + 1} из {images.length}
              </span>
            )}
          </div>
          
          <div className="image-controls">
            <button 
              className="control-btn" 
              onClick={handleZoomOut}
              title="Уменьшить (колесико мыши)"
            >
              <ZoomOut size={20} />
            </button>
            
            <button 
              className="control-btn" 
              onClick={handleZoomIn}
              title="Увеличить (колесико мыши)"
            >
              <ZoomIn size={20} />
            </button>
            
            <button 
              className="control-btn" 
              onClick={handleRotate}
              title="Повернуть (R)"
            >
              <RotateCw size={20} />
            </button>
            
            <button 
              className="control-btn" 
              onClick={handleResetZoom}
              title="Сбросить (0)"
            >
              <Maximize2 size={20} />
            </button>
            
            <button 
              className="control-btn" 
              onClick={handleDownload}
              title="Скачать"
            >
              <Download size={20} />
            </button>
            
            <button 
              className="control-btn close-btn" 
              onClick={onClose}
              title="Закрыть (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Основная область изображения */}
        <div className="image-viewer-content">
          {/* Навигация влево */}
          {images.length > 1 && (
            <button 
              className="nav-btn nav-left" 
              onClick={goToPrevious}
              title="Предыдущее изображение (←)"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Изображение */}
          <div className="image-container">
            {isLoading && (
              <div className="image-loading">
                <div className="loading-spinner"></div>
                <p>Загрузка изображения...</p>
              </div>
            )}
            
            {imageError ? (
              <div className="image-error">
                <div className="error-icon">📷</div>
                <p>Ошибка загрузки изображения</p>
                <p className="error-filename">{currentImage.originalName}</p>
              </div>
            ) : (
              <img
                ref={imageRef}
                src={currentImage.url}
                alt={currentImage.originalName}
                className={`image-viewer-img ${isDragging ? 'dragging' : ''}`}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                  cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
                }}
                onLoad={handleImageLoad}
                onError={handleImageError}
                onMouseDown={handleMouseDown}
                onClick={(e) => e.stopPropagation()}
                draggable={false}
              />
            )}
          </div>

          {/* Навигация вправо */}
          {images.length > 1 && (
            <button 
              className="nav-btn nav-right" 
              onClick={goToNext}
              title="Следующее изображение (→)"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>

        {/* Миниатюры */}
        {images.length > 1 && (
          <div className="image-thumbnails" onClick={(e) => e.stopPropagation()}>
            {images.map((image, index) => (
              <div
                key={index}
                className={`thumbnail ${index === currentImgIndex ? 'active' : ''}`}
                onClick={() => setCurrentImgIndex(index)}
              >
                <img 
                  src={image.url} 
                  alt={image.originalName}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="thumbnail-fallback" style={{ display: 'none' }}>
                  📷
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default ImageViewer;
