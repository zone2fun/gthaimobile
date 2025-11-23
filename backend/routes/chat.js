const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, getConversations } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getConversations);
router.get('/:userId', protect, getMessages);
router.post('/', protect, sendMessage);

module.exports = router;
