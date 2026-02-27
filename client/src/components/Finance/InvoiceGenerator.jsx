import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Send, Check, Trash2, Printer } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const InvoiceGenerator = () => {
    const [invoices, setInvoices] = useState([]);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        clientName: '',
        clientEmail: '',
        invoiceNumber: `INV-${Date.now().toString().slice(-4)}`,
        items: [{ description: 'Web Development Services', quantity: 1, rate: 50, amount: 50 }],
        dueDate: ''
    });

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const res = await axios.get('/api/finance/invoices');
            setInvoices(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        // Recalc amount
        if (field === 'quantity' || field === 'rate') {
            newItems[index].amount = newItems[index].quantity * newItems[index].rate;
        }
        setFormData({ ...formData, items: newItems });
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { description: '', quantity: 1, rate: 0, amount: 0 }]
        });
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const calculateTotal = () => {
        return formData.items.reduce((acc, item) => acc + item.amount, 0);
    };

    const createInvoice = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/finance/invoices', formData);
            toast.success("Invoice Created!");
            setShowForm(false);
            fetchInvoices();
        } catch (err) {
            toast.error("Failed to create Invoice");
        }
    };

    const generatePDF = (inv) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(59, 130, 246); // Blue
        doc.text('SmartTrack.ai', 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text('123 AI Parkway, Tech District', 14, 26);
        doc.text('Silicon Valley, CA 94000', 14, 30);

        doc.setFontSize(30);
        doc.setTextColor(50);
        doc.text('INVOICE', 140, 25);

        // Meta Info
        doc.setFontSize(10);
        doc.text(`Invoice Number: ${inv.invoiceNumber}`, 140, 35);
        doc.text(`Date Issued: ${new Date(inv.dateIssued).toLocaleDateString()}`, 140, 40);
        doc.text(`Due Date: ${new Date(inv.dueDate).toLocaleDateString()}`, 140, 45);

        // Billed To
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text('Billed To:', 14, 45);
        doc.setFontSize(14);
        doc.setTextColor(20);
        doc.text(inv.clientName, 14, 52);
        if (inv.clientEmail) {
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(inv.clientEmail, 14, 57);
        }

        // Table
        const tableColumn = ["Description", "Quantity", "Rate ($)", "Amount ($)"];
        const tableRows = [];

        inv.items.forEach(item => {
            const rowData = [
                item.description,
                item.quantity,
                item.rate.toFixed(2),
                item.amount.toFixed(2)
            ];
            tableRows.push(rowData);
        });

        doc.autoTable({
            startY: 70,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
            margin: { top: 10 }
        });

        // Totals
        const finalY = doc.lastAutoTable.finalY || 70;
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text('Total Amount Due:', 140, finalY + 15);
        doc.setFontSize(16);
        doc.setTextColor(20);
        doc.text(`$${inv.totalAmount.toLocaleString()}`, 175, finalY + 15);

        // Footer
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text('Thank you for your business!', 105, 280, null, null, 'center');

        doc.save(`${inv.invoiceNumber}_${inv.clientName.replace(/\s+/g, '_')}.pdf`);
        toast.success(`Downloading Print for ${inv.invoiceNumber}`);
    };

    return (
        <motion.div
            className="p-8 space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
                        Invoicing
                    </h1>
                    <p className="text-gray-500">Client Billing & Receivables</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition w-fit font-bold"
                >
                    {showForm ? 'Cancel' : <><Plus className="w-5 h-5" /> New Invoice</>}
                </button>
            </div>

            {showForm && (
                <motion.form
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="glass p-8 rounded-2xl shadow-xl border-t-4 border-blue-500"
                    onSubmit={createInvoice}
                >
                    <h3 className="text-xl font-bold mb-6 text-gray-800">Draft New Invoice</h3>

                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Client Name</label>
                            <input
                                type="text"
                                required
                                className="w-full p-3 rounded-lg bg-white border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.clientName}
                                onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Invoice #</label>
                            <input
                                type="text"
                                required
                                className="w-full p-3 rounded-lg bg-gray-50 border border-gray-200 font-mono"
                                value={formData.invoiceNumber}
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Due Date</label>
                            <input
                                type="date"
                                required
                                className="w-full p-3 rounded-lg bg-white border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.dueDate}
                                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Line Items</label>
                        <div className="space-y-2">
                            {formData.items.map((item, idx) => (
                                <div key={idx} className="flex gap-4 items-center">
                                    <input
                                        type="text"
                                        placeholder="Description"
                                        className="flex-[3] p-3 rounded-lg bg-white border border-gray-200"
                                        value={item.description}
                                        onChange={e => handleItemChange(idx, 'description', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        className="flex-1 p-3 rounded-lg bg-white border border-gray-200"
                                        value={item.quantity}
                                        onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Rate"
                                        className="flex-1 p-3 rounded-lg bg-white border border-gray-200"
                                        value={item.rate}
                                        onChange={e => handleItemChange(idx, 'rate', Number(e.target.value))}
                                    />
                                    <div className="flex-1 font-bold text-right text-gray-700">
                                        ${item.amount}
                                    </div>
                                    <button type="button" onClick={() => removeItem(idx)} className="p-2 text-red-400 hover:text-red-600">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addItem} className="mt-2 text-sm text-blue-500 font-bold hover:underline flex items-center gap-1">
                            <Plus className="w-4 h-4" /> Add Line Item
                        </button>
                    </div>

                    <div className="flex justify-end items-center gap-8 pt-6 border-t border-gray-100">
                        <div className="text-right">
                            <span className="block text-xs text-gray-500 font-bold uppercase">Total Amount</span>
                            <span className="block text-3xl font-black text-gray-900">${calculateTotal().toLocaleString()}</span>
                        </div>
                        <button type="submit" className="px-8 py-4 bg-blue-600 text-white rounded-xl shadow-lg hover:shadow-blue-500/30 font-bold text-lg flex items-center gap-2">
                            <Check className="w-6 h-6" /> Create Invoice
                        </button>
                    </div>

                </motion.form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {invoices.map((inv) => (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        key={inv._id}
                        className="glass p-6 rounded-2xl border border-white/50 hover:border-blue-300 transition-colors shadow-sm relative group"
                    >
                        <div className="absolute top-4 right-4">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">{inv.status}</span>
                        </div>
                        <FileText className="w-10 h-10 text-gray-300 mb-4 group-hover:text-blue-500 transition-colors" />
                        <h3 className="font-bold text-lg text-gray-800">{inv.clientName}</h3>
                        <p className="text-gray-500 text-sm font-mono mb-4">{inv.invoiceNumber}</p>

                        <div className="flex justify-between items-end border-t border-gray-100 pt-4">
                            <div>
                                <span className="text-xs text-gray-400 block uppercase">Total</span>
                                <span className="font-black text-xl text-gray-900">${inv.totalAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600" title="Print" onClick={() => generatePDF(inv)}><Printer className="w-4 h-4" /></button>
                                <button className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30" title="Send"><Send className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

        </motion.div>
    );
};

export default InvoiceGenerator;
