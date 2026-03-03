import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';
// Use faceapi.tf to share engine
// eslint-disable-next-line no-unused-vars
const tf = faceapi.tf;
import socket from '../../utils/socket';
import { Camera, Activity, Smile, Smartphone, Clock, Eye, AlertTriangle, User } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import PostureCoach from './PostureCoach';
import HealthMonitor from './HealthMonitor';
import VoiceControl from './VoiceControl';
import { calculateGaze } from '../../utils/GazeEstimator';
import AnimatedBackground from '../UI/AnimatedBackground';

import faceHandler from '../../utils/faceHandler';

const EmployeeWorkspace = () => {
    const videoRef = useRef(null);
    const [currentUser, setCurrentUser] = useState(() => {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    });
    const [status, setStatus] = useState('Initializing');
    const [focusScore, setFocusScore] = useState(100);
    const [mood, setMood] = useState('Neutral');
    const [gazeStatus, setGazeStatus] = useState('Focused');
    const [postureStatus, setPostureStatus] = useState('Good');

    // Spy Feature States
    const [phoneDetected, setPhoneDetected] = useState(false);
    const [lastActivityTime, setLastActivityTime] = useState(() => Date.now());
    const [clickCount, setClickCount] = useState(0);

    // Analytics State
    const [focusHistory, setFocusHistory] = useState([]);
    // eslint-disable-next-line no-unused-vars
    const [emotionData, setEmotionData] = useState([
        { name: 'Neutral', value: 1 },
        { name: 'Happy', value: 0 },
        { name: 'Stress', value: 0 }
    ]);
    const COLORS = ['#9ca3af', '#22c55e', '#ef4444'];

    const [tasks, setTasks] = useState([]);
    const [xp, setXp] = useState(0);
    const [pomodoro, setPomodoro] = useState(1500); // 25 mins
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [announcements, setAnnouncements] = useState([]);

    // Pomodoro Logic
    useEffect(() => {
        let interval;
        if (isTimerRunning && pomodoro > 0) {
            interval = setInterval(() => setPomodoro(p => p - 1), 1000);
        } else if (pomodoro === 0) {
            toast.success("Focus Session Complete! Take a break.", { icon: '☕' });
            setIsTimerRunning(false);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, pomodoro]);

    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [editForm, setEditForm] = useState(() => {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
            const user = JSON.parse(userStr);
            return { fullName: user.fullName, email: user.email, password: '' };
        }
        return { fullName: '', email: '', password: '' };
    });

    const navigate = useNavigate();

    const getSnapshot = useCallback(() => {
        if (!videoRef.current) return null;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.6);
    }, []);

    function startVideo() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: {} })
                .then(stream => {
                    if (videoRef.current) videoRef.current.srcObject = stream;
                })
                .catch(err => console.error(err));
        }
    }

    // 1. Initial Setup
    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        // Sync theme
        if (theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');

        // Fetch tasks
        const fetchTasks = async () => {
            try {
                const res = await axios.get('/api/tasks');
                const myTasks = res.data.filter(t => t.assignee && (t.assignee._id === user._id || t.assignee === user._id));
                setTasks(myTasks);
                setXp(myTasks.filter(t => t.status === 'Completed').length * 250 + 1200);
            } catch (err) { console.error(err); }
        };

        const fetchAnnouncements = async () => {
            try {
                const res = await axios.get('/api/announcements');
                setAnnouncements(res.data);
            } catch (err) { console.error(err); }
        };

        fetchTasks();
        fetchAnnouncements();

        const setupAI = async () => {
            try {
                await faceHandler.loadModels();
                // Also ensure expressions net is loaded (it's loaded by loadModels if we add it)
                startVideo();
            } catch (err) {
                console.error("AI Setup Error:", err);
            }
        };
        setupAI();

        // Activity Listeners
        const updateActivity = () => {
            setLastActivityTime(Date.now());
            setClickCount(prev => prev + 1);
        };

        window.addEventListener('mousemove', updateActivity);
        window.addEventListener('keydown', updateActivity);
        window.addEventListener('click', updateActivity);

        return () => {
            window.removeEventListener('mousemove', updateActivity);
            window.removeEventListener('keydown', updateActivity);
            window.removeEventListener('click', updateActivity);
        };
    }, [navigate, theme, currentUser]);

    // 1.5 Screen Switch Detection
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.hidden && currentUser) {
                setFocusScore(prev => Math.max(0, prev - 5)); // Penalty for switching tabs
                toast.error("SCREEN SWITCH DETECTED! (-5% Focus)", { icon: '⚠️' });

                const screenshot = getSnapshot();
                try {
                    await axios.post('/api/monitoring/log-event', {
                        userId: currentUser._id,
                        type: 'SCREEN_SWITCH',
                        details: 'User switched tabs or minimized window',
                        severity: 'MEDIUM',
                        image: screenshot
                    });
                } catch (err) { console.error(err); }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [currentUser, getSnapshot]);

    // 1.6 Data Collection Interval (Charts)
    useEffect(() => {
        const interval = setInterval(() => {
            setFocusHistory(prev => {
                const newHistory = [...prev, { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), score: focusScore }];
                if (newHistory.length > 20) newHistory.shift();
                return newHistory;
            });

            // Update Emotion Stats (Simple heuristic for demo)
            setEmotionData(prev => {
                const newData = prev.map(item => ({ ...item })); // Deep clone for safety
                const type = mood === 'Happy' ? 'Happy' : (mood === 'Sad' || mood === 'Angry') ? 'Stress' : 'Neutral';
                const idx = newData.findIndex(d => d.name === type);
                if (idx !== -1) newData[idx].value += 1;
                return newData;
            });

        }, 5000); // Update charts every 5s
        return () => clearInterval(interval);
    }, [focusScore, mood]);

    const stateRef = useRef({
        status: 'Initializing',
        focusScore: 100,
        mood: 'Neutral',
        lastActivityTime: 0,
        postureStatus: 'Good'
    });

    // Sync refs with state
    useEffect(() => {
        stateRef.current.status = status;
        stateRef.current.focusScore = focusScore;
        stateRef.current.mood = mood;
        stateRef.current.lastActivityTime = lastActivityTime;
        stateRef.current.postureStatus = postureStatus;
    }, [status, focusScore, mood, lastActivityTime, postureStatus]);

    const [securityThreat, setSecurityThreat] = useState(null); // 'AWAY', 'MULTIPLE_FACES', null
    const [latency, setLatency] = useState(0);

    // 2. The "Spy" Loop (Runs every 1s)
    useEffect(() => {
        const interval = setInterval(async () => {
            const startTick = performance.now();

            // Check essential refs
            if (!videoRef.current || !currentUser) return;
            if (videoRef.current.paused || videoRef.current.ended || videoRef.current.readyState < 2) return;

            // Get current values from Ref
            let currentStatus = stateRef.current.status;
            let currentFocus = stateRef.current.focusScore;
            let currentMood = stateRef.current.mood;
            const lastActive = stateRef.current.lastActivityTime;
            const currentPosture = stateRef.current.postureStatus;

            let faceCount = 0;
            let detectedGaze = 'Unknown';
            let isPhone = false;
            let mainFace = null;

            // A. FACE & GAZE DETECTION (Upgraded to Multi-Face Security)
            try {
                if (faceHandler.isModelsLoaded) {
                    const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
                        .withFaceLandmarks()
                        .withFaceExpressions();

                    faceCount = detections.length;

                    if (faceCount > 0) {
                        // Assume the largest face box is the primary user
                        mainFace = detections.reduce((prev, current) =>
                            (prev.detection.box.area > current.detection.box.area) ? prev : current
                        );

                        // 1. Gaze
                        const landmarks = mainFace.landmarks.positions;
                        const gaze = calculateGaze(landmarks);
                        detectedGaze = gaze.status;
                        setGazeStatus(gaze.status);

                        if (gaze.score < 50) {
                            currentStatus = gaze.status;
                            currentFocus = Math.max(0, currentFocus - 1);
                        }

                        // 2. Expressions
                        const expressions = mainFace.expressions;
                        const sortedExpressions = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
                        const primary = sortedExpressions[0];
                        const secondary = sortedExpressions[1];

                        if (primary[0] === 'neutral' && primary[1] < 0.9 && secondary && secondary[1] > 0.05) {
                            currentMood = secondary[0].charAt(0).toUpperCase() + secondary[0].slice(1);
                        } else {
                            currentMood = primary[0].charAt(0).toUpperCase() + primary[0].slice(1);
                        }
                    }
                }
            } catch {
                // console.warn("FaceAPI Error:");
            }

            // B. OBJECT DETECTION
            try {
                if (faceHandler.cocoModel) {
                    const objects = await faceHandler.cocoModel.detect(videoRef.current);
                    const phoneObj = objects.find(obj => obj.class === 'cell phone');
                    isPhone = !!phoneObj;
                    setPhoneDetected(isPhone);
                }
            } catch {
                // console.warn("COCO Error:");
            }

            // C. LOGIC ENGINE & SECURITY THREATS
            const timeSinceLastAction = (Date.now() - lastActive) / 1000;
            const isIdle = timeSinceLastAction > 60;

            let threatLevel = null;

            if (faceCount > 1) {
                threatLevel = 'MULTIPLE_FACES';
                currentStatus = 'Security Risk (Multiple Faces)';
                currentFocus = Math.max(0, currentFocus - 10); // Heavy penalty
                if (!toast.threatToastShown) {
                    toast.error("SHOULDER SURFING DETECTED! Screen Locked.", { icon: '🚨', id: 'threat' });
                    toast.threatToastShown = true;
                    setTimeout(() => toast.threatToastShown = false, 5000);

                    // Log to server with screenshot
                    axios.post('/api/monitoring/log-event', {
                        userId: currentUser._id,
                        type: 'UNAUTHORIZED_PERSON',
                        details: 'Multiple faces detected in workspace',
                        severity: 'CRITICAL',
                        image: getSnapshot()
                    }).catch(console.error);
                }
            } else if (faceCount === 0) {
                threatLevel = 'AWAY';
                currentStatus = 'Away';
                currentFocus = Math.max(0, currentFocus - 2);
            } else if (isPhone) {
                currentStatus = 'Distracted (Phone)';
                currentFocus = Math.max(0, currentFocus - 5);
                if (!toast.phoneToastShown) {
                    toast.error("PHONE DETECTED!", { id: 'phone-alert', duration: 2000 });
                    toast.phoneToastShown = true;
                    setTimeout(() => toast.phoneToastShown = false, 5000);

                    // Log to server with screenshot
                    axios.post('/api/monitoring/log-event', {
                        userId: currentUser._id,
                        type: 'PHONE_DETECTED',
                        details: 'Employee using mobile phone during work',
                        severity: 'HIGH',
                        image: getSnapshot()
                    }).catch(console.error);
                }
            } else if (isIdle) {
                currentStatus = 'Idle / Away';
                currentFocus = Math.max(0, currentFocus - 2);
            } else {
                if (currentStatus === 'Initializing' || currentStatus === 'Away' || currentStatus === 'Idle / Away' || currentStatus.includes('Risk')) {
                    currentStatus = 'Active';
                }
                if (currentStatus.includes('Distracted') && !isPhone && detectedGaze === 'Focused') {
                    currentStatus = 'Active';
                }
                if (currentFocus < 100) currentFocus += 0.5;
            }

            // D. UPDATE LOCAL STATE
            if (currentStatus !== stateRef.current.status) setStatus(currentStatus);
            if (Math.floor(currentFocus) !== Math.floor(stateRef.current.focusScore)) setFocusScore(currentFocus);
            if (currentMood !== stateRef.current.mood) setMood(currentMood);
            if (threatLevel !== securityThreat) setSecurityThreat(threatLevel);

            // Calculate Latency
            const loopLatency = Math.round(performance.now() - startTick);
            setLatency(loopLatency);

            // E. SEND TO SERVER
            socket.emit('dashboard_update', {
                id: currentUser._id,
                status: currentStatus,
                focusScore: currentFocus,
                mood: currentMood,
                phoneDetected: isPhone,
                gaze: detectedGaze,
                posture: currentPosture,
                lastActive: lastActive,
                securityThreat: threatLevel
            });

        }, 1000);

        return () => clearInterval(interval);
    }, [currentUser, securityThreat, getSnapshot]);



    // Action Handlers
    const handleLogout = async () => {
        try {
            await axios.post('/api/auth/logout', { userId: currentUser._id });
            localStorage.clear();
            navigate('/login');
            toast.success("Successfully logged out and attendance recorded.");
        } catch (err) {
            console.error(err);
            localStorage.clear();
            navigate('/login');
        }
    };

    const startScreenShare = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" }, audio: false });

            // Create a canvas to capture frames
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();

            // Capture frame every 10 seconds
            const screenInterval = setInterval(() => {
                if (stream.active) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const base64Data = canvas.toDataURL('image/jpeg', 0.5); // Compress to 50%

                    // Send to Server
                    socket.emit('screenshot_upload', {
                        userId: currentUser._id,
                        image: base64Data,
                        type: 'Screen',
                        activityContext: status
                    });

                    toast.success("Screen captured", { id: 'screen-cap', duration: 1000, icon: '📸' });
                } else {
                    clearInterval(screenInterval);
                }
            }, 2000); // 2s for near real-time live monitor feed

            // Stop sharing listener
            stream.getVideoTracks()[0].onended = () => {
                clearInterval(screenInterval);
                toast('Screen Sharing Ended');
            };

            toast.success("Screen Recording Active");

        } catch (err) {
            console.error("Error starting screen share:", err);
            toast.error("Failed to start screen share");
        }
    };

    const handleVoiceCommand = (command) => {
        switch (command) {
            case 'STOP_CAMERA':
                if (videoRef.current) {
                    const stream = videoRef.current.srcObject;
                    if (stream) {
                        stream.getTracks().forEach(track => track.stop());
                        videoRef.current.srcObject = null;
                        setStatus('Camera Paused (Voice)');
                    }
                }
                break;
            case 'START_CAMERA':
                startVideo();
                setStatus('Active');
                break;
            case 'CLOCK_OUT':
                handleLogout();
                break;
            case 'CHECK_STATUS':
                toast(`Status: ${status} | Focus: ${Math.round(focusScore)}%`, { icon: '🤖' });
                break;
            case 'START_SCREEN':
                startScreenShare();
                break;
            default:
                break;
        }
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        toast.success(`Theme switched to ${newTheme} mode`);
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/auth/update-profile', {
                userId: currentUser.id || currentUser._id,
                ...editForm
            });
            setCurrentUser(res.data.user);
            localStorage.setItem('currentUser', JSON.stringify(res.data.user));
            setIsProfileOpen(false);
            toast.success("Profile Updated Successfully!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Update failed");
        }
    };

    if (!currentUser) return <div>Loading...</div>;

    return (
        <div className={`h-screen flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-800'}`}>
            <AnimatedBackground intensity={theme === 'dark' ? 'low' : 'high'} />

            {/* THEME TOGGLE & PROFILE TRIGGER */}
            <div className="fixed top-8 left-8 z-50 flex gap-3">
                <button
                    onClick={toggleTheme}
                    className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl hover:scale-110 transition-all text-indigo-500"
                >
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>
                <button
                    onClick={() => setIsProfileOpen(true)}
                    className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl hover:scale-110 transition-all"
                >
                    <User className="w-5 h-5 text-indigo-500" />
                </button>
            </div>

            {/* PROFILE SIDEBAR MODAL */}
            <AnimatePresence>
                {isProfileOpen && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        className="fixed right-0 top-0 h-full w-full max-w-sm bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl z-[100] shadow-[-20px_0_50px_rgba(0,0,0,0.2)] border-l border-white/20 p-8 flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black italic">PILOT PROFILE</h2>
                            <button onClick={() => setIsProfileOpen(false)} className="text-slate-400 hover:text-rose-500">✕</button>
                        </div>

                        <div className="flex flex-col items-center gap-4 mb-8">
                            <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-indigo-500 shadow-2xl relative group">
                                {currentUser.profileImage ? (
                                    <img src={currentUser.profileImage} className="w-full h-full object-cover" />
                                ) : (
                                    <img src={`https://ui-avatars.com/api/?name=${currentUser.fullName}&background=6366f1&color=fff`} className="w-full h-full object-cover" />
                                )}
                                <div className="absolute inset-0 bg-indigo-600/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold">{currentUser.fullName}</h3>
                                <p className="text-xs font-black text-indigo-500 uppercase tracking-widest">{currentUser.department}</p>
                            </div>
                        </div>

                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase">Identity Name</label>
                                <input
                                    type="text"
                                    value={editForm.fullName}
                                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                    className="w-full bg-slate-100 dark:bg-white/5 border-none p-3 rounded-xl focus:ring-2 ring-indigo-500 outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase">Comm Channel (Email)</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    className="w-full bg-slate-100 dark:bg-white/5 border-none p-3 rounded-xl focus:ring-2 ring-indigo-500 outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase">New Security Code</label>
                                <input
                                    type="password"
                                    placeholder="Keep empty to leave as is"
                                    value={editForm.password}
                                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                    className="w-full bg-slate-100 dark:bg-white/5 border-none p-3 rounded-xl focus:ring-2 ring-indigo-500 outline-none"
                                />
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all mt-4">
                                UPDATE BIOMETRIC DATA
                            </button>
                        </form>

                        <button onClick={handleLogout} className="mt-auto w-full py-4 text-rose-500 font-bold text-xs uppercase tracking-widest border border-rose-500/20 rounded-2xl hover:bg-rose-500 hover:text-white transition-all">
                            TERMINATE SESSION
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-[1600px] w-full h-[90vh] grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">

                {/* COLUMN 1: MISSION HUB (Tasks) */}
                <div className="lg:col-span-3 h-full flex flex-col gap-6">
                    <div className="glass-card bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/60 p-6 shadow-xl flex-1 flex flex-col overflow-hidden">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-500 rounded-lg text-white shadow-lg shadow-indigo-200">
                                <Activity className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500">Mission Hub</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                            {tasks.length > 0 ? tasks.map(task => (
                                <div key={task._id} className="p-4 rounded-2xl bg-white/50 border border-white hover:border-indigo-300 transition-all group cursor-pointer shadow-sm hover:translate-x-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${task.priority === 'High' ? 'bg-rose-100 text-rose-600' :
                                            task.priority === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                                            }`}>
                                            {task.priority}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400">{task.status}</span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1">{task.title}</h4>
                                    {task.aiSentiment && (
                                        <div className="flex items-center gap-1 mt-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${task.aiSentiment.label === 'Positive' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                            <span className="text-[9px] font-bold uppercase text-slate-500">AI Stress: {task.aiSentiment.label}</span>
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <div className="text-center py-12 opacity-50">
                                    <p className="text-sm font-bold">No Missions Assigned</p>
                                </div>
                            )}
                        </div>

                        {/* Team Activity Enhancement */}
                        <div className="pt-4 mt-auto border-t border-slate-200 dark:border-white/10">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Team Radar</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-[10px] font-bold">JD</div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold">Jane Doe <span className="text-emerald-500 ml-2">● Online</span></p>
                                        <p className="text-[9px] text-slate-400">Fixed focus spike</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => toast('Sent 🔥 to Jane')} className="text-xs hover:scale-125 transition-transform">🔥</button>
                                        <button onClick={() => toast('Sent ❤️ to Jane')} className="text-xs hover:scale-125 transition-transform">❤️</button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 opacity-60">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[10px] font-bold">MK</div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold">Mike Ross <span className="text-slate-400 ml-2">● Away</span></p>
                                        <p className="text-[9px] text-slate-400">Lunch break</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => toast('Sent ☕ to Mike')} className="text-xs hover:scale-125 transition-transform">☕</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Events Mini Feed */}
                    <div className="glass-card bg-slate-900/90 backdrop-blur-xl rounded-[2rem] border border-white/10 p-6 shadow-2xl h-[200px] flex flex-col">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                            Security Pulse
                        </h3>
                        <div className="text-[10px] font-mono text-slate-300 space-y-2">
                            <div className="flex gap-2">
                                <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span>
                                <span className="text-emerald-400">SESSION_VERIFIED</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span>
                                <span className="text-amber-400">TELEMETRY_SYNCED</span>
                            </div>
                            {latency > 150 && (
                                <div className="flex gap-2">
                                    <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span>
                                    <span className="text-rose-400">LATENCY_SPIKE_DETECTED</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* COLUMN 2: COMMAND CENTER (Monitor) */}
                <div className="lg:col-span-6 h-full flex flex-col gap-6">
                    <div className="flex-1 glass-card bg-slate-900 rounded-[3rem] border border-white/20 shadow-2xl relative overflow-hidden flex flex-col group p-2">

                        {/* THE PILOT DASHBOARD */}
                        <div className="flex-1 relative rounded-[2.5rem] overflow-hidden bg-black">
                            {/* HUD Overlays */}
                            <div className="absolute top-8 left-8 z-20 flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <div className="px-2 py-0.5 bg-rose-600 text-[10px] font-black text-white rounded skew-x-[-15deg] shadow-lg shadow-rose-500/30">LIVE</div>
                                    <span className="text-white/50 text-xs font-mono tracking-widest">{currentUser.fullName ? currentUser.fullName.toUpperCase() : 'USER'}</span>
                                </div>
                                <div className="text-[10px] text-white/30 font-mono">0.05.29.11 // ALPHA_UNIT</div>

                                {/* POMODORO TIMER HUD */}
                                <div className="mt-4 p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-indigo-400 uppercase">Focus Timer</span>
                                        <span className="text-xl font-mono text-white font-bold">{formatTime(pomodoro)}</span>
                                    </div>
                                    <button
                                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-white transition-all ${isTimerRunning ? 'bg-rose-500 shadow-rose-500/30' : 'bg-indigo-500 shadow-indigo-500/30'}`}
                                    >
                                        {isTimerRunning ? '⏸' : '▶'}
                                    </button>
                                </div>
                            </div>

                            <div className="absolute top-8 right-8 z-20 text-white/50 font-mono text-[10px] text-right">
                                CAM_SOURCE: 0x82<br />
                                FOV: 90.0°<br />
                                <span className={latency > 100 ? 'text-amber-500' : 'text-emerald-500'}>FPS: {latency > 0 ? Math.round(1000 / latency) : 30}</span>
                            </div>

                            {/* Center Target */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                                <div className="w-48 h-48 border-2 border-white/20 rounded-full flex items-center justify-center rotate-45">
                                    <div className="w-full h-0.5 bg-white/20"></div>
                                    <div className="h-full w-0.5 bg-white/20 absolute"></div>
                                </div>
                                <div className="absolute w-64 h-64 border border-white/10 rounded-full animate-spin-slow"></div>
                            </div>

                            <video ref={videoRef} autoPlay muted className="w-full h-full object-cover transform scale-x-[-1] opacity-60" />

                            {/* Threat Overlay */}
                            {securityThreat && (
                                <div className="absolute inset-0 z-[100] bg-rose-600/20 backdrop-blur-2xl flex flex-col items-center justify-center text-center p-12 transition-all duration-700 animate-pulse">
                                    <AlertTriangle className="w-32 h-32 text-white mb-6 animate-bounce" />
                                    <h1 className="text-6xl font-black text-white uppercase tracking-tighter mb-4 italic">SECURITY BREACH</h1>
                                    <p className="text-2xl text-rose-100 font-bold max-w-lg">
                                        {securityThreat === 'MULTIPLE_FACES' ? 'Multiple Identities Detected. Privacy Mode Engaged.' : 'Workspace Inactive. Identity Auth Required.'}
                                    </p>
                                </div>
                            )}

                            {phoneDetected && (
                                <div className="absolute inset-0 z-[90] border-[16px] border-rose-500/50 flex items-center justify-center pointer-events-none animate-pulse">
                                    <div className="bg-rose-600 text-white p-6 rounded-full rotate-[-15deg] shadow-2xl translate-y-[-100px] pointer-events-auto">
                                        <Smartphone className="w-16 h-16" />
                                    </div>
                                </div>
                            )}

                            {/* Posture Overlay Component */}
                            <PostureCoach videoRef={videoRef} onPostureUpdate={setPostureStatus} />
                        </div>

                        {/* Lower Command Row */}
                        <div className="p-6 flex items-center justify-between border-t border-white/10">
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Posture</span>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${postureStatus === 'Good' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'} shadow-lg`}></div>
                                        <span className="text-sm font-bold text-white uppercase tracking-tighter">{postureStatus || 'CALIBRATING'}</span>
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-white/10"></div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Gaze Tech</span>
                                    <div className="flex items-center gap-2">
                                        <Eye className="w-4 h-4 text-white/60" />
                                        <span className="text-sm font-bold text-white uppercase tracking-tighter">{gazeStatus || 'SYNCING'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={startScreenShare} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-white/10 hover:border-white/30 backdrop-blur-sm">
                                    Share Screen
                                </button>
                                <button onClick={handleLogout} className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-rose-900/20 active:scale-95">
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUMN 3: BIOMETRIC ANALYTICS (Stats) */}
                <div className="lg:col-span-3 h-full flex flex-col gap-6">
                    {/* Level/Gamification Card */}
                    <div className="glass-card bg-indigo-600 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden group border border-indigo-400">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-6">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                    <Smile className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-white/80 font-black text-xs tracking-widest">RANK: GOLD II</span>
                            </div>
                            <h3 className="text-white text-3xl font-black mb-1">{xp.toLocaleString()} <span className="text-sm font-bold text-indigo-200">XP</span></h3>
                            <div className="w-full bg-white/10 h-2 rounded-full mt-2 overflow-hidden border border-white/5">
                                <div className="bg-white h-full transition-all duration-1000" style={{ width: '75%' }}></div>
                            </div>
                            <p className="text-indigo-100 text-[10px] font-bold mt-2 uppercase tracking-wide">3.2k to next level</p>
                        </div>
                    </div>

                    {/* Stats Wing */}
                    <div className="glass-card bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white/60 p-6 shadow-xl flex-1 flex flex-col gap-6">
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Focus Level</h3>
                                <span className="text-2xl font-black text-indigo-600">{Math.round(focusScore)}%</span>
                            </div>
                            <div className="h-32 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={focusHistory}>
                                        <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={false} animationDuration={500} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Current Mood</span>
                                <span className="text-lg font-black text-slate-800 tracking-tighter">{mood}</span>
                            </div>
                            <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl">
                                {mood === 'Happy' ? '😊' : mood === 'Sad' ? '😔' : mood === 'Surprised' ? '😮' : '😐'}
                            </div>
                        </div>

                        <div className="mt-auto space-y-4">
                            {/* Focus Heatmap Enhancement */}
                            <div>
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Intensity Heatmap (Last 12hr)</h4>
                                <div className="flex gap-1 px-1">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
                                        <div key={i} className={`flex-1 h-3 rounded-sm ${i % 3 === 0 ? 'bg-indigo-500' :
                                            i % 5 === 0 ? 'bg-indigo-200' : 'bg-indigo-400'
                                            } transition-all hover:scale-125 cursor-help border border-white/10`} title={`Hour ${i}: High Intensity`}></div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                <span>Core Productivity</span>
                                <span className="text-indigo-500">EXCEPTIONAL</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-white/50 p-3 rounded-2xl border border-white">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Latency</span>
                                    <p className="text-sm font-black text-slate-800 font-mono">{latency}ms</p>
                                </div>
                                <div className="bg-white/50 p-3 rounded-2xl border border-white">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Input</span>
                                    <p className="text-sm font-black text-slate-800 font-mono">{clickCount}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <HealthMonitor isActive={status !== 'Away'} focusScore={focusScore} />
            <VoiceControl onCommand={handleVoiceCommand} />

            {/* PUBLIC BROADCAST TICKER */}
            <div className="fixed bottom-0 left-0 w-full bg-slate-900/80 backdrop-blur-md border-t border-white/10 py-1.5 z-[100] overflow-hidden">
                <div className="flex whitespace-nowrap animate-marquee">
                    <span className="text-[10px] font-black text-indigo-400 uppercase px-8">📢 SYSTEM BROADCAST:</span>
                    {announcements.length > 0 ? announcements.map((a, i) => (
                        <span key={i} className={`text-[10px] font-bold uppercase px-4 italic ${a.type === 'congrats' ? 'text-emerald-400' :
                            a.type === 'urgent' ? 'text-rose-400' : 'text-white'
                            }`}>
                            {a.message}...
                        </span>
                    )) : (
                        <span className="text-[10px] font-bold text-white uppercase px-4 italic">Scanning for active airwaves... no current broadcasts...</span>
                    )}
                    {/* Duplicate for seamless effect */}
                    <span className="text-[10px] font-black text-indigo-400 uppercase px-8">📢 SYSTEM BROADCAST:</span>
                    {announcements.map((a, i) => (
                        <span key={`dup-${i}`} className={`text-[10px] font-bold uppercase px-4 italic ${a.type === 'congrats' ? 'text-emerald-400' :
                            a.type === 'urgent' ? 'text-rose-400' : 'text-white'
                            }`}>
                            {a.message}...
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EmployeeWorkspace;
