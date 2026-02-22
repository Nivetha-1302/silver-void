import React from 'react';
import { Menu, Bell, User, Search, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const Header = ({ toggleSidebar }) => {
    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200/50 bg-white/60 backdrop-blur-xl px-4 shadow-sm transition-all sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 lg:hidden"
                >
                    <Menu className="h-6 w-6" aria-hidden="true" />
                </button>

                {/* Search Bar - Hidden on small screens */}
                <div className="hidden md:flex relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-9 pr-4 py-2 text-sm bg-gray-100/50 border-transparent rounded-full focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 w-64 transition-all outline-none"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="relative rounded-full p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse"></span>
                    <Bell className="h-5 w-5" aria-hidden="true" />
                </button>

                <div className="h-8 w-px bg-gray-200 mx-1"></div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-700">Admin User</p>
                        <p className="text-xs text-gray-500">Administrator</p>
                    </div>
                    <button className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 p-[2px] shadow-sm hover:shadow-md transition-shadow">
                        <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                            <User className="h-5 w-5 text-indigo-600" />
                        </div>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
