import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Building, Camera, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import * as faceapi from '@vladmandic/face-api';
import axios from 'axios';
import AnimatedBackground from '../UI/AnimatedBackground';
import faceHandler from '../../utils/faceHandler';

const Register = () => {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const [step, setStep] = useState(1); // 1: Details, 2: Face Capture
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        department: 'Engineering',
        role: 'employee'
    });
    const [faceDescriptor, setFaceDescriptor] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [isModelLoading, setIsModelLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                setIsModelLoading(true);
                await faceHandler.loadModels();
                setIsModelLoading(false);
            } catch (err) {
                console.error("Model Load Error:", err);
                setError("Failed to load AI models.");
                setIsModelLoading(false);
            }
        };
        load();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const startCamera = async () => {
        setIsScanning(true);
        setError('');
        setFaceDescriptor(null);
        setCapturedImage(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: "user",
                    frameRate: { ideal: 60 }
                }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            setError("Camera access denied.");
            setIsScanning(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsScanning(false);
    };

    const handleResetScan = () => {
        setFaceDescriptor(null);
        setCapturedImage(null);
        setMessage('');
        startCamera();
    };

    // Auto-Capture Logic (Fast Tuning)
    useEffect(() => {
        let active = true;
        let lastErrorLog = 0;

        const autoCapture = async () => {
            if (!isScanning || faceDescriptor || !videoRef.current || !active) return;

            // Ensure video is ready
            if (videoRef.current.readyState < 2) {
                requestAnimationFrame(autoCapture);
                return;
            }

            try {
                // Using 160 for even faster processing while maintaining decent accuracy
                const detection = await faceapi.detectSingleFace(
                    videoRef.current,
                    new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.4 })
                ).withFaceLandmarks().withFaceDescriptor();

                if (detection && active) {
                    // Capture image for preview
                    const canvas = document.createElement('canvas');
                    canvas.width = videoRef.current.videoWidth;
                    canvas.height = videoRef.current.videoHeight;
                    const ctx = canvas.getContext('2d');
                    // Draw mirror image to match video
                    ctx.translate(canvas.width, 0);
                    ctx.scale(-1, 1);
                    ctx.drawImage(videoRef.current, 0, 0);

                    setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));
                    setFaceDescriptor(Array.from(detection.descriptor));
                    setMessage('Identity Authenticated!');
                    stopCamera();
                } else if (active) {
                    if (Date.now() - lastErrorLog > 1000) {
                        setMessage('Searching for face...');
                        lastErrorLog = Date.now();
                    }
                    requestAnimationFrame(autoCapture);
                }
            } catch (err) {
                if (active) {
                    console.error("Auto-Capture Error:", err);
                    requestAnimationFrame(autoCapture);
                }
            }
        };

        if (isScanning && !faceDescriptor) {
            autoCapture();
        }
        return () => { active = false; };
    }, [isScanning, faceDescriptor]);

    const captureFace = () => {
        // AI is scanning automatically via useEffect
    };


    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setIsSubmitting(false);
            return;
        }

        if (!faceDescriptor) {
            setError("Please wait for face capture.");
            setIsSubmitting(false);
            return;
        }

        try {
            const payload = {
                ...formData,
                faceDescriptor
            };

            await axios.post('/api/auth/register', payload);

            // Success
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full overflow-hidden bg-slate-50 relative">
            <AnimatedBackground intensity="low" />

            <div className="w-full max-w-6xl mx-auto flex items-center justify-center p-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden w-full flex flex-col md:flex-row border border-white/50"
                >
                    {/* Left Side: Visuals */}
                    <div className="hidden md:flex w-1/3 bg-slate-900 relative flex-col items-center justify-center p-8 text-white overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 opacity-90"></div>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>

                        <div className="relative z-10 text-center space-y-6">
                            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm shadow-xl">
                                <User className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold">Join SmartTrack</h2>
                                <p className="text-indigo-100 mt-2">The future of workforce management is here.</p>
                            </div>
                            <div className="space-y-4 text-sm text-indigo-200 text-left w-full max-w-xs mx-auto pt-8">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                    <span>AI-Powered Productivity Tracking</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                    <span>Secure Biometric Login</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                    <span>Automated Payroll & HR</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Form */}
                    <div className="w-full md:w-2/3 p-8 md:p-12 relative">
                        <div className="max-w-md mx-auto">
                            <h2 className="text-2xl font-bold text-slate-800 mb-6">Create your account</h2>

                            {/* Steps Indicator */}
                            <div className="flex items-center gap-4 mb-8">
                                <div className={`flex-1 h-2 rounded-full transition-colors ${step === 1 ? 'bg-indigo-600' : 'bg-indigo-200'}`}></div>
                                <div className={`flex-1 h-2 rounded-full transition-colors ${step === 2 ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                            </div>

                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-4"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700">Full Name</label>
                                                <div className="relative group">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                                    <input
                                                        type="text"
                                                        name="fullName"
                                                        value={formData.fullName}
                                                        onChange={handleChange}
                                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                                        placeholder="John Doe"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700">Department</label>
                                                <div className="relative group">
                                                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                                    <select
                                                        name="department"
                                                        value={formData.department}
                                                        onChange={handleChange}
                                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-white font-medium"
                                                    >
                                                        <option>Engineering</option>
                                                        <option>HR</option>
                                                        <option>Sales</option>
                                                        <option>Design</option>
                                                        <option>Marketing</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">Account Role</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, role: 'employee' })}
                                                    className={`py-2 px-4 rounded-xl border text-sm font-bold transition-all ${formData.role === 'employee'
                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    Employee
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                                                    className={`py-2 px-4 rounded-xl border text-sm font-bold transition-all ${formData.role === 'admin'
                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    Admin
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">Email Address</label>
                                            <div className="relative group">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                                    placeholder="john@company.com"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700">Password</label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                                    <input
                                                        type="password"
                                                        name="password"
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700">Confirm Password</label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                                    <input
                                                        type="password"
                                                        name="confirmPassword"
                                                        value={formData.confirmPassword}
                                                        onChange={handleChange}
                                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setStep(2)}
                                            className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all"
                                        >
                                            Continue to Biometrics
                                        </motion.button>
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6 text-center"
                                    >
                                        <div className="relative w-64 h-64 mx-auto rounded-full overflow-hidden bg-slate-100 border-4 border-slate-200 shadow-xl group">
                                            {isScanning ? (
                                                <>
                                                    <video
                                                        ref={videoRef}
                                                        autoPlay
                                                        muted
                                                        className="w-full h-full object-cover transform scale-x-[-1]"
                                                    />
                                                    <div className="absolute inset-0 border-4 border-indigo-500/50 rounded-full animate-pulse-slow"></div>
                                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/10 to-transparent animate-scan"></div>
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 relative">
                                                    {capturedImage ? (
                                                        <motion.img
                                                            initial={{ scale: 1.2, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            src={capturedImage}
                                                            className="w-full h-full object-cover"
                                                            alt="Captured Face"
                                                        />
                                                    ) : faceDescriptor ? (
                                                        <>
                                                            <CheckCircle className="w-16 h-16 text-emerald-500 mb-2" />
                                                            <span className="text-emerald-600 font-medium">Face Captured</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Camera className="w-12 h-12 mb-2" />
                                                            <span>Camera Off</span>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {error && (
                                            <div className="flex items-center justify-center gap-2 text-rose-600 text-sm bg-rose-50 p-2 rounded-lg">
                                                <AlertTriangle className="w-4 h-4" />
                                                {error}
                                            </div>
                                        )}

                                        {message && !error && (
                                            <div className="flex items-center justify-center gap-2 text-emerald-600 text-sm bg-emerald-50 p-2 rounded-lg">
                                                <CheckCircle className="w-4 h-4" />
                                                {message}
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-3">
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => setStep(1)}
                                                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-medium"
                                                >
                                                    Back to Details
                                                </button>

                                                {!faceDescriptor ? (
                                                    !isScanning ? (
                                                        <button
                                                            onClick={startCamera}
                                                            className="flex-1 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30 font-semibold"
                                                        >
                                                            Start Scan
                                                        </button>
                                                    ) : (
                                                        <button
                                                            disabled
                                                            className="flex-1 py-3 rounded-xl bg-indigo-500/50 text-white font-semibold flex items-center justify-center gap-2"
                                                        >
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                            Detecting...
                                                        </button>
                                                    )
                                                ) : (
                                                    <button
                                                        onClick={handleResetScan}
                                                        className="flex-1 py-3 rounded-xl border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors font-semibold"
                                                    >
                                                        Scan Again
                                                    </button>
                                                )}
                                            </div>

                                            {faceDescriptor && (
                                                <motion.button
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    onClick={handleSubmit}
                                                    disabled={isSubmitting}
                                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-xl hover:shadow-indigo-500/40 transition-all shadow-lg shadow-indigo-500/30 font-bold text-lg flex items-center justify-center gap-2"
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <Loader2 className="w-6 h-6 animate-spin" />
                                                            Creating Account...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="w-6 h-6" />
                                                            Complete Registration
                                                        </>
                                                    )}
                                                </motion.button>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                                <p className="text-slate-500 text-sm">
                                    Already have an account?{' '}
                                    <Link to="/login" className="text-indigo-600 font-medium hover:underline">
                                        Sign in
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Register;
