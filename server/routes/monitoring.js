const express = require('express');
const router = express.Router();
const Screenshot = require('../models/Screenshot');
const SecurityLog = require('../models/SecurityLog');
const User = require('../models/User');

// === NEW ===
// Upload Screenshot (Base64)
router.post('/screenshot', async (req, res) => {
    try {
        const { userId, image, type, context } = req.body;
        const newShot = new Screenshot({
            user: userId,
            imageUrl: image, // In PROD, upload to S3/Cloudinary and save URL
            type,
            activityContext: context
        });
        await newShot.save();
        res.status(201).json({ message: 'Logged' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Screenshots (Gallery)
router.get('/gallery', async (req, res) => {
    try {
        const { userId, date } = req.query;
        let query = {};
        if (userId) query.user = userId;
        if (date) {
            const start = new Date(date);
            const end = new Date(date); // Simple date filter
            end.setDate(end.getDate() + 1);
            query.timestamp = { $gte: start, $lt: end };
        }

        const shots = await Screenshot.find(query)
            .populate('user', 'fullName email')
            .sort({ timestamp: -1 })
            .limit(50);

        res.json(shots);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// === SECURITY EVENT LOGGING (Audit Trail) ===
router.post('/log-event', async (req, res) => {
    try {
        const { userId, type, details, severity } = req.body;

        const newLog = new SecurityLog({
            userId,
            type,
            details,
            severity
        });
        await newLog.save();

        res.status(201).json({ message: "Security Event Logged", log: newLog });
    } catch (err) {
        console.error("Event Log Error:", err);
        res.status(500).json({ message: err.message });
    }
});

// GET Audit Logs
router.get('/audit-logs', async (req, res) => {
    try {
        const logs = await SecurityLog.find()
            .populate('userId', 'fullName role')
            .sort({ timestamp: -1 })
            .limit(100);

        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
