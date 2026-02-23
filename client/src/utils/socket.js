import { io } from 'socket.io-client';

// Detect environment
const isProduction = window.location.hostname !== 'localhost';
const BACKEND_URL = isProduction
    ? 'https://silver-void.onrender.com'
    : 'http://localhost:5000';

console.log(`[Socket] Connecting to: ${BACKEND_URL}`);

const socket = io(BACKEND_URL, {
    withCredentials: true,
    autoConnect: true,
    transports: ['websocket', 'polling']
});

export default socket;
