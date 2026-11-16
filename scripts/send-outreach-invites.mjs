#!/usr/bin/env node
// Welile School of AI - invitation emails for outreach registrants who are now registered for the free AI Fundamentals course.
//   node scripts/send-outreach-invites.mjs          send for real
//   node scripts/send-outreach-invites.mjs --dry    list how many would be sent; sends and records nothing
// Env: REMINDER_SECRET, SUPABASE_URL, SUPABASE_ANON_KEY, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_NAME, APP_URL
// Idempotent: the database only hands out invitations that have not been sent yet.

const DRY = process.argv.includes('--dry');
const env = (k, d = '') => (process.env[k] ?? d).toString().trim();
const SUPABASE_URL = env('SUPABASE_URL').replace(/\/+$/, '');
const ANON = env('SUPABASE_ANON_KEY');
const SECRET = env('REMINDER_SECRET');
const APP = (env('APP_URL') || 'https://www.welileschoolofai.org').replace(/\/+$/, '');
const BRAND = 'Welile School of AI';
const VIOLET = '#6d28d9';
const PAPER = '#faf8f5';
const log = (...a) => console.log(new Date().toISOString(), ...a);
if (!SUPABASE_URL || !ANON || !SECRET) { console.error('Missing SUPABASE_URL, SUPABASE_ANON_KEY or REMINDER_SECRET.'); process.exit(1); }

async function rpc(name, body) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, { method: 'POST', headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const text = await res.text();
    if (!res.ok) throw new Error(`${name} failed (${res.status}): ${text.slice(0, 300)}`);
    return text ? JSON.parse(text) : null;
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eat = (iso, o) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Kampala', hour12: false, ...o }).format(new Date(iso));
const whenEAT = iso => `${eat(iso, { weekday: 'long', day: 'numeric', month: 'long' })} at ${eat(iso, { hour: '2-digit', minute: '2-digit' })} East Africa Time`;
const firstName = n => { const f = String(n || '').trim().split(/\s+/)[0] || 'there'; return f.charAt(0).toUpperCase() + f.slice(1).toLowerCase(); };
const maskEmail = e => String(e || '').replace(/^(.).*(@.*)$/, '$1***$2');

const icsStamp = iso => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsText = s => String(s ?? '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([,;])/g, '\\$1');
const fold = l => { const o = []; let x = l; while (x.length > 74) { o.push(x.slice(0, 74)); x = ' ' + x.slice(74); } o.push(x); return o.join('\r\n'); };
const buildIcs = s => ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//${BRAND}//Live class//EN`, 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
    `UID:${s.id}@welile-school-of-ai`, `DTSTAMP:${icsStamp(new Date().toISOString())}`, `DTSTART:${icsStamp(s.starts_at)}`, `DTEND:${icsStamp(s.ends_at)}`,
    `SUMMARY:${icsText(s.title)}`, `DESCRIPTION:${icsText([s.description || 'Live class for the free AI Fundamentals course.', s.join_link ? `Join: ${s.join_link}` : ''].filter(Boolean).join('\n'))}`,
    `LOCATION:${icsText(s.join_link || 'Online')}`, 'STATUS:CONFIRMED', 'END:VEVENT', 'END:VCALENDAR'].map(fold).join('\r\n') + '\r\n';

function buildEmail(r) {
    const name = firstName(r.name);
    const link = `${APP}/free/ai-fundamentals`;
    const s = r.session;
    const subject = 'You are registered for the free AI Fundamentals course';
    const step = r.has_account
        ? `Your place is ready. Sign in with this email address (${r.email}) and open the course:`
        : `Your place is saved. Create your free account with this email address (${r.email}) and the course opens for you straight away:`;
    const live = s ? `Next live class: ${s.title}, ${whenEAT(s.starts_at)}.${s.join_link ? ` Join here: ${s.join_link}` : ''}` : 'Live classes run every Monday, Wednesday and Friday at 2:00 pm East Africa Time.';
    const text = [
        `Hello ${name},`, '',
        'You registered with Welile School of AI, and we have opened a place for you in our free course, AI Fundamentals: Use AI with Confidence. It teaches you to ask AI clearly, put it to work, check what it says, and use it fairly and safely.', '',
        step, link, '',
        live, 'Live classes are optional. If you join one, the lessons it covers count as done and you only take the quizzes for those modules.', '',
        'Tip: keep the course on your phone like an app. Open it in your phone browser and tap "Install app" (on iPhone: Share, then Add to Home Screen).', '',
        'Warm regards,', BRAND, '',
        'You are receiving this because you registered with Welile School of AI and agreed to be contacted.'
    ].join('\n');
    const html = `<!doctype html><html><body style="margin:0;padding:0;background:${PAPER};"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e7e2da;border-radius:14px;">
<tr><td style="padding:28px 28px 8px;font-family:Georgia,serif;color:${VIOLET};font-size:14px;letter-spacing:.04em;text-transform:uppercase;">${esc(BRAND)}</td></tr>
<tr><td style="padding:4px 28px 0;font-family:Georgia,serif;color:#1f1b2e;font-size:24px;line-height:1.3;">You are registered for AI Fundamentals</td></tr>
<tr><td style="padding:12px 28px 0;font-family:Arial,Helvetica,sans-serif;color:#3b3650;font-size:16px;line-height:1.6;">
<p style="margin:0 0 12px;">Hello ${esc(name)},</p>
<p style="margin:0 0 12px;">You registered with Welile School of AI, and we have opened a place for you in our <strong>free</strong> course, <em>AI Fundamentals: Use AI with Confidence</em>. You will learn to ask AI clearly, put it to work, check what it says, and use it fairly and safely.</p>
<p style="margin:0 0 12px;">${esc(step)}</p></td></tr>
<tr><td style="padding:4px 28px;"><a href="${esc(link)}" style="display:inline-block;background:${VIOLET};color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;padding:12px 22px;border-radius:10px;">${r.has_account ? 'Open the course' : 'Create my free account'}</a></td></tr>
<tr><td style="padding:14px 28px 0;font-family:Arial,Helvetica,sans-serif;color:#3b3650;font-size:15px;line-height:1.6;"><p style="margin:0 0 10px;padding:12px 14px;background:${PAPER};border-radius:10px;">${s ? `<strong>Next live class:</strong> ${esc(s.title)}<br>${esc(whenEAT(s.starts_at))}${s.join_link ? `<br><a href="${esc(s.join_link)}" style="color:${VIOLET};">Join the live class</a>` : ''}` : '<strong>Live classes</strong> run every Monday, Wednesday and Friday at 2:00 pm East Africa Time.'}</p>
<p style="margin:0 0 10px;">Live classes are optional. If you join one, the lessons it covers count as done and you only take the quizzes for those modules.</p>
<p style="margin:0;"><strong>Tip:</strong> keep the course on your phone like an app. Open it in your phone browser and tap &ldquo;Install app&rdquo; (on iPhone: Share, then Add to Home Screen).</p></td></tr>
<tr><td style="padding:18px 28px 26px;font-family:Arial,Helvetica,sans-serif;color:#6b6580;font-size:12px;line-height:1.6;">You are receiving this because you registered with Welile School of AI and agreed to be contacted.</td></tr>
</table></td></tr></table></body></html>`;
    return { subject, text, html };
}

async function main() {
    log(DRY ? 'DRY RUN: nothing will be sent or recorded.' : 'Starting invitation run.');
    const due = (await rpc('outreach_invites_due', { p_secret: SECRET })) || [];
    log(`${due.length} invitation(s) due.`);
    if (!due.length || DRY) { if (DRY) due.forEach(r => log('[dry] would send to', maskEmail(r.email), r.has_account ? '(has account)' : '(new)')); return; }
    if (!(env('SMTP_HOST') && env('SMTP_USER') && env('SMTP_PASS'))) throw new Error('SMTP settings are not all set.');
    const nodemailer = (await import('nodemailer')).default;
    const port = Number(env('SMTP_PORT', '587'));
    const tx = nodemailer.createTransport({ host: env('SMTP_HOST'), port, secure: port === 465, auth: { user: env('SMTP_USER'), pass: env('SMTP_PASS') } });
    const fromName = env('SMTP_FROM_NAME', BRAND).replace(/"/g, '');
    const results = []; let sent = 0, failed = 0;
    for (const r of due) {
        try {
            const m = buildEmail(r);
            const mail = { from: `"${fromName}" <${env('SMTP_USER')}>`, to: r.email, subject: m.subject, text: m.text, html: m.html };
            if (r.session) mail.attachments = [{ filename: 'live-class.ics', content: buildIcs(r.session), contentType: 'text/calendar; charset=utf-8; method=PUBLISH' }];
            await tx.sendMail(mail);
            sent++; results.push({ reg_no: r.reg_no, status: 'sent' }); log('sent ->', maskEmail(r.email));
        } catch (e) { failed++; results.push({ reg_no: r.reg_no, status: 'failed' }); log('FAILED ->', maskEmail(r.email), '-', e.message); }
    }
    try { await rpc('outreach_invites_mark', { p_secret: SECRET, p_rows: results }); } catch (e) { log('WARNING: could not record results:', e.message); }
    log(`Done. sent=${sent} failed=${failed}`);
}
main().catch(e => { console.error('Run failed:', e.message); process.exit(1); });
