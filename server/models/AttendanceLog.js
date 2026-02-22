const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    checkIn: { type: Date },
    checkOut: { type: Date },
    duration: { type: Number, default: 0 }, // In hours
    status: { type: String, enum: ['Present', 'Absent', 'Late', 'Half Day'], default: 'Present' },
    verificationMethod: { type: String, default: 'Face' }
});

module.exports = mongoose.model('AttendanceLog', AttendanceSchema);
