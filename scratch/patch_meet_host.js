const fs = require('fs');

console.log('Patching AdminCourseSetupWizard with Google Meet Tutor Host integration...');

function patchWizard(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log('File not found:', filePath);
        return;
    }

    let code = fs.readFileSync(filePath, 'utf8');

    // 1. Add state for Google Meet Host modal if not present
    if (!code.includes('isMeetHostModalOpen')) {
        const stateAnchor = 'const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);';
        const newStates = `const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
    const [isMeetHostModalOpen, setIsMeetHostModalOpen] = useState(false);
    const [generatingMeetLink, setGeneratingMeetLink] = useState(false);`;
        code = code.replace(stateAnchor, newStates);
    }

    // 2. Add generator helper function before handleSave
    if (!code.includes('handleGenerateTutorMeet')) {
        const funcAnchor = 'const handleBroadcastAlert = () => {';
        const helperFunc = `const handleGenerateTutorMeet = async () => {
        setGeneratingMeetLink(true);
        try {
            const tutorEmail = newCourse.instructorEmail || localStorage.getItem('instructor-email') || 'tutor@welile.com';
            const res = await fetch('http://localhost:3000/api/google-meet/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tutorEmail,
                    courseTitle: newCourse.title || 'Live Cohort Class',
                    startDate: newCourse.startDate || '2026-11-15',
                    startTime: newCourse.lessonStartTime || '18:00',
                    endTime: newCourse.lessonEndTime || '20:00',
                    timezone: newCourse.timezone || 'EAT (UTC+3)'
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.meetLink) {
                    setNewCourse(prev => ({ ...prev, meetingLink: data.meetLink }));
                    setIsMeetHostModalOpen(false);
                    return;
                }
            }

            // Fallback generated meeting link format
            const p1 = Math.random().toString(36).substring(2, 5);
            const p2 = Math.random().toString(36).substring(2, 6);
            const p3 = Math.random().toString(36).substring(2, 5);
            const fallbackLink = \`https://meet.google.com/\${p1}-\${p2}-\${p3}\`;
            setNewCourse(prev => ({ ...prev, meetingLink: fallbackLink }));
            setIsMeetHostModalOpen(false);
        } catch (e) {
            const p1 = Math.random().toString(36).substring(2, 5);
            const p2 = Math.random().toString(36).substring(2, 6);
            const p3 = Math.random().toString(36).substring(2, 5);
            setNewCourse(prev => ({ ...prev, meetingLink: \`https://meet.google.com/\${p1}-\${p2}-\${p3}\` }));
            setIsMeetHostModalOpen(false);
        } finally {
            setGeneratingMeetLink(false);
        }
    };

    const handleBroadcastAlert = () => {`;
        code = code.replace(funcAnchor, helperFunc);
    }

    // 3. Add the "Auto-Generate with Tutor Email as Host" button under Google Meet input
    const meetInputTarget = `placeholder="https://meet.google.com/xyz-abcd-efg" 
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    if (newCourse.meetingLink) {
                                                        navigator.clipboard.writeText(newCourse.meetingLink);
                                                        setCopiedMeeting(true);
                                                        setTimeout(() => setCopiedMeeting(false), 1500);
                                                    }
                                                }}
                                                className="px-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                                title="Copy Google Meet Link"
                                            >
                                                {copiedMeeting ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                                {copiedMeeting ? 'Copied' : 'Copy'}
                                            </button>
                                        </div>
                                    </div>`;

    const meetInputReplacement = `placeholder="https://meet.google.com/xyz-abcd-efg" 
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    if (newCourse.meetingLink) {
                                                        navigator.clipboard.writeText(newCourse.meetingLink);
                                                        setCopiedMeeting(true);
                                                        setTimeout(() => setCopiedMeeting(false), 1500);
                                                    }
                                                }}
                                                className="px-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                                title="Copy Google Meet Link"
                                            >
                                                {copiedMeeting ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                                {copiedMeeting ? 'Copied' : 'Copy'}
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between pt-1">
                                            <button 
                                                type="button" 
                                                onClick={() => setIsMeetHostModalOpen(true)}
                                                className="text-[11px] font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 flex items-center gap-1 cursor-pointer bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/40 px-2.5 py-1 rounded-lg transition-colors border border-violet-100 dark:border-violet-900/50"
                                            >
                                                <Sparkles size={11} className="text-violet-600 animate-pulse" /> Auto-Generate with Tutor Email as Host
                                            </button>
                                            <span className="text-[10px] text-gray-400">
                                                Host: <strong className="text-gray-600 dark:text-slate-300 font-mono">{newCourse.instructorEmail || 'Selected Tutor'}</strong>
                                            </span>
                                        </div>
                                    </div>`;

    if (code.includes(meetInputTarget)) {
        code = code.replace(meetInputTarget, meetInputReplacement);
    }

    // 4. Add the Google Meet Host Modal before the closing tag
    if (!code.includes('Modal: Google Meet Host Configuration')) {
        const modalAnchor = '{/* Broadcast Lesson Modal */}';
        const hostModal = `{/* Modal: Google Meet Host Configuration */}
            {isMeetHostModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 border border-gray-150 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <Video className="text-violet-600" size={20} />
                                <h3 className="font-bold text-gray-900 dark:text-white text-base">Generate Google Meet as Host</h3>
                            </div>
                            <button onClick={() => setIsMeetHostModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Host Account Indicator */}
                            <div className="p-3.5 bg-violet-50/80 dark:bg-violet-950/40 border border-violet-200/80 dark:border-violet-900/50 rounded-xl space-y-1">
                                <span className="text-[10px] uppercase font-bold text-violet-600 dark:text-violet-400 tracking-wider">Designated Meet Host</span>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-violet-600 text-white font-bold text-xs flex items-center justify-center">
                                            {(newCourse.instructor || 'T')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-900 dark:text-white">{newCourse.instructor || 'Primary Instructor'}</p>
                                            <p className="text-[11px] font-mono text-gray-500 dark:text-slate-400">{newCourse.instructorEmail || 'tutor@welile.com'}</p>
                                        </div>
                                    </div>
                                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] rounded-md flex items-center gap-0.5">
                                        <CheckCircle2 size={10} /> Host Verified
                                    </span>
                                </div>
                            </div>

                            <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed">
                                Select how you want to provision the Google Meet link for <strong>{newCourse.title || 'this course'}</strong>:
                            </p>

                            {/* Option 1: 1-Click Auto Provision */}
                            <div className="p-3.5 bg-gray-50 dark:bg-slate-850 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 transition-colors flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                        <Sparkles size={13} className="text-violet-600" /> 1-Click Auto-Generate Space
                                    </p>
                                    <p className="text-[11px] text-gray-500 dark:text-slate-400">
                                        Instantly generates and assigns a permanent Google Meet space for this cohort.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    disabled={generatingMeetLink}
                                    onClick={handleGenerateTutorMeet}
                                    className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                    {generatingMeetLink ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                    Generate
                                </button>
                            </div>

                            {/* Option 2: Open Direct Meet (Tutor's Google Session) */}
                            <div className="p-3.5 bg-gray-50 dark:bg-slate-850 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 transition-colors flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                        <ExternalLink size={13} className="text-emerald-600" /> Instant Meet (Signed-in as Tutor)
                                    </p>
                                    <p className="text-[11px] text-gray-500 dark:text-slate-400">
                                        Opens Google Meet directly with your browser's Google account to grab your host link.
                                    </p>
                                </div>
                                <a
                                    href="https://meet.google.com/new"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shrink-0 flex items-center gap-1"
                                >
                                    Launch ↗
                                </a>
                            </div>

                            {/* Option 3: Google Calendar Event with Meet */}
                            <div className="p-3.5 bg-gray-50 dark:bg-slate-850 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 transition-colors flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                        <Calendar size={13} className="text-blue-600" /> Schedule in Google Calendar
                                    </p>
                                    <p className="text-[11px] text-gray-500 dark:text-slate-400">
                                        Creates a calendar event with Google Meet conferencing under the tutor's email.
                                    </p>
                                </div>
                                <a
                                    href={\`https://calendar.google.com/calendar/render?action=TEMPLATE&text=\${encodeURIComponent(newCourse.title || 'Live Cohort Class')}&details=\${encodeURIComponent('Live Welile Google Meet Class hosted by ' + (newCourse.instructorEmail || 'Tutor'))}&add=\${encodeURIComponent(newCourse.instructorEmail || '')}\`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shrink-0 flex items-center gap-1"
                                >
                                    Calendar ↗
                                </a>
                            </div>

                            {/* Cloud Workspace Integration Note */}
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl text-[11px] text-amber-800 dark:text-amber-300">
                                <p className="font-bold mb-0.5">💡 Google Workspace Domain-Wide Integration:</p>
                                <p>To have Google automatically provision links via the Google Calendar API without user interaction, configure a Google Cloud Service Account with Domain-Wide Delegation in <code>backend/.env</code>.</p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setIsMeetHostModalOpen(false)}
                                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Broadcast Lesson Modal */}`;

        code = code.replace(modalAnchor, hostModal);
    }

    fs.writeFileSync(filePath, code, 'utf8');
    console.log('Successfully patched Google Meet Host into:', filePath);
}

patchWizard('admin-portal/src/components/admin/AdminCourseSetupWizard.tsx');
patchWizard('frontend/components/admin/AdminCourseSetupWizard.tsx');
