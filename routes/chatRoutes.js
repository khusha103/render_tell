const express = require('express');
const router = express.Router();
const { createChat, getChats, sendMessage, getMessages } = require('../controllers/chatController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/', verifyToken, createChat);
router.get('/', verifyToken, getChats);
router.post('/message', verifyToken, sendMessage);
router.get('/:chatId/messages', verifyToken, getMessages);

module.exports = router;