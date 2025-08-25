// Конфигурация API
const API_CONFIG = {
  // Базовый URL для API
  BASE_URL: process.env.REACT_APP_API_URL || 'https://server-pqqy.onrender.com',
  
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
  }
};

export default API_CONFIG;
