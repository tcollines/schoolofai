// How a person came to us. Used by the People page and the learner explorer so both group people the same way.
export const CHANNELS = ['Registered by an agent', "Through an agent's link", 'Outreach event', 'Self sign-up'] as const;
export type Channel = typeof CHANNELS[number];

export const channelOf = (r: { sources?: string[] | null; agent?: string | null }): Channel => {
    const s = (r.sources || []).map(x => String(x).toLowerCase());
    if (s.some(x => x.includes('agent registered'))) return 'Registered by an agent';
    if (s.some(x => x.includes('agent link')) || (r.agent && !s.some(x => x.includes('outreach')))) return "Through an agent's link";
    if (s.some(x => x.includes('outreach'))) return 'Outreach event';
    return 'Self sign-up';
};
