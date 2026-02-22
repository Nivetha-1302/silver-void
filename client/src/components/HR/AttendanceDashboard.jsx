import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, AlertTriangle, CheckCircle, User } from 'lucide-react';

const AttendanceDashboard = () => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const fetchLogs = async () => {
            try {

                const res = await axios.get('/api/attendance/admin/today');
                setLogs(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchLogs();
    }, []);

    return (
        <div className="p-8 h-full overflow-y-auto">
            <h1 className="text-2xl font-bold text-text mb-6">AI Attendance Monitor</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
                    <h3 className="text-textSecondary text-sm font-medium">Present Today</h3>
                    <p className="text-3xl font-bold text-primary mt-2">{logs.filter(l => l.checkIn).length}</p>
                </div>
                <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
                    <h3 className="text-textSecondary text-sm font-medium">Late Arrivals</h3>
                    <p className="text-3xl font-bold text-yellow-500 mt-2">{logs.filter(l => l.status === 'Late').length}</p>
                </div>
                <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
                    <h3 className="text-textSecondary text-sm font-medium">Burnout Risks Detected</h3>
                    {/* Placeholder for future aggregate ML risk query */}
                    <p className="text-3xl font-bold text-red-500 mt-2">--</p>
                </div>
            </div>

            <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-surfaceAlt text-textSecondary text-xs uppercase">
                        <tr>
                            <th className="px-6 py-4">Employee</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Check In</th>
                            <th className="px-6 py-4">Check Out</th>
                            <th className="px-6 py-4">Duration</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {logs.map(log => (
                            <tr key={log._id} className="hover:bg-surfaceAlt/50">
                                <td className="px-6 py-4 font-medium text-text flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">
                                        {log.userId?.fullName?.charAt(0)}
                                    </div>
                                    {log.userId?.fullName}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${log.status === 'Late' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-green-100 text-green-700'
                                        }`}>
                                        {log.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-textSecondary">{new Date(log.checkIn).toLocaleTimeString()}</td>
                                <td className="px-6 py-4 text-textSecondary">{log.checkOut ? new Date(log.checkOut).toLocaleTimeString() : '--:--'}</td>
                                <td className="px-6 py-4 text-textSecondary">{log.duration || 0} hrs</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AttendanceDashboard;
