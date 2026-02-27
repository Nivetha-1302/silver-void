const router = require('express').Router();
const User = require('../models/User');
const Task = require('../models/Task');

// --- AI Helper ---
const generatePerformanceInsight = (user) => {
    const focus = user.metrics?.focusScore || 0;
    const mood = user.metrics?.mood || 'Neutral';
    const risk = user.retentionRisk?.score || 0;

    let insight = "Performance is stable.";

    // Weighted Performance Score Formula
    // Normalize Mood: Happy/Neutral/Bad -> 100/50/0
    const moodScore = mood === 'Happy' ? 100 : (mood === 'Stressed' ? 0 : 50);
    // Task Completion (Simulated here as we don't have task access in this helper scope) using a default or passed value if available
    const taskRate = 80; // Default assumption for insight text if actual data missing

    const performanceScore = (focus * 0.5) + (taskRate * 0.3) + (moodScore * 0.2);

    if (performanceScore > 85) {
        insight = `🌟 Star Performer (Score: ${Math.round(performanceScore)}): Exceptional focus and mood.`;
    } else if (focus > 80 && mood === 'Stressed') {
        insight = "⚡ High Performer Risk: Employee is highly focused but stressed. Suggest a break.";
    } else if (focus < 40 && risk > 50) {
        insight = "⚠️ Disengagement Alert: Low focus and high flight risk detected.";
    } else if (performanceScore < 50) {
        insight = "📉 Needs Improvement: Overall performance score is low.";
    }

    return insight;
};

// GET All Employees
router.get('/', async (req, res) => {
    try {
        const users = await User.find({ role: 'employee' });

        // Fetch all tasks relative to these users to avoid N+1 queries
        // or just iterate (for small scale it's fine)
        const employeesWithStats = await Promise.all(users.map(async (u) => {
            const tasks = await Task.find({ assignee: u._id });
            const completed = tasks.filter(t => t.status === 'Done').length;
            const pending = tasks.filter(t => t.status !== 'Done').length;

            return {
                ...u.toObject(),
                taskStats: {
                    total: tasks.length,
                    completed,
                    pending,
                    completionRate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0
                },
                aiInsight: generatePerformanceInsight(u)
            };
        }));

        res.json(employeesWithStats);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET Gamification Leaderboard
router.get('/gamification/leaderboard', async (req, res) => {
    try {
        const users = await User.find({ role: 'employee' });

        const leaderboardData = await Promise.all(users.map(async (u) => {
            const tasks = await Task.find({ assignee: u._id });
            const completed = tasks.filter(t => t.status === 'Done').length;

            const focus = u.metrics?.focusScore || 50;
            const mood = u.metrics?.mood || 'Neutral';

            // RPG Gamification Algorithm
            let xp = 0;

            // Base XP from Focus Score (0 - 1000)
            xp += Math.round(focus * 10);

            // 50 XP per completed task
            xp += (completed * 50);

            // Mood Multiplier Bonus
            if (mood === 'Happy') xp += 200;
            else if (mood === 'Focused') xp += 300;
            else if (mood === 'Energetic') xp += 250;

            // Determine Level (1 level per 500 XP)
            const level = Math.max(1, Math.floor(xp / 500) + 1);

            // Determine Badges
            const badges = [];
            if (focus > 90) badges.push({ name: 'Laser Focus', icon: '🎯', color: 'bg-emerald-100 text-emerald-600' });
            if (completed > 5) badges.push({ name: 'Task Master', icon: '⚔️', color: 'bg-amber-100 text-amber-600' });
            if (mood === 'Happy') badges.push({ name: 'Positive Aura', icon: '✨', color: 'bg-indigo-100 text-indigo-600' });
            if (xp > 5000) badges.push({ name: 'Elite Guardian', icon: '🛡️', color: 'bg-slate-800 text-yellow-400' });

            return {
                id: u._id,
                name: u.fullName,
                department: u.department,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}&backgroundColor=c0aede,b6e3f4,ffdfbf`,
                focusScore: focus,
                tasksCompleted: completed,
                xp: xp,
                level: level,
                badges: badges
            };
        }));

        // Sort Highest XP downwards
        leaderboardData.sort((a, b) => b.xp - a.xp);

        // Add Ranks
        leaderboardData.forEach((user, index) => {
            user.rank = index + 1;
        });

        res.json(leaderboardData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST Create Employee (Admin only really)
router.post('/', async (req, res) => {
    try {
        const { fullName, email, role, department, password } = req.body;
        // In a real app, we'd handle faceDescriptor here or let them register it themselves later
        const newUser = new User({
            fullName,
            email,
            password, // Allow initial password setup
            role: role || 'employee',
            department: department || 'Engineering',
            employeeId: `EMP-${Date.now().toString().slice(-4)}`,
            // Default metrics
        });
        await newUser.save();
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT Update Employee
router.put('/:id', async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE Employee
router.delete('/:id', async (req, res) => {
    try {
        const result = await User.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ message: "User not found" });
        res.json({ message: "Employee deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
