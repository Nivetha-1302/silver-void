const express = require('express');
const router = express.Router();

const AttendanceLog = require('../models/AttendanceLog');

// Get all attendance logs for reporting
router.get('/report', async (req, res) => {
    try {
        const logs = await AttendanceLog.find()
            .populate('userId', 'fullName')
            .sort({ date: -1, checkIn: -1 });

        // Map to format expected by Reports.jsx
        const formatted = logs.map(log => ({
            id: log._id,
            employee: log.userId ? log.userId.fullName : 'Unknown User',
            date: log.date,
            in: log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
            out: log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
            duration: log.duration ? `${log.duration.toFixed(2)} hrs` : '-',
            status: log.status
        }));

        res.json(formatted);
    } catch (err) {
        console.error("Attendance Report Error:", err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
