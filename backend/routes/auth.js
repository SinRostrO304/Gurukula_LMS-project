// backend/routes/auth.js
const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const pool    = require('../db');
const { sendVerificationEmail } = require('../utils/mailer');
const asyncHandler = require('../utils/asyncHandler');
const { signupSchema, loginSchema } = require('../validators');
const router     = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS= 10;
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/signup
router.post(
  '/signup',
  asyncHandler(async (req, res) => {
    // Validate input
    const { error, value } = signupSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const { name, email, password } = value;

    // Prevent duplicates
    const { rowCount } = await pool.query(
      'SELECT 1 FROM users WHERE email = $1',
      [email]
    );
    if (rowCount) return res.status(409).json({ error: 'Email already in use' });

    // Hash password & create verify token
    const hash        = await bcrypt.hash(password, SALT_ROUNDS);
    const rawToken    = crypto.randomBytes(32).toString('hex');
    const verifyToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Insert user
    await pool.query(
      `INSERT INTO users
         (email, password, metadata, verified, verify_token)
       VALUES ($1, $2, $3::jsonb, FALSE, $4)`,
      [email, hash, JSON.stringify({ name }), verifyToken]
    );

    // Send email with rawToken
    await sendVerificationEmail(email, rawToken);

    res.status(201).json({ message: 'Signup successful—check your email to verify.' });
  })
);

// POST /api/login
router.post(
  '/login',
  // rate-limit: max 10 attempts per 15m per IP
  require('express-rate-limit')({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many login attempts. Try again later.'
  }),
  asyncHandler(async (req, res) => {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const { email, password } = value;

    // Fetch user
    const { rows } = await pool.query(
      `SELECT id, email, password, metadata->>'name' AS name, metadata->>'picture' AS picture, verified
         FROM users
        WHERE email = $1`,
      [email]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.verified) return res.status(403).json({ error: 'Please verify your email first.' });

    // Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    // Sign JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name, picture: user.picture },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    delete user.password;
    res.json({ user, token });
  })
);

// POST /api/auth/google
router.post('/auth/google', asyncHandler(async (req, res) => {
  const { token: idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'ID token required' });

  // 1) Verify ID token with Google
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();  // contains email, name, sub (Google user ID)
  const { email, name, picture } = payload;

  // 2) Fetch user (include picture)
  const { rows } = await pool.query(
    `SELECT
       id,
       email,
       metadata->>'name' AS name,
       metadata->>'picture' AS picture
     FROM users
     WHERE email = $1`,
    [email]
  );

  let user;
  if (rows.length) {
    user = rows[0];

    // 3) If they had no picture yet, store Google’s URL
    if (!user.picture && picture) {
      await pool.query(
        `UPDATE users
           SET metadata = jsonb_set(
             metadata,
             '{picture}',
             to_jsonb($1::text),
             true
           )
         WHERE id = $2`,
        [picture, user.id]
      );
      user.picture = picture;
    }

  } else {
    // 4) New user: insert name+picture into metadata
    const insert = await pool.query(
      `INSERT INTO users
         (email, password, metadata, verified)
       VALUES
         ($1, $2, $3::jsonb, TRUE)
       RETURNING
         id,
         email,
         metadata->>'name' AS name,
         metadata->>'picture' AS picture`,
      [email, 'google-oauth', JSON.stringify({ name, picture })]
    );
    user = insert.rows[0];
  }

  // 5) Issue your JWT with picture
  const jwtToken = jwt.sign(
    {
      userId:  user.id,
      email:   user.email,
      name:    user.name,
      picture: user.picture,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ user, token: jwtToken });
}));

router.get(
  '/verify',
  asyncHandler(async (req, res) => {
    const rawToken = req.query.token;
    if (!rawToken) {
      return res.status(400).json({ error: 'Verification token required' });
    }

    // Hash incoming raw token to compare to stored verify_token
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    // Attempt to verify the user
    const { rowCount } = await pool.query(
      `
      UPDATE users
         SET verified      = TRUE,
             verify_token  = NULL,
             updated_at    = now()
       WHERE verify_token = $1
         AND verified = FALSE
      `,
      [hashedToken]
    );

    if (rowCount === 0) {
      return res
        .status(400)
        .json({ error: 'Invalid or already‐used verification token' });
    }

    res.json({ message: 'Email successfully verified. You may now log in.' });
  })
);

module.exports = router;