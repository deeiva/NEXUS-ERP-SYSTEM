import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({ name: '', email: '', mobile: '', role: '', department: '', salary: '', allowances: '' });
    const [deletingId, setDeletingId] = useState(null);
    const [actionMessage, setActionMessage] = useState('');
    const [error, setError] = useState('');

    const currentUserRole = localStorage.getItem('role') || 'EMPLOYEE';
    const themeColor = currentUserRole === 'HR' ? 'emerald' : 'blue';

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/accounts/users/admin/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            let fetchedUsers = Array.isArray(response.data) ? response.data :
                (response.data && Array.isArray(response.data.results)) ? response.data.results : [];

            if (currentUserRole === 'HR') {
                fetchedUsers = fetchedUsers.filter(u => u.role !== 'HR' && u.role !== 'ADMIN');
            }

            setUsers(fetchedUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('Failed to fetch users. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (username) => {
        if (!window.confirm(`Are you sure you want to completely remove the user account for ${username}? This cannot be undone.`)) return;
        setDeletingId(username);
        setError('');
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/accounts/users/${username}/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setActionMessage('User account deleted successfully.');
            setTimeout(() => setActionMessage(""), 5000);
            fetchUsers();
        } catch (error) {
            setError('Failed to delete user. Please verify your permissions.');
            setTimeout(() => setError(""), 5000);
            console.error(error);
        } finally {
            setDeletingId(null);
        }
    };

    const handleEditClick = (user) => {
        setEditingUser(user);
        setEditFormData({
            name: user.name || '',
            email: user.email || '',
            mobile: user.mobile || '',
            role: user.role || 'EMPLOYEE',
            department: user.department || '',
            salary: user.salary || '',
            allowances: user.allowances || ''
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_BASE_URL}/api/accounts/users/${editingUser.username}/`, editFormData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setActionMessage('User profile updated successfully.');
            setTimeout(() => setActionMessage(""), 5000);
            setShowEditModal(false);
            fetchUsers();
        } catch (error) {
            setError(error.response?.data?.detail || error.response?.data?.error || 'Failed to apply updates.');
            setTimeout(() => setError(""), 5000);
            console.error(error);
        }
    };


    return (
        <div className="animate-fadeIn max-w-7xl mx-auto pb-12">

            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative mb-8">
                <div className={`h-2 w-full bg-gradient-to-r from-${themeColor}-400 to-${themeColor}-600`}></div>

                <div className="p-8 md:p-10 border-b border-gray-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                            <span className={`p-2 bg-${themeColor}-100 text-${themeColor}-600 rounded-xl shadow-inner`}>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            </span>
                            {currentUserRole === 'HR' ? 'Employee Directory' : 'Personnel Administration'}
                        </h1>
                        <p className="mt-2 text-slate-500 font-medium ml-12">Manage registered staff, monitor roles, and assign departments.</p>
                    </div>

                    <div className="flex items-center">
                        <div className={`px-4 py-2 bg-${themeColor}-50 border border-${themeColor}-100 rounded-xl flex items-center gap-3 shadow-inner`}>
                            <div className={`w-10 h-10 rounded-lg bg-${themeColor}-100 text-${themeColor}-600 flex items-center justify-center font-black text-xl`}>
                                {users.length}
                            </div>
                            <div className="pr-2">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Total Active</div>
                                <div className={`font-bold text-${themeColor}-700 leading-tight`}>Records</div>
                            </div>
                        </div>
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
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/90 backdrop-blur border-b-2 border-slate-100">
                                    <tr>
                                        <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest sticky left-0 bg-slate-50/95 z-20 shadow-[1px_0_0_0_#e2e8f0]">Identity Profile</th>
                                        <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest text-center">System Role</th>
                                        <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Department</th>
                                        <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Contact Info</th>
                                        <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Account Status</th>
                                        {currentUserRole === 'ADMIN' && <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest text-center sticky right-0 bg-slate-50/95 z-20 shadow-[-1px_0_0_0_#e2e8f0]">Controls</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={currentUserRole === 'ADMIN' ? 6 : 5} className="p-16 text-center">
                                                <div className="flex flex-col items-center justify-center gap-4 text-slate-400 font-medium">
                                                    <div className={`w-8 h-8 border-4 border-${themeColor}-600 border-t-transparent rounded-full animate-spin`}></div>
                                                    Loading personnel registry...
                                                </div>
                                            </td>
                                        </tr>
                                    ) : users.length === 0 ? (
                                        <tr>
                                            <td colSpan={currentUserRole === 'ADMIN' ? 6 : 5} className="p-16 text-center text-slate-400 font-medium italic bg-slate-50/30">
                                                No staff profiles available to display.
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((user, idx) => {
                                            const roleUpper = (user.role || 'EMP').toUpperCase();
                                            const isHR = roleUpper === 'HR';
                                            const isAdmin = roleUpper === 'ADMIN';

                                            return (
                                                <tr key={user.id || user.username} className={`transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-slate-50/80 group`}>
                                                    <td className="px-6 py-4 sticky left-0 bg-inherit z-10 shadow-[1px_0_0_0_#f8fafc]">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-sm border ${isAdmin ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                isHR ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                                    `bg-${themeColor}-50 text-${themeColor}-600 border-${themeColor}-100`
                                                                }`}>
                                                                {(user.name ? user.name.charAt(0) : (user.username ? user.username.charAt(0) : 'U')).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-extrabold text-slate-800 text-sm whitespace-nowrap">{user.name || user.username || 'Unknown Profile'}</div>
                                                                <div className="text-[11px] font-bold text-slate-400 mt-1 max-w-[200px] truncate" title={user.email}>{user.email || 'No email registered'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-block px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${isAdmin ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm' :
                                                            isHR ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm' :
                                                                'bg-slate-100 text-slate-600 border-slate-200'
                                                            }`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm inline-block min-w-[100px]">
                                                            {user.department || 'Unassigned'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-xs text-slate-500 font-bold font-mono tracking-wide">
                                                            {user.mobile || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-1.5 font-bold text-[10px] uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full w-fit mx-auto shadow-sm">
                                                            <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                                                            Active
                                                        </div>
                                                    </td>
                                                    {currentUserRole === 'ADMIN' && (
                                                        <td className="px-6 py-4 text-center sticky right-0 bg-inherit z-10 shadow-[-1px_0_0_0_#f8fafc]">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={() => handleEditClick(user)}
                                                                    className={`p-2 bg-white border border-slate-200 hover:border-${themeColor}-300 hover:bg-${themeColor}-50 text-slate-400 hover:text-${themeColor}-600 rounded-lg transition-all shadow-sm active:scale-95`}
                                                                    title="Edit Profile"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteUser(user.username)}
                                                                    disabled={deletingId === user.username}
                                                                    className="p-2 bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                                                    title="Revoke Access & Delete"
                                                                >
                                                                    {deletingId === user.username ? (
                                                                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                                                    ) : (
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    )}
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

            {/* Edit User Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] p-4 flex justify-center items-start overflow-y-auto animate-fadeIn">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg p-6 md:p-10 shadow-2xl relative border border-white/20 my-10 animate-scaleIn">
                        <button
                            onClick={() => setShowEditModal(false)}
                            className="absolute top-6 right-6 w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>

                        <h3 className="text-2xl font-extrabold text-slate-800 mb-8 flex items-center gap-3 border-b border-gray-100 pb-4">
                            <span className={`w-12 h-12 rounded-2xl bg-${themeColor}-100 text-${themeColor}-600 flex items-center justify-center shadow-inner`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            </span>
                            Modify Account Profile
                        </h3>

                        <form onSubmit={handleEditSubmit} className="space-y-6">
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Full Legal Name</label>
                                <input
                                    type="text"
                                    className={`w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-${themeColor}-500/20 focus:border-${themeColor}-500 transition-all outline-none font-bold text-slate-700 shadow-sm`}
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    required
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Registered Email Address</label>
                                <input
                                    type="email"
                                    className={`w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-${themeColor}-500/20 focus:border-${themeColor}-500 transition-all outline-none font-bold text-slate-700 shadow-sm`}
                                    value={editFormData.email}
                                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                    required
                                    placeholder="john.doe@company.com"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Mobile Number</label>
                                    <input
                                        type="tel"
                                        className={`w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-${themeColor}-500/20 focus:border-${themeColor}-500 transition-all outline-none font-medium font-mono text-slate-700 shadow-sm`}
                                        value={editFormData.mobile}
                                        onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                                        placeholder="+1 234 567 8900"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Granted Role</label>
                                    <div className="relative">
                                        <select
                                            className={`w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-${themeColor}-500/20 focus:border-${themeColor}-500 transition-all outline-none appearance-none cursor-pointer font-bold text-slate-700 shadow-sm`}
                                            value={editFormData.role}
                                            onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                                            required
                                        >
                                            <option value="ADMIN">ADMIN (System-wide)</option>
                                            <option value="HR">HR (Operations)</option>
                                            <option value="EMPLOYEE">EMPLOYEE (Staff)</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Assigned Department</label>
                                <input
                                    type="text"
                                    className={`w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-${themeColor}-500/20 focus:border-${themeColor}-500 transition-all outline-none font-bold text-slate-700 shadow-sm`}
                                    value={editFormData.department}
                                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                                    placeholder="e.g. Engineering, Finance, Sales"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Basic Salary (Monthly)</label>
                                    <input
                                        type="number"
                                        className={`w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-${themeColor}-500/20 focus:border-${themeColor}-500 transition-all outline-none font-bold text-slate-700 shadow-sm`}
                                        value={editFormData.salary}
                                        onChange={(e) => setEditFormData({ ...editFormData, salary: e.target.value })}
                                        placeholder="e.g. 25000"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Total Allowances</label>
                                    <input
                                        type="number"
                                        className={`w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-${themeColor}-500/20 focus:border-${themeColor}-500 transition-all outline-none font-bold text-slate-700 shadow-sm`}
                                        value={editFormData.allowances}
                                        onChange={(e) => setEditFormData({ ...editFormData, allowances: e.target.value })}
                                        placeholder="e.g. 2000"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 flex gap-4">
                                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-4 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl transition-all active:scale-95 text-center shadow-sm">Cancel changes</button>
                                <button type="submit" className={`flex-1 py-4 bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white font-bold rounded-2xl shadow-lg shadow-${themeColor}-200 transition-all active:scale-95 text-center`}>Apply Updates</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-scaleIn { animation: scaleIn 0.3s ease-out forwards; }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                    20%, 40%, 60%, 80% { transform: translateX(4px); }
                }
                .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
            `}} />
        </div >
    );
};

export default AdminUsers;
