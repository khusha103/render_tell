// routes/authRoutes.js

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const dayjs = require('dayjs');
// const pool = require('../db'); // Adjust the path based on where your pool is defined
const pool = require('../config/db');

// Helper function to generate secure OTP
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// ---------- Send OTP ----------
router.post('/send-otp', async (req, res) => {
  const { phone_number } = req.body;
  console.log('Incoming body:', req.body);

  if (!phone_number) {
    return res.status(400).json({ status: false, message: 'Phone number is required' });
  }

  const client = await pool.connect();

  try {
    const otp = generateOTP();
    const expiresAt = dayjs().add(5, 'minute').toISOString();

    await client.query('BEGIN');

    const userResult = await client.query(
      'SELECT * FROM users WHERE phone_number = $1',
      [phone_number]
    );

    if (userResult.rows.length === 0) {
      await client.query(
        'INSERT INTO users (name, phone_number) VALUES ($1, $2)',
        ['User', phone_number]
      );
    } else {
      await client.query(
        'UPDATE users SET status = $1 WHERE phone_number = $2',
        ['pending_otp', phone_number]
      );
    }

    await client.query(
      `INSERT INTO otp_requests (phone_number, otp_code, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (phone_number)
       DO UPDATE SET
         otp_code = EXCLUDED.otp_code,
         is_verified = false,
         created_at = CURRENT_TIMESTAMP,
         expires_at = EXCLUDED.expires_at`,
      [phone_number, otp, expiresAt]
    );

    await client.query('COMMIT');

    console.log(`Sending OTP ${otp} to ${phone_number}`);

    res.status(200).json({
      status: true,
      message: 'OTP sent successfully',
      phone_number,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error sending OTP:', error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// ---------- Verify OTP ----------
router.post('/verify-otp', async (req, res) => {
  const { phone_number, otp_code } = req.body;

  if (!phone_number || !otp_code) {
    return res.status(400).json({
      status: false,
      message: 'Phone number and OTP are required',
    });
  }

  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT * FROM otp_requests 
       WHERE phone_number = $1 
       AND otp_code = $2 
       AND is_verified = false 
       AND created_at >= NOW() - INTERVAL '10 minutes'`,
      [phone_number, otp_code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'Invalid or expired OTP',
      });
    }

    await client.query(
      `UPDATE otp_requests 
       SET is_verified = true 
       WHERE phone_number = $1 AND otp_code = $2`,
      [phone_number, otp_code]
    );

    // await client.query(
    //   `UPDATE users 
    //    SET status = $1 
    //    WHERE phone_number = $2`,
    //   ['verified', phone_number]
    // );

    await client.query(
      `UPDATE users 
       SET status = $1, last_seen = NOW() 
       WHERE phone_number = $2`,
      ['verified', phone_number]
    );


    const userResult = await client.query(
      `SELECT user_id FROM users WHERE phone_number = $1`,
      [phone_number]
    );

    const userId = userResult.rows[0]?.user_id;

    res.status(200).json({
      status: true,
      message: 'OTP verified successfully',
      user_id: userId,
    });

  } catch (err) {
    console.error('Error verifying OTP:', err.message);
    res.status(500).json({ status: false, message: 'Internal server error' });
  } finally {
    client.release();
  }
});


module.exports = router;
