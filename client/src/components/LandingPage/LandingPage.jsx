import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bot, Shield, BarChart3, Users, CheckCircle, ArrowRight, Video, Zap, Globe, Cpu } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll();
    const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

    const features = [
        {
            icon: Bot,
            title: "AI-Powered Intelligence",
            desc: "Advanced neural networks analyze productivity patterns in real-time.",
            color: "text-indigo-400",
            bg: "bg-indigo-500/10",
            border: "border-indigo-500/20"
        },
        {
            icon: Video,
            title: "Live Vision Stream",
            desc: "Low-latency HD streaming with automated activity detection.",
            color: "text-pink-400",
            bg: "bg-pink-500/10",
            border: "border-pink-500/20"
        },
        {
            icon: Shield,
            title: "Military-Grade Security",
            desc: "End-to-end encryption and biometric authentication protocols.",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20"
        },
        {
            icon: Zap,
            title: "Instant Analytics",
            desc: "Zero-delay reporting on workforce efficiency and engagement.",
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20"
        }
    ];

    return (
        <div className="min-h-screen bg-transparent text-slate-800 font-sans selection:bg-indigo-200 selection:text-indigo-900 overflow-hidden relative">

            {/* Ambient Background Effects - Global Body Handles Main Gradient, this adds depth */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] mix-blend-multiply animate-float"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[120px] mix-blend-multiply animate-float animation-delay-2000"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay"></div>
            </div>

            {/* Navbar */}
            <nav className="sticky top-0 z-50 glass border-b border-white/40 backdrop-blur-xl shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 font-bold text-2xl tracking-tighter">
                        <div className="relative w-10 h-10 flex items-center justify-center group overflow-hidden rounded-xl">
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-pink-500 blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                            <div className="relative w-full h-full bg-white/80 rounded-xl flex items-center justify-center text-indigo-600 border border-white/50 shadow-sm backdrop-blur-sm">
                                <Bot className="w-6 h-6" />
                            </div>
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-700">
                            Smart<span className="font-light text-slate-500">Track</span> AI
                        </span>
                    </div>

                    <div className="hidden md:flex gap-8 font-medium text-sm text-slate-600">
                        {['Features', 'How it Works', 'Pricing'].map((item) => (
                            <a key={item} href={`#${item.toLowerCase().replace(/\s/g, '-')}`} className="hover:text-indigo-600 transition-colors relative group py-2">
                                {item}
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full rounded-full"></span>
                            </a>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => navigate('/login')} className="px-5 py-2.5 font-bold text-slate-600 hover:text-indigo-600 transition hover:bg-white/50 rounded-xl">Log In</button>
                        <button onClick={() => navigate('/register')} className="group relative px-6 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 overflow-hidden border border-transparent">
                            <span className="relative z-10">Get Started</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-32 overflow-hidden z-10">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-white/60 text-indigo-600 text-xs font-bold mb-8 shadow-sm backdrop-blur-md hover:scale-105 transition-transform cursor-default"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            Future of Work Intelligence V2.0
                        </motion.div>

                        <h1 className="text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.1] mb-8">
                            Empower Your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-gradient-x">
                                Workforce
                            </span>
                        </h1>

                        <p className="text-xl text-slate-600/90 mb-10 max-w-lg leading-relaxed font-medium">
                            Transform employee potential into performance with AI-driven insights, biometric security, and real-time analytics.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-5">
                            <button onClick={() => navigate('/register')} className="px-8 py-4 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-2 group hover:-translate-y-1">
                                Start Free Trial
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button className="px-8 py-4 bg-white/50 border border-white/60 hover:bg-white text-slate-700 font-bold rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 backdrop-blur-sm">
                                <Video className="w-5 h-5 text-indigo-500" />
                                Watch Demo
                            </button>
                        </div>

                        {/* Social Proof */}
                        <div className="mt-12 flex items-center gap-6 text-sm text-slate-500 font-bold mix-blend-multiply">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-10 h-10 rounded-full ring-2 ring-white bg-indigo-100 flex items-center justify-center text-xs text-indigo-800 font-bold overflow-hidden shadow-sm">
                                        <img src={`https://ui-avatars.com/api/?name=User+${i}&background=random&color=fff`} alt="User" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col leading-tight">
                                <div className="flex text-amber-500 gap-0.5">
                                    {[1, 2, 3, 4, 5].map(i => <span key={i}>★</span>)}
                                </div>
                                <span>Trusted by 10,000+ Innovators</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* 3D Mockup Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, rotateY: -10 }}
                        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="relative perspective-1000"
                    >
                        {/* Card Mockup Code from Previous Step (Preserved but wrapper updated) */}
                        <div className="relative z-10 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl p-6 transform hover:rotate-y-2 hover:scale-[1.02] transition-all duration-700 ease-out group">
                            {/* Decorative Glow */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>

                            <div className="relative bg-white/80 rounded-2xl border border-white overflow-hidden shadow-inner">
                                {/* Header */}
                                <div className="h-12 border-b border-indigo-50 bg-white/50 flex items-center px-4 gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                                    </div>
                                </div>
                                {/* Content - Using existing logic but styled */}
                                <div className="p-6 grid grid-cols-2 gap-4">
                                    <div className="col-span-2 flex gap-4 mb-2">
                                        <div className="flex-1 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                                            <div className="text-indigo-900/60 text-xs font-bold uppercase tracking-wider mb-1">Productivity</div>
                                            <div className="text-3xl font-black text-indigo-900">98.2%</div>
                                        </div>
                                        <div className="flex-1 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                                            <div className="text-emerald-900/60 text-xs font-bold uppercase tracking-wider mb-1">Active</div>
                                            <div className="text-3xl font-black text-emerald-900">1,248</div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50/50 p-4 rounded-2xl h-32 flex items-end justify-between px-2 gap-1 border border-slate-100">
                                        {[40, 70, 50, 90, 60, 80, 50].map((h, i) => (
                                            <div key={i} style={{ height: `${h}%` }} className="w-full bg-indigo-400 rounded-t-sm opacity-80"></div>
                                        ))}
                                    </div>
                                    <div className="space-y-3">
                                        <div className="bg-white p-3 rounded-xl shadow-sm flex items-center gap-3 border border-slate-100">
                                            <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center text-pink-500"><Bot size={16} /></div>
                                            <div className="h-2 w-16 bg-slate-100 rounded"></div>
                                        </div>
                                        <div className="bg-white p-3 rounded-xl shadow-sm flex items-center gap-3 border border-slate-100">
                                            <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-500"><Globe size={16} /></div>
                                            <div className="h-2 w-16 bg-slate-100 rounded"></div>
                                        </div>
                                        <div className="bg-white p-3 rounded-xl shadow-sm flex items-center gap-3 border border-slate-100">
                                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-500"><Shield size={16} /></div>
                                            <div className="h-2 w-16 bg-slate-100 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Staggered Grid */}
            <section id="features" className="py-24 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-20">
                        <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">
                            Next-Gen Intelligence
                        </h2>
                        <p className="text-slate-600 text-lg font-medium">
                            Go beyond basic tracking. Our AI interprets signals to help you build a healthier, more productive organization.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                whileHover={{ y: -10 }}
                                className={`p-8 rounded-3xl bg-white/60 backdrop-blur-lg border border-white/60 shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group cursor-default relative overflow-hidden`}
                            >
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.bg.replace('bg-', 'from-').replace('/10', '/20')} to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                                <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center ${feature.color} mb-6 border ${feature.border} group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                                    <feature.icon className="w-7 h-7" />
                                </div>
                                <h3 className="font-bold text-xl text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors relative z-10">{feature.title}</h3>
                                <p className="text-slate-500 leading-relaxed text-sm font-medium relative z-10">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA / Cyber Section */}
            <section className="py-32 relative overflow-hidden">
                <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white/40 border border-white/60 p-16 rounded-[3rem] backdrop-blur-xl shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-pink-500/5"></div>
                        <h2 className="text-5xl lg:text-6xl font-black mb-8 text-slate-900 tracking-tighter relative z-10">Ready to Upgrade?</h2>
                        <p className="text-slate-600 text-xl mb-12 font-medium relative z-10">Join the thousands of teams that have evolved their workflow with SmartTrack AI.</p>

                        <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
                            <button onClick={() => navigate('/register')} className="px-10 py-5 bg-slate-900 text-white font-extrabold rounded-2xl shadow-xl hover:bg-indigo-600 transition transform hover:-translate-y-1 hover:shadow-indigo-500/25">
                                Get Started Now
                            </button>
                            <button className="px-10 py-5 bg-white/60 border border-white/80 text-indigo-900 font-bold rounded-2xl hover:bg-white transition transform hover:-translate-y-1 shadow-sm backdrop-blur-sm">
                                View Pricing
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white/40 border-t border-white/40 py-12 text-slate-500 text-sm backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
                        <Bot className="w-6 h-6 text-indigo-600" />
                        <span>SmartTrack AI</span>
                    </div>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-indigo-600 transition">Privacy</a>
                        <a href="#" className="hover:text-indigo-600 transition">Terms</a>
                        <a href="#" className="hover:text-indigo-600 transition">Contact</a>
                    </div>
                    <div>
                        &copy; 2026 SmartTrack AI Inc.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
