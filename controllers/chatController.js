// const { insertMessage } = require('../models/ChatModel');
// const pool = require('../config/db');
// const { encryptAES } = require('../utils/encryption');

// exports.sendMessage = async (req, res) => {
//   try {
//     const { senderId, receiverPhoneNumber, groupId, content, messageType = 'text', mediaUrl } = req.body;

//     if (!senderId || (!receiverPhoneNumber && !groupId) || !content) {
//       return res.status(400).json({ error: 'Missing required fields' });
//     }

//     // 🔍 Lookup receiverId from phone number
//     let receiverId = null;
//     if (receiverPhoneNumber) {
//       const receiverResult = await pool.query(
//         'SELECT user_id FROM users WHERE phone_number = $1',
//         [receiverPhoneNumber]
//       );

//       if (receiverResult.rows.length === 0) {
//         return res.status(404).json({ error: 'Receiver not found' });
//       }

//       receiverId = receiverResult.rows[0].user_id;
//     }

//     const encryptedContent = encryptAES(content);

//     const message = await insertMessage({
//       senderId,
//       receiverId,
//       groupId,
//       content: encryptedContent,
//       messageType,
//       mediaUrl
//     });

//     res.status(201).json({ success: true, message });
//   } catch (error) {
//     console.error('Error sending message:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };


const { insertMessage } = require('../models/ChatModel');
const pool = require('../config/db');

exports.sendMessage = async (req, res) => {
  try {
    const {
      senderId,
      receiverPhoneNumber,
      groupId,
      encryptedMessage, // Expect this from client (already encrypted content)
      messageType = 'text',
      mediaUrl
    } = req.body;

    if (!senderId || (!receiverPhoneNumber && !groupId) || !encryptedMessage) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 🔍 Lookup receiverId from phone number
    let receiverId = null;
    if (receiverPhoneNumber) {
      const receiverResult = await pool.query(
        'SELECT user_id FROM users WHERE phone_number = $1',
        [receiverPhoneNumber]
      );

      if (receiverResult.rows.length === 0) {
        return res.status(404).json({ error: 'Receiver not found' });
      }

      receiverId = receiverResult.rows[0].user_id;
    }

    // Store encrypted content as stringified JSON (e.g., { iv, encryptedText })
    const encryptedContent = JSON.stringify(encryptedMessage);

    const message = await insertMessage({
      senderId,
      receiverId,
      groupId,
      content: encryptedContent,
      messageType,
      mediaUrl
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

