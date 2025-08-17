// Утилиты для улучшения мобильного опыта сообщений

// Установка правильной высоты viewport для мобильных браузеров
export const setMobileViewportHeight = () => {
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  setVH();
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', setVH);

  return () => {
    window.removeEventListener('resize', setVH);
    window.removeEventListener('orientationchange', setVH);
  };
};

// Автоскролл к последнему сообщению
export const scrollToBottom = (messagesAreaRef, smooth = true) => {
  if (messagesAreaRef && messagesAreaRef.current) {
    const messagesArea = messagesAreaRef.current;
    const scrollOptions = {
      top: messagesArea.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    };
    
    messagesArea.scrollTo(scrollOptions);
  }
};

// Предотвращение зума на мобильных устройствах при фокусе на input
export const preventZoomOnFocus = () => {
  const inputs = document.querySelectorAll('.message-input');
  
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      // Устанавливаем минимальный размер шрифта для предотвращения зума
      input.style.fontSize = '16px';
    });
    
    input.addEventListener('blur', () => {
      // Возвращаем исходный размер шрифта
      input.style.fontSize = '';
    });
  });
};

// Обработка виртуальной клавиатуры на мобильных
export const handleVirtualKeyboard = (messagesContainerRef) => {
  let initialViewportHeight = window.innerHeight;
  
  const handleResize = () => {
    const currentHeight = window.innerHeight;
    const heightDifference = initialViewportHeight - currentHeight;
    
    // Если высота уменьшилась более чем на 150px, вероятно открылась клавиатура
    if (heightDifference > 150 && messagesContainerRef.current) {
      // Прокручиваем к последнему сообщению
      setTimeout(() => {
        scrollToBottom(messagesContainerRef, false);
      }, 300);
    }
  };
  
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
};

// Улучшенный автоскролл с учетом новых сообщений
export const autoScrollToNewMessage = (messagesAreaRef, messages, prevMessagesLength) => {
  if (!messagesAreaRef.current) return;
  
  const messagesArea = messagesAreaRef.current;
  const isNearBottom = messagesArea.scrollTop + messagesArea.clientHeight >= messagesArea.scrollHeight - 100;
  
  // Автоскролл только если пользователь находится внизу или это новое сообщение
  if (isNearBottom || messages.length > prevMessagesLength) {
    setTimeout(() => {
      scrollToBottom(messagesAreaRef, true);
    }, 100);
  }
};

// Обработка свайпов для мобильных устройств
export const setupSwipeGestures = (onSwipeLeft, onSwipeRight) => {
  let startX = 0;
  let startY = 0;
  let isSwiping = false;
  
  const handleTouchStart = (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isSwiping = true;
  };
  
  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = startX - currentX;
    const diffY = startY - currentY;
    
    // Проверяем, что это горизонтальный свайп
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      e.preventDefault();
    }
  };
  
  const handleTouchEnd = (e) => {
    if (!isSwiping) return;
    
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = startX - endX;
    const diffY = startY - endY;
    
    // Минимальное расстояние для свайпа
    const minSwipeDistance = 50;
    
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipeDistance) {
      if (diffX > 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (diffX < 0 && onSwipeRight) {
        onSwipeRight();
      }
    }
    
    isSwiping = false;
  };
  
  document.addEventListener('touchstart', handleTouchStart, { passive: false });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { passive: false });
  
  return () => {
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  };
};

// Оптимизация производительности для длинных списков сообщений
export const optimizeMessageList = (messagesAreaRef) => {
  if (!messagesAreaRef.current) return;
  
  const messagesArea = messagesAreaRef.current;
  
  // Виртуализация для очень длинных списков
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
      } else {
        entry.target.style.opacity = '0.3';
      }
    });
  }, {
    root: messagesArea,
    rootMargin: '100px',
    threshold: 0.1
  });
  
  const messages = messagesArea.querySelectorAll('.message');
  messages.forEach(message => {
    observer.observe(message);
  });
  
  return () => {
    observer.disconnect();
  };
};

// Обработка состояния онлайн/оффлайн
export const handleOnlineStatus = (onOnline, onOffline) => {
  const handleOnline = () => {
    if (onOnline) onOnline();
  };
  
  const handleOffline = () => {
    if (onOffline) onOffline();
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// Сохранение позиции скролла при переключении чатов
export const saveScrollPosition = (chatId, messagesAreaRef) => {
  if (!messagesAreaRef.current) return;
  
  const messagesArea = messagesAreaRef.current;
  const scrollPosition = messagesArea.scrollTop;
  
  sessionStorage.setItem(`chat-scroll-${chatId}`, scrollPosition.toString());
};

export const restoreScrollPosition = (chatId, messagesAreaRef) => {
  if (!messagesAreaRef.current) return;
  
  const savedPosition = sessionStorage.getItem(`chat-scroll-${chatId}`);
  if (savedPosition) {
    const messagesArea = messagesAreaRef.current;
    messagesArea.scrollTop = parseInt(savedPosition);
  }
};

// Очистка сохраненных позиций скролла
export const clearScrollPositions = () => {
  const keys = Object.keys(sessionStorage);
  keys.forEach(key => {
    if (key.startsWith('chat-scroll-')) {
      sessionStorage.removeItem(key);
    }
  });
};
