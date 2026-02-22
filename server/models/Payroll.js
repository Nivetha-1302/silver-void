const mongoose = require('mongoose');

const PayrollSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    month: {
        type: String, // e.g., "October 2023"
        required: true
    },
    baseSalary: {
        type: Number,
        required: true
    },
    bonus: {
        type: Number,
        default: 0
    },
    deductions: {
        type: Number, // Tax, Unpaid Leave
        default: 0
    },
    netPay: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Paid'],
        default: 'Pending'
    },
    paymentDate: {
        type: Date
    },
    generatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Payroll', PayrollSchema);
