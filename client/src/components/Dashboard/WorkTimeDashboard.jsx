import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Calendar, Monitor, Clock, CheckCircle, AlertTriangle, Coffee, Activity, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import socket from '../../utils/socket';

const WorkTimeDashboard = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [activityData, setActivityData] = useState(() => {
        return new Array(8).fill(0).map((_, i) => ({
            name: `${i + 8}:00`,
            active: Math.floor(Math.random() * 40) + 10,
            idle: Math.floor(Math.random() * 10) + 1
        }));
    });

    // Live State
    const [liveStats, setLiveStats] = useState({
        active: 14500, // Non-zero start
        idle: 2400,
        productive: 12000,
        unproductive: 1800
    });

    const [activeSessions, setActiveSessions] = useState(() => {
        const names = [
            "Divya", "Abisha", "Priya", "Sneha", "Pooja",
            "Anjali", "Neha", "Riya", "Shreya", "Kavya",
            "Nidhi", "Swati", "Rashi", "Aditi", "Shikha",
            "Megha", "Tanvi", "Kritika", "Sakshi", "Nisha"
        ];
        const dummySessions = {};
        const now = new Date();
        names.forEach((name, i) => {
            const isDistracted = Math.random() > 0.8;
            dummySessions[`node-${i}`] = {
                startTime: new Date(now.getTime() - Math.random() * 10000000),
                currentStatus: isDistracted ? 'Distracted' : (Math.random() > 0.3 ? 'Active' : 'Deep Work'),
                history: [],
                lastUpdate: now,
                focus: Math.floor(Math.random() * 20) + 75,
                mood: isDistracted ? 'Stressed' : (Math.random() > 0.5 ? 'Happy' : 'Neutral'),
                employeeName: name // For display if needed
            };
        });
        return dummySessions;
    });

    useEffect(() => {
        // Listen for live updates
        const handleUpdate = (data) => {
            const now = new Date();
            setActiveSessions(prev => {
                const updated = { ...prev };
                if (!updated[data.id]) {
                    updated[data.id] = { startTime: now, status: data.status, history: [] };
                }
                updated[data.id].lastUpdate = now;
                updated[data.id].currentStatus = data.status;
                updated[data.id].focus = data.focusScore;
                updated[data.id].mood = data.mood;
                return updated;
            });
        };

        socket.on('dashboard_update', handleUpdate);
        return () => socket.off('dashboard_update', handleUpdate);
    }, []);

    // REAL-TIME ACCUMULATOR: increments stats every second based on active sessions
    useEffect(() => {
        const timer = setInterval(() => {
            setLiveStats(prev => {
                let newStats = { ...prev };
                const sessions = Object.values(activeSessions);

                if (sessions.length === 0) return prev;

                sessions.forEach(session => {
                    // Ignore staleness for dummy data so it keeps accumulating
                    if (session.currentStatus === 'Offline') {
                        return;
                    }

                    const isProductive = session.currentStatus === 'Deep Work' || (session.focus > 50);
                    const isIdle = session.currentStatus === 'Idle' || session.currentStatus === 'Away';

                    newStats.active += (isIdle ? 0 : 1);
                    newStats.idle += (isIdle ? 1 : 0);
                    newStats.productive += (isProductive ? 1 : 0);
                    newStats.unproductive += (!isProductive && !isIdle ? 1 : 0);
                });

                return newStats;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [activeSessions]);


    // Transform ActiveSessions to Chart Data (Visual Only)
    useEffect(() => {
        const interval = setInterval(() => {
            // Update chart data to reflect accumulating liveStats
            const currentHour = new Date().getHours();
            setActivityData(prev => {
                // Initialize or copy
                const newData = prev.length ? [...prev] : new Array(12).fill(0).map((_, i) => ({
                    name: `${i + 8}:00`,
                    active: 0,
                    idle: 0
                }));

                // Find index for current hour (assuming 8 AM start for graph)
                const idx = currentHour - 8;
                if (idx >= 0 && idx < newData.length) {
                    newData[idx] = {
                        ...newData[idx],
                        active: Math.floor(liveStats.active / 60),
                        idle: Math.floor(liveStats.idle / 60)
                    };
                }
                return newData;
            });
        }, 5000); // Update chart less frequently

        return () => clearInterval(interval);
    }, [liveStats]);


    // Derived Data for UI
    const totalSeconds = liveStats.active + liveStats.idle + liveStats.unproductive; // Total tracked time
    // Avoid division by zero
    const productivePct = totalSeconds > 0
        ? Math.round(((liveStats.productive) / (liveStats.active + liveStats.unproductive + liveStats.idle)) * 100)
        : 0;

    // Dynamic App Data based on Mood/Focus
    const dynamicApps = [
        { name: 'High Focus Work', value: liveStats.productive || 1, color: '#10B981' }, // Green
        { name: 'Routine Tasks', value: (liveStats.active - liveStats.productive) || 1, color: '#3B82F6' }, // Blue
        { name: 'Distracted/Idle', value: (liveStats.idle + liveStats.unproductive) || 1, color: '#EF4444' }, // Red
    ];

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Top Toolbar / Context - Optional since Header exists, but good for local actions */}
            <div className="flex justify-between items-center bg-white/50 backdrop-blur-md p-4 rounded-xl border border-white/50 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <span>Real-time productivity metadata streaming from <strong>{Object.keys(activeSessions).length} active nodes</strong></span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-md border border-blue-100">
                        LIVE ANALYTICS
                    </span>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                        <Calendar className="w-4 h-4" />
                        Today, {new Date().toLocaleDateString()}
                    </div>
                </div>
            </div>

            {/* High-Level Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    title="Productivity Rate"
                    value={`${productivePct}%`}
                    sub="Efficiency Score"
                    icon={Zap}
                    color="text-purple-600"
                    bg="bg-purple-50"
                    trend="+2.4%"
                />
                <StatCard
                    title="Focus Time"
                    value={`${Math.floor(liveStats.productive / 60)}m`}
                    sub="Deep Work"
                    icon={CheckCircle}
                    color="text-green-600"
                    bg="bg-green-50"
                />
                <StatCard
                    title="Distraction Time"
                    value={`${Math.floor(liveStats.unproductive / 60)}m`}
                    sub="Low Focus"
                    icon={AlertTriangle}
                    color="text-red-600"
                    bg="bg-red-50"
                />
                <StatCard
                    title="Active Agents"
                    value={Object.keys(activeSessions).length}
                    sub="Active Now"
                    icon={Monitor}
                    color="text-blue-600"
                    bg="bg-blue-50"
                    animate
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity Timeline */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-800">
                        <Clock className="w-5 h-5 text-gray-400" /> Hourly Activity Breakdown
                    </h3>
                    <div className="h-72">
                        {activityData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={activityData} barSize={24}>
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        hide
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F3F4F6', radius: 4 }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="active" stackId="a" fill="#3B82F6" radius={[0, 0, 4, 4]} name="Active (Min)" />
                                    <Bar dataKey="idle" stackId="a" fill="#F3F4F6" radius={[4, 4, 0, 0]} name="Idle (Min)" />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-blue-500 animate-spin"></div>
                                <span className="text-sm">Syncing live data streams...</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Apps Pie Chart */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center">
                    <h3 className="text-lg font-bold mb-2 text-center text-gray-800">Focus Distribution</h3>
                    <p className="text-xs text-gray-400 text-center mb-6">Based on AI mood & gaze analysis</p>
                    <div className="h-64 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={dynamicApps}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    cornerRadius={4}
                                >
                                    {dynamicApps.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <span className="block text-2xl font-bold text-gray-800">{productivePct}%</span>
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Score</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-800">Session Logs</h3>
                    <button className="text-xs text-blue-600 font-medium hover:underline">Export CSV</button>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-white text-gray-400 text-[10px] uppercase tracking-wider font-semibold border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4">Workstation ID</th>
                            <th className="px-6 py-4">Current State</th>
                            <th className="px-6 py-4">Focus Index</th>
                            <th className="px-6 py-4">Sentiment</th>
                            <th className="px-6 py-4 text-right">Last Sync</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {Object.entries(activeSessions).length > 0 ? (
                            Object.entries(activeSessions).map(([id, session]) => (
                                <tr key={id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-700 font-mono">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                            {session.employeeName || `WS-${id.slice(0, 6)}`}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${session.currentStatus === 'Deep Work'
                                            ? 'bg-purple-100 text-purple-700 border-purple-200'
                                            : session.currentStatus === 'Active'
                                                ? 'bg-blue-100 text-blue-700 border-blue-200'
                                                : 'bg-gray-100 text-gray-600 border-gray-200'
                                            }`}>
                                            {session.currentStatus || 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500"
                                                    style={{ width: `${session.focus || 0}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-mono text-gray-600">{session.focus?.toFixed(0)}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-medium ${session.mood === 'Stressed' ? 'text-red-500' :
                                            session.mood === 'Happy' ? 'text-green-500' :
                                                'text-gray-500'
                                            }`}>
                                            {session.mood || 'Neutral'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-400 text-right font-mono">
                                        {session.lastUpdate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                    <Monitor className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No active sessions found. Waiting for employee login...</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

const StatCard = ({ title, value, sub, icon: Icon, color, bg, trend, animate }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
        <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
            <h3 className="text-3xl font-extrabold text-gray-800 mb-1 tracking-tight">{value}</h3>
            <div className="flex items-center gap-2">
                {trend && <span className="text-[10px] font-bold text-green-500 bg-green-50 px-1.5 py-0.5 rounded">{trend}</span>}
                <p className={`text-xs font-medium text-gray-400 group-hover:text-gray-600 transition-colors`}>{sub}</p>
            </div>
        </div>
        <div className={`p-3.5 rounded-xl ${bg} ${animate ? 'animate-pulse' : ''} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-6 h-6 ${color}`} />
        </div>
    </div>
);

export default WorkTimeDashboard;
