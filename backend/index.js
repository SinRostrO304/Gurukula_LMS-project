// backend/index.js
require('dotenv').config();

const express     = require('express');
const path        = require('path');
const cors        = require('cors');
const helmet      = require('helmet');
const authRoutes  = require('./routes/auth');
const userRoutes  = require('./routes/users');
const classRoutes = require('./routes/classes');
const uploadsRouter = require('./routes/uploads')
const asyncHandler = require('express-async-handler');
const authenticateToken= require('./middleware/auth');
const app = express();

// 1) Security & parsing
app.use(
  helmet({
    crossOriginResourcePolicy: false,  // turn off the default
    contentSecurityPolicy:      false, // optional: if CSP conflicts
  })
);
app.use(
  helmet.crossOriginResourcePolicy({
    policy: 'cross-origin',
  })
);
app.use(express.json());

// 2) Global CORS (applies to static files & APIs)
app.use(
  cors({
    origin:      'https://gurukulalms.vercel.app',  // your React app’s origin
    credentials: true,
  })
);

// 4) Mount API routes (CORS is already in effect)
app.use('/api',       authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api', authenticateToken, uploadsRouter);

// 5) Global error handler
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});