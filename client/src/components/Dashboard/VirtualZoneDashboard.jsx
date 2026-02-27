import React, { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, Clock, AlertTriangle, User, Shield, Activity, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import socket from '../../utils/socket';
import axios from 'axios';

const VirtualZoneDashboard = () => {
    // Simulated Camera Feeds with more metadata
    const [cameras, setCameras] = useState([
        { id: 'gate', name: 'Main Gate', zone: 'Entry/Exit', currentPerson: null, status: 'Active', type: 'Perimeter' },
        { id: 'canteen', name: 'Canteen Area', zone: 'Rest Zone', currentPerson: null, status: 'Active', type: 'Common' },
        { id: 'workfloor', name: 'Work Floor', zone: 'Production', currentPerson: null, status: 'Active', type: 'Restricted' },
    ]);

    const [logs, setLogs] = useState([]);
    const activeUsersRef = useRef([]);

    // Live Data Fetching
    useEffect(() => {
        const fetchActiveZones = async () => {
            try {
                const res = await axios.get('/api/zones/active');
                const activeData = res.data;

                setCameras(prevCams => {
                    const newCams = [...prevCams];
                    // Reset currentPerson
                    newCams.forEach(c => c.currentPerson = null);

                    activeData.forEach(log => {
                        let camId = '';
                        if (log.zone === 'Main Gate') camId = 'gate';
                        if (log.zone === 'Canteen') camId = 'canteen';
                        if (log.zone === 'Workstation') camId = 'workfloor';

                        const cam = newCams.find(c => c.id === camId);
                        if (cam) {
                            // Multiple users can be in a zone, for UI we just show the latest or append
                            // For this simple UI, we show the string of names 
                            if (cam.currentPerson) {
                                cam.currentPerson += `, ${log.userId.fullName}`;
                            } else {
                                cam.currentPerson = log.userId.fullName;
                            }
                            cam.isFlashing = true; // Briefly flash if they just appeared
                            setTimeout(() => setCameras(cc => cc.map(c => c.id === camId ? { ...c, isFlashing: false } : c)), 1000);
                        }
                    });
                    return newCams;
                });

                // Detect changes to generate logs
                const currentActiveStr = JSON.stringify(activeData.map(d => d._id));
                if (activeUsersRef.current !== currentActiveStr) {
                    activeUsersRef.current = currentActiveStr;
                    // In a real robust system, we would calculate deltas. Here we rely on socket for real-time logs.
                }

            } catch (err) { }
        };

        const interval = setInterval(fetchActiveZones, 2000);
        fetchActiveZones();

        // Listen for new scans directly via DB updates or just let polling handle it
        return () => clearInterval(interval);
    }, []);

    // Also listen to Socket for immediate events from Workstation Monitor
    useEffect(() => {
        const handleUpdate = (data) => {
            if (data.status.includes('Scanned')) {
                addLog(data.status.includes('Gate') ? 'gate' : data.status.includes('Canteen') ? 'canteen' : 'workfloor', 'Employee', 'ZONE ACCESS', false);
            } else if (data.phoneDetected || data.status.includes('Distracted')) {
                addLog('workfloor', 'Active User', 'POLICY VIOLATION', true);
            }
        };

        socket.on('dashboard_update', handleUpdate);
        return () => socket.off('dashboard_update', handleUpdate);
    }, []);

    const addLog = (camId, person, event, isAlert = false) => {
        const camName = cameras.find(c => c.id === camId)?.name || camId;
        const newLog = {
            id: Date.now() + Math.random(),
            time: new Date().toLocaleTimeString(),
            camera: camName,
            person: person,
            event: event,
            isAlert: isAlert
        };
        setLogs(prev => [newLog, ...prev.slice(0, 8)]); // Keep last 8 logs
    };

    return (
        <div className="p-6 h-full overflow-y-auto w-full relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 bg-white/50 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3 text-gray-800">
                        <MapPin className="text-blue-600 w-8 h-8" />
                        Virtual Zone Monitor
                    </h1>
                    <p className="text-sm text-gray-500 ml-11">AI-powered perimeter and zone surveillance tracking.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 text-xs font-bold font-mono">
                        <Activity className="w-4 h-4 animate-pulse" />
                        LIVE ZONE TRACKING
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Camera Feeds Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {cameras.map(cam => (
                            <motion.div
                                key={cam.id}
                                layout
                                className={`relative rounded-2xl overflow-hidden aspect-video group shadow-lg transition-all duration-300 ${cam.isFlashing ? 'ring-4 ring-indigo-500 shadow-indigo-500/50 scale-[1.02]' : 'ring-1 ring-slate-200'
                                    }`}
                            >
                                {/* Video Background Placeholder */}
                                <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                                    <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                                    {/* Simulated Pulse Radar */}
                                    <div className="w-64 h-64 border border-indigo-500/20 rounded-full animate-ping absolute opacity-20"></div>
                                    <div className="w-48 h-48 border border-indigo-500/30 rounded-full animate-ping absolute opacity-20 animation-delay-500"></div>

                                    <Camera className="text-slate-700 w-16 h-16 opacity-50" />
                                </div>

                                {/* Overlays */}
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-sm">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div> REC
                                    </span>
                                    <span className="bg-black/50 backdrop-blur-md text-white text-[10px] font-mono px-2 py-1 rounded border border-white/10">
                                        {cam.name.toUpperCase()}
                                    </span>
                                </div>

                                {/* Person Detection Overlay */}
                                <AnimatePresence>
                                    {cam.currentPerson && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 flex items-center justify-center"
                                        >
                                            <div className="relative">
                                                <div className="absolute -inset-4 border-2 border-dashed border-indigo-500/50 rounded-xl animate-[spin_4s_linear_infinite]"></div>
                                                <div className="bg-black/80 backdrop-blur-xl text-white px-4 py-3 rounded-xl border border-indigo-500/50 shadow-2xl flex items-center gap-3">
                                                    <div className="p-2 bg-indigo-600 rounded-lg">
                                                        <User className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Identified</div>
                                                        <div className="text-sm font-bold">{cam.currentPerson}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Zone Label */}
                                <div className="absolute bottom-3 left-4 text-white/80 text-xs font-mono flex items-center gap-2">
                                    <Shield className="w-3 h-3" /> Zone: {cam.zone}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Logs Column */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
                        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Fingerprint className="w-5 h-5 text-violet-500" /> Security Logs
                            </h3>
                            <span className="text-xs text-slate-400 font-mono">LIVE FEED</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[600px]">
                            <AnimatePresence initial={false}>
                                {logs.map(log => (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0 }}
                                        className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${log.isAlert
                                            ? 'bg-rose-50 border-rose-100'
                                            : 'bg-white border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-lg ${log.isAlert ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {log.isAlert ? <AlertTriangle className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm font-bold text-slate-800 truncate">{log.person}</p>
                                                <span className="text-[10px] text-slate-400 font-mono">{log.time}</span>
                                            </div>
                                            <div className="flex justify-between items-center mt-0.5">
                                                <p className="text-xs text-slate-500 truncate">{log.camera}</p>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${log.isAlert ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                    {log.event}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {logs.length === 0 && (
                                <div className="text-center py-10 text-slate-400 text-sm">
                                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    No events logged yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VirtualZoneDashboard;
