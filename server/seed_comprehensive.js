require('dotenv').config();
const mongoose = require('mongoose');

// Import Models
const User = require('./models/User');
const Task = require('./models/Task');
const Payroll = require('./models/Payroll');
const Invoice = require('./models/Invoice');
const AttendanceLog = require('./models/AttendanceLog');
const ActivityLog = require('./models/ActivityLog');
const SecurityLog = require('./models/SecurityLog');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ems_db');
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Connection Error:', err);
        process.exit(1);
    }
};

// Helpers
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

// Data Sets
const DEPARTMENTS = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance'];
const ROLES = ['employee', 'manager', 'admin'];
const SKILLS = ['React', 'Node.js', 'Python', 'Design', 'Marketing', 'Sales', 'Accounting', 'Management'];
const PROJECT_NAMES = ['Project Alpha', 'Website Redesign', 'Mobile App', 'Q4 Marketing', 'Audit 2023', 'Client Outreach'];

const additionalUsers = [
    { fullName: 'David Scott', email: 'david@company.com', role: 'employee', department: 'Engineering' },
    { fullName: 'Eva Green', email: 'eva@company.com', role: 'admin', department: 'Design' },
    { fullName: 'Frank White', email: 'frank@company.com', role: 'employee', department: 'Sales' },
    { fullName: 'Grace Hall', email: 'grace@company.com', role: 'employee', department: 'Marketing' },
    { fullName: 'Henry Ford', email: 'henry@company.com', role: 'employee', department: 'Finance' },
    { fullName: 'Ivy Chen', email: 'ivy@company.com', role: 'employee', department: 'HR' },
    { fullName: 'Jack Ryan', email: 'jack@company.com', role: 'admin', department: 'Engineering' }
];

const seed = async () => {
    await connectDB();
    console.log("🚀 Starting Comprehensive Data Seeding...");

    // 1. Create More Users
    let allUsers = await User.find();
    console.log(`Initial User Count: ${allUsers.length}`);

    for (const u of additionalUsers) {
        const exists = await User.findOne({ email: u.email });
        if (!exists) {
            const newUser = await User.create({
                ...u,
                employeeId: `EMP-${getRandomInt(2000, 9999)}`,
                skills: [{ name: getRandomElement(SKILLS), level: getRandomInt(1, 10), xp: getRandomInt(100, 5000) }],
                metrics: { focusScore: getRandomInt(60, 95), mood: getRandomElement(['Happy', 'Neutral', 'Focused']) }
            });
            console.log(`Created User: ${newUser.fullName}`);
            allUsers.push(newUser);
        } else {
            // If user exists but isn't in our local list (e.g. from previous run), ensure they are
            if (!allUsers.find(user => user.email === u.email)) {
                allUsers.push(exists);
            }
        }
    }

    // Refresh user list
    allUsers = await User.find();
    console.log(`Total Users to Seed for: ${allUsers.length}`);

    // 2. Generate Tasks
    const taskTitles = [
        "Update Landing Page", "Fix Login Bug", "Prepare Monthly Report",
        "Client Meeting Prep", "Design System Update", "Database Migration",
        "Content Strategy", "Email Campaign", "Payroll Audit", "Security Patches"
    ];

    console.log("Seeding Tasks...");
    for (const user of allUsers) {
        // Assign 3-5 tasks per user
        for (let i = 0; i < getRandomInt(3, 5); i++) {
            await Task.create({
                title: `${getRandomElement(taskTitles)} - ${user.fullName.split(' ')[0]}`,
                description: "Automated task via seeder.",
                status: getRandomElement(['To Do', 'In Progress', 'Done']),
                priority: getRandomElement(['Low', 'Medium', 'High']),
                assignee: user._id,
                deadline: addDays(new Date(), getRandomInt(1, 14)),
                aiScore: getRandomInt(50, 99)
            });
        }
    }

    // 3. Generate Payrolls (Last Month)
    console.log("Seeding Payrolls...");
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const monthStr = lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    for (const user of allUsers) {
        // Check if payroll already exists for this month/user to prevent dups
        const existingPayroll = await Payroll.findOne({ user: user._id, month: monthStr });
        if (!existingPayroll) {
            const base = getRandomInt(4000, 12000);
            const bo = getRandomInt(0, 2000);
            const ded = Math.floor(base * 0.2);

            await Payroll.create({
                user: user._id,
                month: monthStr,
                baseSalary: base,
                bonus: bo,
                deductions: ded,
                netPay: base + bo - ded,
                status: getRandomElement(['Paid', 'Pending']),
                paymentDate: getRandomElement(['Paid']) ? new Date() : null
            });
        }
    }

    // 4. Generate Invoices
    console.log("Seeding Invoices...");
    const clients = ["TechCorp", "DesignStudio", "GlobalServices", "EduTech Inc", "HealthPlus"];
    for (let i = 0; i < 10; i++) {
        const issueDate = addDays(new Date(), -getRandomInt(0, 30));
        await Invoice.create({
            clientName: getRandomElement(clients),
            clientEmail: `billing@${getRandomElement(clients).toLowerCase().replace(' ', '')}.com`,
            invoiceNumber: `INV-2023-${getRandomInt(1000, 9999)}`,
            items: [
                { description: "Consulting Services", quantity: getRandomInt(10, 40), rate: 150, amount: 0 }, // Amount calculated in pre-save usually, but we'll set manual
            ],
            totalAmount: getRandomInt(1500, 6000),
            status: getRandomElement(['Draft', 'Sent', 'Paid', 'Overdue']),
            issueDate: issueDate,
            dueDate: addDays(issueDate, 14)
        });
    }

    // 5. Generate Logs (Attendance, Activity, Security) for last 5 days
    console.log("Seeding Logs (Attendance, Activity, Security)...");
    const today = new Date();

    for (const user of allUsers) {
        for (let i = 0; i < 5; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // A. Attendance (Check duplicate)
            const existingAtt = await AttendanceLog.findOne({ userId: user._id, date: dateStr });
            if (!existingAtt) {
                await AttendanceLog.create({
                    userId: user._id,
                    date: dateStr,
                    checkIn: new Date(date.setHours(9, 0, 0)),
                    checkOut: new Date(date.setHours(17, 30, 0)),
                    status: 'Present',
                    duration: 8.5
                });
            }

            // B. Activity Log (Assume generated if attendance exists)
            // But we'll add one just in case
            const existingAct = await ActivityLog.findOne({ userId: user._id, date: dateStr });
            if (!existingAct) {
                await ActivityLog.create({
                    userId: user._id,
                    date: dateStr,
                    activeSeconds: getRandomInt(20000, 28000),
                    idleSeconds: getRandomInt(1000, 5000),
                    totalTime: 28800,
                    timeline: [
                        { time: "09:00", status: "Active" },
                        { time: "10:00", status: "Active" },
                        { time: "11:00", status: "Idle" },
                        { time: "12:00", status: "Active" },
                        { time: "13:00", status: "Active" },
                        { time: "14:00", status: "Active" },
                        { time: "15:00", status: "Idle" },
                        { time: "16:00", status: "Active" }
                    ]
                });
            }

            // C. Security Log (Random)
            if (i % 2 === 0) { // Every other day
                await SecurityLog.create({
                    userId: user._id,
                    type: getRandomElement(['PHONE_DETECTED', 'SCREEN_SWITCH']),
                    severity: 'LOW',
                    details: 'Automated entry',
                    timestamp: new Date()
                });
            }
        }
    }

    console.log("✅ Comprehensive Data Seeding Complete!");
    process.exit();
};

seed();
