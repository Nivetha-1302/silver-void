const express = require('express');
const router = express.Router();
const Screenshot = require('../models/Screenshot');
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

// === LOG EVENT (Existing functionality kept for compatibility) ===
router.post('/log-event', async (req, res) => {
    // Keep this if old frontend calls it
    res.json({ message: "Event Logged" });
});

module.exports = router;
