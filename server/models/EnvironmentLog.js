const mongoose = require('mongoose');

const EnvironmentLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now },
    noiseLevel: { type: Number }, // in dB
    co2Emission: { type: Number }, // Estimated grams
    location: { type: String, default: "Office" }
});

module.exports = mongoose.model('EnvironmentLog', EnvironmentLogSchema);
