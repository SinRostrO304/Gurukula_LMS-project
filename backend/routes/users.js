// backend/routes/users.js
const express = require('express');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcrypt');
const crypto  = require('crypto');
const pool    = require('../db');
const path    = require('path');         // ← for disk destination
const multer  = require('multer');       // ← import multer
const { sendResetEmail } = require('../utils/mailer');
const asyncHandler = require('../utils/asyncHandler');
const {
  updateSchema,
  forgotSchema,
  resetSchema,
} = require('../validators');

const router     = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token not provided' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = decoded; // {userId,email,name}
    next();
  });
}

// GET /api/users/me
router.get(
  '/me',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT id, email, metadata->>'name' AS name, metadata->>'picture' AS picture, created_at
         FROM users
        WHERE id = $1`,
      [req.user.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  })
);

// PUT /api/users/update
router.put(
  '/update',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { error, value } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const { name } = value;
    const { rows } = await pool.query(
      `UPDATE users
          SET metadata = jsonb_set(metadata,'{name}',to_jsonb($1::text),true)
        WHERE id = $2
        RETURNING id, email, metadata->>'name' AS name, created_at`,
      [name, req.user.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  })
);

// POST /api/users/forgot
router.post(
  '/forgot',
  require('express-rate-limit')({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many requests. Try again later.'
  }),
  asyncHandler(async (req, res) => {
    const { error, value } = forgotSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const { email } = value;
    const rawToken   = crypto.randomBytes(32).toString('hex');
    const hashedToken= crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires    = new Date(Date.now() + 3600_000); // 1h

    // Save hashed token if user exists
    await pool.query(
      `UPDATE users
          SET reset_token   = $1,
              reset_expires = $2
        WHERE email = $3`,
      [hashedToken, expires, email]
    );

    // Always send email
    await sendResetEmail(email, rawToken);
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  })
);

// POST /api/users/reset
router.post(
  '/reset',
  asyncHandler(async (req, res) => {
    const { error, value } = resetSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const { token, password } = value;
    const hashedToken         = crypto.createHash('sha256').update(token).digest('hex');

    // Find matching user
    const { rows } = await pool.query(
      `SELECT id FROM users
        WHERE reset_token = $1
          AND reset_expires > NOW()`,
      [hashedToken]
    );
    if (!rows[0]) return res.status(400).json({ error: 'Invalid or expired token' });

    // Hash new password
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `UPDATE users
          SET password      = $1,
              reset_token   = NULL,
              reset_expires = NULL
        WHERE id = $2`,
      [hash, rows[0].id]
    );

    res.json({ message: 'Password has been reset successfully.' });
  })
);

// Multer config for avatars
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'), false);
  }
});

// PUT /api/users/avatar
const debug = (label, obj) => console.log(`[avatar debug] ${label}:`, obj);

router.put(
  '/avatar',
  authenticateToken,
  upload.single('avatar'),
  asyncHandler(async (req, res) => {
    debug('req.user', req.user);
    debug('req.file', req.file);

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const pictureUrl = `${process.env.SERVER_URL}/uploads/${req.file.filename}`;
    debug('pictureUrl', pictureUrl);

    // UPDATE with RETURNING so we can inspect rowCount & new value
    const { rowCount, rows } = await pool.query(
      `UPDATE users
         SET metadata = jsonb_set(
           metadata,
           '{picture}',
           to_jsonb($1::text),
           true
         )
       WHERE id = $2
       RETURNING metadata->>'picture' AS picture`,
      [pictureUrl, req.user.userId]
    );
    debug('db update', { rowCount, rows });

    if (rowCount === 0) {
      return res
        .status(404)
        .json({ error: 'User not found or no metadata column' });
    }

    res.json({ picture: rows[0].picture });
  })
);

// GET /api/users/:id  → fetch public profile
router.get(
  '/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const uid = parseInt(req.params.id, 10)
    const { rows } = await pool.query(
      `SELECT
         id,
         email,
         metadata->>'name'    AS name,
         metadata->>'picture' AS picture
       FROM users
      WHERE id = $1`,
      [uid]
    )
    if (!rows[0]) return res.status(404).json({ error:'User not found' })
    res.json({ user: rows[0] })
  })
)

module.exports = router;