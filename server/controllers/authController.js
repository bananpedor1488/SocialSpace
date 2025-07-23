const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Функция для генерации JWT токенов
const generateTokens = (user) => {
  const payload = {
    id: user._id,
    username: user.username
  };

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Регистрация пользователя
exports.register = async (req, res) => {
  try {
    console.log('Registration attempt:', { username: req.body.username, email: req.body.email });
    
    const { username, email, password } = req.body;
    
    // Валидация входных данных
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Проверяем существующих пользователей
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email ? 'Email already exists' : 'Username already exists'
      });
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Создаем пользователя
    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });

    await newUser.save();
    
    // Генерируем токены
    const tokens = generateTokens(newUser);
    
    console.log('User registered successfully:', { id: newUser._id, username: newUser.username });
    
    res.status(201).json({
      message: 'User created successfully',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Registration failed', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Вход пользователя
exports.login = async (req, res) => {
  try {
    console.log('Login attempt for:', req.body.email);
    
    const { email, password } = req.body;
    
    // Валидация входных данных
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Поиск пользователя по email или username
    const user = await User.findOne({
      $or: [{ email }, { username: email }]
    });

    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: 'User not found' });
    }

    // Проверка пароля
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Генерируем токены
    const tokens = generateTokens(user);
    
    console.log('User logged in successfully:', { id: user._id, username: user.username });
    
    res.status(200).json({
      message: 'Login successful',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Login failed', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Обновление токенов
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Верифицируем refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret');
    
    // Проверяем, существует ли пользователь
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Генерируем новые токены
    const tokens = generateTokens(user);
    
    console.log('Tokens refreshed for user:', user.username);
    
    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Refresh token error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Refresh token expired' });
    }
    
    res.status(500).json({ message: 'Token refresh failed' });
  }
};

// Получение текущего пользователя (защищенный роут)
exports.getCurrentUser = async (req, res) => {
  try {
    console.log('Get current user request, user from token:', req.user);
    
    // req.user устанавливается middleware authenticateToken
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      },
      tokenValid: true
    });
    
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Failed to get user data' });
  }
};

// Logout (опционально - просто для логирования)
exports.logout = async (req, res) => {
  try {
    console.log('Logout request from user:', req.user?.username || 'unknown');
    
    // В JWT архитектуре logout происходит на клиенте (удаление токенов)
    // Здесь можно добавить логику для blacklist токенов если нужно
    
    res.json({ 
      message: 'Logged out successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
};

// Middleware для проверки JWT токенов
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('Auth middleware - Token present:', !!token);

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, user) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      
      return res.status(403).json({ message: 'Invalid token' });
    }

    console.log('Token verified for user:', user.username);
    req.user = user;
    next();
  });
};