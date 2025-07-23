import axios from 'axios';

const API_BASE_URL = 'https://server-1-vr19.onrender.com/api';

class AuthService {
  constructor() {
    this.setupInterceptors();
  }

  // Сохранение токенов в localStorage
  saveTokens(accessToken, refreshToken, user) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
  }

  // Получение токенов из localStorage
  getTokens() {
    return {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
      user: JSON.parse(localStorage.getItem('user') || 'null')
    };
  }

  // Очистка токенов
  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  // Проверка авторизации
  isAuthenticated() {
    const { accessToken } = this.getTokens();
    return !!accessToken;
  }

  // Получение текущего пользователя
  getCurrentUser() {
    const { user } = this.getTokens();
    return user;
  }

  // Обновление токенов
  async refreshTokens() {
    try {
      const { refreshToken } = this.getTokens();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken
      });

      const { accessToken, refreshToken: newRefreshToken, user } = response.data;
      this.saveTokens(accessToken, newRefreshToken, user);

      return { accessToken, refreshToken: newRefreshToken, user };
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      throw error;
    }
  }

  // Настройка interceptors для axios
  setupInterceptors() {
    // Request interceptor - добавляем токен к каждому запросу
    axios.interceptors.request.use(
      (config) => {
        const { accessToken } = this.getTokens();
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - обрабатываем истекшие токены
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const tokens = await this.refreshTokens();
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // Refresh не удался - редиректим на логин
            this.clearTokens();
            window.location.href = '/';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Вход в систему
  async login(email, password) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });

      const { accessToken, refreshToken, user } = response.data;
      this.saveTokens(accessToken, refreshToken, user);

      return { accessToken, refreshToken, user };
    } catch (error) {
      throw error;
    }
  }

  // Регистрация
  async register(username, email, password) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        username,
        email,
        password
      });

      const { accessToken, refreshToken, user } = response.data;
      this.saveTokens(accessToken, refreshToken, user);

      return { accessToken, refreshToken, user };
    } catch (error) {
      throw error;
    }
  }

  // Выход из системы
  async logout() {
    try {
      // Можно отправить запрос на сервер для инвалидации токена
      await axios.post(`${API_BASE_URL}/auth/logout`);
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      this.clearTokens();
    }
  }

  // Проверка статуса авторизации на сервере
  async checkAuthStatus() {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/status`);
      return response.data;
    } catch (error) {
      console.error('Auth status check failed:', error);
      return { authenticated: false };
    }
  }
}

// Создаем единственный экземпляр сервиса
const authService = new AuthService();

export default authService;

// Экспортируем отдельные функции для удобства
export const {
  saveTokens,
  getTokens,
  clearTokens,
  isAuthenticated,
  getCurrentUser,
  refreshTokens,
  login,
  register,
  logout,
  checkAuthStatus
} = authService;