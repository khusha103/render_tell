// const express = require('express');
// const router = express.Router();
// const { getProfile } = require('../controllers/userController');
// const { verifyToken } = require('../middlewares/authMiddleware');

// router.get('/me', verifyToken, getProfile);

// module.exports = router;

const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // your DB pool

// Existing user routes...

// Add this route to get all users with OTP info (for debugging)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.user_id,
        u.name,
        u.phone_number,
        u.email,
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

module.exports = router;
