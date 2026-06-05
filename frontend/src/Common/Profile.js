import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});

    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role') || 'EMPLOYEE';
    const themeColor = role === 'HR' ? 'emerald' : 'blue';

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');

                // Directly fetch current user profile via the robust 'me' endpoint if possible
                let userData = null;
                try {
                    const meRes = await axios.get(`${API_BASE_URL}/api/accounts/me/`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (meRes.data && meRes.data.username) {
                        userData = meRes.data;
                    }
                } catch (e) {
                    console.log('Fallback to fetching all users');
                }

                // Fallback to checking from admin list
                if (!userData) {
                    const response = await axios.get(`${API_BASE_URL}/api/accounts/users/admin/`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const users = Array.isArray(response.data) ? response.data :
                        (response.data && Array.isArray(response.data.results)) ? response.data.results : [];
                    userData = users.find(u => u.username === username || u.name === username || u.email === username);
                }

                if (userData) {
                    setProfile(userData);
                    setFormData({
                        name: userData.name || userData.username || '',
                        email: userData.email || '',
                        mobile: userData.mobile || '',
                        address: userData.address || '',
                        qualification: userData.qualification || '',
                        bank_name: userData.bank_name || '',
                        account_number: userData.account_number || '',
                        ifsc_code: userData.ifsc_code || '',
                        // allowances: userData.allowances || '',
                    });
                } else {
                    setError("Failed to locate profile data in the registry.");
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
                setError("Network error: Unable to load profile details.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [username]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            // Try updating via username
            await axios.patch(`${API_BASE_URL}/api/accounts/users/${profile.username}/`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess("Personal profile updated seamlessly!");
            setTimeout(() => setSuccess(""), 5000);
            setIsEditing(false);
            setProfile(prev => ({ ...prev, ...formData }));
        } catch (err) {
            console.error("Error updating profile:", err);
            setError(err.response?.data?.detail || err.response?.data?.error || "We encountered an issue saving your profile.");
            setTimeout(() => setError(""), 5000);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-[50vh] gap-4">
                <div className={`w-12 h-12 border-4 border-${themeColor}-600 border-t-transparent rounded-full animate-spin`}></div>
                <p className="text-slate-400 font-bold animate-pulse">Retrieving Profile...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="max-w-4xl mx-auto p-4 bg-red-50 text-red-600 rounded-2xl shadow-sm border border-red-100 font-bold flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                {error || "Profile initialization failed."}
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-12 animate-fadeIn">

            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden relative group">
                {/* Header background abstract */}
                <div className={`absolute top-0 left-0 right-0 h-48 bg-gradient-to-br from-${themeColor}-600 to-${themeColor}-800 opacity-90`}>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                </div>

                <div className="relative pt-32 px-8 pb-8 md:px-12 md:pb-12">
                    <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6">

                        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
                            {/* Avatar */}
                            <div className="relative group/avatar">
                                <div className={`w-36 h-36 rounded-full bg-white shadow-2xl p-1.5 z-10 relative`}>
                                    <div className={`w-full h-full rounded-full bg-gradient-to-br from-${themeColor}-100 to-${themeColor}-200 flex items-center justify-center text-${themeColor}-600 font-black text-6xl shadow-inner`}>
                                        {profile.name ? profile.name.charAt(0).toUpperCase() : (profile.username ? profile.username.charAt(0).toUpperCase() : 'U')}
                                    </div>
                                </div>
                                <div className={`absolute inset-0 bg-${themeColor}-400 rounded-full blur-xl opacity-0 group-hover/avatar:opacity-40 transition-opacity duration-500`}></div>
                            </div>

                            {/* Identity Info */}
                            <div className="text-center md:text-left -mt-2 md:mt-0 mb-2 md:mb-4">
                                <h1 className="text-4xl font-black text-slate-800 tracking-tight">{profile.name || profile.username}</h1>
                                <p className="text-slate-500 font-bold mt-1.5 flex items-center justify-center md:justify-start gap-2">
                                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    {profile.email || 'No email attached'}
                                </p>
                                <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2.5">
                                    <span className={`px-4 py-1.5 bg-${themeColor}-50 border border-${themeColor}-100 text-${themeColor}-700 text-xs font-black rounded-lg uppercase tracking-widest shadow-sm`}>
                                        {profile.role || role}
                                    </span>
                                    {profile.department && (
                                        <span className="px-4 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black rounded-lg uppercase tracking-widest shadow-sm">
                                            {profile.department} Section
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className={`self-center md:self-end md:mb-4 px-8 py-3.5 bg-white border-2 border-slate-200 hover:border-${themeColor}-500 text-slate-700 hover:text-${themeColor}-600 rounded-2xl font-black uppercase tracking-widest shadow-sm transition-all active:scale-95 text-xs flex items-center gap-2`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                Modify Settings
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-8 md:px-12 md:pb-12 pt-0 border-t border-slate-100 bg-slate-50/50 mt-4 rounded-b-[2rem]">

                    {error && (
                        <div className="mt-8 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-sm font-bold flex items-center gap-3 animate-shake shadow-sm">
                            <div className="p-1.5 bg-red-100 rounded-lg"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mt-8 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200 text-sm font-bold flex items-center gap-3 animate-fadeIn shadow-sm">
                            <div className="p-1.5 bg-emerald-100 rounded-lg"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg></div>
                            {success}
                        </div>
                    )}

                    <div className="mt-10">
                        {!isEditing ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {/* Personal Block */}
                                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-5"><svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg></div>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                                        <span className={`w-8 h-1 rounded-full bg-${themeColor}-500`}></span> Personnel Details
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-4 relative z-10">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Direct Line</p>
                                            <p className="font-bold text-slate-800 text-lg font-mono">{profile.mobile || <span className="text-slate-300 font-sans italic text-base">Unassigned</span>}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Academic Qualification</p>
                                            <p className="font-bold text-slate-800 capitalize">{profile.qualification || <span className="text-slate-300 italic">Unassigned</span>}</p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Primary Residence</p>
                                            <p className="font-bold text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                {profile.address || <span className="text-slate-300 italic">No address on file</span>}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Onboarding Date</p>
                                            <p className="font-bold text-slate-800 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 inline-block text-sm">
                                                {profile.joining_date || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Block */}
                                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-5"><svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg></div>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                                        <span className="w-8 h-1 rounded-full bg-indigo-400"></span> Financial Credentials
                                    </h3>

                                    <div className="grid grid-cols-1 gap-y-8 relative z-10">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2 md:col-span-1">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Bank Institutional Name</p>
                                                <p className="font-bold text-slate-800 text-lg">{profile.bank_name || <span className="text-slate-300 italic text-base">Unassigned</span>}</p>
                                            </div>
                                            <div className="col-span-2 md:col-span-1">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Branch IFSC Code</p>
                                                <p className="font-bold text-slate-800 text-lg uppercase tracking-wider font-mono bg-slate-50 p-2 rounded-lg border border-slate-100 inline-block">{profile.ifsc_code || <span className="text-slate-300 italic text-base font-sans">N/A</span>}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Direct Deposit Account Number</p>
                                            <p className="font-bold text-slate-800 text-xl tracking-widest font-mono bg-slate-900 text-slate-100 p-4 rounded-xl shadow-inner border border-slate-800 flex items-center gap-4">
                                                <svg className="w-6 h-6 text-slate-500 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                                {profile.account_number ? `**** ${profile.account_number.slice(-4)}` : <span className="text-slate-500 italic text-base font-sans">No account linked</span>}
                                            </p>
                                        </div>

                                        <div className="border-t border-slate-100 pt-6 mt-2 flex flex-col gap-4">
                                            <div className="flex justify-between items-center">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly Base Salary</p>
                                                <p className="font-bold text-xl text-slate-800">
                                                    {profile.salary ? `₹${parseFloat(profile.salary).toLocaleString('en-IN')}` : <span className="text-slate-300 text-lg">Classified</span>}
                                                </p>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Allowances</p>
                                                <p className="font-bold text-xl text-emerald-600">
                                                    {profile.allowances ? `+ ₹${parseFloat(profile.allowances).toLocaleString('en-IN')}` : <span className="text-slate-300 text-lg">None</span>}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleUpdate} className="bg-white rounded-3xl p-10 border border-slate-100 shadow-xl shadow-slate-200/50">
                                <h3 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                                    <span className={`w-10 h-10 rounded-xl bg-${themeColor}-100 text-${themeColor}-600 flex items-center justify-center`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></span>
                                    Edit Profile Registry
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Legal Name</label>
                                        <input type="text" name="name" value={formData.name} onChange={handleChange} className={`w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-${themeColor}-500/20 focus:border-${themeColor}-500 transition-all font-bold text-slate-700`} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mobile Number</label>
                                        <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} className={`w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-${themeColor}-500/20 focus:border-${themeColor}-500 transition-all font-mono font-bold text-slate-700`} />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Permanent Address</label>
                                        <textarea name="address" value={formData.address} onChange={handleChange} className={`w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-${themeColor}-500/20 focus:border-${themeColor}-500 transition-all font-bold text-slate-700 resize-none`} rows="3"></textarea>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Academic Qualification</label>
                                        <input type="text" name="qualification" value={formData.qualification} onChange={handleChange} className={`w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-${themeColor}-500/20 focus:border-${themeColor}-500 transition-all font-bold text-slate-700`} />
                                    </div>
                                    {/* <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Allowances (₹)</label>
                                        <input type="number" name="allowances" value={formData.allowances} onChange={handleChange} className={`w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-${themeColor}-500/20 focus:border-${themeColor}-500 transition-all font-bold text-slate-700`} />
                                    </div> */}

                                    <div className="md:col-span-2 mt-4 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><svg className="w-3.5 h-3.5 block" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10.496 2.132a1 1 0 00-.992 0l-7 4A1 1 0 003 8v7a1 1 0 100 2h14a1 1 0 100-2V8a1 1 0 00-.504-.868l-7-4zM6 9a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1zm3 1a1 1 0 012 0v3a1 1 0 11-2 0v-3zm5-1a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1z" clipRule="evenodd" /></svg> Bank Institutional Name</label>
                                            <input type="text" name="bank_name" value={formData.bank_name} onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-700" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Number</label>
                                            <input type="text" name="account_number" value={formData.account_number} onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono font-bold text-white tracking-widest placeholder-slate-600" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch IFSC Code</label>
                                            <input type="text" name="ifsc_code" value={formData.ifsc_code} onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-bold uppercase text-slate-700" />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-10 flex gap-4 pt-6 border-t border-slate-100">
                                    <button type="button" onClick={() => setIsEditing(false)} className="px-8 py-4 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 flex-1 md:flex-none">
                                        Discard
                                    </button>
                                    <button type="submit" disabled={updating} className={`px-8 py-4 bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg shadow-${themeColor}-200 flex-1 md:flex-none flex justify-center items-center gap-2`}>
                                        {updating ? (
                                            <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> Syncing</>
                                        ) : 'Commit Updates'}
                                    </button>
                                </div>
                            </form>
                        )}
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

export default Profile;
