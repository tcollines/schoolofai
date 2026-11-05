import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../src/lib/supabaseClient';
import {
    enqueueOutreachRegistration,
    removeQueuedOutreachRegistration,
    flushPendingOutreachRegistrations,
    getQueuedOutreachRegistrations,
    insertOutreachRegistrationLive,
    OutreachRegistrationPayload
} from '../src/lib/outreachSync';
import {
    User,
    Phone,
    Mail,
    MapPin,
    BookOpen,
    Calendar,
    Clock,
    Sparkles,
    CheckCircle2,
    ArrowLeft,
    ArrowRight,
    Sun,
    Moon,
    ShieldCheck,
    WifiOff,
    Wifi,
    UserPlus,
    AlertCircle,
    Loader,
    Megaphone,
    Laptop,
    Building2,
    Layers
} from 'lucide-react';

const AGE_RANGES = ['Under 18', '18-24', '25-34', '35+'];
const LEVELS = [
    { value: 'Beginner', desc: 'New to AI & Tech' },
    { value: 'Intermediate', desc: 'Some digital / coding skills' },
    { value: 'Advanced', desc: 'Ready for deep technical labs' }
];
const MODES = [
    { value: 'Physical', label: 'Physical', desc: 'In-person campus classes', icon: Building2 },
    { value: 'Online', label: 'Online', desc: 'Live virtual sessions', icon: Laptop },
    { value: 'Hybrid', label: 'Hybrid', desc: 'Mix of physical & online', icon: Layers }
];
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_SLOTS = [
    { value: 'Morning', time: '8:00 AM – 12:00 PM' },
    { value: 'Afternoon', time: '1:00 PM – 5:00 PM' },
    { value: 'Evening', time: '6:00 PM – 8:30 PM' },
    { value: 'Weekend', time: 'Sat & Sun Flexible' }
];
const HOW_HEARD_OPTIONS = [
    'Outreach Event',
    'Friend/Referral',
    'Social Media',
    'Poster/Flyer',
    'Other'
];
const DEFAULT_EVENT_PRESETS = [
    'Makerere Career Fair Nov 2026',
    'Kampala Tech Community Meetup',
    'Welile Campus Activation',
    'Kyambogo Innovation Expo',
    'High School ICT Bootcamp'
];

const OutreachRegistration: React.FC = () => {
    const [searchParams] = useSearchParams();
    const initialEventFromUrl = searchParams.get('event') || '';

    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
    const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
    const [pendingQueueCount, setPendingQueueCount] = useState(() => getQueuedOutreachRegistrations().length);

    // Wizard step: 1 = You, 2 = Course, 3 = Finish
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Live courses & existing outreach event names
    const [courseOptions, setCourseOptions] = useState<string[]>([]);
    const [eventPresets, setEventPresets] = useState<string[]>(DEFAULT_EVENT_PRESETS);

    // Form fields
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [ageRange, setAgeRange] = useState('18-24');
    const [guardianName, setGuardianName] = useState('');
    const [guardianPhone, setGuardianPhone] = useState('');
    const [location, setLocation] = useState('');

    const [courseInterest, setCourseInterest] = useState('');
    const [level, setLevel] = useState('Beginner');
    const [modePreference, setModePreference] = useState('Hybrid');
    const [preferredStudyDays, setPreferredStudyDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
    const [preferredTimeSlot, setPreferredTimeSlot] = useState('Evening');

    const [howHeard, setHowHeard] = useState('Outreach Event');
    const [outreachEvent, setOutreachEvent] = useState(initialEventFromUrl);
    const [consentContact, setConsentContact] = useState(false);

    // Honeypot anti-spam field
    const [honeypotWebsite, setHoneypotWebsite] = useState('');

    // Validation & submission states
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedRecord, setSubmittedRecord] = useState<OutreachRegistrationPayload | null>(null);
    const [submittedMode, setSubmittedMode] = useState<'online' | 'offline' | null>(null);

    // Theme sync
    useEffect(() => {
        const handleThemeChange = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        window.addEventListener('theme-change', handleThemeChange);
        return () => window.removeEventListener('theme-change', handleThemeChange);
    }, []);

    const toggleTheme = () => {
        const nextDark = !isDark;
        setIsDark(nextDark);
        if (nextDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
        window.dispatchEvent(new Event('theme-change'));
    };

    // Online/Offline listener & automatic queue flush
    useEffect(() => {
        const refreshQueueCount = () => {
            setPendingQueueCount(getQueuedOutreachRegistrations().length);
        };

        const handleOnline = async () => {
            setIsOnline(true);
            await flushPendingOutreachRegistrations();
            refreshQueueCount();
        };

        const handleOffline = () => {
            setIsOnline(false);
            refreshQueueCount();
        };

        // Attempt flush on mount
        flushPendingOutreachRegistrations().then(refreshQueueCount);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Load live courses and distinct outreach_event names from Supabase
    useEffect(() => {
        const fetchCoursesAndEvents = async () => {
            try {
                const { data: coursesData } = await supabase
                    .from('courses')
                    .select('title, is_draft');

                if (coursesData && coursesData.length > 0) {
                    const publishedTitles = Array.from(
                        new Set(
                            coursesData
                                .filter((c: any) => !c.is_draft && c.title)
                                .map((c: any) => String(c.title).trim())
                                .filter(Boolean)
                        )
                    );
                    if (publishedTitles.length > 0) {
                        setCourseOptions(publishedTitles);
                        try {
                            localStorage.setItem('outreach_cached_course_titles', JSON.stringify(publishedTitles));
                        } catch {
                            // ignore storage quota errors
                        }
                    }
                }
            } catch {
                // Fallback to cached course titles when offline
                try {
                    const cached = localStorage.getItem('outreach_cached_course_titles');
                    if (cached) {
                        const parsed = JSON.parse(cached);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            setCourseOptions(parsed);
                        }
                    }
                } catch {
                    // ignore
                }
            }

            // Pull distinct outreach_event names already used in outreach_registrations
            try {
                const { data: eventData } = await supabase
                    .from('outreach_registrations')
                    .select('outreach_event')
                    .not('outreach_event', 'is', null)
                    .limit(200);

                if (eventData && eventData.length > 0) {
                    const dbEvents = eventData
                        .map((r: any) => (r.outreach_event || '').trim())
                        .filter(Boolean);
                    const merged = Array.from(new Set([...dbEvents, ...DEFAULT_EVENT_PRESETS]));
                    setEventPresets(merged);
                }
            } catch {
                // ignore if offline
            }
        };

        fetchCoursesAndEvents();
    }, []);

    const toggleStudyDay = (day: string) => {
        setPreferredStudyDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
        if (errors.preferredStudyDays) {
            setErrors(prev => ({ ...prev, preferredStudyDays: '' }));
        }
    };

    const validateStep1 = (): boolean => {
        const nextErrors: Record<string, string> = {};
        if (!fullName.trim() || fullName.trim().length < 2) {
            nextErrors.fullName = 'Please enter your full name.';
        }
        const cleanedPhone = phone.trim();
        if (!cleanedPhone || cleanedPhone.replace(/[^0-9+]/g, '').length < 7) {
            nextErrors.phone = 'Please enter a valid phone number (e.g. 0770 000 000).';
        }
        if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            nextErrors.email = 'Please enter a valid email address or leave it blank.';
        }
        if (ageRange === 'Under 18') {
            if (!guardianName.trim() || guardianName.trim().length < 2) {
                nextErrors.guardianName = 'Parent or Guardian name is required for students under 18.';
            }
            if (!guardianPhone.trim() || guardianPhone.trim().replace(/[^0-9+]/g, '').length < 7) {
                nextErrors.guardianPhone = 'Parent or Guardian phone number is required for students under 18.';
            }
        }
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const validateStep2 = (): boolean => {
        const nextErrors: Record<string, string> = {};
        if (!courseInterest.trim()) {
            nextErrors.courseInterest = 'Please select a course interest (or "Not sure yet").';
        }
        if (preferredStudyDays.length === 0) {
            nextErrors.preferredStudyDays = 'Please pick at least one preferred study day.';
        }
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const validateStep3 = (): boolean => {
        const nextErrors: Record<string, string> = {};
        if (!howHeard.trim()) {
            nextErrors.howHeard = 'Please let us know how you heard about us.';
        }
        if (!consentContact) {
            nextErrors.consentContact = 'Please agree to be contacted by Welile School of AI to continue.';
        }
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleNextStep = () => {
        if (step === 1) {
            if (validateStep1()) setStep(2);
        } else if (step === 2) {
            if (validateStep2()) setStep(3);
        }
    };

    const handlePrevStep = () => {
        setErrors({});
        if (step === 2) setStep(1);
        if (step === 3) setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Honeypot check: reject submission if hidden bot field is filled
        if (honeypotWebsite && honeypotWebsite.trim().length > 0) {
            setErrors({ form: 'Spam submission detected.' });
            return;
        }

        if (!validateStep3()) return;

        setIsSubmitting(true);
        setErrors({});

        const payload: OutreachRegistrationPayload = {
            full_name: fullName.trim(),
            email: email.trim() ? email.trim().toLowerCase() : null,
            phone: phone.trim(),
            age_range: ageRange,
            guardian_name: ageRange === 'Under 18' ? guardianName.trim() : null,
            guardian_phone: ageRange === 'Under 18' ? guardianPhone.trim() : null,
            location: location.trim() || null,
            course_interest: courseInterest,
            level,
            mode_preference: modePreference,
            preferred_study_days: preferredStudyDays,
            preferred_time_slot: preferredTimeSlot,
            how_heard: howHeard,
            outreach_event: outreachEvent.trim() || null,
            consent_contact: consentContact,
            status: 'NEW',
            submitted_from: 'web'
        };

        // 1. Write immediately to the localStorage offline queue first
        const queuedItem = enqueueOutreachRegistration(payload);
        setPendingQueueCount(getQueuedOutreachRegistrations().length);

        // Add event name to local presets if new
        if (payload.outreach_event && !eventPresets.includes(payload.outreach_event)) {
            setEventPresets(prev => [payload.outreach_event!, ...prev]);
        }

        // 2. Attempt immediate Supabase insert
        try {
            await insertOutreachRegistrationLive(payload);

            // Remove from pending offline queue on successful insert
            if (queuedItem.id) {
                removeQueuedOutreachRegistration(queuedItem.id);
            }
            setPendingQueueCount(getQueuedOutreachRegistrations().length);

            // Also flush any older queued registrations while we have connectivity
            await flushPendingOutreachRegistrations();
            setPendingQueueCount(getQueuedOutreachRegistrations().length);

            window.dispatchEvent(new Event('outreach-registration-update'));
            setSubmittedRecord(payload);
            setSubmittedMode('online');
        } catch (err) {
            console.warn('Outreach submission queued for offline sync:', err);
            setSubmittedRecord(queuedItem);
            setSubmittedMode('offline');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRegisterAnother = () => {
        // Keep outreachEvent & howHeard intact so booth staff can register the next attendee rapidly
        setFullName('');
        setPhone('');
        setEmail('');
        setAgeRange('18-24');
        setGuardianName('');
        setGuardianPhone('');
        setLocation('');
        setCourseInterest('');
        setLevel('Beginner');
        setModePreference('Hybrid');
        setPreferredStudyDays(['Mon', 'Wed', 'Fri']);
        setPreferredTimeSlot('Evening');
        setConsentContact(false);
        setHoneypotWebsite('');
        setErrors({});
        setSubmittedRecord(null);
        setSubmittedMode(null);
        setStep(1);
    };

    const allCourseChoices = [
        ...courseOptions,
        ...(courseOptions.length === 0
            ? [
                'AI & Prompt Engineering Foundations',
                'Full-Stack Software Development with AI',
                'Data Analytics & Business Intelligence',
                'Cybersecurity & Network Fundamentals',
                'Digital Literacy & Productivity Tools'
            ]
            : []),
        'Not sure yet / Help me choose'
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 font-sans transition-colors duration-200 pb-28 sm:pb-16">
            {/* Top Navigation Bar matching LandingPage.tsx */}
            <nav className="sticky top-0 left-0 right-0 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md z-40 border-b border-gray-100 dark:border-slate-800/80 transition-colors">
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/" className="flex items-center gap-2.5 group">
                            <img src="/schoolofai-logo.png" alt="Welile School of AI" className="h-12 sm:h-14 object-contain" />
                        </Link>

                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Connectivity / Queue Status Pill */}
                            {!isOnline ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold border border-amber-200 dark:border-amber-800/60">
                                    <WifiOff size={12} /> Offline Mode
                                </span>
                            ) : pendingQueueCount > 0 ? (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        await flushPendingOutreachRegistrations();
                                        setPendingQueueCount(getQueuedOutreachRegistrations().length);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-[11px] font-bold border border-violet-200 dark:border-violet-800/60 cursor-pointer"
                                    title="Tap to sync queued offline registrations"
                                >
                                    <Wifi size={12} /> Syncing ({pendingQueueCount})
                                </button>
                            ) : null}

                            <button
                                type="button"
                                onClick={toggleTheme}
                                className="p-2.5 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800/60 rounded-full transition-all cursor-pointer flex items-center justify-center"
                                title={isDark ? 'Activate Light Mode' : 'Activate Dark Mode'}
                            >
                                {isDark ? <Sun size={18} /> : <Moon size={18} />}
                            </button>

                            <Link
                                to="/"
                                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <ArrowLeft size={15} />
                                <span className="hidden xs:inline">Home</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Container */}
            <main className="max-w-xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
                {/* Header Badge & Title */}
                <div className="text-center mb-6 sm:mb-8">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-[11px] font-bold uppercase tracking-wider mb-3 border border-violet-200/60 dark:border-violet-800/50">
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        Welile School of AI • Quick Registration
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                        Student Interest & Study Schedule
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto">
                        Reserve your spot in under 60 seconds. Our admissions team will contact you with cohort dates and onboarding details.
                    </p>
                </div>

                {/* SUCCESS SCREEN */}
                {submittedRecord ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="text-center space-y-3">
                            {submittedMode === 'online' ? (
                                <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                                    <CheckCircle2 size={36} />
                                </div>
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
                                    <WifiOff size={34} />
                                </div>
                            )}

                            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                                {submittedMode === 'online'
                                    ? 'You’re Registered!'
                                    : 'Saved — Will Sync Once You’re Back Online'}
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-slate-400 max-w-md mx-auto">
                                {submittedMode === 'online'
                                    ? `Thank you, ${submittedRecord.full_name}! Your study preferences have been received by the Welile School of AI admissions desk.`
                                    : `Thank you, ${submittedRecord.full_name}! Your registration is safely stored on this device and will automatically sync to Welile School of AI as soon as internet connectivity returns.`}
                            </p>
                        </div>

                        {/* Summary Card */}
                        <div className="bg-gray-50 dark:bg-slate-950/70 rounded-2xl p-5 border border-gray-100 dark:border-slate-800/80 space-y-3 text-sm">
                            <div className="flex items-center justify-between border-b border-gray-200/70 dark:border-slate-800 pb-2.5">
                                <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                                    Registration Summary
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                    submittedMode === 'online'
                                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                }`}>
                                    {submittedMode === 'online' ? 'Synced Live' : 'Queued Offline'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                                <div>
                                    <span className="text-gray-400 dark:text-slate-500 block text-[11px] font-semibold uppercase">Full Name</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{submittedRecord.full_name}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 dark:text-slate-500 block text-[11px] font-semibold uppercase">Phone Number</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{submittedRecord.phone}</span>
                                </div>
                                {submittedRecord.email && (
                                    <div>
                                        <span className="text-gray-400 dark:text-slate-500 block text-[11px] font-semibold uppercase">Email</span>
                                        <span className="font-medium text-gray-800 dark:text-slate-200">{submittedRecord.email}</span>
                                    </div>
                                )}
                                {submittedRecord.location && (
                                    <div>
                                        <span className="text-gray-400 dark:text-slate-500 block text-[11px] font-semibold uppercase">Location</span>
                                        <span className="font-medium text-gray-800 dark:text-slate-200">{submittedRecord.location}</span>
                                    </div>
                                )}
                                {submittedRecord.age_range === 'Under 18' && submittedRecord.guardian_name && (
                                    <div className="sm:col-span-2 p-2.5 rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40">
                                        <span className="text-violet-600 dark:text-violet-400 block text-[11px] font-bold uppercase">Parent / Guardian</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                            {submittedRecord.guardian_name} ({submittedRecord.guardian_phone})
                                        </span>
                                    </div>
                                )}
                                <div className="sm:col-span-2 pt-1 border-t border-gray-200/60 dark:border-slate-800">
                                    <span className="text-gray-400 dark:text-slate-500 block text-[11px] font-semibold uppercase">Course Interest</span>
                                    <span className="font-bold text-violet-600 dark:text-violet-400">{submittedRecord.course_interest}</span>
                                    <span className="text-xs text-gray-500 dark:text-slate-400 ml-2">
                                        ({submittedRecord.level} • {submittedRecord.mode_preference})
                                    </span>
                                </div>
                                <div className="sm:col-span-2">
                                    <span className="text-gray-400 dark:text-slate-500 block text-[11px] font-semibold uppercase">Preferred Schedule</span>
                                    <span className="font-medium text-gray-800 dark:text-slate-200">
                                        {(submittedRecord.preferred_study_days || []).join(', ')} • {submittedRecord.preferred_time_slot}
                                    </span>
                                </div>
                                {submittedRecord.outreach_event && (
                                    <div className="sm:col-span-2">
                                        <span className="text-gray-400 dark:text-slate-500 block text-[11px] font-semibold uppercase">Outreach Event</span>
                                        <span className="font-medium text-gray-800 dark:text-slate-200">{submittedRecord.outreach_event}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleRegisterAnother}
                                className="w-full py-4 px-6 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold text-base shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                                <UserPlus size={20} />
                                Register Another Person
                            </button>
                            <Link
                                to="/"
                                className="w-full sm:w-auto py-4 px-6 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-2xl font-bold text-sm flex items-center justify-center transition-colors text-center"
                            >
                                Explore Welile
                            </Link>
                        </div>
                    </div>
                ) : (
                    /* WIZARD FORM CARD */
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl overflow-hidden">
                        {/* Step Progress Header */}
                        <div className="p-5 sm:p-6 bg-gray-50/70 dark:bg-slate-900/90 border-b border-gray-100 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-extrabold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                                    Step {step} of 3
                                </span>
                                <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                                    {step === 1 && '1. About You'}
                                    {step === 2 && '2. Course & Schedule'}
                                    {step === 3 && '3. Event & Consent'}
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-2.5 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-violet-600 to-purple-500 rounded-full transition-all duration-300"
                                    style={{ width: `${(step / 3) * 100}%` }}
                                />
                            </div>

                            {/* Stepper Pills */}
                            <div className="grid grid-cols-3 gap-2 mt-4">
                                {[
                                    { num: 1, label: 'You', icon: User },
                                    { num: 2, label: 'Course', icon: BookOpen },
                                    { num: 3, label: 'Finish', icon: ShieldCheck }
                                ].map(({ num, label, icon: Icon }) => {
                                    const active = step === num;
                                    const completed = step > num;
                                    return (
                                        <button
                                            key={num}
                                            type="button"
                                            onClick={() => {
                                                if (num < step) {
                                                    setErrors({});
                                                    setStep(num as 1 | 2 | 3);
                                                }
                                            }}
                                            disabled={num > step}
                                            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                                                active
                                                    ? 'bg-violet-600 text-white shadow-sm'
                                                    : completed
                                                    ? 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 cursor-pointer'
                                                    : 'bg-gray-100 dark:bg-slate-800/70 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                                            }`}
                                        >
                                            {completed ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                                            <span>{label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSubmit} noValidate className="p-5 sm:p-7 space-y-5">
                            {/* Honeypot anti-spam field (hidden from real users) */}
                            <div className="opacity-0 absolute -z-10 h-0 w-0 overflow-hidden pointer-events-none" aria-hidden="true">
                                <label htmlFor="website_url_hp">Website</label>
                                <input
                                    id="website_url_hp"
                                    name="website_url_hp"
                                    type="text"
                                    tabIndex={-1}
                                    autoComplete="off"
                                    value={honeypotWebsite}
                                    onChange={(e) => setHoneypotWebsite(e.target.value)}
                                />
                            </div>

                            {/* STEP 1: YOU */}
                            {step === 1 && (
                                <div className="space-y-5 animate-in fade-in duration-200">
                                    {/* Full Name */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1.5">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                                            <input
                                                type="text"
                                                required
                                                value={fullName}
                                                onChange={(e) => {
                                                    setFullName(e.target.value);
                                                    if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
                                                }}
                                                placeholder="e.g. Sarah Namukasa"
                                                className={`w-full pl-11 pr-4 py-3.5 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border rounded-2xl text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                                                    errors.fullName
                                                        ? 'border-red-500 focus:ring-red-500/20'
                                                        : 'border-gray-200 dark:border-slate-700 focus:border-violet-500 focus:ring-violet-500/20'
                                                }`}
                                            />
                                        </div>
                                        {errors.fullName && (
                                            <p className="mt-1.5 text-xs font-semibold text-red-500 flex items-center gap-1">
                                                <AlertCircle size={13} /> {errors.fullName}
                                            </p>
                                        )}
                                    </div>

                                    {/* Phone Number */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1.5">
                                            Phone / WhatsApp Number <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                                            <input
                                                type="tel"
                                                required
                                                value={phone}
                                                onChange={(e) => {
                                                    setPhone(e.target.value);
                                                    if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                                                }}
                                                placeholder="e.g. 0772 123 456"
                                                className={`w-full pl-11 pr-4 py-3.5 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border rounded-2xl text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                                                    errors.phone
                                                        ? 'border-red-500 focus:ring-red-500/20'
                                                        : 'border-gray-200 dark:border-slate-700 focus:border-violet-500 focus:ring-violet-500/20'
                                                }`}
                                            />
                                        </div>
                                        {errors.phone && (
                                            <p className="mt-1.5 text-xs font-semibold text-red-500 flex items-center gap-1">
                                                <AlertCircle size={13} /> {errors.phone}
                                            </p>
                                        )}
                                    </div>

                                    {/* Email (Optional) */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1.5">
                                            Email Address <span className="text-gray-400 font-normal lowercase">(optional)</span>
                                        </label>
                                        <div className="relative">
                                            <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => {
                                                    setEmail(e.target.value);
                                                    if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                                                }}
                                                placeholder="sarah@example.com"
                                                className={`w-full pl-11 pr-4 py-3.5 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border rounded-2xl text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                                                    errors.email
                                                        ? 'border-red-500 focus:ring-red-500/20'
                                                        : 'border-gray-200 dark:border-slate-700 focus:border-violet-500 focus:ring-violet-500/20'
                                                }`}
                                            />
                                        </div>
                                        {errors.email && (
                                            <p className="mt-1.5 text-xs font-semibold text-red-500 flex items-center gap-1">
                                                <AlertCircle size={13} /> {errors.email}
                                            </p>
                                        )}
                                    </div>

                                    {/* Age Range */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-2">
                                            Age Range
                                        </label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                            {AGE_RANGES.map((range) => {
                                                const selected = ageRange === range;
                                                return (
                                                    <button
                                                        key={range}
                                                        type="button"
                                                        onClick={() => setAgeRange(range)}
                                                        className={`py-3 px-3 min-h-[48px] rounded-2xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                                                            selected
                                                                ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-600/20'
                                                                : 'bg-gray-50 dark:bg-slate-800/80 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-violet-400'
                                                        }`}
                                                    >
                                                        {range}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Conditional Parent / Guardian Section when Under 18 */}
                                    {ageRange === 'Under 18' && (
                                        <div className="p-4 sm:p-5 rounded-2xl bg-violet-50/70 dark:bg-violet-950/25 border border-violet-200 dark:border-violet-800/60 space-y-4 animate-in fade-in duration-200">
                                            <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300 font-bold text-xs uppercase tracking-wider">
                                                <ShieldCheck size={16} />
                                                Parent / Guardian Details (Required for Under 18)
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                                                    Parent / Guardian Full Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={guardianName}
                                                    onChange={(e) => {
                                                        setGuardianName(e.target.value);
                                                        if (errors.guardianName) setErrors(prev => ({ ...prev, guardianName: '' }));
                                                    }}
                                                    placeholder="e.g. Mr. David Namukasa"
                                                    className={`w-full px-4 py-3 min-h-[48px] bg-white dark:bg-slate-900 border rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${
                                                        errors.guardianName
                                                            ? 'border-red-500 focus:ring-red-500/20'
                                                            : 'border-violet-200 dark:border-slate-700 focus:border-violet-500 focus:ring-violet-500/20'
                                                    }`}
                                                />
                                                {errors.guardianName && (
                                                    <p className="mt-1 text-xs font-semibold text-red-500 flex items-center gap-1">
                                                        <AlertCircle size={13} /> {errors.guardianName}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                                                    Parent / Guardian Phone Number <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={guardianPhone}
                                                    onChange={(e) => {
                                                        setGuardianPhone(e.target.value);
                                                        if (errors.guardianPhone) setErrors(prev => ({ ...prev, guardianPhone: '' }));
                                                    }}
                                                    placeholder="e.g. 0772 987 654"
                                                    className={`w-full px-4 py-3 min-h-[48px] bg-white dark:bg-slate-900 border rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${
                                                        errors.guardianPhone
                                                            ? 'border-red-500 focus:ring-red-500/20'
                                                            : 'border-violet-200 dark:border-slate-700 focus:border-violet-500 focus:ring-violet-500/20'
                                                    }`}
                                                />
                                                {errors.guardianPhone && (
                                                    <p className="mt-1 text-xs font-semibold text-red-500 flex items-center gap-1">
                                                        <AlertCircle size={13} /> {errors.guardianPhone}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Location */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1.5">
                                            Location (City / Area)
                                        </label>
                                        <div className="relative">
                                            <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                                            <input
                                                type="text"
                                                value={location}
                                                onChange={(e) => setLocation(e.target.value)}
                                                placeholder="e.g. Kampala, Ntinda / Makerere"
                                                className="w-full pl-11 pr-4 py-3.5 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: COURSE & STUDY SCHEDULE */}
                            {step === 2 && (
                                <div className="space-y-6 animate-in fade-in duration-200">
                                    {/* Course Interest Dropdown */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1.5">
                                            Course of Interest <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <BookOpen size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                                            <select
                                                value={courseInterest}
                                                onChange={(e) => {
                                                    setCourseInterest(e.target.value);
                                                    if (errors.courseInterest) setErrors(prev => ({ ...prev, courseInterest: '' }));
                                                }}
                                                className={`w-full pl-11 pr-4 py-3.5 min-h-[50px] bg-gray-50 dark:bg-slate-800/90 border rounded-2xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                                                    errors.courseInterest
                                                        ? 'border-red-500 focus:ring-red-500/20'
                                                        : 'border-gray-200 dark:border-slate-700 focus:border-violet-500 focus:ring-violet-500/20'
                                                }`}
                                            >
                                                <option value="">-- Select a programme --</option>
                                                {allCourseChoices.map((title) => (
                                                    <option key={title} value={title}>
                                                        {title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {errors.courseInterest && (
                                            <p className="mt-1.5 text-xs font-semibold text-red-500 flex items-center gap-1">
                                                <AlertCircle size={13} /> {errors.courseInterest}
                                            </p>
                                        )}
                                    </div>

                                    {/* Current Skill Level (Radio Pills) */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-2">
                                            Your Current Skill Level
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                            {LEVELS.map((item) => {
                                                const selected = level === item.value;
                                                return (
                                                    <button
                                                        key={item.value}
                                                        type="button"
                                                        onClick={() => setLevel(item.value)}
                                                        className={`p-3.5 min-h-[56px] rounded-2xl border text-left transition-all cursor-pointer flex sm:flex-col justify-between sm:justify-center items-center sm:items-start ${
                                                            selected
                                                                ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-600/20'
                                                                : 'bg-gray-50 dark:bg-slate-800/80 text-gray-800 dark:text-slate-200 border-gray-200 dark:border-slate-700 hover:border-violet-400'
                                                        }`}
                                                    >
                                                        <span className="font-bold text-sm">{item.value}</span>
                                                        <span className={`text-[11px] mt-0.5 ${selected ? 'text-violet-100' : 'text-gray-500 dark:text-slate-400'}`}>
                                                            {item.desc}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Study Mode Preference */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-2">
                                            Preferred Study Mode
                                        </label>
                                        <div className="grid grid-cols-3 gap-2.5">
                                            {MODES.map((m) => {
                                                const Icon = m.icon;
                                                const selected = modePreference === m.value;
                                                return (
                                                    <button
                                                        key={m.value}
                                                        type="button"
                                                        onClick={() => setModePreference(m.value)}
                                                        className={`p-3 min-h-[72px] rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                                                            selected
                                                                ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-600/20'
                                                                : 'bg-gray-50 dark:bg-slate-800/80 text-gray-800 dark:text-slate-200 border-gray-200 dark:border-slate-700 hover:border-violet-400'
                                                        }`}
                                                    >
                                                        <Icon size={18} />
                                                        <span className="font-bold text-xs sm:text-sm">{m.label}</span>
                                                        <span className={`text-[10px] hidden sm:block ${selected ? 'text-violet-100' : 'text-gray-500 dark:text-slate-400'}`}>
                                                            {m.desc}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Preferred Study Days (Multi-select chips Mon-Sun) */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300">
                                                Preferred Study Days <span className="text-red-500">*</span>
                                            </label>
                                            <span className="text-[11px] text-gray-400 dark:text-slate-500">Tap all that apply</span>
                                        </div>
                                        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                                            {DAYS_OF_WEEK.map((day) => {
                                                const selected = preferredStudyDays.includes(day);
                                                return (
                                                    <button
                                                        key={day}
                                                        type="button"
                                                        onClick={() => toggleStudyDay(day)}
                                                        className={`py-3 min-h-[48px] rounded-xl font-bold text-xs border transition-all cursor-pointer flex items-center justify-center ${
                                                            selected
                                                                ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                                                                : 'bg-gray-50 dark:bg-slate-800/80 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-violet-400'
                                                        }`}
                                                    >
                                                        {day}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {errors.preferredStudyDays && (
                                            <p className="mt-1.5 text-xs font-semibold text-red-500 flex items-center gap-1">
                                                <AlertCircle size={13} /> {errors.preferredStudyDays}
                                            </p>
                                        )}
                                    </div>

                                    {/* Preferred Time Slot */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-2">
                                            Preferred Time Slot
                                        </label>
                                        <div className="grid grid-cols-2 gap-2.5">
                                            {TIME_SLOTS.map((slot) => {
                                                const selected = preferredTimeSlot === slot.value;
                                                return (
                                                    <button
                                                        key={slot.value}
                                                        type="button"
                                                        onClick={() => setPreferredTimeSlot(slot.value)}
                                                        className={`p-3 min-h-[54px] rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-center ${
                                                            selected
                                                                ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-600/20'
                                                                : 'bg-gray-50 dark:bg-slate-800/80 text-gray-800 dark:text-slate-200 border-gray-200 dark:border-slate-700 hover:border-violet-400'
                                                        }`}
                                                    >
                                                        <span className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                                                            <Clock size={13} /> {slot.value}
                                                        </span>
                                                        <span className={`text-[11px] mt-0.5 ${selected ? 'text-violet-100' : 'text-gray-500 dark:text-slate-400'}`}>
                                                            {slot.time}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: FINISH */}
                            {step === 3 && (
                                <div className="space-y-6 animate-in fade-in duration-200">
                                    {/* How did you hear about us */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-2">
                                            How Did You Hear About Welile School of AI?
                                        </label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                            {HOW_HEARD_OPTIONS.map((opt) => {
                                                const selected = howHeard === opt;
                                                return (
                                                    <button
                                                        key={opt}
                                                        type="button"
                                                        onClick={() => setHowHeard(opt)}
                                                        className={`py-3 px-3 min-h-[48px] rounded-2xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                                                            selected
                                                                ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-600/20'
                                                                : 'bg-gray-50 dark:bg-slate-800/80 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-violet-400'
                                                        }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {errors.howHeard && (
                                            <p className="mt-1.5 text-xs font-semibold text-red-500 flex items-center gap-1">
                                                <AlertCircle size={13} /> {errors.howHeard}
                                            </p>
                                        )}
                                    </div>

                                    {/* Outreach Event Name (with quick preset dropdown/chips + custom input) */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1.5">
                                            Outreach Event / Campaign Name <span className="text-gray-400 font-normal lowercase">(optional)</span>
                                        </label>
                                        <div className="relative">
                                            <Megaphone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                                            <input
                                                type="text"
                                                list="outreach-event-presets"
                                                value={outreachEvent}
                                                onChange={(e) => setOutreachEvent(e.target.value)}
                                                placeholder="Select or type event name (e.g. Makerere Career Fair Nov 2026)"
                                                className="w-full pl-11 pr-4 py-3.5 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                                            />
                                            <datalist id="outreach-event-presets">
                                                {eventPresets.map((ev) => (
                                                    <option key={ev} value={ev} />
                                                ))}
                                            </datalist>
                                        </div>

                                        {/* Quick-tap preset pills for booth staff */}
                                        <div className="mt-2.5">
                                            <span className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 block mb-1.5">
                                                Quick Select Active Event:
                                            </span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {eventPresets.slice(0, 6).map((preset) => {
                                                    const active = outreachEvent === preset;
                                                    return (
                                                        <button
                                                            key={preset}
                                                            type="button"
                                                            onClick={() => setOutreachEvent(active ? '' : preset)}
                                                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                                                active
                                                                    ? 'bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700'
                                                                    : 'bg-gray-50 dark:bg-slate-800/60 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-violet-400'
                                                            }`}
                                                        >
                                                            {preset}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Review Preview */}
                                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950/60 border border-gray-100 dark:border-slate-800 text-xs space-y-1.5">
                                        <div className="font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-1">
                                            Quick Check
                                        </div>
                                        <p className="text-gray-600 dark:text-slate-400">
                                            <span className="font-bold text-gray-900 dark:text-white">{fullName}</span> • {phone}
                                            {email ? ` • ${email}` : ''}
                                        </p>
                                        <p className="text-gray-600 dark:text-slate-400">
                                            Programme: <span className="font-bold text-violet-600 dark:text-violet-400">{courseInterest}</span> ({level}, {modePreference})
                                        </p>
                                        <p className="text-gray-600 dark:text-slate-400">
                                            Schedule: {preferredStudyDays.join(', ')} ({preferredTimeSlot})
                                        </p>
                                    </div>

                                    {/* Required Consent Checkbox */}
                                    <div>
                                        <label
                                            className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                                                consentContact
                                                    ? 'bg-violet-50/70 dark:bg-violet-950/30 border-violet-300 dark:border-violet-700'
                                                    : errors.consentContact
                                                    ? 'bg-red-50/50 dark:bg-red-950/20 border-red-400 dark:border-red-800'
                                                    : 'bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={consentContact}
                                                onChange={(e) => {
                                                    setConsentContact(e.target.checked);
                                                    if (errors.consentContact) setErrors(prev => ({ ...prev, consentContact: '' }));
                                                }}
                                                className="mt-0.5 w-5 h-5 accent-violet-600 rounded cursor-pointer shrink-0"
                                            />
                                            <span className="text-xs sm:text-sm text-gray-700 dark:text-slate-200 font-medium leading-relaxed">
                                                I agree to be contacted by <strong className="text-gray-900 dark:text-white">Welile School of AI</strong> about this programme, study schedules, and enrollment opportunities. <span className="text-red-500">*</span>
                                            </span>
                                        </label>
                                        {errors.consentContact && (
                                            <p className="mt-1.5 text-xs font-semibold text-red-500 flex items-center gap-1">
                                                <AlertCircle size={13} /> {errors.consentContact}
                                            </p>
                                        )}
                                    </div>

                                    {errors.form && (
                                        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-600 dark:text-red-300">
                                            {errors.form}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Sticky Mobile / Standard Desktop Navigation Footer */}
                            <div className="fixed bottom-0 left-0 right-0 sm:static bg-white/95 dark:bg-slate-900/95 sm:bg-transparent sm:dark:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-t border-gray-200 dark:border-slate-800 sm:border-t-0 p-4 sm:p-0 sm:pt-4 z-30">
                                <div className="max-w-xl mx-auto flex items-center gap-3">
                                    {step > 1 && (
                                        <button
                                            type="button"
                                            onClick={handlePrevStep}
                                            className="px-5 py-3.5 min-h-[50px] rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-bold text-sm hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <ArrowLeft size={16} />
                                            Back
                                        </button>
                                    )}

                                    {step < 3 ? (
                                        <button
                                            type="button"
                                            onClick={handleNextStep}
                                            className="flex-1 py-3.5 px-6 min-h-[50px] bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold text-sm sm:text-base shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                                        >
                                            Continue
                                            <ArrowRight size={18} />
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-1 py-3.5 px-6 min-h-[50px] bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 text-white rounded-2xl font-bold text-sm sm:text-base shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader size={18} className="animate-spin" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 size={18} />
                                                    Submit Registration
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
};

export default OutreachRegistration;
