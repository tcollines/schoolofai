import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
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
    Loader
} from 'lucide-react';

interface LandingPageProps {
    onLoginClick?: () => void;
    onSignupClick?: () => void;
    onGetStarted?: () => void;
    onAdminConsoleClick?: () => void;
    onInstructorConsoleClick?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onSignupClick, onGetStarted, onAdminConsoleClick, onInstructorConsoleClick }) => {
    const [isDark, setIsDark] = useState(() => {
        return document.documentElement.classList.contains('dark');
    });

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
                            <div className="w-8 h-8 bg-black dark:bg-white rounded-full flex items-center justify-center mr-2 transition-colors">
                                <div className="w-3 h-3 bg-white dark:bg-black rounded-full transition-colors"></div>
                            </div>
                            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">Welile<span className="text-violet-600 dark:text-violet-400">School</span></span>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm transition-colors">Features</a>
                            <a href="#advantages" className="text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm transition-colors">Why AI?</a>
                            <a href="#pricing" className="text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm transition-colors">Pricing</a>
                        </div>
                        <div className="flex items-center space-x-4">
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
            <section className="pt-24 pb-12 overflow-hidden relative flex flex-col items-center justify-center">
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

                    <div className="relative z-10 text-center max-w-3xl mx-auto pointer-events-none">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 text-xs font-semibold uppercase tracking-wide mb-6">
                            <Sparkles className="w-3 h-3 mr-2" />
                            The Future of Learning
                        </div>
                        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6 leading-tight">
                            Learn faster using <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">Artificial Intelligence</span>
                        </h1>
                        <p className="text-xl text-gray-500 dark:text-gray-300 mb-10 leading-relaxed">
                            Welile School creates personalized video courses tailored to your specific goals.
                            Skip the fluff and focus on what matters with an AI tutor that adapts to you.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4 pointer-events-auto">
                            <button
                                onClick={onGetStarted}
                                className="px-8 py-4 bg-black dark:bg-white text-white dark:text-slate-950 rounded-full font-semibold text-lg hover:bg-gray-800 dark:hover:bg-slate-100 transition-all shadow-lg hover:shadow-xl flex items-center justify-center group"
                            >
                                Start Learning Now
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
            <section id="pricing" className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Simple, Transparent Pricing</h2>
                        <p className="mt-4 text-lg text-gray-500">Choose the plan that fits your learning journey.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                        {/* Basic */}
                        <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-2xl p-8 border border-gray-205 dark:border-gray-800 shadow-xl relative overflow-hidden hover:transform hover:-translate-y-1 hover:border-violet-500 dark:hover:border-violet-400 transition-all duration-300 flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 blur-3xl opacity-20 -mr-16 -mt-16"></div>
                            <div className="absolute top-0 right-0 bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-lg">FREE</div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Basic</h3>
                                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Free<span className="text-sm font-medium text-gray-500">/forever</span></div>
                                <p className="text-gray-550 dark:text-gray-400 mb-6 text-sm">Perfect for exploring new topics and getting started.</p>
                                <ul className="space-y-4 mb-8 text-sm text-gray-700 dark:text-gray-300">
                                    <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                                        <CheckCircle2 className="w-5 h-5 text-purple-500 dark:text-purple-400 mr-2 shrink-0" />
                                        {"Access to "}<strong>Introduction</strong>{" modules"}
                                    </li>
                                    <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                                        <span className="w-5 h-5 mr-2 border border-gray-450 dark:border-slate-600 rounded-full block shrink-0"></span>
                                        Fundamentals modules
                                    </li>
                                    <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                                        <span className="w-5 h-5 mr-2 border border-gray-450 dark:border-slate-600 rounded-full block shrink-0"></span>
                                        Advanced Application modules
                                    </li>
                                </ul>
                            </div>
                            <button
                                onClick={onSignupClick || onGetStarted}
                                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium hover:from-violet-700 hover:to-indigo-700 transition-colors shadow-lg shadow-indigo-900/30"
                            >
                                Get Started
                            </button>
                        </div>

                        {/* Pro */}
                        <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-2xl p-8 border border-violet-200 dark:border-violet-600 shadow-xl relative overflow-hidden hover:transform hover:-translate-y-1 hover:border-violet-500 dark:hover:border-violet-400 transition-all duration-300 flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 blur-3xl opacity-20 -mr-16 -mt-16"></div>
                            <div className="absolute top-0 right-0 bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-lg">POPULAR</div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Pro</h3>
                                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-4">$100 <span className="text-sm font-medium text-gray-500 dark:text-gray-400">one-time</span></div>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">Master every subject with unlimited access to everything.</p>
                                <ul className="space-y-4 mb-8 text-sm text-gray-700 dark:text-gray-300">
                                    <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                                        <CheckCircle2 className="w-5 h-5 text-violet-500 dark:text-violet-400 mr-2 shrink-0" />
                                        {"Access to "}<strong>Introduction</strong>{" modules"}
                                    </li>
                                    <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                                        <CheckCircle2 className="w-5 h-5 text-violet-500 dark:text-violet-400 mr-2 shrink-0" />
                                        {"Access to "}<strong>Fundamentals</strong>{" modules"}
                                    </li>
                                    <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                                        <CheckCircle2 className="w-5 h-5 text-violet-500 dark:text-violet-400 mr-2 shrink-0" />
                                        {"Access to "}<strong>All</strong>{" modules"}
                                    </li>
                                    <li className="flex items-start text-sm text-amber-500 dark:text-amber-400 font-bold">
                                        <Sparkles className="w-5 h-5 mr-2 shrink-0 text-amber-500 dark:text-amber-400" />
                                        Unlimited AI Tutor Support
                                    </li>
                                </ul>
                            </div>
                            <button
                                onClick={onSignupClick || onGetStarted}
                                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium hover:from-violet-700 hover:to-indigo-700 transition-colors shadow-lg shadow-indigo-900/30"
                            >
                                Get Started
                            </button>
                        </div>

                        {/* Business - Corporate */}
                        <div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-2xl p-8 border border-gray-205 dark:border-slate-800 shadow-xl relative overflow-hidden hover:transform hover:-translate-y-1 hover:border-violet-500 dark:hover:border-violet-400 transition-all duration-300 flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 blur-3xl opacity-20 -mr-16 -mt-16"></div>
                            <div className="absolute top-0 right-0 bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-lg">BUSINESS</div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Corporate</h3>
                                <p className="text-xs text-violet-600 dark:text-violet-400 font-semibold mb-6">
                                    Upskill your team
                                </p>
                                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                                    Custom Plan
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm leading-relaxed">
                                    Tailormade enrollment and reporting packages for your organization.
                                </p>

                                <ul className="space-y-4 mb-8 text-sm text-gray-700 dark:text-gray-300">
                                    <li className="flex items-start">
                                        <CheckCircle2 className="w-5 h-5 text-purple-500 dark:text-purple-400 mr-2 shrink-0" />
                                        {"Access to "}<strong>All</strong>{" modules for employees"}
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle2 className="w-5 h-5 text-purple-500 dark:text-purple-400 mr-2 shrink-0" />
                                        {"Weekly "}<strong>progress reports</strong>{" for admins"}
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle2 className="w-5 h-5 text-purple-500 dark:text-purple-400 mr-2 shrink-0" />
                                        Dedicated company billing & dashboard
                                    </li>
                                    <li className="flex items-start text-amber-500 dark:text-amber-400 font-bold">
                                        <Sparkles className="w-5 h-5 mr-2 shrink-0 text-amber-500 dark:text-amber-400" />
                                        Unlimited AI Tutor Support
                                    </li>
                                </ul>
                            </div>
                            <button
                                onClick={() => setShowInquiryModal(true)}
                                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium hover:from-violet-700 hover:to-indigo-700 transition-colors shadow-lg shadow-indigo-900/30"
                            >
                                Enquire Now
                            </button>
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
                        <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center mr-2">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <span className="font-bold tracking-tight text-gray-900">Welile<span className="text-violet-600">School</span></span>
                    </div>
                    <div className="flex gap-6 items-center">
                        <button onClick={onAdminConsoleClick} className="text-sm font-medium text-gray-500 hover:text-violet-600">Admin Console</button>
                        <button onClick={onInstructorConsoleClick} className="text-sm font-medium text-gray-500 hover:text-violet-600">Instructor Console</button>
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
