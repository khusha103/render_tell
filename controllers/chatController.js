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

exports.getMessages = async (req, res) => {
  const { user1, user2 } = req.query;

  if (!user1 || !user2) {
    return res.status(400).json({ error: 'user1 and user2 are required' });
  }

  try {
    const result = await pool.query(
      `
      SELECT 
        m.message_id,
        m.sender_id,
        m.receiver_id,
        m.content,
        m.content_hash,
        m.initialization_vector,
        m.auth_tag,
        m.media_url,
        m.message_type,
        m.is_encrypted,
        m.encryption_version,
        m.timestamp,
        m.status,
        m.reply_to_message_id,
        m.is_deleted,
        m.deleted_at,
        u1.name AS sender_name,
        u2.name AS receiver_name
      FROM messages m
      LEFT JOIN users u1 ON m.sender_id = u1.user_id
      LEFT JOIN users u2 ON m.receiver_id = u2.user_id
      WHERE 
        (m.sender_id = $1 AND m.receiver_id = $2)
        OR 
        (m.sender_id = $2 AND m.receiver_id = $1)
      ORDER BY m.timestamp ASC
      `,
      [user1, user2]
    );

    res.json({ messages: result.rows });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
};

exports.getPrivateMessages = async (req, res) => {
  const { user_id, other_user_id } = req.query;

  // Validate required query parameters
  if (!user_id || !other_user_id) {
    return res.status(400).json({ error: 'Missing required query parameters: user_id, other_user_id' });
  }

  try {
    const messages = await chatModel.getPrivateMessages(user_id, other_user_id); // Ensure chatModel is defined
    // Parse text field if it's JSON (e.g., encrypted content or media)
    const parsedMessages = messages.map(msg => {
      try {
        msg.text = JSON.parse(msg.text);
      } catch (e) {
        // If text isn't JSON, keep it as is
      }
      return msg;
    });
    res.status(200).json({ message: 'Private messages retrieved', data: parsedMessages });
  } catch (err) {
    console.error('Error in get-private-messages API:', err);
    res.status(500).json({ error: 'Failed to retrieve private messages' });
  }
};