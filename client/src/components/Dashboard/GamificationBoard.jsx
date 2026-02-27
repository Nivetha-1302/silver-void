import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Shield, Zap, Target, TrendingUp, Crown, Award } from 'lucide-react';
import axios from 'axios';

const GamificationBoard = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await axios.get('/api/employees/gamification/leaderboard');
                setLeaderboard(res.data);
            } catch (err) {
                console.error("Failed to load Gamification API:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
        // Poll every 30 seconds for live gamification stats
        const interval = setInterval(fetchLeaderboard, 30000);
        return () => clearInterval(interval);
    }, []);

    const getRankIcon = (rank) => {
        if (rank === 1) return <Crown className="w-8 h-8 text-yellow-400 drop-shadow-md" />;
        if (rank === 2) return <Award className="w-7 h-7 text-slate-300 drop-shadow-md" />;
        if (rank === 3) return <Award className="w-6 h-6 text-amber-600 drop-shadow-md" />;
        return <span className="text-xl font-bold text-slate-500 w-6 text-center">{rank}</span>;
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="flex flex-col items-center">
                    <Trophy className="w-16 h-16 text-indigo-500 animate-bounce mb-4" />
                    <h2 className="text-xl font-bold text-gray-400 dark:text-gray-500">Loading Leaderboard...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 h-full overflow-y-auto bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-200 transition-colors">

            {/* Header Hero */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-800 p-8 shadow-2xl mb-8 flex justify-between items-center z-10">
                {/* Background Decorations */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400 opacity-10 rounded-full blur-2xl transform -translate-x-1/4 translate-y-1/4"></div>

                <div className="relative z-20 shrink-0 max-w-lg">
                    <h1 className="text-4xl md:text-5xl font-black text-white flex items-center gap-4 mb-2 drop-shadow-md">
                        <Star className="text-yellow-400 w-10 h-10 animate-spin-slow" />
                        Apex Leaderboard
                    </h1>
                    <p className="text-indigo-100 text-lg md:text-xl font-medium mt-2 max-w-xl leading-relaxed">
                        Compete, focus, and level up. Earn XP for continuous deep work, timely task completion, and maintaining high energy.
                    </p>
                </div>

                {leaderboard.length > 0 && (
                    <div className="hidden lg:flex relative z-20 flex-col items-center gap-2 bg-black/20 backdrop-blur-md px-8 py-6 rounded-2xl border border-white/10 shrink-0">
                        <div className="relative">
                            <Crown className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-10 h-10 text-yellow-400 z-10 drop-shadow-lg" />
                            <img src={leaderboard[0].avatar} alt="champion" className="w-20 h-20 bg-white rounded-full border-4 border-yellow-400 shadow-xl" />
                        </div>
                        <div className="text-center mt-2">
                            <p className="text-xs text-yellow-400 font-bold tracking-widest uppercase">Reigning Champion</p>
                            <p className="text-xl font-black text-white">{leaderboard[0].name}</p>
                            <p className="text-sm text-indigo-200 font-mono">LVL {leaderboard[0].level} • {leaderboard[0].xp.toLocaleString()} XP</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Top 3 Podium (Optional extra UI element, skipping for clean list view) */}

            {/* Leaderboard List */}
            <div className="max-w-7xl mx-auto space-y-4 relative z-10">
                <AnimatePresence>
                    {leaderboard.map((user, idx) => (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`relative flex items-center justify-between p-4 md:p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${user.rank === 1
                                    ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/10 border-yellow-200 dark:border-yellow-700/30 shadow-yellow-500/10'
                                    : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 shadow-sm'
                                }`}
                        >
                            {/* Rank and Avatar */}
                            <div className="flex items-center gap-6">
                                <div className="w-12 flex justify-center items-center">
                                    {getRankIcon(user.rank)}
                                </div>
                                <div className="relative">
                                    <img src={user.avatar} alt="avatar" className={`w-14 h-14 rounded-full bg-indigo-50 dark:bg-slate-700 shadow-sm ${user.rank === 1 ? 'ring-4 ring-yellow-400' : 'ring-2 ring-transparent'}`} />
                                    {/* Level Badge overlapping Avatar */}
                                    <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md border-2 border-white dark:border-slate-800 shadow-md">
                                        LVL {user.level}
                                    </div>
                                </div>

                                <div>
                                    <h3 className={`text-lg font-bold ${user.rank === 1 ? 'text-amber-900 dark:text-amber-300' : 'text-gray-900 dark:text-white'}`}>
                                        {user.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                        {user.department}
                                    </p>

                                    {/* Badges */}
                                    <div className="flex gap-2 mt-2">
                                        {user.badges.map((b, i) => (
                                            <span key={i} className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm ${b.color}`}>
                                                {b.icon} {b.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-8 md:gap-12 shrink-0">
                                <div className="hidden md:block text-center">
                                    <p className="text-xs text-gray-400 dark:text-gray-500 font-bold tracking-wider uppercase mb-1">Focus</p>
                                    <div className="flex items-center gap-1">
                                        <Target className="w-4 h-4 text-emerald-500" />
                                        <span className="font-bold text-gray-700 dark:text-gray-300">{user.focusScore}</span>
                                    </div>
                                </div>
                                <div className="hidden md:block text-center border-l dark:border-slate-700 pl-8">
                                    <p className="text-xs text-gray-400 dark:text-gray-500 font-bold tracking-wider uppercase mb-1">Tasks</p>
                                    <div className="flex items-center justify-center gap-1">
                                        <Shield className="w-4 h-4 text-blue-500" />
                                        <span className="font-bold text-gray-700 dark:text-gray-300">{user.tasksCompleted}</span>
                                    </div>
                                </div>

                                {/* XP Bar & Value */}
                                <div className="text-right border-l dark:border-slate-700 pl-4 md:pl-8 min-w-[120px]">
                                    <p className="text-xs text-gray-400 dark:text-gray-500 font-bold tracking-wider uppercase mb-1 flex items-center justify-end gap-1">
                                        <Zap className="w-3 h-3 text-indigo-500" /> Total XP
                                    </p>
                                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">
                                        {user.xp.toLocaleString()}
                                    </p>
                                    {/* Mini Progress Bar for next level */}
                                    <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                                            style={{ width: `${(user.xp % 500) / 500 * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

        </div>
    );
};

export default GamificationBoard;
