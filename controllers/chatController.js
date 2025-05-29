const chatModel = require('../models/ChatModel');

exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, groupId, content, messageType, mediaUrl } = req.body;

    if (!senderId || (!receiverId && !groupId) || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const message = await chatModel.insertMessage({
      senderId,
      receiverId,
      groupId,
      content,
      messageType,
      mediaUrl
    });

    res.status(201).json({ message: 'Message sent', data: message });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
