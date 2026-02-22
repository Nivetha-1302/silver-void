import React from 'react';
import { motion } from 'framer-motion';

const MetricCard = ({ title, value, trend, icon: Icon, color, trendUp }) => {

    // Updated Color Map for stricter cohesive look
    const colorMap = {
        indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', shadow: 'shadow-indigo-500/20', border: 'border-indigo-100' },
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', shadow: 'shadow-emerald-500/20', border: 'border-emerald-100' },
        rose: { bg: 'bg-rose-50', text: 'text-rose-600', shadow: 'shadow-rose-500/20', border: 'border-rose-100' },
        violet: { bg: 'bg-violet-50', text: 'text-violet-600', shadow: 'shadow-violet-500/20', border: 'border-violet-100' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', shadow: 'shadow-blue-500/20', border: 'border-blue-100' },
        red: { bg: 'bg-red-50', text: 'text-red-600', shadow: 'shadow-red-500/20', border: 'border-red-100' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600', shadow: 'shadow-purple-500/20', border: 'border-purple-100' },
        green: { bg: 'bg-emerald-50', text: 'text-emerald-600', shadow: 'shadow-emerald-500/20', border: 'border-emerald-100' }
    };

    const activeColor = colorMap[color] || colorMap.indigo;

    return (
        <motion.div
            className="rounded-3xl p-6 bg-white/60 backdrop-blur-xl border border-white/60 shadow-lg relative overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 transform hover:-translate-y-1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3.5 rounded-2xl ${activeColor.bg} ${activeColor.text} ${activeColor.border} border shadow-inner`}>
                    {Icon && <Icon className="w-6 h-6" />}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${trendUp ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                        {trendUp ? '↑' : '↓'} {trend}
                    </div>
                )}
            </div>

            <div className="relative z-10">
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{title}</h3>
                <div className="text-3xl font-black text-slate-800 tracking-tight">{value}</div>
            </div>

            {/* Background Blob */}
            <div className={`absolute -right-8 -bottom-8 w-40 h-40 rounded-full blur-3xl opacity-20 transition-transform duration-700 group-hover:scale-150 ${activeColor.bg === 'bg-indigo-50' ? 'bg-indigo-500' : activeColor.bg === 'bg-rose-50' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
        </motion.div>
    );
};

export default MetricCard;
