import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Lock, Smartphone, MapPin, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import socket from '../../utils/socket';

const SecurityAlerts = () => {
    const [alerts, setAlerts] = useState([
        { id: 1, type: 'critical', message: 'PHONE DETECTED: User 7f2a (Divya)', time: '10:24 AM', icon: Smartphone },
        { id: 2, type: 'warning', message: 'High Distraction Rate: Engineering Dept', time: '10:15 AM', icon: AlertTriangle },
        { id: 3, type: 'info', message: 'System Backup Completed', time: '09:30 AM', icon: Lock },
        { id: 4, type: 'critical', message: 'Red Zone Entered: User 8b1c (Abisha)', time: '09:12 AM', icon: MapPin },
        { id: 5, type: 'warning', message: 'Firewall Update Required', time: '08:45 AM', icon: ShieldAlert }
    ]);

    useEffect(() => {
        const handleUpdate = (data) => {
            // Phone Detection Alert
            if (data.phoneDetected) {
                addAlert({
                    type: 'critical',
                    message: `PHONE DETECTED: User ${data.id.slice(-4)}`,
                    icon: Smartphone,
                    time: new Date().toLocaleTimeString()
                });
            }

            // Low Focus Alert (if not phone)
            if (data.status === 'Distracted' && !data.phoneDetected) {
                // Optional: throttling needed in real app
            }
        };

        socket.on('dashboard_update', handleUpdate);
        return () => socket.off('dashboard_update', handleUpdate);
    }, []);

    const addAlert = (newAlert) => {
        setAlerts(prev => {
            // Prevent duplicate spam
            if (prev.length > 0 && prev[0].message === newAlert.message &&
                (new Date() - new Date('1/1/2000 ' + prev[0].time) < 5000)) return prev;

            return [{ ...newAlert, id: Date.now() }, ...prev.slice(0, 5)];
        });
    };

    return (
        <div className="bg-white backdrop-blur-xl rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-white to-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <ShieldAlert className="text-indigo-500" /> Security & Policy Alerts
                </h3>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full animate-pulse shadow-sm border border-indigo-100">
                    ● ACTIVE
                </span>
            </div>
            <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
                <AnimatePresence initial={false}>
                    {alerts.map((alert, idx) => {
                        // Ensure we have an icon component before rendering
                        const IconComponent = alert.icon || ShieldAlert;

                        return (
                            <motion.div
                                key={alert.id || idx}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="p-4 flex items-start gap-4 hover:bg-slate-50/80 transition-colors"
                            >
                                <div className={`p-2 rounded-lg shadow-sm ${alert.type === 'critical' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                    alert.type === 'warning' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                        'bg-blue-50 text-blue-600 border border-blue-100'
                                    }`}>
                                    <IconComponent className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <h4 className={`text-sm font-bold ${alert.type === 'critical' ? 'text-rose-700' : 'text-slate-800'
                                        }`}>
                                        {alert.message}
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Confirmed at {alert.time}
                                    </p>
                                </div>
                                {alert.type === 'critical' && (
                                    <button className="text-[10px] font-bold text-rose-600 border border-rose-200 px-2 py-1 rounded hover:bg-rose-50 bg-white shadow-sm transition-colors">
                                        ACKNOWLEDGE
                                    </button>
                                )}
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SecurityAlerts;
