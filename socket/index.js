
const chatModel = require('../models/ChatModel');
const pool = require('../config/db'); // PostgreSQL pool

function setupSocket(io) {
  // io.on('connection', (socket) => {
  //   console.log('User connected:', socket.id);

   

  //   socket.on('send_message', async (data, callback) => {
  //     try {
  //       const {
  //         senderId,
  //         receiverPhoneNumber,
  //         encryptedMessage,
  //         messageType = 'text',
  //         contentHash = null,
  //         mediaUrl = null,
  //         replyToMessageId = null,
  //         encryptionVersion = '1.0'
  //       } = data;

  //       // 1. Get receiver ID from phone number
  //       const receiverRes = await pool.query(
  //         'SELECT user_id FROM users WHERE phone_number = $1',
  //         [receiverPhoneNumber]
  //       );

  //       if (receiverRes.rowCount === 0) {
  //         return callback({ status: 'error', message: 'Receiver not found' });
  //       }

  //       const receiverId = receiverRes.rows[0].user_id;

  //       // 2. Save message
  //       const savedMessage = await chatModel.saveMessage({
  //         sender_id: senderId,
  //         receiver_id: receiverId,
  //         group_id: null,
  //         content: encryptedMessage.encryptedText,
  //         content_hash: contentHash,
  //         initialization_vector: encryptedMessage.iv,
  //         auth_tag: encryptedMessage.authTag || null,
  //         media_url: mediaUrl,
  //         message_type: messageType,
  //         is_encrypted: true,
  //         encryption_version: encryptionVersion,
  //         status: 'sent',
  //         reply_to_message_id: replyToMessageId
  //       });

  //       // 3. Emit message to all clients
  //       io.emit('receive_message', {
  //         messageId: savedMessage.message_id,
  //         senderId,
  //         receiverId,
  //         encryptedMessage,
  //         timestamp: savedMessage.timestamp
  //       });

  //       // // ✅ 4. Send ack response to sender
  //       // callback({
  //       //   status: 'success',
  //       //   message: 'Message stored and delivered',
  //       //   data: {
  //       //     messageId: savedMessage.message_id,
  //       //     timestamp: savedMessage.timestamp
  //       //   }
  //       // });

  //       // ✅ 4. Send ack response to sender
  //       callback({
  //         status: 'success',
  //         message: 'Message stored and delivered',
  //         data: {
  //           messageId: savedMessage.message_id,
  //           timestamp: savedMessage.timestamp,
  //           encryptedMessage: encryptedMessage,
  //           senderId:senderId,
  //           myId:senderId,
  //         }
  //       });


  //     } catch (err) {
  //       console.error('Error saving message:', err);
  //       callback({ status: 'error', message: 'Message delivery failed' });
  //     }
  //   });

  // });


  io.on('connection', (socket) => {

        // Register user (for 1:1 messaging)
        socket.on("register-user", (userId) => {
            socket.join(`user_${userId}`);
            console.log("user joined", userId);
        });

        // Join a group chat room
        socket.on("open-group", (groupId) => {
            socket.join(groupId);
        });

        // Handle incoming messages
        socket.on("messageFromUser", (data) => {
            console.log(data);
            // data should include: type, message, sender_id, group_id OR receiver_id

            if (data.type === "group") {
                // Broadcast to everyone in the group except sender
                socket.to(data.group_id).emit("messageFromServer", data);

            } else if (data.type === "private") {
                // Send to recipient
                io.to(`user_${data.receiver_id}`).emit("privateMessageFromServer", data);
                // Optional: also emit back to sender for sync
                io.to(`user_${data.sender_id}`).emit("privateMessageFromServer", data);
            }
        });

        // Optional: notify when someone disconnects
        socket.on('disconnect', () => {
            // Handle disconnect logic if needed
        });
    });
}

module.exports = { setupSocket };


