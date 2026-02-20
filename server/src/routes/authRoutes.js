const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, updateAvatar, deleteAccount } = require('../controllers/authControllers');
const authMiddleware = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getMe);
router.post('/avatar', authMiddleware, uploadAvatar.single('avatar'), updateAvatar);
router.delete('/delete', authMiddleware, deleteAccount);

module.exports = router;