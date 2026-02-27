const express = require('express');
const router = express.Router();
const ZoneLog = require('../models/ZoneLog');
const User = require('../models/User');

// POST /api/zones/scan
// Process a Face or RFID scan at a specific zone
router.post('/scan', async (req, res) => {
    try {
        const { userId, rfidHex, zone, method } = req.body;
        // Identify User
        let user = null;

        if (method === 'FACE' && userId) {
            user = await User.findById(userId);
        } else if (method === 'RFID' && rfidHex) {
            // Simulated: Check if User has this RFID hex saved in settings or just fallback mock
            // For now, if user not found by RFID explicitly, we assign it to the first employee
            // In a real system the User model would have an `rfidStr` field. We will simulate checking.
            user = await User.findOne({ email: rfidHex }); // Use email as "rfid code" for testing or find first
            if (!user) user = await User.findOne({ role: 'employee' });
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User verification failed' });
        }

        // Logic: Are they already in a zone?
        // Note: They might be in a DIFFERENT zone. We close the active zone log when they scan somewhere else.
        const activeLog = await ZoneLog.findOne({ userId: user._id, status: 'Active' });

        let alertMessage = null;

        if (activeLog) {
            if (activeLog.zone === zone) {
                // They are exiting the current zone
                activeLog.exitTime = new Date();
                activeLog.status = 'Completed';
                activeLog.durationSeconds = Math.round((activeLog.exitTime - activeLog.entryTime) / 1000);
                await activeLog.save();

                // Rules Engine / Trigger Checks on Exit
                if (zone === 'Canteen' && activeLog.durationSeconds > 1800) { // >30 mins
                    alertMessage = `Time limit exceeded in Canteen. Duration: ${Math.floor(activeLog.durationSeconds / 60)} mins.`;
                }

                // If they punch IN at Main Gate but never reach workstation...
                // Handled in a separate cron or background check, but we can do a simplified alert

                res.json({ success: true, action: 'EXIT', log: activeLog, user, alert: alertMessage });
            } else {
                // They went to a new zone without exiting the previous one!
                // End the old zone
                activeLog.exitTime = new Date();
                activeLog.status = 'Completed';
                activeLog.durationSeconds = Math.round((activeLog.exitTime - activeLog.entryTime) / 1000);
                await activeLog.save();

                // Start new zone
                const newLog = new ZoneLog({
                    userId: user._id,
                    zone: zone,
                    entryTime: new Date(),
                    identificationMethod: method,
                    status: 'Active'
                });
                await newLog.save();
                res.json({ success: true, action: 'SWITCHED_AND_ENTERED', log: newLog, user });
            }
        } else {
            // Create a new entry
            const newLog = new ZoneLog({
                userId: user._id,
                zone: zone,
                entryTime: new Date(),
                identificationMethod: method,
                status: 'Active'
            });
            await newLog.save();
            res.json({ success: true, action: 'ENTER', log: newLog, user });
        }
    } catch (error) {
        console.error("Zone Scan Error:", error);
        res.status(500).json({ success: false, message: 'Server error processing transaction' });
    }
});

// GET /api/zones/active
// Get live locations of all active users
router.get('/active', async (req, res) => {
    try {
        const activeLogs = await ZoneLog.find({ status: 'Active' }).populate('userId', 'fullName role');
        res.json(activeLogs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/zones/summary
// Get daily cumulative time spent in each zone for employees today
router.get('/summary', async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const summary = await ZoneLog.aggregate([
            { $match: { entryTime: { $gte: startOfDay } } },
            {
                $group: {
                    _id: { user: "$userId", zone: "$zone" },
                    totalDuration: { $sum: "$durationSeconds" }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id.user',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            }
        ]);
        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
