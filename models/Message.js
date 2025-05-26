// const { DataTypes } = require('sequelize');
// const { sequelize } = require('../config/db');
// const User = require('./User');
// const Chat = require('./Chat');

// const Message = sequelize.define('Message', {
//   content: { type: DataTypes.TEXT, allowNull: false },
// });

// Message.belongsTo(User);
// Message.belongsTo(Chat);

// module.exports = Message;

const { pool } = require('../config/db');

const Message = {
  async create({ content, userId, chatId }) {
    const result = await pool.query(
      `INSERT INTO messages (content, user_id, chat_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [content, userId, chatId]
    );
    return result.rows[0];
  },

  async getMessagesForChat(chatId) {
    const result = await pool.query(
      `SELECT m.*, u.name as user_name
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.chat_id = $1
       ORDER BY m.created_at ASC`,
      [chatId]
    );
    return result.rows;
  },

  // Optionally add update, delete methods
};

module.exports = Message;
