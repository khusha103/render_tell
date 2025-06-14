const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/send', chatController.sendMessage);
router.get('/messages', chatController.getMessages);
// GET /api/chats/prototype/get-private-messages
router.get('/prototype/get-private-messages', chatController.getPrivateMessages);

module.exports = router;
