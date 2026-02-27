import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Activity,
    Users,
    FileText,
    CheckSquare,
    Shield,
    Settings,
    LogOut,
    Menu,
    X,
    Clock,
    BarChart3,
    Video,
    MapPin,
    DollarSign,
    Trophy,
    Megaphone
} from 'lucide-react';

const Sidebar = ({ sidebarOpen, toggleSidebar }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { path: '/live-feed', label: 'Live Operations', icon: Video },
        { path: '/productivity', label: 'Productivity', icon: Activity },
        { path: '/leaderboard', label: 'Gamification Board', icon: Trophy },
        { path: '/reports', label: 'Analytics & Reports', icon: BarChart3 },
        { path: '/hr', label: 'Workforce', icon: Users },
        { path: '/attendance', label: 'Attendance', icon: Clock },
        { path: '/tasks', label: 'Task Manager', icon: CheckSquare },
        { path: '/payroll', label: 'Payroll', icon: DollarSign },
        { path: '/invoices', label: 'Invoices', icon: FileText },
        { path: '/zones', label: 'Virtual Zones', icon: MapPin },
        { path: '/gallery', label: 'Screen Gallery', icon: Video },
        { path: '/security', label: 'Security Center', icon: Shield },
        { path: '/announcements', label: 'Global Broadcasts', icon: Megaphone },
        { path: '/settings', label: 'Settings', icon: Settings },
    ];

    const handleLogout = () => {
        // Clear auth logic here if needed
        navigate('/login');
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 z-20 transition-opacity bg-slate-900/50 backdrop-blur-sm lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
                onClick={toggleSidebar}
            ></div>

            {/* Sidebar Content */}
            <div className={`fixed inset-y-0 left-4 top-4 bottom-4 z-30 w-72 transition-transform duration-500 transform lg:translate-x-0 lg:static lg:inset-auto lg:h-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} glass-card rounded-3xl border border-white/40 shadow-2xl backdrop-blur-2xl bg-white/60`}>
                <div className="flex flex-col items-center justify-center mt-10 relative">
                    <div className="relative group cursor-pointer">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative w-14 h-14 bg-white rounded-xl flex items-center justify-center text-white shadow-xl ring-1 ring-black/5">
                            <Activity className="w-8 h-8 text-transparent bg-clip-text bg-gradient-to-tr from-indigo-600 to-pink-500" />
                        </div>
                    </div>
                    <div className="mt-4 text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
                        SmartTrack<span className="font-light text-slate-400">.ai</span>
                    </div>
                    <span className="mt-1 px-3 py-0.5 bg-indigo-50 text-indigo-500 text-[10px] font-bold uppercase tracking-widest rounded-full border border-indigo-100/50 shadow-sm">Enterprise V2.0</span>
                </div>

                <nav className="mt-10 px-4 space-y-2 pb-8 overflow-y-auto h-[calc(100vh-200px)] custom-scrollbar">
                    {menuItems.map((item, index) => {
                        const match = location.pathname === item.path;
                        return (
                            <NavLink
                                key={index}
                                to={item.path}
                                className={({ isActive }) => `relative flex items-center px-5 py-3.5 transition-all duration-300 rounded-2xl group overflow-hidden ${isActive
                                    ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 ring-1 ring-white/20 transform scale-[1.02]'
                                    : 'text-slate-500 hover:bg-white/50 hover:text-slate-900 hover:shadow-md border border-transparent hover:border-white/60'
                                    }`}
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive && (
                                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        )}
                                        <item.icon className={`w-5 h-5 mr-4 transition-transform group-hover:scale-110 duration-300 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                                        <span className="font-semibold text-sm tracking-wide relative z-10">{item.label}</span>
                                        {item.label === 'Live Operations' && (
                                            <span className="ml-auto flex h-3 w-3 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-gradient-to-r from-rose-500 to-orange-500 shadow-sm"></span>
                                            </span>
                                        )}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>
            </div>
        </>
    );
};

export default Sidebar;
