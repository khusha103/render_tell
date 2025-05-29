
// socket/index.js
const crypto = require('crypto');
const AES_SECRET = crypto.randomBytes(32).toString('hex').slice(0, 32);
const chatModel = require('../models/ChatModel');

const algorithm = 'aes-256-cbc';

function decryptMessage(encryptedData) {
  const { iv, encryptedText } = encryptedData;

  const decipher = crypto.createDecipheriv(algorithm, AES_SECRET, Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('send_message', async (data) => {
      try {
        const { encryptedMessage, senderId, receiverId } = data;
        const decrypted = decryptMessage(encryptedMessage);

        await chatModel.saveMessage({
          sender_id: senderId,
          receiver_id: receiverId,
          content: decrypted,
          message_type: 'text',
          status: 'sent'
        });

        io.emit('receive_message', {
          senderId,
          receiverId,
          message: decrypted
        });

      } catch (err) {
        console.error('Error in decrypting/saving message:', err);
        socket.emit('error', 'Message processing failed');
      }
    });
  });
}

module.exports = { setupSocket };
