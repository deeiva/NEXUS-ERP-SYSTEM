import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';

const AdminAttendance = () => {
    const [attendances, setAttendances] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [users, setUsers] = useState([]);
    const currentRole = localStorage.getItem('role') || 'EMPLOYEE';

    // Theme based on role (Admin/Employee = Blue, HR = Emerald)
    const themeColor = currentRole === 'HR' ? 'emerald' : 'blue';
    const bgThemeMap = { 'blue': 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 focus:ring-blue-500', 'emerald': 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 focus:ring-emerald-500' };
    const textThemeMap = { 'blue': 'text-blue-600', 'emerald': 'text-emerald-600' };

    // Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(true);
    const [actionMessage, setActionMessage] = useState('');

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentMonth, currentYear]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const usersRes = await axios.get(`${API_BASE_URL}/api/accounts/users/admin/`, { headers }).catch(() => ({ data: [] }));
            let fetchedUsers = Array.isArray(usersRes.data) ? usersRes.data :
                (usersRes.data && Array.isArray(usersRes.data.results)) ? usersRes.data.results : [];

            if (currentRole === 'EMPLOYEE' && fetchedUsers.length === 0) {
                // If admin list fails for employee, fetch their own profile
                const meRes = await axios.get(`${API_BASE_URL}/api/accounts/me/`, { headers }).catch(() => null);
                if (meRes && meRes.data) {
                    fetchedUsers = [meRes.data];
                }
            }

            fetchedUsers.forEach(u => {
                u.derivedRole = u.is_superuser ? 'ADMIN' : (u.status === 0 ? 'HR' : (u.status === 1 ? 'EMPLOYEE' : u.role));
            });

            if (currentRole === 'HR') {
                fetchedUsers = fetchedUsers.filter(u => u.derivedRole !== 'HR' && u.derivedRole !== 'ADMIN');
            } else if (currentRole === 'EMPLOYEE') {
                const myUsername = localStorage.getItem('username');
                const myUserId = localStorage.getItem('userId');
                const myEmpId = localStorage.getItem('employee_id');
                fetchedUsers = fetchedUsers.filter(u =>
                    u.username === myUsername ||
                    String(u.id) === String(myUserId) ||
                    u.email === myUsername ||
                    (u.employee_id && u.employee_id === myEmpId)
                );
            }
            setUsers(fetchedUsers);

            const attRes = await axios.get(`${API_BASE_URL}/api/attendance/`, { headers }).catch(() => ({ data: [] }));
            const fetchedAtt = Array.isArray(attRes.data) ? attRes.data :
                (attRes.data && Array.isArray(attRes.data.results)) ? attRes.data.results : [];
            setAttendances(fetchedAtt);

            const leavesRes = await axios.get(`${API_BASE_URL}/api/leave/`, { headers }).catch(() => ({ data: [] }));
            const fetchedLeaves = Array.isArray(leavesRes.data) ? leavesRes.data :
                (leavesRes.data && Array.isArray(leavesRes.data.results)) ? leavesRes.data.results : [];
            // Filter only approved leaves as requested
            setLeaves(fetchedLeaves.filter(l => l.status === 'APPROVED'));

            const holidaysRes = await axios.get(`${API_BASE_URL}/api/holidays/`, { headers }).catch(() => ({ data: [] }));
            const fetchedHolidays = Array.isArray(holidaysRes.data) ? holidaysRes.data :
                (holidaysRes.data && Array.isArray(holidaysRes.data.results)) ? holidaysRes.data.results : [];
            setHolidays(fetchedHolidays);

        } catch (err) {
            console.error('Failed to fetch data.', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAttendance = async (user, dateStr, isPresent) => {
        if (currentRole === 'EMPLOYEE') return; // Employees cannot mark their own attendance this way

        if (currentRole === 'ADMIN' && user.derivedRole === 'EMPLOYEE') {
            setActionMessage('Admin can only view Employee attendance. HR marks Employee attendance.');
            setTimeout(() => setActionMessage(''), 5000);
            return;
        }
        if (currentRole === 'HR' && user.derivedRole === 'HR') {
            setActionMessage('HR cannot mark HR attendance. Admin marks HR attendance.');
            setTimeout(() => setActionMessage(''), 5000);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const payload = {
                userid: user.employee_id || user.username,
                date: dateStr,
                is_present: !isPresent
            };

            await axios.post(`${API_BASE_URL}/api/attendance/`, payload, { headers });
            fetchData();
        } catch (err) {
            const msg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
            setActionMessage(`Failed to update attendance: Server says ${msg}`);
            setTimeout(() => setActionMessage(''), 5000);
            console.error("Attendance Error:", err.response || err);
        }
    };

    const handleMarkAllPresentToday = async () => {
        if (currentRole === 'EMPLOYEE') return;

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        const targetRole = currentRole === 'HR' ? 'EMPLOYEE' : 'HR';

        const targetUsers = users.filter(u => u.derivedRole === targetRole);
        if (targetUsers.length === 0) {
            setActionMessage(`No ${targetRole} users found to mark present.`);
            setTimeout(() => setActionMessage(''), 5000);
            return;
        }

        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        let successCount = 0;
        let failCount = 0;

        for (const user of targetUsers) {
            const isPresent = attendances.some(a =>
                (String(a.userid) === String(user.username) ||
                    String(a.userid) === String(user.id) ||
                    (user.employee_id && String(a.userid) === String(user.employee_id))) &&
                a.date === todayStr &&
                a.is_present === true
            );
            if (!isPresent) {
                try {
                    await axios.post(`${API_BASE_URL}/api/attendance/`, {
                        userid: user.employee_id || user.username,
                        date: todayStr,
                        is_present: true
                    }, { headers });
                    successCount++;
                } catch (err) {
                    failCount++;
                }
            }
        }

        setActionMessage(`Finished! Successfully marked: ${successCount}, Failed: ${failCount}`);
        setTimeout(() => setActionMessage(''), 5000);
        fetchData();
    };

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const hrUsers = users.filter(u => u.derivedRole === 'HR');
    const empUsers = users.filter(u => u.derivedRole === 'EMPLOYEE');

    const hrPresentCount = hrUsers.filter(user =>
        attendances.some(a =>
            (String(a.userid) === String(user.username) ||
                String(a.userid) === String(user.id) ||
                (user.employee_id && String(a.userid) === String(user.employee_id))) &&
            a.date === todayStr &&
            a.is_present === true
        )
    ).length;

    const empPresentCount = empUsers.filter(user =>
        attendances.some(a =>
            (String(a.userid) === String(user.username) ||
                String(a.userid) === String(user.id) ||
                (user.employee_id && String(a.userid) === String(user.employee_id))) &&
            a.date === todayStr &&
            a.is_present === true
        )
    ).length;

    const hrAbsentCount = hrUsers.length - hrPresentCount;
    const empAbsentCount = empUsers.length - empPresentCount;

    return (
        <div className="animate-fadeIn max-w-[1400px] mx-auto pb-12">
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative">

                <div className={`h-2 w-full bg-gradient-to-r from-${themeColor}-400 to-${themeColor}-600`}></div>

                <div className="p-8 md:p-10 border-b border-gray-100 bg-slate-50/50">
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                        <span className={`p-2 bg-${themeColor}-100 ${textThemeMap[themeColor]} rounded-xl shadow-inner`}>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </span>
                        Daily Attendance
                    </h1>
                    <p className="mt-2 text-slate-500 font-medium ml-12">Manage and view daily presence records across the organization.</p>
                </div>

                <div className="p-8 md:p-10">
                    {actionMessage && (
                        <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 flex items-start gap-4 animate-fadeIn shadow-sm">
                            <svg className="w-6 h-6 text-slate-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <div>
                                <h4 className="font-bold text-slate-800">Notice</h4>
                                <p className="text-sm mt-1">{actionMessage}</p>
                            </div>
                        </div>
                    )}

                    {currentRole !== 'EMPLOYEE' ? (
                        <div className={`grid gap-6 mb-10 ${currentRole === 'HR' ? 'grid-cols-2 lg:grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
                            {currentRole !== 'HR' && (
                                <>
                                    <div className="p-6 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white flex items-center justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-100 rounded-full opacity-50 group-hover:scale-150 transition-transform"></div>
                                        <div className="relative z-10">
                                            <div className="text-xs text-purple-600 font-black tracking-widest uppercase mb-1">HR Present Today</div>
                                            <div className="text-3xl font-extrabold text-slate-800">{hrPresentCount} <span className="text-sm text-slate-400 font-medium">/ {hrUsers.length}</span></div>
                                        </div>
                                    </div>
                                    <div className="p-6 rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white flex items-center justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-100 rounded-full opacity-50 group-hover:scale-150 transition-transform"></div>
                                        <div className="relative z-10">
                                            <div className="text-xs text-rose-600 font-black tracking-widest uppercase mb-1">HR Absent Today</div>
                                            <div className="text-3xl font-extrabold text-slate-800">{hrAbsentCount}</div>
                                        </div>
                                    </div>
                                </>
                            )}
                            <div className="p-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white flex items-center justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-100 rounded-full opacity-50 group-hover:scale-150 transition-transform"></div>
                                <div className="relative z-10">
                                    <div className="text-xs text-blue-600 font-black tracking-widest uppercase mb-1">Emp Present Today</div>
                                    <div className="text-3xl font-extrabold text-slate-800">{empPresentCount} <span className="text-sm text-slate-400 font-medium">/ {empUsers.length}</span></div>
                                </div>
                            </div>
                            <div className="p-6 rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white flex items-center justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-orange-100 rounded-full opacity-50 group-hover:scale-150 transition-transform"></div>
                                <div className="relative z-10">
                                    <div className="text-xs text-orange-600 font-black tracking-widest uppercase mb-1">Emp Absent Today</div>
                                    <div className="text-3xl font-extrabold text-slate-800">{empAbsentCount}</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            <div className="p-6 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                <div className="text-xs text-emerald-600 font-black tracking-widest uppercase mb-1">Present Days</div>
                                <div className="text-3xl font-extrabold text-slate-800">
                                    {attendances.filter(a =>
                                        (String(a.userid) === String(localStorage.getItem('username')) ||
                                            String(a.userid) === String(localStorage.getItem('userId')) ||
                                            (localStorage.getItem('employee_id') && String(a.userid) === String(localStorage.getItem('employee_id')))) &&
                                        new Date(a.date).getMonth() === currentMonth &&
                                        new Date(a.date).getFullYear() === currentYear &&
                                        a.is_present).length}
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wider">This Month</p>
                            </div>
                            <div className="p-6 rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                <div className="text-xs text-amber-600 font-black tracking-widest uppercase mb-1">Leave Days</div>
                                <div className="text-3xl font-extrabold text-slate-800">
                                    {leaves.filter(l =>
                                        (String(l.employee_id) === String(localStorage.getItem('username')) ||
                                            String(l.employee_id) === String(localStorage.getItem('userId')) ||
                                            (localStorage.getItem('employee_id') && String(l.employee_id) === String(localStorage.getItem('employee_id')))) &&
                                        l.status === 'APPROVED' &&
                                        new Date(l.start_date).getMonth() === currentMonth).length}
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wider">Approved Leave</p>
                            </div>
                            <div className="p-6 rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                <div className="text-xs text-rose-600 font-black tracking-widest uppercase mb-1">Absent / Missing</div>
                                <div className="text-3xl font-extrabold text-slate-800">
                                    {(() => {
                                        const totalDaysSoFar = currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear() ? new Date().getDate() : daysInMonth;
                                        const present = attendances.filter(a =>
                                            (String(a.userid) === String(localStorage.getItem('username')) ||
                                                String(a.userid) === String(localStorage.getItem('userId')) ||
                                                (localStorage.getItem('employee_id') && String(a.userid) === String(localStorage.getItem('employee_id')))) &&
                                            new Date(a.date).getMonth() === currentMonth &&
                                            new Date(a.date).getFullYear() === currentYear &&
                                            a.is_present).length;
                                        const onLeave = leaves.filter(l =>
                                            (String(l.employee_id) === String(localStorage.getItem('username')) ||
                                                String(l.employee_id) === String(localStorage.getItem('userId')) ||
                                                (localStorage.getItem('employee_id') && String(l.employee_id) === String(localStorage.getItem('employee_id')))) &&
                                            l.status === 'APPROVED' &&
                                            new Date(l.start_date).getMonth() === currentMonth).length;
                                        return Math.max(0, totalDaysSoFar - present - onLeave);
                                    })()}
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wider">Estimated</p>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-50 border border-slate-200/60 rounded-2xl p-6 mb-8 shadow-inner gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`bg-white shadow-sm p-3 rounded-xl ${textThemeMap[themeColor]} font-bold`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            </div>
                            <div>
                                <div className="text-xl font-extrabold text-slate-800">{monthNames[currentMonth]} {currentYear}</div>
                                <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Select Period</div>
                            </div>
                        </div>
                        <div className="flex items-center flex-wrap gap-4">
                            {currentRole !== 'EMPLOYEE' && (
                                <button onClick={handleMarkAllPresentToday} className={`${bgThemeMap[themeColor]} text-white px-6 py-3 rounded-xl text-sm font-bold shadow-sm transition-all whitespace-nowrap active:scale-[0.98]`}>
                                    {currentRole === 'HR' ? 'Mark All Employees Present' : 'Mark All HR Present (Today)'}
                                </button>
                            )}
                            <div className="flex gap-2 text-slate-400 border-l-2 border-slate-200 pl-4">
                                <button onClick={handlePrevMonth} className="bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-600 p-2.5 rounded-xl transition shadow-sm">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
                                </button>
                                <button onClick={handleNextMonth} className="bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-600 p-2.5 rounded-xl transition shadow-sm">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="border-2 border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white relative">
                        {/* Fake shadow overlay for horizontal scrolling cue */}
                        <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>

                        <div className="overflow-x-auto custom-scrollbar pb-2">
                            <table className="w-full text-left border-collapse min-w-max">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b-2 border-slate-100">
                                        <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap min-w-[220px] sticky left-0 bg-slate-50/95 backdrop-blur z-20 shadow-[1px_0_0_0_#f1f5f9]">
                                            Personnel Name
                                        </th>
                                        {days.map(day => {
                                            const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                                            const dateObj = new Date(currentYear, currentMonth, day);
                                            const dayOfWeek = dateObj.getDay(); // 0 = Sunday
                                            const isSunday = dayOfWeek === 0;

                                            // Check for 2nd and 4th Saturday
                                            const isSaturday = dayOfWeek === 6;
                                            let isHolidaySat = false;
                                            if (isSaturday) {
                                                const dayOfMonth = dateObj.getDate();
                                                if ((dayOfMonth > 7 && dayOfMonth <= 14) || (dayOfMonth > 21 && dayOfMonth <= 28)) {
                                                    isHolidaySat = true;
                                                }
                                            }

                                            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                            const publicHoliday = holidays.find(h => h.date === dateStr);
                                            const isWeekendOrHoliday = isSunday || isHolidaySat || publicHoliday;

                                            return (
                                                <th key={day} className={`p-2 py-5 text-center text-xs font-black uppercase min-w-[48px] ${isToday ? `text-${themeColor}-600 bg-white` : (isWeekendOrHoliday ? 'text-red-500 bg-red-50/30' : 'text-slate-500')}`} title={publicHoliday ? publicHoliday.name : (isSunday ? 'Sunday' : (isHolidaySat ? '2nd/4th Saturday' : ''))}>
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <span>{day}</span>
                                                        {isToday ? (
                                                            <div className={`w-1.5 h-1.5 rounded-full bg-${themeColor}-500 animate-pulse`}></div>
                                                        ) : (
                                                            <div className={`w-1 h-1 rounded-full ${isWeekendOrHoliday ? 'bg-red-300' : 'bg-slate-300'}`}></div>
                                                        )}
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={daysInMonth + 1} className="p-10 text-center text-slate-400 font-bold bg-slate-50 italic">Loading attendance records...</td></tr>
                                    ) : users.length === 0 ? (
                                        <tr><td colSpan={daysInMonth + 1} className="p-10 text-center text-slate-400 font-bold bg-slate-50 italic">No associated personnel records found.</td></tr>
                                    ) : (
                                        users.map((user, idx) => (
                                            <tr key={user.id || user.username} className={`border-b border-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-slate-50`}>
                                                <td className="p-4 sticky left-0 bg-inherit backdrop-blur z-10 shadow-[1px_0_0_0_#f8fafc]">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shadow-sm border uppercase ${user.derivedRole === 'HR' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {(user.name ? user.name.charAt(0) : (user.username ? user.username.charAt(0) : 'U'))}
                                                        </div>
                                                        <div>
                                                            <div className="font-extrabold text-sm text-slate-800 whitespace-nowrap">{user.name || user.username}</div>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{user.username}</span>
                                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border ${user.derivedRole === 'HR' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                                    {user.derivedRole || 'EMP'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                {days.map(day => {
                                                    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                    const isFuture = new Date(dateStr) > today;

                                                    const isPresent = attendances.some(a =>
                                                        (String(a.userid) === String(user.username) ||
                                                            String(a.userid) === String(user.id) ||
                                                            (user.employee_id && String(a.userid) === String(user.employee_id))) &&
                                                        a.date === dateStr &&
                                                        a.is_present === true
                                                    );

                                                    const isOnLeave = leaves.some(l =>
                                                        (String(l.employee_id) === String(user.username) ||
                                                            String(l.employee_id) === String(user.id) ||
                                                            (user.employee_id && String(l.employee_id) === String(user.employee_id))) &&
                                                        l.status === 'APPROVED' &&
                                                        dateStr >= l.start_date && dateStr <= l.end_date
                                                    );

                                                    const dateObj = new Date(currentYear, currentMonth, day);
                                                    const dayOfWeek = dateObj.getDay();
                                                    const isSunday = dayOfWeek === 0;
                                                    const isSaturday = dayOfWeek === 6;
                                                    let isHolidaySat = false;
                                                    if (isSaturday) {
                                                        const d = dateObj.getDate();
                                                        if ((d > 7 && d <= 14) || (d > 21 && d <= 28)) isHolidaySat = true;
                                                    }
                                                    const publicHoliday = holidays.find(h => h.date === dateStr);
                                                    const isHoliday = isSunday || isHolidaySat || publicHoliday;

                                                    const isInteractive = (currentRole === 'ADMIN' && user.derivedRole === 'HR') ||
                                                        (currentRole === 'HR' && user.derivedRole === 'EMPLOYEE');

                                                    return (
                                                        <td key={dateStr} className={`p-2 text-center border-l border-slate-50 ${isFuture ? 'bg-slate-50/50' : (isHoliday ? 'bg-red-50/20' : '')}`}>
                                                            {!isFuture ? (
                                                                isOnLeave ? (
                                                                    <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 text-amber-600 shadow-sm border border-amber-200 mx-auto" title="On Leave">
                                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                                                                    </div>
                                                                ) : isHoliday ? (
                                                                    <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-100 text-red-600 shadow-sm border border-red-200 mx-auto" title={publicHoliday ? publicHoliday.name : (isSunday ? 'Sunday' : '2nd/4th Saturday')}>
                                                                        <span className="text-[10px] font-black">H</span>
                                                                    </div>
                                                                ) : (
                                                                    <div
                                                                        onClick={() => handleToggleAttendance(user, dateStr, isPresent)}
                                                                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 mx-auto ${isPresent
                                                                            ? 'bg-emerald-500 text-white shadow shadow-emerald-200'
                                                                            : 'bg-white border-2 border-slate-200 hover:border-slate-300 shadow-sm'
                                                                            } ${!isInteractive ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:scale-110 active:scale-95'}`}
                                                                    >
                                                                        {isPresent && (
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7"></path></svg>
                                                                        )}
                                                                    </div>
                                                                )
                                                            ) : (
                                                                <div className="w-7 h-7 mx-auto rounded-lg bg-slate-100 opacity-50"></div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-xs font-bold text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-100 gap-4">
                        <div className="flex flex-wrap items-center justify-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-lg bg-emerald-500 shadow-sm border border-emerald-600"></div>
                                <span className="uppercase tracking-wider">Present</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 text-[8px]">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                                </div>
                                <span className="uppercase tracking-wider text-[10px]">Approved Leave</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center text-red-600">
                                    <span className="text-[10px] font-black">H</span>
                                </div>
                                <span className="uppercase tracking-wider text-[10px]">Holiday / Weekend</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-lg border-2 border-slate-300 bg-white"></div>
                                <span className="uppercase tracking-wider">Absent / Untracked</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-lg bg-slate-200 opacity-50"></div>
                                <span className="uppercase tracking-wider">Future</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { height: 10px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-radius: 8px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}} />
        </div>
    );
};

export default AdminAttendance;



