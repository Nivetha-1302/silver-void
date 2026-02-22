import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, BrainCircuit, Check, X, Clock, User, Sparkles, Filter, Search, Trash2, Edit2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const TaskManager = () => {
    const [tasks, setTasks] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPriority, setFilterPriority] = useState('All');

    // Form State
    const [formData, setFormData] = useState({
        title: '', description: '', priority: 'Medium', requiredSkills: '', autoAssign: false
    });

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await axios.get('/api/tasks');
            setTasks(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load tasks");
        }
    };

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, requiredSkills: formData.requiredSkills.split(',').map(s => s.trim()) };

            if (editingTask) {
                await axios.put(`/api/tasks/${editingTask._id}`, payload);
                toast.success("Task Updated");
            } else {
                const res = await axios.post('/api/tasks', payload);
                if (res.data.aiScore) {
                    toast.success(`AI Assigned to ${res.data.assignee} (Match: ${res.data.aiScore}%)`);
                } else {
                    toast.success("Task Created");
                }
            }

            setIsModalOpen(false);
            setEditingTask(null);
            setFormData({ title: '', description: '', priority: 'Medium', requiredSkills: '', autoAssign: false });
            fetchTasks();
        } catch (err) {
            toast.error("Operation failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this task?")) return;
        try {
            await axios.delete(`/api/tasks/${id}`);
            toast.success("Task Deleted");
            fetchTasks();
        } catch (err) {
            toast.error("Failed to delete");
        }
    };

    const openModal = (task = null) => {
        if (task) {
            setEditingTask(task);
            setFormData({
                title: task.title,
                description: task.description,
                priority: task.priority,
                requiredSkills: task.requiredSkills?.join(', ') || '',
                autoAssign: false
            });
        } else {
            setEditingTask(null);
            setFormData({ title: '', description: '', priority: 'Medium', requiredSkills: '', autoAssign: false });
        }
        setIsModalOpen(true);
    };

    // Drag & Drop
    const handleDragStart = (e, taskId) => {
        e.dataTransfer.setData("taskId", taskId);
    };

    const handleDrop = async (e, status) => {
        const taskId = e.dataTransfer.getData("taskId");
        setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status } : t)); // Optimistic

        try {
            await axios.put(`/api/tasks/${taskId}`, { status });
        } catch (err) {
            toast.error("Failed to move task");
            fetchTasks();
        }
    };

    const handleDragOver = (e) => e.preventDefault();

    // Stats
    const stats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'Done').length,
        highPriority: tasks.filter(t => t.priority === 'High').length,
        pending: tasks.filter(t => t.status !== 'Done').length
    };

    // Filter Logic
    const filteredTasks = tasks.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPriority = filterPriority === 'All' || t.priority === filterPriority;
        return matchesSearch && matchesPriority;
    });

    const renderColumn = (status, color, icon) => (
        <div
            className={`flex-1 bg-surfaceAlt rounded-xl p-4 min-h-[600px] border border-border flex flex-col gap-4`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
        >
            <div className={`flex justify-between items-center pb-3 border-b border-${color}-200`}>
                <div className={`flex items-center gap-2 font-bold text-${color}-700`}>
                    {icon}
                    {status}
                </div>
                <span className={`bg-${color}-100 text-${color}-700 px-2 py-0.5 rounded-full text-xs font-bold`}>
                    {filteredTasks.filter(t => t.status === status).length}
                </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                {filteredTasks.filter(t => t.status === status).map(task => (
                    <div
                        key={task._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task._id)}
                        className="bg-surface p-4 rounded-xl shadow-sm border border-border cursor-move hover:border-primary/50 hover:shadow-md transition-all group relative"
                    >
                        {/* Actions */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button onClick={() => openModal(task)} className="p-1.5 bg-surfaceAlt rounded-md hover:text-primary"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={() => handleDelete(task._id)} className="p-1.5 bg-surfaceAlt rounded-md hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                        </div>

                        <div className="mb-2">
                            <div className="flex justify-between items-start">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium mb-2 inline-block ${task.priority === 'High' ? 'bg-red-50 text-red-600 border border-red-100' :
                                    task.priority === 'Medium' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' :
                                        'bg-green-50 text-green-600 border border-green-100'
                                    }`}>
                                    {task.priority} Priority
                                </span>
                                {task.aiScore > 0 && (
                                    <span className="text-[10px] flex items-center gap-1 text-purple-600 font-medium">
                                        <BrainCircuit className="w-3 h-3" /> {task.aiScore}% Match
                                    </span>
                                )}
                            </div>
                            <h4 className="font-bold text-text text-sm leading-tight">{task.title}</h4>
                        </div>

                        <p className="text-xs text-textSecondary line-clamp-2 mb-3">{task.description}</p>

                        <div className="flex items-center justify-between pt-3 border-t border-border/50">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white">
                                    {task.assignee?.fullName?.charAt(0) || '?'}
                                </div>
                                <span className="text-xs text-textSecondary truncate max-w-[80px]">
                                    {task.assignee?.fullName.split(' ')[0] || 'Unassigned'}
                                </span>
                            </div>
                            <div className="text-[10px] text-textSecondary flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Today
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="p-8 h-full overflow-y-auto space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-surface p-4 rounded-xl border border-border flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-primary">{stats.total}</span>
                    <span className="text-sm text-textSecondary uppercase tracking-wider">Total Tasks</span>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-border flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-yellow-500">{stats.pending}</span>
                    <span className="text-sm text-textSecondary uppercase tracking-wider">Pending</span>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-border flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-green-500">{stats.completed}</span>
                    <span className="text-sm text-textSecondary uppercase tracking-wider">Completed</span>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-border flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-red-500">{stats.highPriority}</span>
                    <span className="text-sm text-textSecondary uppercase tracking-wider">High Priority</span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-surface p-4 rounded-xl border border-border">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <h2 className="text-lg font-bold text-text whitespace-nowrap hidden md:block">Task Board</h2>
                    <div className="relative group">
                        <input
                            placeholder="Search tasks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-surfaceAlt rounded-lg border border-border outline-none focus:ring-2 focus:ring-primary/20 w-full md:w-64 transition-all"
                        />
                        <Search className="w-4 h-4 text-textSecondary absolute left-3 top-1/2 -translate-y-1/2 group-hover:text-primary transition-colors" />
                    </div>
                </div>

                <div className="flex gap-4 items-center overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                    <div className="flex items-center gap-2 bg-surfaceAlt px-3 py-2 rounded-lg border border-border">
                        <Filter className="w-4 h-4 text-textSecondary" />
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="bg-transparent text-sm font-medium outline-none cursor-pointer text-text"
                        >
                            <option value="All">All Priorities</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>

                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 whitespace-nowrap shadow-md"
                    >
                        <Plus className="w-5 h-5" /> <span className="font-semibold">New Task</span>
                    </button>
                </div>
            </div>

            {/* Board Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full pb-10">
                {renderColumn('To Do', 'gray', <AlertCircle className="w-5 h-5" />)}
                {renderColumn('In Progress', 'blue', <Clock className="w-5 h-5" />)}
                {renderColumn('Done', 'green', <Check className="w-5 h-5" />)}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-2xl w-full max-w-md shadow-2xl border border-border animate-float">
                        <div className="p-6 border-b border-border flex justify-between items-center bg-surfaceAlt/50 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-text">{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-textSecondary hover:text-red-500 transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleCreateOrUpdate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-1">Title</label>
                                <input
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 bg-surfaceAlt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    placeholder="e.g. Redesign Login Page"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 bg-surfaceAlt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 h-24 resize-none transition-all"
                                    placeholder="Task details..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-1">Priority</label>
                                    <select
                                        value={formData.priority}
                                        onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                        className="w-full px-4 py-2 bg-surfaceAlt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                    >
                                        <option>Low</option>
                                        <option>Medium</option>
                                        <option>High</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-1">Required Skills</label>
                                    <input
                                        value={formData.requiredSkills}
                                        onChange={e => setFormData({ ...formData, requiredSkills: e.target.value })}
                                        className="w-full px-4 py-2 bg-surfaceAlt border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder="React, Node.js"
                                    />
                                </div>
                            </div>

                            {!editingTask && (
                                <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-100 rounded-lg group hover:border-purple-300 transition-colors cursor-pointer" onClick={() => setFormData({ ...formData, autoAssign: !formData.autoAssign })}>
                                    <input
                                        type="checkbox"
                                        id="autoAssign"
                                        checked={formData.autoAssign}
                                        onChange={e => setFormData({ ...formData, autoAssign: e.target.checked })}
                                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                                    />
                                    <label htmlFor="autoAssign" className="flex items-center gap-2 text-sm font-bold text-purple-700 cursor-pointer select-none">
                                        <BrainCircuit className="w-4 h-4" />
                                        AI Smart Delegate (Auto-Assign)
                                    </label>
                                </div>
                            )}

                            <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-bold shadow-lg shadow-primary/25 mt-2">
                                {editingTask ? 'Save Changes' : 'Create Task'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskManager;
