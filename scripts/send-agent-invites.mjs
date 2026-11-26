#!/usr/bin/env node
// Welile School of AI - automatic account invitations for people an agent registered with an email.
// Runs on a schedule (see .github/workflows/send-agent-invites.yml). Asks the database who has no account and has not
// been invited yet, emails them a link to open their account (credited to their agent), then records the result.
//   node scripts/send-agent-invites.mjs [--dry]
// Env: REMINDER_SECRET, SUPABASE_URL, SUPABASE_ANON_KEY, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_NAME, APP_URL
// Logs never print a full email address (the repository is public): addresses are masked.
const DRY = process.argv.includes('--dry');
const env = (k, d = '') => (process.env[k] ?? d).toString().trim();
const BRAND = 'Welile School of AI';
const VIOLET = '#6d28d9', PAPER = '#faf8f5';
const SECRET = env('REMINDER_SECRET'), SUPABASE_URL = env('SUPABASE_URL').replace(/\/+$/, ''), ANON = env('SUPABASE_ANON_KEY');
const APP_URL = (env('APP_URL') || 'https://www.welileschoolofai.org').replace(/\/+$/, '');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const first = n => { const f = String(n || '').trim().split(/\s+/)[0] || 'there'; return f.charAt(0).toUpperCase() + f.slice(1).toLowerCase(); };
const mask = e => String(e || '').replace(/^(.).*(@.*)$/, '$1***$2');
const log = (...a) => console.log(...a);

if (!SUPABASE_URL || !ANON || !SECRET) { console.error('Missing SUPABASE_URL, SUPABASE_ANON_KEY or REMINDER_SECRET.'); process.exit(1); }

async function rpc(name, body) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
        method: 'POST', headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`${name} failed (${res.status}): ${text.slice(0, 200)}`);
    return text ? JSON.parse(text) : null;
}

/** The next two live classes (Wednesday and Friday, 2:00 pm East Africa Time) that are still at least 2 hours away. */
function nextClasses(now = Date.now()) {
    const out = [];
    for (let d = 0; d < 15 && out.length < 2; d++) {
        const probe = new Date(now + d * 86400000);
        const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Kampala', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })
            .formatToParts(probe).map(p => [p.type, p.value]));
        if (parts.weekday !== 'Wed' && parts.weekday !== 'Fri') continue;
        const at = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), 11, 0); // 2:00 pm EAT = 11:00 UTC
        if (at > now + 2 * 3600000) out.push(new Date(at));
    }
    return out.map(d => d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Kampala' }).replace(',', ''));
}

function build(r) {
    const name = first(r.name), agent = first(r.agent);
    const link = `${APP_URL}/join/${encodeURIComponent(String(r.slug || '').toLowerCase())}`;
    const next = nextClasses();
    const classes = 'live classes on Wednesday and Friday at 2:00 pm East Africa Time' + (next.length ? ` (the next ones are ${next.join(' and ')})` : '');
    const subject = 'One last step to open your free Fundamentals of AI account';
    const text = [`Hello ${name},`, '',
        `${agent} from Welile School of AI registered you for our free Fundamentals of AI course. One last step: open your own account so you can start learning.`, '',
        `Open your account here (it takes about a minute): ${link}`, '',
        'You can use your Google account or an email and password. If you use email, we will send you a link to confirm it. The link stays valid for 24 hours. Check your spam folder if you do not see it.', '',
        `What you get: free lessons you can do on your phone, ${classes}, and a free certificate.`, '',
        'If you would rather not hear from us, just reply to this email and we will leave you alone.', '',
        'Warm regards,', BRAND].join('\n');
    const html = `<!doctype html><html><body style="margin:0;padding:0;background:${PAPER};"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e7e2da;border-radius:14px;">
<tr><td style="padding:28px 28px 8px;font-family:Georgia,serif;color:${VIOLET};font-size:14px;letter-spacing:.04em;text-transform:uppercase;">${esc(BRAND)}</td></tr>
<tr><td style="padding:4px 28px 0;font-family:Georgia,serif;color:#1f1b2e;font-size:24px;line-height:1.3;">One last step to start learning</td></tr>
<tr><td style="padding:12px 28px 0;font-family:Arial,Helvetica,sans-serif;color:#3b3650;font-size:16px;line-height:1.6;">
<p style="margin:0 0 12px;">Hello ${esc(name)},</p>
<p style="margin:0 0 12px;">${esc(agent)} from Welile School of AI registered you for our free <strong>Fundamentals of AI</strong> course. One last step: open your own account so you can start learning.</p>
<p style="margin:0 0 12px;">You can use your <strong>Google account</strong>, or an email and password. If you use email, we will send you a link to confirm it. The link stays valid for 24 hours. Check your spam folder if you do not see it.</p>
<p style="margin:0 0 12px;">What you get: free lessons on your phone, ${esc(classes)}, and a free certificate.</p></td></tr>
<tr><td style="padding:4px 28px 6px;"><a href="${esc(link)}" style="display:inline-block;background:${VIOLET};color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;padding:12px 22px;border-radius:10px;">Open my account</a></td></tr>
<tr><td style="padding:18px 28px 26px;font-family:Arial,Helvetica,sans-serif;color:#6b6580;font-size:12px;line-height:1.6;">You are receiving this because ${esc(agent)} registered you with your permission. If you would rather not hear from us, reply to this email and we will leave you alone.</td></tr>
</table></td></tr></table></body></html>`;
    return { subject, text, html, link };
}

async function main() {
    const due = (await rpc('registration_invites_due', { p_secret: SECRET, p_limit: 30 })) || [];
    log(`${due.length} invitation(s) due.`);
    if (!due.length) return;
    if (DRY) { due.forEach(r => log('[dry]', first(r.name), mask(r.email), 'agent:', first(r.agent), 'link ok:', !!r.slug)); return; }
    if (!(env('SMTP_HOST') && env('SMTP_USER') && env('SMTP_PASS'))) throw new Error('SMTP settings are not all set.');
    const nodemailer = (await import('nodemailer')).default;
    const port = Number(env('SMTP_PORT', '587'));
    const tx = nodemailer.createTransport({ host: env('SMTP_HOST'), port, secure: port === 465, auth: { user: env('SMTP_USER'), pass: env('SMTP_PASS') } });
    const fromName = env('SMTP_FROM_NAME', BRAND).replace(/"/g, '');
    const results = [];
    const flush = async () => {
        if (!results.length) return;
        const batch = results.splice(0, results.length);
        try { await rpc('registration_invites_mark', { p_secret: SECRET, p_rows: batch }); }
        catch (e) { log('WARNING: could not record results:', e.message); }
    };
    let sent = 0, failed = 0;
    for (const r of due) {
        try {
            if (!r.slug) throw new Error('agent has no link name');
            const m = build(r);
            await tx.sendMail({ from: `"${fromName}" <${env('SMTP_USER')}>`, to: r.email, subject: m.subject, text: m.text, html: m.html });
            sent++; log('sent', mask(r.email));
            results.push({ email: r.email, name: r.name, staff_id: r.staff_id, ok: true });
        } catch (e) {
            failed++; log('FAILED', mask(r.email), String(e.message).slice(0, 120));
            results.push({ email: r.email, name: r.name, staff_id: r.staff_id, ok: false, error: String(e.message).slice(0, 250) });
        }
        if (results.length >= 10) await flush();
        await new Promise(res => setTimeout(res, 400));
    }
    await flush();
    log(`Done. sent=${sent} failed=${failed}`);
}

main().catch(e => { console.error('Run failed:', e.message); process.exit(1); });
