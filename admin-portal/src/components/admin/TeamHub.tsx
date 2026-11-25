import React from 'react';
import HubTabs, { HubTab, useHubTab } from './HubTabs';
import AdminAgents from './AdminAgents';
import AdminStaff from './AdminStaff';

const TABS: HubTab[] = [
    { id: 'agents', label: 'Agents' },
    { id: 'staff', label: 'Staff and links' },
    { id: 'supervision', label: 'Supervision' },
];

// The admin console and the student site are separate apps; supervision lives on the main site.
const mainSiteUrl = (path: string) => {
    const { protocol, hostname, port } = window.location;
    const host = hostname.replace(/^(admin|instructor)\./, '');
    return `${protocol}//${host}${port ? `:${port}` : ''}${path}`;
};

const SupervisionCard: React.FC = () => (
    <div className="mt-3 rounded-[18px] border border-stone-200 dark:border-slate-700 bg-white dark:bg-night-2 p-5">
        <h3 className="m-0 text-lg font-extrabold">Agent Supervision</h3>
        <p className="mt-1 mb-4 text-sm text-stone-600 dark:text-slate-300">See how each agent is doing, add new agents, follow up registrations and copy agent links.</p>
        <a href={mainSiteUrl('/supervision')} className="inline-flex items-center justify-center min-h-[48px] px-5 rounded-[12px] bg-brand text-white font-bold text-sm">Open Agent Supervision</a>
    </div>
);

const TeamHub: React.FC = () => {
    const [tab, setTab] = useHubTab(TABS);
    return (
        <div>
            <HubTabs tabs={TABS} active={tab} onChange={setTab} label="Team" />
            {tab === 'agents' && <AdminAgents />}
            {tab === 'staff' && <AdminStaff />}
            {tab === 'supervision' && <SupervisionCard />}
        </div>
    );
};

export default TeamHub;
