/**
 * Advanced Gaze Estimation Utility
 * Uses EAR (Eye Aspect Ratio) and Head Pose to determine attention.
 */

export const calculateGaze = (landmarks) => {
    if (!landmarks) return { status: 'Unknown', score: 0 };

    // Get Left Eye Points (36-41 in 68-point model)
    const leftEye = [36, 37, 38, 39, 40, 41].map(i => landmarks[i]);
    // Get Right Eye Points (42-47)
    const rightEye = [42, 43, 44, 45, 46, 47].map(i => landmarks[i]);

    const leftEAR = getEAR(leftEye);
    const rightEAR = getEAR(rightEye);
    const avgEAR = (leftEAR + rightEAR) / 2;

    // Thresholds
    if (avgEAR < 0.2) return { status: 'Drowsy / Eyes Closed', score: 10 };

    // Simple Head Pose Estimation (Nose vs Jaw)
    const nose = landmarks[30];
    const jawBottom = landmarks[8];
    const leftJaw = landmarks[4];
    const rightJaw = landmarks[12];

    // Check Horizontal Rotation (Looking Side)
    const distLeft = Math.abs(nose.x - leftJaw.x);
    const distRight = Math.abs(nose.x - rightJaw.x);
    const ratio = distLeft / (distRight + 0.01);

    if (ratio < 0.5 || ratio > 2.0) return { status: 'Distracted (Looking Side)', score: 40 };

    // Check Vertical Rotation (Looking Down/Phone)
    const distNoseJaw = Math.abs(nose.y - jawBottom.y);
    // If nose is too close to jaw bottom, head is tilted down
    if (distNoseJaw < 30) return { status: 'Distracted (Looking Down)', score: 30 };

    return { status: 'Focused', score: 100 };
};

const getEAR = (eye) => {
    // Euclidean distance helper
    const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

    // Vertical distances
    const A = dist(eye[1], eye[5]);
    const B = dist(eye[2], eye[4]);
    // Horizontal distance
    const C = dist(eye[0], eye[3]);

    return (A + B) / (2.0 * C);
};
