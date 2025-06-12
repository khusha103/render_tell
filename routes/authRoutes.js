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
              background: linear-gradient(135deg, #ff4757 0%, #ff3742 50%, #c44569 100%);
              padding: 20px;
              min-height: 100vh;
            }
            
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 20px;
              overflow: hidden;
              box-shadow: 0 20px 40px rgba(255, 71, 87, 0.3);
              border: 2px solid rgba(255, 255, 255, 0.9);
            }
            
            .header {
              background: linear-gradient(135deg, #ff4757 0%, #ff3742 50%, #c44569 100%);
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
              color: rgba(255,255,255,0.95);
              font-size: 1.1em;
              font-weight: 300;
            }
            
            .content {
              padding: 50px 40px;
              text-align: center;
              background: #ffffff;
            }
            
            .welcome-text {
              font-size: 1.4em;
              color: #2c3e50;
              margin-bottom: 30px;
              line-height: 1.6;
            }
            
            .otp-container {
              background: linear-gradient(135deg, #ff4757 0%, #ff3742 100%);
              border-radius: 15px;
              padding: 30px;
              margin: 30px 0;
              position: relative;
              overflow: hidden;
              box-shadow: 0 10px 30px rgba(255, 71, 87, 0.3);
            }
            
            .otp-container::before {
              content: '';
              position: absolute;
              top: -2px;
              left: -2px;
              right: -2px;
              bottom: -2px;
              background: linear-gradient(45deg, #ff4757, #ff3742, #ffffff, #ff4757);
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
              background: #ffffff;
              color: #ff4757;
              font-size: 2.5em;
              font-weight: 700;
              padding: 20px 40px;
              border-radius: 10px;
              letter-spacing: 8px;
              display: inline-block;
              box-shadow: 0 8px 25px rgba(0,0,0,0.15);
              border: 3px solid rgba(255, 255, 255, 0.9);
            }
            
            .expiry-info {
              background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
              border-radius: 10px;
              padding: 20px;
              margin: 30px 0;
              border-left: 4px solid #ff4757;
              box-shadow: 0 4px 15px rgba(255, 71, 87, 0.1);
            }
            
            .expiry-info h3 {
              color: #ff4757;
              margin-bottom: 10px;
              font-size: 1.1em;
              font-weight: 600;
            }
            
            .expiry-info p {
              color: #2c3e50;
              font-size: 0.95em;
              line-height: 1.5;
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
            
            /* Red accent elements */
            .welcome-text strong {
              color: #ff4757;
            }
            
            .expiry-info strong {
              color: #ff4757;
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
