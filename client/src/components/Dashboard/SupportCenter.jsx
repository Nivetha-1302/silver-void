import React, { useState } from 'react';
import { HelpCircle, Mail, MessageCircle, FileText, Phone, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const SupportCenter = () => {
    const [activeTab, setActiveTab] = useState('faq');

    const faqs = [
        {
            q: "How do I reset my password?",
            a: "Go to Account Settings > Security and click on 'Change Password'. Follow the email verification steps."
        },
        {
            q: "Why is the camera feed not showing?",
            a: "Ensure you have granted browser permissions for the camera. Check if another application is using the camera."
        },
        {
            q: "How is productivity score calculated?",
            a: "It's a weighted average of active screen time, focus score (from AI), and task completion rates."
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } }
    };

    return (
        <motion.div
            className="max-w-4xl mx-auto p-6 space-y-8"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">How can we help you?</h1>
                <p className="text-gray-500">Search our knowledge base or get in touch with support.</p>
                <div className="mt-6 max-w-lg mx-auto relative">
                    <input
                        type="text"
                        placeholder="Describe your issue..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <HelpCircle className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <motion.div variants={containerVariants} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-gray-800 mb-2">Documentation</h3>
                    <p className="text-sm text-gray-500">Detailed guides on using SmartTrack metrics and features.</p>
                </motion.div>

                <motion.div variants={containerVariants} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <MessageCircle className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-gray-800 mb-2">Live Chat</h3>
                    <p className="text-sm text-gray-500">Chat with our AI support agent or a human specialist.</p>
                </motion.div>

                <motion.div variants={containerVariants} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Mail className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-gray-800 mb-2">Email Support</h3>
                    <p className="text-sm text-gray-500">Get a response within 24 hours for complex queries.</p>
                </motion.div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-800">Frequently Asked Questions</h2>
                </div>
                <div className="divide-y divide-gray-50">
                    {faqs.map((faq, idx) => (
                        <div key={idx} className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group">
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center justify-between">
                                {faq.q}
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                            </h4>
                            <p className="text-sm text-gray-500">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="text-center pt-8 border-t border-gray-200 mt-8">
                <p className="text-gray-400 text-sm">Need direct assistance?</p>
                <div className="flex items-center justify-center gap-2 mt-2 text-gray-600 font-medium">
                    <Phone className="w-4 h-4" /> +1 (800) 123-4567
                </div>
            </div>
        </motion.div>
    );
};

export default SupportCenter;
