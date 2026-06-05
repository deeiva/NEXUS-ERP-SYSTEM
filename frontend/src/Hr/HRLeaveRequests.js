import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';

const HRLeaveRequests = () => {
    const username = localStorage.getItem('username');

    const [leaves, setLeaves] = useState([]);
    const [usersMap, setUsersMap] = useState({});
    const [realUsername, setRealUsername] = useState(username || '');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMessage, setActionMessage] = useState('');
    const [actionModal, setActionModal] = useState({ isOpen: false, id: null, status: '', message: '' });

    const [applyForm, setApplyForm] = useState({
        employee_id: username || '',
        start_date: '',
        end_date: '',
        reason: '',
        leave_type: 'CASUAL'
    });
    const [applying, setApplying] = useState(false);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [meRes, leavesRes, usersRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/accounts/me/`, { headers }).catch(() => ({ data: null })),
                axios.get(`${API_BASE_URL}/api/leave/`, { headers }).catch(() => { throw new Error('leaves') }),
                axios.get(`${API_BASE_URL}/api/accounts/users/admin/`, { headers }).catch(() => ({ data: [] }))
            ]);

            let mappedRealUsername = username;
            if (meRes.data && meRes.data.username) {
                mappedRealUsername = meRes.data.username;
                setRealUsername(mappedRealUsername);
                setApplyForm(prev => ({ ...prev, employee_id: mappedRealUsername }));
            }

            const map = {};
            const fetchedUsers = Array.isArray(usersRes.data) ? usersRes.data :
                (usersRes.data && Array.isArray(usersRes.data.results)) ? usersRes.data.results : [];

            fetchedUsers.forEach(u => {
                const derivedRole = u.is_superuser ? 'ADMIN' : (u.status === 0 ? 'HR' : (u.status === 1 ? 'EMPLOYEE' : u.role));
                const userData = { role: derivedRole, name: u.name || u.username, id: u.id, backendUsername: u.username };
                map[u.username] = userData;
                if (u.email) map[u.email] = userData;
                if (u.id) map[u.id] = userData;
            });

            if (meRes.data) {
                map[mappedRealUsername] = {
                    role: meRes.data.role,
                    name: meRes.data.name || meRes.data.username,
                    id: meRes.data.id,
                    backendUsername: meRes.data.username
                };
            }
            setUsersMap(map);

            const fetchedLeaves = Array.isArray(leavesRes.data) ? leavesRes.data :
                (leavesRes.data && Array.isArray(leavesRes.data.results)) ? leavesRes.data.results : [];
            setLeaves(fetchedLeaves);
            setError('');
        } catch (err) {
            setError('Failed to fetch leave requests.');
        } finally {
            setLoading(false);
        }
    };

    const openActionModal = (id, status) => {
        setActionModal({ isOpen: true, id, status, message: '' });
    };

    const handleDeleteLeave = async (id) => {
        if (!window.confirm("Are you sure you want to delete this leave request? This cannot be undone.")) return;
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            await axios.delete(`${API_BASE_URL}/api/leave/${id}/`, { headers });
            setActionMessage("Leave request deleted successfully.");
            setTimeout(() => setActionMessage(""), 5000);
            fetchData();
        } catch (err) {
            setError('Failed to delete leave request.');
            setTimeout(() => setError(""), 5000);
            console.error(err);
        }
    };

    const handleActionSubmit = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            await axios.patch(`${API_BASE_URL}/api/leave/${actionModal.id}/approve/`, { status: actionModal.status }, { headers });
            setActionMessage(`Leave ${actionModal.status.toLowerCase()} successfully.`);
            setTimeout(() => setActionMessage(""), 5000);
            setActionModal({ isOpen: false, id: null, status: '', message: '' });
            fetchData();
        } catch (err) {
            const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to update leave status.';
            setError(`Error: ${errMsg}`);
            setTimeout(() => setError(""), 5000);
        }
    };

    const handleApplyChange = (e) => {
        setApplyForm({
            ...applyForm,
            [e.target.name]: e.target.value
        });
    };

    const handleApplySubmit = async (e) => {
        e.preventDefault();

        // Validations
        if (new Date(applyForm.start_date) > new Date(applyForm.end_date)) {
            setError("End Date cannot be earlier than Start Date.");
            setTimeout(() => setError(""), 5000);
            return;
        }

        const trimmedReason = applyForm.reason.trim();
        if (trimmedReason.length < 10) {
            setError("Please provide a more detailed reason (minimum 10 characters).");
            setTimeout(() => setError(""), 5000);
            return;
        }

        setApplying(true);
        setActionMessage('');
        setError('');
        try {
            const token = localStorage.getItem('token');
            const data = new FormData();

            const cleanForm = { ...applyForm, reason: trimmedReason };
            Object.keys(cleanForm).forEach(key => {
                data.append(key, cleanForm[key]);
            });

            await axios.post(`${API_BASE_URL}/api/leave/`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setActionMessage('Leave application submitted successfully.');
            setTimeout(() => setActionMessage(""), 5000);
            setApplyForm({ ...applyForm, start_date: '', end_date: '', reason: '', leave_type: 'CASUAL' });
            fetchData();
        } catch (err) {
            const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to submit leave application.';
            setError(`Error: ${errMsg}`);
            setTimeout(() => setError(""), 5000);
        } finally {
            setApplying(false);
        }
    };

    const empLeaves = leaves.filter(l => {
        const role = l.role || usersMap[l.user]?.role || usersMap[l.userid?.username || l.userid]?.role;
        return role === 'EMPLOYEE';
    });

    const myLeaves = leaves.filter(l => {
        const currentUserId = String(usersMap[username]?.id || usersMap[realUsername]?.id);
        const leaveUserId = String(l.user);
        const leaveUsername = String(l.username || (l.userid && typeof l.userid === 'object' ? l.userid.username : l.userid));
        const leaveEmpId = String(l.employee_id);

        return leaveUserId === currentUserId ||
            leaveUsername === username ||
            leaveUsername === realUsername ||
            leaveEmpId === username ||
            leaveEmpId === realUsername;
    });


    return (
        <div className="animate-fadeIn max-w-[1400px] mx-auto pb-12">

            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative mb-8">
                <div className="h-2 w-full bg-gradient-to-r from-emerald-400 to-teal-600"></div>

                <div className="p-8 md:p-10 border-b border-gray-100 bg-slate-50/50">
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                        <span className="p-2 bg-emerald-100 text-emerald-600 rounded-xl shadow-inner">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" /></svg>
                        </span>
                        Leave Requests & Management
                    </h1>
                    <p className="mt-2 text-slate-500 font-medium ml-12">Apply for personal leave and manage Employee requests securely.</p>
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

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">

                        <div className="xl:col-span-12 border border-slate-200 bg-slate-50/50 p-8 rounded-3xl shadow-sm mb-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-emerald-600 mb-6 flex items-center gap-2">
                                <span className="w-8 h-px bg-emerald-200"></span>
                                Direct Employee Leave Applications
                            </h3>

                            {loading ? (
                                <div className="py-20 flex justify-center items-center gap-3 text-slate-400 font-bold animate-pulse">
                                    <div className="w-5 h-5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                                    Loading...
                                </div>
                            ) : empLeaves.length === 0 ? (
                                <div className="py-16 text-center text-slate-500 font-medium italic bg-white rounded-2xl border border-dashed border-slate-300">
                                    No pending employee leave requests at this time.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-6 gap-4">
                                    {empLeaves.map(leave => (
                                        <div key={leave.id || leave.userid + leave.start_date} className={`bg-white rounded-2xl border ${leave.status === 'PENDING' ? 'border-amber-200 shadow-sm' : 'border-slate-100'} p-5 relative overflow-hidden group hover:shadow-md transition-all flex flex-col justify-between`}>
                                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${leave.status === 'APPROVED' ? 'bg-emerald-400' : leave.status === 'REJECTED' ? 'bg-red-400' : 'bg-amber-400'}`}></div>

                                            <div>
                                                <div className="pl-2 flex justify-between items-start mb-3">
                                                    <div>
                                                        <span className="font-extrabold text-slate-800 text-lg block">{leave.employee_name || leave.name || usersMap[leave.user]?.name || leave.employee_id || 'Unknown Employee'}</span>
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded border border-slate-200 mt-1 inline-block">Staff</span>
                                                    </div>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${leave.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        leave.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                                                            'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                        {leave.status}
                                                    </span>
                                                </div>

                                                <div className="pl-2 flex items-center text-sm text-slate-500 gap-2 font-medium bg-slate-50 w-fit px-3 py-1.5 rounded-lg mb-3 border border-slate-100">
                                                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    {leave.start_date} <span className="text-slate-300 font-bold px-1">→</span> {leave.end_date}
                                                </div>

                                                <div className="pl-2 text-sm text-slate-600 mb-4 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                                    <p className="mb-1"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Type:</span> {leave.leave_type}</p>
                                                    <p className="line-clamp-2" title={leave.reason}><span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Reason:</span> {leave.reason}</p>
                                                </div>
                                            </div>

                                            {leave.status === 'PENDING' ? (
                                                <div className="flex gap-3 pt-3 mt-2 border-t border-slate-100 pl-2">
                                                    <button onClick={() => openActionModal(leave.id || leave.employee_id || (leave.user && typeof leave.user === 'object' ? leave.user.id : leave.user), 'APPROVED')} className="flex-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 text-center">
                                                        Approve
                                                    </button>
                                                    <button onClick={() => openActionModal(leave.id || leave.employee_id || (leave.user && typeof leave.user === 'object' ? leave.user.id : leave.user), 'REJECTED')} className="flex-1 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 hover:border-red-600 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 text-center">
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end pt-3 mt-2 border-t border-slate-100">
                                                    <button
                                                        onClick={() => handleDeleteLeave(leave.id)}
                                                        className="text-[11px] text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded uppercase font-bold tracking-wider transition-colors flex items-center gap-1.5"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                        Delete Record
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>


                        <div className="xl:col-span-5 h-fit">
                            <div className="border border-slate-200 bg-slate-50/50 p-8 rounded-3xl shadow-sm mb-10 group">
                                <h3 className="text-sm font-black uppercase tracking-widest text-emerald-600 mb-6 flex items-center gap-2">
                                    <span className="w-8 h-px bg-emerald-200"></span>
                                    Apply for Leave (Self)
                                </h3>

                                <form onSubmit={handleApplySubmit} className="space-y-5" noValidate>
                                    <div className="space-y-2 relative">
                                        <label className="block text-sm font-bold text-slate-700">Type of Leave <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <select
                                                name="leave_type"
                                                value={applyForm.leave_type}
                                                onChange={handleApplyChange}
                                                required
                                                className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-emerald-500 focus:border-emerald-500 transition-shadow outline-none appearance-none cursor-pointer text-slate-700 font-medium peer shadow-sm"
                                            >
                                                <option value="CASUAL">Casual Leave</option>
                                                <option value="LOP">Loss of Pay (LOP)</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2 relative">
                                            <label className="block text-sm font-bold text-slate-700">Start Date <span className="text-red-500">*</span></label>
                                            <input
                                                type="date"
                                                name="start_date"
                                                value={applyForm.start_date}
                                                onChange={handleApplyChange}
                                                required
                                                className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-emerald-500 focus:border-emerald-500 transition-shadow outline-none text-slate-700 peer shadow-sm cursor-pointer"
                                            />
                                        </div>
                                        <div className="space-y-2 relative">
                                            <label className="block text-sm font-bold text-slate-700">End Date <span className="text-red-500">*</span></label>
                                            <input
                                                type="date"
                                                name="end_date"
                                                value={applyForm.end_date}
                                                onChange={handleApplyChange}
                                                required
                                                className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-emerald-500 focus:border-emerald-500 transition-shadow outline-none text-slate-700 peer shadow-sm cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 relative">
                                        <label className="block text-sm font-bold text-slate-700">Reason for Leave <span className="text-red-500">*</span></label>
                                        <textarea
                                            name="reason"
                                            value={applyForm.reason}
                                            onChange={handleApplyChange}
                                            required
                                            minLength="10"
                                            rows="4"
                                            className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-emerald-500 focus:border-emerald-500 transition-shadow outline-none text-slate-700 peer shadow-sm resize-none"
                                            placeholder="Briefly describe your reason..."
                                        ></textarea>
                                        <p className="text-[11px] text-red-500 mt-1 hidden peer-invalid:peer-focus:block">Reason must be at least 10 characters.</p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={applying}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-emerald-200 transition-all focus:outline-none flex justify-center items-center gap-2 group-[*:invalid]:opacity-70 group-[*:invalid]:pointer-events-none active:scale-[0.98]"
                                    >
                                        {applying ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                Submitting...
                                            </>
                                        ) : (
                                            <>Send Request <svg className="w-5 h-5 ml-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div className="xl:col-span-7 h-fit">
                            <div className="border border-slate-200 bg-slate-50/50 p-8 rounded-3xl shadow-sm">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2">
                                    <span className="w-8 h-px bg-slate-300"></span>
                                    My Personal Leave History
                                </h3>

                                {loading ? (
                                    <div className="py-20 text-center">-</div>
                                ) : myLeaves.length === 0 ? (
                                    <div className="py-16 text-center text-slate-500 font-medium italic bg-white rounded-2xl border border-dashed border-slate-300">
                                        You have zero leave requests in the system.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {myLeaves.map(leave => (
                                            <div key={leave.id || leave.start_date} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${leave.status === 'APPROVED' ? 'bg-emerald-400' : leave.status === 'REJECTED' ? 'bg-red-400' : 'bg-amber-400'}`}></div>

                                                <div className="pl-3 flex-1 flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-extrabold text-slate-800 text-lg">{leave.leave_type || 'Leave'}</span>
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${leave.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                            leave.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                            {leave.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center text-sm text-slate-500 gap-2 font-medium bg-slate-50 w-fit px-2 py-1 rounded">
                                                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                        {leave.start_date} <span className="text-slate-300 px-1 font-bold">→</span> {leave.end_date}
                                                    </div>
                                                    <p className="text-sm text-slate-600 mt-1 leading-relaxed border-l-2 border-slate-200 pl-3 ml-1 mb-1 line-clamp-2" title={leave.reason}>
                                                        {leave.reason}
                                                    </p>
                                                </div>

                                                {leave.status === 'PENDING' && (
                                                    <div className="pl-3 md:pl-0 self-start md:self-center pr-1 mt-3 md:mt-0">
                                                        <button
                                                            onClick={() => handleDeleteLeave(leave.id)}
                                                            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                                                            title="Cancel Application"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                            Withdraw
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ACTION MODAL */}
            {actionModal.isOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg p-10 shadow-2xl relative animate-fadeIn border border-white/20">
                        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-gradient-to-br from-emerald-100 to-transparent rounded-full opacity-50 pointer-events-none blur-xl"></div>

                        <h3 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center gap-3 relative z-10">
                            {actionModal.status === 'APPROVED' ? (
                                <><span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></span> Approve Leave</>
                            ) : (
                                <><span className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></span> Reject Leave</>
                            )}
                        </h3>

                        <div className="space-y-6 relative z-10">
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Remarks / Notes (Optional)</label>
                                <textarea
                                    value={actionModal.message}
                                    onChange={(e) => setActionModal({ ...actionModal, message: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-none placeholder-slate-400 text-slate-700"
                                    rows="3"
                                    placeholder="Add any internal notes..."
                                ></textarea>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setActionModal({ isOpen: false, id: null, status: '', message: '' })} className="flex-1 px-6 py-4 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl transition-all active:scale-95 text-center shadow-sm">
                                    Cancel
                                </button>
                                <button onClick={handleActionSubmit} className={`flex-1 px-6 py-4 text-white font-bold rounded-2xl transition-all active:scale-95 text-center shadow-lg ${actionModal.status === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}>
                                    Confirm {actionModal.status === 'APPROVED' ? 'Approval' : 'Rejection'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                    20%, 40%, 60%, 80% { transform: translateX(4px); }
                }
                .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
            `}} />
        </div>
    );
};

export default HRLeaveRequests;
