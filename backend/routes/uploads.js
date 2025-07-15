// backend/routes/uploads.js
const express = require('express');
const multer = require('multer');
const asyncHandler = require('../utils/asyncHandler');
const pool = require('../db');
const { uploadFile } = require('../utils/storage');
const authenticateToken = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  '/classes/:id/assignments/:aid/submit',
  authenticateToken,
  upload.array('files'),
  asyncHandler(async (req, res) => {
    const classId      = req.params.id;
    const assignmentId = req.params.aid;
    const studentId    = req.user.userId;      // set by authenticateToken

    // 1) Insert a new submission and get its ID
    const { rows } = await pool.query(
      `INSERT INTO submissions (assignment_id, student_id, submitted_at)
         VALUES ($1, $2, NOW())
       RETURNING id`,
      [assignmentId, studentId]
    );
    const submissionId = rows[0].id;

    // 2) Upload each file & insert its URL
    for (const file of req.files) {
      const url = await uploadFile(file.buffer, file.originalname, file.mimetype);
      await pool.query(
        `INSERT INTO submission_files (submission_id, filename, url)
           VALUES ($1, $2, $3)`,
        [submissionId, file.originalname, url]
      );
    }

    // 3) Respond with created submission ID (optional)
    res.status(201).json({ submissionId });
  })
);

module.exports = router;