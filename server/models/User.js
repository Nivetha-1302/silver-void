const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optional for face login users
    role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
    department: { type: String, default: 'Engineering' },
    employeeId: { type: String, unique: true },
    faceDescriptor: { type: Array }, // For face-api.js descriptors
    skills: [{
        name: String,
        level: Number, // XP or Percentage
        xp: Number
    }],
    metrics: {
        focusScore: { type: Number, default: 0 },
        mood: { type: String, default: 'Neutral' },
        attendance: [{ date: Date, status: String }],
        lastActive: { type: Date, default: Date.now },
        focusHistory: [{
            score: Number,
            timestamp: { type: Date, default: Date.now }
        }]
    },
    settings: {
        themePreference: { type: String, default: 'system' }
    },
    // --- Advanced Features ---
    gamification: {
        xp: { type: Number, default: 0 },
        level: { type: Number, default: 1 },
        badges: [String]
    },
    retentionRisk: {
        score: { type: Number, default: 0 }, // 0-100%
        factors: [String],
        lastUpdated: Date
    },
    keystrokeDNA: {
        flightTime: { type: Number },
        dwellTime: { type: Number },
        variance: { type: Number }
    },
    ecoStats: {
        carbonFootprint: { type: Number, default: 0 },
        greenScore: { type: String, default: 'A' }
    },
    stressBaseline: { type: Number, default: 20 },
    // -------------------------
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
