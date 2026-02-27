import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from '../../utils/socket';
import { Search, Filter, Monitor, Clock, User, X, Camera, AlertTriangle, Activity, Cast, Shield, ShieldOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ScreenGallery = () => {
    const [liveStreams, setLiveStreams] = useState({});
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('All');
    const [expandedStream, setExpandedStream] = useState(null);
    const [loading, setLoading] = useState(true);
    const [privacyMode, setPrivacyMode] = useState(false); // GDPR Compliance Toggle

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [shotRes, userRes] = await Promise.all([
                    axios.get('/api/monitoring/gallery'), // Contains latest historical
                    axios.get('/api/auth/users')
                ]);

                // Keep only the most recent shot per user to seed the live streams
                const seededStreams = {};
                shotRes.data.forEach(shot => {
                    const uid = shot.user?._id || shot.user;
                    if (!seededStreams[uid] || new Date(shot.timestamp) > new Date(seededStreams[uid].timestamp)) {
                        seededStreams[uid] = shot;
                    }
                });

                setLiveStreams(seededStreams);
                setUsers(userRes.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching gallery:", err);
                setLoading(false);
            }
        };

        fetchData();

        // Socket Listener for LIVE CCTV Stream
        socket.on('new_screenshot', (newShot) => {
            const uid = newShot.user?._id || newShot.user;
            setLiveStreams(prev => ({
                ...prev,
                [uid]: newShot
            }));
        });

        return () => {
            socket.off('new_screenshot');
        };
    }, []);

    // Filter Logic
    const filteredStreams = Object.values(liveStreams).filter(shot => {
        if (selectedUser === 'All') return true;
        const uid = shot.user?._id || shot.user;
        return uid === selectedUser;
    });

    return (
        <div className="p-8 h-full overflow-y-auto bg-gray-900 text-gray-100 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-md">
                <div>
                    <h1 className="text-3xl font-black flex items-center gap-3 text-white tracking-wide">
                        <Cast className="w-8 h-8 text-cyan-400 animate-pulse" />
                        Live Terminal Monitors
                    </h1>
                    <p className="text-gray-400 mt-1 uppercase tracking-widest text-xs font-bold font-mono flex items-center gap-2">
                        Real-Time WebRTC Screen Link
                        {privacyMode && <span className="bg-emerald-500/20 text-emerald-400 px-2 rounded-full border border-emerald-500/50 font-sans ml-2">GDPR Privacy Active</span>}
                    </p>
                </div>

                {/* Filters */}
                <div className="flex gap-4 items-center">
                    <button
                        onClick={() => setPrivacyMode(!privacyMode)}
                        className={`flex items - center gap - 2 px - 4 py - 2 ${privacyMode ? 'bg-emerald-600 border-emerald-500 hover:bg-emerald-700' : 'bg-gray-800 border-gray-600 hover:bg-gray-700'} border rounded - lg text - white font - bold transition - colors shadow - sm`}
                        title="Toggle Data Anonymization Mode"
                    >
                        {privacyMode ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4 text-gray-400" />}
                        Privacy Mask
                    </button>

                    <div className="flex gap-4 items-center bg-gray-900/80 p-3 rounded-lg border border-gray-700/80 shadow-inner">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select
                            className="bg-transparent text-sm outline-none text-white font-bold cursor-pointer font-mono"
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                        >
                            <option value="All" className="bg-gray-800">ALL TERMINALS</option>
                            {users.map(u => (
                                <option key={u._id} value={u._id} className="bg-gray-800">{u.fullName.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Live Grid */}
            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
                    <AnimatePresence>
                        {filteredStreams.map((shot) => (
                            <motion.div
                                key={shot.user?._id || shot.user}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`group relative bg - black rounded - 2xl overflow - hidden hover: shadow - 2xl transition - all cursor - pointer border - 2 ${shot.activityContext?.includes('Distracted') ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'border-gray-800 hover:border-cyan-500/50'} `}
                                onClick={() => setExpandedStream(shot)}
                            >
                                {/* Activity Context Badge */}
                                <div className={`absolute top - 4 left - 4 px - 3 py - 1 rounded bg - black / 80 backdrop - blur - md text - xs font - black tracking - widest uppercase z - 10 border ${shot.activityContext?.includes('Distracted') ? 'border-red-500 text-red-500' :
                                    shot.activityContext === 'Idle' ? 'border-yellow-500 text-yellow-500' : 'border-emerald-500 text-emerald-500'
                                    } `}>
                                    <span className={`inline - block w - 2 h - 2 rounded - full mr - 2 ${shot.activityContext?.includes('Distracted') ? 'bg-red-500 animate-ping' : 'bg-emerald-500 animate-pulse'} `}></span>
                                    {shot.activityContext || 'ACTIVE'}
                                </div>

                                <div className="absolute top-4 right-4 z-10">
                                    <div className="px-2 py-1 bg-red-600 rounded text-[10px] font-black tracking-widest text-white flex gap-1 items-center shadow shadow-red-500/50">
                                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE
                                    </div>
                                </div>

                                {/* Live Monitor Feed */}
                                <div className="aspect-video overflow-hidden bg-gray-900 relative">
                                    <img
                                        src={shot.imageUrl}
                                        alt="Live Monitor Feed"
                                        className={`w - full h - full object - contain transition - all duration - 700 ${privacyMode ? 'blur-md grayscale opacity-50' : ''} `}
                                        loading="lazy"
                                    />
                                    {/* Scan Lines Overlay */}
                                    <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')] opacity-50 z-20"></div>
                                    <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none z-20"></div>
                                </div>

                                {/* Terminal Footer Metadata */}
                                <div className="p-4 bg-gray-900 border-t border-gray-800 font-mono flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <Monitor className="w-5 h-5 text-gray-500" />
                                        <span className="font-bold text-sm text-cyan-400">TERM-{(shot.user?._id || 'unknown').substring(0, 4).toUpperCase()}</span>
                                        <span className="text-gray-400 text-xs">| {shot.user?.fullName || 'Unknown User'}</span>
                                    </div>
                                    <div className="text-[10px] text-gray-500 flex items-center gap-1 uppercase bg-black px-2 py-1 rounded">
                                        <Activity className="w-3 h-3 text-cyan-500 animate-pulse" />
                                        SYNC OK
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {filteredStreams.length === 0 && !loading && (
                <div className="text-center py-32 text-gray-600">
                    <Monitor className="w-24 h-24 mx-auto mb-6 opacity-20" />
                    <p className="font-mono text-xl tracking-widest uppercase">Waiting for telemetry connection...</p>
                </div>
            )}

            {/* Fullscreen Expand Modal */}
            <AnimatePresence>
                {expandedStream && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
                        onClick={() => setExpandedStream(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl relative border border-gray-800 bg-gray-900"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setExpandedStream(null)}
                                className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/90 rounded-full text-white transition-colors z-[110]"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="p-4 bg-black border-b border-gray-800 flex justify-between items-center font-mono">
                                <div className="flex items-center gap-4 text-cyan-400">
                                    <Activity className="w-5 h-5 animate-pulse" />
                                    <h3 className="font-bold text-lg tracking-widest">SECURE STREAM RECEPTION: {expandedStream.user?.fullName.toUpperCase()}</h3>
                                </div>
                                <div className="text-red-500 font-black animate-pulse flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span> LIVE
                                </div>
                            </div>

                            <div className="relative bg-black flex justify-center items-center min-h-[50vh]">
                                <img src={expandedStream.imageUrl} className={`max-w-full max-h-[75vh] object-contain transition-all duration-700 ${privacyMode ? 'blur-md grayscale opacity-50' : ''}`} />
                                {/* Detail Scan Lines overlay */}
                                <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAuMTUiLz4KPC9zdmc+')] z-10"></div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ScreenGallery;
