import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';

const EmployeeLeaveRequests = () => {
    const username = localStorage.getItem('username');

    const [leaves, setLeaves] = useState([]);
    const [usersMap, setUsersMap] = useState({});
    const [realUsername, setRealUsername] = useState(username || '');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMessage, setActionMessage] = useState('');

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

    const handleDeleteLeave = async (id) => {
        if (!window.confirm("Are you sure you want to delete this leave request?")) return;
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            await axios.delete(`${API_BASE_URL}/api/leave/${id}/`, { headers });
            setActionMessage("Leave request cancelled successfully.");
            setTimeout(() => setActionMessage(""), 5000);
            fetchData();
        } catch (err) {
            setError('Failed to cancel leave request.');
            setTimeout(() => setError(""), 5000);
            console.error(err);
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

        // Date validation check
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
        setError('');
        setActionMessage('');
        try {
            const token = localStorage.getItem('token');
            const data = new FormData();

            // Re-apply trimmed reason to form data
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
            const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to submit leave application. Please verify parameters.';
            setError(`Submission Failed: ${errMsg}`);
            setTimeout(() => setError(""), 5000);
        } finally {
            setApplying(false);
        }
    };

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
        <div className="animate-fadeIn max-w-6xl mx-auto pb-12">
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative mb-8">
                <div className="h-2 w-full bg-gradient-to-r from-blue-400 to-indigo-600"></div>

                <div className="p-8 md:p-10 border-b border-gray-100 bg-slate-50/50">
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                        <span className="p-2 bg-blue-100 text-blue-600 rounded-xl shadow-inner">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </span>
                        Leave Requests
                    </h1>
                    <p className="mt-2 text-slate-500 font-medium ml-12">Apply for time off and track your previous leave requests.</p>
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

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Apply Leave Form */}
                        <div className="lg:col-span-5 border border-slate-200 bg-slate-50/50 p-8 rounded-3xl shadow-sm h-fit">
                            <h3 className="text-sm font-black uppercase tracking-widest text-blue-600 mb-6 flex items-center gap-2">
                                <span className="w-8 h-px bg-blue-200"></span>
                                Application Form
                            </h3>

                            <form onSubmit={handleApplySubmit} className="space-y-6 group" noValidate>
                                <div className="space-y-2 relative">
                                    <label className="block text-sm font-bold text-slate-700">Type of Leave <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select
                                            name="leave_type"
                                            value={applyForm.leave_type}
                                            onChange={handleApplyChange}
                                            required
                                            className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none appearance-none cursor-pointer text-slate-700 font-medium peer shadow-sm"
                                        >
                                            <option value="CASUAL">Casual Leave</option>
                                            <option value="LOP">Loss of Pay (LOP)</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 pt-1 leading-relaxed">System allows limited paid Casual leave. Other absences are Loss of Pay (LOP).</p>
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
                                            className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none text-slate-700 peer shadow-sm cursor-pointer"
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
                                            className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none text-slate-700 peer shadow-sm cursor-pointer"
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
                                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none text-slate-700 peer shadow-sm resize-none"
                                        placeholder="Briefly describe your reason..."
                                    ></textarea>
                                    <p className="text-[11px] text-red-500 mt-1 hidden peer-invalid:peer-focus:block">Reason must be at least 10 characters.</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={applying}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-blue-200 transition-all focus:outline-none flex justify-center items-center gap-2 group-[*:invalid]:opacity-70 group-[*:invalid]:pointer-events-none active:scale-[0.98]"
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

                        {/* Recent History */}
                        <div className="lg:col-span-7 border border-slate-200 bg-slate-50/50 p-8 rounded-3xl shadow-sm">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2">
                                <span className="w-8 h-px bg-slate-300"></span>
                                Leave History Tracker
                            </h3>

                            {loading ? (
                                <div className="py-20 flex justify-center items-center gap-3 text-slate-400 font-bold animate-pulse">
                                    <div className="w-5 h-5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                                    Loading Records...
                                </div>
                            ) : myLeaves.length === 0 ? (
                                <div className="py-16 text-center text-slate-500 font-medium italic bg-white rounded-2xl border border-dashed border-slate-300">
                                    You have no leave history yet.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {myLeaves.map(leave => (
                                        <div key={leave.id || leave.start_date} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            {/* Status Accent Line */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${leave.status === 'APPROVED' ? 'bg-emerald-400' : leave.status === 'REJECTED' ? 'bg-red-400' : 'bg-yellow-400'}`}></div>

                                            <div className="pl-3 flex-1 flex flex-col gap-1.5">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-extrabold text-slate-800 text-lg">{leave.leave_type || 'Leave'}</span>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${leave.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        leave.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                                                            'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                                        {leave.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center text-sm text-slate-500 gap-2 font-medium bg-slate-50 w-fit px-2 py-1 rounded inline-block">
                                                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    {leave.start_date} <span className="text-slate-300 px-1 font-bold">→</span> {leave.end_date}
                                                </div>
                                                <p className="text-sm text-slate-600 mt-1 leading-relaxed border-l-2 border-slate-200 pl-3 ml-1 mb-1 line-clamp-2" title={leave.reason}>
                                                    {leave.reason}
                                                </p>
                                            </div>

                                            {leave.status === 'PENDING' && (
                                                <div className="pl-3 md:pl-0 self-start md:self-center pr-1">
                                                    <button
                                                        onClick={() => handleDeleteLeave(leave.id)}
                                                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5"
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

export default EmployeeLeaveRequests;
