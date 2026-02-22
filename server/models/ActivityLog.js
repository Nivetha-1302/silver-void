const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    activeSeconds: { type: Number, default: 0 },
    idleSeconds: { type: Number, default: 0 },
    totalTime: { type: Number, default: 0 },
    timeline: [{
        time: String, // HH:MM
        status: { type: String, enum: ['Active', 'Idle', 'Offline'] }
    }]
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
