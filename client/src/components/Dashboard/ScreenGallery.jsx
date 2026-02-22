import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from '../../utils/socket';
import { Search, Filter, Monitor, Clock, User, X, Camera, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ScreenGallery = () => {
    const [screenshots, setScreenshots] = useState([]);
    const [filteredShots, setFilteredShots] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('All');
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [shotRes, userRes] = await Promise.all([
                    axios.get('/api/monitoring/gallery'),
                    axios.get('/api/auth/users')
                ]);
                setScreenshots(shotRes.data);
                setFilteredShots(shotRes.data);
                setUsers(userRes.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching gallery:", err);
                setLoading(false);
            }
        };

        fetchData();

        // Socket Listener for Real-time Updates
        socket.on('new_screenshot', (newShot) => {
            setScreenshots(prev => [newShot, ...prev]);
        });

        return () => {
            socket.off('new_screenshot');
        };
    }, []);

    // Filter Logic
    useEffect(() => {
        if (selectedUser === 'All') {
            setFilteredShots(screenshots);
        } else {
            setFilteredShots(screenshots.filter(s => s.user?._id === selectedUser || s.user === selectedUser));
        }
    }, [selectedUser, screenshots]);

    return (
        <div className="p-8 h-full overflow-y-auto bg-transparent text-text">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Monitor className="w-8 h-8 text-primary" />
                        Screen Recording Gallery
                    </h1>
                    <p className="text-textSecondary">Real-time surveillance snapshots from employee workstations.</p>
                </div>

                {/* Filters */}
                <div className="flex gap-4 items-center bg-surface p-2 rounded-lg border border-border">
                    <Filter className="w-4 h-4 text-textSecondary" />
                    <select
                        className="bg-transparent text-sm outline-none"
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                    >
                        <option value="All">All Employees</option>
                        {users.map(u => (
                            <option key={u._id} value={u._id}>{u.fullName}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Gallery Grid */}
            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence>
                        {filteredShots.map((shot) => (
                            <motion.div
                                key={shot._id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="group relative bg-surface border border-border rounded-xl overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                                onClick={() => setSelectedImage(shot)}
                            >
                                {/* Activity Context Badge */}
                                <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold z-10 ${shot.activityContext?.includes('Distracted') ? 'bg-red-500 text-white' :
                                    shot.activityContext === 'Idle' ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
                                    }`}>
                                    {shot.activityContext || 'Unknown'}
                                </div>

                                {/* Image Thumbnail */}
                                <div className="aspect-video overflow-hidden bg-black/10 relative">
                                    <img
                                        src={shot.imageUrl}
                                        alt="Screen Capture"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <Monitor className="text-white w-8 h-8 drop-shadow-lg" />
                                    </div>
                                </div>

                                {/* Metadata */}
                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                            {shot.user?.fullName?.[0] || 'U'}
                                        </div>
                                        <span className="font-semibold text-sm truncate">{shot.user?.fullName || 'Unknown User'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-textSecondary">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(shot.timestamp).toLocaleTimeString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Camera className="w-3 h-3" />
                                            {shot.type}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {filteredShots.length === 0 && !loading && (
                <div className="text-center py-20 text-textSecondary">
                    <Monitor className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>No screen recordings found.</p>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-surface max-w-5xl w-full rounded-2xl overflow-hidden shadow-2xl relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-50"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="max-h-[80vh] overflow-y-auto">
                                <img src={selectedImage.imageUrl} className="w-full h-auto" />
                            </div>

                            <div className="p-6 border-t border-border flex justify-between items-center bg-surface">
                                <div>
                                    <h3 className="font-bold text-lg">{selectedImage.user?.fullName}</h3>
                                    <p className="text-textSecondary text-sm flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        {new Date(selectedImage.timestamp).toLocaleString()}
                                    </p>
                                </div>
                                <div className={`px-3 py-1 rounded text-sm font-bold ${selectedImage.activityContext?.includes('Distracted') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                    }`}>
                                    {selectedImage.activityContext}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ScreenGallery;
