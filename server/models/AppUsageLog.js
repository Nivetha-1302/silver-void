const mongoose = require('mongoose');

const AppUsageSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    appName: { type: String, required: true },
    category: { type: String, enum: ['Productive', 'Neutral', 'Unproductive'], default: 'Neutral' },
    duration: { type: Number, default: 0 } // Seconds
});

module.exports = mongoose.model('AppUsageLog', AppUsageSchema);
