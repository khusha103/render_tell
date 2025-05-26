const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

exports.createChat = async (req, res) => {
  const { userIds, isGroup, name } = req.body;
  const chat = await Chat.create({ isGroup, name });
  const users = await User.findAll({ where: { id: userIds } });
  await chat.setUsers(users);
  res.json(chat);
};

exports.getChats = async (req, res) => {
  const user = await User.findByPk(req.userId);
  const chats = await user.getChats({ include: [User] });
  res.json(chats);
};

exports.sendMessage = async (req, res) => {
  const { chatId, content } = req.body;
  const message = await Message.create({ content, UserId: req.userId, ChatId: chatId });
  res.json(message);
};

exports.getMessages = async (req, res) => {
  const messages = await Message.findAll({ where: { ChatId: req.params.chatId } });
  res.json(messages);
};