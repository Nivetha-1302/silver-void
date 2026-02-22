import React, { useState, useEffect } from 'react';
import { Smartphone, Moon, Bell, Cpu, Check, Globe, Shield, Clock, Eye, Database, Zap, Mail, Layout, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
    // State for all settings
    // Load initialization
    const loadSettings = () => {
        const saved = localStorage.getItem('appSettings');
        if (saved) return JSON.parse(saved);
        return {
            theme: 'light',
            language: 'en',
            notifications: {
                email: true,
                push: true,
                tasks: true,
                marketing: false
            },
            privacy: {
                biometricStrict: false,
                sessionTimeout: '30',
                cameraBlur: true
            },
            ai: {
                autoTune: true,
                burnoutSensitivity: 'medium',
                coaching: true
            },
            data: {
                autoArchive: '60'
            }
        };
    };

    const [settings, setSettings] = useState(loadSettings);

    // Apply Theme
    useEffect(() => {
        const root = window.document.documentElement;
        if (settings.theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [settings.theme]);

    // Persist all settings
    useEffect(() => {
        localStorage.setItem('appSettings', JSON.stringify(settings));
    }, [settings]);

    const handleChange = (category, field, value) => {
        setSettings(prev => ({
            ...prev,
            [category]: typeof prev[category] === 'object' ? { ...prev[category], [field]: value } : value
        }));

        // Simulate Real-time Feedback for specific toggles
        if (category === 'notifications' && field === 'email' && value === true) {
            toast.success('Real-time Email Alerts Enabled!');
        }
    };

    const handleSave = () => {
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 800)),
            {
                loading: 'Syncing with Server...',
                success: 'All Preferences Saved Successfully',
                error: 'Error saving settings',
            }
        );
    };

    const sendTestAlert = (type) => {
        if (type === 'email') {
            toast.loading('Sending Test Email to user...', { duration: 1500 });
            setTimeout(() => toast.success('Test Email Sent Successfully! Check your inbox.'), 1500);
        } else {
            // Browser notification simulation
            toast('New Security Alert: Suspicious Activity Detected', {
                icon: '🔔',
                duration: 4000,
                style: {
                    border: '1px solid #713200',
                    padding: '16px',
                    color: '#713200',
                },
            });
        }
    };

    const Toggle = ({ checked, onChange }) => (
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
    );

    return (
        <div className="p-8 h-full overflow-y-auto text-slate-800 bg-slate-50 transition-colors duration-300 font-sans">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Company Settings</h1>
                    <p className="text-slate-500">Global Configuration & Preferences</p>
                </div>
                <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-200">
                    <Save className="w-5 h-5" /> Save Changes
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">

                {/* 1. General & Appearance */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-indigo-600 border-b border-slate-100 pb-2">
                        <Layout className="w-5 h-5" /> General & Appearance
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Moon className="w-5 h-5 text-slate-400" />
                                <div>
                                    <span className="block font-medium text-slate-700">Theme Mode</span>
                                    <span className="text-xs text-slate-400">Select interface appearance</span>
                                </div>
                            </div>
                            <select
                                value={settings.theme}
                                onChange={(e) => handleChange('theme', null, e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded p-2 text-sm outline-none w-32 focus:border-indigo-300"
                            >
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                            </select>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Globe className="w-5 h-5 text-slate-400" />
                                <div>
                                    <span className="block font-medium text-slate-700">Language</span>
                                    <span className="text-xs text-slate-400">System display language</span>
                                </div>
                            </div>
                            <select
                                value={settings.language}
                                onChange={(e) => handleChange('language', null, e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded p-2 text-sm outline-none w-32 focus:border-indigo-300"
                            >
                                <option value="en">English (US)</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                                <option value="de">German</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 2. Notifications */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-indigo-600 border-b border-slate-100 pb-2">
                        <Bell className="w-5 h-5" /> Notifications
                    </h3>

                    <div className="mb-4 flex gap-3">
                        <button
                            onClick={() => sendTestAlert('email')}
                            className="bg-sky-50 text-sky-600 px-3 py-1 rounded text-xs font-bold border border-sky-100 hover:bg-sky-100 transition-colors"
                        >
                            Test Email Alert
                        </button>
                        <button
                            onClick={() => sendTestAlert('push')}
                            className="bg-fuchsia-50 text-fuchsia-600 px-3 py-1 rounded text-xs font-bold border border-fuchsia-100 hover:bg-fuchsia-100 transition-colors"
                        >
                            Test Push Notification
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-slate-400" />
                                <span className="text-slate-700">Email Alerts</span>
                            </div>
                            <Toggle checked={settings.notifications.email} onChange={(v) => handleChange('notifications', 'email', v)} />
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Smartphone className="w-5 h-5 text-slate-400" />
                                <span className="text-slate-700">Push Notifications</span>
                            </div>
                            <Toggle checked={settings.notifications.push} onChange={(v) => handleChange('notifications', 'push', v)} />
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-slate-400" />
                                <span className="text-slate-700">Task Assignments</span>
                            </div>
                            <Toggle checked={settings.notifications.tasks} onChange={(v) => handleChange('notifications', 'tasks', v)} />
                        </div>
                    </div>
                </div>

                {/* 3. Privacy & Security */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-emerald-600 border-b border-slate-100 pb-2">
                        <Shield className="w-5 h-5" /> Privacy & Security
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Eye className="w-5 h-5 text-slate-400" />
                                <div>
                                    <span className="block font-medium text-slate-700">Camera Privacy Mode</span>
                                    <span className="text-xs text-slate-400">Blur background in live feed</span>
                                </div>
                            </div>
                            <Toggle checked={settings.privacy.cameraBlur} onChange={(v) => handleChange('privacy', 'cameraBlur', v)} />
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-slate-400" />
                                <div>
                                    <span className="block font-medium text-slate-700">Session Timeout</span>
                                    <span className="text-xs text-slate-400">Auto-lock inactivity period</span>
                                </div>
                            </div>
                            <select
                                value={settings.privacy.sessionTimeout}
                                onChange={(e) => handleChange('privacy', 'sessionTimeout', e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded p-2 text-sm outline-none w-32 focus:border-indigo-300"
                            >
                                <option value="15">15 Minutes</option>
                                <option value="30">30 Minutes</option>
                                <option value="60">1 Hour</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 4. AI Intelligence */}
                <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100 rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-violet-700 border-b border-violet-200 pb-2">
                        <Cpu className="w-5 h-5" /> AI Intelligence
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Zap className="w-5 h-5 text-violet-500" />
                                <div>
                                    <span className="block font-medium text-slate-700">AI Auto-Tune</span>
                                    <span className="text-xs text-slate-500">Optimizes UI based on stress</span>
                                </div>
                            </div>
                            <Toggle checked={settings.ai.autoTune} onChange={(v) => handleChange('ai', 'autoTune', v)} />
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <ActivityIcon />
                                <div>
                                    <span className="block font-medium text-slate-700">Burnout Sensitivity</span>
                                    <span className="text-xs text-slate-500">Threshold for stress alerts</span>
                                </div>
                            </div>
                            <div className="flex bg-white/50 rounded-lg p-1 border border-violet-200">
                                {['low', 'medium', 'high'].map(level => (
                                    <button
                                        key={level}
                                        onClick={() => handleChange('ai', 'burnoutSensitivity', level)}
                                        className={`px-3 py-1 text-xs rounded-md capitalize transition-colors ${settings.ai.burnoutSensitivity === level
                                            ? 'bg-violet-600 text-white font-bold shadow-sm'
                                            : 'text-slate-500 hover:bg-white/80'
                                            }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. Data & Storage */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-700 border-b border-slate-100 pb-2">
                        <Database className="w-5 h-5" /> Data Retention policy
                    </h3>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-medium text-slate-700">Auto-Archive Employee Logs</p>
                            <p className="text-xs text-slate-400">Automatically move old monitoring logs to cold storage to save space.</p>
                        </div>
                        <select
                            value={settings.data.autoArchive}
                            onChange={(e) => handleChange('data', 'autoArchive', e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded p-2 text-sm outline-none focus:border-indigo-300"
                        >
                            <option value="30">After 30 Days</option>
                            <option value="60">After 60 Days</option>
                            <option value="90">After 90 Days</option>
                            <option value="365">After 1 Year</option>
                        </select>
                    </div>
                </div>

            </div>
        </div>
    );
};

const ActivityIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
)

export default Settings;
