import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Activity, AlertCircle, CheckCircle, Smartphone } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

const EmployeeCard = ({ employee }) => {
    const { name, role, status, focusScore, mood, trendData } = employee;

    // User requested to remove "Offline" - mapping it to "Idle"
    const displayStatus = status === 'Offline' ? 'Idle' : status;
    const chartData = trendData.map((val, i) => ({ value: val, index: i }));

    // Status color mapping
    const statusColors = {
        'Deep Work': 'text-purple-700 bg-purple-50 border-purple-200',
        'Active': 'text-green-700 bg-green-50 border-green-200',
        'Idle': 'text-amber-700 bg-amber-50 border-amber-200',
        'Distracted': 'text-rose-700 bg-rose-50 border-rose-200',
    };

    return (
        <motion.div
            className="group relative bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -5 }}
        >
            {/* Header / Profile */}
            <div className="p-5 flex items-start justify-between">
                <div className="flex gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 p-[2px]">
                            <img
                                src={`https://ui-avatars.com/api/?name=${name.replace(' ', '+')}&background=random`}
                                alt={name}
                                className="w-full h-full rounded-full object-cover border-2 border-white"
                            />
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${displayStatus === 'Deep Work' ? 'bg-purple-500' : displayStatus === 'Active' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 truncate max-w-[120px]">{name}</h3>
                        <p className="text-xs text-slate-500">{role}</p>
                    </div>
                </div>

                {/* Status Badge */}
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[displayStatus] || 'text-slate-500 bg-slate-50 border-slate-200'}`}>
                    {displayStatus}
                </span>
            </div>

            {/* Metrics Grid */}
            <div className="px-5 pb-4 grid grid-cols-2 gap-4">
                {/* Focus Score */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-3 h-3 text-indigo-500" />
                        <span className="text-xs font-medium text-slate-500">Focus</span>
                    </div>
                    <div className="text-xl font-bold text-slate-800">{focusScore}%</div>
                </div>
                {/* Mood */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                        <Smartphone className="w-3 h-3 text-violet-500" /> {/* Using generic icon for mood/device */}
                        <span className="text-xs font-medium text-slate-500">Mood</span>
                    </div>
                    <div className="text-lg font-bold text-slate-800">{mood}</div>
                </div>
            </div>

            {/* Sparkline Graph */}
            <div className="h-16 w-full -mb-1">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id={`gradient-${name}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Tooltip content={false} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#6366f1"
                            strokeWidth={2}
                            fill={`url(#gradient-${name})`}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
        </motion.div>
    );
};

export default EmployeeCard;
