import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // JWT утилиты
  const getTokens = () => {
    return {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken')
    };
  };

  const setTokens = (accessToken, refreshToken) => {
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  };

  const clearTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  const isAuthenticated = () => {
    const { accessToken } = getTokens();
    return !!accessToken;
  };

  // Функция для декодирования JWT токена (проверка на истечение)
  const isTokenExpired = (token) => {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  };

  // Функция обновления токена
  const refreshAccessToken = async () => {
    const { refreshToken } = getTokens();
    
    if (!refreshToken || isTokenExpired(refreshToken)) {
      throw new Error('Refresh token expired');
    }

    try {
      const response = await axios.post('https://server-u9ji.onrender.com/api/auth/refresh', {
        refreshToken: refreshToken
      });
      
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      setTokens(accessToken, newRefreshToken || refreshToken);
      
      return accessToken;
    } catch (error) {
      clearTokens();
      throw error;
    }
  };

  // Получаем текущего пользователя при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        navigate('/');
        return;
      }

      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }

        const res = await axios.get('https://server-u9ji.onrender.com/api/me');
        console.log('Current user data:', res.data.user);
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      } catch (error) {
        console.error('Auth check failed:', error);
        clearTokens();
        navigate('/');
      }
    };

    checkAuth();
  }, [navigate]);

  // Настройка axios interceptors для JWT
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      async (config) => {
        const publicEndpoints = ['/auth/login', '/auth/register', '/auth/refresh'];
        const isPublicEndpoint = publicEndpoints.some(endpoint => 
          config.url?.includes(endpoint)
        );

        if (!isPublicEndpoint) {
          let { accessToken } = getTokens();
          
          if (accessToken && isTokenExpired(accessToken)) {
            try {
              accessToken = await refreshAccessToken();
            } catch (error) {
              clearTokens();
              navigate('/');
              return Promise.reject(error);
            }
          }
          
          if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
          }
        }
        
        delete config.withCredentials;
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const newAccessToken = await refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            clearTokens();
            navigate('/');
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [navigate]);

  const logout = async () => {
    try {
      const { refreshToken } = getTokens();
      await axios.post('https://server-u9ji.onrender.com/api/auth/logout', {
        refreshToken
      });
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      clearTokens();
      navigate('/');
    }
  };

  return {
    user,
    setUser,
    logout,
    isAuthenticated,
    getTokens,
    setTokens,
    clearTokens
  };
};