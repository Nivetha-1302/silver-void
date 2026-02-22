import React, { useRef, useEffect, useState } from 'react';
import { Camera, RefreshCw, Smartphone, Play, Square } from 'lucide-react';
import socket from '../../utils/socket';

const MobileCamera = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [streaming, setStreaming] = useState(false);

    const [selectedSlot, setSelectedSlot] = useState(4);
    const [status, setStatus] = useState('Idle');
    const [facingMode, setFacingMode] = useState('environment');
    const [framesSent, setFramesSent] = useState(0);
    const [heartbeat, setHeartbeat] = useState(false);

    useEffect(() => {
        const initCamera = async () => { await startCamera(); };
        initCamera();

        const onConnect = () => setStatus('Socket Connected');
        const onDisconnect = () => setStatus('Socket Disconnected');
        const onConnectError = (err) => setStatus(`Conn Error: ${err.message}`);

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('connect_error', onConnectError);

        return () => {
            stopCamera();
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('connect_error', onConnectError);
        };
    }, [facingMode]);

    const startCamera = async () => {
        try {
            const constraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 160 },
                    height: { ideal: 120 },
                    frameRate: { ideal: 15, max: 20 }
                }
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = async () => {
                    try { await videoRef.current.play(); } catch (e) { console.error(e) }
                };
            }
            setStatus(`Ready`);
        } catch (err) {
            setStatus(`Camera Error: ${err.name}`);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
    };

    // Listen for remote request (Optional now since we have manual start)
    useEffect(() => {
        const handleRemoteStart = (data) => {
            if (data.id === selectedSlot) {
                // Auto-accept if already in standby, or ask
                if (!streaming) {
                    // Just start
                    setStreaming(true);
                    setStatus('Remote Start Active');
                }
            }
        };
        socket.on('admin_request_received', handleRemoteStart);
        return () => socket.off('admin_request_received', handleRemoteStart);
    }, [selectedSlot, streaming]);

    const toggleStream = () => {
        if (streaming) {
            setStreaming(false);
            setStatus('Standby');
        } else {
            setStreaming(true);
            setStatus('Streaming Active');
        }
    };

    // Streaming Loop
    useEffect(() => {
        let interval;
        if (streaming) {
            const domRate = 100; // 10 FPS
            interval = setInterval(() => {
                captureAndEmitTrojan();
                setHeartbeat(p => !p);
            }, domRate);
        }
        return () => clearInterval(interval);
    }, [streaming, selectedSlot]);


    const captureAndEmitTrojan = () => {
        if (!videoRef.current || !canvasRef.current) return;
        if (!socket.connected) return;

        const width = videoRef.current.videoWidth;
        const height = videoRef.current.videoHeight;
        if (width === 0 || height === 0) return;

        const txWidth = 160;
        const txHeight = 120;

        canvasRef.current.width = txWidth;
        canvasRef.current.height = txHeight;

        const context = canvasRef.current.getContext('2d');
        context.drawImage(videoRef.current, 0, 0, txWidth, txHeight);

        // Convert to Base64 String (0.3 quality)
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.3);

        // SEND VIA STANDBY CHANNEL (Trojan Horse)
        socket.emit('mobile_standby', {
            id: Number(selectedSlot),
            type: 'VIDEO_TROJAN',
            image: dataUrl
        });

        setFramesSent(prev => prev + 1);
    };

    const switchCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    return (
        <div className="min-h-screen bg-surfaceAlt text-text flex flex-col items-center justify-center p-4">
            <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Smartphone className="text-primary" /> Mobile Streamer V7
            </h1>

            {/* Config Info */}
            <div className="mb-2 text-xs font-mono text-textSecondary flex items-center gap-4">
                <span>Slot: {selectedSlot}</span>
                <span>Socket: {socket.connected ? 'OK' : 'FAIL'}</span>
            </div>

            <div className={`relative w-full max-w-md bg-black rounded-xl overflow-hidden aspect-video mb-6 border-4 shadow-lg ${streaming ? 'border-red-500 animate-pulse' : 'border-border'}`}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />
                <canvas ref={canvasRef} className="hidden" />

                <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                    <div className="px-2 py-1 bg-black/60 rounded text-xs text-white backdrop-blur-sm border border-white/10">
                        {status}
                    </div>
                </div>

                {/* Packet Stats & Heartbeat */}
                <div className="absolute bottom-2 left-2 right-2 flex justify-between px-2 text-[10px] bg-black/50 text-white font-mono rounded items-center h-6">
                    <span className="flex items-center gap-2">
                        Sent: {framesSent}
                    </span>
                    {streaming && (
                        <div className={`w-3 h-3 rounded-full ${heartbeat ? 'bg-success' : 'bg-gray-500'}`} />
                    )}
                </div>
            </div>

            <div className="w-full max-w-md space-y-4">
                {/* Slot Selection */}
                <div className="bg-surface p-4 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between gap-2">
                        {[2, 3, 4].map(slot => (
                            <button
                                key={slot}
                                onClick={() => !streaming && setSelectedSlot(slot)}
                                className={`flex-1 py-2 rounded-lg font-bold text-xs transition-colors ${selectedSlot === slot
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-surfaceAlt text-textSecondary hover:bg-gray-200'
                                    }`}
                            >
                                Slot {slot}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Controls */}
                <div className="flex gap-4 items-start">
                    <button
                        onClick={toggleStream}
                        className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg text-white ${streaming
                            ? 'bg-danger shadow-red-500/30'
                            : 'bg-success hover:bg-green-600'
                            }`}
                    >
                        {streaming ? (
                            <><Square className="fill-current" /> STOP STREAM</>
                        ) : (
                            <><Play className="fill-current" /> START NOW</>
                        )}
                    </button>

                    <button onClick={switchCamera} className="px-4 bg-surface border border-border text-textSecondary hover:text-primary rounded-xl h-[60px] shadow-sm transition-colors">
                        <RefreshCw />
                    </button>
                </div>
            </div>

            <div className="mt-4 text-[10px] text-textSecondary text-center">
                V7: Direct Force Start Enabled
            </div>
        </div >
    );
};

export default MobileCamera;
