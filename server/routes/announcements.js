const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

// Get all active announcements
router.get('/', async (req, res) => {
    try {
        const announcements = await Announcement.find({ active: true }).sort({ createdAt: -1 }).limit(10);
        res.json(announcements);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create an announcement (Admin only - simplification: for now just a route)
router.post('/', async (req, res) => {
    try {
        const announcement = new Announcement(req.body);
        const saved = await announcement.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Deactivate an announcement
router.patch('/:id/deactivate', async (req, res) => {
    try {
        await Announcement.findByIdAndUpdate(req.params.id, { active: false });
        res.json({ message: 'Announcement deactivated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
