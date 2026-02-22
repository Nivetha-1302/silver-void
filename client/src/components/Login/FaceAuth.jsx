import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Scan, UserCheck, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from '@vladmandic/face-api';
import axios from 'axios';
import faceHandler from '../../utils/faceHandler';

const FaceAuth = ({ onSwitchMethod }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('initializing'); // initializing, scanning, verified, error
  const [message, setMessage] = useState('Syncing AI...');
  const [capturedImage, setCapturedImage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        setStatus('initializing');
        setMessage('Pre-heating AI Engines...');
        await faceHandler.loadModels();

        setMessage('Syncing Biometrics...');
        await faceHandler.loadUsers();

        setMessage('Ready. Scan to Login');
        setStatus('scanning');
        startVideo();
      } catch (err) {
        console.error("Init Error:", err);
        setStatus('error');
        setMessage('AI Engine Failed to Start');
      }
    };
    init();
  }, []);

  const startVideo = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
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
        setStatus('error');
        setMessage('Camera Access Blocked');
      }
    }
  };

  const handleVideoOnPlay = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const displaySize = {
      width: videoRef.current.videoWidth,
      height: videoRef.current.videoHeight
    };
    faceapi.matchDimensions(canvasRef.current, displaySize);

    const scan = async () => {
      if (status === 'verified' || !videoRef.current) return;

      // Ensure video is ready
      if (videoRef.current.readyState < 2) {
        requestAnimationFrame(scan);
        return;
      }

      try {
        // ULTRA-FAST: 128 is the minimum functional size for tinyFaceDetector
        const detection = await faceapi.detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 128, scoreThreshold: 0.35 })
        ).withFaceLandmarks().withFaceDescriptor();

        const matcher = faceHandler.getMatcher();

        if (detection && matcher) {
          const match = matcher.findBestMatch(detection.descriptor);

          if (match.label !== 'unknown') {
            const userId = match.label;
            const foundUser = faceHandler.getUserById(userId);

            if (foundUser) {
              // Capture the frame for visual confirmation
              const canvas = document.createElement('canvas');
              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;
              const ctx = canvas.getContext('2d');
              ctx.translate(canvas.width, 0);
              ctx.scale(-1, 1);
              ctx.drawImage(videoRef.current, 0, 0);
              setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));

              setStatus('verified');
              setMessage(`Welcome Back, ${foundUser.fullName.split(' ')[0]}! ✨`);

              // Stop camera immediately
              if (videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
              }

              localStorage.setItem('currentUser', JSON.stringify(foundUser));
              localStorage.setItem('token', 'session_' + Math.random().toString(36).substr(2, 9));

              setTimeout(() => {
                if (foundUser.role === 'admin') navigate('/dashboard');
                else navigate('/workspace');
              }, 400); // Slightly longer delay to show the "snap"
              return;
            }
          }
        }

        requestAnimationFrame(scan);
      } catch (err) {
        requestAnimationFrame(scan);
      }
    };

    scan();
  };

  const handleRetry = () => {
    setStatus('scanning');
    setMessage('Retrying...');
    startVideo();
  };

  return (
    <motion.div
      className="flex flex-col items-center w-full"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative mb-8">
        <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-slate-200 shadow-2xl glass-card bg-white">
          {capturedImage ? (
            <img src={capturedImage} className="w-full h-full object-cover" alt="Captured Face" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              muted
              onPlay={handleVideoOnPlay}
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          )}
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full transform scale-x-[-1]" />

          {status === 'scanning' && (
            <>
              <div className="absolute inset-0 border-4 border-indigo-500/50 rounded-full animate-pulse-slow pointer-events-none"></div>
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan shadow-[0_0_15px_rgba(34,211,238,0.8)] pointer-events-none"></div>
            </>
          )}

          {status === 'verified' && (
            <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center backdrop-blur-sm">
              <UserCheck className="w-20 h-20 text-emerald-600 drop-shadow-lg" />
            </div>
          )}

          {status === 'error' && (
            <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-center backdrop-blur-sm">
              <AlertTriangle className="w-20 h-20 text-rose-600 drop-shadow-lg" />
            </div>
          )}
        </div>

        <motion.div
          className={`absolute -bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-2 rounded-full shadow-lg border backdrop-blur-md ${status === 'scanning' || status === 'initializing' ? 'bg-white/90 border-indigo-200 text-indigo-600' :
            status === 'verified' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
              'bg-rose-50 border-rose-200 text-rose-600'
            }`}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <span className="font-semibold text-sm whitespace-nowrap flex items-center gap-2">
            {(status === 'scanning' || status === 'initializing') && <Loader2 className="w-4 h-4 animate-spin" />}
            {status === 'verified' && <UserCheck className="w-4 h-4" />}
            {message}
          </span>
        </motion.div>
      </div>

      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-slate-800">Welcome Back</h1>
        <p className="text-slate-500 max-w-xs mx-auto">
          Instant Face Login Active
        </p>

        <div className="flex gap-4 justify-center">
          {status === 'error' && (
            <motion.button onClick={handleRetry} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Try Again</motion.button>
          )}
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200 w-full flex flex-col gap-2">
          <button onClick={onSwitchMethod} className="text-sm text-slate-500 hover:text-indigo-600 hover:underline">Use Password instead</button>
          <button onClick={() => navigate('/register')} className="text-sm text-indigo-500 font-medium hover:underline">Register New Employee</button>
        </div>
      </div>
    </motion.div>
  );
};

// Start Loader Component
const Loader2 = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
);

export default FaceAuth;
