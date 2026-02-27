import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Coffee, Eye, GlassWater } from 'lucide-react';

const HealthMonitor = ({ isActive, focusScore }) => {
    const [lastBreakTime, setLastBreakTime] = useState(Date.now());
    const [continuousWorkTime, setContinuousWorkTime] = useState(0);

    // 1. Connection to Time
    useEffect(() => {
        const interval = setInterval(() => {
            if (isActive) {
                setContinuousWorkTime(prev => prev + 1);
            }
        }, 1000); // Create a 'tick' every second

        return () => clearInterval(interval);
    }, [isActive]);

    // 2. Logic for Rules
    useEffect(() => {
        // A. 20-20-20 Rule (Eye Strain)
        // Every 20 minutes (1200 seconds), remind user to look away.
        if (continuousWorkTime > 0 && continuousWorkTime % 1200 === 0) {
            toast("👀 20-20-20 Rule: Look away at something 20 feet away for 20 seconds.", {
                icon: '🌲',
                duration: 6000,
                style: { borderRadius: '10px', background: '#333', color: '#fff' }
            });
        }

        // B. Hydration Logic (Every 60 minutes)
        if (continuousWorkTime > 0 && continuousWorkTime % 3600 === 0) {
            toast("💧 Stay Hydrated! Time for a water break.", {
                icon: '🥤',
                duration: 5000,
                style: { borderRadius: '10px', background: '#3b82f6', color: '#fff' }
            });
        }

        // C. Burnout / Deep Work Break (Pomodoro-ish)
        // If working continuously for 50 mins without a significant pause
        if (continuousWorkTime > 3000) { // 50 mins
            toast((t) => (
                <div className="flex flex-col gap-2">
                    <span className="font-bold">Brain Break Recommended!</span>
                    <span className="text-xs">You've been focused for 50 mins. Take a 5 min stretch.</span>
                    <button onClick={() => toast.dismiss(t.id)} className="bg-white text-black text-xs px-2 py-1 rounded">Dismiss</button>
                </div>
            ), {
                icon: '☕',
                duration: 10000,
                style: { background: '#f59e0b', color: '#fff' } // Amber for caution
            });
            // Reset slightly so we don't spam every second after 50 mins, but maybe remind again in 10 mins
            // For now, let's just let the timer count.
        }

    }, [continuousWorkTime]);

    // Reset timer if user goes 'Away' for more than 5 minutes
    // This logic relies on the parent passing 'isActive' correctly (e.g. status !== 'Away')

    return (
        <div className="fixed bottom-8 left-8 z-[60]">
            <div className="glass-card backdrop-blur-2xl bg-white/70 p-5 rounded-3xl border border-white/60 shadow-2xl flex items-center gap-6 min-w-[320px] hover:bg-white/80 transition-all group">
                {/* Timer Circle */}
                <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="transparent"
                            className="text-slate-200"
                        />
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="transparent"
                            strokeDasharray={175}
                            strokeDashoffset={175 - (Math.min(continuousWorkTime, 3600) / 3600) * 175}
                            className="text-indigo-500 transition-all duration-1000"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-indigo-500 group-hover:scale-110 transition-transform" />
                    </div>
                </div>

                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Work Duration</span>
                    <span className="text-xl font-black text-slate-800 tabular-nums">
                        {Math.floor(continuousWorkTime / 60).toString().padStart(2, '0')}:
                        {(continuousWorkTime % 60).toString().padStart(2, '0')}
                    </span>
                    <div className="flex gap-3 mt-1">
                        <div className="flex items-center gap-1">
                            <Eye className={`w-3 h-3 ${continuousWorkTime > 1200 ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />
                            <span className="text-[10px] font-bold text-slate-500">20/20/20</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <GlassWater className={`w-3 h-3 ${continuousWorkTime > 3600 ? 'text-rose-500 animate-bounce' : 'text-slate-400'}`} />
                            <span className="text-[10px] font-bold text-slate-500">HYDRATE</span>
                        </div>
                    </div>
                </div>

                {!isActive && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] rounded-3xl flex items-center justify-center">
                        <span className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-tighter">PAUSED</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HealthMonitor;
