import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../apiConfig';

function Login() {
    const navigate = useNavigate();
    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post(`${API_BASE_URL}/api/login/`, credentials);
            const { access, role, username } = response.data;

            // Store token and user info
            localStorage.setItem('token', access);
            localStorage.setItem('role', role);
            localStorage.setItem('username', username);

            // Redirect based on role
            if (role === 'ADMIN') {
                navigate('/admin-dashboard');
            } else if (role === 'HR') {
                navigate('/hr-dashboard');
            } else {
                navigate('/employee-dashboard');
            }
        } catch (err) {
            console.error(err);
            if (!err.response) {
                setError("Network error: Cannot connect to the server.");
            } else {
                setError(err.response?.data?.detail || "Login failed. Please check your credentials.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center relative overflow-hidden font-sans">
            {/* Background Animated Blobs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 animate-blob"></div>
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 animate-blob animation-delay-4000"></div>

            <div className="relative z-10 w-full max-w-md p-8">
                {/* Glassmorphic Card Container */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">

                    {/* Inner Content overlay for gradient hint */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-cyan-500/20 mix-blend-overlay pointer-events-none"></div>

                    <div className="relative p-10 pt-16 pb-14 text-center">

                        {/* Animated Time / Office Header */}
                        <div className="mb-10 flex justify-center relative">
                            {/* Outer animated time rings */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-28 h-28 border-t-2 border-r-2 border-cyan-400/50 rounded-full animate-spin" style={{ animationDuration: '8s' }}></div>
                                <div className="absolute w-32 h-32 border-b-2 border-l-2 border-purple-500/50 rounded-full animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }}></div>
                                {/* Inner tick marks ring */}
                                <div className="absolute w-24 h-24 border-2 border-white/10 rounded-full border-dashed animate-spin" style={{ animationDuration: '24s' }}></div>
                            </div>

                            <div className="w-20 h-20 bg-gradient-to-tr from-cyan-400 to-purple-500 rounded-full flex items-center justify-center p-1 shadow-[0_0_30px_rgba(168,85,247,0.5)] relative z-10 transition-transform hover:scale-105 duration-300 cursor-default group">
                                <div className="w-full h-full bg-[#1e293b] rounded-full flex items-center justify-center relative overflow-hidden">
                                    {/* Clock face inside logo */}
                                    <svg className="w-8 h-8 text-white/90 group-hover:text-cyan-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="9" strokeWidth="2" className="opacity-30" />
                                        {/* Sweeping radar effect */}
                                        <circle cx="12" cy="12" r="9" strokeWidth="2" strokeDasharray="14 42" className="origin-center animate-spin" style={{ animationDuration: '3s' }} />

                                        <g className="origin-center animate-spin" style={{ animationDuration: '2s' }}>
                                            <line x1="12" y1="12" x2="12" y2="6" strokeWidth="2" strokeLinecap="round" />
                                        </g>
                                        <g className="origin-center animate-spin" style={{ animationDuration: '12s' }}>
                                            <line x1="12" y1="12" x2="16" y2="15" strokeWidth="2" strokeLinecap="round" />
                                        </g>
                                        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight drop-shadow-sm">Nexus ERP</h1>
                        <p className="text-white/60 text-sm mb-8 font-medium tracking-widest uppercase">Office Administration</p>

                        {error && (
                            <div className="mb-6 p-4 rounded-2xl bg-red-500/20 border border-red-500/50 backdrop-blur-md">
                                <p className="text-red-200 text-sm font-semibold">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6 text-left">

                            {/* Username Input Group */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-white/50 group-focus-within:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    name="email"
                                    value={credentials.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-white/5 border border-white/20 focus:border-cyan-400 focus:bg-white/10 rounded-full py-4 pl-12 pr-4 text-white placeholder-white/50 outline-none transition-all shadow-inner"
                                    placeholder="Username or Email"
                                />
                            </div>

                            {/* Password Input Group */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-white/50 group-focus-within:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7z"></path>
                                    </svg>
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={credentials.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-white/5 border border-white/20 focus:border-cyan-400 focus:bg-white/10 rounded-full py-4 pl-12 pr-12 text-white placeholder-white/50 outline-none transition-all shadow-inner"
                                    placeholder="Password"
                                />
                                <div
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer text-white/50 hover:text-white transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                    )}
                                </div>
                            </div>

                           

                            {/* Submit Button */}
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full relative group overflow-hidden bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-lg py-4 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all outline-none"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-3">
                                        {loading ? (
                                            <>
                                                {/* Circular Time Loading Animation */}
                                                <svg className="w-6 h-6 -ml-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <circle cx="12" cy="12" r="10" strokeWidth="2" className="opacity-30 border-dashed"></circle>
                                                    {/* Dashed outer ring for extra time feel */}
                                                    <circle cx="12" cy="12" r="10" strokeWidth="2" strokeDasharray="4 6" className="origin-center animate-spin" style={{ animationDuration: '8s', animationDirection: 'reverse' }}></circle>

                                                    {/* Hands */}
                                                    <g className="origin-center animate-spin" style={{ animationDuration: '0.8s' }}>
                                                        <line x1="12" y1="12" x2="12" y2="6" strokeWidth="2" strokeLinecap="round" />
                                                    </g>
                                                    <g className="origin-center animate-spin" style={{ animationDuration: '4s' }}>
                                                        <line x1="12" y1="12" x2="16" y2="15" strokeWidth="2.5" strokeLinecap="round" />
                                                    </g>
                                                    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"></circle>
                                                </svg>
                                                Checking Logins...
                                            </>
                                        ) : 'LOGIN'}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Custom Animations required for tailwind config or arbitrary classes */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}} />
        </div>
    );
}

export default Login;
