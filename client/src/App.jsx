import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import { PointsProvider } from './context/PointsContext';
import axios from 'axios';

// Настройка axios interceptors для автоматической отправки токенов
const setupAxiosInterceptors = () => {
  // Добавляем токен к каждому запросу
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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
        
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const response = await axios.post('https://server-pqqy.onrender.com/api/auth/refresh', {
              refreshToken: refreshToken
            });
            
            const { accessToken, refreshToken: newRefreshToken } = response.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            
            // Повторяем оригинальный запрос с новым токеном
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // Если refresh не удался, очищаем токены и перенаправляем на логин
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/';
            return Promise.reject(refreshError);
          }
        } else {
          // Нет refresh токена, перенаправляем на логин
          window.location.href = '/';
        }
      }
      
      return Promise.reject(error);
    }
  );
};

function AppRouter() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setupAxiosInterceptors();
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      setIsLoading(false);
      setIsAuthenticated(false);
      navigate('/');
      return;
    }

    try {
      const response = await axios.get('https://server-pqqy.onrender.com/api/me');
      if (response.data.user) {
        setIsAuthenticated(true);
        navigate('/home');
      }
    } catch (error) {
      console.log('Auth check failed:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setIsAuthenticated(false);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '18px'
      }}>
         Проверка авторизации...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/home" element={
        <PointsProvider>
          <HomePage />
        </PointsProvider>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}