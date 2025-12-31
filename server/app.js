require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const chatRoutes = require('./src/routes/chatRoutes');
const socketHandler = require('./src/socket/socketHandler');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
    },
});

// Middleware
app.use(cors());
app.use(express.json());
const authRoutes = require('./src/routes/authRoutes');

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Chat API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Socket.io connection
socketHandler(io);

// Make io accessible in routes
app.set('io', io);

module.exports = { app, io};