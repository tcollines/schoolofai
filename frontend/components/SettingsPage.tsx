import React, { useState, useEffect } from 'react';
import { Sun, Moon, Globe, Bell, Shield, Lock, Check, Loader, Save, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useTranslation } from './translations';
import { mysqlClient } from '../src/lib/mysqlClient';

const checkPasswordCriteria = (pass: string) => {
    return {
        length: pass.length >= 6 && pass.length <= 10,
        uppercase: /[A-Z]/.test(pass),
        lowercase: /[a-z]/.test(pass),
        number: /[0-9]/.test(pass),
        symbol: /[^A-Za-z0-9]/.test(pass)
    };
};

const PasswordCriteriaGuide: React.FC<{ password: string }> = ({ password }) => {
    const criteria = checkPasswordCriteria(password);
    const metCount = Object.values(criteria).filter(Boolean).length;
    
    let strengthLabel = "Weak password. Must contain:";
    let barColor = "bg-rose-500";
    let textColor = "text-rose-600 dark:text-rose-455";
    let progressWidth = "w-1/5";
    
    if (metCount === 5) {
        strengthLabel = "Eligible password!";
        barColor = "bg-emerald-500";
        textColor = "text-emerald-600 dark:text-emerald-455";
        progressWidth = "w-full";
    } else if (metCount >= 3) {
        strengthLabel = "Moderate password. Must contain:";
        barColor = "bg-amber-500";
        textColor = "text-amber-600 dark:text-amber-455";
        progressWidth = "w-3/5";
    } else if (metCount === 2) {
        progressWidth = "w-2/5";
    }

    const checklist = [
        { key: 'length', label: 'Between 6 and 10 characters' },
        { key: 'uppercase', label: 'At least 1 uppercase letter' },
        { key: 'lowercase', label: 'At least 1 lowercase letter' },
        { key: 'number', label: 'At least 1 number' },
        { key: 'symbol', label: 'At least 1 symbol (e.g. @, $, !, %)' }
    ];

    return (
        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-gray-150 dark:border-slate-800/60 transition-all text-left mt-3">
            {/* Strength Bar */}
            <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${textColor}`}>
                        {strengthLabel}
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold">{metCount}/5</span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} ${progressWidth} transition-all duration-300`} />
                </div>
            </div>

            {/* Checklist */}
            <ul className="space-y-1.5 text-xs font-semibold">
                {checklist.map((item) => {
                    const isMet = criteria[item.key as keyof typeof criteria];
                    return (
                        <li key={item.key} className="flex items-center gap-2">
                            {isMet ? (
                                <span className="flex items-center justify-center w-4 h-4 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full text-[9px]">
                                    ✓
                                </span>
                            ) : (
                                <span className="flex items-center justify-center w-4 h-4 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-550 rounded-full text-[8px]">
                                    ✕
                                </span>
                            )}
                            <span className={isMet ? "text-gray-650 dark:text-slate-350" : "text-gray-400 dark:text-slate-550"}>
                                {item.label}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

const SettingsPage: React.FC = () => {
    const { t } = useTranslation();

    // 1. Appearance / Theme State
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    });

    // 2. Language State
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('language') || 'en';
    });

    // 3. Timezone State
    const [timezone, setTimezone] = useState(() => {
        return localStorage.getItem('timezone') || 'UTC+2 (SAST)';
    });

    // 4. Notifications State
    const [notifications, setNotifications] = useState({
        courseUpdates: true,
        examReminders: true,
        billingAlerts: false,
        newsletters: false,
    });

    // 5. Security State
    const [twoFactor, setTwoFactor] = useState(() => {
        return localStorage.getItem('twoFactor') === 'true';
    });
    const [publicProfile, setPublicProfile] = useState(() => {
        return localStorage.getItem('publicProfile') !== 'false';
    });

    // 6. UI State
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    // Change Password States
    const [profile, setProfile] = useState<any>(null);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const activeEmail = localStorage.getItem('auth_logged_in_email') || '';
            if (!activeEmail) return;
            try {
                const { data } = await mysqlClient.from('profiles').select('*');
                if (data && Array.isArray(data)) {
                    const user = data.find((p: any) => p.email === activeEmail);
                    if (user) {
                        setProfile(user);
                    }
                }
            } catch (err) {
                console.error("Failed to load profile for settings", err);
            }
        };
        fetchProfile();
    }, []);

    const validatePassword = (pass: string): string | null => {
        if (pass.length < 6 || pass.length > 10) {
            return "Password must be between 6 and 10 characters long.";
        }
        if (!/[A-Z]/.test(pass)) {
            return "Password must contain at least one uppercase letter (A-Z).";
        }
        if (!/[a-z]/.test(pass)) {
            return "Password must contain at least one lowercase letter (a-z).";
        }
        if (!/[0-9]/.test(pass)) {
            return "Password must contain at least one number (0-9).";
        }
        if (!/[^A-Za-z0-9]/.test(pass)) {
            return "Password must contain at least one symbol (e.g. @, $, !, %, *, ?, &, #).";
        }
        return null;
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(null);

        if (!profile) {
            setPasswordError("Failed to fetch user session. Please log in again.");
            return;
        }

        if (profile.password !== currentPassword) {
            setPasswordError("Incorrect current password.");
            return;
        }

        const criteriaError = validatePassword(newPassword);
        if (criteriaError) {
            setPasswordError(criteriaError);
            return;
        }

        if (newPassword === currentPassword) {
            setPasswordError("New password cannot be the same as the current password.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("Passwords do not match.");
            return;
        }

        setPasswordSaving(true);
        try {
            const { error } = await mysqlClient
                .from('profiles')
                .update({ password: newPassword })
                .eq('id', profile.id);

            if (error) {
                throw new Error(error.message || "Failed to update password.");
            }

            setPasswordSuccess("Password updated successfully!");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setProfile({ ...profile, password: newPassword });
        } catch (err: any) {
            setPasswordError(err.message || "An error occurred.");
        } finally {
            setPasswordSaving(false);
        }
    };

    // Apply theme changes to the DOM and localStorage
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
        window.dispatchEvent(new Event('theme-change'));
    }, [theme]);

    // Sync theme when external source modifies it (e.g. Header shortcut)
    useEffect(() => {
        const handleThemeChange = () => {
            const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
            setTheme(currentTheme);
        };
        window.addEventListener('theme-change', handleThemeChange);
        return () => {
            window.removeEventListener('theme-change', handleThemeChange);
        };
    }, []);

    const handleSave = () => {
        setIsSaving(true);
        // Persist language, timezone, and security preferences
        localStorage.setItem('language', language);
        localStorage.setItem('timezone', timezone);
        localStorage.setItem('twoFactor', String(twoFactor));
        localStorage.setItem('publicProfile', String(publicProfile));
        window.dispatchEvent(new Event('language-change'));

        // Mock network delay for premium feel
        setTimeout(() => {
            setIsSaving(false);
            setShowSuccessToast(true);
            setTimeout(() => {
                setShowSuccessToast(false);
            }, 3000);
        }, 1200);
    };

    // Sync language when external source modifies it
    useEffect(() => {
        const handleLangChange = () => {
            setLanguage(localStorage.getItem('language') || 'en');
        };
        window.addEventListener('language-change', handleLangChange);
        return () => {
            window.removeEventListener('language-change', handleLangChange);
        };
    }, []);

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            {/* Header Title */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-200">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('settings')}</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{t('configure_locale')}</p>
                </div>
            </div>

            {/* Success Toast */}
            {showSuccessToast && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-xl animate-bounce">
                    <Check size={20} className="stroke-[3]" />
                    <span className="font-semibold text-sm">{t('saved_successfully')}</span>
                </div>
            )}

            {/* 1. Appearance / Theme */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 rounded-xl">
                        <Sun size={20} className="dark:hidden" />
                        <Moon size={20} className="hidden dark:block" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{t('appearance')}</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">{t('customize_theme')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Light Mode Card */}
                    <div 
                        onClick={() => setTheme('light')}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between h-36 ${
                            theme === 'light' 
                                ? 'bg-violet-50/55 border-violet-500 shadow-sm dark:bg-slate-800/20' 
                                : 'bg-gray-50 dark:bg-slate-800/40 border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700'
                        }`}
                    >
                        <div className="flex justify-between items-start">
                            <span className="p-2 bg-white dark:bg-slate-800 text-amber-500 rounded-lg shadow-sm">
                                <Sun size={18} />
                            </span>
                            {theme === 'light' && (
                                <span className="w-5 h-5 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                    ✓
                                </span>
                            )}
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">{t('light_mode')}</h4>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{t('light_mode_desc')}</p>
                        </div>
                    </div>

                    {/* Dark Mode Card */}
                    <div 
                        onClick={() => setTheme('dark')}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between h-36 ${
                            theme === 'dark' 
                                ? 'bg-violet-50/55 border-violet-500 shadow-sm dark:bg-slate-800/30' 
                                : 'bg-gray-50 dark:bg-slate-800/40 border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700'
                        }`}
                    >
                        <div className="flex justify-between items-start">
                            <span className="p-2 bg-white dark:bg-slate-800 text-violet-400 rounded-lg shadow-sm">
                                <Moon size={18} />
                            </span>
                            {theme === 'dark' && (
                                <span className="w-5 h-5 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                    ✓
                                </span>
                            )}
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">{t('dark_mode')}</h4>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{t('dark_mode_desc')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Language & Region */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 rounded-xl">
                        <Globe size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{t('language_region')}</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">{t('configure_locale')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 font-medium">{t('display_language')}</label>
                        <select 
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 text-gray-900 dark:text-white outline-none transition-all"
                        >
                            <option value="en">English (US)</option>
                            <option value="es">Español (ES)</option>
                            <option value="fr">Français (FR)</option>
                            <option value="zu">isiZulu (SA)</option>
                            <option value="xh">isiXhosa (SA)</option>
                            <option value="sw">Kiswahili (KE/TZ)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 font-medium">{t('timezone')}</label>
                        <select 
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 text-gray-900 dark:text-white outline-none transition-all"
                        >
                            <option value="UTC-5 (EST)">UTC-5 (Eastern Time - US)</option>
                            <option value="UTC+0 (GMT)">UTC+0 (Greenwich Mean Time)</option>
                            <option value="UTC+1 (CET)">UTC+1 (Central European Time)</option>
                            <option value="UTC+2 (SAST)">UTC+2 (South African Standard Time)</option>
                            <option value="UTC+3 (EAT)">UTC+3 (East Africa Time)</option>
                            <option value="UTC+8 (SGT)">UTC+8 (Singapore Standard Time)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 3. Notifications */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 rounded-xl">
                        <Bell size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{t('notifications')}</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">{t('select_alerts')}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Course Updates */}
                    <div className="flex items-center justify-between p-4 border border-gray-50 dark:border-slate-800 rounded-xl">
                        <div>
                            <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('course_announcements')}</h4>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{t('course_announcements_desc')}</p>
                        </div>
                        <button 
                            onClick={() => setNotifications({...notifications, courseUpdates: !notifications.courseUpdates})}
                            className={`w-11 h-6 rounded-full transition-all duration-300 relative ${
                                notifications.courseUpdates ? 'bg-violet-600' : 'bg-gray-200 dark:bg-slate-700'
                            }`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 ${
                                notifications.courseUpdates ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                        </button>
                    </div>

                    {/* Exam Reminders */}
                    <div className="flex items-center justify-between p-4 border border-gray-50 dark:border-slate-800 rounded-xl">
                        <div>
                            <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('exam_rules')}</h4>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{t('exam_rules_desc')}</p>
                        </div>
                        <button 
                            onClick={() => setNotifications({...notifications, examReminders: !notifications.examReminders})}
                            className={`w-11 h-6 rounded-full transition-all duration-300 relative ${
                                notifications.examReminders ? 'bg-violet-600' : 'bg-gray-200 dark:bg-slate-700'
                            }`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 ${
                                notifications.examReminders ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                        </button>
                    </div>

                    {/* Billing Alerts */}
                    <div className="flex items-center justify-between p-4 border border-gray-50 dark:border-slate-800 rounded-xl">
                        <div>
                            <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('wallet_alerts')}</h4>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{t('wallet_alerts_desc')}</p>
                        </div>
                        <button 
                            onClick={() => setNotifications({...notifications, billingAlerts: !notifications.billingAlerts})}
                            className={`w-11 h-6 rounded-full transition-all duration-300 relative ${
                                notifications.billingAlerts ? 'bg-violet-600' : 'bg-gray-200 dark:bg-slate-700'
                            }`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 ${
                                notifications.billingAlerts ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                        </button>
                    </div>

                    {/* Newsletters */}
                    <div className="flex items-center justify-between p-4 border border-gray-50 dark:border-slate-800 rounded-xl">
                        <div>
                            <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('newsletters')}</h4>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{t('newsletters_desc')}</p>
                        </div>
                        <button 
                            onClick={() => setNotifications({...notifications, newsletters: !notifications.newsletters})}
                            className={`w-11 h-6 rounded-full transition-all duration-300 relative ${
                                notifications.newsletters ? 'bg-violet-600' : 'bg-gray-200 dark:bg-slate-700'
                            }`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 ${
                                notifications.newsletters ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 4. Security & Privacy */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 rounded-xl">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{t('security_privacy')}</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">{t('configure_security')}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* 2FA */}
                    <div className="flex items-center justify-between p-4 border border-gray-50 dark:border-slate-800 rounded-xl">
                        <div>
                            <h4 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                <Lock size={16} className="text-gray-400" />
                                {t('two_factor')}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{t('two_factor_desc')}</p>
                        </div>
                        <button 
                            onClick={() => setTwoFactor(!twoFactor)}
                            className={`w-11 h-6 rounded-full transition-all duration-300 relative ${
                                twoFactor ? 'bg-violet-600' : 'bg-gray-200 dark:bg-slate-700'
                            }`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 ${
                                twoFactor ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                        </button>
                    </div>

                    {/* Profile Visibility */}
                    <div className="flex items-center justify-between p-4 border border-gray-50 dark:border-slate-800 rounded-xl">
                        <div>
                            <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('public_profile')}</h4>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{t('public_profile_desc')}</p>
                        </div>
                        <button 
                            onClick={() => setPublicProfile(!publicProfile)}
                            className={`w-11 h-6 rounded-full transition-all duration-300 relative ${
                                publicProfile ? 'bg-violet-600' : 'bg-gray-200 dark:bg-slate-700'
                            }`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 ${
                                publicProfile ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 5. Change Password Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 rounded-xl">
                        <KeyRound size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Change Password</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Update your account password</p>
                    </div>
                </div>

                <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-xl">
                    {passwordError && (
                        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-900/30">
                            ⚠ {passwordError}
                        </div>
                    )}
                    {passwordSuccess && (
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-900/30">
                            ✓ {passwordSuccess}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-500 dark:text-slate-450 uppercase tracking-widest text-left">Current Password</label>
                        <div className="relative border border-gray-200 dark:border-slate-800 focus-within:border-violet-500 rounded-xl transition-all duration-300 p-1 flex items-center">
                            <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                required
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-3 py-2 bg-transparent outline-none border-0 text-sm text-gray-900 dark:text-white placeholder-gray-400"
                                placeholder="Enter current password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="px-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-550 dark:text-slate-455 uppercase tracking-widest text-left">New Password</label>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium text-left">Criteria: 6-10 characters, capital/small letters, numbers, and symbols.</p>
                        <div className="relative border border-gray-200 dark:border-slate-800 focus-within:border-violet-500 rounded-xl transition-all duration-300 p-1 flex items-center">
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                required
                                minLength={6}
                                maxLength={10}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-3 py-2 bg-transparent outline-none border-0 text-sm text-gray-900 dark:text-white placeholder-gray-400"
                                placeholder="Enter new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="px-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-550 dark:text-slate-455 uppercase tracking-widest text-left">Confirm New Password</label>
                        <div className="relative border border-gray-200 dark:border-slate-800 focus-within:border-violet-500 rounded-xl transition-all duration-300 p-1 flex items-center">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 bg-transparent outline-none border-0 text-sm text-gray-900 dark:text-white placeholder-gray-400"
                                placeholder="Confirm new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="px-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <PasswordCriteriaGuide password={newPassword} />

                    <button
                        type="submit"
                        disabled={passwordSaving}
                        className="mt-2 flex items-center gap-2 bg-violet-650 hover:bg-violet-750 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md cursor-pointer transition-colors disabled:opacity-50"
                    >
                        {passwordSaving ? (
                            <>
                                <Loader size={14} className="animate-spin" />
                                Updating...
                            </>
                        ) : (
                            "Update Password"
                        )}
                    </button>
                </form>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-8 py-3 rounded-2xl shadow-lg shadow-violet-900/10 active:scale-95 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <>
                            <Loader size={18} className="animate-spin text-white" />
                            {t('saving')}
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            {t('save_changes')}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default SettingsPage;
