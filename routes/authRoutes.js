// routes/authRoutes.js

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const dayjs = require('dayjs');
// const pool = require('../db'); // Adjust the path based on where your pool is defined
const pool = require('../config/db');
const nodemailer = require('nodemailer');

// Helper function to generate secure OTP
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}



// Configure nodemailer transporter (example using Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,  // ✅ Loaded from .env
    pass: process.env.EMAIL_PASS,  // ✅ Loaded from .env
  },
});

// // ---------- Send OTP ----------
// router.post('/send-otp', async (req, res) => {
//   const { phone_number } = req.body;
//   console.log('Incoming body:', req.body);

//   if (!phone_number) {
//     return res.status(400).json({ status: false, message: 'Phone number is required' });
//   }

//   const client = await pool.connect();

//   try {
//     const otp = generateOTP();
//     const expiresAt = dayjs().add(5, 'minute').toISOString();

//     await client.query('BEGIN');

//     const userResult = await client.query(
//       'SELECT * FROM users WHERE phone_number = $1',
//       [phone_number]
//     );

//     if (userResult.rows.length === 0) {
//       await client.query(
//         'INSERT INTO users (name, phone_number) VALUES ($1, $2)',
//         ['User', phone_number]
//       );
//     } else {
//       await client.query(
//         'UPDATE users SET status = $1 WHERE phone_number = $2',
//         ['pending_otp', phone_number]
//       );
//     }

//     await client.query(
//       `INSERT INTO otp_requests (phone_number, otp_code, expires_at)
//        VALUES ($1, $2, $3)
//        ON CONFLICT (phone_number)
//        DO UPDATE SET
//          otp_code = EXCLUDED.otp_code,
//          is_verified = false,
//          created_at = CURRENT_TIMESTAMP,
//          expires_at = EXCLUDED.expires_at`,
//       [phone_number, otp, expiresAt]
//     );

//     await client.query('COMMIT');

//     console.log(`Sending OTP ${otp} to ${phone_number}`);

//     res.status(200).json({
//       status: true,
//       message: 'OTP sent successfully',
//       phone_number,
//     });
//   } catch (error) {
//     await client.query('ROLLBACK');
//     console.error('Error sending OTP:', error);
//     res.status(500).json({ status: false, message: 'Internal server error' });
//   } finally {
//     client.release();
//   }
// });




router.post('/send-otp', async (req, res) => {
  const { phone_number, email } = req.body;
  console.log('Incoming body:', req.body);

  // console.log("phone_number",phone_number);
  // console.log("email",email);


  // // Validate inputs
  // if (!phone_number && !email) {
  //   return res.status(400).json({ status: false, message: 'Phone number and email are required' });
  // }

  //  console.log("phone_number:", phone_number);
  // console.log("email:", email);

  // Validate inputs - both must be provided
  if (!phone_number) {
    return res.status(400).json({ status: false, message: 'Phone number is required' });
  }
  if (!email) {
    return res.status(400).json({ status: false, message: 'Email is required' });
  }

   // ✅ Validate phone number format: must be 10 digits (India format, no country code)
  if (phone_number && !/^\d{10}$/.test(phone_number)) {
    return res.status(400).json({ status: false, message: 'Phone number must be exactly 10 digits' });
  }

  // Validate country code format (e.g., +1, +91, etc.)
  // if (!/^\+\d{1,3}$/.test(country_code)) {
  //   return res.status(400).json({ status: false, message: 'Invalid country code format' });
  // }

  // Hardcoded country code
  const country_code = '+91';

  // Combine country code with phone number
  const full_phone_number = `${country_code}${phone_number}`;

  const client = await pool.connect();

  try {
    const otp = generateOTP();
    const expiresAt = dayjs().add(5, 'minute').toISOString();

    await client.query('BEGIN');

    // Check if user exists based on full_phone_number or email
    const userResult = await client.query(
      `SELECT * FROM users WHERE phone_number = $1 OR email = $2`,
      [full_phone_number || null, email || null]
    );

    if (userResult.rows.length === 0) {
      // Insert new user if not exists
      await client.query(
        `INSERT INTO users (name, phone_number, email, status) VALUES ($1, $2, $3, $4)`,
        ['User', full_phone_number, email, 'pending_otp']
      );
    } else {
      // Update existing user
      await client.query(
        `UPDATE users SET phone_number = $1, email = $2, status = $3 WHERE user_id = $4`,
        [
          full_phone_number || userResult.rows[0].phone_number,
          email || userResult.rows[0].email,
          'pending_otp',
          userResult.rows[0].user_id,
        ]
      );
    }

    // Insert or update OTP in otp_requests table
    await client.query(
      `INSERT INTO otp_requests (phone_number, otp_code, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (phone_number)
       DO UPDATE SET
         otp_code = EXCLUDED.otp_code,
         is_verified = false,
         created_at = CURRENT_TIMESTAMP,
         expires_at = EXCLUDED.expires_at`,
      [full_phone_number, otp, expiresAt]
    );

    await client.query('COMMIT');

    // ====================== SEND OTP ======================

    // Example: Send OTP via SMS (currently commented)
    /*
    console.log(`Sending OTP ${otp} to ${full_phone_number} via SMS`);
    await sendSMSToNumber(full_phone_number, `Your OTP is: ${otp}`);
    */

    // Send OTP via Email (if email provided) with Creative Template
    if (email) {
      const htmlTemplate = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>TellDemm - Your OTP Code</title>
          <style>
            /* ... (same styles as in original code) ... */
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="logo">
                <h1>TellDemm</h1>
                <p>Connect • Chat • Share</p>
              </div>
            </div>
            <div class="content">
              <div class="welcome-text">
                <strong>Welcome to TellDemm!</strong><br>
                Your verification code for ${full_phone_number} is ready 🚀
              </div>
              <div class="otp-container pulse">
                <div class="otp-label">Your Verification Code</div>
                <div class="otp-code">${otp}</div>
              </div>
              <div class="expiry-info">
                <h3>⏰ Time Sensitive</h3>
                <p>This code will expire in <strong>5 minutes</strong>. Please use it immediately to complete your authentication.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"TellDemm Team" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔐 Your TellDemm Verification Code',
        html: htmlTemplate,
        text: `
Welcome to TellDemm!

Your verification code for ${full_phone_number} is: ${otp}

This code will expire in 5 minutes. Please use it immediately to complete your authentication.

Security Reminder:
- Never share this code with anyone
- TellDemm will never ask for your OTP via phone or email
- If you didn't request this code, please ignore this email

Thanks for choosing TellDemm!
The TellDemm Team
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Sent creative OTP email to ${email} with code: ${otp}`);
    }

    res.status(200).json({
      status: true,
      message: 'OTP sent successfully',
      phone_number: full_phone_number,
      email,
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
