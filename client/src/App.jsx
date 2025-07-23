import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';

import axios from 'axios';

function AppRouter() {
  const navigate = useNavigate();

  useEffect(() => {
    
    axios.get('https://server-1-vr19.onrender.com/api/me', { withCredentials: true })
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
