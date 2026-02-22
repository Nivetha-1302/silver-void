const mongoose = require('mongoose');
require('dotenv').config();
const Task = require('./models/Task');
const User = require('./models/User');

const seedTasks = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ems_db');
        console.log('MongoDB Connected');

        const count = await Task.countDocuments();
        console.log(`Current Task Count: ${count}`);

        if (count === 0) {
            console.log('Seeding Tasks...');
            const employees = await User.find({ role: 'employee' });
            if (employees.length === 0) {
                console.log('No employees found to assign tasks to.');
                process.exit();
            }

            const tasks = [
                {
                    title: "Implement Dark Mode",
                    description: "Add dark mode support to the entire application using Tailwind CSS.",
                    status: "In Progress",
                    priority: "High",
                    assignee: employees[0]._id,
                    requiredSkills: ["React", "CSS"],
                    aiScore: 95
                },
                {
                    title: "Optimize Database Queries",
                    description: "Index the users collection for faster search performance.",
                    status: "To Do",
                    priority: "High",
                    assignee: employees[0]._id,
                    requiredSkills: ["MongoDB", "Backend"],
                    aiScore: 88
                },
                {
                    title: "Design Marketing Banner",
                    description: "Create a new banner for the upcoming product launch.",
                    status: "To Do",
                    priority: "Medium",
                    assignee: employees[1] ? employees[1]._id : employees[0]._id,
                    requiredSkills: ["Design", "Figma"],
                    aiScore: 72
                }
            ];

            await Task.insertMany(tasks);
            console.log('Tasks Seeded Successfully!');
        } else {
            console.log('Tasks already exist. Skipping seed.');
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedTasks();
