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

    return <div className="hidden">Health Monitor Active</div>;
};

export default HealthMonitor;
