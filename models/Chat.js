// const { DataTypes } = require('sequelize');
// const { sequelize } = require('../config/db');
// const User = require('./User');

// const Chat = sequelize.define('Chat', {
//   name: { type: DataTypes.STRING },
//   isGroup: { type: DataTypes.BOOLEAN, defaultValue: false },
// });

// Chat.belongsToMany(User, { through: 'ChatUsers' });
// User.belongsToMany(Chat, { through: 'ChatUsers' });

// module.exports = Chat;

const { pool } = require('../config/db');

const Chat = {
  async create({ name, isGroup }) {
    const result = await pool.query(
      'INSERT INTO chats (name, is_group) VALUES ($1, $2) RETURNING *',
      [name, isGroup]
    );
    return result.rows[0];
  },

  async addUsers(chatId, userIds) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const userId of userIds) {
        await client.query(
          'INSERT INTO chat_users (chat_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [chatId, userId]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async getChatsForUser(userId) {
    const result = await pool.query(
      `SELECT c.* FROM chats c
       JOIN chat_users cu ON c.id = cu.chat_id
       WHERE cu.user_id = $1`,
      [userId]
    );
    return result.rows;
  },

  // Add more methods as needed
};

module.exports = Chat;
