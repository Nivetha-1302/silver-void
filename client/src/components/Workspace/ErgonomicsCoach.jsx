import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import { toast } from 'react-hot-toast';

const ErgonomicsCoach = ({ videoRef }) => {
    const canvasRef = useRef(null);
    const [status, setStatus] = useState('Loading AI...');
    const [goodPosture, setGoodPosture] = useState(true);

    useEffect(() => {
        let detector;
        let animationFrameId;

        const runPoseNet = async () => {
            try {
                await tf.ready();
                const model = poseDetection.SupportedModels.MoveNet;
                const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
                detector = await poseDetection.createDetector(model, detectorConfig);

                setStatus('AI Coach Active');
                detect(detector);
            } catch (err) {
                console.error("PoseNet Load Error:", err);
                setStatus('AI Load Failed');
            }
        };

        const detect = async (det) => {
            if (
                videoRef.current &&
                videoRef.current.readyState === 4 &&
                canvasRef.current
            ) {
                const video = videoRef.current;
                const canvas = canvasRef.current;

                // Match canvas to video size
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                const poses = await det.estimatePoses(video);

                if (poses.length > 0) {
                    drawCanvas(poses[0], canvas.getContext('2d'), video.videoWidth, video.videoHeight);
                    analyzePosture(poses[0]);
                }
            }

            animationFrameId = requestAnimationFrame(() => detect(det));
        };

        const analyzePosture = (pose) => {
            const keypoints = pose.keypoints;
            const findPoint = (name) => keypoints.find(k => k.name === name);

            const nose = findPoint('nose');
            const leftShoulder = findPoint('left_shoulder');
            const rightShoulder = findPoint('right_shoulder');

            if (nose && leftShoulder && rightShoulder && nose.score > 0.5 && leftShoulder.score > 0.5) {
                const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
                const distance = Math.abs(avgShoulderY - nose.y);

                // Heuristic: If nose is too close to shoulder level, likely slouching/leaning forward
                // Normal distance varies by camera, but let's assume pixel threshold
                // For a 640x480 webcam, a sitting person might have dist ~60-100px.
                // Slouching/leaning in reduces Y distance or drops head.

                // Better heuristic: Vertical alignment. 
                // Simple check: "Too close to screen" or "Head drop"

                // Threshold needs calibration, but for demo:
                if (distance < 50) { // Arbitrary simple threshold
                    setGoodPosture(false);
                } else {
                    setGoodPosture(true);
                }
            }
        };

        const drawCanvas = (pose, ctx, width, height) => {
            ctx.clearRect(0, 0, width, height);

            // Draw Keypoints
            pose.keypoints.forEach((keypoint) => {
                if (keypoint.score > 0.5) {
                    const { y, x } = keypoint;
                    ctx.beginPath();
                    ctx.arc(x, y, 5, 0, 2 * Math.PI);
                    ctx.fillStyle = '#00ff00'; // Green
                    ctx.fill();
                }
            });

            // Draw Skeleton (Simple)
            const adjacentPairs = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
            adjacentPairs.forEach(([i, j]) => {
                const kp1 = pose.keypoints[i];
                const kp2 = pose.keypoints[j];
                if (kp1.score > 0.5 && kp2.score > 0.5) {
                    ctx.beginPath();
                    ctx.moveTo(kp1.x, kp1.y);
                    ctx.lineTo(kp2.x, kp2.y);
                    ctx.strokeStyle = '#00ff00';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            });
        };

        if (videoRef.current) {
            runPoseNet();
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (detector) detector.dispose();
        };
    }, [videoRef]);

    useEffect(() => {
        if (!goodPosture) {
            const throttle = setTimeout(() => {
                toast("⚠️ Posture Alert: Sit up straight!", {
                    icon: '🧘',
                    style: { borderRadius: '10px', background: '#333', color: '#fff' }
                });
            }, 3000); // 3s delay to avoid spam
            return () => clearTimeout(throttle);
        }
    }, [goodPosture]);

    return (
        <div className="absolute inset-0 pointer-events-none">
            <canvas
                ref={canvasRef}
                className="w-full h-full object-cover transform scale-x-[-1]"
            />
            <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md transition-colors ${goodPosture ? 'bg-green-500/50 text-white border border-green-400' : 'bg-red-500/50 text-white border border-red-400 animate-pulse'
                }`}>
                {status} | {goodPosture ? "Posture Good" : "Slouch Detected"}
            </div>
        </div>
    );
};

export default ErgonomicsCoach;
