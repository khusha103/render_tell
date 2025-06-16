// chatController.js
const { insertMessage } = require('../models/ChatModel');
const pool = require('../config/db');

exports.sendMessage = async (req, res) => {
  try {
    const {
      senderId,
      receiverPhoneNumber,
      groupId,
      encryptedMessage,
      messageType = 'text',
      mediaUrl
    } = req.body;

    if (!senderId || (!receiverPhoneNumber && !groupId) || !encryptedMessage) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

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

exports.getPrototypeMessages = async (req, res) => {
  const { senderId, receiverId, limit = 50, offset = 0 } = req.body;

  // Validate required fields
  if (!senderId || !receiverId) {
    return res.status(400).json({ error: 'senderId and receiverId are required' });
  }

  // Validate limit and offset
  const parsedLimit = parseInt(limit);
  const parsedOffset = parseInt(offset);
  if (isNaN(parsedLimit) || parsedLimit < 1 || isNaN(parsedOffset) || parsedOffset < 0) {
    return res.status(400).json({ error: 'Invalid limit or offset' });
  }

  try {
    const result = await pool.query(
      `
      SELECT 
        *
      FROM prototype_messages
      WHERE 
        type = 'private'
        AND (
          (sender_id = $1 AND receiver_id = $2)
          OR 
          (sender_id = $2 AND receiver_id = $1)
        )
      ORDER BY timestamp ASC
      LIMIT $3 OFFSET $4
      `,
      [senderId, receiverId, parsedLimit, parsedOffset]
    );

    res.json({ messages: result.rows });
  } catch (err) {
    console.error('Error fetching prototype messages:', err);
    res.status(500).json({ error: 'Failed to retrieve prototype messages' });
  }
};