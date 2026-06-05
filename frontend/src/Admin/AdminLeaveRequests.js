import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';

const AdminLeaveRequests = () => {
    const [leaves, setLeaves] = useState([]);
    const [usersMap, setUsersMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMessage, setActionMessage] = useState('');
    const [actionModal, setActionModal] = useState({ isOpen: false, id: null, status: '', message: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const usersRes = await axios.get(`${API_BASE_URL}/api/accounts/users/admin/`, { headers });
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
            setUsersMap(map);

            const leavesRes = await axios.get(`${API_BASE_URL}/api/leave/`, { headers });
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
        if (!window.confirm("Are you sure you want to delete this leave record? This is irreversible.")) return;
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            await axios.delete(`${API_BASE_URL}/api/leave/${id}/`, { headers });
            setActionMessage("Leave record deleted successfully.");
            setTimeout(() => setActionMessage(""), 5000);
            fetchData();
        } catch (err) {
            setError('Failed to delete leave request.');
            setTimeout(() => setError(""), 5000);
        }
    };

    const handleActionSubmit = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            await axios.patch(`${API_BASE_URL}/api/leave/${actionModal.id}/approve/`, { status: actionModal.status }, { headers });
            setActionMessage(`Leave request ${actionModal.status.toLowerCase()} successfully.`);
            setTimeout(() => setActionMessage(""), 5000);
            setActionModal({ isOpen: false, id: null, status: '', message: '' });
            fetchData();
        } catch (err) {
            const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to update leave status.';
            setError(`Error: ${errMsg}`);
            setTimeout(() => setError(""), 5000);
        }
    };

    const hrLeaves = leaves.filter(l => {
        const role = l.role || usersMap[l.user]?.role || usersMap[l.username || (l.userid?.username || l.userid)]?.role;
        return role === 'HR';
    });
    const empLeaves = leaves.filter(l => {
        const role = l.role || usersMap[l.user]?.role || usersMap[l.username || (l.userid?.username || l.userid)]?.role;
        return role === 'EMPLOYEE';
    });

    return (
        <div className="animate-fadeIn max-w-7xl mx-auto pb-12">

            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative mb-8">
                <div className="h-2 w-full bg-gradient-to-r from-blue-400 to-indigo-600"></div>

                <div className="p-8 md:p-10 border-b border-gray-100 bg-slate-50/50">
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                        <span className="p-2 bg-blue-100 text-blue-600 rounded-xl shadow-inner">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" /></svg>
                        </span>
                        Leave Administration
                    </h1>
                    <p className="mt-2 text-slate-500 font-medium ml-12">Review and process Human Resources leave applications.</p>
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

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                        {/* HR Leaves */}
                        <div className="border border-slate-200 bg-slate-50/50 p-8 rounded-3xl shadow-sm">
                            <h3 className="text-sm font-black uppercase tracking-widest text-blue-600 mb-6 flex items-center gap-2">
                                <span className="w-8 h-px bg-blue-200"></span>
                                HR Applications (Actionable)
                            </h3>

                            {loading ? (
                                <div className="py-20 flex justify-center items-center gap-3 text-slate-400 font-bold animate-pulse">
                                    <div className="w-5 h-5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                                    Loading...
                                </div>
                            ) : hrLeaves.length === 0 ? (
                                <div className="py-16 text-center text-slate-500 font-medium italic bg-white rounded-2xl border border-dashed border-slate-300">
                                    No pending HR leave requests at this time.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {hrLeaves.map(leave => (
                                        <div key={leave.id || leave.userid + leave.start_date} className={`bg-white rounded-2xl border ${leave.status === 'PENDING' ? 'border-amber-200 shadow-sm' : 'border-slate-100'} p-5 relative overflow-hidden group hover:shadow-md transition-all`}>
                                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${leave.status === 'APPROVED' ? 'bg-emerald-400' : leave.status === 'REJECTED' ? 'bg-red-400' : 'bg-amber-400'}`}></div>

                                            <div className="pl-2 flex justify-between items-start mb-3">
                                                <div>
                                                    <span className="font-extrabold text-slate-800 text-lg block">{leave.profile_name || leave.employee_name || leave.name || usersMap[leave.user]?.name || leave.employee_id || 'Unknown HR'}</span>
                                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-100 mt-1 inline-block">HR Personnel</span>
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

                        {/* Employee Leaves */}
                        <div className="border border-slate-200 bg-slate-50/30 p-8 rounded-3xl shadow-sm opacity-90">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2">
                                <span className="w-8 h-px bg-slate-300"></span>
                                Employee Log (View Only)
                            </h3>

                            {loading ? (
                                <div className="py-20 text-center">-</div>
                            ) : empLeaves.length === 0 ? (
                                <div className="py-16 text-center text-slate-400 font-medium italic bg-white rounded-2xl border border-dashed border-slate-200">
                                    No employee leave requests to show.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {empLeaves.map(leave => (
                                        <div key={leave.id || leave.userid + leave.start_date} className={`bg-white rounded-2xl border border-slate-100 p-5 relative overflow-hidden group hover:shadow-sm transition-all`}>
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${leave.status === 'APPROVED' ? 'bg-emerald-300' : leave.status === 'REJECTED' ? 'bg-red-300' : 'bg-amber-300'}`}></div>

                                            <div className="pl-2 flex justify-between items-start mb-3">
                                                <div>
                                                    <span className="font-extrabold text-slate-700 block">{leave.profile_name || leave.employee_name || leave.name || usersMap[leave.user]?.name || leave.employee_id || 'Unknown Emp'}</span>
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">Staff</span>
                                                </div>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${leave.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    leave.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100' :
                                                        'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                    {leave.status}
                                                </span>
                                            </div>

                                            <div className="pl-2 flex items-center text-sm text-slate-500 gap-2 font-medium mb-2">
                                                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-bold">{leave.leave_type}</span>
                                                <span className="text-slate-300">|</span>
                                                <span className="text-xs">{leave.start_date} → {leave.end_date}</span>
                                            </div>
                                            <div className="pl-2 text-xs text-slate-500 line-clamp-1 italic">
                                                {leave.reason}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ACTION MODAL */}
            {actionModal.isOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg p-10 shadow-2xl relative animate-fadeIn border border-white/20">
                        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-gradient-to-br from-blue-100 to-transparent rounded-full opacity-50 pointer-events-none blur-xl"></div>

                        <h3 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center gap-3">
                            {actionModal.status === 'APPROVED' ? (
                                <><span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></span> Approve Leave</>
                            ) : (
                                <><span className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></span> Reject Leave</>
                            )}
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Remarks / Notes (Optional)</label>
                                <textarea
                                    value={actionModal.message}
                                    onChange={(e) => setActionModal({ ...actionModal, message: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none placeholder-slate-400 text-slate-700"
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

export default AdminLeaveRequests;
