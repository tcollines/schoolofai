import React, { useState, useEffect } from 'react';
import { Sun, Moon, Globe, Bell, Shield, Lock, Check, Loader, Save } from 'lucide-react';
import { useTranslation } from './translations';

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
