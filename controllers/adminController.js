const pool = require('../config/db');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM admin_users WHERE email = $1', [email]);

    if (result.rows.length === 0 || result.rows[0].password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { admin_id: result.rows[0].admin_id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({ token });
  } catch (err) {
    console.error('Admin login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// exports.loginAdmin = async (req, res) => {
//   const { email, password } = req.body;

//   // 🔒 Mock admin credentials
//   const mockEmail = 'admin@demo.com';
//   const mockPassword = '123456';

//   if (email !== mockEmail || password !== mockPassword) {
//     return res.status(401).json({ message: 'Invalid mock credentials' });
//   }

//   // 🔐 Generate a mock token
//   const token = jwt.sign(
//     { admin_id: 1, role: 'admin' },
//     'mock_jwt_secret', // fallback secret for testing
//     { expiresIn: '7d' }
//   );

//   return res.status(200).json({
//     token,
//     message: 'Mock admin login successful'
//   });
// };

exports.getAllUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY user_id DESC');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Fetching users failed:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
