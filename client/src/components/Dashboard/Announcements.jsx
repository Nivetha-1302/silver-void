import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Megaphone, Send, Trash2, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const Announcements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [type, setType] = useState('system');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const res = await axios.get('/api/announcements');
            setAnnouncements(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        setIsLoading(true);

        try {
            await axios.post('/api/announcements', { message: newMessage, type });
            setNewMessage('');
            fetchAnnouncements();
            toast.success("Broadcast Dispatched!");
        } catch (err) {
            toast.error("Failed to dispatch broadcast");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeactivate = async (id) => {
        try {
            await axios.patch(`/api/announcements/${id}/deactivate`);
            fetchAnnouncements();
            toast.success("Broadcast Terminated");
        } catch (err) {
            toast.error("Failed to terminate broadcast");
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                    <Megaphone className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white italic">COMMAND BROADCASTS</h1>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Global Live Ticker Management</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Creator Panel */}
                <div className="lg:col-span-1">
                    <div className="glass-card bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-white/20 shadow-xl sticky top-8">
                        <h2 className="text-lg font-black mb-6">New Broadcast</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Message</label>
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-none p-4 rounded-xl focus:ring-2 ring-indigo-500 outline-none text-sm min-h-[120px]"
                                    placeholder="Enter system announcement..."
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Broadcast Type</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-none p-3 rounded-xl focus:ring-2 ring-indigo-500 outline-none text-sm font-bold"
                                >
                                    <option value="system">System Notice</option>
                                    <option value="congrats">Congratulations</option>
                                    <option value="event">Company Event</option>
                                    <option value="urgent">Urgent Alert</option>
                                </select>
                            </div>
                            <button
                                disabled={isLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? 'Dispatching...' : <><Send className="w-4 h-4" /> Dispatch Broadcast</>}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Feed Panel */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 mb-4">Active Airwaves</h3>
                    {announcements.length > 0 ? announcements.map((a) => (
                        <div key={a._id} className="glass-card bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-white/20 shadow-lg flex items-center justify-between group hover:border-indigo-500/50 transition-all">
                            <div className="flex gap-4 items-start">
                                <div className={`p-3 rounded-xl ${a.type === 'congrats' ? 'bg-emerald-100 text-emerald-600' :
                                        a.type === 'urgent' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    {a.type === 'congrats' ? '🏆' : a.type === 'urgent' ? '⚠️' : '📢'}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-white leading-snug">{a.message}</p>
                                    <div className="flex gap-3 mt-2">
                                        <span className="text-[10px] font-black uppercase text-indigo-500">{a.type}</span>
                                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {new Date(a.createdAt).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeactivate(a._id)}
                                className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    )) : (
                        <div className="text-center py-20 opacity-30">
                            <Megaphone className="w-16 h-16 mx-auto mb-4" />
                            <p className="font-bold uppercase tracking-widest text-sm">No Active Broadcasts</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Announcements;
