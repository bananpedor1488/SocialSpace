// ПРИНУДИТЕЛЬНОЕ ПОЗИЦИОНИРОВАНИЕ ФОРМ ПРЕМИУМА
(function() {
  'use strict';
  
  // Функция для принудительного позиционирования форм
  function forcePremiumFormPosition() {
    const premiumForms = document.querySelectorAll('.premium-form, .gift-premium-form');
    
    premiumForms.forEach(form => {
                    // Принудительно устанавливаем стили
              form.style.position = 'fixed';
              form.style.top = '50vh';
              form.style.left = '50vw';
              form.style.transform = 'translate(-50%, -50%)';
              form.style.zIndex = '999999';
              form.style.pointerEvents = 'auto';

              // Если форма показана, устанавливаем полный размер
              if (form.classList.contains('show')) {
                form.style.transform = 'translate(-50%, -50%) scale(1)';
                form.style.opacity = '1';
              } else {
                form.style.transform = 'translate(-50%, -50%) scale(0.8)';
                form.style.opacity = '0';
              }
    });
  }
  
  // Функция для наблюдения за изменениями в DOM
  function observePremiumForms() {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1 && (node.classList.contains('premium-form') || node.classList.contains('gift-premium-form'))) {
              setTimeout(forcePremiumFormPosition, 10);
            }
          });
        }
      });
    });
    
    // Наблюдаем за изменениями в body
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  // Функция для обработки изменений классов
  function handleClassChanges() {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target;
          if (target.classList.contains('premium-form') || target.classList.contains('gift-premium-form')) {
            setTimeout(forcePremiumFormPosition, 10);
          }
        }
      });
    });
    
    // Наблюдаем за изменениями классов во всех элементах
    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ['class']
    });
  }
  
  // Функция для обработки изменения размера окна
  function handleResize() {
    setTimeout(forcePremiumFormPosition, 100);
  }
  
  // Инициализация
  function init() {
    // Применяем позиционирование сразу
    forcePremiumFormPosition();
    
    // Начинаем наблюдение за изменениями
    observePremiumForms();
    handleClassChanges();
    
    // Обрабатываем изменение размера окна
    window.addEventListener('resize', handleResize);
    
    // Периодически проверяем позиционирование
    setInterval(forcePremiumFormPosition, 1000);
    
    // Применяем позиционирование после загрузки страницы
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', forcePremiumFormPosition);
    } else {
      forcePremiumFormPosition();
    }
  }
  
  // Запускаем инициализацию
  init();
  
  // Экспортируем функцию для использования в React
  window.forcePremiumFormPosition = forcePremiumFormPosition;
})(); 