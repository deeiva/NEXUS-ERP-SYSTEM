import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';

const AdminDepartments = () => {
    const [departments, setDepartments] = useState([]);
    const [newDepartment, setNewDepartment] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [editingDept, setEditingDept] = useState(null);
    const [editName, setEditName] = useState('');
    const role = localStorage.getItem('role');

    // Theme based on role (Admin = Blue, HR = Emerald)
    const themeColor = role === 'ADMIN' ? 'blue' : 'emerald';
    const bgThemeMap = { 'blue': 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-blue-200', 'emerald': 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 shadow-emerald-200' };
    const textThemeMap = { 'blue': 'text-blue-600', 'emerald': 'text-emerald-600' };
    const ringThemeMap = { 'blue': 'focus:ring-blue-500 focus:border-blue-500', 'emerald': 'focus:ring-emerald-500 focus:border-emerald-500' };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            const res = await axios.get(`${API_BASE_URL}/api/hr/departments/`, { headers });
            setDepartments(res.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch departments.');
            setTimeout(() => setError(''), 5000);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDepartment = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete department "${name}"?`)) return;
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            await axios.delete(`${API_BASE_URL}/api/hr/departments/${id}/`, { headers });
            setSuccessMsg(`Department "${name}" deleted.`);
            fetchDepartments();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError('Failed to delete department. It might be in use by employees.');
            setTimeout(() => setError(''), 5000);
        }
    };

    const handleEditClick = (dept) => {
        setEditingDept(dept);
        setEditName(dept.name);
    };

    const handleUpdateDepartment = async (e) => {
        e.preventDefault();

        const trimmedName = editName.trim();
        if (!trimmedName || trimmedName.length < 2) {
            setError('Department name must be at least 2 characters long.');
            setTimeout(() => setError(''), 5000);
            return;
        }
        if (!/^[a-zA-Z\s]+$/.test(trimmedName)) {
            setError('Department name can only contain letters and spaces.');
            setTimeout(() => setError(''), 5000);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            await axios.patch(`${API_BASE_URL}/api/hr/departments/${editingDept.id}/`, { name: trimmedName }, { headers });
            setSuccessMsg(`Department updated to "${trimmedName}" successfully!`);
            setEditingDept(null);
            fetchDepartments();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError('Failed to update department. Name might already exist.');
            setTimeout(() => setError(''), 5000);
        }
    };

    const handleAddDepartment = async (e) => {
        e.preventDefault();

        const trimmedName = newDepartment.trim();
        if (!trimmedName || trimmedName.length < 2) {
            setError('Department name must be at least 2 characters long.');
            setTimeout(() => setError(''), 5000);
            return;
        }
        if (!/^[a-zA-Z\s]+$/.test(trimmedName)) {
            setError('Department name can only contain letters and spaces.');
            setTimeout(() => setError(''), 5000);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            await axios.post(`${API_BASE_URL}/api/hr/departments/`, { name: trimmedName }, { headers });
            setSuccessMsg(`Department "${trimmedName}" added successfully!`);
            setNewDepartment('');
            fetchDepartments();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError(err.response?.data?.name?.[0] || 'Failed to add department. It might already exist.');
            setTimeout(() => setError(''), 5000);
        }
    };

    return (
        <div className="animate-fadeIn max-w-6xl mx-auto pb-12">
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative">

                <div className={`h-2 w-full bg-gradient-to-r from-${themeColor}-400 to-${themeColor}-600`}></div>

                <div className="p-8 md:p-10 border-b border-gray-100 bg-slate-50/50">
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                        <span className={`p-2 bg-${themeColor}-100 ${textThemeMap[themeColor]} rounded-xl shadow-inner`}>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </span>
                        Manage Departments
                    </h1>
                    <p className="mt-2 text-slate-500 font-medium ml-12">Configure operational divisions for the company.</p>
                </div>

                <div className="p-8 md:p-10">
                    {successMsg && (
                        <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 flex items-start gap-4 animate-fadeIn">
                            <svg className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <div>
                                <h4 className="font-bold text-emerald-800">Success!</h4>
                                <p className="text-sm mt-1">{successMsg}</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-start gap-4 animate-shake">
                            <svg className="w-6 h-6 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <div>
                                <h4 className="font-bold text-red-800">Action Failed</h4>
                                <p className="text-sm mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Add Department Form */}
                        {role === 'ADMIN' && (
                            <div className="lg:col-span-1 border border-slate-200 bg-slate-50/50 p-8 rounded-3xl shadow-sm h-fit">
                                <h3 className={`text-sm font-black uppercase tracking-widest ${textThemeMap[themeColor]} mb-6 flex items-center gap-2`}>
                                    <span className={`w-8 h-px bg-${themeColor}-200`}></span>
                                    New Department
                                </h3>

                                <form onSubmit={handleAddDepartment} className="space-y-6 group" noValidate>
                                    <div className="space-y-2 relative">
                                        <label className="block text-sm font-bold text-slate-700">Department Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={newDepartment}
                                            onChange={(e) => setNewDepartment(e.target.value)}
                                            required
                                            minLength="2"
                                            pattern="^[a-zA-Z\s]+$"
                                            className={`w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl ${ringThemeMap[themeColor]} transition-shadow outline-none peer placeholder-transparent shadow-sm`}
                                            placeholder="E.g. Engineering, Sales"
                                        />
                                        <span className="absolute left-5 top-[39px] text-slate-400 peer-focus:invisible transition-all pointer-events-none mt-px text-sm">E.g. Engineering, Sales</span>
                                        <p className="text-[11px] text-red-500 mt-1 hidden peer-invalid:peer-focus:block">Please enter valid name (letters/spaces only).</p>
                                    </div>
                                    <button
                                        type="submit"
                                        className={`w-full ${bgThemeMap[themeColor]} text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all active:scale-[0.98] focus:outline-none flex justify-center items-center gap-2 group-[*:invalid]:opacity-70 group-[*:invalid]:pointer-events-none`}
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                        Add Department
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* View Departments List */}
                        <div className={`lg:col-span-2 border border-slate-200 bg-slate-50/50 p-8 rounded-3xl shadow-sm ${role !== 'ADMIN' ? 'lg:col-span-3' : ''}`}>
                            <h3 className={`text-sm font-black uppercase tracking-widest ${textThemeMap[themeColor]} mb-6 flex items-center gap-2`}>
                                <span className={`w-8 h-px bg-${themeColor}-200`}></span>
                                Existing Departments
                            </h3>

                            {loading ? (
                                <div className="py-20 flex justify-center items-center gap-3 text-slate-400 font-bold animate-pulse">
                                    <div className={`w-5 h-5 border-2 border-${themeColor}-600 border-t-transparent rounded-full animate-spin`}></div>
                                    Loading Records...
                                </div>
                            ) : departments.length === 0 ? (
                                <div className="py-16 text-center text-slate-500 font-medium italic bg-white rounded-2xl border border-dashed border-slate-300">
                                    No departments configured yet.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {departments.map((dept) => (
                                        <div key={dept.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                                            {/* Accent line on left */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${themeColor}-400 opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                                            {editingDept && editingDept.id === dept.id ? (
                                                <form onSubmit={handleUpdateDepartment} className="flex flex-col gap-3 group/edit" noValidate>
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        required
                                                        minLength="2"
                                                        pattern="^[a-zA-Z\s]+$"
                                                        className={`w-full border-2 border-${themeColor}-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 ${ringThemeMap[themeColor]} outline-none peer`}
                                                        autoFocus
                                                    />
                                                    <p className="text-[10px] text-red-500 hidden peer-invalid:block">Invalid name. Only letters & spaces.</p>

                                                    <div className="flex gap-2 w-full mt-1">
                                                        <button type="submit" className={`flex-1 py-2 bg-${themeColor}-50 hover:bg-${themeColor}-100 text-${themeColor}-700 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors group-[*:invalid]/edit:opacity-50 group-[*:invalid]/edit:pointer-events-none`}>Save Update</button>
                                                        <button type="button" onClick={() => setEditingDept(null)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors">Discard</button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col pl-2">
                                                        <span className="font-extrabold text-slate-800 text-lg">{dept.name}</span>
                                                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Dept ID: #{dept.id}</span>
                                                    </div>

                                                    {role === 'ADMIN' && (
                                                        <div className="flex flex-col gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 pr-1">
                                                            <button
                                                                onClick={() => handleEditClick(dept)}
                                                                className={`p-2 ${textThemeMap[themeColor]} hover:bg-${themeColor}-50 rounded-lg transition-colors`}
                                                                title="Edit Name"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete Department"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                            </button>
                                                        </div>
                                                    )}
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
                .animate-shake {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
            `}} />
        </div>
    );
};

export default AdminDepartments;
