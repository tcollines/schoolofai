import React, { createContext, useContext } from 'react';
import { AgentClient, AgentSummary, DailyRegSummary, RecentReg } from './shared';

/** Everything the Agent Supervision pages share. The state and handlers live in AgentSupervisionPage (the shell),
 *  so the selected officer, filters and data stay put when you move between pages. */
export interface SupervisionValue {
    agents: AgentSummary[];
    regSummary: DailyRegSummary[];
    recentRegs: RecentReg[];
    loading: boolean;

    summaryOfficer: string;
    setSummaryOfficer: (v: string) => void;
    summaryDate: string;
    setSummaryDate: (v: string) => void;
    summaryQuickRange: 'all' | 'today' | '7d';
    setSummaryQuickRange: (v: 'all' | 'today' | '7d') => void;

    openOfficerId: string | null;
    setOpenOfficerId: (v: string | null) => void;
    officerClients: AgentClient[] | null;
    officerClientsLoading: boolean;
    openOfficer: AgentSummary | null;
    openOfficerRoster: (staffId: string) => Promise<void>;

    regSearch: string;
    setRegSearch: (v: string) => void;
    regOfficerFilter: string;
    setRegOfficerFilter: (v: string) => void;

    newName: string;
    setNewName: (v: string) => void;
    newEmail: string;
    setNewEmail: (v: string) => void;
    newPhone: string;
    setNewPhone: (v: string) => void;
    newRole: string;
    setNewRole: (v: string) => void;
    newPassword: string;
    setNewPassword: (v: string) => void;
    creating: boolean;
    createError: string | null;
    createdAgent: { name: string; email: string; phone: string; password: string; staff_code?: string } | null;
    copiedKey: string | null;
    togglingId: string | null;
    handleCreateFieldAgent: (e: React.FormEvent) => Promise<void>;
    handleToggleActive: (agent: AgentSummary) => Promise<void>;
    copyText: (text: string, key: string) => Promise<void>;
    reload: () => Promise<void>;

    todayYmd: string;
    totals: { active: number; fieldOnly: number; registered: number; today: number; week: number; accounts: number; waiting: number; studying: number; completed: number };
    convPct: number;
    summaryOfficers: [string, string][];
    filteredRegSummary: DailyRegSummary[];
    summaryTotals: { total: number; opened: number; waiting: number };
    maxSummaryCount: number;
    sortedAgents: AgentSummary[];
    filteredRecentRegs: RecentReg[];
}

export const SupervisionContext = createContext<SupervisionValue | null>(null);

export function useSupervision(): SupervisionValue {
    const v = useContext(SupervisionContext);
    if (!v) throw new Error('useSupervision must be used inside the Agent Supervision shell');
    return v;
}
