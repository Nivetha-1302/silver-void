import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import AiChatbot from '../Chatbot/AiChatbot';
import AnimatedBackground from '../UI/AnimatedBackground';

const AdminLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (

        <div className="flex h-screen bg-transparent text-slate-800 overflow-hidden font-sans relative">
            <AnimatedBackground intensity="low" />

            {/* Sidebar - Fixed width on Desktop, Slide-over on Mobile */}
            <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full bg-white/30 backdrop-blur-sm">
                {/* Header is now part of the layout */}
                <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

                {/* Scrollable Main Content */}
                <main className="flex-1 overflow-y-auto w-full relative scroll-smooth p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {children}
                    </div>
                </main>

                {/* Global AI Assistant */}
                <AiChatbot />
            </div>
        </div>
    );

};

export default AdminLayout;
