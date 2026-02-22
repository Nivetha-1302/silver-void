const mongoose = require('mongoose');

const StressLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now },
    stressLevel: { type: Number, required: true }, // 0-100
    trigger: { type: String } // e.g., "High Typing Speed", "Rapid Mouse Movement"
});

module.exports = mongoose.model('StressLog', StressLogSchema);
