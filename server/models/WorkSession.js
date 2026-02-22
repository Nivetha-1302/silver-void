const mongoose = require('mongoose');

const WorkSessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    type: { type: String, enum: ['Deep Work', 'Bunker', 'Regular'], default: 'Regular' },
    productivityScore: { type: Number },
    distractionsBlocked: { type: Number, default: 0 }
});

module.exports = mongoose.model('WorkSession', WorkSessionSchema);
