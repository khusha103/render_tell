// const express = require('express');
// const router = express.Router();
// const { getProfile } = require('../controllers/userController');
// const { verifyToken } = require('../middlewares/authMiddleware');

// router.get('/me', verifyToken, getProfile);

// module.exports = router;


const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads/users');
fs.mkdirSync(uploadDir, { recursive: true });

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `user_${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({ storage });


// 🟢 GET all users with OTP info
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.user_id,
        u.name,
        u.phone_number,
        u.email,
        u.profile_picture_url,
        u.status,
        u.created_at AS user_created_at,
        o.otp_id,
        o.otp_code,
        o.is_verified,
        o.created_at AS otp_created_at,
        o.expires_at
      FROM users u
      LEFT JOIN otp_requests o ON u.phone_number = o.phone_number
      ORDER BY u.user_id DESC
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// 🟡 POST - Add or update user with profile picture
router.post('/', upload.single('profile_picture'), async (req, res) => {
  const { phone_number, name } = req.body;
  const profile_picture_url = req.file ? `/uploads/users/${req.file.filename}` : null;

  if (!phone_number || !name || !profile_picture_url) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE phone_number = $1', [phone_number]);

    if (result.rows.length > 0) {
      // Update existing user
      await pool.query(
        `UPDATE users 
         SET name = $1, profile_picture_url = $2 
         WHERE phone_number = $3`,
        [name, profile_picture_url, phone_number]
      );
      res.status(200).json({ message: 'User updated', profile_picture_url });
    } else {
      // Insert new user
      await pool.query(
        `INSERT INTO users (phone_number, name, profile_picture_url) 
         VALUES ($1, $2, $3)`,
        [phone_number, name, profile_picture_url]
      );
      res.status(201).json({ message: 'User created', profile_picture_url });
    }
  } catch (err) {
    console.error('Error saving user:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

