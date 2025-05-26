const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Chat = require('./Chat');

const Message = sequelize.define('Message', {
  content: { type: DataTypes.TEXT, allowNull: false },
});

Message.belongsTo(User);
Message.belongsTo(Chat);

module.exports = Message;