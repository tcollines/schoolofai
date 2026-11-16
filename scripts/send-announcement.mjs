#!/usr/bin/env node
// Welile School of AI - one-time announcement email to everyone registered for the free course.
//   node scripts/send-announcement.mjs [--dry]
// Env: REMINDER_SECRET, SUPABASE_URL, SUPABASE_ANON_KEY, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_NAME, APP_URL, ANNOUNCE_KEY
// Idempotent per ANNOUNCE_KEY: each person gets a given announcement once.

const DRY = process.argv.includes('--dry');
const env = (k, d = '') => (process.env[k] ?? d).toString().trim();
const SUPABASE_URL = env('SUPABASE_URL').replace(/\/+$/, '');
const ANON = env('SUPABASE_ANON_KEY');
const SECRET = env('REMINDER_SECRET');
const KEY = env('ANNOUNCE_KEY', 'all-modules-open-2026-11-16');
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
const firstName = n => { const f = String(n || '').trim().split(/\s+/)[0] || 'there'; return f.charAt(0).toUpperCase() + f.slice(1).toLowerCase(); };
const maskEmail = e => String(e || '').replace(/^(.).*(@.*)$/, '$1***$2');

function buildEmail(r) {
    const name = firstName(r.name);
    const link = `${APP}/learn/ai-fundamentals`;
    const subject = 'All 6 modules of AI Fundamentals are now open';
    const points = [
        'All six modules are open: What AI really is, How to talk to AI, Make AI work for you, When AI gets it wrong, Fair and private, and Using AI responsibly.',
        'Lessons open one at a time. You can see the whole lineup, and each lesson opens when you finish the one before it, so everything builds step by step.',
        'Each module ends with a short quiz (70% to pass). When every lesson and quiz is done, take the final assessment (20 questions, 80% to pass) and get your certificate.',
        'Live classes run every Monday, Wednesday and Friday at 2:00 pm East Africa Time, two modules each. If you join a class, the lessons it covers count as done and you only take the quizzes for those modules.',
        'Tip: keep the course on your phone like an app. Open it in your phone browser and tap "Install app" (on iPhone: Share, then Add to Home Screen).'
    ];
    const text = [`Hello ${name},`, '', 'Good news: the whole course is now open for you.', '', ...points.map(p => `- ${p}`), '', `Continue where you left off: ${link}`, '', 'Warm regards,', BRAND, '', 'You are receiving this because you registered for the free AI Fundamentals course.'].join('\n');
    const html = `<!doctype html><html><body style="margin:0;padding:0;background:${PAPER};"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e7e2da;border-radius:14px;">
<tr><td style="padding:28px 28px 8px;font-family:Georgia,serif;color:${VIOLET};font-size:14px;letter-spacing:.04em;text-transform:uppercase;">${esc(BRAND)}</td></tr>
<tr><td style="padding:4px 28px 0;font-family:Georgia,serif;color:#1f1b2e;font-size:24px;line-height:1.3;">The whole course is now open</td></tr>
<tr><td style="padding:12px 28px 0;font-family:Arial,Helvetica,sans-serif;color:#3b3650;font-size:16px;line-height:1.6;"><p style="margin:0 0 12px;">Hello ${esc(name)},</p><p style="margin:0 0 12px;">Good news: all six modules of <strong>AI Fundamentals</strong> are now open for you.</p>
<ul style="margin:0 0 12px;padding-left:20px;">${points.map(p => `<li style="margin:0 0 8px;">${esc(p)}</li>`).join('')}</ul></td></tr>
<tr><td style="padding:4px 28px 6px;"><a href="${esc(link)}" style="display:inline-block;background:${VIOLET};color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;padding:12px 22px;border-radius:10px;">Continue the course</a></td></tr>
<tr><td style="padding:18px 28px 26px;font-family:Arial,Helvetica,sans-serif;color:#6b6580;font-size:12px;line-height:1.6;">You are receiving this because you registered for the free AI Fundamentals course.</td></tr>
</table></td></tr></table></body></html>`;
    return { subject, text, html };
}

async function main() {
    log(DRY ? 'DRY RUN: nothing will be sent or recorded.' : `Starting announcement run (${KEY}).`);
    const due = (await rpc('announcement_due', { p_secret: SECRET, p_key: KEY })) || [];
    log(`${due.length} recipient(s) due.`);
    if (!due.length || DRY) { if (DRY) due.slice(0, 5).forEach(r => log('[dry] e.g.', maskEmail(r.email))); return; }
    if (!(env('SMTP_HOST') && env('SMTP_USER') && env('SMTP_PASS'))) throw new Error('SMTP settings are not all set.');
    const nodemailer = (await import('nodemailer')).default;
    const port = Number(env('SMTP_PORT', '587'));
    const tx = nodemailer.createTransport({ host: env('SMTP_HOST'), port, secure: port === 465, auth: { user: env('SMTP_USER'), pass: env('SMTP_PASS') } });
    const fromName = env('SMTP_FROM_NAME', BRAND).replace(/"/g, '');
    const results = []; let sent = 0, failed = 0;
    for (const r of due) {
        try {
            const m = buildEmail(r);
            await tx.sendMail({ from: `"${fromName}" <${env('SMTP_USER')}>`, to: r.email, subject: m.subject, text: m.text, html: m.html });
            sent++; results.push({ user_id: r.user_id, status: 'sent' });
        } catch (e) { failed++; results.push({ user_id: r.user_id, status: 'failed' }); log('FAILED ->', maskEmail(r.email), '-', e.message); }
        if (results.length % 25 === 0) { try { await rpc('announcement_mark', { p_secret: SECRET, p_key: KEY, p_rows: results.splice(0, results.length) }); } catch (e) { log('WARNING: could not record results:', e.message); } }
    }
    if (results.length) { try { await rpc('announcement_mark', { p_secret: SECRET, p_key: KEY, p_rows: results }); } catch (e) { log('WARNING: could not record results:', e.message); } }
    log(`Done. sent=${sent} failed=${failed}`);
}
main().catch(e => { console.error('Run failed:', e.message); process.exit(1); });
