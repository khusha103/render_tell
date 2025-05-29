
// // socket/index.js
// const crypto = require('crypto');
// const AES_SECRET = crypto.randomBytes(32).toString('hex').slice(0, 32);
// const chatModel = require('../models/ChatModel');

// const algorithm = 'aes-256-cbc';

// function decryptMessage(encryptedData) {
//   const { iv, encryptedText } = encryptedData;

//   const decipher = crypto.createDecipheriv(algorithm, AES_SECRET, Buffer.from(iv, 'hex'));
//   let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
//   decrypted += decipher.final('utf8');
//   return decrypted;
// }

// function setupSocket(io) {
//   io.on('connection', (socket) => {
//     console.log('User connected:', socket.id);

//     socket.on('send_message', async (data) => {
//       try {
//         const { encryptedMessage, senderId, receiverId } = data;
//         const decrypted = decryptMessage(encryptedMessage);

//         await chatModel.saveMessage({
//           sender_id: senderId,
//           receiver_id: receiverId,
//           content: decrypted,
//           message_type: 'text',
//           status: 'sent'
//         });

//         io.emit('receive_message', {
//           senderId,
//           receiverId,
//           message: decrypted
//         });

//       } catch (err) {
//         console.error('Error in decrypting/saving message:', err);
//         socket.emit('error', 'Message processing failed');
//       }
//     });
//   });
// }

// module.exports = { setupSocket };


// socket/index.js
const chatModel = require('../models/ChatModel');

function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('send_message', async (data) => {
      try {
        const { encryptedMessage, senderId, receiverId } = data;

        // 🛑 No decryption here — store encrypted text directly
        await chatModel.saveMessage({
          sender_id: senderId,
          receiver_id: receiverId,
          content: JSON.stringify(encryptedMessage), // Save encrypted as JSON
          message_type: 'text',
          status: 'sent'
        });

        // 🔁 Relay encrypted message to the intended recipient(s)
        io.emit('receive_message', {
          senderId,
          receiverId,
          encryptedMessage
        });

      } catch (err) {
        console.error('Error saving message:', err);
        socket.emit('error', 'Message delivery failed');
      }
    });
  });
}

module.exports = { setupSocket };
