import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit2, Trash2, Plus, Sparkles, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import socket from '../../utils/socket';

const EmployeeManagement = () => {
    const [employees, setEmployees] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({ fullName: '', email: '', role: 'employee', department: 'Engineering' });
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
    const [filterDepartment, setFilterDepartment] = useState('All');
    const [sortBy, setSortBy] = useState('Name'); // Name, Focus, Task Completion

    // Live socket listener setup below

    useEffect(() => {
        fetchEmployees();

        const handleRealtimeUpdate = (data) => {
            setEmployees(prev => prev.map(emp => {
                if (emp._id === data.id || emp._id === data.userId) {
                    // Update metrics
                    return {
                        ...emp,
                        metrics: {
                            ...emp.metrics,
                            focusScore: data.focusScore || emp.metrics?.focusScore || 0
                        },
                        // Optionally update status if you track it
                        status: data.status,
                        // Simulate task updates for demo if active
                        taskStats: {
                            ...emp.taskStats,
                            completionRate: (data.focusScore > 80 ? Math.max(emp.taskStats?.completionRate || 0, 85) : emp.taskStats?.completionRate) || (Math.floor(Math.random() * 40) + 60) // Mocking active task progress
                        },
                        aiInsight: data.mood ? `User is currently ${data.mood} with ${data.focusScore}% focus.` : emp.aiInsight
                    };
                }
                return emp;
            }));
        };

        socket.on('dashboard_update', handleRealtimeUpdate);
        return () => socket.off('dashboard_update', handleRealtimeUpdate);
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await axios.get('/api/employees');
            setEmployees(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load employees");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            const res = await axios.delete(`/api/employees/${id}`); // Variable unused but call needed
            toast.success("Employee removed");
            fetchEmployees();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to delete");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingEmployee) {
                await axios.put(`/api/employees/${editingEmployee._id}`, formData);
                toast.success("Employee updated");
            } else {
                await axios.post('/api/employees', formData);
                toast.success("Employee added");
            }
            setIsModalOpen(false);
            setEditingEmployee(null);
            setFormData({ fullName: '', email: '', role: 'employee', department: 'Engineering' });
            fetchEmployees();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Operation failed");
        }
    };

    const openModal = (emp = null) => {
        if (emp) {
            setEditingEmployee(emp);
            setFormData({
                fullName: emp.fullName,
                email: emp.email,
                role: emp.role,
                department: emp.department || 'Engineering'
            });
        } else {
            setEditingEmployee(null);
            setFormData({ fullName: '', email: '', role: 'employee', department: 'Engineering' });
        }
        setIsModalOpen(true);
    };

    // Advanced Filtering & Sorting
    const filteredEmployees = employees
        .filter(emp => {
            const lower = searchTerm.toLowerCase();
            const matchesSearch = emp.fullName.toLowerCase().includes(lower) ||
                emp.email.toLowerCase().includes(lower) ||
                (emp.department || '').toLowerCase().includes(lower);
            const matchesDept = filterDepartment === 'All' || emp.department === filterDepartment;
            return matchesSearch && matchesDept;
        })
        .sort((a, b) => {
            if (sortBy === 'Name') return a.fullName.localeCompare(b.fullName);
            if (sortBy === 'Focus Score') return (b.metrics?.focusScore || 0) - (a.metrics?.focusScore || 0);
            if (sortBy === 'Task Completion') return (b.taskStats?.completionRate || 0) - (a.taskStats?.completionRate || 0);
            return 0;
        });

    // Stats Calculation
    const stats = {
        total: employees.length,
        avgFocus: Math.round(employees.reduce((acc, curr) => acc + (curr.metrics?.focusScore || 0), 0) / (employees.length || 1)),
        highPerformers: employees.filter(e => (e.taskStats?.completionRate || 0) > 80).length,
        atRisk: employees.filter(e => (e.metrics?.focusScore || 100) < 40).length
    };

    return (
        <div className="p-8 h-full overflow-y-auto space-y-8">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-surface p-4 rounded-xl border border-border flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-primary">{stats.total}</span>
                    <span className="text-sm text-textSecondary uppercase tracking-wider">Total Employees</span>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-border flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-green-500">{stats.avgFocus}%</span>
                    <span className="text-sm text-textSecondary uppercase tracking-wider">Avg Focus</span>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-border flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-blue-500">{stats.highPerformers}</span>
                    <span className="text-sm text-textSecondary uppercase tracking-wider">High Performers</span>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-border flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-red-500">{stats.atRisk}</span>
                    <span className="text-sm text-textSecondary uppercase tracking-wider">At Risk</span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-surface p-4 rounded-xl border border-border">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative group">
                        <input
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-surfaceAlt rounded-lg border border-border outline-none focus:ring-2 focus:ring-primary/20 w-64 transition-all"
                        />
                        <Sparkles className="w-4 h-4 text-textSecondary absolute left-3 top-1/2 -translate-y-1/2 group-hover:text-primary transition-colors" />
                    </div>
                </div>

                <div className="flex gap-4 items-center overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                    <select
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                        className="px-3 py-2 bg-surfaceAlt rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    >
                        <option value="All">All Departments</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Design">Design</option>
                        <option value="Marketing">Marketing</option>
                        <option value="HR">HR</option>
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 bg-surfaceAlt rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    >
                        <option value="Name">Sort by Name</option>
                        <option value="Focus Score">Highest Focus</option>
                        <option value="Task Completion">Task Completion</option>
                    </select>

                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 whitespace-nowrap shadow-md"
                    >
                        <Plus className="w-5 h-5" /> <span className="font-semibold">Add Employee</span>
                    </button>
                </div>
            </div>

            {/* Grid View */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                {filteredEmployees.map(emp => (
                    <div key={emp._id} className="bg-surface rounded-xl p-6 shadow-sm border border-border group hover:border-primary/50 transition-all hover:shadow-md relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button onClick={() => openModal(emp)} className="p-2 bg-surfaceAlt rounded-full hover:text-primary shadow-sm"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(emp._id)} className="p-2 bg-surfaceAlt rounded-full hover:text-red-500 shadow-sm"><Trash2 className="w-4 h-4" /></button>
                        </div>

                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 text-white flex items-center justify-center font-bold text-xl shadow-lg">
                                {emp.fullName.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-text">{emp.fullName}</h3>
                                <p className="text-sm text-textSecondary">{emp.role} • <span className="text-primary font-medium">{emp.department || 'General'}</span></p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-surfaceAlt p-2 rounded-lg text-center">
                                <div className="text-xs text-textSecondary">Task Completion</div>
                                <div className="font-bold text-primary">{emp.taskStats?.completionRate || 0}%</div>
                            </div>
                            <div className="bg-surfaceAlt p-2 rounded-lg text-center">
                                <div className="text-xs text-textSecondary">Focus Score</div>
                                <div className={`font-bold ${(emp.metrics?.focusScore || 0) > 70 ? 'text-green-500' : 'text-yellow-500'}`}>{emp.metrics?.focusScore || 0}</div>
                            </div>
                        </div>

                        {/* AI Insight Section */}
                        <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="w-3 h-3 text-blue-600" />
                                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">AI Insight</span>
                            </div>
                            <p className="text-xs text-textSecondary italic line-clamp-2">
                                "{emp.aiInsight || "Analyzing performance patterns..."}"
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-2xl w-full max-w-md shadow-2xl border border-border">
                        <div className="p-6 border-b border-border flex justify-between items-center">
                            <h2 className="text-xl font-bold text-text">{editingEmployee ? 'Edit Employee' : 'New Employee'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-textSecondary hover:text-text"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-textSecondary mb-1">Full Name</label>
                                <input
                                    required
                                    value={formData.fullName}
                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full px-3 py-2 bg-surfaceAlt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-textSecondary mb-1">Email</label>
                                <input
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 bg-surfaceAlt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-textSecondary mb-1">Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-3 py-2 bg-surfaceAlt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="employee">Employee</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-textSecondary mb-1">Department</label>
                                    <select
                                        value={formData.department}
                                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                                        className="w-full px-3 py-2 bg-surfaceAlt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option>Engineering</option>
                                        <option>Design</option>
                                        <option>Product</option>
                                        <option>HR</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium mt-4">
                                {editingEmployee ? 'Save Changes' : 'Create Employee'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeManagement;
