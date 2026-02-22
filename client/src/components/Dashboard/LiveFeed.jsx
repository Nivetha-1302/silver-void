import React, { useState, useEffect, useRef } from 'react';
import { Activity, Bug, Signal, MonitorOff, RotateCw } from 'lucide-react';
import socket from '../../utils/socket';
import * as faceapi from '@vladmandic/face-api';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

// Simple Error Boundary Component
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("LiveFeed Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 bg-red-100 text-red-800 rounded-lg flex flex-col items-center justify-center h-full">
                    <Bug className="w-8 h-8 mb-2" />
                    <h3 className="font-bold">Component Crashed</h3>
                    <p className="text-xs font-mono">{this.state.error?.message}</p>
                </div>
            );
        }
        return this.props.children;
    }
}

// Thresholds
const FACE_CONFIDENCE = 0.5;
const PHONE_CONFIDENCE = 0.6;

const VideoComponent = ({ stream, cocoModel, modelsLoaded }) => {
    const videoRef = useRef(null);
    const imgRef = useRef(null);
    const canvasRef = useRef(null);
    const [blobUrl, setBlobUrl] = useState(null);
    const requestRef = useRef();

    // Handle Blob Conversion
    useEffect(() => {
        if (stream.isMobileStream && stream.videoBlob) {
            const url = URL.createObjectURL(new Blob([stream.videoBlob], { type: 'image/jpeg' }));
            setBlobUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        if (!stream.videoBlob) setBlobUrl(null);
    }, [stream.videoBlob, stream.isMobileStream]);

    // Webcam Auto-Bind
    useEffect(() => {
        if (stream.isWebcam && stream.videoSrc && videoRef.current) {
            videoRef.current.srcObject = stream.videoSrc;
        }
    }, [stream.videoSrc, stream.isWebcam]);

    // --- AI DETECTION LOOP ---
    useEffect(() => {
        if (!modelsLoaded || !cocoModel) return;

        const performDetection = async () => {
            if (!canvasRef.current) return;
            const videoEl = stream.isMobileStream ? imgRef.current : videoRef.current;

            // DEFENSIVE CHECKS: Element Existence & Readiness
            if (!videoEl) {
                requestRef.current = requestAnimationFrame(performDetection);
                return;
            }

            // Check dimensions - vital to avoid FaceAPI crash
            if (videoEl.clientWidth === 0 || videoEl.clientHeight === 0) {
                requestRef.current = requestAnimationFrame(performDetection);
                return;
            }

            // Check media readiness
            if (videoEl.tagName === 'VIDEO' && videoEl.readyState < 2) {
                requestRef.current = requestAnimationFrame(performDetection);
                return;
            }
            if (videoEl.tagName === 'IMG' && !videoEl.complete) {
                requestRef.current = requestAnimationFrame(performDetection);
                return;
            }

            try {
                const displaySize = { width: videoEl.clientWidth, height: videoEl.clientHeight };
                faceapi.matchDimensions(canvasRef.current, displaySize);

                // 1. Detect Faces & Expressions
                try {
                    const faceDetections = await faceapi.detectAllFaces(videoEl, new faceapi.TinyFaceDetectorOptions({ inputSize: 128, scoreThreshold: FACE_CONFIDENCE }))
                        .withFaceExpressions();
                    const resizedFaces = faceapi.resizeResults(faceDetections, displaySize);

                    const ctx = canvasRef.current.getContext('2d');
                    ctx.clearRect(0, 0, displaySize.width, displaySize.height);

                    // Draw Expressions
                    faceapi.draw.drawDetections(canvasRef.current, resizedFaces);
                    resizedFaces.forEach(det => {
                        const { expressions, detection } = det;
                        const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
                        const bestExpr = sorted[0] ? sorted[0][0] : 'neutral';
                        const score = sorted[0] ? sorted[0][1] : 0;

                        const { x, y, width } = detection.box;

                        ctx.fillStyle = '#3b82f6';
                        ctx.fillRect(x, y - 25, width, 25);
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 14px sans-serif';
                        ctx.fillText(`${bestExpr.toUpperCase()} ${(score * 100).toFixed(0)}%`, x + 5, y - 7);
                    });
                } catch (faceErr) {
                    // console.warn("Face Detect Warning:", faceErr);
                }

                // 2. Detect Objects (Phones)
                try {
                    let predictions = await cocoModel.detect(videoEl);
                    const ctx = canvasRef.current.getContext('2d');

                    predictions.forEach(pred => {
                        if (pred.class === 'cell phone' && pred.score > PHONE_CONFIDENCE) {
                            const [x, y, width, height] = pred.bbox;

                            // Draw Red Box
                            ctx.strokeStyle = '#ef4444';
                            ctx.lineWidth = 4;
                            ctx.strokeRect(x, y, width, height);
                            ctx.fillStyle = '#ef4444';
                            ctx.fillRect(x, y - 30, width, 30);
                            ctx.fillStyle = '#ffffff';
                            ctx.font = 'bold 16px monospace';
                            ctx.fillText(`🚫 PHONE DETECTED`, x + 5, y - 8);
                        }
                    });
                } catch (cocoErr) {
                    // console.warn("COCO Warning:", cocoErr);
                }

            } catch (err) {
                console.error("Critical AI Loop Verify Error:", err);
            }

            requestRef.current = requestAnimationFrame(performDetection);
        };

        requestRef.current = requestAnimationFrame(performDetection);
        return () => cancelAnimationFrame(requestRef.current);
    }, [modelsLoaded, cocoModel, stream, blobUrl]); // Re-run when source changes

    // RENDER: Mobile Stream
    if (stream.isMobileStream) {
        const src = blobUrl || stream.videoSrc;
        return (
            <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden group">
                {src ? (
                    <>
                        <img
                            ref={imgRef}
                            src={src}
                            className="w-full h-full object-contain"
                            alt="Mobile Stream"
                            crossOrigin="anonymous"
                        />
                        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-20 w-full h-full" />
                    </>
                ) : (
                    <NoSignalOverlay name={stream.name} />
                )}

                {src && (
                    <div className="absolute top-2 left-2 bg-green-600/90 text-white text-[10px] px-1 font-mono rounded z-30 flex items-center gap-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> LIVE
                    </div>
                )}
            </div>
        );
    }

    // RENDER: Webcam
    if (stream.isWebcam) {
        return (
            <div className="relative w-full h-full">
                <video ref={videoRef} autoPlay muted className="w-full h-full object-cover transform scale-x-[-1]" />
                <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-20 w-full h-full transform scale-x-[-1]" />

                <div className="absolute top-2 left-2 bg-green-600/90 text-white text-[10px] px-1 font-mono rounded z-30 flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> LOCAL
                </div>
            </div>
        );
    }

    // RENDER: Static Video File (if any)
    if (stream.videoSrc && !stream.isWebcam) {
        return <video src={stream.videoSrc} autoPlay loop muted className="w-full h-full object-cover" />;
    }

    // RENDER: No Signal / Placeholder
    return <NoSignalOverlay name={stream.name} />;
};

const NoSignalOverlay = ({ name }) => (
    <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Subtle Noise Texture */}
        <div className="absolute inset-0 opacity-5 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

        {/* Animated Scanline */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-full w-full animate-scanline pointer-events-none" />

        <div className="z-10 flex flex-col items-center gap-3 text-gray-600">
            <MonitorOff className="w-12 h-12 opacity-50" />
            <div className="flex flex-col items-center">
                <span className="text-xl font-black tracking-widest text-gray-700">NO SIGNAL</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-600">
                    {name} • OFFLINE
                </span>
            </div>
        </div>

        {/* Glitch Effect Elements */}
        <div className="absolute top-10 left-0 w-full h-[1px] bg-white/10" />
        <div className="absolute bottom-10 left-0 w-full h-[1px] bg-white/10" />
    </div>
);

import faceHandler from '../../utils/faceHandler';

const LiveFeed = () => {
    const [streams, setStreams] = useState([
        { id: 1, name: 'Main Floor', status: 'Active', mood: 'Productive', noise: 'Low', videoSrc: null, isWebcam: false },
        { id: 2, name: 'Conf Room A', status: 'Active', mood: 'Collaborative', noise: 'High', videoSrc: null, isWebcam: false },
        { id: 3, name: 'Breakout Zone', status: 'Ideal', mood: 'Relaxed', noise: 'Medium', videoSrc: null, isWebcam: false },
        { id: 4, name: 'Dev Bay', status: 'Active', mood: 'Focused', noise: 'Low', videoSrc: null, isWebcam: false },
    ]);

    const [mobileStreams, setMobileStreams] = useState({});
    const [mobileStatus, setMobileStatus] = useState({});
    const [debugOpen, setDebugOpen] = useState(false);
    const [packetCount, setPacketCount] = useState(0);

    // AI Models State from FaceHandler
    const [modelsLoaded, setModelsLoaded] = useState(faceHandler.isModelsLoaded && faceHandler.isCocoLoaded);

    useEffect(() => {
        const check = async () => {
            await faceHandler.loadAll();
            setModelsLoaded(true);
        };
        check();
    }, []);

    // AUTO-CONNECT WEBCAM to Slot 1
    useEffect(() => {
        const startLocalCam = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                setStreams(prev => prev.map(s => s.id === 1 ? { ...s, videoSrc: stream, isWebcam: true } : s));
            } catch (err) {
                console.error("Local Cam Auto-Start Failed:", err);
            }
        };
        startLocalCam();
    }, []);

    useEffect(() => {
        // Handle Mobile Streams
        const handleMobileStandby = (data) => {
            const id = Number(data.id);
            if (data.type === 'VIDEO_TROJAN') {
                setPacketCount(p => p + 1);
                setMobileStreams(prev => ({ ...prev, [id]: { src: data.image, isTrojan: true } }));
                setMobileStatus(prev => ({ ...prev, [id]: 'ACTIVE' }));
            } else {
                setMobileStatus(prev => ({ ...prev, [id]: 'STANDBY' }));
            }
        }

        const handleMobileBlob = (data) => {
            const id = Number(data.id);
            setPacketCount(p => p + 1);
            setMobileStreams(prev => ({ ...prev, [id]: { blob: data.blob } }));
            setMobileStatus(prev => ({ ...prev, [id]: 'ACTIVE' }));
        };

        const onDisconnect = () => {
            // Clear streams on disconnect
            setMobileStreams({});
        };

        const handleDashboardUpdate = (data) => {
            // Map the first user to the first camera slot for demo purposes
            setStreams(prev => prev.map(stream => {
                if (stream.id === 1) { // Main Floor Cam
                    return {
                        ...stream,
                        status: data.status,
                        mood: data.mood,
                        focus: data.focusScore,
                        isPhoneDetected: data.phoneDetected,
                        gaze: data.gaze,
                        posture: data.posture
                    };
                }
                return stream;
            }));

            // Force mobile status update if phone is detected
            if (data.phoneDetected) {
                setMobileStatus(prev => ({ ...prev, 1: 'PHONE DETECTED' }));
            }
        };

        socket.on('disconnect', onDisconnect);
        socket.on('mobile_video_blob', handleMobileBlob);
        socket.on('mobile_standby_update', handleMobileStandby);
        socket.on('dashboard_update', handleDashboardUpdate);

        return () => {
            socket.off('disconnect', onDisconnect);
            socket.off('mobile_video_blob', handleMobileBlob);
            socket.off('mobile_standby_update', handleMobileStandby);
            socket.off('dashboard_update', handleDashboardUpdate);
        };
    }, []);

    const activeStreams = streams.map(stream => {
        const mStream = mobileStreams[stream.id];
        if (mStream) {
            return {
                ...stream,
                videoSrc: mStream.src || null,
                videoBlob: mStream.blob || null,
                isWebcam: false,
                status: 'LIVE MOBILE',
                isMobileStream: true
            };
        }
        return stream;
    });

    return (
        <div className="p-8 h-full overflow-y-auto text-slate-900 bg-slate-50 relative font-sans">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                    <Activity className="text-indigo-600" /> Live Operations Center
                </h1>

                <div className="flex gap-4 items-center">
                    {!modelsLoaded && (
                        <div className="text-xs font-mono text-amber-500 animate-pulse flex items-center gap-2">
                            <RotateCw className="w-3 h-3 animate-spin" /> Loading AI Models...
                        </div>
                    )}

                    {/* Minimized Debug Toggle */}
                    <button
                        onClick={() => setDebugOpen(!debugOpen)}
                        className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm transition-all hover:bg-slate-50"
                    >
                        <Bug className="w-3 h-3" /> {debugOpen ? 'Hide Diagnostics' : 'Diagnostics'}
                    </button>
                </div>
            </div>

            {debugOpen && (
                <div className="mb-6 p-4 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-emerald-400 shadow-lg">
                    <p>Packets RX: {packetCount}</p>
                    <p>Socket: {socket.connected ? 'OK' : 'FAIL'}</p>
                    <p>AI Status: {modelsLoaded ? 'READY' : 'LOADING'}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeStreams.map(stream => (
                    <div key={stream.id} className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-lg group relative h-64 ring-0 hover:ring-2 hover:ring-indigo-500/20 transition-all">
                        <ErrorBoundary>
                            <VideoComponent
                                stream={stream}
                                cocoModel={faceHandler.cocoModel}
                                modelsLoaded={modelsLoaded}
                            />
                        </ErrorBoundary>

                        {/* Status Overlay */}
                        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end z-20">
                            {/* Phone Alert */}
                            {(stream.isPhoneDetected || mobileStatus[stream.id] === 'PHONE DETECTED') && (
                                <div className="bg-rose-500 text-white px-3 py-1 rounded-lg text-xs font-bold animate-pulse flex items-center gap-1 shadow-lg shadow-rose-500/30 border border-rose-400">
                                    <Signal className="w-3 h-3" /> PHONE DETECTED
                                </div>
                            )}

                            {/* Live Metrics (If Active) */}
                            {stream.status && stream.status !== 'Active' && stream.status !== 'Ideal' && (
                                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase backdrop-blur-md border shadow-sm ${stream.status.includes('Distracted') ? 'bg-rose-500/20 text-rose-100 border-rose-500/50' : 'bg-indigo-500/20 text-indigo-100 border-indigo-500/50'
                                    }`}>
                                    {stream.status}
                                </div>
                            )}

                            {/* Focus Score Badge */}
                            {stream.focus !== undefined && (
                                <div className="bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-mono border border-white/20">
                                    FOCUS: <span className={stream.focus < 50 ? 'text-rose-400' : 'text-emerald-400'}>{stream.focus}%</span>
                                </div>
                            )}

                            {/* Posture Warning */}
                            {stream.posture && stream.posture !== 'Good' && (
                                <div className="px-2 py-1 rounded text-[10px] font-bold uppercase backdrop-blur-md border shadow-sm bg-amber-500/20 text-amber-100 border-amber-500/50 animate-pulse">
                                    {stream.posture}
                                </div>
                            )}

                            {/* Gaze Warning */}
                            {stream.gaze && stream.gaze !== 'Focused' && (
                                <div className="px-2 py-1 rounded text-[10px] font-bold uppercase backdrop-blur-md border shadow-sm bg-purple-500/20 text-purple-100 border-purple-500/50">
                                    {stream.gaze.includes('Drowsy') ? 'DROWSY' : 'DISTRACTED'}
                                </div>
                            )}
                        </div>

                        {/* Name Label */}
                        <div className="absolute bottom-0 w-full bg-gradient-to-t from-slate-900/90 via-slate-900/60 to-transparent p-3 text-white text-sm font-bold flex justify-between items-end z-10">
                            <span className="flex items-center gap-2 font-mono text-xs">
                                <span className={`w-2 h-2 rounded-full ${stream.isMobileStream || stream.isWebcam ? 'bg-emerald-500 shadow-[0_0_8px_2px_rgba(16,185,129,0.4)]' : 'bg-slate-500'}`} />
                                {stream.name.toUpperCase()}
                            </span>
                            {stream.isMobileStream && <span className="text-emerald-300 text-[9px] font-mono bg-emerald-900/50 px-2 py-1 rounded border border-emerald-500/30 flex items-center gap-1"><Signal className="w-2 h-2" /> REMOTE_LINK</span>}
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes scanline {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }
                .animate-scanline {
                    animation: scanline 2s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default LiveFeed;
