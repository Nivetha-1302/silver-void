import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, slideInRight } from '../../utils/animations';
import FaceAuth from './FaceAuth';
import LoginForm from './LoginForm'; // Fallback manual login
import AnimatedBackground from '../UI/AnimatedBackground';

const Login = () => {
    const [authMethod, setAuthMethod] = useState('face'); // 'face' or 'password'

    return (
        <div className="flex h-screen w-full overflow-hidden bg-transparent text-slate-800 relative">
            <AnimatedBackground intensity="normal" />

            {/* Left Side: 3D Face Wireframe Illustration */}
            <motion.div
                className="hidden lg:flex w-1/2 items-center justify-center relative z-10 m-4"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
            >
                <div className="glass-card backdrop-blur-xl bg-white/60 p-12 rounded-[3rem] border border-white/60 shadow-2xl relative overflow-hidden w-full h-full max-h-[800px] flex flex-col items-center justify-center">

                    {/* Placeholder for 3D Face Wireframe - simulating with CSS */}
                    <div className="relative w-80 h-80 mb-10">
                        <div className="absolute inset-0 border-2 border-indigo-500/30 rounded-full animate-pulse-slow"></div>
                        <div className="absolute inset-8 border border-cyan-500/30 rounded-full animate-spin-slow" style={{ animationDuration: '10s' }}></div>
                        <div className="absolute inset-16 border border-pink-500/30 rounded-full animate-ping"></div>

                        {/* Central 'Face' Mockup */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg viewBox="0 0 200 200" className="w-48 h-48 text-indigo-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                                <path fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1" d="M100,20 C55.8,20 20,55.8 20,100 C20,144.2 55.8,180 100,180 C144.2,180 180,144.2 180,100 C180,55.8 144.2,20 100,20 Z M100,160 C66.9,160 40,133.1 40,100 C40,66.9 66.9,40 100,40 C133.1,40 160,66.9 160,100 C160,133.1 133.1,160 100,160 Z" />
                                <circle cx="70" cy="80" r="8" className="animate-pulse" />
                                <circle cx="130" cy="80" r="8" className="animate-pulse" />
                                <path d="M70,120 Q100,150 130,120" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                            </svg>
                        </div>

                        {/* Scanning Grid Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent animate-scan h-full w-full"></div>
                    </div>

                    <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-600">Secure Access</h2>
                    <p className="mt-4 text-slate-600 text-lg">Next-Gen Biometric Identity Verification</p>
                </div>
            </motion.div>

            {/* Right Side: Auth Container */}
            <motion.div
                className="w-full lg:w-1/2 flex items-center justify-center relative z-10"
                variants={slideInRight}
                initial="hidden"
                animate="visible"
            >
                <div className="w-full max-w-md p-8">
                    <AnimatePresence mode="wait">
                        {authMethod === 'face' ? (
                            <FaceAuth key="face" onSwitchMethod={() => setAuthMethod('password')} />
                        ) : (
                            <LoginForm key="password" onSwitchMethod={() => setAuthMethod('face')} />
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

        </div>
    );
};

export default Login;
