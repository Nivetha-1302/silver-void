require('dotenv').config();
const mongoose = require('mongoose');

// Import all models
const User = require('./models/User');
const Task = require('./models/Task');
const AttendanceLog = require('./models/AttendanceLog');
const EnvironmentLog = require('./models/EnvironmentLog');
const Interaction = require('./models/Interaction');
const PostureLog = require('./models/PostureLog');
const StressLog = require('./models/StressLog');
const WorkSession = require('./models/WorkSession');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ems_db');
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    }
};

const seedData = async () => {
    await connectDB();

    console.log('Seeding missing tables...');

    // 0. Ensure User Exists First
    let user = await User.findOne();
    if (!user) {
        user = await User.create({
            fullName: 'System Default',
            email: 'system@admin.com',
            role: 'admin'
        });
    }

    // 1. Environment Log
    const envCount = await EnvironmentLog.countDocuments();
    if (envCount === 0) {
        await EnvironmentLog.create({
            userId: user._id,
            type: 'Noise', // Note: Model says noiseLevel/co2Emission, not value/type. Fixing schema mismatch too.
            noiseLevel: 45,
            co2Emission: 400,
            timestamp: new Date(),
            location: 'Office Main'
        });
        console.log('Created EnvironmentLog collection');
    }

    // 2. Interaction
    const intCount = await Interaction.countDocuments();
    if (intCount === 0) {
        await Interaction.create({
            sourceUser: user._id,
            targetUser: user._id, // Self interaction for dummy
            type: 'Chat',
            timestamp: new Date(),
            duration: 5
        });
        console.log('Created Interaction collection');
    }

    // 3. Posture Log (Requires a valid user ID, lets invoke finding one or create dummy)
    if (!user) {
        user = await User.create({
            fullName: 'System Default',
            email: 'system@admin.com',
            role: 'admin'
        });
    }

    const postCount = await PostureLog.countDocuments();
    if (postCount === 0) {
        await PostureLog.create({
            userId: user._id,
            posture: 'Good',
            confidence: 0.95,
            timestamp: new Date()
        });
        console.log('Created PostureLog collection');
    }

    // 4. StressLog
    const stressCount = await StressLog.countDocuments();
    if (stressCount === 0) {
        await StressLog.create({
            userId: user._id,
            stressLevel: 20, // Numeric 0-100, not 'Low' string
            trigger: 'Baseline', // Required by schema
            timestamp: new Date()
        });
        console.log('Created StressLog collection');
    }

    // 5. Work Session
    const workCount = await WorkSession.countDocuments();
    if (workCount === 0) {
        await WorkSession.create({
            userId: user._id,
            startTime: new Date(),
            endTime: new Date(Date.now() + 3600000), // +1 hour
            focusScore: 85
        });
        console.log('Created WorkSession collection');
    }

    console.log('All tables should now be visible in MongoDB Compass.');
    process.exit();
};

seedData();
