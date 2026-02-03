require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const chatRoutes = require('./src/routes/chatRoutes');
const socketHandler = require('./src/socket/socketHandler');

const app = express();
const server = http.createServer(app);

// CORS origins - allow both local dev and production
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CORS_ORIGIN,
    'https://chat-app-sable-gamma-68.vercel.app',
].filter(Boolean);

console.log('Allowed CORS origins:', allowedOrigins);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
    },
});

// Middleware
app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
}));
app.use(express.json());
const authRoutes = require('./src/routes/authRoutes');

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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