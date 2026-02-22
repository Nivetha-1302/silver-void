const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Security', 'Productivity', 'Attendance', 'System', 'Stress'],
        required: true
    },
    message: { type: String, required: true },
    severity: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional: linked to a specific user
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
});

module.exports = mongoose.model('Alert', AlertSchema);
