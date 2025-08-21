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

// Компонент для анимированных огней
const AnimatedLights = () => {
  useEffect(() => {
    const createLight = () => {
      const light = document.createElement('div');
      light.style.position = 'fixed';
      light.style.width = Math.random() * 100 + 50 + 'px';
      light.style.height = light.style.width;
      light.style.borderRadius = '50%';
      light.style.background = `radial-gradient(circle, rgba(${Math.random() * 100 + 147}, ${Math.random() * 50 + 51}, ${Math.random() * 100 + 134}, ${Math.random() * 0.3 + 0.2}), transparent)`;
      light.style.pointerEvents = 'none';
      light.style.zIndex = '1';
      light.style.left = Math.random() * window.innerWidth + 'px';
      light.style.top = Math.random() * window.innerHeight + 'px';
      light.style.transition = 'all 8s ease-in-out';
      
      document.body.appendChild(light);
      
      // Анимация движения
      const animate = () => {
        const newX = Math.random() * window.innerWidth;
        const newY = Math.random() * window.innerHeight;
        const newScale = Math.random() * 0.5 + 0.5;
        
        light.style.transform = `translate(${newX - parseFloat(light.style.left)}px, ${newY - parseFloat(light.style.top)}px) scale(${newScale})`;
        light.style.left = newX + 'px';
        light.style.top = newY + 'px';
      };
      
      const interval = setInterval(animate, 8000);
      
      // Удаляем свет через некоторое время
      setTimeout(() => {
        clearInterval(interval);
        if (light.parentNode) {
          light.parentNode.removeChild(light);
        }
      }, 30000);
    };
    
    // Создаем огни каждые 3 секунды
    const lightInterval = setInterval(createLight, 3000);
    
    // Создаем начальные огни
    for (let i = 0; i < 5; i++) {
      setTimeout(createLight, i * 500);
    }
    
    return () => {
      clearInterval(lightInterval);
      // Удаляем все созданные огни при размонтировании
      const lights = document.querySelectorAll('div[style*="position: fixed"][style*="border-radius: 50%"]');
      lights.forEach(light => {
        if (light.parentNode) {
          light.parentNode.removeChild(light);
        }
      });
    };
  }, []);
  
  return null;
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
        background: '#000',
        color: 'white',
        fontSize: '18px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <AnimatedLights />
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          padding: '30px 40px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          position: 'relative',
          zIndex: 2
        }}>
          Проверка авторизации...
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatedLights />
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/home" element={
          <PointsProvider>
            <HomePage />
          </PointsProvider>
        } />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}