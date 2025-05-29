// models/chatModel.js
const pool = require('../config/db');

async function saveMessage({ sender_id, receiver_id, content, message_type, status }) {
  const query = `
    INSERT INTO messages (sender_id, receiver_id, content, message_type, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [sender_id, receiver_id, content, message_type, status];
  const result = await pool.query(query, values);
  return result.rows[0];
}

module.exports = { saveMessage };
