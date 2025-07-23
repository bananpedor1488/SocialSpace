const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const MongoStore = require('connect-mongo');

dotenv.config();
const app = express();

app.use(cors({
  origin: 'https://2a409129-fb78-439c-8b07-c74ea3c80ade-00-26f7qu9vn3b84.riker.replit.dev', // Укажите конкретный домен
  credentials: true
}));

app.use(express.json());

// Подключение к MongoDB (перенесем выше сессий)
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => console.error('MongoDB connection error:', err));

app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    httpOnly: true,
    sameSite: 'none', // Изменено для cross-origin
    secure: true // Включено для HTTPS
  }
}));

const postRoutes = require('./routes/posts');
app.use('/api/posts', postRoutes);
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);
const followRoutes = require('./routes/follow');
app.use('/api/follow', followRoutes);
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

app.get('/api/me', (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ message: 'Not logged in' });
  }
});

// Правильный экспорт для Vercel
module.exports = app;