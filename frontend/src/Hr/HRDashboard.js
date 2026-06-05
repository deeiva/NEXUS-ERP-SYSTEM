import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';

function HRDashboard() {
    const username = localStorage.getItem('username');
    const [stats, setStats] = useState({
        pendingApprovals: 0,
        directReports: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                const [leavesRes, usersRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/leave/`, { headers }).catch(() => ({ data: [] })),
                    axios.get(`${API_BASE_URL}/api/accounts/users/admin/`, { headers }).catch(() => ({ data: [] }))
                ]);

                // Calculate pending approvals (Employee leaves that are pending)
                const leaves = Array.isArray(leavesRes.data) ? leavesRes.data :
                    (leavesRes.data && Array.isArray(leavesRes.data.results)) ? leavesRes.data.results : [];

                const map = {};
                const fetchedUsers = Array.isArray(usersRes.data) ? usersRes.data :
                    (usersRes.data && Array.isArray(usersRes.data.results)) ? usersRes.data.results : [];

                fetchedUsers.forEach(u => {
                    const derivedRole = u.is_superuser ? 'ADMIN' : (u.status === 0 ? 'HR' : (u.status === 1 ? 'EMPLOYEE' : u.role));
                    map[u.id] = { role: derivedRole };
                    map[u.username] = { role: derivedRole };
                });

                const pendingApprovals = leaves.filter(l => {
                    const role = l.role || map[l.user]?.role || map[l.userid?.username || l.userid]?.role;
                    return role === 'EMPLOYEE' && l.status === 'PENDING';
                }).length;

                // Calculate Direct Reports (Employees)
                const directReports = fetchedUsers.filter(u => {
                    const derivedRole = u.is_superuser ? 'ADMIN' : (u.status === 0 ? 'HR' : (u.status === 1 ? 'EMPLOYEE' : u.role));
                    return derivedRole === 'EMPLOYEE';
                }).length;

                setStats({ pendingApprovals, directReports });
            } catch (err) {
                console.error("Error fetching HR dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-12">

            <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-3xl p-10 shadow-lg text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-emerald-400 opacity-20 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 w-full">
                    <h1 className="text-4xl font-extrabold tracking-tight mb-2 drop-shadow-sm flex items-center gap-3">
                        Welcome Back, {username || 'HR'}!
                        <span className="text-2xl">✨</span>
                    </h1>
                    <p className="text-emerald-100 font-medium text-lg max-w-xl">
                        Here is an overview of human resources activity and management status today.
                    </p>
                </div>

                <div className="relative z-10 hidden md:block mt-6 md:mt-0">
                    <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
                        <div className="text-emerald-50 text-xs font-bold uppercase tracking-widest text-center mb-1 opacity-80">Current Date</div>
                        <div className="text-2xl font-black tracking-wider">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <h3 className="text-sm font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2 pt-4">
                <span className="w-8 h-px bg-emerald-200"></span>
                Quick Metrics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center gap-6 transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>

                    <div className="h-20 w-20 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-2xl flex items-center justify-center text-teal-600 shadow-inner group-hover:scale-110 transition-transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Approvals</p>
                        <h3 className="text-4xl font-extrabold text-slate-800 flex items-baseline gap-2">
                            {loading ? <div className="h-8 w-16 bg-slate-200 animate-pulse rounded"></div> : stats.pendingApprovals}
                            {!loading && stats.pendingApprovals > 0 && <span className="text-sm font-bold text-amber-500 flex items-center"><svg className="w-4 h-4 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Action Required</span>}
                        </h3>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center gap-6 transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>

                    <div className="h-20 w-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-110 transition-transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Direct Reports</p>
                        <h3 className="text-4xl font-extrabold text-slate-800 flex items-baseline gap-2">
                            {loading ? <div className="h-8 w-16 bg-slate-200 animate-pulse rounded"></div> : stats.directReports}
                            {!loading && <span className="text-sm font-bold text-slate-400">Employees</span>}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Quick Actions / Info */}
            <div className="bg-slate-50 rounded-3xl border border-slate-200/60 shadow-inner p-10 text-center text-slate-500 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col items-center">
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 mb-6 text-emerald-500 animate-bounce">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-800 mb-3 tracking-tight">Your Action Center is Ready</h3>
                    <p className="max-w-md text-lg leading-relaxed text-slate-500 font-medium">Use the elegant sidebar to seamlessly navigate to Attendance, Employee Registration, and Payroll Management.</p>
                </div>
            </div>
        </div>
    );
}

export default HRDashboard;
