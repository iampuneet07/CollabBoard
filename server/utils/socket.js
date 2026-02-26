const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Whiteboard = require('../models/Whiteboard');
const Message = require('../models/Message');
const Room = require('../models/Room');

// Track online users per room
const roomUsers = new Map();

const setupSocket = (io) => {
    // Socket authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }

            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 User connected: ${socket.user.username} (${socket.id})`);

        // ==================== ROOM EVENTS ====================

        socket.on('join-room', async (roomId) => {
            try {
                socket.join(roomId);

                // Track user in room
                if (!roomUsers.has(roomId)) {
                    roomUsers.set(roomId, new Map());
                }
                roomUsers.get(roomId).set(socket.id, {
                    id: socket.user._id,
                    username: socket.user.username,
                    avatar: socket.user.avatar,
                    socketId: socket.id
                });

                // Send existing whiteboard data to the joining user
                const whiteboard = await Whiteboard.findOne({ roomId });
                if (whiteboard) {
                    socket.emit('whiteboard-data', whiteboard.strokes);
                }

                // Send access control data
                const roomData = await Room.findOne({ roomId });
                if (roomData) {
                    socket.emit('access-updated', {
                        allowedDrawers: roomData.allowedDrawers.map(id => id.toString()),
                        allowedScreenSharers: roomData.allowedScreenSharers ? roomData.allowedScreenSharers.map(id => id.toString()) : []
                    });
                    socket.emit('chat-mute-updated', {
                        chatMuted: roomData.chatMuted
                    });
                }

                // Send existing messages
                const messages = await Message.find({ roomId })
                    .sort({ createdAt: -1 })
                    .limit(50)
                    .populate('sender', 'username avatar');
                socket.emit('message-history', messages.reverse());

                // Notify room about new user
                const onlineUsers = Array.from(roomUsers.get(roomId).values());
                io.to(roomId).emit('users-updated', onlineUsers);

                // System message
                const systemMsg = await Message.create({
                    roomId,
                    sender: socket.user._id,
                    senderName: socket.user.username,
                    content: `${socket.user.username} joined the room`,
                    type: 'system'
                });
                io.to(roomId).emit('new-message', {
                    ...systemMsg.toObject(),
                    sender: { username: socket.user.username, avatar: socket.user.avatar }
                });

                console.log(`📌 ${socket.user.username} joined room ${roomId}`);
            } catch (error) {
                console.error('Join Room Socket Error:', error);
                socket.emit('error', { message: 'Failed to join room' });
            }
        });

        socket.on('leave-room', async (roomId) => {
            handleLeaveRoom(socket, roomId, io);
        });

        // ==================== DRAWING EVENTS ====================

        socket.on('draw-start', (data) => {
            socket.to(data.roomId).emit('draw-start', {
                ...data,
                userId: socket.user._id,
                username: socket.user.username
            });
        });

        socket.on('draw-move', (data) => {
            socket.to(data.roomId).emit('draw-move', {
                ...data,
                userId: socket.user._id
            });
        });

        socket.on('draw-end', async (data) => {
            socket.to(data.roomId).emit('draw-end', {
                ...data,
                userId: socket.user._id
            });

            // Persist stroke to database
            try {
                if (data.stroke) {
                    await Whiteboard.findOneAndUpdate(
                        { roomId: data.roomId },
                        {
                            $push: { strokes: data.stroke },
                            $set: { updatedAt: Date.now() }
                        },
                        { upsert: true }
                    );
                }
            } catch (error) {
                console.error('Save Stroke Error:', error);
            }
        });

        socket.on('clear-board', async (data) => {
            try {
                await Whiteboard.findOneAndUpdate(
                    { roomId: data.roomId },
                    { $set: { strokes: [], updatedAt: Date.now() } }
                );
                io.to(data.roomId).emit('board-cleared');
            } catch (error) {
                console.error('Clear Board Error:', error);
            }
        });

        socket.on('undo', (data) => {
            socket.to(data.roomId).emit('undo', { userId: socket.user._id });
        });

        socket.on('redo', (data) => {
            socket.to(data.roomId).emit('redo', { userId: socket.user._id });
        });

        // ==================== ACCESS CONTROL EVENTS ====================

        socket.on('grant-access', async (data) => {
            try {
                const room = await Room.findOne({ roomId: data.roomId });
                if (!room) return;
                if (room.host.toString() !== socket.user._id.toString()) return;

                const alreadyAllowed = room.allowedDrawers.some(
                    id => id.toString() === data.userId.toString()
                );
                if (!alreadyAllowed) {
                    room.allowedDrawers.push(data.userId);
                    await room.save();
                }

                io.to(data.roomId).emit('access-updated', {
                    allowedDrawers: room.allowedDrawers.map(id => id.toString())
                });
            } catch (error) {
                console.error('Grant Access Socket Error:', error);
            }
        });

        socket.on('revoke-access', async (data) => {
            try {
                const room = await Room.findOne({ roomId: data.roomId });
                if (!room) return;
                if (room.host.toString() !== socket.user._id.toString()) return;

                room.allowedDrawers = room.allowedDrawers.filter(
                    id => id.toString() !== data.userId.toString()
                );
                await room.save();

                io.to(data.roomId).emit('access-updated', {
                    allowedDrawers: room.allowedDrawers.map(id => id.toString()),
                    allowedScreenSharers: room.allowedScreenSharers ? room.allowedScreenSharers.map(id => id.toString()) : []
                });
            } catch (error) {
                console.error('Revoke Access Socket Error:', error);
            }
        });

        socket.on('grant-screen-share', async (data) => {
            try {
                const room = await Room.findOne({ roomId: data.roomId });
                if (!room) return;
                if (room.host.toString() !== socket.user._id.toString()) return;

                if (!room.allowedScreenSharers) room.allowedScreenSharers = [];
                const alreadyAllowed = room.allowedScreenSharers.some(
                    id => id.toString() === data.userId.toString()
                );
                if (!alreadyAllowed) {
                    room.allowedScreenSharers.push(data.userId);
                    await room.save();
                }

                io.to(data.roomId).emit('access-updated', {
                    allowedDrawers: room.allowedDrawers.map(id => id.toString()),
                    allowedScreenSharers: room.allowedScreenSharers.map(id => id.toString())
                });
            } catch (error) {
                console.error('Grant Screen Share Socket Error:', error);
            }
        });

        socket.on('revoke-screen-share', async (data) => {
            try {
                const room = await Room.findOne({ roomId: data.roomId });
                if (!room) return;
                if (room.host.toString() !== socket.user._id.toString()) return;

                if (!room.allowedScreenSharers) room.allowedScreenSharers = [];
                room.allowedScreenSharers = room.allowedScreenSharers.filter(
                    id => id.toString() !== data.userId.toString()
                );
                await room.save();

                io.to(data.roomId).emit('access-updated', {
                    allowedDrawers: room.allowedDrawers.map(id => id.toString()),
                    allowedScreenSharers: room.allowedScreenSharers.map(id => id.toString())
                });
            } catch (error) {
                console.error('Revoke Screen Share Socket Error:', error);
            }
        });

        // ==================== TEXT TOOL EVENTS ====================

        socket.on('add-text', async (data) => {
            // Broadcast to others in the room
            socket.to(data.roomId).emit('add-text', {
                ...data,
                userId: socket.user._id,
                username: socket.user.username
            });

            // Persist text as a stroke
            try {
                if (data.textData) {
                    await Whiteboard.findOneAndUpdate(
                        { roomId: data.roomId },
                        {
                            $push: {
                                strokes: {
                                    type: 'text',
                                    text: data.textData.text,
                                    x: data.textData.x,
                                    y: data.textData.y,
                                    fontSize: data.textData.fontSize,
                                    color: data.textData.color,
                                    fontFamily: data.textData.fontFamily,
                                    userId: socket.user._id,
                                    username: socket.user.username,
                                    timestamp: new Date()
                                }
                            },
                            $set: { updatedAt: Date.now() }
                        },
                        { upsert: true }
                    );
                }
            } catch (error) {
                console.error('Save Text Error:', error);
            }
        });

        // ==================== CHAT EVENTS ====================

        socket.on('send-message', async (data) => {
            try {
                // Check if chat is muted and sender is not host
                const room = await Room.findOne({ roomId: data.roomId });
                if (room && room.chatMuted && room.host.toString() !== socket.user._id.toString()) {
                    socket.emit('chat-blocked', { message: 'Chat is muted by the host. Only the host can send messages.' });
                    return;
                }

                const message = await Message.create({
                    roomId: data.roomId,
                    sender: socket.user._id,
                    senderName: socket.user.username,
                    content: data.content,
                    type: data.type || 'text',
                    fileUrl: data.fileUrl,
                    fileName: data.fileName
                });

                io.to(data.roomId).emit('new-message', {
                    ...message.toObject(),
                    sender: {
                        _id: socket.user._id,
                        username: socket.user.username,
                        avatar: socket.user.avatar
                    }
                });
            } catch (error) {
                console.error('Send Message Error:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        socket.on('toggle-chat-mute', async (data) => {
            try {
                const room = await Room.findOne({ roomId: data.roomId });
                if (!room) return;
                if (room.host.toString() !== socket.user._id.toString()) return;

                room.chatMuted = !room.chatMuted;
                await room.save();

                io.to(data.roomId).emit('chat-mute-updated', {
                    chatMuted: room.chatMuted
                });

                // Send system message
                const systemMsg = await Message.create({
                    roomId: data.roomId,
                    sender: socket.user._id,
                    senderName: socket.user.username,
                    content: room.chatMuted
                        ? `🔇 ${socket.user.username} muted the chat. Only host can send messages.`
                        : `🔊 ${socket.user.username} unmuted the chat. Everyone can send messages.`,
                    type: 'system'
                });
                io.to(data.roomId).emit('new-message', {
                    ...systemMsg.toObject(),
                    sender: { username: socket.user.username, avatar: socket.user.avatar }
                });
            } catch (error) {
                console.error('Toggle Chat Mute Error:', error);
            }
        });

        // ==================== SHAPE EVENTS ====================

        socket.on('draw-shape', async (data) => {
            // Broadcast to others in the room
            socket.to(data.roomId).emit('draw-shape', {
                ...data,
                userId: socket.user._id,
                username: socket.user.username
            });

            // Persist shape as a stroke
            try {
                if (data.shapeData) {
                    await Whiteboard.findOneAndUpdate(
                        { roomId: data.roomId },
                        {
                            $push: {
                                strokes: {
                                    type: 'shape',
                                    shapeType: data.shapeData.shapeType,
                                    x: data.shapeData.x,
                                    y: data.shapeData.y,
                                    width: data.shapeData.width,
                                    height: data.shapeData.height,
                                    endX: data.shapeData.endX,
                                    endY: data.shapeData.endY,
                                    color: data.shapeData.color,
                                    brushSize: data.shapeData.brushSize,
                                    filled: data.shapeData.filled,
                                    userId: socket.user._id,
                                    username: socket.user.username,
                                    timestamp: new Date()
                                }
                            },
                            $set: { updatedAt: Date.now() }
                        },
                        { upsert: true }
                    );
                }
            } catch (error) {
                console.error('Save Shape Error:', error);
            }
        });

        // ==================== CURSOR TRACKING ====================

        socket.on('cursor-move', (data) => {
            socket.to(data.roomId).emit('cursor-move', {
                userId: socket.user._id,
                username: socket.user.username,
                x: data.x,
                y: data.y
            });
        });

        // ==================== ROOM DELETION ====================

        socket.on('room-deleted', (data) => {
            socket.to(data.roomId).emit('room-deleted', {
                message: 'This room has been deleted by the host.'
            });
        });

        // ==================== WEBRTC SIGNALING ====================

        socket.on('webrtc-offer', (data) => {
            io.to(data.targetSocketId).emit('webrtc-offer', {
                offer: data.offer,
                callerSocketId: socket.id,
                callerId: socket.user._id,
                callerName: socket.user.username
            });
        });

        socket.on('webrtc-answer', (data) => {
            io.to(data.targetSocketId).emit('webrtc-answer', {
                answer: data.answer,
                answererSocketId: socket.id,
                answererId: socket.user._id,
                answererName: socket.user.username
            });
        });

        socket.on('webrtc-ice-candidate', (data) => {
            io.to(data.targetSocketId).emit('webrtc-ice-candidate', {
                candidate: data.candidate,
                senderSocketId: socket.id
            });
        });

        socket.on('call-user', (data) => {
            // Notify the room that user started a call
            socket.to(data.roomId).emit('call-started', {
                callerId: socket.user._id,
                callerName: socket.user.username,
                callerSocketId: socket.id,
                mediaType: data.mediaType // 'audio' or 'video'
            });
        });

        socket.on('call-accepted', (data) => {
            io.to(data.callerSocketId).emit('call-accepted', {
                accepterId: socket.user._id,
                accepterName: socket.user.username,
                accepterSocketId: socket.id
            });
        });

        socket.on('call-ended', (data) => {
            socket.to(data.roomId).emit('call-ended', {
                userId: socket.user._id,
                username: socket.user.username,
                socketId: socket.id
            });
        });

        socket.on('toggle-media', (data) => {
            socket.to(data.roomId).emit('media-toggled', {
                userId: socket.user._id,
                socketId: socket.id,
                audioEnabled: data.audioEnabled,
                videoEnabled: data.videoEnabled,
                isScreenSharing: data.isScreenSharing
            });
        });

        // ==================== DISCONNECT ====================

        socket.on('disconnect', () => {
            console.log(`🔌 User disconnected: ${socket.user.username} (${socket.id})`);

            // Remove user from all rooms
            roomUsers.forEach((users, roomId) => {
                if (users.has(socket.id)) {
                    handleLeaveRoom(socket, roomId, io);
                }
            });
        });
    });
};

async function handleLeaveRoom(socket, roomId, io) {
    try {
        socket.leave(roomId);

        if (roomUsers.has(roomId)) {
            roomUsers.get(roomId).delete(socket.id);

            const onlineUsers = Array.from(roomUsers.get(roomId).values());
            io.to(roomId).emit('users-updated', onlineUsers);

            if (roomUsers.get(roomId).size === 0) {
                roomUsers.delete(roomId);
            }
        }

        // System message
        const systemMsg = await Message.create({
            roomId,
            sender: socket.user._id,
            senderName: socket.user.username,
            content: `${socket.user.username} left the room`,
            type: 'system'
        });
        io.to(roomId).emit('new-message', {
            ...systemMsg.toObject(),
            sender: { username: socket.user.username, avatar: socket.user.avatar }
        });

        console.log(`📌 ${socket.user.username} left room ${roomId}`);
    } catch (error) {
        console.error('Leave Room Error:', error);
    }
}

module.exports = setupSocket;
