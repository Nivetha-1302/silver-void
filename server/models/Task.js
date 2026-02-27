const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ['To Do', 'In Progress', 'Done'], default: 'To Do' },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    requiredSkills: [String], // e.g., ['React', 'Node.js']
    deadline: { type: Date },
    aiScore: { type: Number }, // The match score calculated by AI
    aiSentiment: {
        score: { type: Number, default: 0 },
        label: { type: String, enum: ['Positive', 'Neutral', 'Stressed', 'Critical'], default: 'Neutral' }
    }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
