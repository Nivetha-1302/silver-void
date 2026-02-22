import React, { useEffect, useRef, useState } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as faceapi from '@vladmandic/face-api';
const tf = faceapi.tf;

const PostureCoach = ({ videoRef, onPostureUpdate }) => {
    const [detector, setDetector] = useState(null);
    const canvasRef = useRef(null);
    const requestRef = useRef();

    useEffect(() => {
        const loadModel = async () => {
            await tf.ready();
            const model = poseDetection.SupportedModels.MoveNet;
            const det = await poseDetection.createDetector(model);
            setDetector(det);
        };
        loadModel();
    }, []);

    useEffect(() => {
        if (!detector || !videoRef.current) return;

        const loop = async () => {
            if (videoRef.current.readyState < 2) {
                requestRef.current = requestAnimationFrame(loop);
                return;
            }

            const video = videoRef.current;
            const poses = await detector.estimatePoses(video);

            if (poses.length > 0) {
                const kp = poses[0].keypoints;
                analyzePosture(kp);
                drawSkeleton(kp);
            }

            requestRef.current = requestAnimationFrame(loop);
        };

        requestRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(requestRef.current);
    }, [detector]);

    const analyzePosture = (keypoints) => {
        const nose = keypoints.find(k => k.name === 'nose');
        const leftShoulder = keypoints.find(k => k.name === 'left_shoulder');
        const rightShoulder = keypoints.find(k => k.name === 'right_shoulder');

        if (nose && leftShoulder && rightShoulder && nose.score > 0.5) {
            const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
            const diff = shoulderY - nose.y;

            let status = 'Good';
            // If difference is small, user is leaning forward/down
            if (diff < 50) status = 'Slouching';

            // Check shoulder alignment
            if (Math.abs(leftShoulder.y - rightShoulder.y) > 40) status = 'Uneven Shoulders';

            onPostureUpdate(status);
        }
    };

    const drawSkeleton = (keypoints) => {
        const ctx = canvasRef.current.getContext('2d');
        const video = videoRef.current;
        canvasRef.current.width = video.videoWidth;
        canvasRef.current.height = video.videoHeight;

        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        // Draw Connections
        const adjacencies = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;

        adjacencies.forEach(([i, j]) => {
            const kp1 = keypoints[i];
            const kp2 = keypoints[j];
            if (kp1.score > 0.5 && kp2.score > 0.5) {
                ctx.beginPath();
                ctx.moveTo(kp1.x, kp1.y);
                ctx.lineTo(kp2.x, kp2.y);
                ctx.stroke();
            }
        });

        // Draw Points
        keypoints.forEach(kp => {
            if (kp.score > 0.5) {
                ctx.fillStyle = 'red';
                ctx.beginPath();
                ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
                ctx.fill();
            }
        });
    };

    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none w-full h-full transform scale-x-[-1]" />;
};

export default PostureCoach;
