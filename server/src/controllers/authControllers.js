const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register a new user
const register = async (req, res) => {
    try {
        const { username, email, password} = req.body;

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await prisma.user.create({
            data: {
                username,
                email,
                passwordHash: hashedPassword,               
            },
        });

        // Genarate token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        res.status(201).json({ 
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatarUrl: user.avatarUrl,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid Credentials' });
        }

        // Update user status to online
        await prisma.user.update({
            where: { id: user.id },
            data: { isOnline: true},
        });

        // Generate token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatarUrl: user.avatarUrl,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Logout user
const logout = async (req, res) => {
    try {
        const userId = req.user.userId;
        // Update user status to offline
        await prisma.user.update({
            where: { id: userId },
            data: { isOnline: false },
        });
        res.json({ message: 'User logged out successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get current user
const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
                isOnline: true,
            },
        });
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update user avatar
const updateAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const avatarUrl = `/uploads/avatars/${req.file.filename}`;

        const user = await prisma.user.update({
            where: { id: req.user.userId },
            data: { avatarUrl },
            select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
                isOnline: true,
            },
        });

        // Notify all user about avatar update via WebSocket
        const io = req.app.get('io');
        io.emit('user-avatar-updated', {
            userId: user.id,
            avatarUrl: user.avatarUrl,
        })

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
}

// Delete user account
const deleteAccount = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Delete all messages sent by the user
        await prisma.message.deleteMany({
            where: { senderId: userId },
        });

        // Delete all conversation participations
        await prisma.conversationParticipant.deleteMany({
            where: { userId: userId },
        });

        // Delete the user
        await prisma.user.delete({
            where: { id: userId },
        });

        // Notify others that user is deleted
        const io = req.app.get('io');
        io.emit('user-deleted', { userId });

        res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete account' });
    }
};

module.exports = { register, login, logout, getMe, updateAvatar, deleteAccount };