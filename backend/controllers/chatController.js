const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get messages between two users
// @route   GET /api/chat/:userId
// @access  Private
const getMessages = async (req, res) => {
    const { userId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
        $or: [
            { sender: myId, recipient: userId },
            { sender: userId, recipient: myId }
        ]
    }).sort({ createdAt: 1 });

    res.json(messages);
};

// @desc    Send a message
// @route   POST /api/chat
// @access  Private
const sendMessage = async (req, res) => {
    const { recipientId, text, image } = req.body;
    const senderId = req.user._id;

    if (!recipientId || (!text && !image)) {
        return res.status(400).json({ message: 'Invalid message data' });
    }

    const message = await Message.create({
        sender: senderId,
        recipient: recipientId,
        text,
        image
    });

    const fullMessage = await Message.findOne({ _id: message._id })
        .populate('sender', 'name img')
        .populate('recipient', 'name img');

    req.io.to(recipientId).emit('message received', fullMessage);

    res.status(201).json(fullMessage);
};

// @desc    Get all conversations for current user
// @route   GET /api/chat
// @access  Private
const getConversations = async (req, res) => {
    const myId = req.user._id;

    // Find all messages where user is sender or recipient
    const messages = await Message.find({
        $or: [{ sender: myId }, { recipient: myId }]
    }).sort({ createdAt: -1 }).populate('sender', 'name img isOnline').populate('recipient', 'name img isOnline');

    const conversations = [];
    const seenUsers = new Set();

    messages.forEach(msg => {
        const otherUser = msg.sender._id.toString() === myId.toString() ? msg.recipient : msg.sender;

        if (!seenUsers.has(otherUser._id.toString())) {
            seenUsers.add(otherUser._id.toString());
            conversations.push({
                user: otherUser,
                lastMessage: msg
            });
        }
    });

    res.json(conversations);
};

module.exports = {
    getMessages,
    sendMessage,
    getConversations,
};
