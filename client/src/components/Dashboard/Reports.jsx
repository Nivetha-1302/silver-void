import React, { useState, useEffect } from 'react';
import { FileText, Download, Filter, RefreshCw, ChevronLeft } from 'lucide-react';
// removed AdminLayout
import axios from 'axios';

import socket from '../../utils/socket';

const Reports = () => {
    const [reportType, setReportType] = useState('SUMMARY'); // 'SUMMARY', 'ATTENDANCE', 'APPS', 'PRODUCTIVITY'
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Summary Data (Live Status)
    const [liveStatusData, setLiveStatusData] = useState([]);

    useEffect(() => {
        // Initial Fetch for "Summary" view (Live Status) works as the default landing
        fetchSummaryData();

        const handleLiveUpdate = (data) => {
            setLiveStatusData(prev => prev.map(user => {
                // If the update matches this user (assuming data.id matches user.id or we need a way to link them)
                // The mock data uses user._id. The socket data sends 'id'. 
                // We might need to assume 'id' in socket matches user._id or some other identifier.
                // For this playground, let's assume loose matching or just update if we can find a user.
                // Realistically, the socket id might be different from user id unless handled by backend auth.
                // Let's assume data.id is the User ID for now as per widespread convention in this app.
                if (user.id === data.id || user.id === data.userId) {
                    return {
                        ...user,
                        status: data.status,
                        productivity: `${data.focusScore || 0}%`,
                        lastSeen: 'Just now'
                    };
                }
                return user;
            }));
        };

        socket.on('dashboard_update', handleLiveUpdate);
        return () => socket.off('dashboard_update', handleLiveUpdate);
    }, []);

    const fetchSummaryData = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/auth/users');
            // Mocking live part for summary report base but allowing socket to take over
            const augmented = res.data.map(u => ({
                id: u._id,
                employee: u.fullName,
                role: u.role,
                status: 'Offline', // Default
                lastSeen: 'N/A',
                productivity: '0%'
            }));
            setLiveStatusData(augmented);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchReport = async (type) => {
        setLoading(true);
        setReportType(type);
        setReportData([]);
        try {
            let res;
            if (type === 'ATTENDANCE') {
                res = await axios.get('/api/attendance/report');
            } else if (type === 'APPS') {
                res = await axios.get('/api/monitoring/apps-report');
            } else if (type === 'PRODUCTIVITY') {
                res = await axios.get('/api/monitoring/activity-report');
            } else if (type === 'AUDIT') {
                res = await axios.get('/api/monitoring/audit-logs');
            }
            if (res && res.data) setReportData(res.data);
        } catch (err) {
            console.error("Error fetching report:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        const dataToExport = reportType === 'SUMMARY' ? liveStatusData : reportData;
        if (!dataToExport.length) return alert("No data to export");

        const headers = Object.keys(dataToExport[0]).filter(k => k !== '_id' && k !== '__v' && k !== 'userId'); // Cleanup keys
        const csvContent = [
            headers.join(','),
            ...dataToExport.map(row => headers.map(fieldName => {
                let val = row[fieldName];
                if (typeof val === 'object' && val !== null) {
                    val = JSON.stringify(val); // In case it's an object like userId
                }
                return JSON.stringify(val || '');
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${reportType.toLowerCase()}_compliance_report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderTableHeaders = () => {
        switch (reportType) {
            case 'ATTENDANCE':
                return ['Employee', 'Date', 'Clock In', 'Clock Out', 'Duration', 'Status'];
            case 'APPS':
                return ['Employee', 'Date', 'App Name', 'Category', 'Duration'];
            case 'PRODUCTIVITY':
                return ['Employee', 'Date', 'Active Time', 'Idle Time', 'Productivity Score'];
            case 'AUDIT':
                return ['User / Instance', 'Timestamp', 'Event Type', 'Details', 'Severity'];
            default: // SUMMARY
                return ['Employee', 'Role', 'Current Status', 'Last Seen', 'Live Productivity'];
        }
    };

    const renderTableRows = () => {
        const data = reportType === 'SUMMARY' ? liveStatusData : reportData;

        if (loading) return <tr><td colSpan="6" className="p-6 text-center text-gray-500 dark:text-gray-400">Loading Report Data...</td></tr>;
        if (!data.length) return <tr><td colSpan="6" className="p-6 text-center text-gray-400 dark:text-gray-500">No records found.</td></tr>;

        return data.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors border-b border-gray-100 dark:border-slate-700 last:border-0">
                {reportType === 'ATTENDANCE' && (
                    <>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{row.employee}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{row.date}</td>
                        <td className="px-6 py-4 text-green-600 dark:text-emerald-400 font-mono">{row.in}</td>
                        <td className="px-6 py-4 text-red-600 dark:text-rose-400 font-mono">{row.out}</td>
                        <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-200">{row.duration}</td>
                        <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${row.status === 'Late' ? 'bg-red-100 text-red-800 dark:bg-rose-500/20 dark:text-rose-300' : 'bg-green-100 text-green-800 dark:bg-emerald-500/20 dark:text-emerald-300'}`}>{row.status}</span></td>
                    </>
                )}
                {reportType === 'APPS' && (
                    <>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{row.employee}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{row.date}</td>
                        <td className="px-6 py-4 text-blue-600 dark:text-indigo-400 font-medium">{row.app}</td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">{row.category}</td>
                        <td className="px-6 py-4 font-mono dark:text-gray-300">{row.duration}</td>
                    </>
                )}
                {reportType === 'PRODUCTIVITY' && (
                    <>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{row.employee}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{row.date}</td>
                        <td className="px-6 py-4 text-green-600 dark:text-emerald-400">{row.activeInfo}</td>
                        <td className="px-6 py-4 text-yellow-600 dark:text-amber-400">{row.idleInfo}</td>
                        <td className="px-6 py-4 font-bold text-blue-600 dark:text-indigo-400">{row.score}</td>
                    </>
                )}
                {reportType === 'SUMMARY' && (
                    <>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{row.employee}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{row.role}</td>
                        <td className="px-6 py-4 dark:text-gray-200">{row.status}</td>
                        <td className="px-6 py-4 font-mono text-xs dark:text-gray-400">{row.lastSeen}</td>
                        <td className="px-6 py-4 dark:text-gray-200">{row.productivity}</td>
                    </>
                )}
                {reportType === 'AUDIT' && (
                    <>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{row.userId?.fullName || 'System'}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{new Date(row.timestamp).toLocaleString()}</td>
                        <td className="px-6 py-4 font-mono font-bold text-gray-800 dark:text-gray-200">{row.type}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{row.details || '-'}</td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase ${row.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border-rose-200 border' :
                                    row.severity === 'HIGH' ? 'bg-orange-100 text-orange-800 border-orange-200 border' :
                                        row.severity === 'LOW' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 border' :
                                            'bg-yellow-100 text-yellow-800 border-yellow-200 border'
                                }`}>
                                {row.severity}
                            </span>
                        </td>
                    </>
                )}
            </tr>
        ));
    };

    return (

        <div className="p-8 h-full bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-100 flex flex-col transition-colors">
            <div className="flex justify-between items-center mb-8 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports Center</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {reportType === 'SUMMARY' ? 'Real-time overview' : `${reportType.charAt(0) + reportType.slice(1).toLowerCase()} Report`}
                    </p>
                </div>
                <div className="flex gap-4">
                    {reportType !== 'SUMMARY' && (
                        <button onClick={() => setReportType('SUMMARY')} className="px-4 py-2 bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors">
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                    )}
                    <button onClick={() => reportType === 'SUMMARY' ? fetchSummaryData() : fetchReport(reportType)} className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-700 dark:text-gray-300 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                    <button onClick={handleExportCSV} className="px-4 py-2 bg-blue-600 dark:bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 dark:hover:bg-indigo-700 shadow-sm transition-colors font-bold shadow-blue-500/30">
                        <Download className="w-4 h-4" /> Export CSV Log
                    </button>
                </div>
            </div>

            {reportType === 'SUMMARY' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 shrink-0">
                    <div onClick={() => fetchReport('ATTENDANCE')}>
                        <ReportTypeCard title="Attendance Report" desc="Clock-in/out times, late arrivals." />
                    </div>
                    <div onClick={() => fetchReport('APPS')}>
                        <ReportTypeCard title="App Usage Analysis" desc="Time spent on specific applications." />
                    </div>
                    <div onClick={() => fetchReport('PRODUCTIVITY')}>
                        <ReportTypeCard title="Productivity Timeline" desc="Detailed breakdown of active vs idle time." />
                    </div>
                    <div onClick={() => fetchReport('AUDIT')}>
                        <ReportTypeCard title="Compliance & Audit" desc="SOC2 / ISO27001 Security Logs." />
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden flex-1 flex flex-col transition-colors">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-gray-700 dark:text-gray-200">
                        {reportType === 'SUMMARY' ? 'Live Status Log' : 'Detailed Data View'}
                    </h3>
                </div>
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left bg-white dark:bg-slate-800">
                        <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100 dark:border-slate-700 sticky top-0">
                            <tr>
                                {renderTableHeaders().map(h => (
                                    <th key={h} className="px-6 py-4 font-semibold">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {renderTableRows()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const ReportTypeCard = ({ title, desc }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-500 transition-colors cursor-pointer group shadow-sm hover:shadow-md h-full">
        <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-sm text-gray-500">{desc}</p>
    </div>
);

export default Reports;
