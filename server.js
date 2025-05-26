require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
// const { pool } = require('./config/db');  // <-- import your pg pool
const pool = require('./config/db'); // ✅ Correct

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { setupSocket } = require('./socket');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    // Try a simple query to verify DB connection health
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});


app.get('/api/check', (req, res) => {
  res.json({ message: 'working' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);

setupSocket(io);

// Test DB connection and start server
(async () => {
  try {
    await pool.connect();  // Try connecting to DB pool
    console.log('Database connected');

    server.listen(process.env.PORT || 5000, () => {
      console.log('Server running on port', process.env.PORT || 5000);
    });
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);  // Exit if DB connection fails
  }
})();
