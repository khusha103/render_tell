// const pool = require('../config/db');

// exports.insertMessage = async ({ senderId, receiverId, groupId = null, content, messageType = 'text', mediaUrl = null }) => {
//   const result = await pool.query(
//     `INSERT INTO messages (sender_id, receiver_id, group_id, content, media_url, message_type, status)
//      VALUES ($1, $2, $3, $4, $5, $6, $7)
//      RETURNING *`,
//     [senderId, receiverId, groupId, content, mediaUrl, messageType, 'sent']
//   );

//   return result.rows[0];
// };

// models/ChatModel.js
const pool = require('../config/db');

const chatModel = {
  /**
   * Save a new encrypted chat message
   * @param {Object} message
   * @param {number} message.sender_id
   * @param {number} message.receiver_id
   * @param {number|null} message.group_id
   * @param {string} message.content
   * @param {string} message.content_hash
   * @param {string} message.initialization_vector
   * @param {string} message.auth_tag
   * @param {string|null} message.media_url
   * @param {string} message.message_type
   * @param {boolean} [message.is_encrypted=true]
   * @param {string} [message.encryption_version='1.0']
   * @param {string} [message.status='sent']
   * @param {number|null} [message.reply_to_message_id]
   */
  async saveMessage({
    sender_id,
    receiver_id,
    group_id = null,
    content,
    content_hash,
    initialization_vector,
    auth_tag,
    media_url = null,
    message_type,
    is_encrypted = true,
    encryption_version = '1.0',
    status = 'sent',
    reply_to_message_id = null
  }) {
    const query = `
      INSERT INTO messages (
        sender_id,
        receiver_id,
        group_id,
        content,
        content_hash,
        initialization_vector,
        auth_tag,
        media_url,
        message_type,
        is_encrypted,
        encryption_version,
        status,
        reply_to_message_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;

    const values = [
      sender_id,
      receiver_id,
      group_id,
      content,
      content_hash,
      initialization_vector,
      auth_tag,
      media_url,
      message_type,
      is_encrypted,
      encryption_version,
      status,
      reply_to_message_id
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  }
};

module.exports = chatModel;

