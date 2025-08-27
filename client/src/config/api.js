// Конфигурация API
const API_CONFIG = {
  // Базовый URL для API
  BASE_URL: process.env.REACT_APP_API_URL || 'https://server-pqqy.onrender.com',
  
  // Режим обслуживания - установите true для включения страницы "сайт закрыт"
  MAINTENANCE_MODE: process.env.REACT_APP_MAINTENANCE_MODE === 'true',
  
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
    return API_CONFIG.MAINTENANCE_MODE;
  }
};

export default API_CONFIG;
