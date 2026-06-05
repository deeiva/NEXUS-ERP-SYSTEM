import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';

const HolidayManager = () => {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ name: '', date: '', description: '' });
    const [message, setMessage] = useState('');
    const currentRole = localStorage.getItem('role');

    useEffect(() => {
        fetchHolidays();
    }, []);

    const fetchHolidays = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/holidays/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHolidays(Array.isArray(res.data) ? res.data : res.data.results || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/api/holidays/`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Holiday added successfully!');
            setFormData({ name: '', date: '', description: '' });
            fetchHolidays();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Error adding holiday.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/holidays/${id}/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchHolidays();
        } catch (err) {
            alert('Error deleting holiday.');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                <div className="p-8 bg-gradient-to-r from-slate-800 to-slate-900 text-white">
                    <h2 className="text-3xl font-extrabold flex items-center gap-3">
                        <span className="p-2 bg-white/10 rounded-xl">📅</span>
                        Holiday Calendar
                    </h2>
                    <p className="mt-2 text-slate-300">View and manage company holidays and public observances.</p>
                </div>

                <div className="p-8">
                    {message && (
                        <div className={`mb-6 p-4 rounded-2xl text-sm font-bold animate-bounce ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {message}
                        </div>
                    )}

                    {(currentRole === 'ADMIN' || currentRole === 'HR') && (
                        <div className="mb-12 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Add New Holiday</h3>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input
                                    type="text"
                                    placeholder="Holiday Name"
                                    className="p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-500 outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                                <input
                                    type="date"
                                    className="p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-500 outline-none"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                                <button type="submit" className="bg-slate-800 text-white font-bold py-3 px-6 rounded-xl hover:bg-slate-700 transition-all shadow-lg active:scale-95">
                                    Add Holiday
                                </button>
                            </form>
                        </div>
                    )}

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            Upcoming Holidays
                        </h3>
                        {loading ? (
                            <div className="p-10 text-center text-slate-400 italic font-medium">Loading holidays...</div>
                        ) : holidays.length === 0 ? (
                            <div className="p-10 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                No holidays found in the record.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {holidays.sort((a, b) => new Date(a.date) - new Date(b.date)).map(h => (
                                    <div key={h.id} className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all flex justify-between items-center group">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-center justify-center w-14 h-14 bg-red-50 text-red-600 rounded-xl border border-red-100">
                                                <span className="text-[10px] font-black uppercase leading-none">{new Date(h.date).toLocaleString('default', { month: 'short' })}</span>
                                                <span className="text-xl font-black">{new Date(h.date).getDate()}</span>
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800">{h.name}</div>
                                                <div className="text-xs text-slate-500 font-medium">
                                                    {new Date(h.date).toLocaleDateString('default', { weekday: 'long', year: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>
                                        {(currentRole === 'ADMIN' || currentRole === 'HR') && (
                                            <button onClick={() => handleDelete(h.id)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">© Nexus ERP - Holiday Management System</p>
                </div>
            </div>
        </div>
    );
};

export default HolidayManager;
