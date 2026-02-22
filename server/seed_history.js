const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const seedHistory = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ems_db');
        console.log('MongoDB Connected');

        const users = await User.find({ role: 'employee' });
        console.log(`Found ${users.length} employees. Seeding history...`);

        for (const user of users) {
            const history = [];
            // Generate 20 points of history simulating a work day
            let currentScore = 60 + Math.random() * 20; // Start around 60-80

            for (let i = 0; i < 20; i++) {
                // Random fluctuation but keeping it somewhat consistent (Research-like trend)
                const change = (Math.random() - 0.5) * 10;
                currentScore = Math.max(20, Math.min(100, currentScore + change));

                history.push({
                    score: Math.round(currentScore),
                    timestamp: new Date(Date.now() - (19 - i) * 1000 * 60 * 15) // Every 15 mins back
                });
            }

            user.metrics.focusHistory = history;
            user.metrics.focusScore = history[history.length - 1].score; // Sync current score
            await user.save();
            console.log(`Updated history for ${user.fullName}`);
        }

        console.log('History Seeding Complete!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedHistory();
