import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../src/lib/supabaseClient';
import {
    enqueueOutreachRegistration,
    removeQueuedOutreachRegistration,
    flushPendingOutreachRegistrations,
    getQueuedOutreachRegistrations,
    insertOutreachRegistrationLive,
    fetchOutreachCampaigns,
    generateStudentRegNo,
    DEFAULT_OUTREACH_CAMPAIGNS,
    OutreachCampaign,
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
    GraduationCap,
    Wallet,
    FileCheck,
    PenTool,
    Printer
} from 'lucide-react';

const CLASS_LEVEL_OPTIONS = [
    'University - Year 1',
    'University - Year 2',
    'University - Year 3',
    'University - Year 4 / Finalist',
    'Diploma / Certificate Student',
    'Recent Graduate',
    'Working Professional',
    'High School (S.5 – S.6)',
    'High School (S.1 – S.4)',
    'Vacationist'
];

const AGE_RANGES = ['18-24', '25-34', '35+', 'Under 18'];

const LOCATION_PRESETS = [
    'Nkumba, Entebbe',
    'Katabi, Entebbe',
    'Entebbe Town',
    'Kampala Central',
    'Makerere / Wandegeya',
    'Wakiso',
    'Mukono',
    'Other'
];

const DEFAULT_COURSES = [
    'Coding With AI',
    'AI & Prompt Engineering Foundations',
    'Full-Stack Software Development with AI',
    'Data Analytics & Business Intelligence',
    'Cybersecurity & Network Fundamentals',
    'Digital Literacy & AI Office Productivity'
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const MODES = ['Physical', 'Online', 'Hybrid'];
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const STUDY_TIME_SLOTS = [
    '09:00 AM – 11:00 AM (Morning)',
    '11:00 AM – 01:00 PM (Late Morning)',
    '02:00 PM – 04:00 PM (Afternoon)',
    '04:00 PM – 06:00 PM (Late Afternoon)',
    '06:00 PM – 08:00 PM (Evening)',
    '10:00 AM – 02:00 PM (Weekend Intensive)'
];

const STUDY_HOURS_OPTIONS = [
    '2 Hours',
    '1.5 Hours',
    '3 Hours',
    '4 Hours (Weekend)'
];

const ALTERNATIVE_TIME_OPTIONS = [
    '06:00 PM – 08:00 PM (Evening)',
    '04:00 PM – 06:00 PM (Late Afternoon)',
    '02:00 PM – 04:00 PM (Afternoon)',
    '09:00 AM – 11:00 AM (Morning)',
    '10:00 AM – 02:00 PM (Weekend)',
    'Not Applicable / Flexible'
];

const PAYMENT_PLANS = [
    { value: 'Full', label: 'Full Payment', defaultAgreed: 600000 },
    { value: 'Monthly', label: 'Monthly Plan', defaultAgreed: 200000 },
    { value: 'Weekly', label: 'Weekly Plan', defaultAgreed: 750000 / 10 },
    { value: 'Other', label: 'Other / Custom', defaultAgreed: 150000 }
];

const PAYMENT_METHODS = ['Mobile Money', 'Cash', 'Bank', 'Other'];

const OFFICIAL_COMMITMENTS = [
    'Attend classes according to the study schedule selected above.',
    'Be punctual and committed to the agreed study hours.',
    'Inform the school in advance if unable to attend a scheduled session.',
    'Complete assigned coursework, activities and learning requirements.',
    'Follow the rules and guidelines of Welile School of AI.',
    'Pay all agreed fees according to the payment plan and deadlines.',
    'Communicate with the school regarding changes to the study schedule or payment arrangements.',
    'Take responsibility for my learning progress and participation.'
];

const OutreachRegistration: React.FC = () => {
    const [searchParams] = useSearchParams();
    const initialEventFromUrl = searchParams.get('event') || '';

    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
    const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
    const [pendingQueueCount, setPendingQueueCount] = useState(() => getQueuedOutreachRegistrations().length);

    // Step 1: Sections 1 & 2 | Step 2: Sections 3 & 4 | Step 3: Sections 5, 6, 7 & Submit
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [singlePageMode, setSinglePageMode] = useState(false);

    // Dropdown options from DB
    const [campaigns, setCampaigns] = useState<OutreachCampaign[]>(DEFAULT_OUTREACH_CAMPAIGNS);
    const [courseOptions, setCourseOptions] = useState<string[]>(DEFAULT_COURSES);

    // Header Metadata
    const todayStr = new Date().toISOString().split('T')[0];
    const [registrationDate, setRegistrationDate] = useState('2026-11-06');
    const [studentRegNo, setStudentRegNo] = useState(() => generateStudentRegNo());
    const [outreachEvent, setOutreachEvent] = useState(
        initialEventFromUrl || 'Nkumba University Outreach (Fri, 6th Nov 2026)'
    );
    const [howHeard, setHowHeard] = useState('Outreach Event');

    // 1. STUDENT INFORMATION
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [classLevelYear, setClassLevelYear] = useState('University - Year 2');
    const [ageRange, setAgeRange] = useState('18-24');
    const [location, setLocation] = useState('Nkumba, Entebbe');
    const [guardianName, setGuardianName] = useState('');
    const [guardianPhone, setGuardianPhone] = useState('');

    // 2. COURSE & PROGRAMME INFORMATION
    const [courseInterest, setCourseInterest] = useState('Coding With AI');
    const [level, setLevel] = useState('Intermediate');
    const [modePreference, setModePreference] = useState('Hybrid');
    const [expectedStartDate, setExpectedStartDate] = useState('2026-11-09');
    const [expectedCompletionDate, setExpectedCompletionDate] = useState('2027-01-04');

    // 3. STUDY SCHEDULE
    const [preferredStudyDays, setPreferredStudyDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
    const [chosenStudyTime, setChosenStudyTime] = useState('04:00 PM – 06:00 PM (Late Afternoon)');
    const [studyHoursPerSession, setStudyHoursPerSession] = useState('2 Hours');
    const [sessionsPerWeek, setSessionsPerWeek] = useState('3 Sessions / Week');
    const [alternativeStudyTime, setAlternativeStudyTime] = useState('06:00 PM – 08:00 PM (Evening)');

    // 4. FEES & PAYMENT AGREEMENT
    const [totalCourseFee] = useState<number>(600000);
    const [registrationFee] = useState<string>('Not Applicable');
    const [amountPaid, setAmountPaid] = useState<number>(0);
    const [paymentPlan, setPaymentPlan] = useState<string>('Monthly');
    const [agreedPaymentAmount, setAgreedPaymentAmount] = useState<number>(200000);
    const [nextPaymentDate, setNextPaymentDate] = useState<string>('2026-11-09');
    const [paymentDueDate, setPaymentDueDate] = useState<string>('2026-12-09');
    const [paymentMethod, setPaymentMethod] = useState<string>('Mobile Money');
    const [paymentReference, setPaymentReference] = useState<string>('Pending / Upon Enrollment');

    // 5, 6, 7. COMMITMENTS, DECLARATION & SIGNATURES
    const [checkedCommitments, setCheckedCommitments] = useState<boolean[]>(
        OFFICIAL_COMMITMENTS.map(() => true)
    );
    const [studentSignature, setStudentSignature] = useState('');
    const [studentDeclarationDate, setStudentDeclarationDate] = useState(todayStr);
    const [guardianSignature, setGuardianSignature] = useState('');
    const [guardianConsentDate, setGuardianConsentDate] = useState(todayStr);

    // Honeypot
    const [honeypotWebsite, setHoneypotWebsite] = useState('');

    // Validation & submit states
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedRecord, setSubmittedRecord] = useState<OutreachRegistrationPayload | null>(null);
    const [submittedMode, setSubmittedMode] = useState<'online' | 'offline' | null>(null);

    const outstandingBalance = Math.max(0, totalCourseFee - (Number(amountPaid) || 0));

    // Sync signature default with fullName when user types their name
    useEffect(() => {
        if (fullName.trim()) {
            setStudentSignature(fullName.trim());
        }
    }, [fullName]);

    useEffect(() => {
        if (guardianName.trim()) {
            setGuardianSignature(guardianName.trim());
        }
    }, [guardianName]);

    // Auto-calculate Expected Completion Date (+8 weeks) and Payment dates when Expected Start Date changes
    useEffect(() => {
        if (expectedStartDate) {
            const start = new Date(expectedStartDate);
            if (!isNaN(start.getTime())) {
                const comp = new Date(start);
                comp.setDate(comp.getDate() + 56);
                setExpectedCompletionDate(comp.toISOString().split('T')[0]);
                setNextPaymentDate(expectedStartDate);

                const due = new Date(start);
                due.setDate(due.getDate() + 30);
                setPaymentDueDate(due.toISOString().split('T')[0]);
            }
        }
    }, [expectedStartDate]);

    // Auto-sync sessionsPerWeek when preferredStudyDays changes
    useEffect(() => {
        const count = preferredStudyDays.length;
        if (count > 0) {
            setSessionsPerWeek(`${count} ${count === 1 ? 'Session' : 'Sessions'} / Week`);
        }
    }, [preferredStudyDays]);

    // Theme listener
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

    // Online/Offline listener
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
        flushPendingOutreachRegistrations().then(refreshQueueCount);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Load Outreach Campaigns & Live Courses
    useEffect(() => {
        const loadData = async () => {
            const loadedCampaigns = await fetchOutreachCampaigns();
            const activeCampaigns = loadedCampaigns.filter(c => c.isActive !== false);
            if (activeCampaigns.length > 0) {
                setCampaigns(activeCampaigns);
                if (!initialEventFromUrl) {
                    const defaultCamp = activeCampaigns.find(c => c.isDefault) || activeCampaigns[0];
                    if (defaultCamp) {
                        setOutreachEvent(defaultCamp.name);
                    }
                }
            }

            try {
                const { data: coursesData } = await supabase
                    .from('courses')
                    .select('title, is_draft');

                if (coursesData && coursesData.length > 0) {
                    const dbTitles = coursesData
                        .filter((c: any) => !c.is_draft && c.title)
                        .map((c: any) => String(c.title).trim())
                        .filter(Boolean);
                    const merged = Array.from(new Set(['Coding With AI', ...dbTitles, ...DEFAULT_COURSES]));
                    setCourseOptions(merged);
                }
            } catch {
                // use default courses when offline
            }
        };
        loadData();
    }, [initialEventFromUrl]);

    const toggleStudyDay = (day: string) => {
        setPreferredStudyDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
        if (errors.preferredStudyDays) {
            setErrors(prev => ({ ...prev, preferredStudyDays: '' }));
        }
    };

    const handlePaymentPlanChange = (planValue: string) => {
        setPaymentPlan(planValue);
        const found = PAYMENT_PLANS.find(p => p.value === planValue);
        if (found) {
            setAgreedPaymentAmount(found.defaultAgreed);
        }
    };

    const isGuardianRequired =
        ageRange === 'Under 18' ||
        classLevelYear.includes('High School');

    const validateStep1 = (): boolean => {
        const nextErrors: Record<string, string> = {};
        if (!fullName.trim() || fullName.trim().length < 2) {
            nextErrors.fullName = 'Please enter the student’s full name.';
        }
        const cleanedPhone = phone.trim();
        if (!cleanedPhone || cleanedPhone.replace(/[^0-9+]/g, '').length < 7) {
            nextErrors.phone = 'Please enter a valid phone number (e.g. 0772 123 456).';
        }
        if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            nextErrors.email = 'Please enter a valid email address or leave blank.';
        }
        if (isGuardianRequired) {
            if (!guardianName.trim()) {
                nextErrors.guardianName = 'Parent / Guardian name is required for students under 18 or in High School.';
            }
            if (!guardianPhone.trim()) {
                nextErrors.guardianPhone = 'Parent / Guardian contact is required.';
            }
        }
        if (!courseInterest.trim()) {
            nextErrors.courseInterest = 'Please select a Course / Programme.';
        }
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const validateStep2 = (): boolean => {
        const nextErrors: Record<string, string> = {};
        if (preferredStudyDays.length === 0) {
            nextErrors.preferredStudyDays = 'Please select at least one preferred study day.';
        }
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const validateStep3 = (): boolean => {
        const nextErrors: Record<string, string> = {};
        const allCommitted = checkedCommitments.every(Boolean);
        if (!allCommitted) {
            nextErrors.commitments = 'Please confirm all Student Commitment items to complete registration.';
        }
        if (!studentSignature.trim()) {
            nextErrors.studentSignature = 'Please type your full name as your digital Student Signature.';
        }
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleNextStep = () => {
        if (step === 1 && validateStep1()) {
            setStep(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (step === 2 && validateStep2()) {
            setStep(3);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePrevStep = () => {
        setErrors({});
        if (step === 2) setStep(1);
        if (step === 3) setStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (honeypotWebsite && honeypotWebsite.trim().length > 0) return;

        if (!validateStep1() || !validateStep2() || !validateStep3()) {
            if (!validateStep1()) setStep(1);
            else if (!validateStep2()) setStep(2);
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        const selectedCampaign = campaigns.find(c => c.name === outreachEvent);
        const resolvedHowHeard =
            selectedCampaign?.category === 'GENERAL' ? 'Website / Walk-in' : howHeard || 'Outreach Event';

        const payload: OutreachRegistrationPayload = {
            registration_date: registrationDate,
            student_reg_no: studentRegNo,

            // 1. STUDENT INFORMATION
            full_name: fullName.trim(),
            email: email.trim() ? email.trim().toLowerCase() : null,
            phone: phone.trim(),
            class_level_year: classLevelYear,
            age_range: ageRange,
            guardian_name: guardianName.trim() || null,
            guardian_phone: guardianPhone.trim() || null,
            location: location,

            // 2. COURSE & PROGRAMME INFORMATION
            course_interest: courseInterest,
            level,
            mode_preference: modePreference,
            expected_start_date: expectedStartDate,
            expected_completion_date: expectedCompletionDate,

            // 3. STUDY SCHEDULE
            preferred_study_days: preferredStudyDays,
            preferred_time_slot: chosenStudyTime,
            study_hours_per_session: studyHoursPerSession,
            sessions_per_week: sessionsPerWeek,
            alternative_study_time: alternativeStudyTime,

            // 4. FEES & PAYMENT AGREEMENT
            total_course_fee: totalCourseFee,
            registration_fee: registrationFee,
            amount_paid: Number(amountPaid) || 0,
            outstanding_balance: outstandingBalance,
            payment_plan: paymentPlan,
            agreed_payment_amount: Number(agreedPaymentAmount) || 0,
            next_payment_date: nextPaymentDate,
            payment_due_date: paymentDueDate,
            payment_method: paymentMethod,
            payment_reference: paymentReference,

            // 5, 6, 7. COMMITMENTS & SIGNATURES
            commitments_accepted: true,
            commitments_list: OFFICIAL_COMMITMENTS,
            student_signature: studentSignature.trim() || fullName.trim(),
            student_declaration_date: studentDeclarationDate,
            guardian_signature: guardianName.trim() ? (guardianSignature.trim() || guardianName.trim()) : null,
            guardian_consent_date: guardianName.trim() ? guardianConsentDate : null,
            consent_contact: true,

            // OUTREACH ATTRIBUTION
            how_heard: resolvedHowHeard,
            outreach_event: outreachEvent,

            // 8. ADMIN USE DEFAULTS
            status: 'NEW',
            admin_payment_status:
                Number(amountPaid) >= totalCourseFee
                    ? 'Fully Paid'
                    : Number(amountPaid) > 0
                    ? 'Partially Paid'
                    : 'Payment Plan',
            confirmed_schedule: `${preferredStudyDays.join(', ')} (${chosenStudyTime})`,
            submitted_from: 'web'
        };

        const queuedItem = enqueueOutreachRegistration(payload);
        setPendingQueueCount(getQueuedOutreachRegistrations().length);

        try {
            await insertOutreachRegistrationLive(payload);
            if (queuedItem.id) {
                removeQueuedOutreachRegistration(queuedItem.id);
            }
            setPendingQueueCount(getQueuedOutreachRegistrations().length);
            await flushPendingOutreachRegistrations();
            setPendingQueueCount(getQueuedOutreachRegistrations().length);

            window.dispatchEvent(new Event('outreach-registration-update'));
            setSubmittedRecord(payload);
            setSubmittedMode('online');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.warn('Queued registration for offline sync:', err);
            setSubmittedRecord(queuedItem);
            setSubmittedMode('offline');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRegisterAnother = () => {
        setStudentRegNo(generateStudentRegNo());
        setFullName('');
        setEmail('');
        setPhone('');
        setGuardianName('');
        setGuardianPhone('');
        setAmountPaid(0);
        setPaymentReference('Pending / Upon Enrollment');
        setStudentSignature('');
        setGuardianSignature('');
        setCheckedCommitments(OFFICIAL_COMMITMENTS.map(() => true));
        setErrors({});
        setSubmittedRecord(null);
        setSubmittedMode(null);
        setStep(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const showStep1 = singlePageMode || step === 1;
    const showStep2 = singlePageMode || step === 2;
    const showStep3 = singlePageMode || step === 3;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 font-sans transition-colors duration-200 pb-28 sm:pb-16">
            {/* Navigation Bar */}
            <nav className="sticky top-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-40 border-b border-gray-100 dark:border-slate-800 print:hidden">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/" className="flex items-center gap-2.5">
                            <img src="/schoolofai-logo.png" alt="Welile School of AI" className="h-12 sm:h-14 object-contain" />
                            <div className="hidden sm:block">
                                <span className="block text-xs font-extrabold tracking-wider text-violet-600 dark:text-violet-400 uppercase">
                                    Welile School of AI
                                </span>
                                <span className="block text-[11px] text-gray-500 dark:text-slate-400">
                                    Katabi, Entebbe, Uganda
                                </span>
                            </div>
                        </Link>

                        <div className="flex items-center gap-2 sm:gap-3">
                            {!isOnline ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold border border-amber-200 dark:border-amber-800/60">
                                    <WifiOff size={12} /> Offline Ready
                                </span>
                            ) : pendingQueueCount > 0 ? (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        await flushPendingOutreachRegistrations();
                                        setPendingQueueCount(getQueuedOutreachRegistrations().length);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-[11px] font-bold border border-violet-200 dark:border-violet-800/60 cursor-pointer"
                                >
                                    <Wifi size={12} /> Sync ({pendingQueueCount})
                                </button>
                            ) : null}

                            {!submittedRecord && (
                                <button
                                    type="button"
                                    onClick={() => setSinglePageMode(prev => !prev)}
                                    className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                >
                                    {singlePageMode ? 'Wizard View' : 'Full Form View'}
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={toggleTheme}
                                className="p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                            >
                                {isDark ? <Sun size={18} /> : <Moon size={18} />}
                            </button>

                            <Link
                                to="/"
                                className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
                            >
                                <ArrowLeft size={14} /> Home
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
                {/* OFFICIAL PAPER FORM HEADER */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm mb-6">
                    <div className="text-center border-b border-gray-200 dark:border-slate-800 pb-5 mb-5">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-[11px] font-extrabold uppercase tracking-widest mb-2">
                            <Sparkles size={13} /> Official Enrollment & Outreach Document
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white uppercase">
                            Welile School of AI
                        </h1>
                        <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-slate-400">
                            Katabi, Entebbe, Uganda
                        </p>
                        <h2 className="mt-2 text-sm sm:text-base font-extrabold text-violet-700 dark:text-violet-300 uppercase tracking-wide">
                            Student Registration, Study Schedule & Payment Agreement Form
                        </h2>
                    </div>

                    {/* Top Control Table (Matching Paper Form Header Box) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 text-xs">
                        {/* Outreach / Registration Channel Dropdown */}
                        <div className="sm:col-span-2 pb-2 border-b border-gray-200/70 dark:border-slate-800">
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-1 flex items-center gap-1">
                                <Megaphone size={12} /> Active Outreach / Registration Channel
                            </label>
                            <select
                                value={outreachEvent}
                                onChange={(e) => setOutreachEvent(e.target.value)}
                                disabled={Boolean(submittedRecord)}
                                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-violet-300 dark:border-violet-800 rounded-xl font-bold text-gray-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
                            >
                                {campaigns.map((c) => (
                                    <option key={c.id} value={c.name}>
                                        {c.name} — {c.location}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center justify-between sm:justify-start gap-2">
                            <span className="text-gray-500 dark:text-slate-400 font-semibold">Registration Date:</span>
                            <input
                                type="date"
                                value={registrationDate}
                                onChange={(e) => setRegistrationDate(e.target.value)}
                                disabled={Boolean(submittedRecord)}
                                className="font-bold text-gray-900 dark:text-white bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-700 text-xs"
                            />
                        </div>

                        <div className="flex items-center justify-between sm:justify-start gap-2">
                            <span className="text-gray-500 dark:text-slate-400 font-semibold">Student Reg No.:</span>
                            <span className="font-mono font-extrabold text-violet-700 dark:text-violet-300 bg-violet-100/70 dark:bg-violet-950/50 px-2.5 py-1 rounded-lg">
                                {submittedRecord?.student_reg_no || studentRegNo}
                            </span>
                        </div>

                        <div className="flex items-center justify-between sm:justify-start gap-2">
                            <span className="text-gray-500 dark:text-slate-400 font-semibold">Course / Programme:</span>
                            <span className="font-bold text-gray-900 dark:text-white truncate">
                                {submittedRecord?.course_interest || courseInterest}
                            </span>
                        </div>

                        <div className="flex items-center justify-between sm:justify-start gap-2">
                            <span className="text-gray-500 dark:text-slate-400 font-semibold">Assigned Level:</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                {submittedRecord?.level || level}
                            </span>
                        </div>
                    </div>
                </div>

                {/* SUBMITTED CONFIRMATION & OFFICIAL PRINTABLE VIEW */}
                {submittedRecord ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in duration-200">
                        <div className="text-center space-y-2 print:hidden">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                                <CheckCircle2 size={36} />
                            </div>
                            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                                {submittedMode === 'online'
                                    ? 'Official Registration Completed!'
                                    : 'Saved Offline — Will Sync Automatically Once Online'}
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                                Registration No. <strong className="text-violet-600 dark:text-violet-400">{submittedRecord.student_reg_no}</strong> for{' '}
                                <strong>{submittedRecord.full_name}</strong> under <strong>{submittedRecord.outreach_event}</strong> has been recorded.
                            </p>
                        </div>

                        {/* Complete Official 8-Section Summary Sheet */}
                        <div className="space-y-4 text-xs border border-gray-200 dark:border-slate-800 rounded-2xl p-5 bg-gray-50/60 dark:bg-slate-950/50">
                            <div>
                                <h4 className="font-extrabold text-violet-700 dark:text-violet-300 uppercase mb-2 border-b border-gray-200 dark:border-slate-800 pb-1">
                                    1. Student Information
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <p><span className="text-gray-500">Full Name:</span> <strong>{submittedRecord.full_name}</strong></p>
                                    <p><span className="text-gray-500">Email:</span> <strong>{submittedRecord.email || '—'}</strong></p>
                                    <p><span className="text-gray-500">Phone:</span> <strong>{submittedRecord.phone}</strong></p>
                                    <p><span className="text-gray-500">Class / Level / Year:</span> <strong>{submittedRecord.class_level_year}</strong></p>
                                    <p><span className="text-gray-500">Parent / Guardian:</span> <strong>{submittedRecord.guardian_name || 'N/A'}</strong></p>
                                    <p><span className="text-gray-500">Guardian Contact:</span> <strong>{submittedRecord.guardian_phone || 'N/A'}</strong></p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-extrabold text-violet-700 dark:text-violet-300 uppercase mb-2 border-b border-gray-200 dark:border-slate-800 pb-1">
                                    2. Course & Programme Information
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <p><span className="text-gray-500">Course / Programme:</span> <strong>{submittedRecord.course_interest}</strong></p>
                                    <p><span className="text-gray-500">Level & Mode:</span> <strong>{submittedRecord.level} • {submittedRecord.mode_preference}</strong></p>
                                    <p><span className="text-gray-500">Expected Start Date:</span> <strong>{submittedRecord.expected_start_date}</strong></p>
                                    <p><span className="text-gray-500">Expected Completion:</span> <strong>{submittedRecord.expected_completion_date}</strong></p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-extrabold text-violet-700 dark:text-violet-300 uppercase mb-2 border-b border-gray-200 dark:border-slate-800 pb-1">
                                    3. Study Schedule
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <p><span className="text-gray-500">Preferred Study Days:</span> <strong>{(submittedRecord.preferred_study_days || []).join(', ')}</strong></p>
                                    <p><span className="text-gray-500">Chosen Study Time:</span> <strong>{submittedRecord.preferred_time_slot}</strong></p>
                                    <p><span className="text-gray-500">Study Hours / Session:</span> <strong>{submittedRecord.study_hours_per_session}</strong></p>
                                    <p><span className="text-gray-500">Sessions Per Week:</span> <strong>{submittedRecord.sessions_per_week}</strong></p>
                                    <p className="sm:col-span-2"><span className="text-gray-500">Alternative Study Time:</span> <strong>{submittedRecord.alternative_study_time}</strong></p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-extrabold text-violet-700 dark:text-violet-300 uppercase mb-2 border-b border-gray-200 dark:border-slate-800 pb-1">
                                    4. Fees & Payment Agreement
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <p><span className="text-gray-500">Total Course Fee:</span> <strong>UGX {(submittedRecord.total_course_fee ?? 600000).toLocaleString()}</strong></p>
                                    <p><span className="text-gray-500">Registration Fee:</span> <strong>{submittedRecord.registration_fee}</strong></p>
                                    <p><span className="text-gray-500">Amount Paid:</span> <strong>UGX {(submittedRecord.amount_paid ?? 0).toLocaleString()}</strong></p>
                                    <p><span className="text-gray-500">Outstanding Balance:</span> <strong>UGX {(submittedRecord.outstanding_balance ?? 600000).toLocaleString()}</strong></p>
                                    <p><span className="text-gray-500">Payment Plan:</span> <strong>{submittedRecord.payment_plan} (UGX {(submittedRecord.agreed_payment_amount ?? 200000).toLocaleString()})</strong></p>
                                    <p><span className="text-gray-500">Payment Method:</span> <strong>{submittedRecord.payment_method} ({submittedRecord.payment_reference})</strong></p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-extrabold text-violet-700 dark:text-violet-300 uppercase mb-2 border-b border-gray-200 dark:border-slate-800 pb-1">
                                    5 & 6. Student Commitment & Declaration
                                </h4>
                                <p className="text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
                                    ✓ All 8 Student Commitments Accepted & Confirmed
                                </p>
                                <p>
                                    <span className="text-gray-500">Digitally Signed By:</span>{' '}
                                    <strong className="italic font-serif text-sm">{submittedRecord.student_signature}</strong> on{' '}
                                    <strong>{submittedRecord.student_declaration_date}</strong>
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 print:hidden">
                            <button
                                type="button"
                                onClick={handleRegisterAnother}
                                className="flex-1 py-4 px-6 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold text-sm sm:text-base shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <UserPlus size={20} />
                                Register Next Student ({outreachEvent.split('(')[0].trim()})
                            </button>
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="py-4 px-5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Printer size={18} />
                                Print / Save PDF
                            </button>
                        </div>
                    </div>
                ) : (
                    /* FORM WIZARD / FULL SHEET */
                    <form onSubmit={handleSubmit} noValidate className="space-y-6">
                        {/* Honeypot */}
                        <div className="opacity-0 absolute -z-10 h-0 w-0 overflow-hidden pointer-events-none" aria-hidden="true">
                            <input
                                type="text"
                                tabIndex={-1}
                                autoComplete="off"
                                value={honeypotWebsite}
                                onChange={(e) => setHoneypotWebsite(e.target.value)}
                            />
                        </div>

                        {/* Wizard Step Progress Bar */}
                        {!singlePageMode && (
                            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-extrabold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                                        Step {step} of 3
                                    </span>
                                    <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                                        {step === 1 && 'Sections 1 & 2: Student & Programme Info'}
                                        {step === 2 && 'Sections 3 & 4: Study Schedule & Fees Agreement'}
                                        {step === 3 && 'Sections 5–7: Commitment, Declaration & Signature'}
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                                    <div
                                        className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-300"
                                        style={{ width: `${(step / 3) * 100}%` }}
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { num: 1, title: '1–2. Student & Course', icon: User },
                                        { num: 2, title: '3–4. Schedule & Fees', icon: Calendar },
                                        { num: 3, title: '5–7. Sign & Submit', icon: FileCheck }
                                    ].map(({ num, title, icon: Icon }) => {
                                        const active = step === num;
                                        const done = step > num;
                                        return (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => {
                                                    if (num < step) setStep(num as 1 | 2 | 3);
                                                }}
                                                className={`py-2 px-2.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                                    active
                                                        ? 'bg-violet-600 text-white shadow-sm'
                                                        : done
                                                        ? 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300'
                                                        : 'bg-gray-100 dark:bg-slate-800 text-gray-400'
                                                }`}
                                            >
                                                {done ? <CheckCircle2 size={13} /> : <Icon size={13} />}
                                                <span className="truncate">{title}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* =========================================================
                            SECTION 1: STUDENT INFORMATION & SECTION 2: COURSE INFO
                           ========================================================= */}
                        {showStep1 && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                {/* 1. STUDENT INFORMATION */}
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm space-y-5">
                                    <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-slate-800 pb-3">
                                        <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black text-sm">
                                            1
                                        </div>
                                        <div>
                                            <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-gray-900 dark:text-white">
                                                1. Student Information
                                            </h3>
                                            <p className="text-[11px] text-gray-500 dark:text-slate-400">
                                                Official student contact details and academic level
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Full Name */}
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Full Name <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="text"
                                                    required
                                                    value={fullName}
                                                    onChange={(e) => {
                                                        setFullName(e.target.value);
                                                        if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
                                                    }}
                                                    placeholder="Enter student's full name"
                                                    className={`w-full pl-10 pr-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border rounded-2xl text-sm font-medium focus:outline-none ${
                                                        errors.fullName ? 'border-red-500' : 'border-gray-200 dark:border-slate-700 focus:border-violet-500'
                                                    }`}
                                                />
                                            </div>
                                            {errors.fullName && (
                                                <p className="mt-1 text-xs font-semibold text-red-500 flex items-center gap-1">
                                                    <AlertCircle size={12} /> {errors.fullName}
                                                </p>
                                            )}
                                        </div>

                                        {/* Email Address */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => {
                                                        setEmail(e.target.value);
                                                        if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                                                    }}
                                                    placeholder="student@email.com"
                                                    className="w-full pl-10 pr-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-medium focus:outline-none focus:border-violet-500"
                                                />
                                            </div>
                                            {errors.email && (
                                                <p className="mt-1 text-xs font-semibold text-red-500">{errors.email}</p>
                                            )}
                                        </div>

                                        {/* Phone Number */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Phone Number (WhatsApp / Call) <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <Phone size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="tel"
                                                    required
                                                    value={phone}
                                                    onChange={(e) => {
                                                        setPhone(e.target.value);
                                                        if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                                                    }}
                                                    placeholder="e.g. 0772 123 456"
                                                    className={`w-full pl-10 pr-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border rounded-2xl text-sm font-medium focus:outline-none ${
                                                        errors.phone ? 'border-red-500' : 'border-gray-200 dark:border-slate-700 focus:border-violet-500'
                                                    }`}
                                                />
                                            </div>
                                            {errors.phone && (
                                                <p className="mt-1 text-xs font-semibold text-red-500 flex items-center gap-1">
                                                    <AlertCircle size={12} /> {errors.phone}
                                                </p>
                                            )}
                                        </div>

                                        {/* Class / Level / Year (Clean Dropdown) */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Class / Level / Year
                                            </label>
                                            <div className="relative">
                                                <GraduationCap size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                <select
                                                    value={classLevelYear}
                                                    onChange={(e) => setClassLevelYear(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:outline-none focus:border-violet-500 cursor-pointer"
                                                >
                                                    {CLASS_LEVEL_OPTIONS.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Residence / Campus Area (Clean Dropdown) */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Location / Campus Area
                                            </label>
                                            <div className="relative">
                                                <MapPin size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                <select
                                                    value={location}
                                                    onChange={(e) => setLocation(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:outline-none focus:border-violet-500 cursor-pointer"
                                                >
                                                    {LOCATION_PRESETS.map(loc => (
                                                        <option key={loc} value={loc}>{loc}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Age Category Pills */}
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1.5">
                                                Age Category
                                            </label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {AGE_RANGES.map((range) => (
                                                    <button
                                                        key={range}
                                                        type="button"
                                                        onClick={() => setAgeRange(range)}
                                                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                                            ageRange === range
                                                                ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                                                                : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                                                        }`}
                                                    >
                                                        {range}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Parent / Guardian Name & Contact (Always captured per paper form, required if Under 18) */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Parent / Guardian Name {isGuardianRequired ? <span className="text-red-500">*</span> : <span className="text-gray-400 font-normal lowercase">(if applicable)</span>}
                                            </label>
                                            <input
                                                type="text"
                                                value={guardianName}
                                                onChange={(e) => {
                                                    setGuardianName(e.target.value);
                                                    if (errors.guardianName) setErrors(prev => ({ ...prev, guardianName: '' }));
                                                }}
                                                placeholder="Parent / Guardian Full Name"
                                                className={`w-full px-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border rounded-2xl text-sm font-medium focus:outline-none ${
                                                    errors.guardianName ? 'border-red-500' : 'border-gray-200 dark:border-slate-700 focus:border-violet-500'
                                                }`}
                                            />
                                            {errors.guardianName && (
                                                <p className="mt-1 text-xs font-semibold text-red-500">{errors.guardianName}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Parent / Guardian Contact {isGuardianRequired ? <span className="text-red-500">*</span> : <span className="text-gray-400 font-normal lowercase">(if applicable)</span>}
                                            </label>
                                            <input
                                                type="tel"
                                                value={guardianPhone}
                                                onChange={(e) => {
                                                    setGuardianPhone(e.target.value);
                                                    if (errors.guardianPhone) setErrors(prev => ({ ...prev, guardianPhone: '' }));
                                                }}
                                                placeholder="e.g. 0772 987 654"
                                                className={`w-full px-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border rounded-2xl text-sm font-medium focus:outline-none ${
                                                    errors.guardianPhone ? 'border-red-500' : 'border-gray-200 dark:border-slate-700 focus:border-violet-500'
                                                }`}
                                            />
                                            {errors.guardianPhone && (
                                                <p className="mt-1 text-xs font-semibold text-red-500">{errors.guardianPhone}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 2. COURSE & PROGRAMME INFORMATION */}
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm space-y-5">
                                    <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-slate-800 pb-3">
                                        <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black text-sm">
                                            2
                                        </div>
                                        <div>
                                            <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-gray-900 dark:text-white">
                                                2. Course & Programme Information
                                            </h3>
                                            <p className="text-[11px] text-gray-500 dark:text-slate-400">
                                                Select your programme, assigned skill level, mode of study, and expected dates
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Course / Programme */}
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Course / Programme <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <BookOpen size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                <select
                                                    value={courseInterest}
                                                    onChange={(e) => setCourseInterest(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3.5 min-h-[50px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                                                >
                                                    {courseOptions.map((c) => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Level Checkboxes (Beginner / Intermediate / Advanced) */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1.5">
                                                Level
                                            </label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {LEVELS.map((lvl) => (
                                                    <button
                                                        key={lvl}
                                                        type="button"
                                                        onClick={() => setLevel(lvl)}
                                                        className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                                            level === lvl
                                                                ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                                                                : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                                                        }`}
                                                    >
                                                        <span>{level === lvl ? '☑' : '☐'}</span>
                                                        <span>{lvl}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Mode of Study (Physical / Online / Hybrid) */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1.5">
                                                Mode of Study
                                            </label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {MODES.map((m) => (
                                                    <button
                                                        key={m}
                                                        type="button"
                                                        onClick={() => setModePreference(m)}
                                                        className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                                            modePreference === m
                                                                ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                                                                : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                                                        }`}
                                                    >
                                                        <span>{modePreference === m ? '☑' : '☐'}</span>
                                                        <span>{m}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Expected Start Date */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Expected Start Date
                                            </label>
                                            <input
                                                type="date"
                                                value={expectedStartDate}
                                                onChange={(e) => setExpectedStartDate(e.target.value)}
                                                className="w-full px-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:outline-none focus:border-violet-500"
                                            />
                                        </div>

                                        {/* Expected Completion Date */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Expected Completion Date
                                            </label>
                                            <input
                                                type="date"
                                                value={expectedCompletionDate}
                                                onChange={(e) => setExpectedCompletionDate(e.target.value)}
                                                className="w-full px-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:outline-none focus:border-violet-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* =========================================================
                            SECTION 3: STUDY SCHEDULE & SECTION 4: FEES & PAYMENT
                           ========================================================= */}
                        {showStep2 && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                {/* 3. STUDY SCHEDULE */}
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm space-y-5">
                                    <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-slate-800 pb-3">
                                        <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black text-sm">
                                            3
                                        </div>
                                        <div>
                                            <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-gray-900 dark:text-white">
                                                3. Study Schedule
                                            </h3>
                                            <p className="text-[11px] text-gray-500 dark:text-slate-400">
                                                Select your preferred study days, session hours, and alternative slot
                                            </p>
                                        </div>
                                    </div>

                                    {/* Preferred Study Days (Mon..Sun) */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-2">
                                            Preferred Study Days <span className="text-red-500">*</span>
                                        </label>
                                        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                                            {DAYS_OF_WEEK.map((day) => {
                                                const selected = preferredStudyDays.includes(day);
                                                return (
                                                    <button
                                                        key={day}
                                                        type="button"
                                                        onClick={() => toggleStudyDay(day)}
                                                        className={`py-3 min-h-[48px] rounded-xl font-bold text-xs border transition-all cursor-pointer flex flex-col items-center justify-center ${
                                                            selected
                                                                ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                                                                : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                                                        }`}
                                                    >
                                                        <span className="text-[10px] opacity-80">{selected ? '☑' : '☐'}</span>
                                                        <span>{day}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {errors.preferredStudyDays && (
                                            <p className="mt-1 text-xs font-semibold text-red-500">{errors.preferredStudyDays}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Chosen Study Time (From – To) */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Chosen Study Time (From – To)
                                            </label>
                                            <select
                                                value={chosenStudyTime}
                                                onChange={(e) => setChosenStudyTime(e.target.value)}
                                                className="w-full px-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-violet-500 cursor-pointer"
                                            >
                                                {STUDY_TIME_SLOTS.map(slot => (
                                                    <option key={slot} value={slot}>{slot}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Study Hours Per Session */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Study Hours Per Session
                                            </label>
                                            <select
                                                value={studyHoursPerSession}
                                                onChange={(e) => setStudyHoursPerSession(e.target.value)}
                                                className="w-full px-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-violet-500 cursor-pointer"
                                            >
                                                {STUDY_HOURS_OPTIONS.map(h => (
                                                    <option key={h} value={h}>{h}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Number of Sessions Per Week */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Number of Sessions Per Week
                                            </label>
                                            <input
                                                type="text"
                                                value={sessionsPerWeek}
                                                onChange={(e) => setSessionsPerWeek(e.target.value)}
                                                className="w-full px-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-violet-500"
                                            />
                                        </div>

                                        {/* Alternative Study Time */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Alternative Study Time (if applicable)
                                            </label>
                                            <select
                                                value={alternativeStudyTime}
                                                onChange={(e) => setAlternativeStudyTime(e.target.value)}
                                                className="w-full px-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-violet-500 cursor-pointer"
                                            >
                                                {ALTERNATIVE_TIME_OPTIONS.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* 4. FEES & PAYMENT AGREEMENT */}
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm space-y-5">
                                    <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-slate-800 pb-3">
                                        <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black text-sm">
                                            4
                                        </div>
                                        <div>
                                            <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-gray-900 dark:text-white">
                                                4. Fees & Payment Agreement
                                            </h3>
                                            <p className="text-[11px] text-gray-500 dark:text-slate-400">
                                                Standard Tuition Fee: UGX 600,000 • Registration Fee: Not Applicable
                                            </p>
                                        </div>
                                    </div>

                                    {/* Official Fee Box */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-violet-50/60 dark:bg-violet-950/25 p-4 rounded-2xl border border-violet-200/70 dark:border-violet-800/50 text-xs">
                                        <div>
                                            <span className="text-gray-500 dark:text-slate-400 block text-[10px] font-bold uppercase">Total Course Fee</span>
                                            <span className="text-sm sm:text-base font-black text-gray-900 dark:text-white">UGX 600,000</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-slate-400 block text-[10px] font-bold uppercase">Registration Fee</span>
                                            <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">UGX – Not Applicable</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-slate-400 block text-[10px] font-bold uppercase">Amount Paid</span>
                                            <span className="text-sm sm:text-base font-black text-violet-700 dark:text-violet-300">
                                                UGX {(Number(amountPaid) || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-slate-400 block text-[10px] font-bold uppercase">Outstanding Balance</span>
                                            <span className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400">
                                                UGX {outstandingBalance.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Payment Plan (Full / Weekly / Monthly / Other) */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-2">
                                            Payment Plan
                                        </label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                            {PAYMENT_PLANS.map((p) => (
                                                <button
                                                    key={p.value}
                                                    type="button"
                                                    onClick={() => handlePaymentPlanChange(p.value)}
                                                    className={`py-3 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                                        paymentPlan === p.value
                                                            ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                                                            : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                                                    }`}
                                                >
                                                    <span>{paymentPlan === p.value ? '☑' : '☐'}</span>
                                                    <span>{p.value}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Quick Amount Paid Presets */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1.5">
                                            Amount Paid Today (UGX) — Quick Select or Enter Amount
                                        </label>
                                        <div className="flex flex-wrap gap-2 mb-2.5">
                                            {[
                                                { label: 'UGX 0 (Pay at Start)', val: 0 },
                                                { label: 'UGX 100,000', val: 100000 },
                                                { label: 'UGX 200,000', val: 200000 },
                                                { label: 'UGX 300,000', val: 300000 },
                                                { label: 'UGX 600,000 (Full)', val: 600000 }
                                            ].map((preset) => (
                                                <button
                                                    key={preset.val}
                                                    type="button"
                                                    onClick={() => setAmountPaid(preset.val)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                                                        Number(amountPaid) === preset.val
                                                            ? 'bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border-violet-400'
                                                            : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700'
                                                    }`}
                                                >
                                                    {preset.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Amount Paid (UGX)
                                            </label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={600000}
                                                step={10000}
                                                value={amountPaid}
                                                onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                                                className="w-full px-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-bold"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Agreed Installment Amount (UGX)
                                            </label>
                                            <input
                                                type="number"
                                                min={0}
                                                step={10000}
                                                value={agreedPaymentAmount}
                                                onChange={(e) => setAgreedPaymentAmount(Number(e.target.value) || 0)}
                                                className="w-full px-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-bold"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Next Payment Date
                                            </label>
                                            <input
                                                type="date"
                                                value={nextPaymentDate}
                                                onChange={(e) => setNextPaymentDate(e.target.value)}
                                                className="w-full px-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-semibold"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Payment Due Date
                                            </label>
                                            <input
                                                type="date"
                                                value={paymentDueDate}
                                                onChange={(e) => setPaymentDueDate(e.target.value)}
                                                className="w-full px-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-semibold"
                                            />
                                        </div>

                                        {/* Payment Method */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1.5">
                                                Payment Method
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {PAYMENT_METHODS.map((pm) => (
                                                    <button
                                                        key={pm}
                                                        type="button"
                                                        onClick={() => setPaymentMethod(pm)}
                                                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                                            paymentMethod === pm
                                                                ? 'bg-violet-600 text-white border-violet-600'
                                                                : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                                                        }`}
                                                    >
                                                        <span>{paymentMethod === pm ? '☑' : '☐'}</span>
                                                        <span>{pm}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Payment Reference / Receipt No. */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Payment Reference / Receipt No.
                                            </label>
                                            <input
                                                type="text"
                                                value={paymentReference}
                                                onChange={(e) => setPaymentReference(e.target.value)}
                                                placeholder="Receipt / Mobile Money Ref or Pending"
                                                className="w-full px-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* =========================================================
                            SECTIONS 5, 6, 7 & 8: COMMITMENT, DECLARATION & SIGNATURES
                           ========================================================= */}
                        {showStep3 && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                {/* 5. STUDENT COMMITMENT */}
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black text-sm">
                                                5
                                            </div>
                                            <div>
                                                <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-gray-900 dark:text-white">
                                                    5. Student Commitment
                                                </h3>
                                                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                                                    Confirm your agreement to the Welile School of AI learning commitments
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                const allTrue = checkedCommitments.every(Boolean);
                                                setCheckedCommitments(OFFICIAL_COMMITMENTS.map(() => !allTrue));
                                            }}
                                            className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                                        >
                                            {checkedCommitments.every(Boolean) ? 'All Checked ✓' : 'Check All'}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2.5">
                                        {OFFICIAL_COMMITMENTS.map((text, idx) => (
                                            <label
                                                key={idx}
                                                className={`flex items-start gap-3 p-3 rounded-xl border text-xs sm:text-sm cursor-pointer transition-colors ${
                                                    checkedCommitments[idx]
                                                        ? 'bg-violet-50/50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800/50 text-gray-900 dark:text-white'
                                                        : 'bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 text-gray-500'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checkedCommitments[idx]}
                                                    onChange={(e) => {
                                                        const next = [...checkedCommitments];
                                                        next[idx] = e.target.checked;
                                                        setCheckedCommitments(next);
                                                        if (errors.commitments) setErrors(prev => ({ ...prev, commitments: '' }));
                                                    }}
                                                    className="mt-0.5 w-4 h-4 accent-violet-600 rounded shrink-0"
                                                />
                                                <span className="font-medium leading-snug">{text}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {errors.commitments && (
                                        <p className="text-xs font-semibold text-red-500 flex items-center gap-1">
                                            <AlertCircle size={13} /> {errors.commitments}
                                        </p>
                                    )}
                                </div>

                                {/* 6. STUDENT DECLARATION & SIGNATURE */}
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm space-y-4">
                                    <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-slate-800 pb-3">
                                        <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black text-sm">
                                            6
                                        </div>
                                        <div>
                                            <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-gray-900 dark:text-white">
                                                6. Student Declaration & Signature
                                            </h3>
                                        </div>
                                    </div>

                                    <p className="text-xs sm:text-sm text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-gray-200/70 dark:border-slate-800 italic">
                                        “I confirm that I have read, understood and agreed to the information, study schedule, payment arrangements and responsibilities stated in this form.”
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Student Full Name
                                            </label>
                                            <input
                                                type="text"
                                                value={fullName}
                                                readOnly
                                                className="w-full px-3.5 py-3 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Student Signature (Digital) <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <PenTool size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-500" />
                                                <input
                                                    type="text"
                                                    required
                                                    value={studentSignature}
                                                    onChange={(e) => {
                                                        setStudentSignature(e.target.value);
                                                        if (errors.studentSignature) setErrors(prev => ({ ...prev, studentSignature: '' }));
                                                    }}
                                                    placeholder="Type full name to sign"
                                                    className="w-full pl-9 pr-3 py-3 bg-violet-50/50 dark:bg-violet-950/30 border border-violet-300 dark:border-violet-700 rounded-xl text-sm font-serif italic font-bold text-violet-900 dark:text-violet-200"
                                                />
                                            </div>
                                            {errors.studentSignature && (
                                                <p className="mt-1 text-xs font-semibold text-red-500">{errors.studentSignature}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Date
                                            </label>
                                            <input
                                                type="date"
                                                value={studentDeclarationDate}
                                                onChange={(e) => setStudentDeclarationDate(e.target.value)}
                                                className="w-full px-3.5 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 7. PARENT / GUARDIAN CONSENT */}
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm space-y-4">
                                    <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-slate-800 pb-3">
                                        <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black text-sm">
                                            7
                                        </div>
                                        <div>
                                            <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-gray-900 dark:text-white">
                                                7. Parent / Guardian Consent
                                            </h3>
                                            <p className="text-[11px] text-gray-500 dark:text-slate-400">
                                                Complete this section where applicable (required if Under 18 / High School)
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Parent / Guardian Full Name
                                            </label>
                                            <input
                                                type="text"
                                                value={guardianName}
                                                onChange={(e) => setGuardianName(e.target.value)}
                                                placeholder="If applicable"
                                                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                value={guardianPhone}
                                                onChange={(e) => setGuardianPhone(e.target.value)}
                                                placeholder="If applicable"
                                                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Guardian Signature
                                            </label>
                                            <input
                                                type="text"
                                                value={guardianSignature}
                                                onChange={(e) => setGuardianSignature(e.target.value)}
                                                placeholder="Guardian digital signature"
                                                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-serif italic"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Date
                                            </label>
                                            <input
                                                type="date"
                                                value={guardianConsentDate}
                                                onChange={(e) => setGuardianConsentDate(e.target.value)}
                                                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 8. SCHOOL / ADMINISTRATION USE ONLY (Preview Footer) */}
                                <div className="bg-gray-100/80 dark:bg-slate-900/50 rounded-3xl border border-dashed border-gray-300 dark:border-slate-800 p-5 text-xs text-gray-500 dark:text-slate-400">
                                    <div className="font-extrabold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1">
                                        8. School / Administration Use Only (Completed by Welile Admissions Office)
                                    </div>
                                    <p>
                                        Approval, Instructor Assignment, Confirmed Study Schedule, and Official Payment Verification Stamp are completed in the Welile School of AI Admin Portal upon submission.
                                    </p>
                                    <p className="mt-2 font-bold text-violet-600 dark:text-violet-400">
                                        WELILE SCHOOL OF AI • Katabi, Entebbe, Uganda — Empowering students through Artificial Intelligence and digital skills.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Sticky Mobile / Standard Desktop Navigation Bar */}
                        <div className="fixed bottom-0 left-0 right-0 sm:static bg-white/95 dark:bg-slate-900/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-t border-gray-200 dark:border-slate-800 sm:border-0 p-4 sm:p-0 z-30">
                            <div className="max-w-3xl mx-auto flex items-center gap-3">
                                {!singlePageMode && step > 1 && (
                                    <button
                                        type="button"
                                        onClick={handlePrevStep}
                                        className="px-5 py-3.5 min-h-[50px] rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-bold text-sm flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <ArrowLeft size={16} /> Back
                                    </button>
                                )}

                                {!singlePageMode && step < 3 ? (
                                    <button
                                        type="button"
                                        onClick={handleNextStep}
                                        className="flex-1 py-3.5 px-6 min-h-[50px] bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold text-sm sm:text-base shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        Continue to {step === 1 ? 'Study Schedule & Fees' : 'Declaration & Signature'}
                                        <ArrowRight size={18} />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 py-4 px-6 min-h-[52px] bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 text-white rounded-2xl font-bold text-sm sm:text-base shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader size={18} className="animate-spin" />
                                                Submitting Official Registration...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 size={18} />
                                                Submit Official Registration Form
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                )}
            </main>
        </div>
    );
};

export default OutreachRegistration;
