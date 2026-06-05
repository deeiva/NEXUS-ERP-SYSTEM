import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../apiConfig';

function Register() {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: '', mobile: '', address: '',
        qualification: '', joining_date: '', salary: '', allowances: '', department: '',
        bank_name: '', account_number: '', ifsc_code: ''
    });

    const [image, setImage] = useState(null);

    // Get color theme based on the user's role (Admin = Blue, HR = Emerald)
    const creatorRole = localStorage.getItem('role');
    const themeColor = creatorRole === 'ADMIN' ? 'blue' : 'emerald';
    const bgThemeMap = {
        'blue': 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-blue-200',
        'emerald': 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 shadow-emerald-200'
    };
    const textThemeMap = {
        'blue': 'text-blue-600',
        'emerald': 'text-emerald-600'
    };
    const ringThemeMap = {
        'blue': 'focus:ring-blue-500 focus:border-blue-500',
        'emerald': 'focus:ring-emerald-500 focus:border-emerald-500'
    };

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                const response = await axios.get(`${API_BASE_URL}/api/hr/departments/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const depts = Array.isArray(response.data) ? response.data :
                    (response.data && Array.isArray(response.data.results)) ? response.data.results : [];
                setDepartments(depts);

                if (creatorRole === 'ADMIN') {
                    const hrDept = depts.find(d =>
                        d.name.toLowerCase() === 'human resources' || d.name.toLowerCase() === 'hr'
                    );
                    setFormData(prev => ({ ...prev, role: 'HR', department: hrDept ? hrDept.id : (depts[0]?.id || '') }));
                } else if (creatorRole === 'HR') {
                    setFormData(prev => ({ ...prev, role: 'EMPLOYEE', department: depts[0]?.id || '' }));
                }
            } catch (err) {
                console.error("Failed to fetch departments:", err);
                if (creatorRole === 'ADMIN') {
                    setFormData(prev => ({ ...prev, role: 'HR', department: 'Human Resources' }));
                } else {
                    setFormData(prev => ({ ...prev, role: 'EMPLOYEE' }));
                }
            }
        };

        fetchDepartments();
    }, [creatorRole, navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        setImage(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Frontend Validations beyond HTML5
        if (formData.mobile.length < 10 || formData.mobile.length > 15) {
            setError("Mobile number must be between 10 to 15 digits.");
            setLoading(false);
            return;
        }

        const formattedIFSC = formData.ifsc_code.toUpperCase().trim();
        if (formattedIFSC && !/^[A-Z0-9]{11}$/.test(formattedIFSC)) {
            setError("Invalid IFSC Code format. Please enter a valid 11-character code.");
            setLoading(false);
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            setError("Session expired. Please login again.");
            setLoading(false);
            return;
        }

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'ifsc_code') {
                data.append(key, formattedIFSC);
            } else if (key === 'department') {
                // Send the ID (PK) as expected by the backend PrimaryKeyRelatedField
                data.append(key, formData.department);
            } else {
                data.append(key, formData[key]);
            }
        });
        if (image) {
            data.append('image', image);
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/api/accounts/register/`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });
            setSuccess(response.data.message || "Registration successful!");

            const currentRole = formData.role;
            const currentDept = currentRole === 'HR' ? formData.department : '';
            setFormData({
                name: '', email: '', password: '', role: currentRole, mobile: '', address: '',
                qualification: '', joining_date: '', salary: '', allowances: '', department: currentDept,
                bank_name: '', account_number: '', ifsc_code: ''
            });
            setImage(null);
            const fileInput = document.getElementById('image');
            if (fileInput) fileInput.value = '';
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) {
                setError("Your token has expired. Please log out and login again to refresh your session.");
            } else if (err.response?.data) {
                const data = err.response.data;
                if (data.error || data.detail) {
                    setError(data.error || data.detail);
                } else if (typeof data === 'object') {
                    const errorMessages = Object.keys(data).map(key => {
                        const message = Array.isArray(data[key]) ? data[key][0] : data[key];
                        return `${key}: ${message}`;
                    });
                    setError(errorMessages.join(' | '));
                } else {
                    setError("Registration failed. Please check your data.");
                }
            } else {
                setError("Registration failed. Network error.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fadeIn max-w-5xl mx-auto pb-12">
            <div className={`bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative`}>

                {/* Decorative header accent */}
                <div className={`h-2 w-full bg-gradient-to-r from-${themeColor}-400 to-${themeColor}-600`}></div>

                <div className="p-8 border-b border-gray-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                            <span className={`p-2 bg-${themeColor}-100 text-${themeColor}-600 rounded-xl`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                            </span>
                            Register {formData.role || 'User'}
                        </h1>
                        <p className="mt-2 text-slate-500 font-medium ml-12">Create a new {formData.role?.toLowerCase() || 'staff'} account in the system.</p>
                    </div>
                </div>

                <div className="p-8 md:p-10">
                    {error && (
                        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-start gap-4 animate-shake">
                            <svg className="w-6 h-6 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <div>
                                <h4 className="font-bold text-red-800">Registration Failed</h4>
                                <p className="text-sm mt-1">{error}</p>
                            </div>
                        </div>
                    )}
                    {success && (
                        <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 flex items-start gap-4">
                            <svg className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <div>
                                <h4 className="font-bold text-emerald-800">Success!</h4>
                                <p className="text-sm mt-1">{success}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-10 group" noValidate>

                        {/* Section: Personal Info */}
                        <section>
                            <h2 className={`text-sm font-black uppercase tracking-widest ${textThemeMap[themeColor]} mb-6 flex items-center gap-2`}>
                                <span className={`w-8 h-px bg-${themeColor}-200`}></span>
                                Personal Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-2 relative">
                                    <label className="block text-sm font-bold text-slate-700">Full Name <span className="text-red-500">*</span></label>
                                    <input type='text' name='name' value={formData.name} onChange={handleChange} required minLength="3" maxLength="100" pattern="^[a-zA-Z\s]*$" className={`w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl ${ringThemeMap[themeColor]} transition-shadow outline-none peer placeholder-transparent focus:bg-white`} placeholder='John Doe' />
                                    <span className="absolute left-5 top-[39px] text-slate-400 peer-focus:invisible transition-all pointer-events-none mt-px text-sm">John Doe</span>
                                    <p className="text-[11px] text-red-500 mt-1 hidden peer-invalid:peer-focus:block transition-all">Please enter a valid full name without numbers or special symbols.</p>
                                </div>

                                <div className="space-y-2 relative">
                                    <label className="block text-sm font-bold text-slate-700">Email Address <span className="text-red-500">*</span></label>
                                    <input type='email' name='email' value={formData.email} onChange={handleChange} required className={`w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl ${ringThemeMap[themeColor]} transition-shadow outline-none peer placeholder-transparent focus:bg-white`} placeholder='email@example.com' />
                                    <span className="absolute left-5 top-[39px] text-slate-400 peer-focus:invisible transition-all pointer-events-none mt-px text-sm">email@example.com</span>
                                    <p className="text-[11px] text-red-500 mt-1 hidden peer-invalid:peer-focus:block">Please enter a valid email address.</p>
                                </div>

                                <div className="space-y-2 relative">
                                    <label className="block text-sm font-bold text-slate-700">Password <span className="text-red-500">*</span></label>
                                    <input type='password' name='password' value={formData.password} onChange={handleChange} required minLength="6" className={`w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl ${ringThemeMap[themeColor]} transition-shadow outline-none peer placeholder-transparent focus:bg-white`} placeholder='Secret Password' />
                                    <span className="absolute left-5 top-[39px] text-slate-400 peer-focus:invisible transition-all pointer-events-none mt-px text-sm">Minimum 6 characters</span>
                                    <p className="text-[11px] text-red-500 mt-1 hidden peer-invalid:peer-focus:block">Password must be at least 6 characters.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">Registering As</label>
                                    <div className="relative">
                                        <input type="text" value={formData.role} readOnly className="w-full px-5 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 font-bold tracking-wider cursor-not-allowed select-none" />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7z" /></svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 relative">
                                    <label className="block text-sm font-bold text-slate-700">Mobile Number <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold border-r border-slate-200 pr-3">+91</span>
                                        <input type='text' name='mobile' value={formData.mobile} onChange={handleChange} required pattern="[0-9]{10,15}" className={`w-full pl-16 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl ${ringThemeMap[themeColor]} transition-shadow outline-none peer focus:bg-white`} placeholder='9876543210' />
                                    </div>
                                    <p className="text-[11px] text-red-500 mt-1 hidden peer-invalid:peer-focus:block">Please enter a valid 10-15 digit phone number.</p>
                                </div>

                                <div className="space-y-2 relative">
                                    <label className="block text-sm font-bold text-slate-700">
                                        {formData.role === 'HR' ? 'Assigned Department' : 'Department'} <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select name='department' value={formData.department} onChange={handleChange} required className={`w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl ${ringThemeMap[themeColor]} transition-shadow outline-none appearance-none cursor-pointer focus:bg-white font-medium text-slate-700 peer`}>
                                            <option value="" disabled>Select Department</option>
                                            {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 space-y-2 relative">
                                <label className="block text-sm font-bold text-slate-700">Home Address <span className="text-red-500">*</span></label>
                                <textarea name='address' value={formData.address} onChange={handleChange} required minLength="10" className={`w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl ${ringThemeMap[themeColor]} transition-shadow outline-none min-h-[120px] peer focus:bg-white resize-none`} placeholder='Complete Residential Address...'></textarea>
                                <p className="text-[11px] text-red-500 mt-1 hidden peer-invalid:peer-focus:block">Address must be at least 10 characters long.</p>
                            </div>
                        </section>

                        {/* Section: Professional Info */}
                        <section>
                            <h2 className={`text-sm font-black uppercase tracking-widest ${textThemeMap[themeColor]} mb-6 flex items-center gap-2`}>
                                <span className={`w-8 h-px bg-${themeColor}-200`}></span>
                                Professional & Identity
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-2 relative">
                                    <label className="block text-sm font-bold text-slate-700">Highest Qualification <span className="text-red-500">*</span></label>
                                    <input type='text' name='qualification' value={formData.qualification} onChange={handleChange} required minLength="2" className={`w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl ${ringThemeMap[themeColor]} transition-shadow outline-none peer focus:bg-white`} placeholder='e.g., M.Tech, MBA' />
                                </div>
                                <div className="space-y-2 relative">
                                    <label className="block text-sm font-bold text-slate-700">Joining Date <span className="text-red-500">*</span></label>
                                    <input type='date' name='joining_date' value={formData.joining_date} onChange={handleChange} required className={`w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl ${ringThemeMap[themeColor]} transition-shadow outline-none text-slate-700 peer focus:bg-white cursor-pointer`} />
                                </div>
                                <div className="space-y-2 relative pl-1">
                                    <label className="block text-sm font-bold text-slate-700">Base Salary (₹) <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                                        <input type='number' name='salary' value={formData.salary} onChange={handleChange} required min="0" step="0.01" className={`w-full pl-10 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl ${ringThemeMap[themeColor]} transition-shadow outline-none peer focus:bg-white font-medium`} placeholder='0.00' />
                                    </div>
                                    <p className="text-[11px] text-red-500 mt-1 hidden peer-invalid:peer-focus:block">Ensure valid salary number greater than 0.</p>
                                </div>
                                <div className="space-y-2 relative pl-1">
                                    <label className="block text-sm font-bold text-slate-700">Total Allowances (₹)</label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                                        <input type='number' name='allowances' value={formData.allowances} onChange={handleChange} min="0" step="0.01" className={`w-full pl-10 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl ${ringThemeMap[themeColor]} transition-shadow outline-none peer focus:bg-white font-medium`} placeholder='0.00' />
                                    </div>
                                </div>
                                <div className="space-y-2 relative">
                                    <label className="block text-sm font-bold text-slate-700">Profile Picture</label>
                                    <div className={`relative w-full px-4 py-2 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors ${image ? 'border-emerald-400 bg-emerald-50' : ''}`}>
                                        <input type='file' name='image' id='image' onChange={handleFileChange} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        <div className="flex items-center gap-3 w-full h-full pointer-events-none text-sm text-slate-500 font-medium py-1">
                                            <div className={`p-2 rounded-lg ${image ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                                {image ? (
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                                )}
                                            </div>
                                            <span className="truncate">{image ? image.name : 'Upload Avatar image (Optional)'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section: Bank Details */}
                        <section className="bg-slate-50 p-8 rounded-3xl border border-slate-200/60 shadow-inner">
                            <h2 className={`text-sm font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                Bank Details <span className="text-slate-400 font-medium lowercase normal-case ml-1 relative top-[-1px] mb-[-2px] tracking-normal text-xs">(Required for Payroll)</span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2 relative">
                                    <label className="block text-sm font-bold text-slate-700">Bank Name</label>
                                    <input type='text' name='bank_name' value={formData.bank_name} onChange={handleChange} className={`w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl ${ringThemeMap[themeColor]} transition-shadow outline-none shadow-sm`} placeholder='E.g. HDFC Bank' />
                                </div>
                                <div className="space-y-2 relative">
                                    <label className="block text-sm font-bold text-slate-700">Account Number</label>
                                    <input type='number' name='account_number' value={formData.account_number} onChange={handleChange} className={`w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl ${ringThemeMap[themeColor]} transition-shadow outline-none shadow-sm peer`} placeholder='1234567890' />
                                    <p className="text-[11px] text-red-500 mt-1 hidden peer-invalid:peer-focus:block">Please enter numbers only.</p>
                                </div>
                                <div className="space-y-2 relative">
                                    <label className="block text-sm font-bold text-slate-700">IFSC Code</label>
                                    <input type='text' name='ifsc_code' value={formData.ifsc_code} onChange={handleChange} className={`w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl ${ringThemeMap[themeColor]} transition-shadow outline-none shadow-sm uppercase placeholder-normal`} placeholder='SBIN0001234' />
                                </div>
                            </div>
                        </section>

                        <div className="pt-6 flex flex-col md:flex-row gap-4 items-center justify-end">
                            <button type='button' onClick={() => navigate(-1)} className="order-2 md:order-1 w-full md:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl font-bold transition-all shadow-sm focus:ring-2 focus:ring-slate-200 outline-none">
                                Cancel
                            </button>
                            <button type='submit' disabled={loading} className={`order-1 md:order-2 w-full md:w-auto px-10 py-4 ${bgThemeMap[themeColor]} text-white rounded-2xl font-bold shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none group-[*:invalid]:opacity-70 group-[*:invalid]:pointer-events-none focus:outline-none flex items-center justify-center gap-2`}>
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Registering...
                                    </>
                                ) : (
                                    <>Create Account <svg className="w-5 h-5 ml-1 inline-block hover:ml-2 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></>
                                )}
                            </button>
                        </div>
                        {/* Hidden submit helper check text */}
                        <div className="text-center text-xs text-slate-400 mt-[-10px] hidden group-[*:invalid]:block animate-pulse">Please fill all required valid fields correctly above to submit.</div>
                    </form>
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
                .placeholder-normal::placeholder { text-transform: none; }
            `}} />
        </div>
    );
}

export default Register;