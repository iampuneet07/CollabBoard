const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Room name is required'],
        trim: true,
        maxlength: [100, 'Room name cannot exceed 100 characters']
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['host', 'participant'],
            default: 'participant'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    allowedDrawers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    chatMuted: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    maxParticipants: {
        type: Number,
        default: 20
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

roomSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Room', roomSchema);
