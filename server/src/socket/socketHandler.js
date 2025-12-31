const prisma = require('../lib/prisma');
const jwt = require('jsonwebtoken');

// Store online users: { orderedUserId: socketId }
const onlineUsers = new Map();

const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        // Authenticate socket connection
        socket.on('authenticate', async (token) => {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.userId = decoded.userId;
                onlineUsers.set(decoded.userId, socket.id);

                // update user status to online
                await prisma.user.update({
                    where: { id: decoded.userId },
                    data: { isOnline: true },
                });

                // Notify others about this user's online status
                socket.broadcast.emit('user-online', decoded.userId);
                console.log('User authenticated:', decoded.userId);
            } catch (err) {
                console.error('Authentication error:', err);
            }
        });

        // Join a chat room
        socket.on('join-conversation', (conversationId) => {
            socket.join(conversationId);
            console.log(`user ${socket.userId} joined conversation ${conversationId}`);
        });

        // Leave a chat room
        socket.on('leave-conversation', (conversationId) => {
            socket.leave(conversationId);
            console.log(`user ${socket.userId} left conversation ${conversationId}`);
        });

        // Handle sending messages
        socket.on('send-message', async (data) => {
            try {
                const { conversationId, content } = data;

                // save message to DataBase
                const message = await prisma.message.create({
                    data: {
                        conversationId,
                        senderId: socket.userId,
                        content,
                    },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                username: true,
                                email: true,
                                avatarUrl: true,
                            }
                        }
                    },
                });

                // send to all users in the conversation room
                io.to(conversationId).emit('new-message', message);
            } catch (error) {
                console.error('Error sending message:', error);
            }
        });

        // Typing indicator
        socket.on('typing-start', (conversationId) => {
            socket.to(conversationId).emit('user-typing', {
                userId: socket.userId,
                conversationId,
            });
        });

        // Handle disconnection
        socket.on('disconnect', async () => {
            if (socket.userId) {
                onlineUsers.delete(socket.userId);

                // update user status to offline
                await prisma.user.update({
                    where: { id: socket.userId },
                    data: { isOnline: false, lastSeen: new Date() },
                });

                // Notify others about this user's offline status
                socket.broadcast.emit('user-offline', socket.userId);
            }
            console.log('User disconnected:', socket.id);
        });
    });
};

module.exports = socketHandler;