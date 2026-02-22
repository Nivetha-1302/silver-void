const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import Models
const User = require('./models/User');
const AttendanceLog = require('./models/AttendanceLog');
const Task = require('./models/Task');
const StressLog = require('./models/StressLog');
const EnvironmentLog = require('./models/EnvironmentLog');
const PostureLog = require('./models/PostureLog');
const Interaction = require('./models/Interaction');
const WorkSession = require('./models/WorkSession');

const seedData = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/ems_db', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        console.log('MongoDB Connected Successfully.');

        // 1. Get or Create an Admin User
        let admin = await User.findOne({ email: 'admin@smarttrack.com' });
        if (!admin) {
            admin = await User.create({
                fullName: 'Admin User',
                email: 'admin@smarttrack.com',
                password: 'password123',
                role: 'admin',
                faceDescriptor: [],
                metrics: { focusScore: 95, mood: 'Productive', status: 'Active' }
            });
            console.log('Created Admin User');
        } else {
            console.log('Admin User already exists.');
        }

        const userId = admin._id;

        // 3. Populate Attendance Logs
        const attendanceCount = await AttendanceLog.countDocuments();
        if (attendanceCount === 0) {
            await AttendanceLog.create([
                { userId, date: '2023-10-25', checkIn: new Date(), checkOut: new Date(Date.now() + 28800000), duration: 8, status: 'Present' },
                { userId, date: '2023-10-26', checkIn: new Date(), checkOut: new Date(Date.now() + 29800000), duration: 8.5, status: 'Present' }
            ]);
            console.log('Seeded AttendanceLogs');
        } else {
            console.log(`AttendanceLogs already has ${attendanceCount} documents.`);
        }

        // 4. Populate Tasks
        const taskCount = await Task.countDocuments();
        if (taskCount === 0) {
            await Task.create([
                { title: 'System Audit', description: 'Review security logs', status: 'In Progress', priority: 'High', assignee: userId, aiScore: 95 },
                { title: 'Update Documentation', description: 'Add new AI features', status: 'To Do', priority: 'Medium', assignee: userId, aiScore: 88 }
            ]);
            console.log('Seeded Tasks');
        } else {
            console.log(`Tasks already has ${taskCount} documents.`);
        }

        // 5. Populate Stress Logs
        const stressCount = await StressLog.countDocuments();
        if (stressCount === 0) {
            await StressLog.create([
                { userId, stressLevel: 75, trigger: 'Rapid Typing', timestamp: new Date() }
            ]);
            console.log('Seeded StressLogs');
        } else {
            console.log(`StressLogs already has ${stressCount} documents.`);
        }

        // 6. Populate Environment Logs
        const envCount = await EnvironmentLog.countDocuments();
        if (envCount === 0) {
            await EnvironmentLog.create([
                { userId, noiseLevel: 45, co2Emission: 400, location: 'Office' }
            ]);
            console.log('Seeded EnvironmentLogs');
        } else {
            console.log(`EnvironmentLogs already has ${envCount} documents.`);
        }

        // 7. Populate Posture Logs
        const postureCount = await PostureLog.countDocuments();
        if (postureCount === 0) {
            await PostureLog.create([
                { userId, alertType: 'Slouching', correctionTime: 5 }
            ]);
            console.log('Seeded PostureLogs');
        } else {
            console.log(`PostureLogs already has ${postureCount} documents.`);
        }

        // 8. Populate Interactions
        const interactionCount = await Interaction.countDocuments();
        if (interactionCount === 0) {
            await Interaction.create([
                { sourceUser: userId, targetUser: userId, type: 'Chat', duration: 15, timestamp: new Date() }
            ]);
            console.log('Seeded Interactions');
        } else {
            console.log(`Interactions already has ${interactionCount} documents.`);
        }

        // 9. Populate Work Sessions
        const sessionCount = await WorkSession.countDocuments();
        if (sessionCount === 0) {
            await WorkSession.create([
                { userId, startTime: new Date(), endTime: new Date(Date.now() + 3600000), productivityScore: 92, type: 'Deep Work' }
            ]);
            console.log('Seeded WorkSessions');
        } else {
            console.log(`WorkSessions already has ${sessionCount} documents.`);
        }

        console.log('Database Seeding Completed Successfully!');

    } catch (err) {
        console.error('Seeding Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

seedData();
