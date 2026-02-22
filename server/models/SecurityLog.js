const mongoose = require('mongoose');

const SecurityLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now },
    type: {
        type: String,
        required: true,
        enum: ['PHONE_DETECTED', 'SCREEN_SWITCH', 'UNAUTHORIZED_PERSON', 'LOW_FOCUS', 'ABSENCE']
    },
    details: { type: String }, // Optional additional info
    severity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM'
    }
});

module.exports = mongoose.model('SecurityLog', SecurityLogSchema);
