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

        const headers = Object.keys(dataToExport[0]);
        const csvContent = [
            headers.join(','),
            ...dataToExport.map(row => headers.map(fieldName => JSON.stringify(row[fieldName] || '')).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${reportType.toLowerCase()}_report.csv`);
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
            default: // SUMMARY
                return ['Employee', 'Role', 'Current Status', 'Last Seen', 'Live Productivity'];
        }
    };

    const renderTableRows = () => {
        const data = reportType === 'SUMMARY' ? liveStatusData : reportData;

        if (loading) return <tr><td colSpan="6" className="p-6 text-center text-gray-500">Loading Report Data...</td></tr>;
        if (!data.length) return <tr><td colSpan="6" className="p-6 text-center text-gray-400">No records found.</td></tr>;

        return data.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                {reportType === 'ATTENDANCE' && (
                    <>
                        <td className="px-6 py-4 font-medium text-gray-900">{row.employee}</td>
                        <td className="px-6 py-4 text-gray-600">{row.date}</td>
                        <td className="px-6 py-4 text-green-600 font-mono">{row.in}</td>
                        <td className="px-6 py-4 text-red-600 font-mono">{row.out}</td>
                        <td className="px-6 py-4 font-bold text-gray-800">{row.duration}</td>
                        <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${row.status === 'Late' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{row.status}</span></td>
                    </>
                )}
                {reportType === 'APPS' && (
                    <>
                        <td className="px-6 py-4 font-medium text-gray-900">{row.employee}</td>
                        <td className="px-6 py-4 text-gray-600">{row.date}</td>
                        <td className="px-6 py-4 text-blue-600 font-medium">{row.app}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{row.category}</td>
                        <td className="px-6 py-4 font-mono">{row.duration}</td>
                    </>
                )}
                {reportType === 'PRODUCTIVITY' && (
                    <>
                        <td className="px-6 py-4 font-medium text-gray-900">{row.employee}</td>
                        <td className="px-6 py-4 text-gray-600">{row.date}</td>
                        <td className="px-6 py-4 text-green-600">{row.activeInfo}</td>
                        <td className="px-6 py-4 text-yellow-600">{row.idleInfo}</td>
                        <td className="px-6 py-4 font-bold text-blue-600">{row.score}</td>
                    </>
                )}
                {reportType === 'SUMMARY' && (
                    <>
                        <td className="px-6 py-4 font-medium text-gray-900">{row.employee}</td>
                        <td className="px-6 py-4 text-gray-600">{row.role}</td>
                        <td className="px-6 py-4">{row.status}</td>
                        <td className="px-6 py-4 font-mono text-xs">{row.lastSeen}</td>
                        <td className="px-6 py-4">{row.productivity}</td>
                    </>
                )}
            </tr>
        ));
    };

    return (

        <div className="p-8 h-full bg-gray-50 text-gray-800 flex flex-col">
            <div className="flex justify-between items-center mb-8 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Reports Center</h1>
                    <p className="text-gray-500">
                        {reportType === 'SUMMARY' ? 'Real-time overview' : `${reportType.charAt(0) + reportType.slice(1).toLowerCase()} Report`}
                    </p>
                </div>
                <div className="flex gap-4">
                    {reportType !== 'SUMMARY' && (
                        <button onClick={() => setReportType('SUMMARY')} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-300">
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                    )}
                    <button onClick={() => reportType === 'SUMMARY' ? fetchSummaryData() : fetchReport(reportType)} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 flex items-center gap-2 hover:bg-gray-50">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                    <button onClick={handleExportCSV} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            {reportType === 'SUMMARY' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 shrink-0">
                    <div onClick={() => fetchReport('ATTENDANCE')}>
                        <ReportTypeCard title="Attendance Report" desc="Clock-in/out times, late arrivals." />
                    </div>
                    <div onClick={() => fetchReport('APPS')}>
                        <ReportTypeCard title="App Usage Analysis" desc="Time spent on specific applications." />
                    </div>
                    <div onClick={() => fetchReport('PRODUCTIVITY')}>
                        <ReportTypeCard title="Productivity Timeline" desc="Detailed breakdown of active vs idle time." />
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-gray-700">
                        {reportType === 'SUMMARY' ? 'Live Status Log' : 'Detailed Data View'}
                    </h3>
                </div>
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left bg-white">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100 sticky top-0">
                            <tr>
                                {renderTableHeaders().map(h => (
                                    <th key={h} className="px-6 py-4 font-semibold">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
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
