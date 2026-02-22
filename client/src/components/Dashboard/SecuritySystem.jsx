
import React, { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, Fingerprint, Lock, Camera, Activity, Map, Key, Bell, RefreshCw, Power, Radio } from 'lucide-react';
import socket from '../../utils/socket';

// Ensure socket singleton if not already provided by context

const SecuritySystem = () => {
    const [systemStatus, setSystemStatus] = useState('ARMED');
    const [activeCamera, setActiveCamera] = useState(1);
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ anomalies: 0, activeSensors: 42, upTime: '99.9%' });

    // Safety ref to prevent memory leaks on unmount
    const logsRef = useRef(logs);
    logsRef.current = logs;

    useEffect(() => {
        // --- 1. Connect to Real-time Data ---
        socket.on('connect', () => {
            addLog('System Connected', 'Network', 'success', 'Secure uplink established.');
        });

        // Listen for Employee Activity (The "Live Monitoring" data)
        socket.on('dashboard_update', (data) => {
            // data = { id, status, focusScore, mood }
            const type = data.mood === 'Stressed' ? 'warning' : 'info';
            const detail = `Status: ${data.status} | Focus: ${data.focusScore}% | Mood: ${data.mood}`;
            addLog('Entity Tracked', `EMP-${data.id.slice(-4)}`, type, detail);

            if (data.mood === 'Stressed' || data.focusScore < 30) {
                setStats(prev => ({ ...prev, anomalies: prev.anomalies + 1 }));
            }
        });

        // Listen for Security Alerts
        socket.on('security_alert', (alert) => {
            addLog('SECURITY ALERT', 'AI Sentinel', 'error', alert.message);
            setStats(prev => ({ ...prev, anomalies: prev.anomalies + 1 }));
        });

        // Listen for System Wide Status Updates
        socket.on('system_status_update', (data) => {
            setSystemStatus(data.status);
            if (data.status === 'LOCKDOWN') {
                addLog('SYSTEM LOCKDOWN', 'Central Command', 'error', 'All facility doors secured. Emergency protocol active.');
            } else if (data.status === 'ALARM') {
                addLog('ALARM TRIGGERED', 'Central Command', 'warning', 'Audible alarms active.');
            } else if (data.status === 'ARMED') {
                addLog('System Reset', 'Central Command', 'success', 'All systems returned to normal parameters.');
            }
        });

        return () => {
            socket.off('connect');
            socket.off('dashboard_update');
            socket.off('security_alert');
            socket.off('system_status_update');
        };
    }, []);

    const addLog = (event, user, type, detail) => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLogs(prev => [{ id: Date.now(), event, user, time, type, detail }, ...prev].slice(0, 50)); // Keep last 50
    };

    const handleAction = (action) => {
        // Emit to server instead of just local state
        socket.emit('security_command', { action, user: 'Admin' });
    };

    return (
        <div className={`p-8 h-full overflow-y-auto space-y-8 transition-colors duration-500 ${systemStatus === 'LOCKDOWN' ? 'bg-rose-50' : 'bg-slate-50'
            }`}>
            {/* Lockdown Overlay Effect */}
            {systemStatus === 'LOCKDOWN' && (
                <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center bg-rose-500/10 animate-pulse">
                    <div className="bg-rose-600 text-white px-12 py-4 rounded-xl shadow-2xl font-bold text-3xl border-4 border-white transform scale-125 animate-bounce">
                        ⚠ LOCKDOWN ACTIVE ⚠
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative z-10">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Shield className="w-8 h-8 text-indigo-500" />
                        Security Command Center
                    </h1>
                    <p className="text-slate-500 mt-2 max-w-2xl">
                        Real-time AI surveillance. Monitoring live employee biometrics and facility sensors.
                    </p>
                </div>
                <div className={`px-4 py-2 rounded-lg font-bold border flex items-center gap-2 shadow-lg transition-colors ${systemStatus === 'ARMED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                    systemStatus === 'LOCKDOWN' ? 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse' :
                        'bg-amber-100 text-amber-700 border-amber-200'
                    }`}>
                    <div className={`w-3 h-3 rounded-full ${systemStatus === 'ARMED' ? 'bg-emerald-600' :
                        systemStatus === 'LOCKDOWN' ? 'bg-rose-600' : 'bg-amber-600'
                        }`} />
                    STATUS: {systemStatus}
                </div>
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Visual Feeds (Left Column) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Camera Matrix */}
                    <div className="bg-white rounded-2xl p-1 border border-slate-200 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-5 left-5 bg-rose-600 text-white text-xs px-2 py-0.5 rounded animate-pulse font-mono z-10 flex items-center gap-1">
                            <Radio className="w-3 h-3" /> LIVE FEED
                        </div>
                        <div className="aspect-video bg-gray-900 rounded-xl relative flex items-center justify-center overflow-hidden">
                            {/* Simulated Feed Background */}
                            <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>

                            {/* Scanning Overlay */}
                            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none"></div>

                            <div className="text-center z-10">
                                <Activity className="w-16 h-16 text-emerald-500 mx-auto mb-4 opacity-50 animate-pulse" />
                                <p className="text-slate-400 font-mono text-sm">FEED ENCRYPTED • CAMERA 0{activeCamera}</p>
                                <p className="text-indigo-400 font-mono text-xs mt-2 tracking-[0.2em]">AI ANALYZING BIOMETRICS...</p>
                            </div>

                            {/* Camera Selector */}
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                {[1, 2, 3, 4].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setActiveCamera(num)}
                                        className={`w-8 h-8 rounded border flex items-center justify-center text-xs font-bold transition-all ${activeCamera === num ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/50' : 'bg-black/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                                            }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Zone Status Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {['Main Entrance', 'Server Room', 'HR Office', 'Parking Garage'].map((zone, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between h-28 hover:border-indigo-300 transition-all hover:shadow-md group">
                                <div className="flex justify-between items-start">
                                    <Map className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                    <div className={`w-2 h-2 rounded-full ${'bg-emerald-500'}`} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">{zone}</h4>
                                    <p className="text-xs text-slate-500 mt-1 font-mono">
                                        SECURE
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Information & Controls (Right Column) */}
                <div className="space-y-6">

                    {/* Stats Tiles */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Anomalies</h3>
                            <p className={`text-2xl font-bold mt-1 ${stats.anomalies > 0 ? 'text-rose-500' : 'text-slate-800'}`}>{stats.anomalies}</p>
                            <span className="text-xs text-slate-400 flex items-center gap-1 mt-1">24h History</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Active Sensors</h3>
                            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.activeSensors}</p>
                            <span className="text-xs text-emerald-500 flex items-center gap-1 mt-1"><Activity className="w-3 h-3" /> Online</span>
                        </div>
                    </div>

                    {/* Live Logic Feed (The "Data" user requested) */}
                    <div className="bg-white rounded-xl border border-slate-200 p-0 h-[400px] flex flex-col shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                                <Activity className="w-4 h-4 text-indigo-500" /> Live Data Stream
                            </h3>
                        </div>

                        <div className="overflow-y-auto space-y-0 flex-1 custom-scrollbar scroll-smooth bg-slate-50/50">
                            {logs.length === 0 && (
                                <div className="p-8 text-center text-slate-400 text-xs">
                                    Waiting for live data events...
                                </div>
                            )}
                            {logs.map((log, i) => (
                                <div key={log.id} className={`p-3 border-b border-slate-100 text-xs hover:bg-white transition-colors ${i === 0 ? 'animate-pulse bg-indigo-50/50' : ''}`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider ${log.type === 'success' ? 'bg-emerald-100 text-emerald-700' :
                                            log.type === 'warning' ? 'bg-amber-100 text-amber-700' :
                                                log.type === 'error' ? 'bg-rose-100 text-rose-700' :
                                                    'bg-blue-100 text-blue-700'
                                            }`}>{log.event}</span>
                                        <span className="text-[10px] text-slate-400 font-mono opacity-70">{log.time}</span>
                                    </div>
                                    <div className="flex justify-between items-start gap-2">
                                        <span className="font-semibold text-slate-800 truncate max-w-[100px]">{log.user}</span>
                                        <span className="text-slate-500 text-right flex-1 break-words">{log.detail}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-2 border-t border-slate-200 bg-white text-center">
                            <p className="text-[10px] text-slate-400 font-mono flex items-center justify-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Receiving Socket Data
                            </p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                            <Key className="w-4 h-4 text-indigo-500" /> System Controls
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleAction('LOCKDOWN')}
                                className="p-3 rounded-lg bg-rose-50 text-rose-600 font-bold text-xs border border-rose-100 hover:bg-rose-100 hover:shadow-inner transition-all flex flex-col items-center gap-2 text-center"
                            >
                                <Lock className="w-5 h-5" /> EMERGENCY LOCKDOWN
                            </button>
                            <button
                                onClick={() => handleAction('TRIGGER ALARM')}
                                className="p-3 rounded-lg bg-amber-50 text-amber-600 font-bold text-xs border border-amber-100 hover:bg-amber-100 hover:shadow-inner transition-all flex flex-col items-center gap-2 text-center"
                            >
                                <Bell className="w-5 h-5" /> TRIGGER ALARM
                            </button>
                            <button
                                onClick={() => handleAction('RESET')}
                                className="col-span-2 p-3 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs border border-blue-100 hover:bg-blue-100 hover:shadow-inner transition-all flex flex-col items-center gap-2 text-center"
                            >
                                <RefreshCw className="w-5 h-5" /> RESET SENSORS & ALARMS
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SecuritySystem;
