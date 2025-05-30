
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


// // socket/index.js
// const chatModel = require('../models/ChatModel');

// function setupSocket(io) {
//   io.on('connection', (socket) => {
//     console.log('User connected:', socket.id);

//     socket.on('send_message', async (data) => {
//       try {
//         const { encryptedMessage, senderId, receiverId } = data;

//         // 🛑 No decryption here — store encrypted text directly
//         await chatModel.saveMessage({
//           sender_id: senderId,
//           receiver_id: receiverId,
//           content: JSON.stringify(encryptedMessage), // Save encrypted as JSON
//           message_type: 'text',
//           status: 'sent'
//         });

//         // 🔁 Relay encrypted message to the intended recipient(s)
//         io.emit('receive_message', {
//           senderId,
//           receiverId,
//           encryptedMessage
//         });

//       } catch (err) {
//         console.error('Error saving message:', err);
//         socket.emit('error', 'Message delivery failed');
//       }
//     });
//   });
// }

// module.exports = { setupSocket };



const chatModel = require('../models/ChatModel');
const pool = require('../config/db'); // PostgreSQL pool

function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // socket.on('send_message', async (data) => {
    //   try {
    //     const {
    //       senderId,
    //       receiverPhoneNumber,
    //       encryptedMessage, // { iv, encryptedText, authTag (optional) }
    //       messageType = 'text',
    //       contentHash = null,
    //       mediaUrl = null,
    //       replyToMessageId = null,
    //       encryptionVersion = '1.0'
    //     } = data;

    //     // ✅ Step 1: Fetch receiver_id from phone number
    //     const receiverRes = await pool.query(
    //       'SELECT user_id FROM users WHERE phone_number = $1',
    //       [receiverPhoneNumber]
    //     );

    //     if (receiverRes.rowCount === 0) {
    //       return socket.emit('error', 'Receiver not found');
    //     }

    //     const receiverId = receiverRes.rows[0].user_id;

    //     // ✅ Step 2: Save message
    //     const savedMessage = await chatModel.saveMessage({
    //       sender_id: senderId,
    //       receiver_id: receiverId,
    //       group_id: null,
    //       content: encryptedMessage.encryptedText,
    //       content_hash: contentHash,
    //       initialization_vector: encryptedMessage.iv,
    //       auth_tag: encryptedMessage.authTag || null,
    //       media_url: mediaUrl,
    //       message_type: messageType,
    //       is_encrypted: true,
    //       encryption_version: encryptionVersion,
    //       status: 'sent',
    //       reply_to_message_id: replyToMessageId
    //     });

    //     // ✅ Step 3: Emit message
    //     io.emit('receive_message', {
    //       messageId: savedMessage.message_id,
    //       senderId,
    //       receiverId,
    //       encryptedMessage,
    //       timestamp: savedMessage.timestamp
    //     });

    //   } catch (err) {
    //     console.error('Error saving message:', err);
    //     socket.emit('error', 'Message delivery failed');
    //   }
    // });

    socket.on('send_message', async (data, callback) => {
  try {
    const {
      senderId,
      receiverPhoneNumber,
      encryptedMessage,
      messageType = 'text',
      contentHash = null,
      mediaUrl = null,
      replyToMessageId = null,
      encryptionVersion = '1.0'
    } = data;

    // 1. Get receiver ID from phone number
    const receiverRes = await pool.query(
      'SELECT user_id FROM users WHERE phone_number = $1',
      [receiverPhoneNumber]
    );

    if (receiverRes.rowCount === 0) {
      return callback({ status: 'error', message: 'Receiver not found' });
    }

    const receiverId = receiverRes.rows[0].user_id;

    // 2. Save message
    const savedMessage = await chatModel.saveMessage({
      sender_id: senderId,
      receiver_id: receiverId,
      group_id: null,
      content: encryptedMessage.encryptedText,
      content_hash: contentHash,
      initialization_vector: encryptedMessage.iv,
      auth_tag: encryptedMessage.authTag || null,
      media_url: mediaUrl,
      message_type: messageType,
      is_encrypted: true,
      encryption_version: encryptionVersion,
      status: 'sent',
      reply_to_message_id: replyToMessageId
    });

    // 3. Emit message to all clients
    io.emit('receive_message', {
      messageId: savedMessage.message_id,
      senderId,
      receiverId,
      encryptedMessage,
      timestamp: savedMessage.timestamp
    });

    // ✅ 4. Send ack response to sender
    callback({
      status: 'success',
      message: 'Message stored and delivered',
      data: {
        messageId: savedMessage.message_id,
        timestamp: savedMessage.timestamp
      }
    });

  } catch (err) {
    console.error('Error saving message:', err);
    callback({ status: 'error', message: 'Message delivery failed' });
  }
});

  });
}

module.exports = { setupSocket };

