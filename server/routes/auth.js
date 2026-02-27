const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AttendanceLog = require('../models/AttendanceLog');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register User
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, password, role, faceDescriptor, profileImage } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
            role,
            faceDescriptor,
            profileImage
        });

        const savedUser = await newUser.save();
        res.status(201).json(savedUser);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Login (Password)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        // --- AUTOMATED ATTENDANCE ON LOGIN ---
        const today = new Date().toISOString().split('T')[0];
        let attendance = await AttendanceLog.findOne({ userId: user._id, date: today });

        if (!attendance) {
            attendance = new AttendanceLog({
                userId: user._id,
                date: today,
                checkIn: new Date(),
                status: 'Present'
            });
            await attendance.save();
        }

        res.json({
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                department: user.department,
                profileImage: user.profileImage
            },
            attendanceId: attendance._id
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Biometric Login (Called after frontend face match)
router.post('/biometric-login', async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        // --- AUTOMATED ATTENDANCE ON LOGIN ---
        const today = new Date().toISOString().split('T')[0];
        let attendance = await AttendanceLog.findOne({ userId: user._id, date: today });

        if (!attendance) {
            attendance = new AttendanceLog({
                userId: user._id,
                date: today,
                checkIn: new Date(),
                status: 'Present'
            });
            await attendance.save();
        }

        res.json({
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                department: user.department,
                profileImage: user.profileImage
            },
            attendanceId: attendance._id
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Profile
router.post('/update-profile', async (req, res) => {
    try {
        const { userId, fullName, email, password } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (fullName) user.fullName = fullName;
        if (email) user.email = email;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();
        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                department: user.department,
                profileImage: user.profileImage
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Logout (Record checkOut)
router.post('/logout', async (req, res) => {
    try {
        const { userId } = req.body;
        const today = new Date().toISOString().split('T')[0];

        const attendance = await AttendanceLog.findOne({ userId, date: today });
        if (attendance && !attendance.checkOut) {
            attendance.checkOut = new Date();

            // Calculate duration in hours
            const diffMs = attendance.checkOut - attendance.checkIn;
            attendance.duration = diffMs / (1000 * 60 * 60);

            await attendance.save();
        }

        res.json({ message: 'Logged out and attendance recorded' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get All Users (For Face Matching on Frontend)
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, 'fullName email faceDescriptor role');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
