import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';

function AdminDashboard() {
    const [stats, setStats] = useState({
        totalEmployees: 0,
        hrAccounts: 0
    });
    const [hrs, setHrs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');
                const usersRes = await axios.get(`${API_BASE_URL}/api/accounts/users/admin/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const allUsers = Array.isArray(usersRes.data) ? usersRes.data :
                    (usersRes.data && Array.isArray(usersRes.data.results)) ? usersRes.data.results : [];

                setHrs(allUsers.filter(u => u.role && u.role.toUpperCase() === 'HR'));
                setStats({
                    totalEmployees: allUsers.filter(u => u.role && u.role.toUpperCase() === 'EMPLOYEE').length,
                    hrAccounts: allUsers.filter(u => u.role && u.role.toUpperCase() === 'HR').length
                });
            } catch (err) {
                console.error("Dashboard fetch error:", err);
                // Also set an application visible error for debugging
                setStats(prev => ({ ...prev, error: err.response?.data ? JSON.stringify(err.response.data) : err.message }));
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div className="space-y-8 animate-fadeIn">
            {stats.error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 shadow-sm font-medium">
                    <span className="font-bold mr-2">Debug Error:</span> {stats.error}
                </div>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md">
                    <div className="h-14 w-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Employees</p>
                        <h3 className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.totalEmployees}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md">
                    <div className="h-14 w-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">HR Accounts</p>
                        <h3 className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.hrAccounts}</h3>
                    </div>
                </div>
            </div>

            {/* HR List Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-800">HR Personnel</h2>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase">Active Staff</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Email</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Department</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center text-gray-400 italic">Loading HR data...</td>
                                </tr>
                            ) : hrs.length > 0 ? (
                                hrs.map((hr) => (
                                    <tr key={hr.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600 text-xs shadow-inner">
                                                    {hr.name?.charAt(0) || 'U'}
                                                </div>
                                                <span className="font-semibold text-gray-700">{hr.name || hr.username}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{hr.email}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md">
                                                {hr.department || 'General'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-green-600 font-medium">
                                            <div className="flex items-center gap-2">
                                                <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-green-200 shadow-sm"></span>
                                                Active
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center text-gray-500">No HR accounts found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
