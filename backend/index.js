// backend/index.js
// Force Express’s router to use your top-level path-to-regexp
const Module = require('module');
const origLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === 'router/node_modules/path-to-regexp') {
    // Redirect nested requires back to your pinned version
    return origLoad('path-to-regexp', parent, isMain);
  }
  return origLoad(request, parent, isMain);
};

const serverless = require('serverless-http');

// ─── LOG EVERY PATTERN THAT PATH-TO-REGEXP SEES ───
const p2r = require('path-to-regexp');
const original = p2r;
require.cache[require.resolve('path-to-regexp')].exports = function (...args) {
  console.log('📦 Compiling route pattern:', args[0]);
  return original(...args);
};

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
// const authRoutes = require('./routes/auth');
// const userRoutes = require('./routes/users');
// const classRoutes = require('./routes/classes');
// const uploadsRouter = require('./routes/uploads');
const authenticateToken = require('./middleware/auth');

let authRoutes, userRoutes, classRoutes, uploadsRouter;

try {
  authRoutes = require('./routes/auth');
  console.log('✅ authRoutes loaded');
} catch (err) {
  console.error('💥 authRoutes failed to load:', err);
  throw err;
}

try {
  userRoutes = require('./routes/users');
  console.log('✅ userRoutes loaded');
} catch (err) {
  console.error('💥 userRoutes failed to load:', err);
  throw err;
}

try {
  classRoutes = require('./routes/classes');
  console.log('✅ classRoutes loaded');
} catch (err) {
  console.error('💥 classRoutes failed to load:', err);
  throw err;
}

try {
  uploadsRouter = require('./routes/uploads');
  console.log('✅ uploadsRouter loaded');
} catch (err) {
  console.error('💥 uploadsRouter failed to load:', err);
  throw err;
}

const app = express();

// health-check: make sure your function starts up and sees APP_BASE_URL
app.get('/api/ping', (req, res) => {
  console.log('💓 PING! APP_BASE_URL=', process.env.APP_BASE_URL);
  res.json({ ok: true });
});


// 1) CORS (must come before any routes)
const FRONTEND = process.env.APP_BASE_URL || 'https://gurukulalms.vercel.app';
const corsOptions = {
  origin:         FRONTEND,
  credentials:    true,
  methods:        ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
};

// Answer all preflight requests
app.options('*', cors(corsOptions));
// Apply CORS to all requests
app.use(cors(corsOptions));

// 2) Security & parsing
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy:      false,
  })
);
app.use(
  helmet.crossOriginResourcePolicy({ policy: 'cross-origin' })
);
app.use(helmet.crossOriginOpenerPolicy({ policy: 'same-origin-allow-popups' }));
app.use(express.json());

// 3) API routes
app.use('/api',       authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api', authenticateToken, uploadsRouter);

// 4) Global error handler
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err);
  // In case of error, still send CORS headers
  if (!res.headersSent) {
    res.setHeader('Access-Control-Allow-Origin', FRONTEND);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

// 5) Export as Vercel Serverless Function
module.exports = serverless(app);