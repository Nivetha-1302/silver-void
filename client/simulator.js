import { io } from 'socket.io-client';
import axios from 'axios';

// Connect to backend port (assuming 5000)
const socket = io('http://localhost:5000');

let USERS = [];

const fetchUsers = async () => {
    try {
        console.log("Fetching real users from server...");
        const res = await axios.get('http://localhost:5000/api/employees');

        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
            USERS = res.data.map(u => ({
                id: u._id,
                name: u.fullName,
                role: u.role
            }));
            console.log(`Loaded ${USERS.length} users from database.`);
        } else {
            console.log("No users found in DB, falling back to mock IDs.");
            USERS = [
                { id: '65c4d3e2f1a2b3c4d5e6f7a8', name: 'Fallback User 1', role: 'employee' },
                { id: '65c4d3e2f1a2b3c4d5e6f7a9', name: 'Fallback User 2', role: 'employee' }
            ];
        }
    } catch (err) {
        console.error("Failed to fetch users (Server might require auth or be down):", err.message);
        // Fallback
        USERS = [
            { id: '65c4d3e2f1a2b3c4d5e6f7a8', name: 'Fallback User 1', role: 'employee' },
            { id: '65c4d3e2f1a2b3c4d5e6f7a9', name: 'Fallback User 2', role: 'employee' }
        ];
    }
};

socket.on('connect', async () => {
    console.log('Simulator connected to server via socket:', socket.id);

    await fetchUsers();

    setInterval(() => {
        if (USERS.length === 0) return;

        USERS.forEach(user => {
            const isWorking = Math.random() > 0.3; // 70% chance working
            const data = {
                id: user.id, // Match DB ID
                userId: user.id,
                fullName: user.name,
                role: user.role,
                status: isWorking ? 'Deep Work' : (Math.random() > 0.5 ? 'Idle' : 'Away'),
                focusScore: isWorking ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 40),
                mood: isWorking ? 'Focused' : 'Neutral',
                timestamp: new Date().toISOString()
            };

            socket.emit('dashboard_update', data);
        });
        console.log(`Simulated update sent for ${USERS.length} users`);
    }, 1000);
});

socket.on('disconnect', () => {
    console.log('Simulator disconnected');
});
