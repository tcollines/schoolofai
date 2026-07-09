import React, { useState } from 'react';
import { Mail, Lock, KeyRound, ShieldAlert, ArrowLeft, Loader2, Info } from 'lucide-react';

interface AdminLoginPageProps {
    onLoginSuccess: () => void;
    onBackToStudentPortal: () => void;
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess, onBackToStudentPortal }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passcode, setPasscode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAdminSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Simulate admin verification delay
        setTimeout(() => {
            // Distinct administrative rules: Email + Password + Security Passcode
            const isValidEmail = email.trim().toLowerCase() === 'admin@welile.com' || email.trim().toLowerCase() === 'admin@test.com';
            const isValidPassword = password === 'adminpassword' || password === 'admin';
            const isValidPasscode = passcode === 'admin123' || passcode === 'WELILE_ADMIN_2026';

            if (!isValidEmail) {
                setError('Invalid Administrative Email address.');
                setLoading(false);
                return;
            }

            if (!isValidPassword) {
                setError('Incorrect password.');
                setLoading(false);
                return;
            }

            if (!isValidPasscode) {
                setError('Incorrect Security Passcode. Access denied.');
                setLoading(false);
                return;
            }

            // Success! Store admin-session token separately from student auth
            localStorage.setItem('admin-session', 'true');
            setLoading(false);
            onLoginSuccess();
        }, 1200);
    };

    return (
        <div className="min-h-screen bg-[#090d16] dark:bg-[#060911] text-slate-100 flex flex-col justify-between p-6 relative overflow-hidden font-sans">
            {/* Background elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/10 blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-15%] left-[-15%] w-[60%] h-[60%] rounded-full bg-emerald-900/10 blur-[150px] pointer-events-none"></div>

            {/* Back Button */}
            <div className="max-w-7xl w-full mx-auto">
                <button
                    onClick={onBackToStudentPortal}
                    className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-800 border border-slate-800 px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                    <ArrowLeft size={14} /> Back to Portal
                </button>
            </div>

            {/* Card Container */}
            <div className="flex-1 flex items-center justify-center py-12">
                <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/80 p-8 w-full max-w-md shadow-2xl relative">
                    <div className="text-center mb-8">
                        {/* Shield Icon Accent */}
                        <div className="mx-auto w-12 h-12 bg-violet-950/50 border border-violet-800/60 text-violet-400 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-violet-950/20">
                            <KeyRound size={22} className="animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-white">Admin Console</h2>
                        <p className="text-slate-400 text-xs mt-1.5 uppercase tracking-wider font-semibold">Administrative Access Portal</p>
                    </div>

                    {/* Hint / Demo Credentials Box */}
                    <div className="mb-6 bg-slate-950/60 rounded-2xl border border-slate-800/50 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-violet-400">
                            <Info size={14} />
                            <span className="text-[11px] font-bold uppercase tracking-wider">Demo Credentials</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-slate-400">
                            <span className="font-semibold text-slate-300">Admin Email:</span>
                            <code className="text-violet-300">admin@welile.com</code>
                            <span className="font-semibold text-slate-300">Password:</span>
                            <code className="text-violet-300">adminpassword</code>
                            <span className="font-semibold text-slate-300">Security Passcode:</span>
                            <code className="text-violet-300">admin123</code>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-950/20 border border-red-800/40 text-red-300 p-3.5 rounded-2xl text-xs flex gap-2.5 items-start">
                            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleAdminSubmit} className="space-y-4">
                        {/* Email Input */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Console Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@welile.com"
                                    className="w-full bg-slate-950/50 border border-slate-800 hover:border-slate-700 focus:border-violet-500 text-white pl-11 pr-4 py-3 rounded-2xl outline-none transition-all text-sm"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Console Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-950/50 border border-slate-800 hover:border-slate-700 focus:border-violet-500 text-white pl-11 pr-4 py-3 rounded-2xl outline-none transition-all text-sm"
                                />
                            </div>
                        </div>

                        {/* Passcode Input (Distinct Rule check) */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Security Passcode</label>
                                <span className="text-[10px] text-violet-400 font-bold bg-violet-950/40 px-1.5 py-0.5 rounded">REQUIRED</span>
                            </div>
                            <div className="relative">
                                <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="password"
                                    required
                                    value={passcode}
                                    onChange={(e) => setPasscode(e.target.value)}
                                    placeholder="Secret Admin Key"
                                    className="w-full bg-slate-950/50 border border-slate-800 hover:border-slate-700 focus:border-violet-500 text-white pl-11 pr-4 py-3 rounded-2xl outline-none transition-all text-sm font-mono tracking-widest"
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">Different from ordinary student login authentication.</p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-violet-600 hover:bg-violet-750 text-white font-bold py-3.5 px-4 rounded-2xl transition-colors cursor-pointer shadow-lg shadow-violet-950/20 text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" /> Verifying Access
                                </>
                            ) : 'Authenticate Console'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center py-4 text-[10px] text-slate-600 font-medium">
                Welile School Administrative Access Area • Authorized Credentials Only.
            </div>
        </div>
    );
};

export default AdminLoginPage;
