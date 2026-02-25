const Message = require('../models/Message');

// @desc    Get messages for a room
// @route   GET /api/messages/:roomId
exports.getMessages = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const messages = await Message.find({ roomId: req.params.roomId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('sender', 'username avatar');

        const total = await Message.countDocuments({ roomId: req.params.roomId });

        res.json({
            messages: messages.reverse(),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('GetMessages Error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};
