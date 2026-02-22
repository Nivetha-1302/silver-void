import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Sparkles, ChevronRight } from 'lucide-react';

const AiChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Hi! I'm your SmartTrack AI Assistant. 🤖\nHow can I help you today?", sender: 'bot' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const quickActions = [
        "View Payroll", "Check Leave Balance", "My Productivity", "Log Issue", "Security Policy"
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = (text = input) => {
        if (!text.trim()) return;

        // User Message
        const userMsg = { id: Date.now(), text: text, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simulate AI Thinking Delay
        setTimeout(() => {
            const responseText = generateResponse(text);
            setMessages(prev => [...prev, { id: Date.now() + 1, text: responseText, sender: 'bot' }]);
            setIsTyping(false);
        }, 1200);
    };

    const generateResponse = (text) => {
        const lowerInput = text.toLowerCase();

        // 1. Finance & Payroll
        if (lowerInput.includes('payroll') || lowerInput.includes('salary') || lowerInput.includes('payslip')) {
            return "💰 **Payroll Info:**\nYou can view and download your latest payslips in the **Finance > Payroll** section.\nThe next salary disbursement defaults to the 28th of this month.";
        }
        if (lowerInput.includes('invoice') || lowerInput.includes('bill')) {
            return "📄 **Invoicing:**\nClient invoices can be generated in **Finance > Invoices**. You can create, edit, and send PDFs directly from there.";
        }

        // 2. HR & Attendance
        if (lowerInput.includes('leave') || lowerInput.includes('holiday') || lowerInput.includes('vacation')) {
            return "🏖️ **Leave Management:**\nYou currently have **12 Annual Leave days** remaining.\nTo apply, go to **Workforce > Leave Request**.";
        }
        if (lowerInput.includes('attendance') || lowerInput.includes('clock')) {
            return "⏰ **Attendance:**\nYour attendance is tracked automatically via facial recognition login.\nYou can view your monthly log in **Attendance Records**.";
        }

        // 3. Productivity & Work
        if (lowerInput.includes('focus') || lowerInput.includes('score') || lowerInput.includes('productivity')) {
            return "🚀 **Productivity Insights:**\nYour current **Focus Score is 85%** (Excellent!).\nKeep it above 80% to be eligible for the 'Employee of the Month' bonus.";
        }
        if (lowerInput.includes('task') || lowerInput.includes('project')) {
            return "✅ **Tasks:**\nYou have **3 Pending Tasks** due this week.\nCheck the **Task Manager** for details.";
        }

        // 4. Security & Tech
        if (lowerInput.includes('security') || lowerInput.includes('policy')) {
            return "🛡️ **Security Protocol:**\n- Always lock your screen when away.\n- Do not share badges.\n- Report suspicious activity to the Security Center immediately.";
        }
        if (lowerInput.includes('issue') || lowerInput.includes('bug') || lowerInput.includes('help')) {
            return "🛠️ **Support:**\nI've logged a ticket for you. IT Support will reach out shortly.\nTicket ID: #SR-9928";
        }

        // 5. General / Small Talk
        if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
            return "Hello there! 👋 Ready to crush your goals today?";
        }
        if (lowerInput.includes('thank')) {
            return "You're very welcome! Let me know if you need anything else. 🌟";
        }
        if (lowerInput.includes('bye')) {
            return "Goodbye! Have a productive day ahead! 👋";
        }

        // Default Fallback
        return "Thinking... 🤔\nI'm not sure about that yet. Try asking about **Payroll**, **Attendance**, or **Productivity**.";
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9, rotate: -5 }}
                        animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="mb-6 w-[400px] h-[650px] rounded-3xl shadow-2xl flex flex-col overflow-hidden bg-slate-50/95 backdrop-blur-2xl border border-white/60 ring-1 ring-slate-200/50"
                    >
                        {/* Colorful Header */}
                        <div className="p-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white flex justify-between items-center shadow-lg relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/10 opacity-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-inner">
                                    <Bot className="w-7 h-7 text-white drop-shadow-md" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg leading-tight">SmartTrack AI</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border border-emerald-600"></span>
                                        </span>
                                        <span className="text-xs text-indigo-50 font-medium opacity-90">Always Active</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="relative z-10 p-2 hover:bg-white/20 rounded-full transition-colors duration-200 group"
                            >
                                <X className="w-6 h-6 text-white/90 group-hover:text-white group-hover:rotate-90 transition-transform duration-300" />
                            </button>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 p-5 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-indigo-200 scrollbar-track-transparent">
                            <div className="text-center py-4">
                                <span className="px-3 py-1 bg-slate-200/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-full border border-slate-200">
                                    Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {messages.map((msg) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={msg.id}
                                    className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                    {/* Avatar */}
                                    <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border-2 shadow-sm ${msg.sender === 'bot' ? 'bg-indigo-100 border-indigo-200' : 'bg-pink-100 border-pink-200'}`}>
                                        {msg.sender === 'bot' ? (
                                            <Bot className="w-5 h-5 text-indigo-600" />
                                        ) : (
                                            <User className="w-5 h-5 text-pink-600" />
                                        )}
                                    </div>

                                    {/* Message Bubble */}
                                    <div className={`relative max-w-[80%] p-3.5 rounded-2xl text-[14px] leading-relaxed shadow-sm ${msg.sender === 'user'
                                        ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm shadow-indigo-500/20'
                                        : 'bg-white text-slate-700 rounded-tl-sm border border-slate-100 shadow-slate-200/50'
                                        }`}>
                                        {msg.text.split('\n').map((line, i) => (
                                            <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}

                            {/* Typing Indicator */}
                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex gap-3"
                                >
                                    <div className="w-9 h-9 rounded-full bg-indigo-100 border-indigo-200 border-2 flex items-center justify-center">
                                        <Bot className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5 h-10">
                                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                                        <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Actions Carousel */}
                        <div className="bg-white/50 backdrop-blur-sm border-t border-slate-100 p-3">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 px-1">Suggested Actions</p>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mask-fade-sides">
                                {quickActions.map((action, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSend(action)}
                                        className="flex-shrink-0 px-4 py-2 bg-white text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 active:scale-95"
                                    >
                                        {action}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white flex items-center gap-3 border-t border-slate-100">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Type your message..."
                                    className="w-full pl-5 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm text-slate-700 placeholder:text-slate-400 shadow-inner"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                />
                                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors">
                                    <Sparkles className="w-4 h-4" />
                                </button>
                            </div>
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim()}
                                className="p-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl disabled:opacity-50 disabled:grayscale hover:shadow-lg hover:shadow-indigo-500/30 transform active:scale-95 transition-all duration-200"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                    boxShadow: isOpen
                        ? "0px 0px 0px 0px rgba(0,0,0,0)"
                        : ["0 10px 40px -10px rgba(99, 102, 241, 0.5)", "0 10px 40px -10px rgba(236, 72, 153, 0.5)", "0 10px 40px -10px rgba(99, 102, 241, 0.5)"]
                }}
                transition={{
                    boxShadow: { duration: 3, repeat: Infinity }
                }}
                onClick={() => setIsOpen(!isOpen)}
                className={`relative w-16 h-16 rounded-full flex items-center justify-center border-4 border-white shadow-2xl transition-all duration-300 z-50 overflow-hidden ${isOpen ? 'bg-slate-800 rotate-90' : 'bg-gradient-to-tr from-fuchsia-600 via-purple-600 to-indigo-600'
                    }`}
            >
                {/* Shine Effect */}
                {!isOpen && <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent translate-x-[-100%] animate-shimmer"></div>}

                {isOpen ? (
                    <X className="w-7 h-7 text-white" />
                ) : (
                    <div className="relative">
                        <MessageSquare className="w-7 h-7 text-white fill-white/20" />
                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-fuchsia-600"></span>
                        </span>
                    </div>
                )}
            </motion.button>
        </div>
    );
};

export default AiChatbot;
