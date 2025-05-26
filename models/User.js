// const { DataTypes } = require('sequelize');
// const { sequelize } = require('../config/db');

// const User = sequelize.define('User', {
//   username: { type: DataTypes.STRING, unique: true, allowNull: false },
//   password: { type: DataTypes.STRING, allowNull: false },
// });

// module.exports = User;

const { pool } = require('../config/db');

const User = {
  async create({ username, password }) {
    const result = await pool.query(
      `INSERT INTO users (username, password)
       VALUES ($1, $2)
       RETURNING *`,
      [username, password]
    );
    return result.rows[0];
  },

  async findByUsername(username) {
    const result = await pool.query(
      `SELECT * FROM users WHERE username = $1`,
      [username]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await pool.query(
      `SELECT * FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  },

  // Optional: updateUser, deleteUser, listUsers...
};

module.exports = User;
