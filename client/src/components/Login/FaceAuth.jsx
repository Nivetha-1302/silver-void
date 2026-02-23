import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, UserCheck, AlertTriangle, Camera, RefreshCcw, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from '@vladmandic/face-api';
import faceHandler from '../../utils/faceHandler';

const FaceAuth = ({ onSwitchMethod }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('initializing'); // initializing, scanning, analyzing, verified, error
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

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startVideo = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user"
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

  const handleCapture = async () => {
    if (!videoRef.current || status !== 'scanning') return;

    try {
      setStatus('analyzing');
      setMessage('Analyzing Face Biometrics...');

      // 1. Create a snapshot from the video
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');

      // Mirror the image horizontally to match the preview
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);

      // 2. Stop camera to save resources
      if (videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }

      // 3. Process the captured image
      const detection = await faceapi.detectSingleFace(
        canvas,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
      ).withFaceLandmarks().withFaceDescriptor();

      if (!detection) {
        setStatus('error');
        setMessage('No Face Detected. Try Again.');
        return;
      }

      const matcher = faceHandler.getMatcher();
      if (!matcher) {
        setStatus('error');
        setMessage('Biometric DB not ready');
        return;
      }

      const match = matcher.findBestMatch(detection.descriptor);

      if (match.label !== 'unknown') {
        const foundUser = faceHandler.getUserById(match.label);
        if (foundUser) {
          setStatus('verified');
          setMessage(`Verified: ${foundUser.fullName}! ✨`);

          localStorage.setItem('currentUser', JSON.stringify(foundUser));
          localStorage.setItem('token', 'session_' + Math.random().toString(36).substr(2, 9));

          setTimeout(() => {
            if (foundUser.role === 'admin') navigate('/dashboard');
            else navigate('/workspace');
          }, 1500);
          return;
        }
      }

      setStatus('error');
      setMessage('Face Not Recognized');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage('Matching Failed');
    }
  };

  const handleRetry = () => {
    setCapturedImage(null);
    setStatus('scanning');
    setMessage('Ready. Scan to Login');
    startVideo();
  };

  return (
    <motion.div
      className="flex flex-col items-center w-full"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative mb-8">
        <div className="relative w-72 h-72 rounded-3xl overflow-hidden border-4 border-white/50 shadow-2xl glass-card bg-slate-900 group">
          <AnimatePresence mode="wait">
            {capturedImage ? (
              <motion.img
                key="captured"
                src={capturedImage}
                className="w-full h-full object-cover"
                alt="Captured Face"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
            ) : (
              <motion.video
                key="video"
                ref={videoRef}
                autoPlay
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
            )}
          </AnimatePresence>

          <div className="absolute inset-0 pointer-events-none border-[1px] border-white/10 rounded-3xl"></div>

          {status === 'scanning' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-dashed border-cyan-400/50 rounded-2xl animate-pulse"></div>
              <div className="absolute inset-x-0 h-[2px] bg-cyan-400/50 blur-sm animate-scan"></div>
            </div>
          )}

          {(status === 'analyzing' || status === 'initializing') && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
              <span className="text-sm font-medium tracking-wider animate-pulse">{message}</span>
            </div>
          )}

          {status === 'verified' && (
            <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-md flex flex-col items-center justify-center">
              <div className="bg-white/90 p-4 rounded-full shadow-lg mb-2">
                <UserCheck className="w-12 h-12 text-emerald-600" />
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="absolute inset-0 bg-rose-500/20 backdrop-blur-md flex flex-col items-center justify-center">
              <div className="bg-white/90 p-4 rounded-full shadow-lg mb-2">
                <AlertTriangle className="w-12 h-12 text-rose-600" />
              </div>
            </div>
          )}
        </div>

        <motion.div
          className={`absolute -bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-2 rounded-2xl shadow-xl border backdrop-blur-xl z-10 ${status === 'verified' ? 'bg-emerald-500/90 border-emerald-400 text-white' :
            status === 'error' ? 'bg-rose-500/90 border-rose-400 text-white' :
              'bg-white/90 border-slate-200 text-slate-800'
            }`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <span className="font-bold text-xs uppercase tracking-widest flex items-center gap-2 whitespace-nowrap">
            {message}
          </span>
        </motion.div>
      </div>

      <div className="text-center w-full max-w-sm">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Biometric Identity</h2>
        <p className="text-slate-500 text-sm mb-8">
          Fast, secure facial recognition for workplace access.
        </p>

        <div className="flex flex-col gap-3">
          {status === 'scanning' && (
            <button
              onClick={handleCapture}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Capture & Login
            </button>
          )}

          {status === 'error' && (
            <button
              onClick={handleRetry}
              className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-900 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-5 h-5" />
              Try Again
            </button>
          )}

          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={onSwitchMethod}
              className="py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Use Pin
            </button>
            <button
              onClick={() => navigate('/register')}
              className="py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Register
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FaceAuth;
