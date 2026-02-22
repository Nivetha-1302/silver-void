const mongoose = require('mongoose');

const ScreenshotSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    imageUrl: {
        type: String, // Base64 or URL
        required: true
    },
    type: {
        type: String,
        enum: ['Webcam', 'Screen', 'Tab'],
        required: true
    },
    activityContext: {
        type: String // e.g., "Deep Work", "Idle"
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Screenshot', ScreenshotSchema);
