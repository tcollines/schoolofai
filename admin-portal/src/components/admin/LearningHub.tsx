import React from 'react';
import HubTabs, { HubTab, useHubTab } from './HubTabs';
import AdminFreeCourse from './AdminFreeCourse';
import AdminLiveSessions from './AdminLiveSessions';
import AdminCourses from './AdminCourses';
import CohortScheduler from './CohortScheduler';
import AdminExams from './AdminExams';
import AdminEvents from './AdminEvents';
import AdminInstructors from './AdminInstructors';

const TABS: HubTab[] = [
    { id: 'free', label: 'Free course' },
    { id: 'live', label: 'Live classes' },
    { id: 'courses', label: 'Courses' },
    { id: 'cohorts', label: 'Cohorts' },
    { id: 'exams', label: 'Exams' },
    { id: 'events', label: 'Events' },
    { id: 'instructors', label: 'Instructors' },
];

const LearningHub: React.FC = () => {
    const [tab, setTab] = useHubTab(TABS);
    return (
        <div>
            <HubTabs tabs={TABS} active={tab} onChange={setTab} label="Learning" />
            {tab === 'free' && <AdminFreeCourse />}
            {tab === 'live' && <AdminLiveSessions />}
            {tab === 'courses' && <AdminCourses isInstructor={false} />}
            {tab === 'cohorts' && <CohortScheduler />}
            {tab === 'exams' && <AdminExams isInstructor={false} />}
            {tab === 'events' && <AdminEvents />}
            {tab === 'instructors' && <AdminInstructors />}
        </div>
    );
};

export default LearningHub;
