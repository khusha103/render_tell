const express = require('express');
const router = express.Router();
const pool = require('../config/db');
// const multer = require('multer');
const path = require('path');
const fs = require('fs');
const upload = require('../middlewares/upload'); // import upload middleware


// Create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads/users');
fs.mkdirSync(uploadDir, { recursive: true });

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


// router.post('/', upload.single('profile_picture'), async (req, res) => {
//   const { phone_number, name } = req.body;
//   const file = req.file;
  
//   // Serve full URL if file exists
//   const profile_picture_url = file 
//     ? `${req.protocol}://${req.get('host')}/uploads/users/${file.filename}`
//     : null;

//   if (!phone_number) {
//     if (file) {
//       fs.unlink(path.join(uploadDir, file.filename), (err) => {
//         if (err) console.error('Error deleting file:', err.message);
//       });
//     }
//     return res.status(400).json({ message: 'Phone number is required' });
//   }

//   try {
//     const result = await pool.query('SELECT * FROM users WHERE phone_number = $1', [phone_number]);

//     if (result.rows.length > 0) {
//       await pool.query(
//         `UPDATE users 
//          SET name = COALESCE($1, name), 
//              profile_picture_url = COALESCE($2, profile_picture_url) 
//          WHERE phone_number = $3`,
//         [name, profile_picture_url, phone_number]
//       );
//       return res.status(200).json({ message: 'User updated', profile_picture_url });
//     } else {
//       if (file) {
//         fs.unlink(path.join(uploadDir, file.filename), (err) => {
//           if (err) console.error('Error deleting file:', err.message);
//         });
//       }
//       return res.status(404).json({ message: 'User not found. Cannot update.' });
//     }
//   } catch (err) {
//     console.error('Error updating user:', err.message);
//     if (file) {
//       fs.unlink(path.join(uploadDir, file.filename), (err) => {
//         if (err) console.error('Error deleting file after server error:', err.message);
//       });
//     }
//     return res.status(500).json({ message: 'Server error' });
//   }
// });



router.post('/', upload.single('profile_picture'), async (req, res) => {
  const { user_id, name } = req.body;
  const file = req.file;

  // Serve full URL if file exists
  const profile_picture_url = file 
    ? `${req.protocol}://${req.get('host')}/uploads/users/${file.filename}`
    : null;

  if (!user_id) {
    if (file) {
      fs.unlink(path.join(uploadDir, file.filename), (err) => {
        if (err) console.error('Error deleting file:', err.message);
      });
    }
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);

    if (result.rows.length > 0) {
      await pool.query(
        `UPDATE users 
         SET name = COALESCE($1, name), 
             profile_picture_url = COALESCE($2, profile_picture_url) 
         WHERE user_id = $3`,
        [name, profile_picture_url, user_id]
      );
      return res.status(200).json({ message: 'User updated', profile_picture_url });
    } else {
      if (file) {
        fs.unlink(path.join(uploadDir, file.filename), (err) => {
          if (err) console.error('Error deleting file:', err.message);
        });
      }
      return res.status(404).json({ message: 'User not found. Cannot update.' });
    }
  } catch (err) {
    console.error('Error updating user:', err.message);
    if (file) {
      fs.unlink(path.join(uploadDir, file.filename), (err) => {
        if (err) console.error('Error deleting file after server error:', err.message);
      });
    }
    return res.status(500).json({ message: 'Server error' });
  }
});


// 🟢 GET public key by user_id only
router.get('/profile', async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ message: 'user_id is required' });
  }

  try {
    const result = await pool.query(
      'SELECT public_key, phone_number FROM users WHERE user_id = $1',
      [user_id]
    );

    

    if (result.rows.length === 0 || !result.rows[0].public_key) {
      return res.status(404).json({ message: 'Public key not found' });
    }

    return res.status(200).json({ publicKeyHex: result.rows[0].public_key,phone_number: result.rows[0].phone_number });
  } catch (err) {
    console.error('Error fetching public key:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// router.get('/profile', async (req, res) => {
//   const { phone_number } = req.query;

//   if (!phone_number) {
//     return res.status(400).json({ message: 'phone_number is required' });
//   }

//   try {
//     const result = await pool.query(
//       'SELECT public_key, user_id FROM users WHERE phone_number = $1',
//       [phone_number]
//     );

    

//     if (result.rows.length === 0 || !result.rows[0].public_key) {
//       return res.status(404).json({ message: 'Public key not found' });
//     }

//     return res.status(200).json({ publicKeyHex: result.rows[0].public_key,user_id: result.rows[0].user_id });
//   } catch (err) {
//     console.error('Error fetching public key:', err.message);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// });


router.post('/profile_by_mb', async (req, res) => {
  const { phone_number } = req.body;

  if (!phone_number) {
    return res.status(400).json({ message: 'phone_number is required' });
  }

  try {
    const result = await pool.query(
      'SELECT public_key, user_id FROM users WHERE phone_number = $1',
      [phone_number]
    );

    if (result.rows.length === 0 || !result.rows[0].public_key) {
      return res.status(404).json({ message: 'Public key not found' });
    }

    return res.status(200).json({ 
      publicKeyHex: result.rows[0].public_key,
      user_id: result.rows[0].user_id 
    });
  } catch (err) {
    console.error('Error fetching public key:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/profile_by_userid', async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: 'user_id is required' });
  }

  try {
    const result = await pool.query(
      'SELECT public_key, phone_number FROM users WHERE user_id = $1',
      [user_id]
    );

    if (result.rows.length === 0 || !result.rows[0].public_key) {
      return res.status(404).json({ message: 'Public key not found' });
    }

    return res.status(200).json({ 
      publicKeyHex: result.rows[0].public_key,
      phone_number: result.rows[0].phone_number 
    });
  } catch (err) {
    console.error('Error fetching public key:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});



// 🟢 POST - Update public key by user_id
router.post('/update-public-key', async (req, res) => {
  const { user_id, public_key } = req.body;

  if (!user_id || !public_key) {
    return res.status(400).json({ message: 'user_id and public_key are required' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET public_key = $1, key_created_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING user_id',
      [public_key, user_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: 'Public key updated successfully' });
  } catch (err) {
    console.error('Error updating public key:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


module.exports = router;

