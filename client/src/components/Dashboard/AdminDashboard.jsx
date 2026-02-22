import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, ShieldAlert, Settings, Activity, Menu, Clock, Lock } from 'lucide-react';
import axios from 'axios';
import MetricCard from './MetricCard';
import EmployeeGrid from './EmployeeGrid';
import SecurityAlerts from './SecurityAlerts';
import socket from '../../utils/socket';

// removed AdminLayout

const AdminDashboard = () => {
    const [liveUpdates, setLiveUpdates] = useState({}); // Store live updates by Employee ID
    const [metrics, setMetrics] = useState({
        active: 0,
        avgFocus: 0,
        risks: 0,
        productivity: 0
    });

    useEffect(() => {
        // Fetch Initial Data for Metrics
        const fetchMetrics = async () => {

            try {
                const res = await axios.get('/api/auth/users');
                const users = res.data;
                calculateMetrics(users);
            } catch (err) {
                console.error("Error fetching metrics:", err);
            }
        };

        fetchMetrics();

        // Listen for live updates
        socket.on('dashboard_update', (data) => {
            setLiveUpdates(prev => {
                const newUpdates = { ...prev, [data.id]: data };
                // Re-calculate metrics roughly based on live updates + initial data would be complex without full state
                // For now, we rely on the EmployeeGrid to show live status, and maybe periodically re-fetch for header stats?
                // Or we can try to update metrics state here if we had the full user list in state.
                return newUpdates;
            });
        });

        // Cleanup on unmount
        return () => {
            socket.off('dashboard_update');
        };
    }, []);

    const calculateMetrics = (users) => {
        let activeCount = 0;
        let totalFocus = 0;
        let riskCount = 0;

        users.forEach(user => {
            const m = user.metrics || {};
            // Active logic: Status is not Offline (or check if recently updated?)
            // Simple check: if status is explicitly set to Active/Deep Work
            if (['Active', 'Deep Work', 'Present'].includes(m.status)) activeCount++;

            totalFocus += (m.focusScore || 0);

            if ((m.focusScore || 100) < 50 || m.mood === 'Stressed') riskCount++;
        });

        setMetrics({
            active: activeCount,
            avgFocus: users.length ? Math.round(totalFocus / users.length) : 0,
            risks: riskCount,
            productivity: users.length ? Math.round((totalFocus / users.length) * 0.9 + 5) : 0 // heuristic
        });
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100
            }
        }
    };

    return (
        <motion.div
            className="p-8 space-y-8 max-w-[1600px] mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Hero Section */}
            <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl p-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-2xl">
                <div className="absolute inset-0 bg-white/90 backdrop-blur-3xl"></div>

                <div className="relative z-10 glass-card rounded-[20px] p-8 flex flex-col md:flex-row justify-between items-center overflow-hidden border border-white/50">
                    {/* Decorative Blobs */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl -mr-32 -mt-32 animate-blob"></div>
                    <div className="absolute bottom-0 left-0 w-72 h-72 bg-pink-400/20 rounded-full blur-3xl -ml-20 -mb-20 animate-blob animation-delay-2000"></div>

                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30 text-white">
                            <Activity className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 tracking-tight mb-1">
                                Command Center
                            </h1>
                            <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Real-time Workforce Intelligence System
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-6 md:mt-0">
                        <div className="text-right hidden md:block">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">System Status</p>
                            <p className="text-lg font-bold text-emerald-600 font-mono">OPERATIONAL</p>
                        </div>
                        <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
                        <div className="text-right hidden md:block">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Nodes</p>
                            <p className="text-lg font-bold text-indigo-600 font-mono">{metrics.active || 0}/{liveUpdates ? Object.keys(liveUpdates).length : 0}</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Metrics Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Active Employees"
                    value={metrics.active}
                    trend="+12% vs last week"
                    icon={Users}
                    color="indigo"
                    trendUp={true}
                />
                <MetricCard
                    title="Avg Focus Score"
                    value={`${metrics.avgFocus}%`}
                    trend="-2% vs yesterday"
                    icon={Activity}
                    color="emerald"
                    trendUp={false}
                />
                <MetricCard
                    title="Risk Alerts"
                    value={metrics.risks}
                    trend="Requires Attention"
                    icon={ShieldAlert}
                    color="rose"
                    trendUp={false} // actually bad if up, but visually handled by component
                />
                <MetricCard
                    title="Productivity Rate"
                    value={`${metrics.productivity}%`}
                    trend="+5% Efficiency"
                    icon={LayoutDashboard}
                    color="violet"
                    trendUp={true}
                />
            </motion.div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Employee Live Grid - Spans 2 Columns */}
                <motion.div variants={itemVariants} className="xl:col-span-2 space-y-6">
                    <div className="glass-card rounded-3xl p-1 border border-white/60 shadow-xl overflow-hidden bg-white/40 backdrop-blur-xl">
                        <div className="bg-white/50 p-6 rounded-[20px]">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-indigo-500" />
                                    Live Workforce
                                </h2>
                                <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                                    View All Employees
                                </button>
                            </div>
                            <EmployeeGrid liveUpdates={liveUpdates} />
                        </div>
                    </div>
                </motion.div>

                {/* Right Column: Security & Insights */}
                <motion.div variants={itemVariants} className="space-y-8">
                    <SecurityAlerts />

                    {/* Quick Actions / Mini Widget */}
                    <div className="glass-card rounded-3xl p-6 border border-white/60 shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold mb-2">System Optimization</h3>
                            <p className="text-indigo-100 text-sm mb-4">AI suggests re-allocating 3 tasks to balance workload.</p>
                            <button className="w-full py-2 bg-white text-indigo-600 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:bg-indigo-50 transition-all transform hover:scale-[1.02]">
                                Run AI Optimization
                            </button>
                        </div>
                        <Settings className="absolute -bottom-4 -right-4 w-24 h-24 text-white opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-700" />
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default AdminDashboard;
