import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';

function EmployeeDashboard() {
    const username = localStorage.getItem('username');
    const [holidays, setHolidays] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        try {
            const hRes = await axios.get(`${API_BASE_URL}/api/holidays/`, { headers });
            setHolidays(Array.isArray(hRes.data) ? hRes.data : hRes.data.results || []);

            const lRes = await axios.get(`${API_BASE_URL}/api/leave/`, { headers });
            const fetchedLeaves = Array.isArray(lRes.data) ? lRes.data : lRes.data.results || [];
            setLeaves(fetchedLeaves.filter(l => l.status === 'APPROVED' && l.userid === username));
        } catch (err) {
            console.error('Failed to fetch dashboard data', err);
        }
    };

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const days = Array.from({ length: getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()) }, (_, i) => i + 1);

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    return (
        <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-12">

            <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-3xl p-10 shadow-lg text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-400 opacity-20 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 w-full">
                    <h1 className="text-4xl font-extrabold tracking-tight mb-2 drop-shadow-sm flex items-center gap-3">
                        Welcome Back, {username || 'Employee'}!
                        <span className="text-2xl animate-pulse">✨</span>
                    </h1>
                    <p className="text-blue-100 font-medium text-lg max-w-xl">
                        Here is an overview of your activity and professional status today.
                    </p>
                </div>

                <div className="relative z-10 hidden md:block mt-6 md:mt-0">
                    <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
                        <div className="text-blue-50 text-xs font-bold uppercase tracking-widest text-center mb-1 opacity-80">Current Date</div>
                        <div className="text-2xl font-black tracking-wider">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                </div>
            </div>

            <h3 className="text-sm font-black uppercase tracking-widest text-blue-600 flex items-center gap-2 pt-4">
                <span className="w-8 h-px bg-blue-200"></span>
                Key Metrics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Status Card */}
                <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col gap-6 transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>

                    <div className="flex items-start justify-between">
                        <div className="h-16 w-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Today's Status</p>
                        <h3 className="text-4xl font-extrabold text-slate-800 flex items-center gap-3">
                            Present
                            <span className="flex h-4 w-4 relative mb-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                            </span>
                        </h3>
                    </div>
                </div>

                {/* Leaves Available Card */}
                <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col gap-6 transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>

                    <div className="flex items-start justify-between">
                        <div className="h-16 w-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Upcoming Holidays</p>
                        <h3 className="text-4xl font-extrabold text-slate-800 flex items-baseline gap-2">
                            2 <span className="text-sm font-bold text-slate-400 tracking-wider">Events</span>
                        </h3>
                    </div>
                </div>

                {/* Tasks / Requests Card */}
                <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col gap-6 transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>

                    <div className="flex items-start justify-between">
                        <div className="h-16 w-16 bg-gradient-to-br from-purple-100 to-fuchsia-100 rounded-2xl flex items-center justify-center text-purple-600 shadow-inner group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Open Requests</p>
                        <h3 className="text-4xl font-extrabold text-slate-800 flex items-baseline gap-2">
                            0 <span className="text-sm font-bold text-emerald-500 flex items-center"><svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>All Clear</span>
                        </h3>
                    </div>
                </div>
            </div>

            {/* Calendar View Section */}
            <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mt-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                            <span className="w-8 h-px bg-blue-200"></span>
                            Work Calendar
                        </h3>
                        <p className="text-slate-400 text-xs font-bold mt-1 ml-10">Read-only view of holidays and appoved leaves</p>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                        <button onClick={prevMonth} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-blue-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <span className="font-black text-slate-700 w-32 text-center uppercase tracking-widest text-xs">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={nextMonth} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-blue-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-[10px] font-black text-slate-300 uppercase py-2">
                            {day}
                        </div>
                    ))}

                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square"></div>
                    ))}

                    {days.map(day => {
                        const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                        const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isSunday = dateObj.getDay() === 0;
                        const isSaturday = dateObj.getDay() === 6;
                        let isHolidaySat = false;
                        if (isSaturday) {
                            if ((day > 7 && day <= 14) || (day > 21 && day <= 28)) isHolidaySat = true;
                        }
                        const holiday = holidays.find(h => h.date === dateStr);
                        const isHoliday = isSunday || isHolidaySat || holiday;
                        const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();

                        const onLeave = leaves.some(l => dateStr >= l.start_date && dateStr <= l.end_date);

                        return (
                            <div key={day} className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all border ${isToday ? 'border-blue-500 shadow-lg shadow-blue-100 ring-2 ring-blue-50' : 'border-slate-50'
                                } ${isHoliday ? 'bg-red-50/50' : onLeave ? 'bg-amber-50/50' : 'bg-slate-50/30'}`}>
                                <span className={`text-xs font-black ${isHoliday ? 'text-red-500' : isToday ? 'text-blue-600' : 'text-slate-700'}`}>
                                    {day}
                                </span>

                                <div className="mt-1 flex gap-0.5">
                                    {isHoliday && <div className="w-1.5 h-1.5 rounded-full bg-red-400" title={holiday?.name || 'Weekend'}></div>}
                                    {onLeave && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Approved Leave"></div>}
                                </div>

                                {holiday && (
                                    <div className="absolute -top-1 -right-1 group">
                                        <div className="bg-red-500 text-white text-[6px] font-black px-1 rounded-full animate-bounce">H</div>
                                        <div className="absolute hidden group-hover:block bg-slate-800 text-white text-[8px] p-2 rounded-lg -top-10 left-0 w-24 z-50 shadow-xl border border-slate-600">
                                            {holiday.name}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex flex-wrap items-center gap-6 mt-8 pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Holidays / Sundays</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Approved Leave</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full border-2 border-blue-500"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Today</span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 mt-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-slate-50 rounded-bl-[100px] pointer-events-none"></div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2 relative z-10">
                    <span className="w-8 h-px bg-slate-300"></span>
                    Recent Announcements
                </h3>
                <div className="bg-slate-50/80 rounded-2xl p-8 border border-slate-200 text-center text-slate-500 font-medium relative z-10">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                    </div>
                    You're all caught up! No recent announcements from HR.
                </div>
            </div>
        </div>
    );
}

export default EmployeeDashboard;
