const mongoose = require('mongoose');

const InteractionSchema = new mongoose.Schema({
    sourceUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['Chat', 'Email', 'Meeting', 'Collaboration'] },
    timestamp: { type: Date, default: Date.now },
    duration: { type: Number } // Duration in minutes
});

module.exports = mongoose.model('Interaction', InteractionSchema);
