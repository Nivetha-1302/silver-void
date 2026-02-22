const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');

// Get all alerts
router.get('/', async (req, res) => {
    try {
        const alerts = await Alert.find()
            .sort({ timestamp: -1 })
            .populate('user', 'fullName email') // Assuming User model has fullName
            .limit(50); // Limit to recent 50
        res.json(alerts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Mark alert as read
router.put('/:id/read', async (req, res) => {
    try {
        const alert = await Alert.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );
        res.json(alert);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create alert manually (e.g. from System)
router.post('/', async (req, res) => {
    try {
        const { type, message, severity, userId } = req.body;
        const alert = new Alert({
            type,
            message,
            severity,
            user: userId
        });
        await alert.save();

        // Note: Socket emission usually happens where this API is called or via a global event bus
        // We can't access `io` directly here easily without passing it, but the client can listen to polling or we can use a global emitter.
        // For now, we just save to DB. Real-time part is handled in index.js socket listeners.

        res.status(201).json(alert);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
