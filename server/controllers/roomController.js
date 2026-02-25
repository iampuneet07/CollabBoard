const { v4: uuidv4 } = require('uuid');
const Room = require('../models/Room');
const Whiteboard = require('../models/Whiteboard');

// @desc    Create a new room
// @route   POST /api/rooms
exports.createRoom = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ message: 'Room name is required.' });
        }

        const roomId = uuidv4().slice(0, 8).toUpperCase();

        const room = await Room.create({
            roomId,
            name: name.trim(),
            host: req.user.id,
            participants: [{
                user: req.user.id,
                role: 'host'
            }]
        });

        // Create associated whiteboard
        await Whiteboard.create({ roomId });

        await room.populate('host', 'username email avatar');
        await room.populate('participants.user', 'username email avatar');

        res.status(201).json({
            message: 'Room created successfully!',
            room
        });
    } catch (error) {
        console.error('CreateRoom Error:', error);
        res.status(500).json({ message: 'Server error while creating room.' });
    }
};

// @desc    Join a room by roomId
// @route   POST /api/rooms/join
exports.joinRoom = async (req, res) => {
    try {
        const { roomId } = req.body;

        if (!roomId) {
            return res.status(400).json({ message: 'Room ID is required.' });
        }

        const room = await Room.findOne({ roomId: roomId.toUpperCase() });

        if (!room) {
            return res.status(404).json({ message: 'Room not found. Check the Room ID.' });
        }

        if (!room.isActive) {
            return res.status(400).json({ message: 'This room is no longer active.' });
        }

        // Check if already a participant
        const isParticipant = room.participants.some(
            p => p.user.toString() === req.user.id.toString()
        );

        if (!isParticipant) {
            if (room.participants.length >= room.maxParticipants) {
                return res.status(400).json({ message: 'Room is full.' });
            }

            room.participants.push({
                user: req.user.id,
                role: 'participant'
            });
            await room.save();
        }

        await room.populate('host', 'username email avatar');
        await room.populate('participants.user', 'username email avatar');

        res.json({
            message: 'Joined room successfully!',
            room
        });
    } catch (error) {
        console.error('JoinRoom Error:', error);
        res.status(500).json({ message: 'Server error while joining room.' });
    }
};

// @desc    Get room details
// @route   GET /api/rooms/:roomId
exports.getRoom = async (req, res) => {
    try {
        const room = await Room.findOne({ roomId: req.params.roomId })
            .populate('host', 'username email avatar')
            .populate('participants.user', 'username email avatar');

        if (!room) {
            return res.status(404).json({ message: 'Room not found.' });
        }

        res.json({ room });
    } catch (error) {
        console.error('GetRoom Error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// @desc    Get all rooms for current user
// @route   GET /api/rooms
exports.getMyRooms = async (req, res) => {
    try {
        const rooms = await Room.find({
            'participants.user': req.user.id
        })
            .populate('host', 'username email avatar')
            .populate('participants.user', 'username email avatar')
            .sort({ updatedAt: -1 });

        res.json({ rooms });
    } catch (error) {
        console.error('GetMyRooms Error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// @desc    Close a room (host only)
// @route   PUT /api/rooms/:roomId/close
exports.closeRoom = async (req, res) => {
    try {
        const room = await Room.findOne({ roomId: req.params.roomId });

        if (!room) {
            return res.status(404).json({ message: 'Room not found.' });
        }

        if (room.host.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Only the host can close the room.' });
        }

        room.isActive = false;
        await room.save();

        res.json({ message: 'Room closed successfully.' });
    } catch (error) {
        console.error('CloseRoom Error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// @desc    Grant drawing access to a participant (host only)
// @route   PUT /api/rooms/:roomId/grant-access
exports.grantAccess = async (req, res) => {
    try {
        const { userId } = req.body;
        const room = await Room.findOne({ roomId: req.params.roomId });

        if (!room) {
            return res.status(404).json({ message: 'Room not found.' });
        }

        if (room.host.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Only the host can grant access.' });
        }

        // Check if user is a participant
        const isParticipant = room.participants.some(
            p => p.user.toString() === userId.toString()
        );
        if (!isParticipant) {
            return res.status(400).json({ message: 'User is not a participant in this room.' });
        }

        // Check if already allowed
        const alreadyAllowed = room.allowedDrawers.some(
            id => id.toString() === userId.toString()
        );
        if (!alreadyAllowed) {
            room.allowedDrawers.push(userId);
            await room.save();
        }

        await room.populate('host', 'username email avatar');
        await room.populate('participants.user', 'username email avatar');

        res.json({ message: 'Access granted successfully.', room });
    } catch (error) {
        console.error('GrantAccess Error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// @desc    Revoke drawing access from a participant (host only)
// @route   PUT /api/rooms/:roomId/revoke-access
exports.revokeAccess = async (req, res) => {
    try {
        const { userId } = req.body;
        const room = await Room.findOne({ roomId: req.params.roomId });

        if (!room) {
            return res.status(404).json({ message: 'Room not found.' });
        }

        if (room.host.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Only the host can revoke access.' });
        }

        room.allowedDrawers = room.allowedDrawers.filter(
            id => id.toString() !== userId.toString()
        );
        await room.save();

        await room.populate('host', 'username email avatar');
        await room.populate('participants.user', 'username email avatar');

        res.json({ message: 'Access revoked successfully.', room });
    } catch (error) {
        console.error('RevokeAccess Error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// @desc    Delete a room permanently (host only)
// @route   DELETE /api/rooms/:roomId
exports.deleteRoom = async (req, res) => {
    try {
        const room = await Room.findOne({ roomId: req.params.roomId });

        if (!room) {
            return res.status(404).json({ message: 'Room not found.' });
        }

        if (room.host.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Only the host can delete this room.' });
        }

        // Delete associated whiteboard
        await Whiteboard.deleteOne({ roomId: req.params.roomId });

        // Delete associated messages
        const Message = require('../models/Message');
        await Message.deleteMany({ roomId: req.params.roomId });

        // Delete the room
        await Room.deleteOne({ roomId: req.params.roomId });

        // Notify all users in the room via socket
        if (req.io) {
            req.io.to(req.params.roomId).emit('room-deleted', {
                message: 'This room has been permanently deleted by the host.'
            });
        }

        res.json({ message: 'Room deleted successfully.' });
    } catch (error) {
        console.error('DeleteRoom Error:', error);
        res.status(500).json({ message: 'Server error while deleting room.' });
    }
};

// @desc    Kick a participant from the room (host only)
// @route   PUT /api/rooms/:roomId/kick
exports.kickParticipant = async (req, res) => {
    try {
        const { userId } = req.body;
        const room = await Room.findOne({ roomId: req.params.roomId });

        if (!room) {
            return res.status(404).json({ message: 'Room not found.' });
        }

        if (room.host.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Only the host can kick participants.' });
        }

        if (userId.toString() === room.host.toString()) {
            return res.status(400).json({ message: 'You cannot kick yourself.' });
        }

        // Remove from participants
        room.participants = room.participants.filter(
            p => p.user.toString() !== userId.toString()
        );

        // Also remove from allowed drawers if present
        room.allowedDrawers = room.allowedDrawers.filter(
            id => id.toString() !== userId.toString()
        );

        await room.save();

        // Notify the kicked user via socket
        if (req.io) {
            req.io.to(req.params.roomId).emit('user-kicked', {
                userId: userId,
                message: 'You have been removed from the room by the host.'
            });
        }

        await room.populate('host', 'username email avatar');
        await room.populate('participants.user', 'username email avatar');

        res.json({ message: 'User kicked successfully.', room });
    } catch (error) {
        console.error('KickParticipant Error:', error);
        res.status(500).json({ message: 'Server error while kicking participant.' });
    }
};
