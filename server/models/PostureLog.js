const mongoose = require('mongoose');

const PostureLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now },
    alertType: { type: String, enum: ['Slouching', 'Distance', 'Inactivity'] },
    correctionTime: { type: Number } // Time taken to correct posture in seconds
});

module.exports = mongoose.model('PostureLog', PostureLogSchema);
