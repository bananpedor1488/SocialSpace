// Утилиты для работы с временем и синхронизацией с сервером

let serverTimeOffset = 0; // разница между сервером и клиентом в миллисекундах

// Функция для синхронизации времени с сервером
export const syncServerTime = async () => {
  try {
    const startTime = Date.now();
    const response = await fetch('https://server-pqqy.onrender.com/api/time');
    const endTime = Date.now();
    const networkDelay = (endTime - startTime) / 2;
    const serverTime = new Date((await response.json()).timestamp).getTime();
    const clientTime = endTime - networkDelay;
    const offset = serverTime - clientTime;
    serverTimeOffset = offset;
    console.log('Time synchronized. Server offset:', offset, 'ms');
    return offset;
  } catch (error) {
    console.error('Failed to sync server time:', error);
    return 0;
  }
};

// Функция для получения серверного времени
export const getServerTime = () => {
  return new Date(Date.now() + serverTimeOffset);
};

// Функция для форматирования времени с учетом часового пояса
export const formatTimeWithTimezone = (timestamp, options = {}) => {
  // Проверяем, что timestamp валидный
  if (!timestamp || isNaN(new Date(timestamp).getTime())) {
    console.warn('Invalid timestamp:', timestamp);
    return 'Неверная дата';
  }
  
  // Используем timestamp как есть, но применяем часовой пояс клиента
  return new Date(timestamp).toLocaleString('ru-RU', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    ...options
  });
};

// Функция для форматирования даты
export const formatDate = (timestamp, options = {}) => {
  return formatTimeWithTimezone(timestamp, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options
  });
};

// Функция для форматирования времени
export const formatTime = (timestamp, options = {}) => {
  return formatTimeWithTimezone(timestamp, {
    hour: '2-digit',
    minute: '2-digit',
    ...options
  });
};

// Функция для форматирования даты и времени
export const formatDateTime = (timestamp, options = {}) => {
  return formatTimeWithTimezone(timestamp, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  });
};

// Функция для получения относительного времени (например, "5 мин назад")
export const getRelativeTime = (timestamp) => {
  const now = Date.now() + serverTimeOffset;
  const time = new Date(timestamp).getTime();
  const diffInSeconds = Math.floor((now - time) / 1000);
  
  if (diffInSeconds < 60) {
    return 'только что';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} мин назад`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ч назад`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} дн назад`;
  }
};

// Функция для форматирования суммы (для совместимости)
export const formatAmount = (amount) => {
  return new Intl.NumberFormat('ru-RU').format(amount);
};

// Инициализация синхронизации времени
export const initializeTimeSync = async () => {
  await syncServerTime();
  // Повторная синхронизация каждые 5 минут
  setInterval(syncServerTime, 5 * 60 * 1000);
};
