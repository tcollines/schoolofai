import React, { useState } from 'react';
import { Mail, Lock, ShieldAlert, ArrowLeft, Loader2, KeyRound } from 'lucide-react';
import { supabaseClient } from '../../src/lib/supabaseClient';

interface AdminLoginPageProps {
    onLoginSuccess: () => void;
    onBackToStudentPortal: () => void;
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess, onBackToStudentPortal }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAdminSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: signInError } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (signInError) {
                setError(signInError.message);
                setLoading(false);
                return;
            }

            // Success! Store admin-session token separately from student auth
            localStorage.setItem('admin-session', 'true');
            setLoading(false);
            onLoginSuccess();
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
            setLoading(false);
        }
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
                                    placeholder="admin@example.com"
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
