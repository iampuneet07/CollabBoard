const mongoose = require('mongoose');

const strokeSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['draw', 'text', 'shape'],
        default: 'draw'
    },
    points: [{
        x: Number,
        y: Number
    }],
    color: {
        type: String,
        default: '#ffffff'
    },
    brushSize: {
        type: Number,
        default: 3
    },
    tool: {
        type: String,
        enum: ['pencil', 'eraser', 'text', 'rectangle', 'circle', 'line', 'arrow', 'diamond'],
        default: 'pencil'
    },
    // Text-specific fields
    text: String,
    x: Number,
    y: Number,
    fontSize: {
        type: Number,
        default: 20
    },
    fontFamily: {
        type: String,
        default: 'Inter, sans-serif'
    },
    // Shape-specific fields
    shapeType: {
        type: String,
        enum: ['rectangle', 'circle', 'line', 'arrow', 'diamond']
    },
    width: Number,
    height: Number,
    endX: Number,
    endY: Number,
    filled: {
        type: Boolean,
        default: false
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    username: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

const whiteboardSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        index: true
    },
    strokes: [strokeSchema],
    snapshots: [{
        imageData: String,
        createdAt: {
            type: Date,
            default: Date.now
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

whiteboardSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Whiteboard', whiteboardSchema);
