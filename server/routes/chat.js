const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer Config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images and videos are allowed!'));
        }
    },
});

// @route   GET /api/chat
// @desc    Get all messages
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const messages = await Message.find().populate('sender', 'username email').sort({ createdAt: 1 }); // Oldest first
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/chat
// @desc    Send a message
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { content, type, fileUrl } = req.body;

        const newMessage = new Message({
            sender: req.user.id,
            content,
            type: type || 'text',
            fileUrl,
        });

        const savedMessage = await newMessage.save();
        const populatedMessage = await savedMessage.populate('sender', 'username email');

        // Emit message to all connected clients
        const io = req.app.get('io');
        io.emit('message', populatedMessage);

        res.json(populatedMessage);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/chat/upload
// @desc    Upload media
// @access  Private
router.post('/upload', auth, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a file' });
        }
        // Return relative path
        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ fileUrl, type: req.file.mimetype.startsWith('image/') ? 'image' : 'video' });
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

module.exports = router;
