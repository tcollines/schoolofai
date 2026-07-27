import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, User, BookOpen, Upload, CheckCircle, ArrowLeft, AlertCircle, FileText, Image, Loader2, Sparkles } from 'lucide-react';

const ApplyInstructorPage: React.FC = () => {
    const navigate = useNavigate();
    const [userEmail, setUserEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [courses, setCourses] = useState('');
    const [passportPhoto, setPassportPhoto] = useState<string | null>(null);
    const [passportPhotoName, setPassportPhotoName] = useState('');
    const [nationalId, setNationalId] = useState<string | null>(null);
    const [nationalIdName, setNationalIdName] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Load active session user if exists
    useEffect(() => {
        const fetchUser = async () => {
            const email = localStorage.getItem('logged_in_email');
            if (email) {
                setUserEmail(email);
                const name = localStorage.getItem('auth_logged_in_name');
                if (name) setFullName(name);
            }
        };
        fetchUser();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'passport' | 'id') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError(`${type === 'passport' ? 'Passport Photo' : 'National ID'} exceeds 5MB file limit.`);
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'passport') {
                setPassportPhoto(reader.result as string);
                setPassportPhotoName(file.name);
            } else {
                setNationalId(reader.result as string);
                setNationalIdName(file.name);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!userEmail) {
            setError('Please log in or enter an email address.');
            return;
        }
        if (!fullName) {
            setError('Please enter your full name / username.');
            return;
        }
        if (!courses) {
            setError('Please specify the courses you plan to teach.');
            return;
        }
        if (!passportPhoto) {
            setError('Please upload your passport photo.');
            return;
        }
        if (!nationalId) {
            setError('Please upload your National ID card / passport.');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token') || '';
            const res = await fetch('http://localhost:5001/api/instructor-applications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: userEmail,
                    username: fullName,
                    courses: courses,
                    passportPhoto: passportPhoto,
                    nationalId: nationalId
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to submit application.');
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'An error occurred during submission.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors">
                <div className="absolute top-10 left-10 w-96 h-96 bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-2xl border border-gray-150 dark:border-slate-800/80 text-center relative z-10 animate-in zoom-in duration-200">
                    <div className="mx-auto w-20 h-20 bg-green-50 dark:bg-green-950/20 text-green-500 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle size={44} className="text-green-500" />
                    </div>

                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">Application Submitted!</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 leading-relaxed">
                        Thank you for applying to be an instructor at Welile School of AI. 
                        We have sent an automated confirmation email to <span className="font-semibold text-gray-700 dark:text-slate-350">{userEmail}</span>.
                    </p>

                    <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-gray-150 dark:border-slate-800/60 mb-6 text-left text-xs text-gray-500 dark:text-slate-400 space-y-1">
                        <div className="flex gap-2">
                            <span className="font-bold text-gray-700 dark:text-slate-350">Applicant:</span>
                            <span>{fullName}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-bold text-gray-700 dark:text-slate-350">Status:</span>
                            <span className="text-amber-600 dark:text-amber-400 font-bold">Under Review</span>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-750 hover:to-indigo-750 text-white rounded-full text-xs font-extrabold tracking-widest uppercase shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors">
            <div className="absolute top-10 left-10 w-96 h-96 bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <Link
                to="/dashboard"
                className="absolute top-8 left-8 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 z-20 text-sm font-semibold transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
            </Link>

            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl border border-gray-150 dark:border-slate-800/80 relative z-10 flex flex-col md:flex-row">
                
                <div className="md:w-1/3 bg-gradient-to-br from-violet-650 to-indigo-900 dark:from-violet-950 dark:to-indigo-950 p-8 flex flex-col justify-between text-white text-left relative overflow-hidden">
                    <div className="absolute -top-12 -left-12 w-32 h-64 bg-white/5 rounded-full transform -rotate-45"></div>
                    <div className="z-10 space-y-6">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-violet-300" />
                        </div>
                        <h3 className="text-xl font-bold tracking-tight">Teach on Welile</h3>
                        <p className="text-xs text-white/70 leading-relaxed">
                            Share your skills, design custom curriculums, and guide students inside the premium School of AI dashboard.
                        </p>
                    </div>
                    <p className="text-[10px] text-white/50 font-bold tracking-widest uppercase mt-8 z-10">Welile School of AI</p>
                </div>

                <form onSubmit={handleSubmit} className="md:w-2/3 p-8 sm:p-10 space-y-6 text-left">
                    <div>
                        <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-wider uppercase">Apply for Instructor Rights</h2>
                        <p className="text-xs text-gray-400 font-semibold mt-1">Complete this verification form to upgrade your account.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-950/30 text-red-650 dark:text-red-400 p-4 rounded-2xl text-xs flex items-center gap-2 border border-red-200 dark:border-red-900/30">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                            <div className="relative border-b border-gray-200 dark:border-slate-850 focus-within:border-violet-500 py-1.5 flex items-center transition-colors">
                                <Mail className="w-4 h-4 text-gray-400 mr-2" />
                                <input
                                    type="email"
                                    required
                                    value={userEmail}
                                    onChange={(e) => setUserEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="w-full bg-transparent border-0 outline-none focus:ring-0 text-sm text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name / Username</label>
                            <div className="relative border-b border-gray-200 dark:border-slate-850 focus-within:border-violet-500 py-1.5 flex items-center transition-colors">
                                <User className="w-4 h-4 text-gray-400 mr-2" />
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Enter your full name"
                                    className="w-full bg-transparent border-0 outline-none focus:ring-0 text-sm text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Syllabus / Courses You Teach</label>
                            <div className="relative border-b border-gray-200 dark:border-slate-850 focus-within:border-violet-500 py-1.5 flex items-start transition-colors">
                                <BookOpen className="w-4 h-4 text-gray-400 mr-2 mt-1.5" />
                                <textarea
                                    required
                                    rows={2}
                                    value={courses}
                                    onChange={(e) => setCourses(e.target.value)}
                                    placeholder="E.g. Prompt Engineering, Introduction to Python..."
                                    className="w-full bg-transparent border-0 outline-none focus:ring-0 text-sm text-gray-900 dark:text-white resize-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Passport Photo</label>
                                <label className="relative border-2 border-dashed border-gray-200 dark:border-slate-800 hover:border-violet-550 dark:hover:border-violet-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all text-center min-h-[100px]">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleFileChange(e, 'passport')}
                                    />
                                    {passportPhoto ? (
                                        <>
                                            <Image className="w-6 h-6 text-emerald-500" />
                                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[140px]">{passportPhotoName}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-5 h-5 text-gray-400" />
                                            <span className="text-[10px] font-bold text-gray-650 dark:text-slate-350">Upload Photo</span>
                                        </>
                                    )}
                                </label>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">National ID / ID Card</label>
                                <label className="relative border-2 border-dashed border-gray-200 dark:border-slate-800 hover:border-violet-550 dark:hover:border-violet-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all text-center min-h-[100px]">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleFileChange(e, 'id')}
                                    />
                                    {nationalId ? (
                                        <>
                                            <FileText className="w-6 h-6 text-emerald-500" />
                                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[140px]">{nationalIdName}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-5 h-5 text-gray-400" />
                                            <span className="text-[10px] font-bold text-gray-650 dark:text-slate-350">Upload ID Document</span>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-750 hover:to-indigo-750 text-white rounded-full text-xs font-extrabold tracking-widest uppercase shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Submitting...</span>
                            </>
                        ) : 'Submit Verification'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ApplyInstructorPage;
