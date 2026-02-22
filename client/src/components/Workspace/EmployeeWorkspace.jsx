import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
// Use faceapi.tf to share engine
const tf = faceapi.tf;
import socket from '../../utils/socket';
import { Camera, Activity, Smile, Smartphone, Clock, Eye, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import PostureCoach from './PostureCoach';
import HealthMonitor from './HealthMonitor';
import VoiceControl from './VoiceControl';
import { calculateGaze } from '../../utils/GazeEstimator';
import AnimatedBackground from '../UI/AnimatedBackground';

import faceHandler from '../../utils/faceHandler';

const EmployeeWorkspace = () => {
    const videoRef = useRef(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [status, setStatus] = useState('Initializing');
    const [focusScore, setFocusScore] = useState(100);
    const [mood, setMood] = useState('Neutral');
    const [gazeStatus, setGazeStatus] = useState('Focused');
    const [postureStatus, setPostureStatus] = useState('Good');

    // Spy Feature States
    const [phoneDetected, setPhoneDetected] = useState(false);
    const [lastActivityTime, setLastActivityTime] = useState(Date.now());
    const [clickCount, setClickCount] = useState(0);

    // Analytics State
    const [focusHistory, setFocusHistory] = useState([]);
    const [emotionData, setEmotionData] = useState([
        { name: 'Neutral', value: 1 },
        { name: 'Happy', value: 0 },
        { name: 'Stress', value: 0 }
    ]);
    const COLORS = ['#9ca3af', '#22c55e', '#ef4444'];

    const navigate = useNavigate();

    // 1. Initial Setup
    useEffect(() => {
        const user = localStorage.getItem('currentUser');
        if (!user) {
            navigate('/login');
            return;
        }
        setCurrentUser(JSON.parse(user));

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
    }, [navigate]);

    // 1.5 Screen Switch Detection
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.hidden && currentUser) {
                setFocusScore(prev => Math.max(0, prev - 5)); // Penalty for switching tabs
                toast.error("SCREEN SWITCH DETECTED! (-5% Focus)", { icon: '⚠️' });
                try {
                    await axios.post('/api/monitoring/log-event', {
                        userId: currentUser._id,
                        type: 'SCREEN_SWITCH',
                        details: 'User switched tabs or minimized window',
                        severity: 'MEDIUM'
                    });
                } catch (err) { console.error(err); }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [currentUser]);

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

    const startVideo = () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: {} })
                .then(stream => {
                    if (videoRef.current) videoRef.current.srcObject = stream;
                })
                .catch(err => console.error(err));
        }
    };

    // State Refs for Interval Access
    const stateRef = useRef({
        status: 'Initializing',
        focusScore: 100,
        mood: 'Neutral',
        lastActivityTime: Date.now(),
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

            let faceDetected = false;
            let detectedGaze = 'Unknown';
            let isPhone = false;

            // A. FACE & GAZE DETECTION (Optimized for single user)
            try {
                if (faceHandler.isModelsLoaded) {
                    const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
                        .withFaceLandmarks()
                        .withFaceExpressions();

                    if (detection) {
                        faceDetected = true;

                        // 1. Gaze
                        const landmarks = detection.landmarks.positions;
                        const gaze = calculateGaze(landmarks);
                        detectedGaze = gaze.status;
                        setGazeStatus(gaze.status);

                        if (gaze.score < 50) {
                            currentStatus = gaze.status;
                            currentFocus = Math.max(0, currentFocus - 1);
                        }

                        // 2. Expressions (Improved Sensitivity)
                        const expressions = detection.expressions;
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
            } catch (err) {
                // console.warn("FaceAPI Error:", err);
            }

            // B. OBJECT DETECTION
            try {
                if (faceHandler.cocoModel) {
                    const objects = await faceHandler.cocoModel.detect(videoRef.current);
                    const phoneObj = objects.find(obj => obj.class === 'cell phone');
                    isPhone = !!phoneObj;
                    setPhoneDetected(isPhone);
                }
            } catch (err) {
                // console.warn("COCO Error:", err);
            }

            // C. LOGIC ENGINE
            const timeSinceLastAction = (Date.now() - lastActive) / 1000;
            const isIdle = timeSinceLastAction > 60;

            if (isPhone) {
                currentStatus = 'Distracted (Phone)';
                currentFocus = Math.max(0, currentFocus - 5);
                if (!toast.phoneToastShown) {
                    toast.error("PHONE DETECTED!", { id: 'phone-alert', duration: 2000 });
                    toast.phoneToastShown = true;
                    setTimeout(() => toast.phoneToastShown = false, 5000);
                }
            } else if (isIdle) {
                currentStatus = 'Idle / Away';
                currentFocus = Math.max(0, currentFocus - 2);
            } else if (faceDetected) {
                if (currentStatus === 'Initializing' || currentStatus === 'Away' || currentStatus === 'Idle / Away') {
                    currentStatus = 'Active';
                }
                if (currentStatus.includes('Distracted') && !isPhone && detectedGaze === 'Focused') {
                    currentStatus = 'Active';
                }
                if (currentFocus < 100) currentFocus += 0.5;
            } else {
                currentStatus = 'Away';
                currentFocus = Math.max(0, currentFocus - 2);
            }

            // D. UPDATE LOCAL STATE
            if (currentStatus !== stateRef.current.status) setStatus(currentStatus);
            if (Math.floor(currentFocus) !== Math.floor(stateRef.current.focusScore)) setFocusScore(currentFocus);
            if (currentMood !== stateRef.current.mood) setMood(currentMood);

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
                lastActive: lastActive
            });

        }, 1000);

        return () => clearInterval(interval);
    }, [currentUser]);



    // Action Handlers
    const handleClockIn = async () => {
        try {
            await axios.post('/api/attendance/clock-in', { userId: currentUser._id });
            toast.success("Clocked In Successfully");
        } catch (err) {
            toast.error("Clock In Failed");
        }
    };

    const handleClockOut = async () => {
        try {
            await axios.post('/api/attendance/clock-out', { userId: currentUser._id });
            toast.success("Clocked Out");
        } catch (err) {
            toast.error("Clock Out Failed");
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
            }, 10000); // 10s for demo purposes

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
                handleClockOut();
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

    if (!currentUser) return <div>Loading...</div>;

    return (
        <div className="h-screen bg-transparent flex flex-col items-center justify-center p-8 relative overflow-hidden">
            <AnimatedBackground intensity="high" />

            <div className="absolute top-4 right-4 flex gap-2 z-50">
                <button onClick={startScreenShare} className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 font-bold shadow-lg border border-indigo-400 transition-all hover:scale-105">Share Screen</button>
                <button onClick={handleClockIn} className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-bold shadow-lg border border-emerald-400 transition-all hover:scale-105">Clock In</button>
                <button onClick={handleClockOut} className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 font-bold shadow-lg border border-rose-400 transition-all hover:scale-105">Clock Out</button>
            </div>

            <div className="max-w-7xl w-full glass-card rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] border border-white/60 relative z-10 font-sans">
                {/* Left: Monitor */}
                <div className="flex-[2] p-8 border-r border-slate-200/50 flex flex-col items-center justify-center relative bg-white/40">

                    <h2 className="absolute top-6 left-6 text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-500 animate-pulse" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-cyan-500">Workstation Monitor</span>
                    </h2>

                    {/* Video Feed Wrapper */}
                    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-indigo-200 group">
                        {/* HUD Corners */}
                        <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-indigo-400/50 rounded-tl-lg"></div>
                        <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-indigo-400/50 rounded-tr-lg"></div>
                        <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-indigo-400/50 rounded-bl-lg"></div>
                        <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-indigo-400/50 rounded-br-lg"></div>

                        {/* Scan Line Animation */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/10 to-transparent h-full w-full animate-scan pointer-events-none z-10"></div>

                        <video ref={videoRef} autoPlay muted className="w-full h-full object-cover transform scale-x-[-1]" />

                        {/* Overlays */}
                        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-red-600/90 rounded-full text-white text-xs font-bold animate-pulse z-20 shadow-red-500/50 shadow-lg">
                            REC ●
                        </div>

                        {phoneDetected && (
                            <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 backdrop-blur-sm z-30 border-4 border-red-500 animate-pulse">
                                <div className="bg-black/80 text-white px-6 py-4 rounded-xl flex flex-col items-center border border-red-500 shadow-2xl">
                                    <Smartphone className="w-12 h-12 mb-2 text-red-500" />
                                    <span className="text-2xl font-black uppercase tracking-widest text-red-500">PHONE DETECTED</span>
                                    <span className="text-sm text-gray-300">Violating Security Protocol</span>
                                </div>
                            </div>
                        )}

                        {/* Advanced AI Overlays */}
                        <PostureCoach videoRef={videoRef} onPostureUpdate={setPostureStatus} />
                    </div>

                    <div className="mt-4 flex gap-4 text-xs font-mono text-slate-500">
                        <span>LATENCY: <span className={latency > 100 ? 'text-amber-500' : 'text-emerald-500'}>{latency}ms</span></span>
                        <span>|</span>
                        <span>AI MODEL: MULTI-MODAL (Face+Pose)</span>
                        <span>|</span>
                        <span className={postureStatus === 'Good' ? 'text-emerald-600' : 'text-rose-600'}>
                            POSTURE: {postureStatus ? postureStatus.toUpperCase() : 'INIT'}
                        </span>
                        <span>|</span>
                        <span className={gazeStatus === 'Focused' ? 'text-emerald-600' : 'text-amber-600'}>
                            GAZE: {gazeStatus ? gazeStatus.toUpperCase() : 'INIT'}
                        </span>
                    </div>
                </div>

                {/* Right: Stats Panel */}
                <div className="flex-1 p-8 bg-white/60 backdrop-blur-md flex flex-col gap-6 overflow-y-auto border-l border-slate-200/50">
                    {/* User Profile */}
                    <div className="flex items-center gap-4 p-4 bg-white/40 rounded-xl shadow-sm border border-white/50 hover:bg-white/60 transition-colors">
                        <img src={`https://ui-avatars.com/api/?name=${currentUser.fullName}&background=6366f1&color=fff`} className="w-12 h-12 rounded-full border-2 border-indigo-200" />
                        <div>
                            <h3 className="font-bold text-slate-800">{currentUser.fullName}</h3>
                            <p className="text-xs text-indigo-500 font-bold uppercase tracking-widest">{currentUser.role || 'Employee'}</p>
                        </div>
                    </div>

                    {/* Status Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-xl border backdrop-blur-sm ${status.includes('Distracted') ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'} transition-colors duration-500`}>
                            <p className="text-[10px] opacity-70 mb-1 font-bold uppercase">Current Status</p>
                            <p className="font-bold truncate">{status}</p>
                        </div>
                        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl backdrop-blur-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-200/50 rounded-full blur-xl -mr-4 -mt-4"></div>
                            <p className="text-[10px] text-indigo-600 mb-1 font-bold uppercase">Focus Score</p>
                            <p className="text-3xl font-black text-indigo-600">{Math.round(focusScore)}<span className="text-sm align-top">%</span></p>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 gap-4">
                        {/* Focus Trend */}
                        <div className="bg-white/50 p-4 rounded-xl border border-white/60 shadow-sm backdrop-blur-sm">
                            <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider flex justify-between">
                                <span>Real-Time Focus Trend</span>
                                <span className="text-indigo-600">{Math.round(focusScore)}%</span>
                            </h4>
                            <div className="h-32 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={focusHistory}>
                                        <XAxis dataKey="time" hide />
                                        <YAxis domain={[0, 100]} hide />
                                        <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', backgroundColor: '#fff', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                                        <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={false} animationDuration={500} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Emotion Distribution */}
                        <div className="bg-white/50 p-4 rounded-xl border border-white/60 shadow-sm backdrop-blur-sm flex items-center justify-between">
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Emotion Analysis</h4>
                                <p className="text-2xl font-bold text-slate-800">{mood}</p>
                                <p className="text-[10px] text-slate-500">SESSION AGGREGATE</p>
                            </div>
                            <div className="h-20 w-20">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={emotionData} cx="50%" cy="50%" innerRadius={15} outerRadius={30} paddingAngle={2} dataKey="value">
                                            {emotionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Session Info */}
                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 bg-white/40 p-3 rounded-lg border border-white/50">
                        <div className="flex flex-col">
                            <span className="font-bold uppercase tracking-wider mb-1">Interactions</span>
                            <span className="font-mono text-slate-700">{clickCount} events</span>
                        </div>
                        <div className="flex flex-col text-right">
                            <span className="font-bold uppercase tracking-wider mb-1">Last Active</span>
                            <span className="font-mono text-slate-700">{new Date(lastActivityTime).toLocaleTimeString()}</span>
                        </div>
                    </div>

                    <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="w-full py-3 text-red-600 text-sm font-bold border border-red-200 hover:bg-red-50 rounded-lg transition-all hover:shadow-md mt-auto">
                        TERMINATE SESSION
                    </button>
                </div>
            </div>
            <HealthMonitor isActive={status !== 'Idle' && status !== 'Away'} focusScore={focusScore} />
            <VoiceControl onCommand={handleVoiceCommand} />
        </div>
    );
};

export default EmployeeWorkspace;
