import React from 'react';
import EmployeeCard from './EmployeeCard';

import axios from 'axios';

const EmployeeGrid = ({ liveUpdates }) => {
    const [employees, setEmployees] = React.useState([]);
    const [filterDepartment, setFilterDepartment] = React.useState('All Departments');

    // Generate Dummy Users
    const generateDummyUsers = (currentCount) => {
        const names = [
            "Divya", "Abisha", "Priya", "Sneha", "Pooja",
            "Anjali", "Neha", "Riya", "Shreya", "Kavya",
            "Nidhi", "Swati", "Rashi", "Aditi", "Shikha",
            "Megha", "Tanvi", "Kritika", "Sakshi", "Nisha",
            "Ritu", "Shilpa", "Aakanksha", "Shruti", "Sonal"
        ];

        const dummies = [];
        const numToGenerate = Math.max(0, 25 - currentCount);

        for (let i = 0; i < numToGenerate; i++) {
            const focusScore = Math.floor(Math.random() * 20) + 75;
            const isDistracted = Math.random() > 0.8;

            dummies.push({
                id: `dummy-${i}`,
                name: names[i] || `Employee ${i + 1}`,
                role: 'Analyst',
                department: ['Engineering', 'Design', 'HR', 'Marketing'][Math.floor(Math.random() * 4)],
                status: isDistracted ? 'Distracted' : (Math.random() > 0.3 ? 'Active' : 'Deep Work'),
                focusScore: focusScore,
                mood: isDistracted ? 'Stressed' : (Math.random() > 0.5 ? 'Happy' : 'Neutral'),
                trendData: [focusScore - 4, focusScore + 2, focusScore - 1, focusScore, focusScore + 3, focusScore - 5],
                metricsDetails: {
                    mouseClicks: Math.floor(Math.random() * 500) + 100,
                    keyboardClicks: Math.floor(Math.random() * 800) + 200,
                    screenDistracted: isDistracted ? Math.floor(Math.random() * 15) + 5 : Math.floor(Math.random() * 3),
                    mobileUsage: isDistracted ? 'Yes' : 'No',
                    productivity: focusScore + Math.floor(Math.random() * 5),
                    overallPerformance: focusScore > 85 ? 'Excellent' : 'Good',
                    zoneTracking: ['Green Zone', 'Yellow Zone', 'Red Zone'][isDistracted ? 2 : (focusScore > 85 ? 0 : 1)]
                }
            });
        }
        return dummies;
    };

    // Fetch Initial Data
    React.useEffect(() => {

        const fetchEmployees = async () => {
            try {
                const res = await axios.get('/api/auth/users');
                const formattedData = res.data.map(user => {
                    const fallbackFocus = Math.floor(Math.random() * 20) + 75; // 75-94
                    const focusScore = user.metrics?.focusScore || fallbackFocus;
                    const isDistracted = user.metrics?.mood === 'Stressed' || focusScore < 60;
                    return {
                        id: user._id, // MongoDB ID
                        name: user.fullName || 'Unknown User',
                        role: user.role || 'Employee',
                        department: user.department || 'General', // Default department
                        status: user.metrics?.attendance?.slice(-1)[0]?.status || (Math.random() > 0.2 ? "Active" : "Idle"), // Changed from Offline to Idle
                        focusScore: focusScore,
                        mood: user.metrics?.mood || (Math.random() > 0.8 ? "Happy" : "Neutral"),
                        // Fix: Load persistent history from DB, fallback to realistic dummy data if empty
                        trendData: user.metrics?.focusHistory?.length > 0
                            ? user.metrics.focusHistory.map(h => h.score).slice(-20) // Last 20 points
                            : [focusScore - 4, focusScore + 2, focusScore - 1, focusScore],
                        metricsDetails: {
                            mouseClicks: Math.floor(Math.random() * 500) + 100,
                            keyboardClicks: Math.floor(Math.random() * 800) + 200,
                            screenDistracted: isDistracted ? Math.floor(Math.random() * 15) + 5 : Math.floor(Math.random() * 3),
                            mobileUsage: isDistracted ? 'Yes' : 'No',
                            productivity: focusScore + Math.floor(Math.random() * 5),
                            overallPerformance: focusScore > 85 ? 'Excellent' : 'Good',
                            zoneTracking: ['Green Zone', 'Yellow Zone', 'Red Zone'][isDistracted ? 2 : (focusScore > 85 ? 0 : 1)]
                        }
                    };
                });

                const dummies = generateDummyUsers(formattedData.length);
                setEmployees([...formattedData, ...dummies]);
            } catch (err) {
                console.error("Error fetching employees:", err);
                // Fallback to dummies if error
                setEmployees(generateDummyUsers(0));
            }
        };

        fetchEmployees();
    }, []);

    // Merge Live Updates
    React.useEffect(() => {
        if (!liveUpdates || Object.keys(liveUpdates).length === 0) return;

        setEmployees(prevEmps => prevEmps.map(emp => {
            const update = liveUpdates[emp.id];
            if (update) {
                const newTrend = [...emp.trendData, update.focusScore].slice(-10);
                return {
                    ...emp,
                    status: update.status,
                    focusScore: update.focusScore,
                    mood: update.mood,
                    trendData: newTrend
                };
            }
            return emp;
        }));
    }, [liveUpdates]);

    const filteredEmployees = employees.filter(emp =>
        filterDepartment === 'All Departments' || emp.department === filterDepartment
    );

    return (
        <section>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">Team Performance</h2>
                <div className="flex gap-2">
                    <select
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg text-sm px-3 py-1 text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                    >
                        <option>All Departments</option>
                        <option>Engineering</option>
                        <option>Design</option>
                        <option>HR</option>
                        <option>Marketing</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmployees.map(emp => (
                    <EmployeeCard key={emp.id} employee={emp} />
                ))}
            </div>
        </section>
    );
};

export default EmployeeGrid;
