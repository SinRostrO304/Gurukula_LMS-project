// backend/routes/classes.js
const express       = require('express');
const jwt           = require('jsonwebtoken');
const pool          = require('../db');
const asyncHandler  = require('../utils/asyncHandler');
const multer        = require('multer');
const path          = require('path');
const { uploadFile } = require('../utils/storage');

const router        = express.Router();
const JWT_SECRET    = process.env.JWT_SECRET;

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token missing' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
}

// Multer for cover uploads
const coverUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('cover');

// Helper to generate class codes
function generateCode(len = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < len; i++) {
    s += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return s;
}

/**
 * GET /api/classes/teaching
 * Lists classes the current user owns
 */
router.get(
  '/teaching',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT id, name, section, subject, room, description, cover_url AS "coverUrl", created_at
         FROM classes
        WHERE owner_id = $1
        ORDER BY created_at DESC`,
      [req.user.userId]
    );
    res.json({ classes: rows });
  })
);

/**
 * GET /api/classes/enrolled
 * Lists classes the current user is enrolled in (with owner info)
 */
router.get(
  '/enrolled',
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT
           c.id,
           c.name,
           c.cover_url AS "coverUrl",
           u.metadata->>'name'    AS "ownerName",
           u.metadata->>'picture' AS "ownerPicture"
         FROM classes c
         JOIN class_enrollments e ON e.class_id = c.id
         JOIN users u              ON c.owner_id = u.id
        WHERE e.user_id = $1
        ORDER BY c.name`,
        [req.user.userId]
      );
      res.json({ classes: rows });
    } catch (err) {
      console.error('Error in GET /classes/enrolled:', err);
      throw err;
    }
  })
);

/**
 * POST /api/classes/join
 * Enrolls the current user in a class by code
 */
router.post(
  '/join',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { code } = req.body;

    // 1) find class
    const { rows: clsRows } = await pool.query(
      `SELECT id, owner_id FROM classes WHERE UPPER(code) = UPPER($1)`,
      [code]
    );
    if (!clsRows[0]) {
      return res.status(404).json({ error: 'Invalid class code.' });
    }
    const cls = clsRows[0];

    // 2) prevent owner from joining
    if (cls.owner_id === userId) {
      return res.status(400).json({ error: 'You already own this class.' });
    }

    // 3) insert enrollment (no-op if exists)
    await pool.query(
      `INSERT INTO class_enrollments (user_id, class_id)
         VALUES ($1, $2)
       ON CONFLICT (user_id, class_id) DO NOTHING`,
      [userId, cls.id]
    );

    res.json({ classId: cls.id });
  })
);

/**
 * POST /api/classes/create
 * Creates a new class under the current user (owner)
 */
router.post(
  '/create',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { name, section, subject, room, description } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Class name is required.' });
    }
    const ownerId = req.user.userId;

    // generate a unique code
    let code, exists;
    do {
      code = generateCode(8);
      const r = await pool.query(
        'SELECT 1 FROM classes WHERE code = $1',
        [code]
      );
      exists = r.rowCount > 0;
    } while (exists);

    // insert
    const insertSQL = `
      INSERT INTO classes
        (code, name, section, subject, room, description, owner_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id, code, name, section, subject, room, description, cover_url AS "coverUrl", created_at
    `;
    const params = [
      code,
      name.trim(),
      section?.trim() || null,
      subject?.trim() || null,
      room?.trim() || null,
      description?.trim() || null,
      ownerId
    ];
    const { rows } = await pool.query(insertSQL, params);
    res.status(201).json({ class: rows[0] });
  })
);

// GET /api/classes/:id/announcements
router.get(
  '/:id/announcements',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const classId = parseInt(req.params.id, 10);
    const { rows } = await pool.query(
      `SELECT
         id,
         title,
         content   AS "contentBlocks",
         tags,
         schedule,
         pinned,
         created_at
       FROM announcements
      WHERE class_id = $1
      ORDER BY pinned DESC,
               COALESCE(schedule, created_at) DESC`,
      [classId]
    );
    res.json(rows);
  })
);

// POST /api/classes/:id/announcements
router.post(
  '/:id/announcements',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const classId = parseInt(req.params.id, 10);
    const { title, content, tags, schedule } = req.body;
    if (!title.trim()) {
      return res.status(400).json({ error: 'Title is required.' });
    }
    if (!content) {
      return res.status(400).json({ error: 'Content is required.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO announcements
        (class_id, title, content, tags, schedule, pinned)
       VALUES
        ($1, $2, $3::jsonb, $4, $5, false)
       RETURNING
        id, title, content AS "contentBlocks", tags, schedule, pinned, created_at`,
      [
        classId,
        title.trim(),
        content,
        Array.isArray(tags) ? tags : [],
        schedule || null,
      ]
    );
    res.status(201).json(rows[0]);
  })
);

// GET comments on one announcement
router.get(
  '/:id/announcements/:annId/comments',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const annId = parseInt(req.params.annId, 10);
    const { rows } = await pool.query(
      `SELECT
         c.id,
         u.metadata->>'name'    AS "authorName",
         u.metadata->>'picture' AS "authorPicture",
         c.text,
         c.created_at AS "createdAt"
       FROM announcement_comments c
       JOIN users u ON c.user_id = u.id
      WHERE c.announcement_id = $1
      ORDER BY c.created_at ASC`,
      [annId]
    );
    res.json(rows);
  })
);

// POST a new comment
router.post(
  '/:id/announcements/:annId/comments',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const annId = parseInt(req.params.annId, 10);
    const userId = req.user.userId;
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ error: 'Comment text is required.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO announcement_comments
         (announcement_id, user_id, text)
       VALUES ($1, $2, $3)
       RETURNING
         id,
         text,
         created_at AS "createdAt"`,
      [annId, userId, text.trim()]
    );

    // fetch author info
    const comment = rows[0];
    const { rows: userRows } = await pool.query(
      `SELECT metadata->>'name' AS "authorName",
              metadata->>'picture' AS "authorPicture"
         FROM users
        WHERE id = $1`,
      [userId]
    );

    res.status(201).json({
      ...comment,
      authorName: userRows[0].authorName,
      authorPicture: userRows[0].authorPicture
    });
  })
);

// PUT /api/classes/:id/announcements/:annId/pin
// (toggle pinned state)
router.put(
  '/:id/announcements/:annId/pin',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const annId = parseInt(req.params.annId, 10);
    const { pinned } = req.body;
    const { rows } = await pool.query(
      `UPDATE announcements
          SET pinned = $1
        WHERE id = $2
        RETURNING id,
                  title,
                  content   AS "contentBlocks",
                  schedule,
                  pinned,
                  created_at`,
      [pinned, annId]
    );
    res.json(rows[0]);
  })
);

// PUT /api/classes/:id/announcements/:annId
// Edit an existing announcement
router.put(
  '/:id/announcements/:annId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const annId = parseInt(req.params.annId, 10);
    const { title, content, schedule } = req.body;
    if (!title?.trim() || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }
    const { rows } = await pool.query(
      `UPDATE announcements
          SET title    = $1,
              content  = $2::jsonb,
              schedule = $3
        WHERE id = $4
        RETURNING id,
                  title,
                  content   AS "contentBlocks",
                  schedule,
                  pinned,
                  created_at`,
      [title.trim(), content, schedule || null, annId]
    );
    res.json(rows[0]);
  })
);

// DELETE /api/classes/:id/announcements/:annId
// Remove an announcement
router.delete(
  '/:id/announcements/:annId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const annId = parseInt(req.params.annId, 10);
    await pool.query(
      `DELETE FROM announcements WHERE id = $1`,
      [annId]
    );
    res.status(204).end();
  })
);

// GET students in a class
router.get(
  '/:id/students',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const classId = parseInt(req.params.id, 10);
    const { rows } = await pool.query(
      `SELECT u.id,
              u.metadata->>'name' AS "name",
              u.metadata->>'picture' AS "picture"
         FROM class_enrollments e
         JOIN users u ON e.user_id = u.id
        WHERE e.class_id = $1`,
      [classId]
    );
    res.json(rows);
  })
);

/**
 * POST /api/classes/:id/cover
 * Upload a cover image to Supabase
 */
router.post(
  '/:id/cover',
  authenticateToken,
  coverUpload,
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    // 1) upload buffer to Supabase
    const url = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    // 2) save to DB
    const { rows } = await pool.query(
      `UPDATE classes SET cover_url=$1 WHERE id=$2 RETURNING cover_url`,
      [url, +req.params.id]
    );
    res.json({ coverUrl: rows[0].cover_url });
  })
);

// POST /api/classes/:id/invite
// Send an invitation email (role = 'teacher' or 'student')
router.post(
  '/:id/invite',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const classId = parseInt(req.params.id, 10);
    const { email, role } = req.body;
    if (!email || !['teacher','student'].includes(role)) {
      return res.status(400).json({ error:'Email and valid role required' });
    }

    // find or create user record
    let userId;
    const { rows: u } = await pool.query(
      'SELECT id FROM users WHERE email=$1',
      [email.toLowerCase().trim()]
    );
    if (u.length) {
      userId = u[0].id;
    } else {
      const ins = await pool.query(
        `INSERT INTO users (email,password,metadata,verified)
           VALUES($1,'invite','{}'::jsonb,FALSE)
         RETURNING id`,
        [email.toLowerCase().trim()]
      );
      userId = ins.rows[0].id;
    }

    // generate join token and URL
    const token = jwt.sign({ classId, userId, role }, JWT_SECRET, { expiresIn:'7d' });
    const link  = `${process.env.APP_BASE_URL}/join?token=${token}`;
    // TODO: replace console.log with sendInvitationEmail(...)
    console.log(`Invite link for ${email}: ${link}`);

    res.sendStatus(204);
  })
);

// POST /api/classes/:id/students/bulk/email
// Bulk‐send a notification email to selected student IDs
router.post(
  '/:id/students/bulk/email',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const classId = parseInt(req.params.id, 10);
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ error:'No student IDs provided' });
    }

    // fetch email addresses
    const { rows } = await pool.query(
      `SELECT u.email
         FROM class_enrollments e
         JOIN users u ON e.user_id=u.id
        WHERE e.class_id=$1 AND e.user_id = ANY($2)`,
      [classId, ids]
    );
    // TODO: sendMail to each address
    rows.forEach(r => console.log(`Email to ${r.email}: You have a new class update.`));

    res.sendStatus(204);
  })
);

// POST /api/classes/:id/students/bulk/remove
// Bulk‐remove selected student IDs from this class
router.post(
  '/:id/students/bulk/remove',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const classId = parseInt(req.params.id, 10);
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ error:'No student IDs provided' });
    }
    await pool.query(
      `DELETE FROM class_enrollments
         WHERE class_id=$1 AND user_id = ANY($2)`,
      [classId, ids]
    );
    res.sendStatus(204);
  })
);

// GET /api/classes/:id/students/:sid/assignments
// List a single student’s assignments + status
router.get(
  '/:id/students/:sid/assignments',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const classId   = parseInt(req.params.id, 10);
    const studentId = parseInt(req.params.sid, 10);

    const { rows } = await pool.query(`
      SELECT
        a.id,
        a.title,
        a.due,
        CASE
          WHEN s.id IS NOT NULL AND s.graded THEN 'graded'
          WHEN s.id IS NOT NULL                THEN 'submitted'
          WHEN a.due < NOW()                   THEN 'missing'
          ELSE 'assigned'
        END AS status,
        s.graded,
        s.grade
      FROM assignments a
      LEFT JOIN submissions s
        ON s.assignment_id = a.id
       AND s.user_id       = $2
      WHERE a.class_id = $1
      ORDER BY COALESCE(a.due, a.created_at) ASC
    `, [classId, studentId]);

    res.json(rows);
  })
);

// GET /api/classes/:id/students/:sid/assignments/csv
// Export that same data as a CSV download
router.get(
  '/:id/students/:sid/assignments/csv',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const classId   = parseInt(req.params.id, 10);
    const studentId = parseInt(req.params.sid, 10);

    const { rows } = await pool.query(`
      SELECT
        a.id,
        a.title,
        a.due,
        CASE
          WHEN s.id IS NOT NULL AND s.graded THEN 'graded'
          WHEN s.id IS NOT NULL                THEN 'submitted'
          WHEN a.due < NOW()                   THEN 'missing'
          ELSE 'assigned'
        END AS status,
        s.graded,
        s.grade
      FROM assignments a
      LEFT JOIN submissions s
        ON s.assignment_id = a.id
       AND s.user_id       = $2
      WHERE a.class_id = $1
      ORDER BY COALESCE(a.due, a.created_at) ASC
    `, [classId, studentId]);

    // build CSV text
    const header = ['id','title','due','status','graded','grade'];
    const lines = rows.map(r => [
      r.id,
      `"${r.title.replace(/"/g,'""')}"`,
      r.due ? r.due.toISOString() : '',
      r.status,
      r.graded,
      r.grade ?? ''
    ].join(','));
    const csv = [header.join(','), ...lines].join('\n');

    res.setHeader('Content-Type','text/csv');
    res.setHeader('Content-Disposition',
      `attachment; filename="student-${studentId}-assignments.csv"`);

    res.send(csv);
  })
);

// GET assignments
router.get(
  '/:id/assignments',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const classId = parseInt(req.params.id, 10);
    const { rows } = await pool.query(
      `SELECT
         id, type, title, description,
         due, schedule, assign_to, points,
         quiz_link    AS "quizLink",
         question_type AS "questionType",
         question_opts AS "questionOpts",
         reuse,
         created_at
       FROM assignments
      WHERE class_id = $1
      ORDER BY created_at DESC`,
      [classId]
    );
    // add a small preview of description
    rows.forEach(r => {
      try {
        const blocks = JSON.parse(r.description||'{"blocks":[]}').blocks
        r.descriptionPreview = blocks.map(b=>b.text).join(' ').slice(0,100)
      } catch { r.descriptionPreview = '' }
    });
    res.json(rows);
  })
);

// POST new assignment
const assignUpload = multer({ storage: multer.memoryStorage() }).array('files');
router.post(
  '/:id/assignments',
  authenticateToken,
  assignUpload,
  asyncHandler(async (req, res) => {
    const classId = parseInt(req.params.id, 10);
    const payload = JSON.parse(req.body.payload);
    const {
      type, title, description, due, schedule,
      assignTo, points, quizLink,
      questionType, questionOpts, reuse
    } = payload;

    const { rows } = await pool.query(
      `INSERT INTO assignments
         (class_id,type,title,description,due,schedule,assign_to,points,quiz_link,
          question_type,question_opts,reuse)
       VALUES
         ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9,$10,$11,$12::jsonb)
       RETURNING *`,
      [
        classId, type, title.trim(), description,
        due||null, schedule||null, assignTo,
        points||null, quizLink||null,
        questionType||null, questionOpts||null,
        reuse||null
      ]
    );
    res.status(201).json(rows[0]);
  })
);

// PUT edit assignment
router.put(
  '/:id/assignments/:assId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const assId = parseInt(req.params.assId, 10);
    const payload = req.body;
    const { title, description, due, schedule, assignTo,
            points, quizLink, questionType, questionOpts, reuse } = payload;

    const { rows } = await pool.query(
      `UPDATE assignments
          SET title          = $1,
              description    = $2::jsonb,
              due            = $3,
              schedule       = $4,
              assign_to      = $5,
              points         = $6,
              quiz_link      = $7,
              question_type  = $8,
              question_opts  = $9,
              reuse          = $10::jsonb
        WHERE id = $11
        RETURNING *`,
      [
        title.trim(), description, due||null, schedule||null,
        assignTo, points||null, quizLink||null,
        questionType||null, questionOpts||null, reuse||null,
        assId
      ]
    );
    res.json(rows[0]);
  })
);

// DELETE assignment
router.delete(
  '/:id/assignments/:assId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const assId = parseInt(req.params.assId, 10);
    await pool.query(`DELETE FROM assignments WHERE id = $1`, [assId]);
    res.status(204).end();
  })
);

// 1) Filter & search
router.get(
  '/:id/assignments',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const classId = parseInt(req.params.id, 10);
    const { type, search, dueFrom, dueTo } = req.query;

    let sql = `
      SELECT
        id, type, title, description,
        due, schedule,
        assign_to    AS "assignTo",
        points,
        quiz_link    AS "quizLink",
        question_type AS "questionType",
        question_opts AS "questionOpts",
        reuse,
        created_at
      FROM assignments
      WHERE class_id = $1
    `;
    const params = [classId];

    if (type) {
      params.push(type);
      sql += ` AND type = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (
        title ILIKE $${params.length}
        OR description::text ILIKE $${params.length}
      )`;
    }
    if (dueFrom) {
      params.push(new Date(dueFrom));
      sql += ` AND due >= $${params.length}`;
    }
    if (dueTo) {
      params.push(new Date(dueTo));
      sql += ` AND due <= $${params.length}`;
    }

    sql += ` ORDER BY COALESCE(schedule, created_at) DESC`;

    const { rows } = await pool.query(sql, params);

    // build a 100-char text preview
    rows.forEach(r => {
      try {
        const blocks = JSON.parse(r.description || '{"blocks":[]}').blocks;
        r.descriptionPreview = blocks.map(b => b.text).join(' ').slice(0,100);
      } catch {
        r.descriptionPreview = '';
      }
    });

    res.json(rows);
  })
);

// 2) Bulk actions
router.post(
  '/:id/assignments/bulk',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { action, ids, schedule } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ error: 'No assignment IDs provided' });
    }

    if (action === 'delete') {
      await pool.query(`DELETE FROM assignments WHERE id = ANY($1)`, [ids]);
    }
    else if (action === 'archive') {
      // ensure the column exists
      await pool.query(`ALTER TABLE assignments ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE`);
      await pool.query(`UPDATE assignments SET archived = TRUE WHERE id = ANY($1)`, [ids]);
    }
    else if (action === 'publish') {
      // clear schedule → publish immediately
      await pool.query(`UPDATE assignments SET schedule = NULL WHERE id = ANY($1)`, [ids]);
    }
    else if (action === 'schedule') {
      await pool.query(
        `UPDATE assignments SET schedule = $2 WHERE id = ANY($1)`,
        [ids, schedule]
      );
    }
    else {
      return res.status(400).json({ error: 'Invalid bulk action' });
    }

    res.sendStatus(204);
  })
);

// 3) Draft autosave
// You’ll need a new `assignment_drafts` table with (class_id, user_id, form jsonb, raw jsonb, updated_at)
router.post(
  '/:id/drafts',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const classId = parseInt(req.params.id, 10);
    const userId  = req.user.userId;
    const { form, raw } = req.body;

    await pool.query(`
      INSERT INTO assignment_drafts (class_id, user_id, form, raw, updated_at)
      VALUES ($1,$2,$3::jsonb,$4::jsonb, now())
      ON CONFLICT (class_id,user_id)
      DO UPDATE SET form=$3::jsonb, raw=$4::jsonb, updated_at=now()
    `, [classId, userId, form, raw]);

    res.sendStatus(204);
  })
);

router.get(
  '/:id/drafts',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const classId = parseInt(req.params.id, 10);
    const userId  = req.user.userId;

    const { rows } = await pool.query(`
      SELECT form, raw
      FROM assignment_drafts
      WHERE class_id=$1 AND user_id=$2
      ORDER BY updated_at DESC
      LIMIT 1
    `, [classId, userId]);

    res.json(rows[0] || {});
  })
);

// 4) Rubric CRUD
router.post(
  '/:id/assignments/:aid/rubric',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const assId = parseInt(req.params.aid, 10);
    const { rubric } = req.body;

    await pool.query(
      `ALTER TABLE assignments ADD COLUMN IF NOT EXISTS rubric JSONB`,
      []
    );
    await pool.query(
      `UPDATE assignments SET rubric = $1::jsonb WHERE id = $2`,
      [rubric, assId]
    );

    res.sendStatus(204);
  })
);

// 5) Statistics for progress tile
router.get(
  '/:id/assignments/:aid/statistics',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const assId = parseInt(req.params.aid, 10);

    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM submissions WHERE assignment_id = $1) AS submitted,
        (SELECT COUNT(*) FROM class_enrollments
           WHERE class_id = (SELECT class_id FROM assignments WHERE id = $1)
        ) AS assigned,
        (SELECT COUNT(*) FROM submissions
           WHERE assignment_id = $1 AND graded = TRUE
        ) AS graded
    `, [assId]);

    res.json(rows[0] || { submitted:0, assigned:0, graded:0 });
  })
);

// 6) Analytics & CSV export
router.get(
  '/:id/assignments/analytics',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const classId = parseInt(req.params.id, 10);

    const { rows } = await pool.query(`
      SELECT
        a.id,
        a.title,
        COUNT(s.id) FILTER (WHERE s.graded)       AS "gradedCount",
        ROUND(AVG(s.score)::numeric,2)            AS "avgScore",
        ROUND(AVG(s.time_spent)::numeric,2)       AS "avgTime"
      FROM assignments a
      LEFT JOIN submissions s ON s.assignment_id = a.id
      WHERE a.class_id = $1
      GROUP BY a.id, a.title
      ORDER BY a.created_at DESC
    `, [classId]);

    res.json(rows);
  })
);

router.get(
  '/:id/assignments/analytics/csv',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const classId = parseInt(req.params.id, 10);

    const { rows } = await pool.query(`
      SELECT
        a.id,
        a.title,
        COUNT(s.id) FILTER (WHERE s.graded)       AS gradedCount,
        ROUND(AVG(s.score)::numeric,2)            AS avgScore,
        ROUND(AVG(s.time_spent)::numeric,2)       AS avgTime
      FROM assignments a
      LEFT JOIN submissions s ON s.assignment_id = a.id
      WHERE a.class_id = $1
      GROUP BY a.id, a.title
      ORDER BY a.created_at DESC
    `, [classId]);

    // build CSV string
    const header = ['id','title','gradedCount','avgScore','avgTime'];
    const lines = rows.map(r =>
      [r.id, `"${r.title.replace(/"/g,'""')}"`, r.gradedCount, r.avgScore, r.avgTime].join(',')
    );
    const csv = [header.join(','), ...lines].join('\n');

    res.setHeader('Content-Type','text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="assignments-analytics-${classId}.csv"`
    );
    res.send(csv);
  })
);

// --- invite a teacher or student by email
// POST /api/classes/:id/invite
router.post(
  '/:id/invite',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const classId = parseInt(req.params.id, 10)
    const { email, role } = req.body
    if (!email || !['teacher','student'].includes(role)) {
      return res.status(400).json({ error:'Email and valid role required' })
    }

    // find or create user by email
    const userRes = await pool.query(
      'SELECT id FROM users WHERE email=$1',
      [email.trim().toLowerCase()]
    )
    let userId
    if (userRes.rows.length) {
      userId = userRes.rows[0].id
    } else {
      // create unverified user slot
      const ins = await pool.query(
        `INSERT INTO users (email, password, metadata, verified)
         VALUES($1,'invite', jsonb_build_object('name',null,'picture',null), FALSE)
         RETURNING id`,
        [email.trim().toLowerCase()]
      )
      userId = ins.rows[0].id
    }

    // send invitation email (link to /join?code=…&role=…)
    const token = jwt.sign({ classId, userId, role }, JWT_SECRET, { expiresIn:'7d' })
    const link  = `${process.env.APP_BASE_URL}/join?token=${token}`
    // you’d use your mailer; for now just log
    console.log(`Invite link for ${email}: ${link}`)

    res.status(204).end()
  })
)

// --- bulk email invites to selected students
// POST /api/classes/:id/students/bulk/email
router.post(
  '/:id/students/bulk/email',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const classId = parseInt(req.params.id, 10)
    const { ids } = req.body
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ error:'No student IDs provided' })
    }

    // fetch emails
    const { rows } = await pool.query(
      `SELECT u.email
         FROM class_enrollments e
         JOIN users u ON e.user_id=u.id
        WHERE e.class_id=$1 AND e.user_id = ANY($2)`,
      [classId, ids]
    )
    // send each a simple notification
    rows.forEach(r => console.log(`Email to ${r.email}: “You have a new message in class ${classId}.”`))

    res.status(204).end()
  })
)

// --- bulk remove selected students
// POST /api/classes/:id/students/bulk/remove
router.post(
  '/:id/students/bulk/remove',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const classId = parseInt(req.params.id, 10)
    const { ids } = req.body
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ error:'No student IDs provided' })
    }
    await pool.query(
      `DELETE FROM class_enrollments
         WHERE class_id=$1 AND user_id = ANY($2)`,
      [classId, ids]
    )
    res.status(204).end()
  })
)

// GET one student’s assignments + status
// GET /api/classes/:id/students/:sid/assignments
router.get(
  '/:id/students/:sid/assignments',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const classId = parseInt(req.params.id, 10);
    const studentId = parseInt(req.params.sid, 10);

    const { rows } = await pool.query(`
      SELECT
        a.id,
        a.title,
        a.due,
        -- determine status
        CASE
          WHEN s.id IS NOT NULL AND s.graded THEN 'graded'
          WHEN s.id IS NOT NULL THEN 'submitted'
          WHEN a.due < NOW() THEN 'missing'
          ELSE 'assigned'
        END AS status,
        s.submitted_at   AS "submittedAt",
        s.graded,
        s.grade
      FROM assignments a
      LEFT JOIN submissions s
        ON s.assignment_id = a.id
       AND s.user_id       = $2
      WHERE a.class_id = $1
      ORDER BY COALESCE(a.due, a.created_at) ASC
    `, [classId, studentId]);

    res.json(rows);
  })
);

// GET the same data as CSV
// GET /api/classes/:id/students/:sid/assignments/csv
router.get(
  '/:id/students/:sid/assignments/csv',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const classId = parseInt(req.params.id, 10);
    const studentId = parseInt(req.params.sid, 10);

    const { rows } = await pool.query(`
      SELECT
        a.id,
        a.title,
        a.due,
        CASE
          WHEN s.id IS NOT NULL AND s.graded THEN 'graded'
          WHEN s.id IS NOT NULL THEN 'submitted'
          WHEN a.due < NOW() THEN 'missing'
          ELSE 'assigned'
        END AS status,
        s.graded,
        s.grade
      FROM assignments a
      LEFT JOIN submissions s
        ON s.assignment_id = a.id
       AND s.user_id       = $2
      WHERE a.class_id = $1
      ORDER BY COALESCE(a.due, a.created_at) ASC
    `, [classId, studentId]);

    // Build CSV
    const header = ['id','title','due','status','graded','grade'];
    const lines = rows.map(r => [
      r.id,
      `"${r.title.replace(/"/g,'""')}"`,
      r.due ? r.due.toISOString() : '',
      r.status,
      r.graded,
      r.grade ?? ''
    ].join(','));
    const csv = [header.join(','), ...lines].join('\n');

    res.setHeader('Content-Type','text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="student-${studentId}-classwork.csv"`
    );
    res.send(csv);
  })
);

/**
 * GET /api/classes/:id
 * Fetches one class (must be owner to view)
 */
router.get(
  '/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const classId = parseInt(req.params.id, 10);
    const { rows } = await pool.query(
      `SELECT
         c.id,
         c.code,
         c.name,
         c.section,
         c.subject,
         c.room,
         c.description,
         c.cover_url AS "coverUrl",
         c.owner_id  AS "ownerId",
         c.created_at
      FROM classes c
      LEFT JOIN class_enrollments e
         ON e.class_id = c.id
        AND e.user_id  = $2
      WHERE c.id = $1
        AND (c.owner_id = $2 OR e.user_id IS NOT NULL)`,
      [classId, req.user.userId]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Class not found or no access.' });
    }
    // return the class object in { class: … } shape
    res.json({ class: rows[0] });
  })
);

// 1) Class-level overview
// GET /api/classes/:id/grades/overview
router.get(
  '/:id/grades/overview',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const classId = parseInt(req.params.id, 10)

    // average, high, low for graded submissions
    const gradeStats = await pool.query(`
      SELECT
        ROUND(AVG(s.grade)::numeric,2) AS avg,
        MAX(s.grade)                 AS high,
        MIN(s.grade)                 AS low
      FROM submissions s
      JOIN assignments a ON s.assignment_id=a.id
      WHERE a.class_id=$1 AND s.graded=true
    `, [classId])

    // on-time, late, missing
    const counts = await pool.query(`
      WITH tot AS (
        SELECT COUNT(*) AS total
        FROM class_enrollments e
        WHERE e.class_id=$1
      ), sub AS (
        SELECT
          COUNT(*) FILTER (WHERE s.submitted_at <= a.due) AS onTime,
          COUNT(*) FILTER (WHERE s.submitted_at  > a.due) AS late
        FROM submissions s
        JOIN assignments a ON s.assignment_id=a.id
        WHERE a.class_id=$1
      )
      SELECT
        tot.total,
        sub.onTime,
        sub.late
      FROM tot, sub
    `, [classId])

    const { avg, high, low } = gradeStats.rows[0]
    const { total, onTime, late } = counts.rows[0]
    const missing = total - (onTime + late)
    // percentages
    const pct = x => total ? Math.round((x/total)*100) : 0

    res.json({
      avg:    avg    || 0,
      high:   high   || 0,
      low:    low    || 0,
      onTime: pct(onTime),
      late:   pct(late),
      missing:pct(missing)
    })
  })
)

// 2) Inline save grade
// PUT /api/classes/:id/assignments/:aid/grades
router.put(
  '/:id/assignments/:aid/grades',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const assId     = parseInt(req.params.assId, 10)
    const { studentId, grade } = req.body

    // upsert into submissions
    await pool.query(`
      INSERT INTO submissions
        (assignment_id, user_id, submitted_at, graded, grade)
      VALUES ($1, $2, NOW(), true, $3)
      ON CONFLICT (assignment_id, user_id)
      DO UPDATE
        SET graded=true,
            grade   = EXCLUDED.grade
    `, [assId, studentId, grade])

    res.sendStatus(204)
  })
)

// 3) Bulk remind
// POST /api/classes/:id/grades/bulk/remind
router.post(
  '/:id/grades/bulk/remind',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const classId  = parseInt(req.params.id, 10)
    const { studentIds } = req.body

    const { rows } = await pool.query(`
      SELECT u.email
      FROM class_enrollments e
      JOIN users u ON e.user_id=u.id
      WHERE e.class_id=$1 AND e.user_id = ANY($2)
    `, [classId, studentIds])

    // send reminder
    await Promise.all(rows.map(r =>
      sendMail(
        r.email,
        'Reminder: please submit your assignment',
        `<p>Please log into LMS and submit any outstanding assignments for class ${classId}.</p>`
      )
    ))

    res.sendStatus(204)
  })
)

// 4) Bulk curve
// POST /api/classes/:id/grades/bulk/curve
router.post(
  '/:id/grades/bulk/curve',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const classId  = parseInt(req.params.id, 10)
    const { studentIds, delta } = req.body

    await pool.query(`
      UPDATE submissions s
      SET grade = LEAST(100, GREATEST(0, s.grade + $2))
      FROM assignments a
      WHERE s.assignment_id = a.id
        AND a.class_id = $1
        AND s.user_id   = ANY($3)
    `, [classId, delta, studentIds])

    res.sendStatus(204)
  })
)

// STUDENT CLASSWORK DETAIL + SUBMISSION ENDPOINTS
// 1) Fetch one assignment’s full details
router.get(
  '/:id/assignments/:aid/details',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const classId = +req.params.id;
    const aid     = +req.params.aid;
    const { rows } = await pool.query(
      `SELECT
         a.id, a.type, a.title, a.description,
         a.due, a.points, a.quiz_link AS "quizLink",
         a.question_type AS "questionType",
         a.question_opts AS "questionOpts",
         a.reuse,
         a.created_at
       FROM assignments a
       WHERE a.class_id = $1
         AND a.id       = $2`,
      [classId, aid]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  })
);

// 2) Fetch materials for that assignment
router.get(
  '/:id/assignments/:aid/materials',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const aid = +req.params.aid;
    const { rows } = await pool.query(
      `SELECT id, filename, url, created_at
         FROM materials
        WHERE assignment_id = $1
          AND deleted_at IS NULL
        ORDER BY created_at`,
      [aid]
    );
    res.json(rows);
  })
);

// 3a) Public comments on that assignment
router.get(
  '/:id/assignments/:aid/comments',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const aid = +req.params.aid;
    const { rows } = await pool.query(
      `SELECT
         c.id,
         u.metadata->>'name'    AS "authorName",
         c.text,
         c.created_at
       FROM assignment_comments c
       JOIN users u ON u.id = c.user_id
      WHERE c.assignment_id = $1
        AND c.private = FALSE
        AND c.deleted_at IS NULL
      ORDER BY c.created_at`,
      [aid]
    );
    res.json(rows);
  })
);

// 3b) Post a new public comment
router.post(
  '/:id/assignments/:aid/comments',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const aid     = +req.params.aid;
    const userId  = req.user.userId;
    const text    = (req.body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Text required' });

    const { rows } = await pool.query(
      `INSERT INTO assignment_comments
         (assignment_id, user_id, text, private)
       VALUES ($1,$2,$3,FALSE)
       RETURNING id, text, created_at`,
      [aid, userId, text]
    );
    const comment = rows[0];
    const { rows: u } = await pool.query(
      `SELECT metadata->>'name' AS "authorName"
         FROM users
        WHERE id = $1`,
      [userId]
    );
    res.status(201).json({
      ...comment,
      authorName: u[0].authorName
    });
  })
);

// 4a) Private (student↔teacher) comments
router.get(
  '/:id/assignments/:aid/private-comments',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const aid = +req.params.aid;
    const { rows } = await pool.query(
      `SELECT
         c.id,
         u.metadata->>'name'    AS "authorName",
         c.text,
         c.created_at
       FROM assignment_comments c
       JOIN users u ON u.id = c.user_id
      WHERE c.assignment_id = $1
        AND c.private = TRUE
        AND c.deleted_at IS NULL
      ORDER BY c.created_at`,
      [aid]
    );
    res.json(rows);
  })
);

// 4b) Post a private comment
router.post(
  '/:id/assignments/:aid/private-comments',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const aid    = +req.params.aid;
    const userId = req.user.userId;
    const text   = (req.body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Text required' });

    const { rows } = await pool.query(
      `INSERT INTO assignment_comments
         (assignment_id, user_id, text, private)
       VALUES ($1,$2,$3,TRUE)
       RETURNING id, text, created_at`,
      [aid, userId, text]
    );
    const comment = rows[0];
    const { rows: u } = await pool.query(
      `SELECT metadata->>'name' AS "authorName"
         FROM users
        WHERE id = $1`,
      [userId]
    );
    res.status(201).json({
      ...comment,
      authorName: u[0].authorName
    });
  })
);

// 5) Fetch existing submission + files + done flag
router.get(
  '/:id/assignments/:aid/submission',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const aid    = +req.params.aid;
    const userId = req.user.userId;

    const { rows } = await pool.query(
      `SELECT id, submitted_at, graded, grade, feedback
         FROM submissions
        WHERE assignment_id = $1
          AND user_id       = $2
          AND deleted_at IS NULL`,
      [aid, userId]
    );
    const sub = rows[0] || null;

    // load files if any
    let files = [];
    if (sub) {
      const ff = await pool.query(
        `SELECT id, filename, url, created_at
           FROM submission_files
          WHERE submission_id = $1
            AND deleted_at IS NULL
          ORDER BY created_at`,
        [sub.id]
      );
      files = ff.rows;
    }

    res.json({
      submission: sub,
      files,
      done: !!sub
    });
  })
);

// 6) Upload student files (and create submission record if needed)
const submitUpload = multer({ storage: multer.memoryStorage() }).array('files');
router.post(
  '/:id/assignments/:aid/submit',
  authenticateToken,
  submitUpload,
  asyncHandler(async (req, res) => {
    const aid    = +req.params.aid;
    const userId = req.user.userId;

    // upsert submission row
    const { rows } = await pool.query(
      `INSERT INTO submissions
         (assignment_id, user_id, submitted_at)
       VALUES ($1,$2,now())
       ON CONFLICT (assignment_id,user_id)
       DO UPDATE SET
         submitted_at = now(),
         deleted_at   = NULL
       RETURNING id`,
      [aid, userId]
    );
    const subId = rows[0].id;

    // store each file via Supabase
    for (let f of req.files) {
      const url = await uploadFile(f.buffer, f.originalname, f.mimetype);
      await pool.query(
        `INSERT INTO submission_files
           (submission_id, filename, url)
         VALUES ($1, $2, $3)`,
        [subId, f.originalname, url]
      );
    }

    res.sendStatus(204);
  })
);

// 7) Mark done / undone
router.put(
  '/:id/assignments/:aid/mark-done',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const aid    = +req.params.aid;
    const userId = req.user.userId;
    const { done } = req.body;

    if (done) {
      // ensure submission exists and not soft-deleted
      await pool.query(
        `INSERT INTO submissions
           (assignment_id, user_id, submitted_at)
         VALUES ($1,$2, now())
         ON CONFLICT (assignment_id,user_id)
         DO UPDATE
           SET deleted_at = NULL`,
        [aid, userId]
      );
    } else {
      // soft‐delete the submission
      await pool.query(
        `UPDATE submissions
            SET deleted_at = now()
          WHERE assignment_id = $1
            AND user_id       = $2`,
        [aid, userId]
      );
    }
    res.sendStatus(204);
  })
);

// 8) Update a student’s grade on an assignment
router.put(
  '/:id/assignments/:aid/grades',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const classId     = +req.params.id
    const assignmentId= +req.params.aid
    const { studentId, grade } = req.body

    if (typeof studentId !== 'number' || typeof grade !== 'number') {
      return res.status(400).json({ error: 'studentId and grade must be numbers' })
    }

    // Optionally: verify that `assignmentId` belongs to `classId`
    // await pool.query('SELECT 1 FROM assignments WHERE id=$1 AND class_id=$2', [assignmentId, classId])

    // Upsert submission with grade
    await pool.query(
      `INSERT INTO submissions
         (assignment_id, user_id, submitted_at, graded, grade, updated_at)
       VALUES ($1, $2, now(), TRUE, $3, now())
       ON CONFLICT (assignment_id, user_id)
       DO UPDATE SET
         graded    = TRUE,
         grade     = EXCLUDED.grade,
         updated_at= now()`,
      [assignmentId, studentId, grade]
    )

    res.sendStatus(204)
  })
)

module.exports = router;