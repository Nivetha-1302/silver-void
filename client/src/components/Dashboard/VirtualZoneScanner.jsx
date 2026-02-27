import React, { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, ScanLine, Fingerprint, LogIn, AlertTriangle } from 'lucide-react';
import * as faceapi from '@vladmandic/face-api';
import axios from 'axios';
import toast from 'react-hot-toast';
import faceHandler from '../../utils/faceHandler';
import socket from '../../utils/socket';
import { motion } from 'framer-motion';

const VirtualZoneScanner = () => {
    const videoRef = useRef(null);
    const [currentZone, setCurrentZone] = useState('Main Gate');
    const [isScanningActive, setIsScanningActive] = useState(false);
    const [rfidInput, setRfidInput] = useState('');
    const [lastScanMessage, setLastScanMessage] = useState(null);
    const [matchers, setMatchers] = useState([]);

    const ZONES = ['Main Gate', 'Workstation', 'Canteen'];

    useEffect(() => {
        const initCameraAndAI = async () => {
            await faceHandler.loadAll();

            try {
                const res = await axios.get('/api/auth/users');
                const users = res.data;
                const activeMatchers = [];
                for (const u of users) {
                    if (u.faceDescriptor && u.faceDescriptor.length === 128) {
                        const arr = new Float32Array(u.faceDescriptor);
                        activeMatchers.push(new faceapi.LabeledFaceDescriptors(u._id, [arr]));
                    }
                }
                setMatchers(activeMatchers);
            } catch (e) { console.error("Could not fetch faces", e); }

            if (navigator.mediaDevices) {
                navigator.mediaDevices.getUserMedia({ video: true })
                    .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
                    .catch(e => toast.error("Camera access denied"));
            }
        };
        initCameraAndAI();
    }, []);

    // Face Scan Loop
    useEffect(() => {
        let interval;
        if (isScanningActive && matchers.length > 0) {
            const faceMatcher = new faceapi.FaceMatcher(matchers, 0.55);

            interval = setInterval(async () => {
                if (!videoRef.current || videoRef.current.paused) return;

                const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (detection) {
                    const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
                    if (bestMatch.label !== 'unknown') {
                        // Debounce by checking last scan message locally or pausing loop momentarily
                        setIsScanningActive(false);
                        handleScanSubmit({ userId: bestMatch.label, method: 'FACE' });
                        setTimeout(() => setIsScanningActive(true), 3000); // Wait 3 seconds before next scan
                    }
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isScanningActive, matchers, currentZone]);

    // Handle RFID Keyboard Wedge submission (usually fires enter key)
    const handleRfidSubmit = (e) => {
        e.preventDefault();
        if (rfidInput.trim()) {
            handleScanSubmit({ rfidHex: rfidInput.trim(), method: 'RFID' });
            setRfidInput('');
        }
    };

    const handleScanSubmit = async (data) => {
        try {
            const payload = { ...data, zone: currentZone };
            const res = await axios.post('/api/zones/scan', payload);

            if (res.data.success) {
                const userName = res.data.user.fullName;
                const action = res.data.action;

                let msg = `${userName} scanned at ${currentZone}`;
                if (action === 'ENTER') msg = `${userName} ENTERED ${currentZone}`;
                if (action === 'EXIT') msg = `${userName} EXITED ${currentZone}`;

                toast.success(msg, { icon: data.method === 'FACE' ? '🧑' : '💳' });

                setLastScanMessage({
                    user: userName,
                    action: action,
                    method: data.method,
                    time: new Date().toLocaleTimeString(),
                    alert: res.data.alert
                });

                if (res.data.alert) {
                    toast.error(res.data.alert, { icon: '⚠️', duration: 4000 });
                }

                // Tell dashboard there's an update
                socket.emit('dashboard_update', {
                    id: res.data.user._id,
                    status: `Scanned at ${currentZone}`,
                    focusScore: 100
                });
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Scan Failed');
        }
    };

    return (
        <div className="flex h-screen bg-slate-900 text-white overflow-hidden items-center justify-center p-8">
            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Visual Terminal */}
                <div className="glass-card bg-slate-800/80 p-6 rounded-3xl border border-slate-700 shadow-2xl relative">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <MapPin className="text-cyan-400 w-6 h-6" />
                            <h2 className="text-xl font-bold font-mono text-cyan-50">Physical Zone Terminal</h2>
                        </div>
                        <select
                            value={currentZone}
                            onChange={(e) => setCurrentZone(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-cyan-300 rounded-lg px-3 py-1 text-sm font-bold focus:ring-2 focus:ring-cyan-500 outline-none"
                        >
                            {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                        </select>
                    </div>

                    <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-inner border border-slate-700">
                        <video ref={videoRef} autoPlay muted className="w-full h-full object-cover transform scale-x-[-1] opacity-70" />

                        {/* Overlay Styling */}
                        <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-xl pointer-events-none"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>

                        {isScanningActive && (
                            <div className="absolute inset-0 bg-cyan-500/10 animate-pulse pointer-events-none flex items-center justify-center">
                                <ScanLine className="w-24 h-24 text-cyan-400 opacity-50" />
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex gap-4">
                        <button
                            onClick={() => setIsScanningActive(!isScanningActive)}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm tracking-wider flex justify-center items-center gap-2 transition-all ${isScanningActive ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/50 shadow-lg' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/50 shadow-lg'}`}
                        >
                            <Camera className="w-5 h-5" />
                            {isScanningActive ? 'PAUSE FACE SCANNER' : 'START FACE SCANNER'}
                        </button>
                    </div>
                </div>

                {/* Info & RFID Terminal */}
                <div className="flex flex-col gap-6">
                    {/* RFID Simulator Box */}
                    <div className="glass-card bg-slate-800/80 p-6 rounded-3xl border border-slate-700 shadow-2xl">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-cyan-50">
                            <Fingerprint className="text-violet-400" /> Simulate RFID Swipe
                        </h3>
                        <p className="text-xs text-slate-400 mb-4">Focus the input box below and trigger your physical RFID reader (acts as keyboard), or simply type an employee email to mock the RFID mapping.</p>
                        <form onSubmit={handleRfidSubmit} className="flex gap-2">
                            <input
                                type="text"
                                autoFocus
                                value={rfidInput}
                                onChange={(e) => setRfidInput(e.target.value)}
                                placeholder="Waiting for RFID Card..."
                                className="flex-1 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                            />
                            <button type="submit" className="bg-violet-600 hover:bg-violet-500 px-6 py-3 rounded-xl font-bold transition-colors">
                                SCAN
                            </button>
                        </form>
                    </div>

                    {/* Scan Result Feedback */}
                    <motion.div
                        key={lastScanMessage?.time}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="flex-1 glass-card bg-slate-800/80 p-8 rounded-3xl border border-slate-700 shadow-2xl flex flex-col justify-center items-center text-center relative overflow-hidden"
                    >
                        {lastScanMessage ? (
                            <>
                                <div className={`absolute top-0 w-full h-2 ${lastScanMessage.action === 'ENTER' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                <LogIn className={`w-16 h-16 mb-4 ${lastScanMessage.action === 'ENTER' ? 'text-emerald-400' : 'text-rose-400'}`} />
                                <h1 className="text-3xl font-black text-white mb-2">{lastScanMessage.user}</h1>
                                <p className="text-xl text-slate-300 font-mono tracking-wider">
                                    <span className={lastScanMessage.action === 'ENTER' ? 'text-emerald-400' : 'text-rose-400'}>
                                        {lastScanMessage.action}
                                    </span>
                                </p>
                                <p className="text-slate-500 mt-4 text-sm font-bold uppercase">
                                    VIA {lastScanMessage.method} AT {lastScanMessage.time}
                                </p>

                                {lastScanMessage.alert && (
                                    <div className="mt-6 bg-rose-500/20 text-rose-300 px-4 py-2 border border-rose-500/50 rounded-lg flex items-center justify-center gap-2 font-bold w-full text-sm">
                                        <AlertTriangle className="w-4 h-4" />
                                        {lastScanMessage.alert}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="opacity-30 flex flex-col items-center">
                                <ScanLine className="w-16 h-16 mb-4" />
                                <p className="font-bold">Awaiting Next Detection...</p>
                            </div>
                        )}
                    </motion.div>
                </div>

            </div>
        </div>
    );
};

export default VirtualZoneScanner;
