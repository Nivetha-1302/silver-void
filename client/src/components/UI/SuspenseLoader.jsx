import React from 'react';
import { motion } from 'framer-motion';

const SuspenseLoader = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 relative overflow-hidden">
            {/* Background gradients similar to Login/Register pages */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-4000"></div>

            {/* Loading Animation Elements */}
            <motion.div
                className="relative z-10 flex flex-col items-center p-8 bg-white/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex space-x-2">
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                            animate={{
                                y: ["0%", "-50%", "0%"],
                                scale: [1, 1.2, 1]
                            }}
                            transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: i * 0.2
                            }}
                        />
                    ))}
                </div>
                <motion.p
                    className="mt-6 font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-lg tracking-wide"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                    Loading Base Modules...
                </motion.p>
            </motion.div>
        </div>
    );
};

export default SuspenseLoader;
