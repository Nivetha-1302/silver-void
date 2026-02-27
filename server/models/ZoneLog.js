const mongoose = require('mongoose');

const zoneLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    zone: { type: String, enum: ['Main Gate', 'Workstation', 'Canteen'], required: true },
    entryTime: { type: Date, required: true },
    exitTime: { type: Date },
    durationSeconds: { type: Number, default: 0 },
    identificationMethod: { type: String, enum: ['RFID', 'FACE'], required: true },
    status: { type: String, enum: ['Active', 'Completed'], default: 'Active' },
    lastAlertTime: { type: Date }
});

module.exports = mongoose.model('ZoneLog', zoneLogSchema);
