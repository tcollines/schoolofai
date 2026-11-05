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
    FileCheck,
    PenTool,
    Printer,
    Info
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
    'Vacationist / Gap Year'
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
const MODE_DESCRIPTIONS: Record<string, string> = {
    Physical: 'Physical — In-Person Classes at Katabi Campus, Entebbe',
    Online: 'Online — Live Interactive Virtual Sessions',
    Hybrid: 'Hybrid — Katabi Campus Lab + Online Sessions'
};

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

const SESSIONS_PER_WEEK_OPTIONS = [
    '1 Session / Week',
    '2 Sessions / Week',
    '3 Sessions / Week',
    '4 Sessions / Week',
    '5 Sessions / Week'
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
    { value: 'Full', label: 'Full', defaultAgreed: 600000 },
    { value: 'Weekly', label: 'Weekly', defaultAgreed: 75000 },
    { value: 'Monthly', label: 'Monthly', defaultAgreed: 200000 },
    { value: 'Other', label: 'Other', defaultAgreed: 150000 }
];

const PAYMENT_METHODS = ['Cash', 'Mobile Money', 'Bank', 'Other'];

const ADMIN_PAYMENT_STATUSES = ['Fully Paid', 'Partially Paid', 'Payment Plan', 'Pending'];

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

    // Default to Full 8-Section Form so every section (1 to 8) is immediately visible in exact order!
    // Users can also toggle 3-Step Wizard mode if they want.
    const [singlePageMode, setSinglePageMode] = useState(true);
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Dropdown options from DB
    const [campaigns, setCampaigns] = useState<OutreachCampaign[]>(DEFAULT_OUTREACH_CAMPAIGNS);
    const [courseOptions, setCourseOptions] = useState<string[]>(DEFAULT_COURSES);

    // HEADER METADATA (Exact match to Top Table of Official Form)
    const [registrationDate, setRegistrationDate] = useState('2026-11-06');
    const [studentRegNo, setStudentRegNo] = useState(() => generateStudentRegNo());
    const [outreachEvent, setOutreachEvent] = useState(
        initialEventFromUrl || 'Nkumba University Outreach (Fri, 6th Nov 2026)'
    );
    const [howHeard] = useState('Outreach Event');

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
    const [modeOfStudyText, setModeOfStudyText] = useState(MODE_DESCRIPTIONS.Hybrid);
    const [expectedStartDate, setExpectedStartDate] = useState('2026-11-09');
    const [expectedCompletionDate, setExpectedCompletionDate] = useState('2027-01-04');

    // 3. STUDY SCHEDULE
    const [preferredStudyDays, setPreferredStudyDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
    const [chosenStudyTime, setChosenStudyTime] = useState('04:00 PM – 06:00 PM (Late Afternoon)');
    const [studyHoursPerSession, setStudyHoursPerSession] = useState('2 Hours');
    const [sessionsPerWeek, setSessionsPerWeek] = useState('3 Sessions / Week');
    const [alternativeStudyTime, setAlternativeStudyTime] = useState('06:00 PM – 08:00 PM (Evening)');

    // 4. FEES & PAYMENT AGREEMENT
    const [totalCourseFee, setTotalCourseFee] = useState<number>(600000);
    const [registrationFee, setRegistrationFee] = useState<string>('UGX – Not Applicable');
    const [amountPaid, setAmountPaid] = useState<number>(0);
    const [paymentPlan, setPaymentPlan] = useState<string>('Monthly');
    const [paymentPlanOther, setPaymentPlanOther] = useState<string>('');
    const [agreedPaymentAmount, setAgreedPaymentAmount] = useState<number>(200000);
    const [nextPaymentDate, setNextPaymentDate] = useState<string>('2026-11-09');
    const [paymentDueDate, setPaymentDueDate] = useState<string>('2026-12-09');
    const [paymentMethod, setPaymentMethod] = useState<string>('Mobile Money');
    const [paymentMethodOther, setPaymentMethodOther] = useState<string>('');
    const [paymentReference, setPaymentReference] = useState<string>('To be confirmed at follow-up');

    // 5. STUDENT COMMITMENT
    const [checkedCommitments, setCheckedCommitments] = useState<boolean[]>(
        OFFICIAL_COMMITMENTS.map(() => true)
    );

    // 6. STUDENT DECLARATION & SIGNATURE
    const [declarationFullName, setDeclarationFullName] = useState('');
    const [studentSignature, setStudentSignature] = useState('');
    const [studentDeclarationDate, setStudentDeclarationDate] = useState('2026-11-06');

    // 7. PARENT / GUARDIAN CONSENT
    const [guardianSignature, setGuardianSignature] = useState('');
    const [guardianConsentDate, setGuardianConsentDate] = useState('2026-11-06');

    // 8. SCHOOL / ADMINISTRATION USE ONLY (All 7 fields captured & editable!)
    const [approvedBy, setApprovedBy] = useState('Pending Follow-Up Confirmation');
    const [approverPosition, setApproverPosition] = useState('Admissions Office — Katabi Campus');
    const [assignedInstructor, setAssignedInstructor] = useState('To Be Assigned Upon Enrollment');
    const [confirmedSchedule, setConfirmedSchedule] = useState('Mon, Wed, Fri • 04:00 PM – 06:00 PM (Late Afternoon)');
    const [adminPaymentStatus, setAdminPaymentStatus] = useState<string>('Pending');
    const [adminSignatureDate, setAdminSignatureDate] = useState('2026-11-06');
    const [adminRemarks, setAdminRemarks] = useState('Registered at Outreach — Follow up to confirm seat & payment plan.');

    // Honeypot
    const [honeypotWebsite, setHoneypotWebsite] = useState('');

    // Validation & submit states
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedRecord, setSubmittedRecord] = useState<OutreachRegistrationPayload | null>(null);
    const [submittedMode, setSubmittedMode] = useState<'online' | 'offline' | null>(null);

    const outstandingBalance = Math.max(0, (Number(totalCourseFee) || 600000) - (Number(amountPaid) || 0));

    // Sync Declaration Name & Student Signature with Full Name
    useEffect(() => {
        if (fullName.trim()) {
            setDeclarationFullName(fullName.trim());
            setStudentSignature(fullName.trim());
        }
    }, [fullName]);

    useEffect(() => {
        if (guardianName.trim()) {
            setGuardianSignature(guardianName.trim());
        }
    }, [guardianName]);

    // Sync Mode of Study text when Mode radio changes
    useEffect(() => {
        if (MODE_DESCRIPTIONS[modePreference]) {
            setModeOfStudyText(MODE_DESCRIPTIONS[modePreference]);
        }
    }, [modePreference]);

    // Sync Confirmed Schedule in Section 8 when student changes preferred days/time
    useEffect(() => {
        setConfirmedSchedule(`${preferredStudyDays.join(', ') || 'Flexible'} • ${chosenStudyTime}`);
    }, [preferredStudyDays, chosenStudyTime]);

    // Sync Section 8 Payment Status when Amount Paid changes
    useEffect(() => {
        const paid = Number(amountPaid) || 0;
        const fee = Number(totalCourseFee) || 600000;
        if (paid >= fee) {
            setAdminPaymentStatus('Fully Paid');
        } else if (paid > 0) {
            setAdminPaymentStatus('Partially Paid');
        } else if (paymentPlan && paymentPlan !== 'Full') {
            setAdminPaymentStatus('Pending');
        }
    }, [amountPaid, totalCourseFee, paymentPlan]);

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
        if (count >= 1 && count <= 5) {
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
            nextErrors.fullName = 'Please enter Full Name in Section 1.';
        }
        const cleanedPhone = phone.trim();
        if (!cleanedPhone || cleanedPhone.replace(/[^0-9+]/g, '').length < 7) {
            nextErrors.phone = 'Please enter a valid Phone Number in Section 1.';
        }
        if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            nextErrors.email = 'Please enter a valid Email Address or leave blank.';
        }
        if (isGuardianRequired) {
            if (!guardianName.trim()) {
                nextErrors.guardianName = 'Parent / Guardian Name is required for students under 18 or in High School.';
            }
            if (!guardianPhone.trim()) {
                nextErrors.guardianPhone = 'Parent / Guardian Contact is required.';
            }
        }
        if (!courseInterest.trim()) {
            nextErrors.courseInterest = 'Please select a Course / Programme in Section 2.';
        }
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const validateStep2 = (): boolean => {
        const nextErrors: Record<string, string> = {};
        if (preferredStudyDays.length === 0) {
            nextErrors.preferredStudyDays = 'Please select at least one Preferred Study Day in Section 3.';
        }
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const validateStep3 = (): boolean => {
        const nextErrors: Record<string, string> = {};
        const allCommitted = checkedCommitments.every(Boolean);
        if (!allCommitted) {
            nextErrors.commitments = 'Please check all 8 Student Commitment items in Section 5.';
        }
        if (!studentSignature.trim()) {
            nextErrors.studentSignature = 'Please provide your Student Signature in Section 6.';
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

        const v1 = validateStep1();
        if (!v1) {
            if (!singlePageMode) setStep(1);
            return;
        }
        const v2 = validateStep2();
        if (!v2) {
            if (!singlePageMode) setStep(2);
            return;
        }
        const v3 = validateStep3();
        if (!v3) {
            if (!singlePageMode) setStep(3);
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        const selectedCampaign = campaigns.find(c => c.name === outreachEvent);
        const resolvedHowHeard =
            selectedCampaign?.category === 'GENERAL' ? 'Website / Walk-in' : howHeard || 'Outreach Event';

        const finalPaymentPlan =
            paymentPlan === 'Other' && paymentPlanOther.trim()
                ? `Other: ${paymentPlanOther.trim()}`
                : paymentPlan;

        const finalPaymentMethod =
            paymentMethod === 'Other' && paymentMethodOther.trim()
                ? `Other: ${paymentMethodOther.trim()}`
                : paymentMethod;

        const payload: OutreachRegistrationPayload = {
            registration_date: registrationDate,
            student_reg_no: studentRegNo.trim() || generateStudentRegNo(),

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
            mode_of_study_text: modeOfStudyText,
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
            total_course_fee: Number(totalCourseFee) || 600000,
            registration_fee: registrationFee,
            amount_paid: Number(amountPaid) || 0,
            outstanding_balance: outstandingBalance,
            payment_plan: finalPaymentPlan,
            agreed_payment_amount: Number(agreedPaymentAmount) || 0,
            next_payment_date: nextPaymentDate,
            payment_due_date: paymentDueDate,
            payment_method: finalPaymentMethod,
            payment_reference: paymentReference,

            // 5, 6, 7. COMMITMENTS, DECLARATION & GUARDIAN CONSENT
            commitments_accepted: true,
            commitments_list: OFFICIAL_COMMITMENTS,
            student_signature: studentSignature.trim() || declarationFullName.trim() || fullName.trim(),
            student_declaration_date: studentDeclarationDate,
            guardian_signature: guardianName.trim() ? (guardianSignature.trim() || guardianName.trim()) : null,
            guardian_consent_date: guardianName.trim() ? guardianConsentDate : null,
            consent_contact: true,

            // OUTREACH ATTRIBUTION
            how_heard: resolvedHowHeard,
            outreach_event: outreachEvent,

            // 8. SCHOOL / ADMINISTRATION USE ONLY
            status: 'NEW',
            approved_by: approvedBy,
            approver_position: approverPosition,
            assigned_instructor: assignedInstructor,
            confirmed_schedule: confirmedSchedule,
            admin_payment_status: adminPaymentStatus,
            admin_signature_date: adminSignatureDate,
            admin_remarks: adminRemarks,
            admin_notes: adminRemarks,
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
        setDeclarationFullName('');
        setEmail('');
        setPhone('');
        setGuardianName('');
        setGuardianPhone('');
        setAmountPaid(0);
        setPaymentPlanOther('');
        setPaymentMethodOther('');
        setPaymentReference('To be confirmed at follow-up');
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 font-sans transition-colors duration-200 pb-32 sm:pb-16">
            {/* Mobile-First Sticky Top Navigation Bar */}
            <nav className="sticky top-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-40 border-b border-gray-100 dark:border-slate-800 print:hidden">
                <div className="max-w-3xl mx-auto px-3.5 sm:px-6">
                    <div className="flex justify-between items-center h-14 sm:h-16">
                        <Link to="/" className="flex items-center gap-2 min-w-0">
                            <img src="/schoolofai-logo.png" alt="Welile School of AI" className="h-10 sm:h-12 object-contain shrink-0" />
                            <div className="truncate">
                                <span className="block text-[11px] sm:text-xs font-extrabold tracking-wider text-violet-600 dark:text-violet-400 uppercase truncate">
                                    WELILE SCHOOL OF AI
                                </span>
                                <span className="block text-[10px] text-gray-500 dark:text-slate-400 truncate">
                                    Katabi, Entebbe, Uganda
                                </span>
                            </div>
                        </Link>

                        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                            {!isOnline ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800/60">
                                    <WifiOff size={11} /> Offline
                                </span>
                            ) : pendingQueueCount > 0 ? (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        await flushPendingOutreachRegistrations();
                                        setPendingQueueCount(getQueuedOutreachRegistrations().length);
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-[10px] font-bold border border-violet-200 dark:border-violet-800/60 cursor-pointer"
                                >
                                    <Wifi size={11} /> Sync ({pendingQueueCount})
                                </button>
                            ) : null}

                            {!submittedRecord && (
                                <button
                                    type="button"
                                    onClick={() => setSinglePageMode(prev => !prev)}
                                    className="px-2.5 py-1.5 rounded-xl bg-violet-50 dark:bg-slate-800 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-slate-700 text-[11px] font-bold hover:bg-violet-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                >
                                    {singlePageMode ? 'Step-by-Step View' : 'Full 1–8 Form View'}
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={toggleTheme}
                                className="p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                                aria-label="Toggle theme"
                            >
                                {isDark ? <Sun size={17} /> : <Moon size={17} />}
                            </button>

                            <Link
                                to="/"
                                className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white px-2.5 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
                            >
                                <ArrowLeft size={14} />
                                <span className="hidden sm:inline">Home</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-3xl mx-auto px-3.5 sm:px-6 pt-4 sm:pt-7">
                {/* =====================================================================
                    OFFICIAL FORM HEADER & TOP METADATA TABLE
                   ===================================================================== */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-4 sm:p-7 shadow-sm mb-5">
                    <div className="text-center border-b border-gray-200 dark:border-slate-800 pb-4 mb-4">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider mb-2">
                            <Sparkles size={12} /> Official Outreach & Student Registration Form
                        </div>
                        <h1 className="text-xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white uppercase">
                            WELILE SCHOOL OF AI
                        </h1>
                        <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-slate-400">
                            Katabi, Entebbe, Uganda
                        </p>
                        <h2 className="mt-1.5 text-xs sm:text-base font-extrabold text-violet-700 dark:text-violet-300 uppercase tracking-wide leading-snug">
                            STUDENT REGISTRATION, STUDY SCHEDULE & PAYMENT AGREEMENT FORM
                        </h2>
                    </div>

                    {/* Outreach Follow-Up Context Banner */}
                    <div className="mb-4 p-3 sm:p-3.5 rounded-2xl bg-violet-50/80 dark:bg-violet-950/30 border border-violet-200/80 dark:border-violet-800/50 flex items-start gap-2.5 text-xs text-violet-900 dark:text-violet-200">
                        <Info size={16} className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                        <div className="leading-relaxed">
                            <span className="font-extrabold">Outreach Registration Context:</span> Complete Sections 1–7 below at the outreach event. Your provisional Registration Number (<code className="font-mono font-bold">{studentRegNo}</code>), study schedule, and payment plan will be <strong>confirmed when our admissions team follows up with you</strong>.
                        </div>
                    </div>

                    {/* Outreach Campaign Selector */}
                    <div className="mb-3 p-3 rounded-2xl bg-gray-50 dark:bg-slate-950/70 border border-gray-200/80 dark:border-slate-800">
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-1 flex items-center gap-1">
                            <Megaphone size={12} /> Active Outreach Event / Registration Channel
                        </label>
                        <select
                            value={outreachEvent}
                            onChange={(e) => setOutreachEvent(e.target.value)}
                            disabled={Boolean(submittedRecord)}
                            className="w-full px-3.5 py-2.5 min-h-[46px] bg-white dark:bg-slate-900 border border-violet-300 dark:border-violet-800 rounded-xl font-bold text-gray-900 dark:text-white text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
                        >
                            {campaigns.map((c) => (
                                <option key={c.id} value={c.name}>
                                    {c.name} — {c.location}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Official 2x2 Header Table:
                        | Registration Date: ____ / ____ / ______ | Student Registration No.: WSI/10/26/004 |
                        | Course / Programme: Coding With AI      | Assigned Level: Intermediate            | */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 border border-gray-300 dark:border-slate-700 rounded-2xl overflow-hidden text-xs bg-white dark:bg-slate-900">
                        {/* Cell 1: Registration Date */}
                        <div className="p-3 border-b border-gray-200 dark:border-slate-800 sm:border-r flex items-center justify-between gap-2">
                            <span className="font-bold text-gray-700 dark:text-slate-300 shrink-0">
                                Registration Date:
                            </span>
                            <input
                                type="date"
                                value={registrationDate}
                                onChange={(e) => setRegistrationDate(e.target.value)}
                                disabled={Boolean(submittedRecord)}
                                className="font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-xs focus:outline-none"
                            />
                        </div>

                        {/* Cell 2: Student Registration No. */}
                        <div className="p-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between gap-2">
                            <span className="font-bold text-gray-700 dark:text-slate-300 shrink-0">
                                Student Registration No.:
                            </span>
                            <div className="flex items-center gap-1.5 min-w-0">
                                <input
                                    type="text"
                                    value={studentRegNo}
                                    onChange={(e) => setStudentRegNo(e.target.value)}
                                    disabled={Boolean(submittedRecord)}
                                    className="w-32 sm:w-36 font-mono font-extrabold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 px-2.5 py-1.5 rounded-lg border border-violet-200 dark:border-violet-800 text-xs text-right focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Cell 3: Course / Programme */}
                        <div className="p-3 border-b sm:border-b-0 border-gray-200 dark:border-slate-800 sm:border-r flex items-center justify-between gap-2">
                            <span className="font-bold text-gray-700 dark:text-slate-300 shrink-0">
                                Course / Programme:
                            </span>
                            <span className="font-extrabold text-violet-700 dark:text-violet-300 truncate">
                                {submittedRecord?.course_interest || courseInterest}
                            </span>
                        </div>

                        {/* Cell 4: Assigned Level */}
                        <div className="p-3 flex items-center justify-between gap-2">
                            <span className="font-bold text-gray-700 dark:text-slate-300 shrink-0">
                                Assigned Level:
                            </span>
                            <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                                {submittedRecord?.level || level}
                            </span>
                        </div>
                    </div>
                </div>

                {/* =====================================================================
                    SUBMITTED CONFIRMATION & COMPLETE 8-SECTION PRINTABLE SHEET
                   ===================================================================== */}
                {submittedRecord ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-5 sm:p-8 shadow-xl space-y-6 animate-in fade-in duration-200">
                        <div className="text-center space-y-2 print:hidden">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                                <CheckCircle2 size={36} />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                                {submittedMode === 'online'
                                    ? 'Official Outreach Registration Saved!'
                                    : 'Saved Offline — Will Sync Automatically When Online'}
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                                Registration No. <strong className="font-mono text-violet-600 dark:text-violet-400">{submittedRecord.student_reg_no}</strong> for{' '}
                                <strong>{submittedRecord.full_name}</strong> ({submittedRecord.outreach_event}) has been recorded. Our team will follow up on <strong>{submittedRecord.phone}</strong> to confirm enrollment.
                            </p>
                        </div>

                        {/* Complete 8-Section Summary */}
                        <div className="space-y-4 text-xs border border-gray-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 bg-gray-50/60 dark:bg-slate-950/50">
                            <div>
                                <h4 className="font-extrabold text-violet-700 dark:text-violet-300 uppercase mb-1.5 border-b border-gray-200 dark:border-slate-800 pb-1">
                                    1. STUDENT INFORMATION
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    <p><span className="text-gray-500">Full Name:</span> <strong>{submittedRecord.full_name}</strong></p>
                                    <p><span className="text-gray-500">Email Address:</span> <strong>{submittedRecord.email || '—'}</strong></p>
                                    <p><span className="text-gray-500">Phone Number:</span> <strong>{submittedRecord.phone}</strong></p>
                                    <p><span className="text-gray-500">Class / Level / Year:</span> <strong>{submittedRecord.class_level_year}</strong></p>
                                    <p><span className="text-gray-500">Parent / Guardian Name:</span> <strong>{submittedRecord.guardian_name || 'N/A'}</strong></p>
                                    <p><span className="text-gray-500">Parent / Guardian Contact:</span> <strong>{submittedRecord.guardian_phone || 'N/A'}</strong></p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-extrabold text-violet-700 dark:text-violet-300 uppercase mb-1.5 border-b border-gray-200 dark:border-slate-800 pb-1">
                                    2. COURSE & PROGRAMME INFORMATION
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    <p><span className="text-gray-500">Course / Programme:</span> <strong>{submittedRecord.course_interest}</strong></p>
                                    <p><span className="text-gray-500">Level:</span> <strong>{submittedRecord.level}</strong></p>
                                    <p><span className="text-gray-500">Mode of Study:</span> <strong>{submittedRecord.mode_of_study_text || submittedRecord.mode_preference}</strong></p>
                                    <p><span className="text-gray-500">Mode:</span> <strong>{submittedRecord.mode_preference}</strong></p>
                                    <p><span className="text-gray-500">Expected Start Date:</span> <strong>{submittedRecord.expected_start_date}</strong></p>
                                    <p><span className="text-gray-500">Expected Completion Date:</span> <strong>{submittedRecord.expected_completion_date}</strong></p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-extrabold text-violet-700 dark:text-violet-300 uppercase mb-1.5 border-b border-gray-200 dark:border-slate-800 pb-1">
                                    3. STUDY SCHEDULE
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    <p><span className="text-gray-500">Preferred Study Days:</span> <strong>{(submittedRecord.preferred_study_days || []).join(', ')}</strong></p>
                                    <p><span className="text-gray-500">Chosen Study Time (From – To):</span> <strong>{submittedRecord.preferred_time_slot}</strong></p>
                                    <p><span className="text-gray-500">Study Hours Per Session:</span> <strong>{submittedRecord.study_hours_per_session}</strong></p>
                                    <p><span className="text-gray-500">Number of Sessions Per Week:</span> <strong>{submittedRecord.sessions_per_week}</strong></p>
                                    <p className="sm:col-span-2"><span className="text-gray-500">Alternative Study Time:</span> <strong>{submittedRecord.alternative_study_time}</strong></p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-extrabold text-violet-700 dark:text-violet-300 uppercase mb-1.5 border-b border-gray-200 dark:border-slate-800 pb-1">
                                    4. FEES & PAYMENT AGREEMENT
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    <p><span className="text-gray-500">Total Course Fee:</span> <strong>UGX {(submittedRecord.total_course_fee ?? 600000).toLocaleString()}</strong></p>
                                    <p><span className="text-gray-500">Registration Fee:</span> <strong>{submittedRecord.registration_fee}</strong></p>
                                    <p><span className="text-gray-500">Amount Paid:</span> <strong>UGX {(submittedRecord.amount_paid ?? 0).toLocaleString()}</strong></p>
                                    <p><span className="text-gray-500">Outstanding Balance:</span> <strong>UGX {(submittedRecord.outstanding_balance ?? 600000).toLocaleString()}</strong></p>
                                    <p><span className="text-gray-500">Payment Plan:</span> <strong>{submittedRecord.payment_plan}</strong></p>
                                    <p><span className="text-gray-500">Agreed Payment Amount:</span> <strong>UGX {(submittedRecord.agreed_payment_amount ?? 200000).toLocaleString()}</strong></p>
                                    <p><span className="text-gray-500">Next Payment Date:</span> <strong>{submittedRecord.next_payment_date}</strong></p>
                                    <p><span className="text-gray-500">Payment Due Date:</span> <strong>{submittedRecord.payment_due_date}</strong></p>
                                    <p><span className="text-gray-500">Payment Method:</span> <strong>{submittedRecord.payment_method}</strong></p>
                                    <p><span className="text-gray-500">Payment Reference / Receipt No.:</span> <strong>{submittedRecord.payment_reference}</strong></p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-extrabold text-violet-700 dark:text-violet-300 uppercase mb-1.5 border-b border-gray-200 dark:border-slate-800 pb-1">
                                    5, 6 & 7. STUDENT COMMITMENT, DECLARATION & GUARDIAN CONSENT
                                </h4>
                                <p className="text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
                                    ✓ All 8 Student Commitments Checked & Accepted
                                </p>
                                <p><span className="text-gray-500">Student Signature:</span> <strong className="italic font-serif">{submittedRecord.student_signature}</strong> • Date: <strong>{submittedRecord.student_declaration_date}</strong></p>
                                {submittedRecord.guardian_name && (
                                    <p><span className="text-gray-500">Parent / Guardian Consent:</span> <strong>{submittedRecord.guardian_name}</strong> ({submittedRecord.guardian_phone}) • Signed: <strong className="italic font-serif">{submittedRecord.guardian_signature}</strong></p>
                                )}
                            </div>

                            <div>
                                <h4 className="font-extrabold text-violet-700 dark:text-violet-300 uppercase mb-1.5 border-b border-gray-200 dark:border-slate-800 pb-1">
                                    8. SCHOOL / ADMINISTRATION USE ONLY
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    <p><span className="text-gray-500">Registration Approved By:</span> <strong>{submittedRecord.approved_by}</strong></p>
                                    <p><span className="text-gray-500">Position:</span> <strong>{submittedRecord.approver_position}</strong></p>
                                    <p><span className="text-gray-500">Assigned Class / Instructor:</span> <strong>{submittedRecord.assigned_instructor}</strong></p>
                                    <p><span className="text-gray-500">Confirmed Study Schedule:</span> <strong>{submittedRecord.confirmed_schedule}</strong></p>
                                    <p><span className="text-gray-500">Payment Status:</span> <strong>{submittedRecord.admin_payment_status}</strong></p>
                                    <p><span className="text-gray-500">Admin Signature & Date:</span> <strong>{submittedRecord.admin_signature_date}</strong></p>
                                    <p className="sm:col-span-2"><span className="text-gray-500">Remarks:</span> <strong>{submittedRecord.admin_remarks || submittedRecord.admin_notes}</strong></p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 print:hidden">
                            <button
                                type="button"
                                onClick={handleRegisterAnother}
                                className="flex-1 py-4 px-6 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold text-sm sm:text-base shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <UserPlus size={20} />
                                Register Next Student
                            </button>
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="py-4 px-5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Printer size={18} />
                                Print / Save Official PDF
                            </button>
                        </div>
                    </div>
                ) : (
                    /* =================================================================
                       COMPLETE 8-SECTION FORM (SECTIONS 1 TO 8 IN EXACT ORDER)
                       ================================================================= */
                    <form onSubmit={handleSubmit} noValidate className="space-y-5">
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

                        {/* Optional Step Progress Bar when in Step-by-Step mode */}
                        {!singlePageMode && (
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-extrabold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                                        Step {step} of 3
                                    </span>
                                    <span className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-slate-400 truncate ml-2">
                                        {step === 1 && 'Sections 1 & 2: Student & Course Info'}
                                        {step === 2 && 'Sections 3 & 4: Study Schedule & Fees'}
                                        {step === 3 && 'Sections 5–8: Commitment, Declaration & Admin'}
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                                    <div
                                        className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-300"
                                        style={{ width: `${(step / 3) * 100}%` }}
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                                    {[
                                        { num: 1, title: '1–2. Student', icon: User },
                                        { num: 2, title: '3–4. Schedule', icon: Calendar },
                                        { num: 3, title: '5–8. Confirm', icon: FileCheck }
                                    ].map(({ num, title, icon: Icon }) => {
                                        const active = step === num;
                                        const done = step > num;
                                        return (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => setStep(num as 1 | 2 | 3)}
                                                className={`py-2.5 px-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                                    active
                                                        ? 'bg-violet-600 text-white shadow-sm'
                                                        : done
                                                        ? 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300'
                                                        : 'bg-gray-100 dark:bg-slate-800 text-gray-400'
                                                }`}
                                            >
                                                {done ? <CheckCircle2 size={13} className="shrink-0" /> : <Icon size={13} className="shrink-0" />}
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
                            <div className="space-y-5">
                                {/* 1. STUDENT INFORMATION */}
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-4 sm:p-7 shadow-sm space-y-4">
                                    <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-slate-800 pb-3">
                                        <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black text-sm shrink-0">
                                            1
                                        </div>
                                        <div>
                                            <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-gray-900 dark:text-white">
                                                1. STUDENT INFORMATION
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Full Name: ______________________________________________________________ */}
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Full Name: <span className="text-red-500">*</span>
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
                                                    className={`w-full pl-10 pr-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border rounded-2xl text-base sm:text-sm font-medium focus:outline-none ${
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

                                        {/* Email Address: ___________________________________________________________ */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Email Address:
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
                                                    className="w-full pl-10 pr-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-base sm:text-sm font-medium focus:outline-none focus:border-violet-500"
                                                />
                                            </div>
                                            {errors.email && (
                                                <p className="mt-1 text-xs font-semibold text-red-500">{errors.email}</p>
                                            )}
                                        </div>

                                        {/* Phone Number: ___________________________________________________________ */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Phone Number: <span className="text-red-500">*</span>
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
                                                    className={`w-full pl-10 pr-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border rounded-2xl text-base sm:text-sm font-medium focus:outline-none ${
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

                                        {/* Class / Level / Year: ___________________________________________________ */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Class / Level / Year:
                                            </label>
                                            <div className="relative">
                                                <GraduationCap size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                <select
                                                    value={classLevelYear}
                                                    onChange={(e) => setClassLevelYear(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-base sm:text-sm font-semibold focus:outline-none focus:border-violet-500 cursor-pointer"
                                                >
                                                    {CLASS_LEVEL_OPTIONS.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Location / Campus Area */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Location / Area:
                                            </label>
                                            <div className="relative">
                                                <MapPin size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                <select
                                                    value={location}
                                                    onChange={(e) => setLocation(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-base sm:text-sm font-semibold focus:outline-none focus:border-violet-500 cursor-pointer"
                                                >
                                                    {LOCATION_PRESETS.map(loc => (
                                                        <option key={loc} value={loc}>{loc}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Age Range */}
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1.5">
                                                Age Category:
                                            </label>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                {AGE_RANGES.map((range) => (
                                                    <button
                                                        key={range}
                                                        type="button"
                                                        onClick={() => setAgeRange(range)}
                                                        className={`py-3 px-3 min-h-[46px] rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                                            ageRange === range
                                                                ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                                                                : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                                                        }`}
                                                    >
                                                        <span>{ageRange === range ? '☑' : '☐'}</span>
                                                        <span>{range}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Parent / Guardian Name (if applicable): ________________________________ */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Parent / Guardian Name (if applicable): {isGuardianRequired && <span className="text-red-500">*</span>}
                                            </label>
                                            <input
                                                type="text"
                                                value={guardianName}
                                                onChange={(e) => {
                                                    setGuardianName(e.target.value);
                                                    if (errors.guardianName) setErrors(prev => ({ ...prev, guardianName: '' }));
                                                }}
                                                placeholder="Parent / Guardian Name (if applicable)"
                                                className={`w-full px-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border rounded-2xl text-base sm:text-sm font-medium focus:outline-none ${
                                                    errors.guardianName ? 'border-red-500' : 'border-gray-200 dark:border-slate-700 focus:border-violet-500'
                                                }`}
                                            />
                                            {errors.guardianName && (
                                                <p className="mt-1 text-xs font-semibold text-red-500">{errors.guardianName}</p>
                                            )}
                                        </div>

                                        {/* Parent / Guardian Contact: _____________________________________________ */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Parent / Guardian Contact: {isGuardianRequired && <span className="text-red-500">*</span>}
                                            </label>
                                            <input
                                                type="tel"
                                                value={guardianPhone}
                                                onChange={(e) => {
                                                    setGuardianPhone(e.target.value);
                                                    if (errors.guardianPhone) setErrors(prev => ({ ...prev, guardianPhone: '' }));
                                                }}
                                                placeholder="Parent / Guardian Phone Number"
                                                className={`w-full px-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border rounded-2xl text-base sm:text-sm font-medium focus:outline-none ${
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
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-4 sm:p-7 shadow-sm space-y-4">
                                    <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-slate-800 pb-3">
                                        <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black text-sm shrink-0">
                                            2
                                        </div>
                                        <div>
                                            <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-gray-900 dark:text-white">
                                                2. COURSE & PROGRAMME INFORMATION
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Course / Programme: ________________________________________________________ */}
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Course / Programme: <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <BookOpen size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                <select
                                                    value={courseInterest}
                                                    onChange={(e) => setCourseInterest(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3.5 min-h-[50px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-base sm:text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                                                >
                                                    {courseOptions.map((c) => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Level: ☐ Beginner     ☐ Intermediate     ☐ Advanced */}
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1.5">
                                                Level:
                                            </label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {LEVELS.map((lvl) => (
                                                    <button
                                                        key={lvl}
                                                        type="button"
                                                        onClick={() => setLevel(lvl)}
                                                        className={`py-3 px-2 min-h-[48px] rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
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

                                        {/* Mode of Study: _______________________________________________________ */}
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Mode of Study:
                                            </label>
                                            <input
                                                type="text"
                                                value={modeOfStudyText}
                                                onChange={(e) => setModeOfStudyText(e.target.value)}
                                                className="w-full px-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-base sm:text-sm font-semibold text-gray-800 dark:text-slate-200 focus:outline-none focus:border-violet-500"
                                                placeholder="Mode of Study"
                                            />
                                        </div>

                                        {/* Mode: ☐ Physical     ☐ Online     ☐ Hybrid */}
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1.5">
                                                Mode:
                                            </label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {MODES.map((m) => (
                                                    <button
                                                        key={m}
                                                        type="button"
                                                        onClick={() => setModePreference(m)}
                                                        className={`py-3 px-2 min-h-[48px] rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
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

                                        {/* Expected Start Date: ___________________________________________________ */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Expected Start Date:
                                            </label>
                                            <input
                                                type="date"
                                                value={expectedStartDate}
                                                onChange={(e) => setExpectedStartDate(e.target.value)}
                                                className="w-full px-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-base sm:text-sm font-semibold focus:outline-none focus:border-violet-500"
                                            />
                                        </div>

                                        {/* Expected Completion Date: ______________________________________________ */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Expected Completion Date:
                                            </label>
                                            <input
                                                type="date"
                                                value={expectedCompletionDate}
                                                onChange={(e) => setExpectedCompletionDate(e.target.value)}
                                                className="w-full px-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-base sm:text-sm font-semibold focus:outline-none focus:border-violet-500"
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
                            <div className="space-y-5">
                                {/* 3. STUDY SCHEDULE */}
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-4 sm:p-7 shadow-sm space-y-4">
                                    <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-slate-800 pb-3">
                                        <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black text-sm shrink-0">
                                            3
                                        </div>
                                        <div>
                                            <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-gray-900 dark:text-white">
                                                3. STUDY SCHEDULE
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Preferred Study Days: ☐ Mon  ☐ Tue  ☐ Wed  ☐ Thu  ☐ Fri  ☐ Sat  ☐ Sun */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-2">
                                            Preferred Study Days: <span className="text-red-500">*</span>
                                        </label>
                                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                                            {DAYS_OF_WEEK.map((day) => {
                                                const selected = preferredStudyDays.includes(day);
                                                return (
                                                    <button
                                                        key={day}
                                                        type="button"
                                                        onClick={() => toggleStudyDay(day)}
                                                        className={`py-3 px-2 min-h-[48px] rounded-xl font-bold text-xs border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                                            selected
                                                                ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                                                                : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                                                        }`}
                                                    >
                                                        <span>{selected ? '☑' : '☐'}</span>
                                                        <span>{day}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {errors.preferredStudyDays && (
                                            <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.preferredStudyDays}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Chosen Study Time (From – To): ________________________________________ */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Chosen Study Time (From – To):
                                            </label>
                                            <select
                                                value={chosenStudyTime}
                                                onChange={(e) => setChosenStudyTime(e.target.value)}
                                                className="w-full px-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-base sm:text-sm font-semibold focus:outline-none focus:border-violet-500 cursor-pointer"
                                            >
                                                {STUDY_TIME_SLOTS.map(slot => (
                                                    <option key={slot} value={slot}>{slot}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Study Hours Per Session: _______________________________________________ */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Study Hours Per Session:
                                            </label>
                                            <select
                                                value={studyHoursPerSession}
                                                onChange={(e) => setStudyHoursPerSession(e.target.value)}
                                                className="w-full px-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-base sm:text-sm font-semibold focus:outline-none focus:border-violet-500 cursor-pointer"
                                            >
                                                {STUDY_HOURS_OPTIONS.map(h => (
                                                    <option key={h} value={h}>{h}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Number of Sessions Per Week: __________________________________________ */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Number of Sessions Per Week:
                                            </label>
                                            <select
                                                value={sessionsPerWeek}
                                                onChange={(e) => setSessionsPerWeek(e.target.value)}
                                                className="w-full px-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-base sm:text-sm font-semibold focus:outline-none focus:border-violet-500 cursor-pointer"
                                            >
                                                {SESSIONS_PER_WEEK_OPTIONS.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Alternative Study Time (if applicable): __________________________________ */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Alternative Study Time (if applicable):
                                            </label>
                                            <select
                                                value={alternativeStudyTime}
                                                onChange={(e) => setAlternativeStudyTime(e.target.value)}
                                                className="w-full px-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-base sm:text-sm font-semibold focus:outline-none focus:border-violet-500 cursor-pointer"
                                            >
                                                {ALTERNATIVE_TIME_OPTIONS.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* 4. FEES & PAYMENT AGREEMENT */}
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-4 sm:p-7 shadow-sm space-y-4">
                                    <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-slate-800 pb-3">
                                        <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black text-sm shrink-0">
                                            4
                                        </div>
                                        <div>
                                            <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-gray-900 dark:text-white">
                                                4. FEES & PAYMENT AGREEMENT
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Official Fee Table:
                                        | Total Course Fee      | UGX 600,000         |
                                        | Registration Fee      | UGX –Not Applicable |
                                        | Amount Paid           | UGX                 |
                                        | Outstanding Balance   | UGX                 |
                                        | Payment Plan          | ☐ Full ☐ Weekly ☐ Monthly ☐ Other: ____ |
                                        | Agreed Payment Amount | UGX                 |
                                        | Next Payment Date     | ____ / ____ / ______| */}
                                    <div className="border border-gray-300 dark:border-slate-700 rounded-2xl overflow-hidden divide-y divide-gray-200 dark:divide-slate-800 text-xs sm:text-sm">
                                        {/* Row 1: Total Course Fee */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 items-center p-3 bg-gray-50/70 dark:bg-slate-950/40 gap-2">
                                            <span className="font-bold text-gray-700 dark:text-slate-300">Total Course Fee</span>
                                            <div className="sm:col-span-2 flex items-center gap-2">
                                                <span className="font-bold text-gray-500">UGX</span>
                                                <input
                                                    type="number"
                                                    value={totalCourseFee}
                                                    onChange={(e) => setTotalCourseFee(Number(e.target.value) || 600000)}
                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl font-black text-gray-900 dark:text-white text-base sm:text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Row 2: Registration Fee */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 items-center p-3 gap-2">
                                            <span className="font-bold text-gray-700 dark:text-slate-300">Registration Fee</span>
                                            <div className="sm:col-span-2">
                                                <input
                                                    type="text"
                                                    value={registrationFee}
                                                    onChange={(e) => setRegistrationFee(e.target.value)}
                                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-extrabold text-emerald-700 dark:text-emerald-400 text-base sm:text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Row 3: Amount Paid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 items-center p-3 bg-gray-50/70 dark:bg-slate-950/40 gap-2">
                                            <span className="font-bold text-gray-700 dark:text-slate-300">Amount Paid</span>
                                            <div className="sm:col-span-2 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-500">UGX</span>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        step={10000}
                                                        value={amountPaid}
                                                        onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-gray-900 dark:text-white text-base sm:text-sm"
                                                    />
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {[
                                                        { label: '0 (Pay on Follow-up)', val: 0 },
                                                        { label: '100,000', val: 100000 },
                                                        { label: '200,000', val: 200000 },
                                                        { label: '600,000', val: 600000 }
                                                    ].map((p) => (
                                                        <button
                                                            key={p.val}
                                                            type="button"
                                                            onClick={() => setAmountPaid(p.val)}
                                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                                                                Number(amountPaid) === p.val
                                                                    ? 'bg-violet-600 text-white border-violet-600'
                                                                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                                                            }`}
                                                        >
                                                            UGX {p.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row 4: Outstanding Balance */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 items-center p-3 gap-2">
                                            <span className="font-bold text-gray-700 dark:text-slate-300">Outstanding Balance</span>
                                            <div className="sm:col-span-2 flex items-center gap-2">
                                                <span className="font-bold text-gray-500">UGX</span>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={outstandingBalance.toLocaleString()}
                                                    className="w-full px-3 py-2 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl font-black text-amber-700 dark:text-amber-300 text-base sm:text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Row 5: Payment Plan | ☐ Full ☐ Weekly ☐ Monthly ☐ Other: __________ */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 items-start sm:items-center p-3 bg-gray-50/70 dark:bg-slate-950/40 gap-2">
                                            <span className="font-bold text-gray-700 dark:text-slate-300">Payment Plan</span>
                                            <div className="sm:col-span-2 space-y-2">
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                    {PAYMENT_PLANS.map((p) => (
                                                        <button
                                                            key={p.value}
                                                            type="button"
                                                            onClick={() => handlePaymentPlanChange(p.value)}
                                                            className={`py-2.5 px-2.5 min-h-[44px] rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                                                paymentPlan === p.value
                                                                    ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                                                                    : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                                                            }`}
                                                        >
                                                            <span>{paymentPlan === p.value ? '☑' : '☐'}</span>
                                                            <span>{p.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-gray-500 shrink-0">Other:</span>
                                                    <input
                                                        type="text"
                                                        value={paymentPlanOther}
                                                        onChange={(e) => {
                                                            setPaymentPlanOther(e.target.value);
                                                            if (e.target.value.trim()) setPaymentPlan('Other');
                                                        }}
                                                        placeholder="Specify if Other payment plan..."
                                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-base sm:text-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row 6: Agreed Payment Amount */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 items-center p-3 gap-2">
                                            <span className="font-bold text-gray-700 dark:text-slate-300">Agreed Payment Amount</span>
                                            <div className="sm:col-span-2 flex items-center gap-2">
                                                <span className="font-bold text-gray-500">UGX</span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step={10000}
                                                    value={agreedPaymentAmount}
                                                    onChange={(e) => setAgreedPaymentAmount(Number(e.target.value) || 0)}
                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-gray-900 dark:text-white text-base sm:text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Row 7: Next Payment Date */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 items-center p-3 bg-gray-50/70 dark:bg-slate-950/40 gap-2">
                                            <span className="font-bold text-gray-700 dark:text-slate-300">Next Payment Date</span>
                                            <div className="sm:col-span-2">
                                                <input
                                                    type="date"
                                                    value={nextPaymentDate}
                                                    onChange={(e) => setNextPaymentDate(e.target.value)}
                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl font-semibold text-base sm:text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Below Table Fields in Section 4:
                                        Payment Due Date: ____________________________________________________
                                        Payment Method:
                                        Method: ☐ Cash     ☐ Mobile Money     ☐ Bank     ☐ Other: __________
                                        Payment Reference / Receipt No.: _______________________________________ */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Payment Due Date:
                                            </label>
                                            <input
                                                type="date"
                                                value={paymentDueDate}
                                                onChange={(e) => setPaymentDueDate(e.target.value)}
                                                className="w-full px-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-base sm:text-sm font-semibold"
                                            />
                                        </div>

                                        <div className="sm:col-span-2 space-y-2">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300">
                                                Payment Method (Method):
                                            </label>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                {PAYMENT_METHODS.map((pm) => (
                                                    <button
                                                        key={pm}
                                                        type="button"
                                                        onClick={() => setPaymentMethod(pm)}
                                                        className={`py-3 px-3 min-h-[48px] rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                                            paymentMethod === pm
                                                                ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                                                                : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                                                        }`}
                                                    >
                                                        <span>{paymentMethod === pm ? '☑' : '☐'}</span>
                                                        <span>{pm}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold text-gray-500 shrink-0">Other:</span>
                                                <input
                                                    type="text"
                                                    value={paymentMethodOther}
                                                    onChange={(e) => {
                                                        setPaymentMethodOther(e.target.value);
                                                        if (e.target.value.trim()) setPaymentMethod('Other');
                                                    }}
                                                    placeholder="Specify if Other payment method..."
                                                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-base sm:text-xs"
                                                />
                                            </div>
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Payment Reference / Receipt No.:
                                            </label>
                                            <input
                                                type="text"
                                                value={paymentReference}
                                                onChange={(e) => setPaymentReference(e.target.value)}
                                                placeholder="Receipt / Mobile Money Ref (or 'To be confirmed at follow-up')"
                                                className="w-full px-4 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-base sm:text-sm font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* =========================================================
                            SECTIONS 5, 6, 7 & 8: COMMITMENT, DECLARATION, CONSENT & ADMIN
                           ========================================================= */}
                        {showStep3 && (
                            <div className="space-y-5">
                                {/* 5. STUDENT COMMITMENT */}
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-4 sm:p-7 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black text-sm shrink-0">
                                                5
                                            </div>
                                            <div>
                                                <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-gray-900 dark:text-white">
                                                    5. STUDENT COMMITMENT
                                                </h3>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                const allTrue = checkedCommitments.every(Boolean);
                                                setCheckedCommitments(OFFICIAL_COMMITMENTS.map(() => !allTrue));
                                            }}
                                            className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer shrink-0"
                                        >
                                            {checkedCommitments.every(Boolean) ? 'All Checked ✓' : 'Check All'}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2">
                                        {OFFICIAL_COMMITMENTS.map((text, idx) => (
                                            <label
                                                key={idx}
                                                className={`flex items-start gap-3 p-3 rounded-2xl border text-xs sm:text-sm cursor-pointer transition-colors ${
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
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-4 sm:p-7 shadow-sm space-y-4">
                                    <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-slate-800 pb-3">
                                        <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black text-sm shrink-0">
                                            6
                                        </div>
                                        <div>
                                            <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-gray-900 dark:text-white">
                                                6. STUDENT DECLARATION & SIGNATURE
                                            </h3>
                                        </div>
                                    </div>

                                    <p className="text-xs sm:text-sm text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-gray-200/70 dark:border-slate-800 italic leading-relaxed">
                                        I confirm that I have read, understood and agreed to the information, study schedule, payment arrangements and responsibilities stated in this form.
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {/* Student Full Name: ______________________________________________________ */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Student Full Name:
                                            </label>
                                            <input
                                                type="text"
                                                value={declarationFullName}
                                                onChange={(e) => setDeclarationFullName(e.target.value)}
                                                placeholder="Student Full Name"
                                                className="w-full px-3.5 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-base sm:text-sm font-bold"
                                            />
                                        </div>

                                        {/* Student Signature: ________________________________________________________ */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Student Signature: <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <PenTool size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-500" />
                                                <input
                                                    type="text"
                                                    required
                                                    value={studentSignature}
                                                    onChange={(e) => {
                                                        setStudentSignature(e.target.value);
                                                        if (errors.studentSignature) setErrors(prev => ({ ...prev, studentSignature: '' }));
                                                    }}
                                                    placeholder="Type full name to sign"
                                                    className="w-full pl-9 pr-3 py-3 min-h-[48px] bg-violet-50/50 dark:bg-violet-950/30 border border-violet-300 dark:border-violet-700 rounded-2xl text-base sm:text-sm font-serif italic font-bold text-violet-900 dark:text-violet-200"
                                                />
                                            </div>
                                            {errors.studentSignature && (
                                                <p className="mt-1 text-xs font-semibold text-red-500">{errors.studentSignature}</p>
                                            )}
                                        </div>

                                        {/* Date: ______________________________________________________________________ */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Date:
                                            </label>
                                            <input
                                                type="date"
                                                value={studentDeclarationDate}
                                                onChange={(e) => setStudentDeclarationDate(e.target.value)}
                                                className="w-full px-3.5 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-base sm:text-sm font-semibold"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 7. PARENT / GUARDIAN CONSENT */}
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-4 sm:p-7 shadow-sm space-y-4">
                                    <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-slate-800 pb-3">
                                        <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black text-sm shrink-0">
                                            7
                                        </div>
                                        <div>
                                            <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-gray-900 dark:text-white">
                                                7. PARENT / GUARDIAN CONSENT
                                            </h3>
                                            <p className="text-[11px] text-gray-500 dark:text-slate-400">
                                                Complete this section where applicable.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Parent / Guardian Full Name:
                                            </label>
                                            <input
                                                type="text"
                                                value={guardianName}
                                                onChange={(e) => setGuardianName(e.target.value)}
                                                placeholder="Parent / Guardian Full Name"
                                                className="w-full px-3.5 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-base sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Phone Number:
                                            </label>
                                            <input
                                                type="tel"
                                                value={guardianPhone}
                                                onChange={(e) => setGuardianPhone(e.target.value)}
                                                placeholder="Parent / Guardian Phone Number"
                                                className="w-full px-3.5 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-base sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Signature:
                                            </label>
                                            <input
                                                type="text"
                                                value={guardianSignature}
                                                onChange={(e) => setGuardianSignature(e.target.value)}
                                                placeholder="Parent / Guardian Signature"
                                                className="w-full px-3.5 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-base sm:text-sm font-serif italic"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                                Date:
                                            </label>
                                            <input
                                                type="date"
                                                value={guardianConsentDate}
                                                onChange={(e) => setGuardianConsentDate(e.target.value)}
                                                className="w-full px-3.5 py-3 min-h-[48px] bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-base sm:text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* =========================================================
                                    8. SCHOOL / ADMINISTRATION USE ONLY (All 7 Official Rows Captured!)
                                   ========================================================= */}
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-violet-200 dark:border-slate-800 p-4 sm:p-7 shadow-sm space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black text-sm shrink-0">
                                                8
                                            </div>
                                            <div>
                                                <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-gray-900 dark:text-white">
                                                    8. SCHOOL / ADMINISTRATION USE ONLY
                                                </h3>
                                                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                                                    Pre-filled for outreach follow-up (can be updated by staff now or in the Admin Dashboard)
                                                </p>
                                            </div>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1">
                                            <ShieldCheck size={12} /> Official Follow-Up Section
                                        </span>
                                    </div>

                                    {/* Official Section 8 Table */}
                                    <div className="border border-gray-300 dark:border-slate-700 rounded-2xl overflow-hidden divide-y divide-gray-200 dark:divide-slate-800 text-xs sm:text-sm">
                                        {/* Row 1: Registration Approved By */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 items-center p-3 bg-gray-50/70 dark:bg-slate-950/40 gap-2">
                                            <span className="font-bold text-gray-700 dark:text-slate-300">Registration Approved By</span>
                                            <div className="sm:col-span-2">
                                                <input
                                                    type="text"
                                                    value={approvedBy}
                                                    onChange={(e) => setApprovedBy(e.target.value)}
                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-base sm:text-xs font-semibold"
                                                />
                                            </div>
                                        </div>

                                        {/* Row 2: Position */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 items-center p-3 gap-2">
                                            <span className="font-bold text-gray-700 dark:text-slate-300">Position</span>
                                            <div className="sm:col-span-2">
                                                <input
                                                    type="text"
                                                    value={approverPosition}
                                                    onChange={(e) => setApproverPosition(e.target.value)}
                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-base sm:text-xs font-semibold"
                                                />
                                            </div>
                                        </div>

                                        {/* Row 3: Assigned Class / Instructor */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 items-center p-3 bg-gray-50/70 dark:bg-slate-950/40 gap-2">
                                            <span className="font-bold text-gray-700 dark:text-slate-300">Assigned Class / Instructor</span>
                                            <div className="sm:col-span-2">
                                                <input
                                                    type="text"
                                                    value={assignedInstructor}
                                                    onChange={(e) => setAssignedInstructor(e.target.value)}
                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-base sm:text-xs font-semibold"
                                                />
                                            </div>
                                        </div>

                                        {/* Row 4: Confirmed Study Schedule */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 items-center p-3 gap-2">
                                            <span className="font-bold text-gray-700 dark:text-slate-300">Confirmed Study Schedule</span>
                                            <div className="sm:col-span-2">
                                                <input
                                                    type="text"
                                                    value={confirmedSchedule}
                                                    onChange={(e) => setConfirmedSchedule(e.target.value)}
                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-base sm:text-xs font-semibold"
                                                />
                                            </div>
                                        </div>

                                        {/* Row 5: Payment Status | ☐ Fully Paid ☐ Partially Paid ☐ Payment Plan ☐ Pending */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 items-start sm:items-center p-3 bg-gray-50/70 dark:bg-slate-950/40 gap-2">
                                            <span className="font-bold text-gray-700 dark:text-slate-300">Payment Status</span>
                                            <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                {ADMIN_PAYMENT_STATUSES.map((st) => (
                                                    <button
                                                        key={st}
                                                        type="button"
                                                        onClick={() => setAdminPaymentStatus(st)}
                                                        className={`py-2.5 px-2 min-h-[42px] rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                                            adminPaymentStatus === st
                                                                ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                                                                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                                                        }`}
                                                    >
                                                        <span>{adminPaymentStatus === st ? '☑' : '☐'}</span>
                                                        <span>{st}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Row 6: Administrator Signature & Date */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 items-center p-3 gap-2">
                                            <span className="font-bold text-gray-700 dark:text-slate-300">Administrator Signature & Date</span>
                                            <div className="sm:col-span-2">
                                                <input
                                                    type="text"
                                                    value={adminSignatureDate}
                                                    onChange={(e) => setAdminSignatureDate(e.target.value)}
                                                    placeholder="Admin Signature & Date"
                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-base sm:text-xs font-semibold"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Remarks: __________________________________________________________________ */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1">
                                            Remarks:
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={adminRemarks}
                                            onChange={(e) => setAdminRemarks(e.target.value)}
                                            placeholder="Official remarks / follow-up notes..."
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-base sm:text-xs font-medium"
                                        />
                                    </div>

                                    {/* Official Document Footer */}
                                    <div className="text-center pt-4 border-t border-gray-200 dark:border-slate-800">
                                        <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">
                                            WELILE SCHOOL OF AI
                                        </p>
                                        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                                            Katabi, Entebbe, Uganda
                                        </p>
                                        <p className="text-xs text-violet-600 dark:text-violet-400 font-bold mt-1">
                                            Empowering students through Artificial Intelligence and digital skills.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Sticky Mobile / Standard Desktop Navigation Bar */}
                        <div className="fixed bottom-0 left-0 right-0 sm:static bg-white/95 dark:bg-slate-900/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-t border-gray-200 dark:border-slate-800 sm:border-0 p-3.5 sm:p-0 z-30">
                            <div className="max-w-3xl mx-auto flex items-center gap-2.5 sm:gap-3">
                                {!singlePageMode && step > 1 && (
                                    <button
                                        type="button"
                                        onClick={handlePrevStep}
                                        className="px-4 py-3.5 min-h-[50px] rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                                    >
                                        <ArrowLeft size={16} /> Back
                                    </button>
                                )}

                                {!singlePageMode && step < 3 ? (
                                    <button
                                        type="button"
                                        onClick={handleNextStep}
                                        className="flex-1 py-3.5 px-5 min-h-[50px] bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold text-sm sm:text-base shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <span>Next: {step === 1 ? 'Schedule & Payment Plan' : 'Commitment & Sign'}</span>
                                        <ArrowRight size={18} />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 py-4 px-5 min-h-[52px] bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 text-white rounded-2xl font-bold text-sm sm:text-base shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader size={18} className="animate-spin" />
                                                Saving Complete 8-Section Registration...
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
