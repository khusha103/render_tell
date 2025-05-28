// socket/index.js

// function setupSocket(io) {
//   io.on('connection', (socket) => {
//     console.log(`New client connected: ${socket.id}`);

//     socket.on('joinRoom', (mobileNumber) => {
//       console.log(`${socket.id} joining room: ${mobileNumber}`);
//       socket.join(mobileNumber);
//       socket.mobileNumber = mobileNumber;
//       socket.emit('joinedRoom', `Joined room for mobile number: ${mobileNumber}`);
//     });

//     socket.on('sendMessage', ({ toMobile, message }) => {
//       console.log(`Message from ${socket.mobileNumber} to ${toMobile}: ${message}`);

//       socket.to(toMobile).emit('receiveMessage', {
//         from: socket.mobileNumber,
//         message,
//       });

//       socket.emit('messageSent', { toMobile, message });
//     });

//     socket.on('disconnect', () => {
//       console.log(`Client disconnected: ${socket.id} (${socket.mobileNumber})`);
//     });
//   });
// }

function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    socket.on('joinRoom', (mobileNumber) => {
      const room = io.sockets.adapter.rooms.get(mobileNumber);
      const numClients = room ? room.size : 0;

      if (numClients >= 2) {
        // Room full, reject join
        socket.emit('roomFull', `Room for mobile number ${mobileNumber} is full.`);
        return;
      }

      console.log(`${socket.id} joining room: ${mobileNumber}`);
      socket.join(mobileNumber);
      socket.mobileNumber = mobileNumber;
      socket.emit('joinedRoom', `Joined room for mobile number: ${mobileNumber}`);
    });

    socket.on('sendMessage', ({ toMobile, message }) => {
      console.log(`Message from ${socket.mobileNumber} to ${toMobile}: ${message}`);

      socket.to(toMobile).emit('receiveMessage', {
        from: socket.mobileNumber,
        message,
      });

      socket.emit('messageSent', { toMobile, message });
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id} (${socket.mobileNumber})`);
    });
  });
}

module.exports = {
  setupSocket,
};

