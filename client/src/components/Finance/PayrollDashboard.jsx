import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Download, Plus, Search, Calendar, CheckCircle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import axios from 'axios';
import toast from 'react-hot-toast';

const PayrollDashboard = () => {
    const [payrolls, setPayrolls] = useState([]);
    const [stats, setStats] = useState({ totalPaid: 0, pending: 0, avgSalary: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPayroll();
    }, []);

    const fetchPayroll = async () => {
        try {
            const res = await axios.get('/api/finance/payroll');
            setPayrolls(res.data);
            calculateStats(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const total = data.reduce((acc, p) => acc + p.netPay, 0);
        const pending = data.filter(p => p.status === 'Pending').length;
        setStats({
            totalPaid: total,
            pending,
            avgSalary: total / (data.length || 1)
        });
    };

    const generatePayroll = async () => {
        const promise = axios.post('/api/finance/payroll/generate', { month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }) });

        toast.promise(promise, {
            loading: 'Calculating Salaries based on Attendance...',
            success: (res) => {
                fetchPayroll();
                return `Processed ${res.data.data.length} Payslips!`;
            },
            error: 'Error generating payroll'
        });
    };

    // Animation Variants
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

    return (
        <motion.div className="p-8 space-y-8" variants={containerVariants} animate="visible">

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
                        Payroll Management
                    </h1>
                    <p className="text-gray-500">Automated Salary Processing & History</p>
                </div>
                <button
                    onClick={generatePayroll}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-lg hover:scale-105 transition-transform font-bold"
                >
                    <Plus className="w-5 h-5" /> Run Payroll (Auto)
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div variants={itemVariants} className="glass p-6 rounded-2xl border-l-4 border-green-500 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <DollarSign className="w-24 h-24" />
                    </div>
                    <p className="text-gray-500 font-bold uppercase text-xs">Total Disbursed (MoM)</p>
                    <h2 className="text-4xl font-black text-gray-800 mt-2">${stats.totalPaid.toLocaleString()}</h2>
                </motion.div>

                <motion.div variants={itemVariants} className="glass p-6 rounded-2xl border-l-4 border-yellow-500 relative overflow-hidden">
                    <p className="text-gray-500 font-bold uppercase text-xs">Pending Clearances</p>
                    <h2 className="text-4xl font-black text-gray-800 mt-2">{stats.pending} <span className="text-lg font-normal text-gray-400">Employees</span></h2>
                </motion.div>

                <motion.div variants={itemVariants} className="glass p-6 rounded-2xl border-l-4 border-purple-500 relative overflow-hidden">
                    <p className="text-gray-500 font-bold uppercase text-xs">Avg. Net Salary</p>
                    <h2 className="text-4xl font-black text-gray-800 mt-2">${Math.round(stats.avgSalary).toLocaleString()}</h2>
                </motion.div>
            </div>

            {/* Charts Section */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expense Trend */}
                <div className="glass p-6 rounded-2xl">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-500" /> Salary Expense Trend</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={payrolls.slice(0, 6).reverse()}>
                                <defs>
                                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="netPay" stroke="#10b981" fillOpacity={1} fill="url(#colorNet)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Distribution */}
                <div className="glass p-6 rounded-2xl">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-orange-500" /> Processing Status</h3>
                    <div className="h-64 flex items-center justify-center">
                        {/* Placeholder for now - simplified visual */}
                        <div className="flex gap-8 text-center">
                            <div>
                                <div className="w-32 h-32 rounded-full border-8 border-green-500 flex items-center justify-center text-3xl font-bold text-green-600">
                                    {Math.round((payrolls.filter(p => p.status === 'Paid').length / (payrolls.length || 1)) * 100)}%
                                </div>
                                <p className="mt-2 font-bold text-gray-500">Completed</p>
                            </div>
                            <div>
                                <div className="w-32 h-32 rounded-full border-8 border-yellow-400 flex items-center justify-center text-3xl font-bold text-yellow-600">
                                    {Math.round((payrolls.filter(p => p.status === 'Pending').length / (payrolls.length || 1)) * 100)}%
                                </div>
                                <p className="mt-2 font-bold text-gray-500">Processing</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Table */}
            <motion.div variants={itemVariants} className="glass rounded-2xl overflow-hidden border border-white/40 shadow-xl">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                    <h3 className="font-bold">Recent Payslips</h3>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <input type="text" placeholder="Search employee..." className="pl-10 pr-4 py-2 rounded-lg bg-white border-none focus:ring-2 focus:ring-green-400 outline-none text-sm w-64 shadow-sm" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4">Employee</th>
                                <th className="px-6 py-4">Month</th>
                                <th className="px-6 py-4">Base Salary</th>
                                <th className="px-6 py-4">Bonus / Deductions</th>
                                <th className="px-6 py-4">Net Pay</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {payrolls.map((payroll) => (
                                <tr key={payroll._id} className="hover:bg-green-50/30 transition-colors">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                                            {payroll.user?.fullName?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{payroll.user?.fullName}</p>
                                            <p className="text-xs text-gray-500">{payroll.user?.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium">{payroll.month}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">${payroll.baseSalary.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className="text-green-600 font-bold">+${payroll.bonus}</span>
                                        <span className="mx-1 text-gray-300">/</span>
                                        <span className="text-red-500 font-bold">-${payroll.deductions}</span>
                                    </td>
                                    <td className="px-6 py-4 font-black text-gray-800">${payroll.netPay.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${payroll.status === 'Paid'
                                            ? 'bg-green-100 text-green-700 border-green-200'
                                            : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                            }`}>
                                            {payroll.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-gray-400 hover:text-primary transition-colors">
                                            <Download className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {payrolls.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="text-center py-8 text-gray-400 italic">No payroll records found. Click "Run Payroll" to start.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default PayrollDashboard;
