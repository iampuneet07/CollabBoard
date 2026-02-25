const Whiteboard = require('../models/Whiteboard');

// @desc    Get whiteboard data for a room
// @route   GET /api/whiteboard/:roomId
exports.getWhiteboard = async (req, res) => {
    try {
        let whiteboard = await Whiteboard.findOne({ roomId: req.params.roomId });

        if (!whiteboard) {
            whiteboard = await Whiteboard.create({ roomId: req.params.roomId });
        }

        res.json({ whiteboard });
    } catch (error) {
        console.error('GetWhiteboard Error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// @desc    Save whiteboard snapshot
// @route   POST /api/whiteboard/:roomId/snapshot
exports.saveSnapshot = async (req, res) => {
    try {
        const { imageData } = req.body;

        if (!imageData) {
            return res.status(400).json({ message: 'Image data is required.' });
        }

        let whiteboard = await Whiteboard.findOne({ roomId: req.params.roomId });

        if (!whiteboard) {
            whiteboard = await Whiteboard.create({ roomId: req.params.roomId });
        }

        whiteboard.snapshots.push({
            imageData,
            createdBy: req.user.id
        });

        await whiteboard.save();

        res.json({ message: 'Snapshot saved successfully!' });
    } catch (error) {
        console.error('SaveSnapshot Error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// @desc    Clear whiteboard
// @route   DELETE /api/whiteboard/:roomId
exports.clearWhiteboard = async (req, res) => {
    try {
        const whiteboard = await Whiteboard.findOne({ roomId: req.params.roomId });

        if (!whiteboard) {
            return res.status(404).json({ message: 'Whiteboard not found.' });
        }

        whiteboard.strokes = [];
        await whiteboard.save();

        res.json({ message: 'Whiteboard cleared.' });
    } catch (error) {
        console.error('ClearWhiteboard Error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};
