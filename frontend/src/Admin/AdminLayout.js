import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');

    React.useEffect(() => {
        if (!role || role !== 'ADMIN') {
            navigate('/login');
        }
    }, [role, navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const isActive = (path) => {
        return location.pathname === path
            ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border-l-4 border-cyan-400'
            : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent';
    };

    return (
        <div className="flex h-screen bg-[#f8fafc] font-sans selection:bg-cyan-200 selection:text-cyan-900 overflow-hidden">
            {/* Elegant Gradient Sidebar */}
            <aside className="w-72 bg-gradient-to-b from-[#0f172a] via-[#1e1b4b] to-[#0f172a] text-white flex flex-col shadow-2xl relative z-20">
                <div className="p-8 border-b border-white/10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                        </svg>
                    </div>
                    <h2 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">Nexus ERP</h2>
                </div>

                <nav className="flex-1 flex flex-col p-4 gap-2 overflow-y-auto">
                    <button
                        className={`p-3 rounded-xl transition-all duration-300 flex items-center gap-3 text-left group ${isActive('/admin-dashboard')}`}
                        onClick={() => navigate('/admin-dashboard')}
                    >
                        <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-cyan-500/20 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        </div>
                        <span className="font-semibold text-sm">Dashboard Overview</span>
                    </button>

                    <button
                        className={`p-3 rounded-xl transition-all duration-300 flex items-center gap-3 text-left group ${isActive('/admin-dashboard/add-hr')}`}
                        onClick={() => navigate('/admin-dashboard/add-hr')}
                    >
                        <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-cyan-500/20 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                        </div>
                        <span className="font-semibold text-sm">Onboard HR Staff</span>
                    </button>

                    <button
                        className={`p-3 rounded-xl transition-all duration-300 flex items-center gap-3 text-left group ${isActive('/admin-dashboard/add-department')}`}
                        onClick={() => navigate('/admin-dashboard/add-department')}
                    >
                        <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-cyan-500/20 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                        <span className="font-semibold text-sm">Add Departments</span>
                    </button>

                    <button
                        className={`p-3 rounded-xl transition-all duration-300 flex items-center gap-3 text-left group ${isActive('/admin-dashboard/attendance')}`}
                        onClick={() => navigate('/admin-dashboard/attendance')}
                    >
                        <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-cyan-500/20 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                        </div>
                        <span className="font-semibold text-sm">Attendance Logs</span>
                    </button>

                    <button
                        className={`p-3 rounded-xl transition-all duration-300 flex items-center gap-3 text-left group ${isActive('/admin-dashboard/leave-requests')}`}
                        onClick={() => navigate('/admin-dashboard/leave-requests')}
                    >
                        <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-cyan-500/20 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <span className="font-semibold text-sm">Leave Management</span>
                    </button>

                    <button
                        className={`p-3 rounded-xl transition-all duration-300 flex items-center gap-3 text-left group ${isActive('/admin-dashboard/payroll')}`}
                        onClick={() => navigate('/admin-dashboard/payroll')}
                    >
                        <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-cyan-500/20 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <span className="font-semibold text-sm">Business Payroll</span>
                    </button>

                    <button
                        className={`p-3 rounded-xl transition-all duration-300 flex items-center gap-3 text-left group ${isActive('/admin-dashboard/users')}`}
                        onClick={() => navigate('/admin-dashboard/users')}
                    >
                        <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-cyan-500/20 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <span className="font-semibold text-sm">Staff Directory</span>
                    </button>

                    <button
                        className={`p-3 rounded-xl transition-all duration-300 flex items-center gap-3 text-left group ${isActive('/admin-dashboard/holidays')}`}
                        onClick={() => navigate('/admin-dashboard/holidays')}
                    >
                        <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-cyan-500/20 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        </div>
                        <span className="font-semibold text-sm">Company Holidays</span>
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">

                {/* Decorative blob in background */}
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none"></div>

                {/* Glassmorphic Header */}
                <header className="bg-white/70 backdrop-blur-xl shadow-sm py-4 px-8 flex justify-between items-center border-b border-gray-200/60 sticky top-0 z-10 transition-all">
                    <h1 className="text-2xl font-bold text-slate-800 drop-shadow-sm flex items-center gap-2">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-cyan-500 mx-2">Admin Workspace</span>
                    </h1>
                    <div className="flex items-center gap-5">
                        <div className="flex flex-col text-right">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Logged In As</span>
                            <span className="font-bold text-slate-700">{username || 'Admin'}</span>
                        </div>
                        <div className="h-11 w-11 bg-gradient-to-tr from-cyan-100 to-purple-100 rounded-full flex items-center justify-center text-cyan-700 font-extrabold shadow-sm border border-cyan-200 ring-2 ring-white">
                            {username ? username.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div className="h-8 w-px bg-slate-200 mx-2"></div>
                        <button
                            onClick={handleLogout}
                            className="py-2.5 px-5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-2 rounded-xl transition-all duration-200 font-bold shadow-sm hover:shadow text-sm hover:text-red-600 focus:ring-2 focus:ring-slate-100"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                            Logout
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-8 relative z-0 animate-fadeIn">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default AdminLayout;
