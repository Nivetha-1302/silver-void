const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://silver-void-frontend.onrender.com"
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow local development and specific production domains
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smarttrack_ai')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const monitoringRoutes = require('./routes/monitoring');
const financeRoutes = require('./routes/finance');
const taskRoutes = require('./routes/tasks');
const alertRoutes = require('./routes/alerts');
const attendanceRoutes = require('./routes/attendance');
const zoneRoutes = require('./routes/zones');

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/zones', zoneRoutes);

// Socket.io Setup
const io = new Server(server, {
    cors: {
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('User Connected:', socket.id);

    socket.on('join_room', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined room`);
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected:', socket.id);
    });
});

// Global Real-Time Event & Rules Engine
const ZoneLog = require('./models/ZoneLog');
setInterval(async () => {
    try {
        // Fetch all employees currently tracked in physical zones
        const activeLogs = await ZoneLog.find({ status: 'Active' }).populate('userId', 'fullName');
        const now = new Date();

        for (const log of activeLogs) {
            if (!log.userId) continue;

            const diffMins = (now - new Date(log.entryTime)) / (1000 * 60);
            let alertMsg = null;
            let type = 'warning';

            // Business Rules Matrix
            if (log.zone === 'Canteen' && diffMins > 30) {
                alertMsg = `Time Limit Breach: ${log.userId.fullName} has overstayed their Canteen break (${Math.floor(diffMins)} mins).`;
                type = 'warning';
            }
            else if (log.zone === 'Main Gate' && diffMins > 15 && diffMins < 60 * 12) {
                alertMsg = `Missing Employee: ${log.userId.fullName} punched IN at Gate but never reached Workstation (${Math.floor(diffMins)} mins delay).`;
                type = 'critical';
            }

            // Check if we need to emit (Debounce alerts by 5 minutes to prevent front-end spam)
            if (alertMsg) {
                const lastAlert = log.lastAlertTime ? new Date(log.lastAlertTime) : null;
                const minsSinceLastAlert = lastAlert ? (now - lastAlert) / (1000 * 60) : Infinity;

                if (minsSinceLastAlert > 5) {
                    // Emit direct live notification using our socket instance
                    io.emit('new_alert', { message: alertMsg, type: type, timestamp: Date.now() });
                    log.lastAlertTime = now;
                    await log.save();
                }
            }
        }
    } catch (err) {
        console.error("Alert Engine Error:", err);
    }
}, 15000); // Check every 15 seconds

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
