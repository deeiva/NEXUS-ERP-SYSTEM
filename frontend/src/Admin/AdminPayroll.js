import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';

const AdminPayroll = () => {
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMessage, setActionMessage] = useState('');

    const [usersMap, setUsersMap] = useState({});
    const [usersList, setUsersList] = useState([]);
    const [selectedPayroll, setSelectedPayroll] = useState(null);
    const [generateModal, setGenerateModal] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [formData, setFormData] = useState({ employee: '', month: '', year: new Date().getFullYear() });
    const [editingPayroll, setEditingPayroll] = useState(null);
    const [deletingPid, setDeletingPid] = useState(null);

    const role = localStorage.getItem('role') || 'EMPLOYEE';

    // Theme based on role (Admin = Blue, HR = Emerald)
    const themeColor = role === 'HR' ? 'emerald' : 'blue';
    const textThemeMap = { 'blue': 'text-blue-600', 'emerald': 'text-emerald-600' };

    useEffect(() => {
        fetchPayroll();
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/accounts/users/admin/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const map = {};
            const list = Array.isArray(res.data) ? res.data :
                (res.data && Array.isArray(res.data.results)) ? res.data.results : [];
            list.forEach(u => {
                const derivedRole = u.is_superuser ? 'ADMIN' : (u.status === 0 ? 'HR' : (u.status === 1 ? 'EMPLOYEE' : u.role));
                map[u.username] = derivedRole || 'EMP';
                map[u.id] = derivedRole || 'EMP';
                u.derivedRole = derivedRole || 'EMP';
            });
            setUsersMap(map);
            setUsersList(list);
        } catch (err) {
            console.error('Failed to fetch users map', err);
        }
    };

    const fetchPayroll = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            const res = await axios.get(`${API_BASE_URL}/api/payroll/`, { headers });
            setPayrolls(res.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch payroll data.');
        } finally {
            setLoading(false);
        }
    };

    const handlePay = async (payroll) => {
        if (!window.confirm(`Are you sure you want to process payment for ${payroll.employee_name || 'this employee'}?`)) return;

        const idToUse = payroll.id || payroll.payroll_id || payroll.pk || payroll.uid || payroll._id || payroll.employee;

        if (!idToUse) {
            setError(`Error: Cannot process payment. No identifier found!`);
            setTimeout(() => setError(""), 5000);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            await axios.post(`${API_BASE_URL}/api/payroll/${idToUse}/pay/`, {
                month: payroll.month,
                year: payroll.year
            }, { headers });
            setActionMessage(`Payment processed successfully for ${payroll.employee_name || 'the employee'}!`);
            setTimeout(() => setActionMessage(""), 5000);
            fetchPayroll();
        } catch (err) {
            const errMsg = err.response?.data?.error || err.response?.data?.message || err.response?.data?.detail || 'Failed to process payment.';
            setError(errMsg);
            setTimeout(() => setError(""), 5000);
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        setGenerating(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' };

            const form = new FormData();
            form.append('employee', formData.employee);
            form.append('month', formData.month);
            form.append('year', formData.year);
            form.append('pay', 'UNPAID');

            await axios.post(`${API_BASE_URL}/api/payroll/generate/`, form, { headers });
            setActionMessage(`Payroll generated successfully for ${formData.employee} (${formData.month} ${formData.year})!`);
            setTimeout(() => setActionMessage(""), 5000);
            setGenerateModal(false);
            fetchPayroll();
        } catch (err) {
            const errMsg = err.response?.data?.error || err.response?.data?.message || err.response?.data?.detail || 'Failed to generate payroll. Check if salary structure is defined for this employee.';
            setError(errMsg);
            setTimeout(() => setError(""), 5000);
        } finally {
            setGenerating(false);
        }
    };

    const handleDeletePayroll = async (id) => {
        if (!window.confirm("Are you sure you want to delete this payroll record?")) return;
        setDeletingPid(id);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            await axios.delete(`${API_BASE_URL}/api/payroll/${id}/`, { headers });
            setActionMessage("Payroll record deleted successfully.");
            setTimeout(() => setActionMessage(""), 5000);
            fetchPayroll();
        } catch (err) {
            const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to delete payroll record.';
            setError(errMsg);
            setTimeout(() => setError(""), 5000);
        } finally {
            setDeletingPid(null);
        }
    };

    const handleUpdatePayStatus = async (payrollId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            await axios.patch(`${API_BASE_URL}/api/payroll/${payrollId}/`, { pay: newStatus }, { headers });
            setActionMessage(`Payroll status updated to ${newStatus}.`);
            setTimeout(() => setActionMessage(""), 5000);
            setEditingPayroll(null);
            fetchPayroll();
        } catch (err) {
            const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to update payroll status.';
            setError(errMsg);
            setTimeout(() => setError(""), 5000);
        }
    };

    const displayPayrolls = payrolls.filter(payroll => {
        if (role === 'HR') {
            const payrollRole = (payroll.role || usersMap[payroll.employee_name] || usersMap[payroll.employee] || 'EMP').toUpperCase();
            return payrollRole !== 'HR' && payrollRole !== 'ADMIN';
        }
        return true;
    });

    return (
        <div className="animate-fadeIn max-w-7xl mx-auto pb-12">

            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative mb-8">
                <div className={`h-2 w-full bg-gradient-to-r from-${themeColor}-400 to-${themeColor}-600`}></div>

                <div className="p-8 md:p-10 border-b border-gray-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                            <span className={`p-2 bg-${themeColor}-100 ${textThemeMap[themeColor]} rounded-xl shadow-inner`}>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </span>
                            Payroll Management
                        </h1>
                        <p className="mt-2 text-slate-500 font-medium ml-12">Generate payslips, process payments, and manage financial records.</p>
                    </div>

                    <div className="flex gap-4 items-center">
                        {(role === 'ADMIN' || role === 'HR') && (
                            <button
                                onClick={() => setGenerateModal(true)}
                                className={`px-6 py-3 bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white rounded-xl font-bold shadow-lg shadow-${themeColor}-200 transition-all flex items-center gap-2 active:scale-95`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                Generate Payroll
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-8 md:p-10">
                    {actionMessage && (
                        <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 flex items-start gap-4 animate-fadeIn">
                            <svg className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <div>
                                <h4 className="font-bold text-emerald-800">Success</h4>
                                <p className="text-sm mt-1">{actionMessage}</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-start gap-4 animate-shake">
                            <svg className="w-6 h-6 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <div>
                                <h4 className="font-bold text-red-800">Alert</h4>
                                <p className="text-sm mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm relative">
                        <div className="overflow-x-auto pb-2 custom-scrollbar">
                            <table className="w-full whitespace-nowrap text-left border-collapse">
                                <thead className="bg-slate-50 border-b-2 border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest sticky left-0 bg-slate-50/95 backdrop-blur z-20 shadow-[1px_0_0_0_#e2e8f0]">Employee</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Period</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Basic</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Net Salary</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-bold bg-slate-50 italic">Loading personnel payroll data...</td></tr>
                                    ) : displayPayrolls.length === 0 ? (
                                        <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-bold bg-slate-50 italic">No payroll records have been generated yet.</td></tr>
                                    ) : (
                                        displayPayrolls.map((p, idx) => {
                                            const pRole = (p.role || usersMap[p.employee_name] || usersMap[p.employee] || 'EMP').toUpperCase();
                                            return (
                                                <tr key={idx} className={`transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-slate-50 group`}>
                                                    <td className="px-6 py-5 sticky left-0 bg-inherit backdrop-blur z-10 shadow-[1px_0_0_0_#f8fafc]">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shadow-inner uppercase ${pRole === 'HR' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                                {(p.employee_name || p.employee || 'N').charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-extrabold text-sm text-slate-800">{p.employee_name || p.employee || 'N/A'}</div>
                                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border mt-1 inline-block ${pRole === 'HR' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                                    {pRole}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-center font-bold text-sm text-slate-600">
                                                        <div className="bg-slate-100 px-3 py-1.5 rounded-lg inline-block text-xs uppercase tracking-wider">{p.month.substring(0, 3)} {p.year}</div>
                                                    </td>
                                                    <td className="px-6 py-5 text-right text-sm text-slate-500 font-medium">
                                                        ₹{parseFloat(p.basic_salary).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-6 py-5 text-right text-sm font-black text-slate-800">
                                                        ₹{parseFloat(p.total_salary).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <div className="flex flex-col items-center gap-2">
                                                            {p.pay === 'PAID' ? (
                                                                <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-200">Paid</span>
                                                            ) : p.pay === 'PENDING' ? (
                                                                <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-200">Pending</span>
                                                            ) : (
                                                                <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-red-200">Unpaid</span>
                                                            )}

                                                            {role === 'ADMIN' && p.pay !== 'PAID' && (
                                                                <button
                                                                    onClick={() => setEditingPayroll(p)}
                                                                    className={`text-[9px] ${textThemeMap[themeColor]} font-black uppercase tracking-widest hover:underline opacity-0 group-hover:opacity-100 transition-opacity`}
                                                                >
                                                                    Change
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => setSelectedPayroll(p)}
                                                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm transition-all font-bold text-xs uppercase tracking-wider active:scale-95"
                                                            >
                                                                View
                                                            </button>

                                                            {role === 'ADMIN' && p.pay !== 'PAID' && (
                                                                <button
                                                                    onClick={() => handlePay(p)}
                                                                    className="bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-200 hover:border-indigo-600 px-3 py-1.5 rounded-lg shadow-sm transition-all text-xs font-bold uppercase tracking-wider active:scale-95 flex items-center gap-1"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                                                                    Pay
                                                                </button>
                                                            )}

                                                            {role === 'ADMIN' && (
                                                                <button
                                                                    onClick={() => handleDeletePayroll(p.id)}
                                                                    disabled={deletingPid === p.id}
                                                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 disabled:opacity-50"
                                                                    title="Delete Record"
                                                                >
                                                                    {deletingPid === p.id ? (
                                                                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                                                    ) : (
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* View Payroll Modal */}
            {selectedPayroll && createPortal(
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fadeIn">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
                        <div className={`p-8 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-start relative overflow-hidden`}>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100 rounded-full blur-3xl opacity-50 -mt-20 -mr-20 pointer-events-none"></div>

                            <div className="relative z-10 flex gap-4 items-center">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-200">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Official Salary Slip</h3>
                                    <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1 flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${selectedPayroll.pay === 'PAID' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                        {selectedPayroll.employee_name || selectedPayroll.employee || 'N/A'} • {selectedPayroll.month} {selectedPayroll.year}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedPayroll(null)}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors shadow-sm relative z-10"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto w-full custom-scrollbar bg-slate-50/30">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                                    <div>
                                        <div className="text-xs uppercase tracking-widest text-slate-400 font-black mb-1">Total Days</div>
                                        <div className="text-2xl font-extrabold text-slate-800">{selectedPayroll.total_days || 0}</div>
                                    </div>
                                </div>
                                <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg></div>
                                    <div>
                                        <div className="text-xs uppercase tracking-widest text-slate-400 font-black mb-1">Present Days</div>
                                        <div className="text-2xl font-extrabold text-slate-800">{selectedPayroll.present_days || 0}</div>
                                    </div>
                                </div>
                                <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></div>
                                    <div>
                                        <div className="text-xs uppercase tracking-widest text-slate-400 font-black mb-1">LOP Days</div>
                                        <div className="text-2xl font-extrabold text-slate-800">{selectedPayroll.lop_days || 0}</div>
                                    </div>
                                </div>
                                <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                                    <div>
                                        <div className="text-xs uppercase tracking-widest text-slate-400 font-black mb-1">Casual Leaves</div>
                                        <div className="text-2xl font-extrabold text-slate-800">{selectedPayroll.casual_days || 0}</div>
                                    </div>
                                </div>

                                <div className="col-span-2 border border-slate-200 rounded-3xl bg-white shadow-sm p-8 mt-4 flex flex-col md:flex-row gap-8">
                                    <div className="flex-1 space-y-4 pr-0 md:pr-8 md:border-r border-slate-100">
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <span className="w-6 h-px bg-slate-300"></span> Breakdown
                                        </h4>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Daily Rate</span>
                                            <span className="font-bold text-slate-800">₹{parseFloat(selectedPayroll.salary_per_day || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-t border-slate-50 border-dashed">
                                            <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Basic Pay</span>
                                            <span className="font-bold text-slate-800">₹{parseFloat(selectedPayroll.basic_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-t border-slate-50 border-dashed">
                                            <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Allowances</span>
                                            <span className="font-bold text-emerald-600">+ ₹{parseFloat(selectedPayroll.allowances || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-t border-slate-50 border-dashed">
                                            <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Deductions</span>
                                            <span className="font-bold text-red-600">- ₹{parseFloat(selectedPayroll.deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col justify-center items-center relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl -mt-10 -mr-10"></div>

                                        <div className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-3">Final Net Salary</div>
                                        <div className="text-5xl font-black tracking-tight mb-6">₹{parseFloat(selectedPayroll.total_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        <div className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-full border ${selectedPayroll.pay === 'PAID' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                                            Status: {selectedPayroll.pay}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>, document.body
            )}

            {/* Generate Payroll Modal */}
            {generateModal && createPortal(
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg p-6 md:p-10 shadow-2xl relative border border-white/20 max-h-[95vh] overflow-y-auto custom-scrollbar">
                        <button
                            onClick={() => setGenerateModal(false)}
                            className="absolute top-6 right-6 w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>

                        <h3 className="text-2xl font-extrabold text-slate-800 mb-8 flex items-center gap-3">
                            <span className={`w-12 h-12 rounded-2xl bg-${themeColor}-100 text-${themeColor}-600 flex items-center justify-center shadow-inner`}>
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            </span>
                            Generate Payslip
                        </h3>

                        <form onSubmit={handleGenerate} className="space-y-6">
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Select Employee</label>
                                <div className="relative">
                                    <select
                                        className={`w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-${themeColor}-500/20 focus:border-${themeColor}-500 transition-all outline-none appearance-none cursor-pointer font-bold text-slate-700 shadow-sm`}
                                        value={formData.employee}
                                        onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                                        required
                                    >
                                        <option value="" disabled>-- Select an Employee --</option>
                                        {usersList.filter(u => role === 'ADMIN' || u.derivedRole !== 'HR').map(u => (
                                            <option key={u.id} value={u.username}>{u.name || u.username} ({u.derivedRole || 'EMP'})</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Month</label>
                                    <div className="relative">
                                        <select
                                            className={`w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-${themeColor}-500/20 focus:border-${themeColor}-500 transition-all outline-none appearance-none cursor-pointer font-bold text-slate-700 shadow-sm`}
                                            value={formData.month}
                                            onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                                            required
                                        >
                                            <option value="" disabled>-- Month --</option>
                                            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Year</label>
                                    <input
                                        type="number"
                                        className={`w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-${themeColor}-500/20 focus:border-${themeColor}-500 transition-all outline-none font-bold text-slate-700 shadow-sm`}
                                        value={formData.year}
                                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                        required
                                        min="2020"
                                        max="2030"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 flex gap-4">
                                <button type="button" onClick={() => setGenerateModal(false)} className="flex-1 py-4 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl transition-all active:scale-95 text-center shadow-sm">Cancel</button>
                                <button type="submit" disabled={generating} className={`flex-1 py-4 bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white font-bold rounded-2xl shadow-lg shadow-${themeColor}-200 transition-all active:scale-95 text-center disabled:opacity-50 flex justify-center items-center gap-2`}>
                                    {generating ? (
                                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Processing...</>
                                    ) : (
                                        'Run Calculator'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>, document.body
            )}

            {/* Change Status Modal */}
            {editingPayroll && createPortal(
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-[2rem] w-full max-w-xs p-8 shadow-2xl relative border border-white/20">
                        <h3 className="text-xl font-extrabold text-slate-800 mb-2">Update Pay Status</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">Record ID: {editingPayroll.id}</p>

                        <div className="space-y-3">
                            {['UNPAID', 'PENDING', 'PAID'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => handleUpdatePayStatus(editingPayroll.id, status)}
                                    className={`w-full py-4 rounded-xl font-bold text-sm transition-all duration-200 uppercase tracking-widest active:scale-95 ${editingPayroll.pay === status
                                        ? `bg-${themeColor}-600 text-white shadow-lg shadow-${themeColor}-200`
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                            <button
                                onClick={() => setEditingPayroll(null)}
                                className="w-full py-4 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-xl text-sm mt-4 hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>, document.body
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { height: 10px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-radius: 8px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}} />
        </div>
    );
};

export default AdminPayroll;
