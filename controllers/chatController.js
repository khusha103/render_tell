const { insertMessage } = require('../models/ChatModel');
const { encryptAES } = require('../utils/encryption');

exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, groupId, content, messageType = 'text', mediaUrl } = req.body;

    if (!senderId || (!receiverId && !groupId) || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const encryptedContent = encryptAES(content);

    const message = await insertMessage({
      senderId,
      receiverId,
      groupId,
      content: encryptedContent,
      messageType,
      mediaUrl
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
