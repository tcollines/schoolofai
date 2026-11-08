import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../src/lib/supabaseClient';
import {
    enqueueOutreachRegistration,
    removeQueuedOutreachRegistration,
    insertOutreachRegistrationLive,
    flushPendingOutreachRegistrations,
    fetchOutreachCampaigns,
    fetchOutreachStaff,
    ensureOfficialCoursesSeeded,
    getOrCreateDeviceAuditInfo,
    generateStudentRegNo,
    OFFICIAL_COURSE_CATALOG,
    getCoursePricing,
    formatUgx,
    sanitizeMoneyInput,
    formatEquivalentUsd,
    sanitizePhoneInput,
    validateCleanPhone,
    cleanPersonName,
    OutreachRegistrationPayload,
    OutreachCampaign,
    OutreachStaffMember,
    DEFAULT_OUTREACH_CAMPAIGNS,
    DEFAULT_OUTREACH_STAFF
} from '../src/lib/outreachSync';
import {
    User,
    BookOpen,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    Sun,
    Moon,
    WifiOff,
    Phone,
    Mail,
    MapPin,
    ShieldCheck,
    Calendar,
    Clock,
    Loader2,
    RotateCcw,
    FileText,
    CreditCard,
    PenTool,
    Check,
    ChevronDown,
    ChevronUp,
    Building2,
    Megaphone,
    UserCheck,
    Fingerprint,
    SlidersHorizontal,
    X,
    Info
} from 'lucide-react';

const AGE_RANGES = ['Under 18', '18-24', '25-34', '35+'];

const CLASS_LEVEL_OPTIONS = [
    'University - Year 1',
    'University - Year 2',
    'University - Year 3',
    'University - Year 4 / Finalist',
    'Recent Graduate',
    'Working Professional',
    'High School (S.4 - S.6)',
    'Diploma / TVET Student',
    'Entrepreneur / Business Owner'
];

const LOCATION_PRESETS = [
    'Nkumba, Entebbe',
    'Katabi, Entebbe',
    'Entebbe Town',
    'Kampala Central',
    'Makerere / Wandegeya',
    'Nakawa / MUBS',
    'Mukono',
    'Wakiso',
    'Other (Specify below)'
];

const LEVELS = [
    { value: 'Beginner', desc: 'New to AI tools & workflows' },
    { value: 'Intermediate', desc: 'Some experience with AI / tech' },
    { value: 'Advanced', desc: 'Building production systems' }
];

const MODES = [
    { value: 'Hybrid', label: 'Hybrid', desc: 'Katabi Campus + Online' },
    { value: 'Physical', label: 'Physical', desc: 'In-Person at Katabi' },
    { value: 'Online', label: 'Online', desc: '100% Live Virtual' }
];

const STUDY_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TIME_SLOTS = [
    { label: 'Morning (9AM – 11AM)', value: '09:00 AM – 11:00 AM (Morning)' },
    { label: 'Mid-Day (11AM – 1PM)', value: '11:00 AM – 01:00 PM (Mid-Day)' },
    { label: 'Afternoon (2PM – 4PM)', value: '02:00 PM – 04:00 PM (Afternoon)' },
    { label: 'Late Afternoon (4PM – 6PM)', value: '04:00 PM – 06:00 PM (Late Afternoon)' },
    { label: 'Evening (6PM – 8PM)', value: '06:00 PM – 08:00 PM (Evening)' },
    { label: 'Weekend Intensive (Sat/Sun)', value: '10:00 AM – 02:00 PM (Weekend Intensive)' }
];

const SESSION_HOURS_OPTIONS = ['1.5 Hours', '2 Hours', '3 Hours', '4 Hours (Weekend)'];
const SESSIONS_PER_WEEK_OPTIONS = ['2 Sessions / Week', '3 Sessions / Week', '4 Sessions / Week', '5 Sessions / Week', 'Weekend Only (1-2x)'];

const PAYMENT_PLANS = [
    { value: 'Monthly', label: 'Monthly Plan', desc: 'Pay per month after confirmation' },
    { value: 'Weekly', label: 'Weekly Plan', desc: 'Flexible weekly installments' },
    { value: 'Full', label: 'Full Upfront', desc: 'Single payment on confirmation' },
    { value: 'Other', label: 'Custom Plan', desc: 'Discuss with admissions team' }
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

const DEFAULT_COURSES = [
    ...OFFICIAL_COURSE_CATALOG.map(c => c.title),
    'Not sure yet — Help me choose at follow-up'
];

const MODE_DESCRIPTIONS: Record<string, string> = {
    Physical: 'In-Person Campus Classes (Katabi, Entebbe)',
    Online: 'Online — Live Interactive Virtual Sessions',
    Hybrid: 'Hybrid — Katabi Campus Lab + Online Sessions'
};

const ACTIVE_STAFF_SESSION_KEY = 'welile_active_outreach_staff_v1';

const OutreachRegistration: React.FC = () => {
    const [searchParams] = useSearchParams();
    const initialEventFromUrl = searchParams.get('event') || searchParams.get('campaign') || '';
    const initialStaffFromUrl = searchParams.get('staff') || searchParams.get('mobilizer') || '';

    const [isDark, setIsDark] = useState(true);
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Collapsible UI disclosures for a clean Stripe/Linear layout
    const [showBoothSettingsModal, setShowBoothSettingsModal] = useState(false);
    const [showScheduleExtras, setShowScheduleExtras] = useState(false);
    const [showInitialDepositBox, setShowInitialDepositBox] = useState(false);
    const [showCommitmentsAccordion, setShowCommitmentsAccordion] = useState(false);

    const [courseOptions, setCourseOptions] = useState<string[]>(DEFAULT_COURSES);
    const [campaigns, setCampaigns] = useState<OutreachCampaign[]>(DEFAULT_OUTREACH_CAMPAIGNS);
    const [staffRoster, setStaffRoster] = useState<OutreachStaffMember[]>(DEFAULT_OUTREACH_STAFF);

    // Device Audit Info
    const [deviceAudit] = useState(() => getOrCreateDeviceAuditInfo());

    // Staff / Mobilizer Attribution State
    const [registrationMode, setRegistrationMode] = useState<'Staff Assisted (Booth/Field)' | 'Student Self-Registration'>(() => {
        try {
            const saved = localStorage.getItem(ACTIVE_STAFF_SESSION_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.mode) return parsed.mode;
            }
        } catch {
            // ignore
        }
        return 'Staff Assisted (Booth/Field)';
    });

    const [registeredByStaff, setRegisteredByStaff] = useState<string>(() => {
        if (initialStaffFromUrl) return initialStaffFromUrl;
        try {
            const saved = localStorage.getItem(ACTIVE_STAFF_SESSION_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.staffName) return parsed.staffName;
            }
        } catch {
            // ignore
        }
        return DEFAULT_OUTREACH_STAFF[0].name;
    });
    const [customStaffName, setCustomStaffName] = useState('');

    // HEADER METADATA
    const [registrationDate, setRegistrationDate] = useState(() => new Date().toISOString().split('T')[0]);
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
    const [customLocation, setCustomLocation] = useState('');
    const [guardianName, setGuardianName] = useState('');
    const [guardianPhone, setGuardianPhone] = useState('');

    // 2. COURSE & PROGRAMME INFORMATION
    const [courseInterest, setCourseInterest] = useState('Advanced Vibe Coding');
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

    // 4. PROVISIONAL FEES & PAYMENT PREFERENCES (Confirmed later at follow-up)
    const [totalCourseFee, setTotalCourseFee] = useState<number>(100000);
    const [registrationFee, setRegistrationFee] = useState<string>('UGX – Not Applicable');
    const [amountPaid, setAmountPaid] = useState<number>(0);
    const [paymentPlan, setPaymentPlan] = useState<string>('Monthly');
    const [paymentPlanOther, setPaymentPlanOther] = useState<string>('');
    const [agreedPaymentAmount, setAgreedPaymentAmount] = useState<number>(100000);
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
    const [studentDeclarationDate, setStudentDeclarationDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [consentContact, setConsentContact] = useState(true);

    // 7. PARENT / GUARDIAN CONSENT
    const [guardianSignature, setGuardianSignature] = useState('');
    const [guardianConsentDate, setGuardianConsentDate] = useState(() => new Date().toISOString().split('T')[0]);

    // 8. SCHOOL / ADMINISTRATION USE ONLY (Auto-populated behind the scenes for audit)
    const [approvedBy, setApprovedBy] = useState('Timothy Christian Waniaye (Outreach Capture)');
    const [approverPosition, setApproverPosition] = useState('COO');
    const [assignedInstructor, setAssignedInstructor] = useState('To Be Assigned Upon Confirmation');
    const [confirmedSchedule, setConfirmedSchedule] = useState('Pending Confirmation • Mon, Wed, Fri (04:00 PM – 06:00 PM)');
    const [adminPaymentStatus, setAdminPaymentStatus] = useState<string>('Pending');
    const [adminSignatureDate, setAdminSignatureDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [adminRemarks, setAdminRemarks] = useState('Pre-registered at Outreach — Follow up to confirm study readiness & schedule.');

    // Honeypot
    const [honeypotWebsite, setHoneypotWebsite] = useState('');

    // Validation & submit states
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedRecord, setSubmittedRecord] = useState<OutreachRegistrationPayload | null>(null);
    const [submittedMode, setSubmittedMode] = useState<'online' | 'offline' | null>(null);

    const activeCoursePricing = getCoursePricing(courseInterest);
    const outstandingBalance = Math.max(0, (Number(totalCourseFee) || activeCoursePricing.ugxPerMonth) - (Number(amountPaid) || 0));

    const phoneValidation = validateCleanPhone(phone);
    const guardianPhoneValidation = guardianPhone.trim() ? validateCleanPhone(guardianPhone) : null;

    const effectiveStaffName =
        registrationMode === 'Student Self-Registration'
            ? 'Self-Registered (Student Direct)'
            : registeredByStaff === 'CUSTOM'
            ? (customStaffName.trim() || 'Outreach Staff Member')
            : registeredByStaff;

    const matchedStaffObj = staffRoster.find(s => s.name === effectiveStaffName);

    // Persist staff selection on phone so staff don't have to re-select between students
    useEffect(() => {
        try {
            localStorage.setItem(
                ACTIVE_STAFF_SESSION_KEY,
                JSON.stringify({
                    mode: registrationMode,
                    staffName: registeredByStaff === 'CUSTOM' ? customStaffName : registeredByStaff
                })
            );
        } catch {
            // ignore
        }
    }, [registrationMode, registeredByStaff, customStaffName]);

    // Sync Section 8 Approved By & Position when Staff Registrar changes
    useEffect(() => {
        if (registrationMode === 'Student Self-Registration') {
            setApprovedBy('Self-Registered — Pending Staff Follow-Up');
            setApproverPosition('Admissions Office — Katabi Campus');
        } else {
            setApprovedBy(`${effectiveStaffName} (Outreach Capture)`);
            setApproverPosition(matchedStaffObj?.role || 'Outreach Mobilizer');
        }
    }, [effectiveStaffName, registrationMode, matchedStaffObj]);

    const handleCourseSelect = (selectedTitle: string) => {
        setCourseInterest(selectedTitle);
        const pricing = getCoursePricing(selectedTitle);
        setTotalCourseFee(pricing.ugxPerMonth);
        if (paymentPlan === 'Weekly') {
            setAgreedPaymentAmount(pricing.ugxWeekly);
        } else {
            setAgreedPaymentAmount(pricing.ugxPerMonth);
        }
        if (amountPaid > pricing.ugxPerMonth) {
            setAmountPaid(pricing.ugxPerMonth);
        }
        if (errors.courseInterest) {
            setErrors(prev => ({ ...prev, courseInterest: '' }));
        }
    };

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

    useEffect(() => {
        const daysStr = preferredStudyDays.length > 0 ? preferredStudyDays.join(', ') : 'Flexible';
        setConfirmedSchedule(`Pending Confirmation • ${daysStr} (${chosenStudyTime})`);
    }, [preferredStudyDays, chosenStudyTime]);

    useEffect(() => {
        if (amountPaid >= totalCourseFee && totalCourseFee > 0) {
            setAdminPaymentStatus('Fully Paid');
        } else if (amountPaid > 0) {
            setAdminPaymentStatus('Partially Paid');
        } else {
            setAdminPaymentStatus('Pending');
        }
    }, [amountPaid, totalCourseFee]);

    useEffect(() => {
        setModeOfStudyText(MODE_DESCRIPTIONS[modePreference] || modePreference);
    }, [modePreference]);

    useEffect(() => {
        if (!expectedStartDate) return;
        const start = new Date(expectedStartDate);
        if (!isNaN(start.getTime())) {
            const completion = new Date(start);
            completion.setDate(start.getDate() + 56);
            setExpectedCompletionDate(completion.toISOString().split('T')[0]);
            setNextPaymentDate(expectedStartDate);

            const due = new Date(start);
            due.setDate(start.getDate() + 30);
            setPaymentDueDate(due.toISOString().split('T')[0]);
        }
    }, [expectedStartDate]);

    useEffect(() => {
        const checkTheme = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        checkTheme();
        window.addEventListener('theme-change', checkTheme);
        return () => window.removeEventListener('theme-change', checkTheme);
    }, []);

    const toggleTheme = () => {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
        window.dispatchEvent(new Event('theme-change'));
    };

    // Load Outreach Campaigns, Staff Roster & Live Courses
    useEffect(() => {
        const loadData = async () => {
            const [loadedCampaigns, loadedStaff] = await Promise.all([
                fetchOutreachCampaigns(),
                fetchOutreachStaff()
            ]);

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

            const activeStaff = loadedStaff.filter(s => s.isActive !== false);
            if (activeStaff.length > 0) {
                setStaffRoster(activeStaff);
            }

            try {
                await ensureOfficialCoursesSeeded();
                const { data: coursesData } = await supabase
                    .from('courses')
                    .select('title, is_draft, category, sections');

                if (coursesData && coursesData.length > 0) {
                    const configRow = coursesData.find((c: any) => c.category === '__OUTREACH_CONFIG__');
                    const ps = configRow?.sections?.portal_settings;
                    if (ps && typeof ps === 'object') {
                        localStorage.setItem('welile_outreach_portal_settings_v1', JSON.stringify(ps));
                        if (!initialEventFromUrl && ps.active_campaign_name) {
                            setOutreachEvent(String(ps.active_campaign_name));
                        }
                        if (!initialStaffFromUrl && ps.default_registrar_name) {
                            setRegisteredByStaff(String(ps.default_registrar_name));
                        }
                        if (Array.isArray(ps.active_staff_ids) && ps.active_staff_ids.length > 0) {
                            const activeSet = new Set(ps.active_staff_ids.map(String));
                            const filteredRoster = activeStaff.filter(s => activeSet.has(s.id) || s.id === 'stf-self');
                            if (filteredRoster.length > 0) {
                                setStaffRoster(filteredRoster);
                            }
                        }
                    }

                    const dbTitles = coursesData
                        .filter((c: any) => !c.is_draft && c.title && !String(c.category || '').startsWith('__OUTREACH_'))
                        .map((c: any) => String(c.title).trim())
                        .filter(Boolean);
                    const merged = Array.from(new Set([...DEFAULT_COURSES, ...dbTitles]));
                    setCourseOptions(merged);
                }
            } catch {
                // use default courses when offline
            }
        };
        loadData();
    }, [initialEventFromUrl, initialStaffFromUrl]);

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
        const pricing = getCoursePricing(courseInterest);
        if (planValue === 'Weekly') {
            setAgreedPaymentAmount(pricing.ugxWeekly);
        } else {
            setAgreedPaymentAmount(pricing.ugxPerMonth);
        }
    };

    const isGuardianRequired =
        ageRange === 'Under 18' ||
        classLevelYear.includes('High School');

    const validateStep1 = (): boolean => {
        const nextErrors: Record<string, string> = {};
        const cleanedName = cleanPersonName(fullName);
        if (!cleanedName || cleanedName.length < 3 || /[0-9]/.test(cleanedName)) {
            nextErrors.fullName = 'Please enter a valid Student Full Name (letters only, at least 3 characters).';
        }

        const phoneCheck = validateCleanPhone(phone);
        if (!phoneCheck.valid) {
            nextErrors.phone = phoneCheck.message;
        }

        if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
            nextErrors.email = 'Please enter a valid Email Address (e.g. name@gmail.com) or leave blank.';
        }

        if (isGuardianRequired) {
            const cleanedGName = cleanPersonName(guardianName);
            if (!cleanedGName || cleanedGName.length < 3 || /[0-9]/.test(cleanedGName)) {
                nextErrors.guardianName = 'Parent / Guardian Name is required for students under 18 / High School.';
            }
            const gPhoneCheck = validateCleanPhone(guardianPhone);
            if (!gPhoneCheck.valid) {
                nextErrors.guardianPhone = `Parent / Guardian Phone: ${gPhoneCheck.message}`;
            }
        } else if (guardianPhone.trim()) {
            const gPhoneCheck = validateCleanPhone(guardianPhone);
            if (!gPhoneCheck.valid) {
                nextErrors.guardianPhone = `Parent / Guardian Phone: ${gPhoneCheck.message}`;
            }
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const validateStep2 = (): boolean => {
        const nextErrors: Record<string, string> = {};
        if (!courseInterest) {
            nextErrors.courseInterest = 'Please choose a Course / Programme.';
        }
        if (preferredStudyDays.length === 0) {
            nextErrors.preferredStudyDays = 'Please tap at least one Preferred Study Day.';
        }
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const validateStep3 = (): boolean => {
        const nextErrors: Record<string, string> = {};
        if (Number(amountPaid) < 0 || Number(amountPaid) > Number(totalCourseFee)) {
            nextErrors.amountPaid = `Deposit cannot exceed the monthly fee (UGX ${formatUgx(totalCourseFee)}).`;
        }
        if (!consentContact) {
            nextErrors.consentContact = 'Please agree to be contacted so we can follow up to confirm your enrollment.';
        }
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleNext = () => {
        if (step === 1 && validateStep1()) {
            setFullName(cleanPersonName(fullName));
            if (guardianName.trim()) setGuardianName(cleanPersonName(guardianName));
            setStep(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (step === 2 && validateStep2()) {
            setStep(3);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBack = () => {
        setErrors({});
        if (step === 2) setStep(1);
        if (step === 3) setStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (honeypotWebsite.trim() !== '') {
            return;
        }

        if (!validateStep1()) {
            setStep(1);
            return;
        }
        if (!validateStep2()) {
            setStep(2);
            return;
        }
        if (!validateStep3()) {
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        const resolvedLocation =
            location === 'Other (Specify below)'
                ? customLocation.trim() || 'Entebbe / Kampala'
                : location;

        const resolvedPaymentPlan =
            paymentPlan === 'Other' && paymentPlanOther.trim()
                ? `Other (${paymentPlanOther.trim()})`
                : paymentPlan;

        const resolvedPaymentMethod =
            paymentMethod === 'Other' && paymentMethodOther.trim()
                ? `Other (${paymentMethodOther.trim()})`
                : paymentMethod;

        const cleanedStudentName = cleanPersonName(fullName);
        const normalizedPhone = validateCleanPhone(phone).normalized || phone.trim();
        const normalizedGuardianPhone = guardianPhone.trim()
            ? (validateCleanPhone(guardianPhone).normalized || guardianPhone.trim())
            : null;
        const pricing = getCoursePricing(courseInterest);

        const nowIso = new Date().toISOString();
        const initialAuditEntry = {
            timestamp: nowIso,
            actor: effectiveStaffName,
            role: matchedStaffObj?.role || (registrationMode === 'Student Self-Registration' ? 'Student' : 'Outreach Staff'),
            action: 'REGISTERED_STUDENT',
            device_id: deviceAudit.deviceId,
            details: `Pre-registered ${cleanedStudentName} (${normalizedPhone}) for ${courseInterest} (${pricing.displayFee}) at ${outreachEvent} via ${deviceAudit.deviceSummary}`
        };

        const payload: OutreachRegistrationPayload = {
            registration_date: registrationDate,
            student_reg_no: studentRegNo,

            // 1. Student Information
            full_name: cleanedStudentName,
            email: email.trim().toLowerCase() || null,
            phone: normalizedPhone,
            class_level_year: classLevelYear,
            age_range: ageRange,
            guardian_name: guardianName.trim() ? cleanPersonName(guardianName) : null,
            guardian_phone: normalizedGuardianPhone,
            location: resolvedLocation,

            // 2. Course & Programme Information
            course_interest: courseInterest,
            course_fee_usd: pricing.usdPerMonth,
            course_fee_display: pricing.displayFee,
            level,
            mode_of_study_text: modeOfStudyText,
            mode_preference: modePreference,
            expected_start_date: expectedStartDate,
            expected_completion_date: expectedCompletionDate,

            // 3. Study Schedule
            preferred_study_days: preferredStudyDays,
            preferred_time_slot: chosenStudyTime,
            study_hours_per_session: studyHoursPerSession,
            sessions_per_week: sessionsPerWeek,
            alternative_study_time: alternativeStudyTime,

            // 4. Fees & Payment Agreement
            total_course_fee: Number(totalCourseFee) || pricing.ugxPerMonth,
            registration_fee: registrationFee,
            amount_paid: Number(amountPaid) || 0,
            outstanding_balance: outstandingBalance,
            payment_plan: resolvedPaymentPlan,
            agreed_payment_amount: Number(agreedPaymentAmount) || pricing.ugxPerMonth,
            next_payment_date: nextPaymentDate,
            payment_due_date: paymentDueDate,
            payment_method: resolvedPaymentMethod,
            payment_reference: paymentReference.trim() || 'To be confirmed at follow-up',

            // 5, 6, 7. Commitment, Declaration & Guardian Consent
            commitments_accepted: true,
            commitments_list: OFFICIAL_COMMITMENTS.filter((_, i) => checkedCommitments[i]),
            student_signature: cleanPersonName(studentSignature.trim() || cleanedStudentName),
            student_declaration_date: studentDeclarationDate,
            guardian_signature: guardianSignature.trim() ? cleanPersonName(guardianSignature) : null,
            guardian_consent_date: guardianName.trim() ? guardianConsentDate : null,
            consent_contact: true,

            // Outreach Attribution & Staff Audit
            how_heard: howHeard,
            outreach_event: outreachEvent.trim() || 'Nkumba University Outreach (Fri, 6th Nov 2026)',
            registered_by_staff: effectiveStaffName,
            registered_by_staff_id: matchedStaffObj?.staffCode || 'CUSTOM-STAFF',
            registered_by_role: matchedStaffObj?.role || (registrationMode === 'Student Self-Registration' ? 'Student' : 'Outreach Mobilizer'),
            registration_mode: registrationMode,
            device_audit_id: deviceAudit.deviceId,
            device_info: deviceAudit.deviceSummary,
            audit_trail: [initialAuditEntry],

            // 8. School / Administration Use Only
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

        const queuedRecord = enqueueOutreachRegistration(payload);

        try {
            await insertOutreachRegistrationLive(queuedRecord);
            if (queuedRecord.id) {
                removeQueuedOutreachRegistration(queuedRecord.id);
            }
            flushPendingOutreachRegistrations();
            setSubmittedRecord(queuedRecord);
            setSubmittedMode('online');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.warn('Offline or network error during outreach submit, queued locally:', err);
            setSubmittedRecord(queuedRecord);
            setSubmittedMode('offline');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRegisterAnother = () => {
        setFullName('');
        setPhone('');
        setEmail('');
        setGuardianName('');
        setGuardianPhone('');
        setStudentSignature('');
        setDeclarationFullName('');
        setGuardianSignature('');
        setAmountPaid(0);
        setShowInitialDepositBox(false);
        setPaymentReference('To be confirmed at follow-up');
        setStudentRegNo(generateStudentRegNo());
        setErrors({});
        setSubmittedRecord(null);
        setSubmittedMode(null);
        setStep(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 flex flex-col justify-between">
            {/* SLEEK MINIMALIST TOP BAR (Stripe / Luma Inspired) */}
            <header className="sticky top-0 z-40 bg-white/85 dark:bg-[#0B0F17]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
                    <Link to="/" className="flex items-center gap-2.5 shrink-0">
                        <img
                            src={isDark ? '/logo-white.svg' : '/logo.svg'}
                            alt="Welile School of AI"
                            className="h-8 w-auto object-contain"
                        />
                        <div className="hidden sm:block border-l border-slate-200 dark:border-slate-800 pl-2.5">
                            <span className="text-xs font-bold tracking-tight text-slate-900 dark:text-white block leading-none">
                                Welile School of AI
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                Katabi, Entebbe • Admissions
                            </span>
                        </div>
                    </Link>

                    {/* Compact Interactive Booth / Event Pill */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowBoothSettingsModal(true)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer max-w-[230px] sm:max-w-md"
                            title="Configure Outreach Event & Staff Attribution"
                        >
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                            <span className="truncate font-bold text-violet-600 dark:text-violet-400">
                                {outreachEvent.split('(')[0].trim()}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="truncate text-slate-600 dark:text-slate-300">
                                {registrationMode === 'Student Self-Registration' ? 'Self-Service' : effectiveStaffName}
                            </span>
                            <SlidersHorizontal size={12} className="text-slate-400 shrink-0 ml-0.5" />
                        </button>

                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="p-2 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            aria-label="Toggle theme"
                        >
                            {isDark ? <Sun size={17} /> : <Moon size={17} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
                {submittedRecord ? (
                    /* =========================================================
                       DIGITAL PROVISIONAL PASS (LUMA / STRIPE SUCCESS SCREEN)
                       ========================================================= */
                    <div className="max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-300">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden">
                            {/* Top Status Banner */}
                            <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-6 text-white">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-[11px] font-bold uppercase tracking-wider">
                                        {submittedMode === 'online' ? (
                                            <>
                                                <CheckCircle2 size={13} className="text-lime-300" />
                                                Saved to Live Database
                                            </>
                                        ) : (
                                            <>
                                                <WifiOff size={13} className="text-amber-300" />
                                                Queued Offline — Auto-Syncs
                                            </>
                                        )}
                                    </span>
                                    <span className="font-mono text-xs font-bold text-violet-100">
                                        Ref: {submittedRecord.student_reg_no}
                                    </span>
                                </div>
                                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                                    Interest & Schedule Recorded!
                                </h1>
                                <p className="text-xs sm:text-sm text-violet-100 mt-1">
                                    Thank you, <span className="font-bold text-white">{submittedRecord.full_name}</span>. Your provisional seat preference has been logged.
                                </p>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Follow-up Context Callout */}
                                <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 flex items-start gap-3">
                                    <Info size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                    <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                                        <span className="font-bold block mb-0.5">What happens next? (Confirmation Follow-Up)</span>
                                        This outreach registration reserves your provisional preference. Our admissions team will contact you on <span className="font-bold">{submittedRecord.phone}</span> to confirm when you are ready to start classes and finalize your enrollment.
                                    </div>
                                </div>

                                {/* Summary Grid */}
                                <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 text-xs">
                                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70 dark:border-slate-800">
                                        <span className="text-slate-500 dark:text-slate-400">Selected Programme</span>
                                        <span className="font-bold text-violet-600 dark:text-violet-400">
                                            {submittedRecord.course_interest}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70 dark:border-slate-800">
                                        <span className="text-slate-500 dark:text-slate-400">Monthly Tuition Rate</span>
                                        <span className="font-bold text-slate-900 dark:text-white">
                                            {submittedRecord.course_fee_display || '$25 | 100,000 UGX / month'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70 dark:border-slate-800">
                                        <span className="text-slate-500 dark:text-slate-400">Preferred Schedule</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                                            {submittedRecord.mode_preference} • {(submittedRecord.preferred_study_days || []).join(', ')}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70 dark:border-slate-800">
                                        <span className="text-slate-500 dark:text-slate-400">Preferred Time Slot</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                                            {submittedRecord.preferred_time_slot}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">Recorded By (Audit)</span>
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                            {submittedRecord.registered_by_staff} ({submittedRecord.registered_by_role})
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={handleRegisterAnother}
                                        className="flex-1 py-3.5 px-5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-lg shadow-violet-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                                    >
                                        <RotateCcw size={16} />
                                        Register Next Person
                                    </button>
                                    <Link
                                        to="/"
                                        className="py-3.5 px-5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm text-center transition-colors"
                                    >
                                        Back to Home
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* =========================================================
                       STRIPE / LINEAR 2-COLUMN SPLIT ON DESKTOP, CLEAN WIZARD ON MOBILE
                       ========================================================= */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* LEFT COLUMN: STICKY PROGRAMME SUMMARY & CONTEXT (Desktop) */}
                        <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-5 order-2 lg:order-1">
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm space-y-5">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-950/60 border border-violet-200/70 dark:border-violet-800/60 text-violet-700 dark:text-violet-300 text-[11px] font-bold mb-3">
                                        <Sparkles size={12} />
                                        Outreach Pre-Registration
                                    </div>
                                    <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                        Reserve Your AI Study Slot
                                    </h1>
                                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                                        Register your interest and preferred study schedule today. <strong className="text-slate-700 dark:text-slate-200">No upfront payment is required right now</strong>—our team will follow up with you to confirm your seat before classes begin.
                                    </p>
                                </div>

                                {/* Live Selected Course Card */}
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                                Selected Programme
                                            </span>
                                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                                                {courseInterest}
                                            </h3>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-lg bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 text-xs font-extrabold shrink-0">
                                            ${activeCoursePricing.usdPerMonth}/mo
                                        </span>
                                    </div>

                                    <div className="flex items-baseline justify-between pt-2 border-t border-slate-200/70 dark:border-slate-800/80">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">Monthly Tuition</span>
                                        <span className="text-sm font-black text-slate-900 dark:text-white">
                                            UGX {formatUgx(activeCoursePricing.ugxPerMonth)} <span className="text-xs font-normal text-slate-400">/ month</span>
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                                            <span className="text-slate-400 block text-[10px]">Study Mode</span>
                                            <span className="font-bold text-slate-700 dark:text-slate-200">{modePreference} ({level})</span>
                                        </div>
                                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                                            <span className="text-slate-400 block text-[10px]">Preferred Days</span>
                                            <span className="font-bold text-slate-700 dark:text-slate-200 truncate block">
                                                {preferredStudyDays.join(', ') || 'Flexible'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* All 4 Official Courses Reference List */}
                                <div className="space-y-2">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Official Courses & Monthly Rates
                                    </div>
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                                        {OFFICIAL_COURSE_CATALOG.map((c, i) => {
                                            const active = courseInterest === c.title;
                                            return (
                                                <button
                                                    key={c.title}
                                                    type="button"
                                                    onClick={() => handleCourseSelect(c.title)}
                                                    className={`w-full py-2.5 px-2.5 flex items-center justify-between text-left rounded-xl transition-colors cursor-pointer ${
                                                        active
                                                            ? 'bg-violet-50/80 dark:bg-violet-950/40 font-bold text-violet-700 dark:text-violet-300'
                                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                                                    }`}
                                                >
                                                    <span className="truncate pr-2">
                                                        {i + 1}. {c.title}
                                                    </span>
                                                    <span className="font-mono text-[11px] font-semibold shrink-0">
                                                        ${c.usdPerMonth} | {formatUgx(c.ugxPerMonth)} UGX
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Subtle Attribution Footer inside Summary Card */}
                                <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                                    <span className="flex items-center gap-1.5">
                                        <UserCheck size={13} className="text-emerald-500" />
                                        Registrar: <strong className="text-slate-600 dark:text-slate-300">{effectiveStaffName}</strong>
                                    </span>
                                    <span className="font-mono">{studentRegNo}</span>
                                </div>
                            </div>
                        </aside>

                        {/* RIGHT COLUMN: FOCUSED 3-STEP FORM CARD */}
                        <div className="lg:col-span-7 order-1 lg:order-2">
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
                                {/* Clean Step Header & Linear Progress Bar */}
                                <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            {[
                                                { num: 1, label: '1. Your Details' },
                                                { num: 2, label: '2. Course & Schedule' },
                                                { num: 3, label: '3. Confirm Interest' }
                                            ].map(s => {
                                                const isCurrent = step === s.num;
                                                const isDone = step > s.num;
                                                return (
                                                    <button
                                                        key={s.num}
                                                        type="button"
                                                        onClick={() => {
                                                            if (s.num < step) setStep(s.num as 1 | 2 | 3);
                                                            else if (s.num === 2 && validateStep1()) setStep(2);
                                                            else if (s.num === 3 && validateStep1() && validateStep2()) setStep(3);
                                                        }}
                                                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                                            isCurrent
                                                                ? 'bg-violet-600 text-white shadow-sm'
                                                                : isDone
                                                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                                                                : 'bg-slate-100 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400'
                                                        }`}
                                                    >
                                                        {isDone && <Check size={12} />}
                                                        <span>{s.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                                            Step {step} of 3
                                        </span>
                                    </div>

                                    {/* Thin Linear Progress Bar */}
                                    <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-violet-600 transition-all duration-300 rounded-full"
                                            style={{ width: `${(step / 3) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} noValidate className="p-6 sm:p-8 space-y-6">
                                    {/* Honeypot anti-spam */}
                                    <div className="hidden" aria-hidden="true">
                                        <input
                                            type="text"
                                            name="website_url_hp"
                                            tabIndex={-1}
                                            autoComplete="off"
                                            value={honeypotWebsite}
                                            onChange={(e) => setHoneypotWebsite(e.target.value)}
                                        />
                                    </div>

                                    {/* =========================================================
                                       STEP 1: STUDENT PROFILE & CONTACT
                                       ========================================================= */}
                                    {step === 1 && (
                                        <div className="space-y-5 animate-in fade-in duration-200">
                                            <div>
                                                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                                                    Student Contact Information
                                                </h2>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                    We will use these details to follow up and confirm if you will join the upcoming cohort.
                                                </p>
                                            </div>

                                            {/* Full Name */}
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                                    Full Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={fullName}
                                                    onChange={(e) => {
                                                        setFullName(e.target.value.replace(/[0-9]/g, ''));
                                                        if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
                                                    }}
                                                    onBlur={() => {
                                                        if (fullName.trim()) setFullName(cleanPersonName(fullName));
                                                    }}
                                                    placeholder="e.g. Muganyizi Hosea"
                                                    className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border ${
                                                        errors.fullName
                                                            ? 'border-red-500 focus:ring-red-500/20'
                                                            : 'border-slate-200 dark:border-slate-800 focus:border-violet-500'
                                                    } text-sm font-medium focus:outline-none focus:ring-4 focus:ring-violet-500/10 transition-all`}
                                                />
                                                {errors.fullName && (
                                                    <p className="text-xs text-red-500 font-medium mt-1.5">{errors.fullName}</p>
                                                )}
                                            </div>

                                            {/* Phone & Email */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                            Phone / WhatsApp <span className="text-red-500">*</span>
                                                        </label>
                                                        <span className={`text-[10px] font-mono font-semibold ${
                                                            phoneValidation.valid
                                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                                : 'text-slate-400'
                                                        }`}>
                                                            {phoneValidation.formatLabel} {phoneValidation.valid ? '✓' : ''}
                                                        </span>
                                                    </div>
                                                    <input
                                                        type="tel"
                                                        inputMode="tel"
                                                        maxLength={phone.startsWith('+') ? 13 : 10}
                                                        value={phone}
                                                        onChange={(e) => {
                                                            setPhone(sanitizePhoneInput(e.target.value));
                                                            if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                                                        }}
                                                        placeholder="0772123456"
                                                        className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border ${
                                                            errors.phone
                                                                ? 'border-red-500'
                                                                : phoneValidation.valid
                                                                ? 'border-emerald-500/70'
                                                                : 'border-slate-200 dark:border-slate-800 focus:border-violet-500'
                                                        } text-sm font-medium focus:outline-none focus:ring-4 focus:ring-violet-500/10 transition-all`}
                                                    />
                                                    {errors.phone && (
                                                        <p className="text-xs text-red-500 font-medium mt-1.5">{errors.phone}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                                        Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => {
                                                            setEmail(e.target.value.trim());
                                                            if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                                                        }}
                                                        placeholder="you@example.com"
                                                        className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border ${
                                                            errors.email
                                                                ? 'border-red-500'
                                                                : 'border-slate-200 dark:border-slate-800 focus:border-violet-500'
                                                        } text-sm font-medium focus:outline-none focus:ring-4 focus:ring-violet-500/10 transition-all`}
                                                    />
                                                    {errors.email && (
                                                        <p className="text-xs text-red-500 font-medium mt-1.5">{errors.email}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Academic Level & Age Range */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                                        Current Academic / Career Status
                                                    </label>
                                                    <select
                                                        value={classLevelYear}
                                                        onChange={(e) => setClassLevelYear(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium focus:outline-none focus:border-violet-500"
                                                    >
                                                        {CLASS_LEVEL_OPTIONS.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                                        Age Bracket
                                                    </label>
                                                    <div className="grid grid-cols-4 gap-1.5">
                                                        {AGE_RANGES.map(age => (
                                                            <button
                                                                key={age}
                                                                type="button"
                                                                onClick={() => setAgeRange(age)}
                                                                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                                                    ageRange === age
                                                                        ? 'bg-violet-600 text-white border-violet-600'
                                                                        : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-violet-400'
                                                                }`}
                                                            >
                                                                {age}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Location / Campus Area */}
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                                    Location / Campus Area
                                                </label>
                                                <select
                                                    value={location}
                                                    onChange={(e) => setLocation(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium focus:outline-none focus:border-violet-500"
                                                >
                                                    {LOCATION_PRESETS.map(loc => (
                                                        <option key={loc} value={loc}>{loc}</option>
                                                    ))}
                                                </select>
                                                {location === 'Other (Specify below)' && (
                                                    <input
                                                        type="text"
                                                        value={customLocation}
                                                        onChange={(e) => setCustomLocation(e.target.value)}
                                                        placeholder="Enter your city, campus, or area"
                                                        className="w-full mt-2.5 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium focus:outline-none focus:border-violet-500"
                                                    />
                                                )}
                                            </div>

                                            {/* Conditional Parent / Guardian Section (Cleanly revealed when Under 18 or High School, or optional toggle) */}
                                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                        Parent / Guardian / Next of Kin Contact {isGuardianRequired ? <span className="text-red-500">*</span> : <span className="text-slate-400 font-normal">(Optional)</span>}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <input
                                                            type="text"
                                                            value={guardianName}
                                                            onChange={(e) => {
                                                                setGuardianName(e.target.value.replace(/[0-9]/g, ''));
                                                                if (errors.guardianName) setErrors(prev => ({ ...prev, guardianName: '' }));
                                                            }}
                                                            placeholder={isGuardianRequired ? 'Guardian Full Name *' : 'Guardian / Next of Kin Name (Optional)'}
                                                            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-none focus:border-violet-500"
                                                        />
                                                        {errors.guardianName && (
                                                            <p className="text-xs text-red-500 mt-1">{errors.guardianName}</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <input
                                                            type="tel"
                                                            inputMode="tel"
                                                            maxLength={guardianPhone.startsWith('+') ? 13 : 10}
                                                            value={guardianPhone}
                                                            onChange={(e) => {
                                                                setGuardianPhone(sanitizePhoneInput(e.target.value));
                                                                if (errors.guardianPhone) setErrors(prev => ({ ...prev, guardianPhone: '' }));
                                                            }}
                                                            placeholder={isGuardianRequired ? 'Guardian Phone (07XXXXXXXX) *' : 'Guardian Phone (Optional)'}
                                                            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-none focus:border-violet-500"
                                                        />
                                                        {errors.guardianPhone && (
                                                            <p className="text-xs text-red-500 mt-1">{errors.guardianPhone}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-3 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={handleNext}
                                                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-lg shadow-violet-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                                                >
                                                    Continue to Course & Schedule
                                                    <ArrowRight size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* =========================================================
                                       STEP 2: PROGRAMME & PREFERRED SCHEDULE
                                       ========================================================= */}
                                    {step === 2 && (
                                        <div className="space-y-6 animate-in fade-in duration-200">
                                            <div>
                                                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                                                    Programme & Preferred Study Schedule
                                                </h2>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                    Select the AI programme you want to study and your preferred days/times. You can adjust this when we call to confirm.
                                                </p>
                                            </div>

                                            {/* 2x2 Visual Course Selector Cards */}
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                                    Choose Your Course <span className="text-red-500">*</span>
                                                </label>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {OFFICIAL_COURSE_CATALOG.map(c => {
                                                        const isSelected = courseInterest === c.title;
                                                        return (
                                                            <button
                                                                key={c.title}
                                                                type="button"
                                                                onClick={() => handleCourseSelect(c.title)}
                                                                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                                                                    isSelected
                                                                        ? 'bg-violet-50/90 dark:bg-violet-950/50 border-violet-600 ring-2 ring-violet-500/20'
                                                                        : 'bg-slate-50/70 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-violet-400'
                                                                }`}
                                                            >
                                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                                                        {c.title}
                                                                    </span>
                                                                    <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                                                        isSelected
                                                                            ? 'bg-violet-600 text-white'
                                                                            : 'border border-slate-300 dark:border-slate-700'
                                                                    }`}>
                                                                        {isSelected && <Check size={10} />}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-2.5">
                                                                    {c.shortDescription}
                                                                </p>
                                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[11px] font-extrabold text-violet-700 dark:text-violet-300">
                                                                    ${c.usdPerMonth} | {formatUgx(c.ugxPerMonth)} UGX / mo
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Level & Study Mode */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                                        Experience Level
                                                    </label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {LEVELS.map(l => (
                                                            <button
                                                                key={l.value}
                                                                type="button"
                                                                onClick={() => setLevel(l.value)}
                                                                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                                                    level === l.value
                                                                        ? 'bg-violet-600 text-white border-violet-600'
                                                                        : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                                                                }`}
                                                            >
                                                                {l.value}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                                        Preferred Mode of Study
                                                    </label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {MODES.map(m => (
                                                            <button
                                                                key={m.value}
                                                                type="button"
                                                                onClick={() => setModePreference(m.value)}
                                                                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                                                    modePreference === m.value
                                                                        ? 'bg-violet-600 text-white border-violet-600'
                                                                        : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                                                                }`}
                                                            >
                                                                {m.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Preferred Study Days */}
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                        Preferred Study Days <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="flex gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => setPreferredStudyDays(['Mon', 'Wed', 'Fri'])}
                                                            className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                                                        >
                                                            Mon/Wed/Fri
                                                        </button>
                                                        <span className="text-slate-300">•</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setPreferredStudyDays(['Tue', 'Thu'])}
                                                            className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                                                        >
                                                            Tue/Thu
                                                        </button>
                                                        <span className="text-slate-300">•</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setPreferredStudyDays(['Sat', 'Sun'])}
                                                            className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                                                        >
                                                            Weekends
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-7 gap-1.5">
                                                    {STUDY_DAYS.map(day => {
                                                        const active = preferredStudyDays.includes(day);
                                                        return (
                                                            <button
                                                                key={day}
                                                                type="button"
                                                                onClick={() => toggleStudyDay(day)}
                                                                className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                                                    active
                                                                        ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                                                                        : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                                                                }`}
                                                            >
                                                                {day}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {errors.preferredStudyDays && (
                                                    <p className="text-xs text-red-500 font-medium mt-1.5">{errors.preferredStudyDays}</p>
                                                )}
                                            </div>

                                            {/* Preferred Time Slot */}
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                                    Preferred Study Time Slot
                                                </label>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {TIME_SLOTS.map(slot => (
                                                        <button
                                                            key={slot.value}
                                                            type="button"
                                                            onClick={() => setChosenStudyTime(slot.value)}
                                                            className={`py-2.5 px-3.5 rounded-xl text-xs font-semibold border text-left flex items-center justify-between transition-all cursor-pointer ${
                                                                chosenStudyTime === slot.value
                                                                    ? 'bg-violet-50 dark:bg-violet-950/60 border-violet-600 text-violet-700 dark:text-violet-300 font-bold'
                                                                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                                                            }`}
                                                        >
                                                            <span>{slot.label}</span>
                                                            {chosenStudyTime === slot.value && <Check size={14} className="text-violet-600" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Collapsible Disclosure for Tentative Start Date & Session Duration */}
                                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowScheduleExtras(!showScheduleExtras)}
                                                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400 cursor-pointer"
                                                >
                                                    {showScheduleExtras ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                    Customize tentative start date, session hours & alternative time
                                                </button>

                                                {showScheduleExtras && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                                                        <div>
                                                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                                                Tentative Start Date
                                                            </label>
                                                            <input
                                                                type="date"
                                                                value={expectedStartDate}
                                                                onChange={(e) => setExpectedStartDate(e.target.value)}
                                                                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                                                Alternative Time Slot
                                                            </label>
                                                            <select
                                                                value={alternativeStudyTime}
                                                                onChange={(e) => setAlternativeStudyTime(e.target.value)}
                                                                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium"
                                                            >
                                                                {TIME_SLOTS.map(s => (
                                                                    <option key={s.value} value={s.value}>{s.label}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                                                Hours Per Session
                                                            </label>
                                                            <select
                                                                value={studyHoursPerSession}
                                                                onChange={(e) => setStudyHoursPerSession(e.target.value)}
                                                                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium"
                                                            >
                                                                {SESSION_HOURS_OPTIONS.map(h => (
                                                                    <option key={h} value={h}>{h}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                                                Sessions Per Week
                                                            </label>
                                                            <select
                                                                value={sessionsPerWeek}
                                                                onChange={(e) => setSessionsPerWeek(e.target.value)}
                                                                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium"
                                                            >
                                                                {SESSIONS_PER_WEEK_OPTIONS.map(spw => (
                                                                    <option key={spw} value={spw}>{spw}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-3 flex items-center justify-between gap-3">
                                                <button
                                                    type="button"
                                                    onClick={handleBack}
                                                    className="px-5 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm flex items-center gap-2 transition-colors cursor-pointer"
                                                >
                                                    <ArrowLeft size={16} />
                                                    Back
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleNext}
                                                    className="flex-1 sm:flex-initial px-7 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-lg shadow-violet-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                                                >
                                                    Continue to Final Step
                                                    <ArrowRight size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* =========================================================
                                       STEP 3: PROVISIONAL TUITION PLAN & INTEREST CONFIRMATION
                                       ========================================================= */}
                                    {step === 3 && (
                                        <div className="space-y-6 animate-in fade-in duration-200">
                                            <div>
                                                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                                                    Provisional Tuition Plan & Confirmation
                                                </h2>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                    Select how you would prefer to pay once your seat and start date are confirmed during follow-up.
                                                </p>
                                            </div>

                                            {/* Clean Provisional Tuition Summary Box */}
                                            <div className="p-4 rounded-2xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200/80 dark:border-violet-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 block">
                                                        {courseInterest} — Standard Tuition
                                                    </span>
                                                    <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                                                        ${activeCoursePricing.usdPerMonth} <span className="text-slate-400 font-normal">|</span> UGX {formatUgx(activeCoursePricing.ugxPerMonth)}{' '}
                                                        <span className="text-xs font-semibold text-slate-500">per month</span>
                                                    </div>
                                                </div>
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-800 text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                                    <CheckCircle2 size={14} />
                                                    UGX 0 Due Today (Pay on Confirmation)
                                                </span>
                                            </div>

                                            {/* Preferred Payment Plan & Method */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                                        Preferred Payment Plan (When Confirmed)
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {PAYMENT_PLANS.map(p => (
                                                            <button
                                                                key={p.value}
                                                                type="button"
                                                                onClick={() => handlePaymentPlanChange(p.value)}
                                                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                                                    paymentPlan === p.value
                                                                        ? 'bg-violet-600 text-white border-violet-600'
                                                                        : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                                                                }`}
                                                            >
                                                                <span className="text-xs font-bold block">{p.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                                        Preferred Payment Method
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {PAYMENT_METHODS.map(m => (
                                                            <button
                                                                key={m}
                                                                type="button"
                                                                onClick={() => setPaymentMethod(m)}
                                                                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                                                    paymentMethod === m
                                                                        ? 'bg-violet-600 text-white border-violet-600'
                                                                        : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                                                                }`}
                                                            >
                                                                {m}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Optional Deposit Toggle (Only if student pays a deposit at the booth) */}
                                            <div className="pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowInitialDepositBox(!showInitialDepositBox)}
                                                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-violet-600 dark:text-slate-400 cursor-pointer"
                                                >
                                                    {showInitialDepositBox ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                    Paying a commitment deposit at the booth today? (Optional — Default is UGX 0)
                                                </button>

                                                {showInitialDepositBox && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                                                        <div>
                                                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                                                Amount Paid Today (UGX)
                                                            </label>
                                                            <div className="relative">
                                                                <input
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    value={formatUgx(amountPaid)}
                                                                    onChange={(e) => {
                                                                        const val = sanitizeMoneyInput(e.target.value, totalCourseFee);
                                                                        setAmountPaid(val);
                                                                    }}
                                                                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                                                                />
                                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400">
                                                                    {formatEquivalentUsd(amountPaid)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                                                Receipt / Mobile Money Ref
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={paymentReference}
                                                                onChange={(e) => setPaymentReference(e.target.value)}
                                                                placeholder="e.g. MP261106..."
                                                                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Digital Signature & Programme Commitments Accordion */}
                                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                                        <PenTool size={14} className="text-violet-600" />
                                                        Digital Signature & Student Commitment
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowCommitmentsAccordion(!showCommitmentsAccordion)}
                                                        className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                                                    >
                                                        {showCommitmentsAccordion ? 'Hide 8-Point Pledge' : 'Read 8-Point Student Pledge'}
                                                    </button>
                                                </div>

                                                {showCommitmentsAccordion && (
                                                    <ul className="space-y-1.5 py-2 border-y border-slate-200/70 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 list-disc pl-4">
                                                        {OFFICIAL_COMMITMENTS.map((item, i) => (
                                                            <li key={i}>{item}</li>
                                                        ))}
                                                    </ul>
                                                )}

                                                <div>
                                                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                                        Student Digital Signature (Full Name)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={studentSignature}
                                                        onChange={(e) => setStudentSignature(e.target.value.replace(/[0-9]/g, ''))}
                                                        placeholder={fullName || 'Type your full name'}
                                                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-serif italic font-semibold text-violet-700 dark:text-violet-300"
                                                    />
                                                </div>

                                                <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={consentContact}
                                                        onChange={(e) => {
                                                            setConsentContact(e.target.checked);
                                                            if (errors.consentContact) setErrors(prev => ({ ...prev, consentContact: '' }));
                                                        }}
                                                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                                    />
                                                    <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                                        I confirm the above details are accurate and agree to be contacted by <strong>Welile School of AI</strong> via Phone/WhatsApp/Email to confirm my study schedule and seat.
                                                    </span>
                                                </label>
                                                {errors.consentContact && (
                                                    <p className="text-xs text-red-500 font-medium">{errors.consentContact}</p>
                                                )}
                                            </div>

                                            <div className="pt-2 flex items-center justify-between gap-3">
                                                <button
                                                    type="button"
                                                    onClick={handleBack}
                                                    className="px-5 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm flex items-center gap-2 transition-colors cursor-pointer"
                                                >
                                                    <ArrowLeft size={16} />
                                                    Back
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="flex-1 py-3.5 px-6 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <Loader2 size={17} className="animate-spin" />
                                                            Saving Registration...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle2 size={17} />
                                                            Complete Pre-Registration
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* COMPACT FOOTER */}
            <footer className="border-t border-slate-200/70 dark:border-slate-800/70 py-5 px-4 text-center text-xs text-slate-400">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
                    <span>Welile School of AI • Katabi, Entebbe, Uganda</span>
                    <span className="font-mono text-[11px]">Device Audit ID: {deviceAudit.deviceId}</span>
                </div>
            </footer>

            {/* =========================================================
               BOOTH / EVENT & STAFF AUDIT POPOVER MODAL
               ========================================================= */}
            {showBoothSettingsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowBoothSettingsModal(false)}
                    />
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative z-10 space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                    <UserCheck size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                        Outreach Event & Staff Audit
                                    </h3>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Saved on this device for back-to-back booth capture
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowBoothSettingsModal(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Capture Mode */}
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                Registration Mode
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRegistrationMode('Staff Assisted (Booth/Field)')}
                                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border cursor-pointer ${
                                        registrationMode === 'Staff Assisted (Booth/Field)'
                                            ? 'bg-emerald-600 text-white border-emerald-600'
                                            : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                                    }`}
                                >
                                    👤 Staff / Mobilizer
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRegistrationMode('Student Self-Registration')}
                                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border cursor-pointer ${
                                        registrationMode === 'Student Self-Registration'
                                            ? 'bg-violet-600 text-white border-violet-600'
                                            : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                                    }`}
                                >
                                    🎓 Student Self-Service
                                </button>
                            </div>
                        </div>

                        {/* Staff Selector */}
                        {registrationMode === 'Staff Assisted (Booth/Field)' && (
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                    Registered By (Mobilizer / Staff Audit)
                                </label>
                                <select
                                    value={registeredByStaff}
                                    onChange={(e) => setRegisteredByStaff(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                                >
                                    {staffRoster
                                        .filter(s => s.id !== 'stf-self')
                                        .map(st => (
                                            <option key={st.id} value={st.name}>
                                                👤 {st.name} — {st.role}
                                            </option>
                                        ))}
                                    <option value="CUSTOM">+ Enter Custom Staff / Mobilizer Name...</option>
                                </select>
                                {registeredByStaff === 'CUSTOM' && (
                                    <input
                                        type="text"
                                        value={customStaffName}
                                        onChange={(e) => setCustomStaffName(e.target.value)}
                                        placeholder="Enter staff full name"
                                        className="w-full mt-2 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                                    />
                                )}
                            </div>
                        )}

                        {/* Active Outreach Campaign */}
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                Outreach Campaign / Event
                            </label>
                            <select
                                value={outreachEvent}
                                onChange={(e) => setOutreachEvent(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                            >
                                {campaigns.map(c => (
                                    <option key={c.id} value={c.name}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Optional Staff Office Note */}
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                Follow-Up Note / Remarks (Section 8)
                            </label>
                            <input
                                type="text"
                                value={adminRemarks}
                                onChange={(e) => setAdminRemarks(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                            />
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowBoothSettingsModal(false)}
                                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold cursor-pointer"
                            >
                                Save & Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OutreachRegistration;
