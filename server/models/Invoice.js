const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
    clientName: {
        type: String,
        required: true
    },
    clientEmail: String,
    invoiceNumber: {
        type: String,
        unique: true,
        required: true
    },
    items: [{
        description: String,
        quantity: Number,
        rate: Number,
        amount: Number
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    status: {
        type: String,
        enum: ['Draft', 'Sent', 'Paid', 'Overdue'],
        default: 'Draft'
    },
    issueDate: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date,
        required: true
    }
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
