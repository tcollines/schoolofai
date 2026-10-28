import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabaseClient';
import Orb from './Orb';
import {
    Bot,
    Brain,
    Zap,
    Sparkles,
    CheckCircle2,
    ArrowRight,
    GraduationCap,
    Sun,
    Moon,
    BookOpen,
    MessageSquare,
    Award,
    Users,
    Wallet,
    Video,
    X,
    Loader,
    Shield,
    Star,
    Building2,
    TrendingUp
} from 'lucide-react';
import { formatAmount, getCurrencyPreference, getExchangeRate, CurrencyType } from '../src/lib/currency';

interface LandingPageProps {
    onLoginClick?: () => void;
    onSignupClick?: () => void;
    onGetStarted?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onSignupClick, onGetStarted }) => {
    const [isDark, setIsDark] = useState(() => {
        return document.documentElement.classList.contains('dark');
    });

    const [currency, setCurrency] = useState<CurrencyType>(getCurrencyPreference);

    useEffect(() => {
        const handleCurrencyChange = () => {
            setCurrency(getCurrencyPreference());
        };
        window.addEventListener('currency-change', handleCurrencyChange);
        return () => {
            window.removeEventListener('currency-change', handleCurrencyChange);
        };
    }, []);

    const handleCurrencyToggle = (cur: CurrencyType) => {
        setCurrency(cur);
        localStorage.setItem('user_currency_preference', cur);
        window.dispatchEvent(new Event('currency-change'));
    };

    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const [inquiryName, setInquiryName] = useState('');
    const [inquiryEmail, setInquiryEmail] = useState('');
    const [inquiryMessage, setInquiryMessage] = useState('');
    const [isInquirySubmitting, setIsInquirySubmitting] = useState(false);

    const handleSendInquiry = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inquiryName.trim() || !inquiryEmail.trim()) {
            alert("Please fill in your name and email.");
            return;
        }
        setIsInquirySubmitting(true);
        try {
            const { error } = await supabase
                .from('mails')
                .insert({
                    name: inquiryName,
                    email: inquiryEmail,
                    message: inquiryMessage || 'Corporate inquiry from landing page.',
                    type: 'INQUIRY'
                });
            if (error) throw error;
            
            alert(`Thank you, ${inquiryName}! Your corporate enrollment inquiry has been submitted. Our team will contact you at ${inquiryEmail} within 24 hours.`);
            setShowInquiryModal(false);
            setInquiryName('');
            setInquiryEmail('');
            setInquiryMessage('');
            window.dispatchEvent(new Event('new-mail-notification'));
        } catch (err) {
            console.error(err);
            alert("Failed to submit inquiry.");
        } finally {
            setIsInquirySubmitting(false);
        }
    };

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

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 font-sans transition-colors duration-200">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/85 backdrop-blur-md z-50 border-b border-gray-100 dark:border-slate-800/80 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <img src="/schoolofai-logo.png" alt="School of AI Logo" className="h-16 object-contain" />
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm transition-colors">Features</a>
                            <a href="#advantages" className="text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm transition-colors">Why AI?</a>
                            <a href="#pricing" className="text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm transition-colors">Pricing</a>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => handleCurrencyToggle(currency === 'USD' ? 'UGX' : 'USD')}
                                className="px-2.5 py-1 text-xs font-bold text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                                title="Toggle Currency (USD / UGX)"
                            >
                                <span>{currency}</span>
                            </button>
                            <button
                                onClick={toggleTheme}
                                className="p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800/60 rounded-full transition-all cursor-pointer flex items-center justify-center"
                                title={isDark ? "Activate Light Mode" : "Activate Dark Mode"}
                            >
                                {isDark ? <Sun size={18} /> : <Moon size={18} />}
                            </button>

                            <button
                                onClick={onLoginClick}
                                className="text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm transition-colors"
                            >
                                Log in
                            </button>
                            <button
                                onClick={onSignupClick || onGetStarted}
                                className="hidden sm:block bg-black dark:bg-white text-white dark:text-slate-950 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 dark:hover:bg-slate-100 transition-colors shadow-sm"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-20 sm:pt-24 pb-12 overflow-hidden relative flex flex-col items-center justify-center">
                {/* Text and Orb Container */}
                <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 h-[500px] flex items-center justify-center">
                    {/* Background Orb */}
                    <div className="absolute inset-0 z-0 flex justify-center items-center overflow-hidden">
                        <div className="w-full h-full relative">
                            <Orb
                                hoverIntensity={0.5}
                                rotateOnHover={true}
                                hue={0}
                                forceHoverState={false}
                                backgroundColor={isDark ? '#020617' : '#ffffff'}
                            />
                        </div>
                    </div>

                    <div className="relative z-10 text-center max-w-3xl mx-auto pointer-events-none px-4 sm:px-6">
                        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-violet-100/80 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-6 sm:mb-8 backdrop-blur-md shadow-sm border border-violet-200/50 dark:border-violet-800/50">
                            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-2" />
                            The Future of Learning
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6 sm:mb-8 leading-[1.1] md:leading-[1.15]">
                            Learn faster using <br className="hidden sm:block" />
                            <span className="block sm:inline text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 drop-shadow-sm mt-1 sm:mt-0">
                                Artificial Intelligence
                            </span>
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 sm:mb-10 leading-relaxed max-w-2xl mx-auto drop-shadow-md sm:drop-shadow-none bg-white/40 dark:bg-slate-900/40 sm:bg-transparent sm:dark:bg-transparent backdrop-blur-sm sm:backdrop-blur-none p-4 sm:p-0 rounded-2xl border border-white/20 sm:border-none">
                            Welile School creates personalized video courses tailored to your specific goals.
                            Skip the fluff and focus on what matters with an AI tutor that adapts to you.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pointer-events-auto w-full sm:w-auto px-2 sm:px-0">
                            <button
                                onClick={onGetStarted}
                                className="w-full sm:w-auto px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-slate-950 rounded-full font-bold text-[15px] sm:text-lg hover:bg-gray-800 dark:hover:bg-slate-100 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 flex items-center justify-center group"
                            >
                                Start Learning Now
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full z-10">
                    {/* Laptop Mockup Placeholder */}
                    <div className="relative mx-auto max-w-5xl">
                        <div className="rounded-xl bg-gray-900 p-2 shadow-2xl ring-1 ring-gray-900/10">
                            <div className="rounded-lg bg-white overflow-hidden aspect-[16/10] relative text-center flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                <img src="/ict_students_learning.png" alt="App Dashboard - ICT Students Learning" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-gray-50/50 dark:bg-slate-900/50 border-y border-gray-100 dark:border-slate-800/40 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 text-xs font-semibold uppercase tracking-wide mb-6">
                            <Sparkles className="w-3 h-3 mr-2" />
                            Core Features
                        </div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                            Unlock a smarter way to master skills
                        </h2>
                        <p className="mt-4 text-lg text-gray-500 dark:text-slate-400 leading-relaxed">
                            Welile School combines generative AI with structured learning pathways to provide an educational experience tailored to you.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-800/60 rounded-3xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 bg-violet-100 dark:bg-violet-950/40 rounded-2xl flex items-center justify-center text-violet-600 dark:text-violet-400 mb-6 shadow-sm">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">AI ICT Syllabus Generator</h3>
                            <p className="text-gray-500 dark:text-slate-400 leading-relaxed text-sm">
                                Input any technology topic, and our AI instantly drafts a structured syllabus covering networking, database design, cybersecurity, or programming.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-800/60 rounded-3xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/40 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 shadow-sm">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Real-time ICT Code Tutor</h3>
                            <p className="text-gray-500 dark:text-slate-400 leading-relaxed text-sm">
                                Get instant explanations of complex code snippets, script bugs, cloud templates, or database schemas directly alongside video lectures.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-800/60 rounded-3xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 shadow-sm">
                                <Video className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Hands-on ICT Video Labs</h3>
                            <p className="text-gray-500 dark:text-slate-400 leading-relaxed text-sm">
                                Learn practical systems setup, virtualization configurations, network switch hardware layouts, and cloud architecture deployments visually.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-800/60 rounded-3xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-950/40 rounded-2xl flex items-center justify-center text-pink-650 dark:text-pink-400 mb-6 shadow-sm">
                                <Award className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Professional ICT Certification</h3>
                            <p className="text-gray-500 dark:text-slate-400 leading-relaxed text-sm">
                                Complete comprehensive tech exams to earn verified, shareable certificates in computer networking, software engineering, databases, or cybersecurity.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-800/60 rounded-3xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/40 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6 shadow-sm">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">ICT Collaborative Forums</h3>
                            <p className="text-gray-500 dark:text-slate-400 leading-relaxed text-sm">
                                Join group study channels to discuss software bugs, review system configurations, share cloud infrastructure diagrams, and work on coding labs.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className="bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-800/60 rounded-3xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center text-indigo-650 dark:text-indigo-400 mb-6 shadow-sm">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Smart IT Training Wallet</h3>
                            <p className="text-gray-500 dark:text-slate-400 leading-relaxed text-sm">
                                Manage learning credits, fund your wallet, track transactions, and purchase specialty modules covering DevOps, AI, and systems engineering.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Advantages of AI */}
            <section id="advantages" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Why Learn with AI?</h2>
                        <p className="mt-4 text-lg text-gray-500">Traditional education is one-size-fits-all. AI changes the game.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="bg-gray-50 rounded-2xl p-8 transition-all hover:-translate-y-1 hover:shadow-lg">
                            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600 mb-6">
                                <Brain className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Personalized Curriculum</h3>
                            <p className="text-gray-500 leading-relaxed">
                                The AI analyzes your current knowledge and goals to generate a custom syllabus that bridges your specific gaps.
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-8 transition-all hover:-translate-y-1 hover:shadow-lg">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                                <Zap className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Analytics</h3>
                            <p className="text-gray-500 leading-relaxed">
                                Track your progress with precision. Our AI identifies weak points and dynamically adjusts future lessons.
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-8 transition-all hover:-translate-y-1 hover:shadow-lg">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-6">
                                <Bot className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">24/7 AI Tutor</h3>
                            <p className="text-gray-500 leading-relaxed">
                                Get instant answers to your questions while watching videos. It's like having a private professor available anytime.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* AI Growth Statistics */}
            <section className="py-24 bg-gray-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight mb-6">The Rise of AI in Education</h2>
                            <p className="text-gray-400 text-lg mb-8">
                                The world is shifting. AI-driven learning is proven to increase engagement and retention rates significantly compared to traditional MOOCs.
                            </p>
                            <div className="space-y-6">
                                <div className="flex items-center">
                                    <div className="text-4xl font-bold text-violet-400 mr-4">80%</div>
                                    <div className="text-gray-300">Increase in retention rates</div>
                                </div>
                                <div className="flex items-center">
                                    <div className="text-4xl font-bold text-blue-400 mr-4">3x</div>
                                    <div className="text-gray-300">Faster completion time</div>
                                </div>
                                <div className="flex items-center">
                                    <div className="text-4xl font-bold text-green-400 mr-4">95%</div>
                                    <div className="text-gray-300">Student satisfaction</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/10 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <h3 className="text-xl font-semibold mb-6">Projected E-Learning Growth</h3>
                            {/* Simple CSS Chart Mockup */}
                            <div className="flex items-end justify-between h-64 space-x-4">
                                <div className="w-full bg-violet-600/30 rounded-t-sm h-[40%] relative group">
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-sm text-gray-400 opacity-0 group-hover:opacity-100">2023</div>
                                </div>
                                <div className="w-full bg-violet-600/50 rounded-t-sm h-[60%] relative group">
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-sm text-gray-400 opacity-0 group-hover:opacity-100">2024</div>
                                </div>
                                <div className="w-full bg-violet-600/70 rounded-t-sm h-[80%] relative group">
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-sm text-gray-400 opacity-0 group-hover:opacity-100">2025</div>
                                </div>
                                <div className="w-full bg-violet-500 rounded-t-sm h-[100%] relative group shadow-[0_0_20px_rgba(139,92,246,0.5)]">
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-sm font-bold text-violet-400">2026</div>
                                </div>
                            </div>
                            <div className="mt-4 text-center text-sm text-gray-400">Market Adoption</div>
                        </div>
                    </div>
                </div>
            </section>


            {/* Pricing */}
            <section id="pricing" className="py-24 bg-gray-50 dark:bg-slate-900/50 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <div className="flex flex-wrap items-center justify-center gap-3 mb-3">
                            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">Simple, Transparent Pricing</h2>
                            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900/50 rounded-full text-xs font-bold text-violet-700 dark:text-violet-300">
                                <TrendingUp size={13} />
                                Live Rate: $1 USD = {getExchangeRate().toLocaleString()} UGX
                            </span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2">
                            <p className="text-base text-gray-500 dark:text-slate-400">Choose the plan that fits your learning journey.</p>
                            <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-1 rounded-xl shadow-sm text-xs font-bold">
                                <button
                                    type="button"
                                    onClick={() => handleCurrencyToggle('USD')}
                                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${currency === 'USD' ? 'bg-violet-600 text-white shadow' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`}
                                >
                                    USD ($)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleCurrencyToggle('UGX')}
                                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${currency === 'UGX' ? 'bg-violet-600 text-white shadow' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`}
                                >
                                    UGX (USh)
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto px-4 items-stretch">
                        {/* Basic Plan */}
                        <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[11px] font-black tracking-wider uppercase px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                        Free
                                    </span>
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Basic</h3>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-4xl font-black text-gray-900 dark:text-white">Free</span>
                                    <span className="text-sm font-medium text-gray-500 dark:text-slate-400">/ forever</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mb-6 min-h-[32px]">
                                    Perfect for exploring introductory courses and getting started.
                                </p>

                                <div className="mb-6">
                                    <button
                                        onClick={onSignupClick || onGetStarted}
                                        className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white font-bold text-xs transition-colors cursor-pointer"
                                    >
                                        Get Started Free
                                    </button>
                                </div>

                                <div className="border-t border-gray-100 dark:border-slate-800/80 pt-5">
                                    <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Included Benefits</p>
                                    <ul className="space-y-3 text-xs text-gray-600 dark:text-slate-300">
                                        <li className="flex items-center gap-2.5">
                                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                            <span>Access to <strong>Introduction modules</strong></span>
                                        </li>
                                        <li className="flex items-center gap-2.5">
                                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                            <span>Free community forums & discussions</span>
                                        </li>
                                        <li className="flex items-center gap-2.5">
                                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                            <span>Standard course progress tracking</span>
                                        </li>
                                        <li className="flex items-center gap-2.5 text-gray-400 dark:text-slate-600">
                                            <X size={16} className="text-gray-300 dark:text-slate-700 shrink-0" />
                                            <span>Pro & Premium course library</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Pro Plan ($25 / month) */}
                        <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border-2 border-violet-500 shadow-xl shadow-violet-500/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-28 h-28 bg-violet-500 blur-3xl opacity-20 -mr-14 -mt-14 pointer-events-none"></div>
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[11px] font-black tracking-wider uppercase px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm flex items-center gap-1">
                                        <Star size={12} className="fill-current" /> Most Popular
                                    </span>
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Pro</h3>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-4xl font-black text-gray-900 dark:text-white">{formatAmount(25)}</span>
                                    <span className="text-sm font-medium text-gray-500 dark:text-slate-400">/ month</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mb-6 min-h-[32px]">
                                    Full monthly access for dedicated self-paced learners.
                                </p>

                                <div className="mb-6">
                                    <button
                                        onClick={onSignupClick || onGetStarted}
                                        className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md shadow-violet-500/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                        <span>Start Pro Plan</span>
                                        <ArrowRight size={14} />
                                    </button>
                                </div>

                                <div className="border-t border-gray-100 dark:border-slate-800/80 pt-5">
                                    <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Included Benefits</p>
                                    <ul className="space-y-3 text-xs text-gray-600 dark:text-slate-300">
                                        <li className="flex items-center gap-2.5">
                                            <CheckCircle2 size={16} className="text-violet-600 dark:text-violet-400 shrink-0" />
                                            <span><strong>All Pro & Free courses</strong> unlocked</span>
                                        </li>
                                        <li className="flex items-center gap-2.5">
                                            <CheckCircle2 size={16} className="text-violet-600 dark:text-violet-400 shrink-0" />
                                            <span><strong>24/7 AI Tutor</strong> support</span>
                                        </li>
                                        <li className="flex items-center gap-2.5">
                                            <CheckCircle2 size={16} className="text-violet-600 dark:text-violet-400 shrink-0" />
                                            <span>Downloadable resources & exercises</span>
                                        </li>
                                        <li className="flex items-center gap-2.5">
                                            <CheckCircle2 size={16} className="text-violet-600 dark:text-violet-400 shrink-0" />
                                            <span>Verified course completion certificates</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Premium Plan ($150 one-time) */}
                        <div className="p-7 rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-700 to-indigo-900 text-white border border-violet-400/40 shadow-xl shadow-indigo-950/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white blur-3xl opacity-15 -mr-16 -mt-16 pointer-events-none"></div>
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[11px] font-black tracking-wider uppercase px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/25 flex items-center gap-1">
                                        <Sparkles size={12} className="fill-current" /> Lifetime Access
                                    </span>
                                </div>
                                <h3 className="text-2xl font-black text-white mb-1">Premium</h3>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-4xl font-black text-white">{formatAmount(150)}</span>
                                    <span className="text-sm font-medium text-violet-200">one-time</span>
                                </div>
                                <p className="text-xs text-violet-100/90 mb-6 min-h-[32px]">
                                    One-time payment • Lifetime access to all Pro & free courses.
                                </p>

                                <div className="mb-6">
                                    <button
                                        onClick={onSignupClick || onGetStarted}
                                        className="w-full py-2.5 rounded-xl bg-white hover:bg-violet-50 text-indigo-900 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                        <span>Get Lifetime Access</span>
                                        <ArrowRight size={14} />
                                    </button>
                                </div>

                                <div className="border-t border-white/15 pt-5">
                                    <p className="text-[11px] font-bold text-violet-200 uppercase tracking-wider mb-3">Included Benefits</p>
                                    <ul className="space-y-3 text-xs text-violet-50">
                                        <li className="flex items-center gap-2.5">
                                            <CheckCircle2 size={16} className="text-amber-300 shrink-0" />
                                            <span><strong>Lifetime access</strong> — zero renewals</span>
                                        </li>
                                        <li className="flex items-center gap-2.5">
                                            <CheckCircle2 size={16} className="text-amber-300 shrink-0" />
                                            <span>All current & future Pro courses</span>
                                        </li>
                                        <li className="flex items-center gap-2.5">
                                            <CheckCircle2 size={16} className="text-amber-300 shrink-0" />
                                            <span><strong>1-on-1 Mentorship</strong> & Live Q&A</span>
                                        </li>
                                        <li className="flex items-center gap-2.5">
                                            <CheckCircle2 size={16} className="text-amber-300 shrink-0" />
                                            <span>Portfolio review & career guidance</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Corporate Plan */}
                        <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-violet-300/80 dark:border-violet-900/60 shadow-xl hover:shadow-2xl hover:border-violet-500 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-28 h-28 bg-violet-500 blur-3xl opacity-15 -mr-14 -mt-14 pointer-events-none"></div>
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[11px] font-black tracking-wider uppercase px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 flex items-center gap-1 border border-violet-200 dark:border-violet-900/60">
                                        <Building2 size={12} /> Corporate
                                    </span>
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Corporate</h3>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-xs font-semibold text-gray-400">From</span>
                                    <span className="text-4xl font-black text-gray-900 dark:text-white">{formatAmount(15)}</span>
                                    <span className="text-sm font-medium text-gray-500 dark:text-slate-400">/ seat</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mb-6 min-h-[32px]">
                                    10–49 seats: $20/seat • 50+ seats: $15/seat.
                                </p>

                                <div className="mb-6 space-y-2">
                                    <button
                                        onClick={() => {
                                            window.location.href = '/corporate/setup';
                                        }}
                                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs shadow-md shadow-violet-500/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                        <span>Setup Corporate Plan</span>
                                        <ArrowRight size={14} />
                                    </button>
                                    <button
                                        onClick={() => setShowInquiryModal(true)}
                                        className="w-full py-1 text-center text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                        <span>Custom quote inquiry →</span>
                                    </button>
                                </div>

                                <div className="border-t border-gray-100 dark:border-slate-800/80 pt-5">
                                    <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Corporate Benefits</p>
                                    <ul className="space-y-3 text-xs text-gray-600 dark:text-slate-300">
                                        <li className="flex items-center gap-2.5">
                                            <CheckCircle2 size={16} className="text-violet-600 dark:text-violet-400 shrink-0" />
                                            <span><strong>Dedicated team seats</strong> (10+ learners)</span>
                                        </li>
                                        <li className="flex items-center gap-2.5">
                                            <CheckCircle2 size={16} className="text-violet-600 dark:text-violet-400 shrink-0" />
                                            <span>Custom <strong>Company branding & logo</strong></span>
                                        </li>
                                        <li className="flex items-center gap-2.5">
                                            <CheckCircle2 size={16} className="text-violet-600 dark:text-violet-400 shrink-0" />
                                            <span><strong>Email invitations</strong> & seat management</span>
                                        </li>
                                        <li className="flex items-center gap-2.5">
                                            <CheckCircle2 size={16} className="text-violet-600 dark:text-violet-400 shrink-0" />
                                            <span>Live <strong>team progress & analytics</strong></span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {showInquiryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInquiryModal(false)} />
                    <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 text-gray-900 dark:text-white">
                        <button 
                            type="button" 
                            onClick={() => setShowInquiryModal(false)} 
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-xl font-bold text-center mb-2">Request Business Quote</h3>
                        <p className="text-center text-xs text-gray-500 dark:text-slate-400 mb-6">
                            Submit your details to request custom pricing and set up enterprise seats.
                        </p>

                        <form onSubmit={handleSendInquiry} className="space-y-4">

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">Your Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={inquiryName} 
                                        onChange={(e) => setInquiryName(e.target.value)} 
                                        className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-250 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">Email Address</label>
                                    <input 
                                        type="email" 
                                        required
                                        value={inquiryEmail} 
                                        onChange={(e) => setInquiryEmail(e.target.value)} 
                                        className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-250 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">Additional Message (Optional)</label>
                                <textarea 
                                    value={inquiryMessage} 
                                    onChange={(e) => setInquiryMessage(e.target.value)} 
                                    rows={2}
                                    placeholder="Any specific requests or requirements..."
                                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-250 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 resize-none"
                                />
                            </div>

                             <div className="flex gap-3 pt-4 border-t dark:border-slate-800">
                                <button 
                                    type="button" 
                                    onClick={() => setShowInquiryModal(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-250 dark:border-slate-800 text-gray-700 dark:text-slate-300 font-bold text-xs hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isInquirySubmitting}
                                    className="flex-1 bg-violet-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-violet-200 dark:shadow-none"
                                >
                                    {isInquirySubmitting ? (
                                        <>
                                            <Loader size={12} className="animate-spin text-white" />
                                            Submitting...
                                        </>
                                    ) : (
                                        'Submit Inquiry'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="bg-white py-12 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center mb-4 md:mb-0">
                        <img src="/schoolofai-logo.png" alt="School of AI Logo" className="h-12 object-contain" />
                    </div>
                    <div className="flex gap-6 items-center">
                        <div className="text-sm text-gray-500">
                            © 2024 Welile School. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
