const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Chat = sequelize.define('Chat', {
  name: { type: DataTypes.STRING },
  isGroup: { type: DataTypes.BOOLEAN, defaultValue: false },
});

Chat.belongsToMany(User, { through: 'ChatUsers' });
User.belongsToMany(Chat, { through: 'ChatUsers' });

module.exports = Chat;