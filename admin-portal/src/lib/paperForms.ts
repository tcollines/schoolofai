// Paper forms: registrations that agents took on paper before the digital switch.
// Pavin enters them here with the date written on the form, the agent and the location, and each student is credited to that agent.
import { supabaseClient } from './supabaseClient';
import { invalidatePeople } from './peopleCache';

export interface AgentOption {
    id: string;
    display_name: string;
    staff_code: string | null;
    agent_type: string | null;
    active: boolean;
    user_id: string | null;
}

/** One student on a paper form, as it is typed or pasted. Every field is text so it can be edited freely. */
export interface PaperStudent {
    id: string;
    name: string;
    phone: string;
    email: string;
    location: string;
}

/** What the database expects for each student. */
export interface PaperRowPayload {
    name: string;
    phone: string;
    email: string | null;
    location: string | null;
    registered_on: string;
    agent_id: string;
    note: string | null;
}

export interface SkippedRow { row: number; name: string; reason: string }
export interface ImportResult { ok: boolean; inserted: number; total: number; skipped: SkippedRow[]; error?: string }

/** The database accepts at most this many students per call. Longer lists are sent in several calls. */
export const MAX_PER_CALL = 300;

export const newId = () => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** All agents, including inactive ones, because old paper forms can belong to people who have since left. */
export async function listAgents(): Promise<{ agents: AgentOption[]; error: string | null }> {
    try {
        const { data, error } = await supabaseClient
            .from('staff_members')
            .select('id, display_name, staff_code, agent_type, active, user_id')
            .order('display_name', { ascending: true });
        if (error) return { agents: [], error: error.message };
        return { agents: ((data || []) as AgentOption[]).map(a => ({ ...a, active: a.active !== false })), error: null };
    } catch (e) {
        return { agents: [], error: e instanceof Error ? e.message : 'Could not load the agents' };
    }
}

/** "Name (CODE)" with "inactive" for agents who are no longer active. */
export const agentLabel = (a: Pick<AgentOption, 'display_name' | 'staff_code' | 'active'>) =>
    `${a.display_name}${a.staff_code ? ` (${a.staff_code})` : ''}${a.active ? '' : ' · inactive'}`;

/** Saves students to the database. Never throws. `skipped[].row` is the 0-based position in the list that was sent. */
export async function importPaperForms(rows: PaperRowPayload[]): Promise<ImportResult> {
    const out: ImportResult = { ok: true, inserted: 0, total: rows.length, skipped: [] };
    try {
        for (let start = 0; start < rows.length; start += MAX_PER_CALL) {
            const chunk = rows.slice(start, start + MAX_PER_CALL);
            const { data, error } = await supabaseClient.rpc('admin_import_paper_forms', { p_rows: chunk });
            invalidatePeople();
            if (error) {
                // Stop here: the students from earlier calls are already saved, and the rest were not sent.
                return { ...out, ok: false, error: error.message };
            }
            const d = (data || {}) as { ok?: boolean; inserted?: number; skipped?: SkippedRow[] };
            out.inserted += Number(d.inserted || 0);
            (d.skipped || []).forEach(s => out.skipped.push({ ...s, row: Number(s.row) + start }));
        }
        return out;
    } catch (e) {
        return { ...out, ok: false, error: e instanceof Error ? e.message : 'Could not save the students' };
    }
}

const looksLikeEmail = (s: string) => /\S+@\S+/.test(s);

/** Turns pasted lines into students. Each line is name, phone, then optionally email and location,
 *  separated by tabs, semicolons or commas. A third value without an @ is treated as the location. */
export function parsePasted(text: string, defaultLocation = ''): { students: PaperStudent[]; unreadable: string[] } {
    const students: PaperStudent[] = [];
    const unreadable: string[] = [];
    text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach(line => {
        const sep = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
        const parts = line.split(sep).map(p => p.trim());
        const [name = '', phone = '', third = '', fourth = ''] = parts;
        if (!name || !phone) { unreadable.push(line); return; }
        let email = '';
        let location = '';
        if (looksLikeEmail(third)) { email = third; location = fourth; }
        else if (looksLikeEmail(fourth)) { email = fourth; location = third; }
        else { location = third || fourth; }
        students.push({ id: newId(), name, phone, email, location: location || defaultLocation });
    });
    return { students, unreadable };
}
