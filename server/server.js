const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const MongoStore = require('connect-mongo');

dotenv.config();
const app = express();

app.use(cors({
  origin: 'http://26.4.118.244:3000', // Замените на реальный IP вашего клиента
  credentials: true
}));


app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false
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

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
 app.listen(5000, '0.0.0.0', () => {
  console.log('Server running on port 5000');
});

}).catch(err => console.error(err));
