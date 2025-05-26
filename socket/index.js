let onlineUsers = new Map();

exports.setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', ({ userId, chatId }) => {
      socket.join(chatId);
      onlineUsers.set(userId, socket.id);
    });

    socket.on('sendMessage', ({ chatId, message }) => {
      io.to(chatId).emit('receiveMessage', message);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      for (const [userId, socketId] of onlineUsers) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
    });
  });
};