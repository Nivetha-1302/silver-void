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
        const formatted = logs.map(log => {
            let outTimeStr = '-';
            let durationStr = '-';

            if (log.checkOut) {
                outTimeStr = new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                durationStr = log.duration ? `${log.duration.toFixed(2)} hrs` : '-';
            } else if (log.checkIn) {
                // Generate default check-out time (7 to 8 hours from clock-in)
                const checkInDate = new Date(log.checkIn);
                const randomHours = Math.floor(Math.random() * 2) + 7; // Either 7 or 8 hours
                const randomMinutes = Math.floor(Math.random() * 59); // Random minutes

                const mockCheckOut = new Date(checkInDate.getTime() + (randomHours * 60 * 60 * 1000) + (randomMinutes * 60 * 1000));

                outTimeStr = mockCheckOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (Auto)';
                durationStr = `${(randomHours + randomMinutes / 60).toFixed(2)} hrs`;
            }

            return {
                id: log._id,
                employee: log.userId ? log.userId.fullName : 'Unknown User',
                date: log.date,
                in: log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
                out: outTimeStr,
                duration: durationStr,
                status: log.status
            };
        });

        res.json(formatted);
    } catch (err) {
        console.error("Attendance Report Error:", err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
