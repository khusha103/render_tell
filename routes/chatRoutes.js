const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/send', chatController.sendMessage);
router.get('/messages', chatController.getMessages);

router.get('/protptype_messages', chatController.getProtptype_Messages);

module.exports = router;
