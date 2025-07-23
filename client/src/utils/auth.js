// utils/auth.js
import axios from 'axios';

const API_BASE_URL = 'https://server-1-vr19.onrender.com/api';

// Класс для управления токенами
class AuthManager {
  constructor() {
    this.setupAxiosInterceptors();
  }

  // Получить токены из localStorage
  getTokens() {
    return {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken')
    };
  }

  // Сохранить токены в localStorage
  setTokens(tokens) {
    if (tokens.accessToken) {
      localStorage.setItem('accessToken', tokens.accessToken);
    }
    if (tokens.refreshToken) {
      localStorage.setItem('refreshToken', tokens.refreshToken);
    }
  }

  // Очистить токены
  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  // Получить информацию о пользователе
  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Сохранить информацию о пользователе
  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  // Проверить, авторизован ли пользователь
  isAuthenticated() {
    const { accessToken } = this.getTokens();
    return !!accessToken;
  }

  // Проверить, истек ли токен
  isTokenExpired(token) {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  }

  // Обновить токены
  async refreshTokens() {
    const { refreshToken } = this.getTokens();
    
    if (!refreshToken || this.isTokenExpired(refreshToken)) {
      throw new Error('Refresh token недействителен');
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken
      });

      const { accessToken, refreshToken: newRefreshToken, user } = response.data;
      
      this.setTokens({ accessToken, refreshToken: newRefreshToken });
      this.setUser(user);
      
      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  // Настройка axios interceptors
  setupAxiosInterceptors() {
    // Добавляем токен к каждому запросу
    axios.interceptors.request.use(
      (config) => {
        const { accessToken } = this.getTokens();
        if (accessToken && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Обрабатываем ошибки авторизации
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const newTokens = await this.refreshTokens();
            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            this.clearTokens();
            window.location.href = '/';
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Логин
  async login(email, password) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });

      const { accessToken, refreshToken, user } = response.data;
      
      this.setTokens({ accessToken, refreshToken });
      this.setUser(user);
      
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(
        error.response?.data?.message || 'Ошибка входа'
      );
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
      
      this.setTokens({ accessToken, refreshToken });
      this.setUser(user);
      
      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(
        error.response?.data?.message || 'Ошибка регистрации'
      );
    }
  }

  // Выход
  async logout() {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`);
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      this.clearTokens();
      window.location.href = '/';
    }
  }

  // Проверить статус авторизации
  async checkAuthStatus() {
    try {
      const response = await axios.get(`${API_BASE_URL}/me`);
      return {
        authenticated: true,
        user: response.data.user
      };
    } catch (error) {
      if (error.response?.status === 401) {
        this.clearTokens();
      }
      return {
        authenticated: false,
        user: null
      };
    }
  }
}

// Создаем единственный экземпляр
const authManager = new AuthManager();

export default authManager;

// Экспортируем отдельные функции для удобства
export const {
  getTokens,
  setTokens,
  clearTokens,
  getUser,
  setUser,
  isAuthenticated,
  login,
  register,
  logout,
  checkAuthStatus,
  refreshTokens
} = authManager;