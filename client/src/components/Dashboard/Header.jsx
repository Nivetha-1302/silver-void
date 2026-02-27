import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, User, Search, Sun, Moon, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';
import socket from '../../utils/socket';
import toast from 'react-hot-toast';

const Header = ({ toggleSidebar }) => {
    const { settings, updateSettings } = useSettings();
    const isDark = settings.theme === 'dark';

    // Notifications State
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const notifRef = useRef();

    useEffect(() => {
        const handleNewAlert = (alertData) => {
            const newNotif = {
                id: Date.now(),
                message: alertData.message,
                type: alertData.type || 'warning',
                time: new Date().toLocaleTimeString(),
                read: false
            };

            setNotifications(prev => [newNotif, ...prev].slice(0, 20)); // keep last 20

            if (alertData.type === 'critical') {
                toast.error(alertData.message, { icon: '🚨', duration: 6000 });
            } else {
                toast(alertData.message, { icon: '⚠️', duration: 4000 });
            }
        };

        socket.on('new_alert', handleNewAlert);
        return () => socket.off('new_alert', handleNewAlert);
    }, []);

    // Close dropdown when clicked outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const handleThemeToggle = () => {
        updateSettings('theme', null, isDark ? 'light' : 'dark');
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200/50 dark:border-slate-700/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl px-4 shadow-sm transition-all sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 lg:hidden"
                >
                    <Menu className="h-6 w-6" aria-hidden="true" />
                </button>

                {/* Search Bar */}
                <div className="hidden md:flex relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-9 pr-4 py-2 text-sm bg-gray-100/50 dark:bg-slate-800/50 dark:text-white border-transparent rounded-full focus:bg-white dark:focus:bg-slate-800 dark:focus:border-indigo-500 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 w-64 transition-all outline-none"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">

                <button
                    onClick={handleThemeToggle}
                    className="rounded-full p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                    {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>

                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative rounded-full p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none"
                    >
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-bounce shadow-md">{unreadCount}</span>
                        )}
                        <Bell className="h-5 w-5" aria-hidden="true" />
                    </button>

                    <AnimatePresence>
                        {showNotifications && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50 origin-top-right"
                            >
                                <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                                    <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                        Notifications {unreadCount > 0 && <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full text-xs">{unreadCount} New</span>}
                                    </h3>
                                    {unreadCount > 0 && (
                                        <button onClick={markAllRead} className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline bg-transparent border-none cursor-pointer">
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center">
                                            <CheckCircle className="w-8 h-8 mb-2 opacity-50" />
                                            <p className="text-sm">All caught up!</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
                                            {notifications.map(notif => (
                                                <div key={notif.id} className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors flex gap-3 ${!notif.read ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                                                    <div className={`mt-0.5 p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0 ${notif.type === 'critical' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'}`}>
                                                        <AlertTriangle className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{notif.message}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notif.time}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="h-8 w-px bg-gray-200 dark:bg-slate-700 mx-1"></div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Admin User</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Security Control</p>
                    </div>
                    <button className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 p-[2px] shadow-sm hover:shadow-md transition-shadow">
                        <div className="h-full w-full rounded-full bg-white dark:bg-slate-800 flex items-center justify-center">
                            <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
