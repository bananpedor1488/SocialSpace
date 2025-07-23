const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Middleware для логирования запросов
router.use((req, res, next) => {
  console.log(`AUTH JWT: ${req.method} ${req.path}`);
  console.log('Headers:', {
    authorization: req.get('Authorization'),
    contentType: req.get('Content-Type'),
    origin: req.get('Origin')
  });
  console.log('Body:', req.body);
  next();
});

// Публичные роуты (не требуют авторизации)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);

// Защищенные роуты (требуют JWT токен)
router.get('/me', authController.authenticateToken, authController.getCurrentUser);
router.post('/logout', authController.authenticateToken, authController.logout);

// Health check для auth
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Auth Service',
    type: 'JWT',
    timestamp: new Date().toISOString(),
    endpoints: {
      public: [
        'POST /api/auth/login',
        'POST /api/auth/register',
        'POST /api/auth/refresh'
      ],
      protected: [
        'GET /api/auth/me (requires Bearer token)',
        'POST /api/auth/logout (requires Bearer token)'
      ]
    }
  });
});

module.exports = router;