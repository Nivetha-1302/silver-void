require('dotenv').config();
const mongoose = require('mongoose');

// Import Models
const User = require('./models/User');
const ActivityLog = require('./models/ActivityLog');
const AppUsageLog = require('./models/AppUsageLog');
const SecurityLog = require('./models/SecurityLog');
const AttendanceLog = require('./models/AttendanceLog');
const WorkSession = require('./models/WorkSession');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ems_db');
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Connection Error:', err);
        process.exit(1);
    }
};

// Helpers
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const APPS = ['VS Code', 'Google Chrome', 'Slack', 'Zoom', 'Spotify', 'GitHub Desktop'];
const CATEGORIES = ['Productive', 'Neutral', 'Productive', 'Neutral', 'Unproductive', 'Productive'];

const generateData = async () => {
    await connectDB();
    console.log("🚀 Starting Data Generation (No Faker)...");

    // 1. Get or Create Users
    let users = await User.find();
    if (users.length < 3) {
        console.log("Creating dummy users...");
        const newUsers = [
            { fullName: 'Alice Engineer', email: 'alice@company.com', role: 'employee', department: 'Engineering' },
            { fullName: 'Bob Manager', email: 'bob@company.com', role: 'manager', department: 'Sales' },
            { fullName: 'Charlie Designer', email: 'charlie@company.com', role: 'employee', department: 'Design' }
        ];

        for (const u of newUsers) {
            // Check if exists first to avoid duplicates on re-run
            const exists = await User.findOne({ email: u.email });
            if (!exists) {
                const created = await User.create(u);
                users.push(created);
            } else {
                users.push(exists);
            }
        }
    }

    console.log(`Found ${users.length} users to seed data for.`);

    // 2. Generate Data for Last 7 Days
    const today = new Date();

    for (const user of users) {
        console.log(`Processing User: ${user.fullName}...`);

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // A. Attendance
            try {
                await AttendanceLog.create({
                    userId: user._id,
                    date: dateStr,
                    clockIn: new Date(date.setHours(9, 0, 0)),
                    clockOut: new Date(date.setHours(17, 30, 0)),
                    status: 'Present',
                    workDuration: 8.5
                });
            } catch (e) {
                // Ignore duplicates if re-running
            }

            // B. Work Session & Focus
            await WorkSession.create({
                userId: user._id,
                startTime: new Date(date.setHours(9, 15, 0)),
                endTime: new Date(date.setHours(12, 0, 0)),
                focusScore: getRandomInt(60, 95),
                mood: getRandomElement(['Happy', 'Neutral', 'Focused'])
            });

            // C. App Usage (Daily Aggregates)
            for (let j = 0; j < 5; j++) {
                const appIndex = getRandomInt(0, APPS.length - 1);
                await AppUsageLog.create({
                    userId: user._id,
                    date: dateStr,
                    appName: APPS[appIndex],
                    category: CATEGORIES[appIndex],
                    duration: getRandomInt(300, 3600) // 5 mins to 1 hour
                });
            }

            // D. Activity Log (Hourly Timeline)
            const timeline = [];
            for (let h = 9; h < 18; h++) {
                timeline.push({
                    time: `${h}:00`,
                    status: getRandomElement(['Active', 'Active', 'Active', 'Idle'])
                });
            }

            await ActivityLog.create({
                userId: user._id,
                date: dateStr,
                activeSeconds: getRandomInt(20000, 28000),
                idleSeconds: getRandomInt(1000, 5000),
                totalTime: 28800, // 8 hours
                timeline: timeline
            });

            // E. Security Logs (Random Events)
            for (let k = 0; k < 3; k++) {
                await SecurityLog.create({
                    userId: user._id,
                    type: getRandomElement(['PHONE_DETECTED', 'SCREEN_SWITCH', 'LOW_FOCUS']),
                    severity: getRandomElement(['LOW', 'MEDIUM', 'HIGH']),
                    details: 'Automated simulated event',
                    // Random time within the day
                    timestamp: new Date(date.setHours(getRandomInt(9, 17), getRandomInt(0, 59)))
                });
            }
        }
    }

    console.log("✅ Dataset Generation Complete!");
    process.exit();
};

generateData();
