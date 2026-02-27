const router = require('express').Router();
const Task = require('../models/Task');
const User = require('../models/User');

// --- AI Algorithm: Smart Delegate System ---
// Goal: Find the best employee for a task based on Skills (60%) and Current Load (40%)
// Goal: Find the best employee for a task based on Skills, Focus, and Load
const findBestAssignee = async (requiredSkills) => {
    try {
        const employees = await User.find({ role: 'employee' });
        let bestMatch = null;
        let highestScore = -1;

        for (const emp of employees) {
            // 1. Skill Match Score (0-100)
            let skillMatch = 0;
            if (requiredSkills && requiredSkills.length > 0) {
                // If user has skills defined (not yet in UI, so we simulate based on role/mock)
                // For now, let's assume everyone has basic skills, but boost if role matches
                const hasSkill = emp.skills?.some(s => requiredSkills.includes(s.name)) || false;
                if (hasSkill) skillMatch += 50;

                // Demo Heuristic: If 'React' is required and role is 'Developer', boost
                if (emp.role === 'employee') skillMatch += 30;
            } else {
                skillMatch = 50; // Base score if no specific skills needed
            }

            // 2. Load Score (Inverse of current tasks)
            const currentLoad = await Task.countDocuments({ assignee: emp._id, status: 'In Progress' });
            const loadScore = Math.max(0, 100 - (currentLoad * 20)); // -20 per active task

            // 3. Focus/Productivity Boost (New Feature)
            const focusBoost = (emp.metrics?.focusScore || 0) * 0.2; // Up to 20 points bonus

            // Weighted Average
            const totalScore = (skillMatch * 0.4) + (loadScore * 0.4) + focusBoost;

            if (totalScore > highestScore) {
                highestScore = totalScore;
                bestMatch = emp;
            }
        }

        return { user: bestMatch, score: highestScore.toFixed(0) };
    } catch (err) {
        console.error("AI Delegate Error:", err);
        return null;
    }
};

// --- AI Algorithm: Task Sentiment & Stress Analyzer ---
// Scans for urgency, blockers, or aggressive wording to flag stressed/critical tasks 
const analyzeSentiment = (title, text) => {
    const combined = `${title || ''} ${text || ''}`.toLowerCase();
    let score = 0;

    // Weighted keywords
    const criticalWords = ['urgent', 'asap', 'failing', 'crash', 'critical', 'blocker', 'broken', 'breach', 'alert'];
    const stressWords = ['stuck', 'hard', 'struggling', 'behind', 'late', 'delay', 'issue', 'bug', 'error'];
    const positiveWords = ['great', 'easy', 'fix', 'completed', 'success', 'smooth', 'bonus', 'clean'];

    criticalWords.forEach(w => { if (combined.includes(w)) score -= 3; });
    stressWords.forEach(w => { if (combined.includes(w)) score -= 1; });
    positiveWords.forEach(w => { if (combined.includes(w)) score += 1.5; });

    let label = 'Neutral';
    if (score < -5) label = 'Critical';
    else if (score < -1) label = 'Stressed';
    else if (score > 2) label = 'Positive';

    return { score, label };
};

// GET All Tasks
router.get('/', async (req, res) => {
    try {
        const tasks = await Task.find().populate('assignee', 'fullName role');
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST Create Task (with AI Auto-Assign & Sentiment Detection)
router.post('/', async (req, res) => {
    try {
        const { title, description, priority, requiredSkills, autoAssign } = req.body;

        let assigneeId = req.body.assignee;
        let aiScore = 0;

        // Run Sentiment Check
        const aiSentiment = analyzeSentiment(title, description);

        if (autoAssign) {
            const result = await findBestAssignee(requiredSkills);
            if (result && result.user) {
                assigneeId = result.user._id;
                aiScore = result.score;
            }
        }

        const newTask = new Task({
            title,
            description,
            priority,
            requiredSkills,
            assignee: assigneeId,
            aiScore,
            aiSentiment
        });

        await newTask.save();
        res.status(201).json(newTask);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT Update Task Status (Drag and Drop)
router.put('/:id', async (req, res) => {
    try {
        const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedTask);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE Task
router.delete('/:id', async (req, res) => {
    try {
        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: "Task Deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
