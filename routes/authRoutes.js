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

  if (!phone_number && !email) {
    return res.status(400).json({ status: false, message: 'Phone number or email is required' });
  }

  const client = await pool.connect();

  try {
    const otp = generateOTP();
    const expiresAt = dayjs().add(5, 'minute').toISOString();

    await client.query('BEGIN');

    // Check if user exists based on phone_number or email
    const userResult = await client.query(
      `SELECT * FROM users WHERE phone_number = $1 OR email = $2`,
      [phone_number || null, email || null]
    );

    if (userResult.rows.length === 0) {
      // Insert new user if not exists
      await client.query(
        `INSERT INTO users (name, phone_number, email, status) VALUES ($1, $2, $3, $4)`,
        ['User', phone_number, email, 'pending_otp']
      );
    } else {
      // ✅ Use user_id instead of id
      await client.query(
        `UPDATE users SET phone_number = $1, email = $2, status = $3 WHERE user_id = $4`,
        [
          phone_number || userResult.rows[0].phone_number,
          email || userResult.rows[0].email,
          'pending_otp',
          userResult.rows[0].user_id, // ✅ Correct column
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
      [phone_number, otp, expiresAt]
    );

    await client.query('COMMIT');

    // ====================== SEND OTP ======================

    // Example: Send OTP via SMS (currently commented)
    /*
    console.log(`Sending OTP ${otp} to ${phone_number} via SMS`);
    await sendSMSToNumber(phone_number, `Your OTP is: ${otp}`);
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
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 20px;
              min-height: 100vh;
            }
            
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 20px;
              overflow: hidden;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 40px 30px;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            
            .header::before {
              content: '';
              position: absolute;
              top: -50%;
              left: -50%;
              width: 200%;
              height: 200%;
              background: repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(255,255,255,0.1) 10px,
                rgba(255,255,255,0.1) 20px
              );
              animation: slide 20s linear infinite;
            }
            
            @keyframes slide {
              0% { transform: translateX(-50px) translateY(-50px); }
              100% { transform: translateX(50px) translateY(50px); }
            }
            
            .logo {
              position: relative;
              z-index: 2;
            }
            
            .logo h1 {
              color: #ffffff;
              font-size: 2.5em;
              font-weight: 700;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
              margin-bottom: 10px;
            }
            
            .logo p {
              color: rgba(255,255,255,0.9);
              font-size: 1.1em;
              font-weight: 300;
            }
            
            .content {
              padding: 50px 40px;
              text-align: center;
            }
            
            .welcome-text {
              font-size: 1.4em;
              color: #333;
              margin-bottom: 30px;
              line-height: 1.6;
            }
            
            .otp-container {
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              border-radius: 15px;
              padding: 30px;
              margin: 30px 0;
              position: relative;
              overflow: hidden;
            }
            
            .otp-container::before {
              content: '';
              position: absolute;
              top: -2px;
              left: -2px;
              right: -2px;
              bottom: -2px;
              background: linear-gradient(45deg, #667eea, #764ba2, #f093fb, #f5576c);
              border-radius: 15px;
              z-index: -1;
              animation: rotate 4s linear infinite;
            }
            
            @keyframes rotate {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            
            .otp-label {
              color: #ffffff;
              font-size: 1.2em;
              margin-bottom: 15px;
              font-weight: 600;
              text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
            }
            
            .otp-code {
              background: rgba(255,255,255,0.95);
              color: #333;
              font-size: 2.5em;
              font-weight: 700;
              padding: 20px 40px;
              border-radius: 10px;
              letter-spacing: 8px;
              display: inline-block;
              box-shadow: 0 8px 25px rgba(0,0,0,0.15);
              border: 3px solid rgba(255,255,255,0.3);
            }
            
            .expiry-info {
              background: #f8f9fa;
              border-radius: 10px;
              padding: 20px;
              margin: 30px 0;
              border-left: 4px solid #ffc107;
            }
            
            .expiry-info h3 {
              color: #856404;
              margin-bottom: 10px;
              font-size: 1.1em;
            }
            
            .expiry-info p {
              color: #6c757d;
              font-size: 0.95em;
              line-height: 1.5;
            }
            
            .security-note {
              background: linear-gradient(135deg, #e3f2fd 0%, #f1f8e9 100%);
              border-radius: 10px;
              padding: 25px;
              margin: 30px 0;
              text-align: left;
            }
            
            .security-note h3 {
              color: #1976d2;
              margin-bottom: 15px;
              font-size: 1.2em;
              display: flex;
              align-items: center;
            }
            
            .shield-icon {
              width: 24px;
              height: 24px;
              margin-right: 10px;
            }
            
            .security-note ul {
              color: #424242;
              padding-left: 20px;
              line-height: 1.6;
            }
            
            .security-note li {
              margin-bottom: 8px;
            }
            
            .footer {
              background: #2c3e50;
              color: #ecf0f1;
              padding: 30px;
              text-align: center;
            }
            
            .footer h3 {
              margin-bottom: 15px;
              font-size: 1.3em;
            }
            
            .footer p {
              font-size: 0.9em;
              line-height: 1.6;
              opacity: 0.8;
            }
            
            .social-links {
              margin-top: 20px;
            }
            
            .social-links a {
              display: inline-block;
              margin: 0 10px;
              padding: 10px;
              background: rgba(255,255,255,0.1);
              border-radius: 8px;
              color: #ecf0f1;
              text-decoration: none;
              transition: background 0.3s ease;
            }
            
            .social-links a:hover {
              background: rgba(255,255,255,0.2);
            }
            
            @media (max-width: 600px) {
              body {
                padding: 10px;
              }
              
              .content {
                padding: 30px 20px;
              }
              
              .otp-code {
                font-size: 2em;
                padding: 15px 25px;
                letter-spacing: 4px;
              }
              
              .header {
                padding: 30px 20px;
              }
              
              .logo h1 {
                font-size: 2em;
              }
            }
            
            .pulse {
              animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.05); }
              100% { transform: scale(1); }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <!-- Header Section -->
            <div class="header">
              <div class="logo">
                <h1>TellDemm</h1>
                <p>Connect • Chat • Share</p>
              </div>
            </div>
            
            <!-- Content Section -->
            <div class="content">
              <div class="welcome-text">
                <strong>Welcome to TellDemm!</strong><br>
                Your verification code is ready 🚀
              </div>
              
              <!-- OTP Container -->
              <div class="otp-container pulse">
                <div class="otp-label">Your Verification Code</div>
                <div class="otp-code">${otp}</div>
              </div>
              
              <!-- Expiry Information -->
              <div class="expiry-info">
                <h3>⏰ Time Sensitive</h3>
                <p>This code will expire in <strong>5 minutes</strong>. Please use it immediately to complete your authentication.</p>
              </div>
              
              <!-- Security Note -->
              <div class="security-note">
                <h3>
                  <svg class="shield-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10.5V11.5C15.4,11.5 16,12.4 16,13V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V13C8,12.4 8.4,11.5 9,11.5V10.5C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,8.7 10.2,10.5V11.5H13.8V10.5C13.8,8.7 12.8,8.2 12,8.2Z"/>
                  </svg>
                  Security Reminder
                </h3>
                <ul>
                  <li>Never share this code with anyone</li>
                  <li>TellDemm will never ask for your OTP via phone or email</li>
                  <li>If you didn't request this code, please ignore this email</li>
                  <li>This code is only valid for account verification</li>
                </ul>
              </div>
            </div>
            
            <!-- Footer Section -->
            <div class="footer">
              <h3>Thanks for choosing TellDemm!</h3>
              <p>
                We're excited to have you join our community. If you have any questions or need help, 
                don't hesitate to reach out to our support team.
              </p>
              <div class="social-links">
                <a href="#">📧 Support</a>
                <a href="#">🌐 Website</a>
                <a href="#">📱 Mobile App</a>
              </div>
              <p style="margin-top: 20px; font-size: 0.8em;">
                © 2025 TellDemm. All rights reserved.<br>
                This is an automated message, please do not reply to this email.
              </p>
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
        // Fallback text version
        text: `
Welcome to TellDemm!

Your verification code is: ${otp}

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
      phone_number,
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
