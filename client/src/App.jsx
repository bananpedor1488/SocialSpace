import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import axios from 'axios';

function AppRouter() {
  const navigate = useNavigate();

  useEffect(() => {
    
    axios.get('https://2a409129-fb78-439c-8b07-c74ea3c80ade-00-26f7qu9vn3b84.riker.replit.dev/api/me', { withCredentials: true })
      .then(res => {
        if (res.data.user) {
          navigate('/home');
        }
      })
      .catch(() => navigate('/'));
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/home" element={<HomePage />} />
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
