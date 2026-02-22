import { io } from 'socket.io-client';

// Initialize Socket.io connection to the backend

// Initialize Socket.io connection to the backend
// Connect to the same origin (Vite proxy will handle the rest)
const socket = io('/', {
    withCredentials: true,
    autoConnect: true,
});

export default socket;
