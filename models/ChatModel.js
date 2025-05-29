const pool = require('../config/db');

exports.insertMessage = async ({ senderId, receiverId, groupId = null, content, messageType = 'text', mediaUrl = null }) => {
  const result = await pool.query(
    `INSERT INTO messages (sender_id, receiver_id, group_id, content, media_url, message_type, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [senderId, receiverId, groupId, content, mediaUrl, messageType, 'sent']
  );

  return result.rows[0];
};
