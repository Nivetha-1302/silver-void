import React from 'react';

const AnimatedBackground = ({ intensity = 'normal' }) => {
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-transparent">
            {/* Animated Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-300/40 rounded-full blur-[140px] mix-blend-multiply animate-blob"></div>
            <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-pink-300/40 rounded-full blur-[140px] mix-blend-multiply animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-cyan-300/40 rounded-full blur-[140px] mix-blend-multiply animate-blob animation-delay-4000"></div>

            {/* Grid Overlay */}
            <div className="absolute inset-0 cyber-grid opacity-[0.03]"></div>

            {/* Noise Texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.4] mix-blend-overlay"></div>

            {/* Floating Particles (CSS Only) */}
            {intensity === 'high' && (
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-indigo-500/20 rounded-full animate-pulse-slow"></div>
                    <div className="absolute top-3/4 right-1/3 w-4 h-4 bg-pink-500/20 rounded-full animate-float animation-delay-1000"></div>
                    <div className="absolute bottom-1/4 left-2/3 w-2 h-2 bg-cyan-500/30 rounded-full animate-ping"></div>
                </div>
            )}
        </div>
    );
};

export default AnimatedBackground;
