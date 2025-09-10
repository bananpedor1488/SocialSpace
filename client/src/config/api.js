// Конфигурация API
const API_CONFIG = {
  // Базовый URL для API
  BASE_URL: process.env.REACT_APP_API_URL || 'https://server-1-ewdd.onrender.com',
  
  // Режим обслуживания - установите true для включения страницы "сайт закрыт"
  MAINTENANCE_MODE: false, // Временно включен для тестирования
  
  // Полный URL для API endpoints
  getApiUrl: (endpoint) => {
    const baseUrl = API_CONFIG.BASE_URL;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${cleanEndpoint}`;
  },
  
  // Получить относительный URL для локальной разработки
  getRelativeUrl: (endpoint) => {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return cleanEndpoint;
  },
  
  // Проверить, включен ли режим обслуживания
  isMaintenanceMode: () => {
    console.log('MAINTENANCE_MODE значение:', API_CONFIG.MAINTENANCE_MODE);
    return API_CONFIG.MAINTENANCE_MODE;
  }
};

export default API_CONFIG;
