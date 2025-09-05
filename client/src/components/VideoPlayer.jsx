import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, RotateCcw, Settings } from 'lucide-react';
import './VideoPlayer.css';

const VideoPlayer = ({ 
  src, 
  poster, 
  title,
  className = '',
  onClose,
  isFullscreen = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreenMode, setIsFullscreenMode] = useState(isFullscreen);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Обработка клавиатуры
  useEffect(() => {
    if (!isFullscreenMode) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'Escape':
          if (isFullscreenMode) {
            exitFullscreen();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          changeVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeVolume(-0.1);
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenMode, isPlaying, volume, isMuted]);

  // Предотвращаем скролл страницы в полноэкранном режиме
  useEffect(() => {
    if (isFullscreenMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreenMode]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  };

  const handleSeek = (e) => {
    if (videoRef.current && progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const seek = (seconds) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const changeVolume = (delta) => {
    const newVolume = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreenMode) {
      setIsFullscreenMode(true);
    } else {
      setIsFullscreenMode(false);
      if (onClose) {
        onClose();
      }
    }
  };

  const exitFullscreen = () => {
    setIsFullscreenMode(false);
    if (onClose) {
      onClose();
    }
  };

  const changePlaybackRate = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSettings(false);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 1000);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && isFullscreenMode) {
      exitFullscreen();
    }
  };

  const videoElement = (
    <div className={`video-player-container ${isFullscreenMode ? 'fullscreen' : ''} ${className}`}>
      <div 
        className="video-wrapper"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleBackdropClick}
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="video-element"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onVolumeChange={(e) => {
            setVolume(e.target.volume);
            setIsMuted(e.target.muted);
          }}
          onClick={togglePlay}
        />

        {/* Индикатор загрузки */}
        {isLoading && (
          <div className="video-loading">
            <div className="loading-spinner"></div>
            <p>Загрузка видео...</p>
          </div>
        )}

        {/* Элементы управления */}
        <div className={`video-controls ${showControls ? 'visible' : 'hidden'}`}>
          {/* Прогресс-бар */}
          <div className="progress-container">
            <div 
              ref={progressRef}
              className="progress-bar"
              onClick={handleSeek}
            >
              <div 
                className="progress-filled"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              <div 
                className="progress-handle"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          </div>

          {/* Основные контролы */}
          <div className="controls-row">
            <div className="controls-left">
              <button 
                className="control-btn play-btn"
                onClick={togglePlay}
                title={isPlaying ? 'Пауза (Пробел)' : 'Воспроизведение (Пробел)'}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>

              <div className="time-display">
                <span>{formatTime(currentTime)}</span>
                <span>/</span>
                <span>{formatTime(duration)}</span>
              </div>

              <button 
                className="control-btn volume-btn"
                onClick={toggleMute}
                title={isMuted ? 'Включить звук (M)' : 'Выключить звук (M)'}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>

              <div className="volume-slider">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const newVolume = parseFloat(e.target.value);
                    setVolume(newVolume);
                    setIsMuted(newVolume === 0);
                    if (videoRef.current) {
                      videoRef.current.volume = newVolume;
                    }
                  }}
                  className="volume-range"
                />
              </div>
            </div>

            <div className="controls-right">
              <button 
                className="control-btn settings-btn"
                onClick={() => setShowSettings(!showSettings)}
                title="Настройки"
              >
                <Settings size={18} />
              </button>

              <button 
                className="control-btn fullscreen-btn"
                onClick={toggleFullscreen}
                title={isFullscreenMode ? 'Выйти (F)' : 'Полный экран (F)'}
              >
                {isFullscreenMode ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>

              {isFullscreenMode && onClose && (
                <button 
                  className="control-btn close-btn"
                  onClick={exitFullscreen}
                  title="Закрыть (Esc)"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Настройки скорости воспроизведения */}
          {showSettings && (
            <div className="settings-panel">
              <div className="settings-title">Скорость воспроизведения</div>
              <div className="playback-rates">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                  <button
                    key={rate}
                    className={`rate-btn ${playbackRate === rate ? 'active' : ''}`}
                    onClick={() => changePlaybackRate(rate)}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Заголовок видео */}
        {title && (
          <div className="video-title">
            {title}
          </div>
        )}
      </div>
    </div>
  );

  if (isFullscreenMode) {
    return (
      <div className="video-fullscreen-overlay" onClick={handleBackdropClick}>
        {videoElement}
      </div>
    );
  }

  return videoElement;
};

export default VideoPlayer;
