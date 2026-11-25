import React from 'react';
import HubTabs, { HubTab, useHubTab } from './HubTabs';
import AdminPeople from './AdminPeople';
import AdminEnrollments from './AdminEnrollments';
import AdminRegistrations from './AdminRegistrations';

const TABS: HubTab[] = [
    { id: 'everyone', label: 'Everyone' },
    { id: 'directory', label: 'Directory' },
    { id: 'signups', label: 'Outreach sign-ups' },
];

const PeopleHub: React.FC = () => {
    const [tab, setTab] = useHubTab(TABS);
    return (
        <div>
            <HubTabs tabs={TABS} active={tab} onChange={setTab} label="People" />
            {tab === 'everyone' && <AdminPeople />}
            {tab === 'directory' && <AdminEnrollments />}
            {tab === 'signups' && <AdminRegistrations />}
        </div>
    );
};

export default PeopleHub;
