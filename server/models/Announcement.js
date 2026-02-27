const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
    message: { type: String, required: true },
    type: { type: String, enum: ['system', 'congrats', 'event', 'urgent'], default: 'system' },
    active: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expiresAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', AnnouncementSchema);
