const express = require('express');
const router = express.Router();
const Payroll = require('../models/Payroll');
const Invoice = require('../models/Invoice');
const User = require('../models/User');

// --- PAYROLL ROUTES ---

// Get Payroll History
router.get('/payroll', async (req, res) => {
    try {
        const payrolls = await Payroll.find().populate('user', 'fullName email role').sort({ generatedAt: -1 });
        res.json(payrolls);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Generate Payroll for a Month
router.post('/payroll/generate', async (req, res) => {
    const { month } = req.body;
    try {
        const users = await User.find({ status: { $ne: 'Terminated' } });
        const payrolls = [];

        for (const user of users) {
            // Mock Logic for Calculation (Hours * Rate)
            // In real app, fetch Attendance Logs for 'month'
            const baseSalary = user.baseSalary || 5000;
            const bonus = Math.floor(Math.random() * 500); // Mock bonus

            // Tax Calculation (Simplified Progressive)
            const gross = baseSalary + bonus;
            let tax = 0;
            if (gross > 50000) tax = gross * 0.20;
            else tax = gross * 0.10;

            const deductions = Math.round(tax);
            const netPay = gross - deductions;

            const payroll = new Payroll({
                user: user._id,
                month,
                baseSalary,
                bonus,
                deductions,
                netPay,
                status: 'Pending'
            });
            await payroll.save();
            payrolls.push(payroll);
        }

        res.json({ message: `Generated Payroll for ${users.length} employees`, data: payrolls });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Status (e.g., Mark as Paid)
router.patch('/payroll/:id', async (req, res) => {
    try {
        const payroll = await Payroll.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(payroll);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// --- INVOICE ROUTES ---

// Get Invoices
router.get('/invoices', async (req, res) => {
    try {
        const invoices = await Invoice.find().sort({ issueDate: -1 });
        res.json(invoices);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create Invoice
router.post('/invoices', async (req, res) => {
    const { clientName, invoiceNumber, items, dueDate } = req.body;
    try {
        const totalAmount = items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);

        const invoice = new Invoice({
            clientName,
            invoiceNumber,
            items,
            totalAmount,
            dueDate
        });
        await invoice.save();
        res.status(201).json(invoice);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
