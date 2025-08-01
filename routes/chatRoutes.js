//chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/send', chatController.sendMessage);
router.get('/messages', chatController.getMessages);
router.post('/prototype-messages', chatController.getPrototypeMessages);

module.exports = router;
