import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2,
    Users,
    Mail,
    Phone,
    Globe,
    Edit3,
    UserPlus,
    CheckCircle2,
    Clock,
    BookOpen,
    TrendingUp,
    Download,
    Search,
    RefreshCw,
    Award,
    MoreHorizontal,
    Trash2,
    Send,
    Shield,
    Sparkles,
    AlertCircle,
    ArrowUpRight
} from 'lucide-react';
import { CorporateBrandingModal } from './CorporateBrandingModal';
import { InviteMembersModal } from './InviteMembersModal';
import { formatAmount } from '../../src/lib/currency';

interface CorporateDashboardProps {
    user?: any;
}

export const CorporateDashboard: React.FC<CorporateDashboardProps> = ({ user }) => {
    const navigate = useNavigate();

    const [organization, setOrganization] = useState<any>(null);
    const [seats, setSeats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTab, setFilterTab] = useState<'all' | 'active' | 'pending'>('all');
    
    const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    const fetchCorporateData = async () => {
        try {
            setLoading(true);
            const userEmail = user?.email || localStorage.getItem('auth_logged_in_email') || localStorage.getItem('logged_in_email') || '';
            const userId = user?.id || localStorage.getItem('auth_logged_in_id') || '';
            const userName = user?.name || '';

            const res = await fetch(`/api/corporate/seats?userId=${encodeURIComponent(userId)}&userEmail=${encodeURIComponent(userEmail)}&userName=${encodeURIComponent(userName)}`);
            const data = await res.json();

            if (data.success && data.organization) {
                setOrganization(data.organization);
                setSeats(data.seats || []);
                if (data.organization?.name && data.organization.name !== 'Corporate Partner') {
                    if (userId) localStorage.setItem(`user_company_name_${userId}`, data.organization.name);
                    localStorage.setItem('user_company_name', data.organization.name);
                    localStorage.setItem('user_plan', 'corporate');
                    window.dispatchEvent(new Event('profile-update'));
                }
            } else {
                setOrganization(null);
                setSeats([]);
            }
        } catch (err) {
            console.error('Error fetching corporate data:', err);
            setOrganization(null);
            setSeats([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCorporateData();
    }, [user]);

    const handleResendInvite = async (memberId: string) => {
        setActionLoadingId(memberId);
        try {
            const res = await fetch('/api/corporate/invite/resend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orgId: organization?.id,
                    memberId
                })
            });
            const data = await res.json();
            if (data.success) {
                setFeedbackMessage('Invitation reminder sent successfully!');
                setTimeout(() => setFeedbackMessage(null), 3500);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleRevokeSeat = async (memberId: string) => {
        if (!confirm('Are you sure you want to revoke this seat? The employee invitation or access will be removed and the seat will be returned to your open quota.')) {
            return;
        }

        setActionLoadingId(memberId);
        try {
            const res = await fetch(`/api/corporate/seats/${memberId}?orgId=${organization?.id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                setFeedbackMessage('Seat revoked and returned to pool.');
                setTimeout(() => setFeedbackMessage(null), 3500);
                fetchCorporateData();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleExportCSV = () => {
        if (!seats.length) return;

        const headers = ['Name', 'Email', 'Department', 'Status', 'Enrolled Courses', 'Average Progress %', 'Certificate Earned', 'Invited At'];
        const rows = seats.map(s => {
            const coursesStr = (s.enrolledCourses || []).map((c: any) => c.courseTitle).join('; ');
            const avgProg = (s.enrolledCourses && s.enrolledCourses.length) 
                ? Math.round((s.enrolledCourses.reduce((acc: number, cur: any) => acc + (cur.progress || 0), 0)) / s.enrolledCourses.length)
                : 0;
            const certEarned = (s.enrolledCourses || []).some((c: any) => c.certificateEarned) ? 'Yes' : 'No';

            return [
                `"${s.name || ''}"`,
                `"${s.email || ''}"`,
                `"${s.department || ''}"`,
                `"${s.status || ''}"`,
                `"${coursesStr || 'None'}"`,
                `"${avgProg}%"`,
                `"${certEarned}"`,
                `"${s.invitedAt ? new Date(s.invitedAt).toLocaleDateString() : ''}"`
            ].join(',');
        });

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${(organization?.name || 'corporate').toLowerCase().replace(/\s+/g, '_')}_training_report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filter seats
    const filteredSeats = seats.filter(s => {
        const matchesFilter = filterTab === 'all' 
            ? true 
            : (filterTab === 'active' ? s.status === 'active' : s.status === 'pending');
        
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = !q || 
            s.name?.toLowerCase().includes(q) || 
            s.email?.toLowerCase().includes(q) || 
            s.department?.toLowerCase().includes(q) ||
            (s.enrolledCourses || []).some((c: any) => c.courseTitle?.toLowerCase().includes(q));

        return matchesFilter && matchesSearch;
    });

    const totalSeats = organization?.totalSeats || 0;
    const activeSeats = organization?.activeSeats || 0;
    const pendingSeats = organization?.pendingSeats || 0;
    const availableSeats = organization?.availableSeats ?? Math.max(0, totalSeats - seats.length);
    const avgProgress = organization?.avgProgress || 0;

    if (!loading && !organization) {
        return (
            <div className="max-w-2xl mx-auto my-16 p-8 sm:p-10 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl text-center space-y-6 shadow-xl animate-fadeIn">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-950/40 text-welile-purple dark:text-purple-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <Building2 size={32} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Corporate Account Required</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                        The Corporate Portal is exclusively available to registered corporate organizations and sponsored corporate learners. Upgrade your account or create a corporate plan to unlock team seats and analytics.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                        onClick={() => navigate('/corporate/setup')}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm hover:from-purple-700 hover:to-indigo-700 transition shadow-lg shadow-purple-500/20 cursor-pointer"
                    >
                        Set Up Corporate Plan
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-12">
            {/* Feedback Alert */}
            {feedbackMessage && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-sm font-semibold flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-emerald-500" />
                        <span>{feedbackMessage}</span>
                    </div>
                    <button onClick={() => setFeedbackMessage(null)} className="text-emerald-600 dark:text-emerald-400 hover:opacity-75">
                        ✕
                    </button>
                </div>
            )}

            {/* Corporate Branding Hero Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-6 sm:p-8 shadow-2xl border border-violet-500/20">
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

                <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    {/* Brand Details */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                            {organization?.logoUrl ? (
                                <img
                                    src={organization.logoUrl}
                                    alt={organization.name}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        (e.target as any).src = '';
                                    }}
                                />
                            ) : (
                                <Building2 className="w-10 h-10 text-violet-300" />
                            )}
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                    {organization?.name || 'Corporate Learning Portal'}
                                </h1>
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-500/30 text-violet-200 border border-violet-400/30 backdrop-blur-sm flex items-center gap-1">
                                    <Shield size={12} /> ENTERPRISE PLAN
                                </span>
                            </div>

                            <p className="text-xs sm:text-sm text-violet-200/80 mb-3 max-w-xl">
                                Enterprise upskilling program powered by School of AI. Real-time seat allocation, curriculum tracking, and organizational training intelligence.
                            </p>

                            {/* Contact Badges */}
                            <div className="flex flex-wrap items-center gap-4 text-xs text-violet-200">
                                {organization?.contactName && (
                                    <span className="flex items-center gap-1.5 opacity-90">
                                        <Users size={13} className="text-violet-400" />
                                        Lead: <strong>{organization.contactName}</strong>
                                    </span>
                                )}
                                {organization?.contactEmail && (
                                    <span className="flex items-center gap-1.5 opacity-90">
                                        <Mail size={13} className="text-violet-400" />
                                        {organization.contactEmail}
                                    </span>
                                )}
                                {organization?.contactPhone && (
                                    <span className="flex items-center gap-1.5 opacity-90">
                                        <Phone size={13} className="text-violet-400" />
                                        {organization.contactPhone}
                                    </span>
                                )}
                                {organization?.website && (
                                    <a 
                                        href={organization.website} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="flex items-center gap-1.5 hover:underline text-violet-300"
                                    >
                                        <Globe size={13} />
                                        Website
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action CTAs */}
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <button
                            onClick={() => setIsBrandingModalOpen(true)}
                            className="flex-1 lg:flex-none px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-sm"
                        >
                            <Edit3 size={14} />
                            <span>Edit Branding</span>
                        </button>

                        <button
                            onClick={() => setIsInviteModalOpen(true)}
                            className="flex-1 lg:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 hover:opacity-95 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 cursor-pointer"
                        >
                            <UserPlus size={15} />
                            <span>Invite Team Members</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Total Seats */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Total Seats
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                            <Building2 size={18} />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-gray-900 dark:text-white">
                            {totalSeats}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                            {totalSeats >= 50 ? '$15/seat (25% off tier)' : '$20/seat (standard team)'}
                        </p>
                    </div>
                </div>

                {/* Active Learners */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Active Learners
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 size={18} />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                            {activeSeats}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                            {pendingSeats > 0 ? `${pendingSeats} pending invites waiting` : 'All seats accepted'}
                        </p>
                    </div>
                </div>

                {/* Available Seats */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Available Seats
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Users size={18} />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-gray-900 dark:text-white">
                            {availableSeats}
                        </div>
                        <p className="text-xs text-violet-600 dark:text-violet-400 font-semibold mt-1">
                            {availableSeats > 0 ? 'Ready for immediate invite' : 'Seat quota full'}
                        </p>
                    </div>
                </div>

                {/* Team Average Progress */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Avg Team Progress
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <TrendingUp size={18} />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-gray-900 dark:text-white">
                            {avgProgress}%
                        </div>
                        {/* Mini bar */}
                        <div className="w-full bg-gray-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                            <div 
                                className="bg-gradient-to-r from-violet-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(5, avgProgress))}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Roster & Course Progress Section */}
            <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
                {/* Section Controls */}
                <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            Corporate Seats & Course Performance
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                            Monitor team members, their assigned courses, and live learning progress
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExportCSV}
                            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                            <Download size={14} />
                            <span>Export CSV Report</span>
                        </button>

                        <button
                            onClick={() => setIsInviteModalOpen(true)}
                            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                            <UserPlus size={14} />
                            <span>Add Seat</span>
                        </button>
                    </div>
                </div>

                {/* Filters & Search Bar */}
                <div className="p-4 sm:px-6 bg-gray-50/60 dark:bg-slate-850/50 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    {/* Tabs */}
                    <div className="flex items-center gap-1 p-1 bg-gray-200/80 dark:bg-slate-800 rounded-xl text-xs font-bold w-full sm:w-auto">
                        <button
                            onClick={() => setFilterTab('all')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${filterTab === 'all' ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-gray-600 dark:text-slate-400'}`}
                        >
                            All Seats ({seats.length})
                        </button>
                        <button
                            onClick={() => setFilterTab('active')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${filterTab === 'active' ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-gray-600 dark:text-slate-400'}`}
                        >
                            Active Learners ({activeSeats})
                        </button>
                        <button
                            onClick={() => setFilterTab('pending')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${filterTab === 'pending' ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-gray-600 dark:text-slate-400'}`}
                        >
                            Invited ({pendingSeats})
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-72">
                        <Search size={14} className="absolute left-3.5 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search member, email, or course..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50/80 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                            <tr>
                                <th className="py-3.5 px-6">Team Member</th>
                                <th className="py-3.5 px-6">Seat Status</th>
                                <th className="py-3.5 px-6">Enrolled Courses</th>
                                <th className="py-3.5 px-6 min-w-[200px]">Course Progress</th>
                                <th className="py-3.5 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-gray-400">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-500"></div>
                                            <span>Loading corporate seats...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredSeats.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-gray-400">
                                        <Users className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                                        <p className="font-semibold text-gray-600 dark:text-slate-300">No seats found</p>
                                        <p className="text-[11px] text-gray-400 mt-1">Try adjusting your filters or invite new team members.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredSeats.map((seat) => {
                                    const isActive = seat.status === 'active';
                                    const coursesList = seat.enrolledCourses || [];

                                    return (
                                        <tr key={seat.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                            {/* Member Name and Email */}
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                                                        {(seat.name || seat.email).substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                            <span>{seat.name || 'Invited User'}</span>
                                                            {seat.isOwner ? (
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 flex items-center gap-1">
                                                                    <Shield size={10} /> Corporate Lead (Seat #1)
                                                                </span>
                                                            ) : seat.department && (
                                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700">
                                                                    {seat.department}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-gray-400 dark:text-slate-500 text-[11px]">
                                                            {seat.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="py-4 px-6">
                                                {isActive ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                        <CheckCircle2 size={12} className="text-emerald-500" />
                                                        Active Learner
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                                        <Clock size={12} className="text-amber-500" />
                                                        Pending Invite
                                                    </span>
                                                )}
                                            </td>

                                            {/* Courses List */}
                                            <td className="py-4 px-6">
                                                {coursesList.length === 0 ? (
                                                    <span className="text-gray-400 dark:text-slate-500 italic text-[11px]">
                                                        {isActive ? 'No courses enrolled yet' : 'Waiting for employee activation'}
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                                                        {coursesList.map((c: any, i: number) => (
                                                            <span
                                                                key={i}
                                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950/40 border border-violet-200/80 dark:border-violet-900/50 text-[11px] font-medium text-violet-700 dark:text-violet-300"
                                                            >
                                                                <BookOpen size={10} />
                                                                <span className="truncate max-w-[140px]">{c.courseTitle}</span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Progress Bar & Badges */}
                                            <td className="py-4 px-6">
                                                {coursesList.length === 0 ? (
                                                    <div className="text-gray-400 dark:text-slate-500 text-[11px]">
                                                        0% Progress
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1.5">
                                                        {coursesList.slice(0, 2).map((c: any, i: number) => (
                                                            <div key={i} className="space-y-1">
                                                                <div className="flex items-center justify-between text-[11px]">
                                                                    <span className="font-semibold text-gray-700 dark:text-slate-300 truncate max-w-[120px]">
                                                                        {c.courseTitle}
                                                                    </span>
                                                                    <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
                                                                        {c.progress}%
                                                                        {c.certificateEarned && (
                                                                            <Award size={12} className="text-amber-500" title="Certificate Earned" />
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <div className="w-full bg-gray-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full transition-all duration-300 ${
                                                                            c.progress === 100 
                                                                                ? 'bg-emerald-500' 
                                                                                : 'bg-gradient-to-r from-violet-600 to-indigo-600'
                                                                        }`}
                                                                        style={{ width: `${c.progress}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {seat.isOwner ? (
                                                        <span className="text-[11px] text-violet-600 dark:text-violet-400 font-bold px-2.5 py-1 bg-violet-50 dark:bg-violet-950/40 rounded-lg border border-violet-100 dark:border-violet-900/50">
                                                            Primary Seat
                                                        </span>
                                                    ) : (
                                                        <>
                                                            {!isActive && (
                                                                <button
                                                                    onClick={() => handleResendInvite(seat.id)}
                                                                    disabled={actionLoadingId === seat.id}
                                                                    className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-violet-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 hover:text-violet-600 transition-colors cursor-pointer"
                                                                    title="Resend Invitation Email"
                                                                >
                                                                    <Send size={13} />
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => handleRevokeSeat(seat.id)}
                                                                disabled={actionLoadingId === seat.id}
                                                                className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-950/50 text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
                                                                title="Revoke / Reassign Seat"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <CorporateBrandingModal
                isOpen={isBrandingModalOpen}
                onClose={() => setIsBrandingModalOpen(false)}
                organization={organization}
                onSaved={(updated) => {
                    setOrganization(updated);
                    setFeedbackMessage('Corporate branding updated successfully!');
                    setTimeout(() => setFeedbackMessage(null), 3000);
                }}
                userId={user?.id}
            />

            <InviteMembersModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                orgId={organization?.id || 'org-welile-corp'}
                availableSeats={availableSeats}
                onInvited={() => {
                    fetchCorporateData();
                    setFeedbackMessage('Invitations dispatched successfully!');
                    setTimeout(() => setFeedbackMessage(null), 3000);
                }}
                user={user}
            />
        </div>
    );
};
export default CorporateDashboard;
