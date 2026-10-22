const fs = require('fs');

console.log('Preparing patch for Auto-Generated Attendance Codes...');

// 1. Patch AdminCourseSetupWizard.tsx in both admin-portal and frontend
function patchWizard(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log('File not found:', filePath);
        return;
    }
    let code = fs.readFileSync(filePath, 'utf8');

    // Replace the manual attendance code input with the auto-generated per-lesson notice
    const oldPinBlock = `{/* Attendance Code */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-xs font-bold uppercase text-gray-500">Student Attendance PIN / Code</label>
                                            <span className="text-[10px] text-gray-400">Verifies live presence</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input 
                                                    value={newCourse.attendanceCode || ''} 
                                                    onChange={e => setNewCourse({...newCourse, attendanceCode: e.target.value.toUpperCase()})} 
                                                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold tracking-wider text-violet-700 dark:text-violet-300 outline-none focus:ring-2 focus:ring-violet-500 uppercase" 
                                                    placeholder="WEL-8492" 
                                                />
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={generateAttendanceCode}
                                                className="px-3 bg-violet-100 hover:bg-violet-200 dark:bg-violet-950/60 dark:hover:bg-violet-900/60 text-violet-700 dark:text-violet-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                                                title="Generate new attendance PIN"
                                            >
                                                <Key size={14} /> Generate Code
                                            </button>
                                        </div>
                                    </div>`;

    const newPinBlock = `{/* Live Lesson Attendance PINs: Auto-Generated */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-xs font-bold uppercase text-gray-500">Live Lesson Attendance PINs</label>
                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Auto-Generated Per Lesson
                                            </span>
                                        </div>
                                        <div className="p-2.5 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40 border border-violet-200 dark:border-violet-900/50 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-1.5 bg-violet-100 dark:bg-violet-900/60 text-violet-600 dark:text-violet-300 rounded-lg">
                                                    <Key size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-violet-950 dark:text-violet-100">Auto-Generated For Every Live Lesson</p>
                                                    <p className="text-[11px] text-violet-700 dark:text-violet-300">Each live session automatically receives its own unique attendance PIN under your Tutor Dashboard.</p>
                                                </div>
                                            </div>
                                            <span className="hidden sm:inline-flex items-center px-2 py-0.5 bg-white/80 dark:bg-slate-900/80 text-violet-700 dark:text-violet-300 rounded-md font-mono text-[11px] font-bold border border-violet-200 dark:border-violet-800">
                                                WEL-XXXX
                                            </span>
                                        </div>
                                    </div>`;

    if (code.includes(oldPinBlock)) {
        code = code.replace(oldPinBlock, newPinBlock);
        console.log('Successfully replaced attendance block in', filePath);
    } else {
        console.log('Could not find exact oldPinBlock in', filePath);
    }

    // Also update addTopic to generate a unique attendance code per topic
    const oldAddTopic = `const newTopic: CourseModule = {
            id: Math.random().toString(36).substring(7),
            title: \`Topic \${nextTopicNum}: \`,
            duration: '45 mins',
            type: 'article',
            classType: 'online',
            meetLink: newCourse.meetingLink || '',
            description: ''
        };`;

    const newAddTopic = `const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let pinCode = 'WEL-';
        for (let i = 0; i < 4; i++) pinCode += chars.charAt(Math.floor(Math.random() * chars.length));
        const newTopic: CourseModule = {
            id: Math.random().toString(36).substring(7),
            title: \`Topic \${nextTopicNum}: \`,
            duration: '45 mins',
            type: 'article',
            classType: 'online',
            meetLink: newCourse.meetingLink || '',
            attendanceCode: pinCode,
            description: ''
        };`;

    if (code.includes(oldAddTopic)) {
        code = code.replace(oldAddTopic, newAddTopic);
        console.log('Updated addTopic in', filePath);
    }

    // Update topic rendering in Step 4 to show the auto-assigned attendance PIN badge
    const oldTopicInputEnd = `placeholder={isQuiz ? "Quiz Title" : "Topic title / live lecture subject"}
                                                                />
                                                            </div>`;

    const newTopicInputEnd = `placeholder={isQuiz ? "Quiz Title" : "Topic title / live lecture subject"}
                                                                />
                                                                {!isQuiz && (
                                                                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/60 shrink-0" title="Auto-generated attendance code for this live lesson">
                                                                        <Key size={10} /> {topic.attendanceCode || 'Auto-PIN'}
                                                                    </span>
                                                                )}
                                                            </div>`;

    if (code.includes(oldTopicInputEnd)) {
        code = code.replace(oldTopicInputEnd, newTopicInputEnd);
        console.log('Updated topic rendering in', filePath);
    }

    // Update Step 5 Course Overview summary for attendance
    const oldStep5Pin = `{newCourse.attendanceCode || 'WEL-8492'}`;
    // Replace the step 5 attendance pin display
    code = code.replace(
        `<span className="text-gray-400 block text-[10px] uppercase font-bold">Attendance PIN</span>\n                                                <span className="text-xs font-mono font-bold text-purple-700 dark:text-purple-400">\n                                                    {newCourse.attendanceCode || 'WEL-8492'}\n                                                </span>`,
        `<span className="text-gray-400 block text-[10px] uppercase font-bold">Attendance PINs</span>\n                                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">\n                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Auto-Generated Per Lesson\n                                                </span>`
    );

    // Ensure handleSave guarantees attendanceCode on all topics and default course
    const oldHandleSavePrep = `attendanceCode: newCourse.attendanceCode || '',`;
    const newHandleSavePrep = `attendanceCode: newCourse.attendanceCode || 'WEL-' + Math.floor(1000 + Math.random() * 9000),`;
    if (code.includes(oldHandleSavePrep)) {
        code = code.replace(oldHandleSavePrep, newHandleSavePrep);
    }

    fs.writeFileSync(filePath, code, 'utf8');
    console.log('Completed patching wizard:', filePath);
}

patchWizard('admin-portal/src/components/admin/AdminCourseSetupWizard.tsx');
patchWizard('frontend/components/admin/AdminCourseSetupWizard.tsx');
