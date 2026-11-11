#!/usr/bin/env node
// Welile School of AI - live class reminders (email + WhatsApp).
// Run every ~15 minutes (see .github/workflows/live-class-reminders.yml).
//
//   node scripts/send-reminders.mjs          send for real
//   node scripts/send-reminders.mjs --dry    print what would be sent; sends and records nothing
//
// Required env : REMINDER_SECRET, SUPABASE_URL, SUPABASE_ANON_KEY
// Email (SMTP) : SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_NAME (default "Welile School of AI"),
//                SMTP_FROM_EMAIL (optional; defaults to SMTP_USER)
// WhatsApp     : WHATSAPP_TOKEN, WHATSAPP_PHONE_ID (Meta Cloud API). Needs an APPROVED template with 4 body
//                variables: {{1}} first name, {{2}} class title, {{3}} when, {{4}} join link.
//                WHATSAPP_TEMPLATE_NAME (default live_class_reminder), WHATSAPP_TEMPLATE_LANG (default en)
// Optional     : APP_URL (link shown for changing reminder settings)
//
// Idempotent: the database hands out only reminders not yet logged as sent, and logs each one after sending.
// If a channel is not configured it is skipped WITHOUT recording anything, so it is picked up once configured.

const DRY = process.argv.includes('--dry');
const env = (k, d = '') => (process.env[k] ?? d).toString().trim();

const SUPABASE_URL = env('SUPABASE_URL').replace(/\/+$/, '');
const ANON = env('SUPABASE_ANON_KEY');
const SECRET = env('REMINDER_SECRET');
const BRAND = 'Welile School of AI';
const VIOLET = '#6d28d9';
const PAPER = '#faf8f5';
const log = (...a) => console.log(new Date().toISOString(), ...a);

if (!SUPABASE_URL || !ANON || !SECRET) {
    console.error('Missing SUPABASE_URL, SUPABASE_ANON_KEY or REMINDER_SECRET.');
    process.exit(1);
}

// ---------- Supabase RPC ----------------------------------------------------
async function rpc(name, body) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
        method: 'POST',
        headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`${name} failed (${res.status}): ${text.slice(0, 300)}`);
    return text ? JSON.parse(text) : null;
}

// ---------- Formatting ------------------------------------------------------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eat = (iso, opts) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Kampala', hour12: false, ...opts }).format(new Date(iso));
const whenEAT = iso => `${eat(iso, { weekday: 'long', day: 'numeric', month: 'long' })} at ${eat(iso, { hour: '2-digit', minute: '2-digit' })} East Africa Time`;
const firstName = n => (String(n || '').trim().split(/\s+/)[0]) || 'there';
const maskEmail = e => String(e || '').replace(/^(.).*(@.*)$/, '$1***$2');
const maskPhone = p => String(p || '').replace(/^(\+\d{3}).*(\d{2})$/, '$1***$2');

function relative(iso) {
    const mins = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
    if (mins <= 90) return mins <= 5 ? 'in a few minutes' : 'in about an hour';
    const h = Math.round(mins / 60);
    return h >= 20 ? 'tomorrow' : `in about ${h} hours`;
}

// ---------- ICS -------------------------------------------------------------
const icsStamp = iso => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsText = s => String(s ?? '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([,;])/g, '\\$1');
const fold = line => { const out = []; let l = line; while (l.length > 74) { out.push(l.slice(0, 74)); l = ' ' + l.slice(74); } out.push(l); return out.join('\r\n'); };

function buildIcs(r) {
    const lines = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//${BRAND}//Live class//EN`, 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${r.session_id}@welile-school-of-ai`,
        `DTSTAMP:${icsStamp(new Date().toISOString())}`,
        `DTSTART:${icsStamp(r.starts_at)}`, `DTEND:${icsStamp(r.ends_at)}`,
        `SUMMARY:${icsText(r.title)}`,
        `DESCRIPTION:${icsText([r.description || 'Live class for the free AI Fundamentals course.', r.join_link ? `Join: ${r.join_link}` : ''].filter(Boolean).join('\n'))}`,
        `LOCATION:${icsText(r.join_link || 'Online')}`,
        'STATUS:CONFIRMED', 'END:VEVENT', 'END:VCALENDAR'
    ];
    return lines.map(fold).join('\r\n') + '\r\n';
}

// ---------- Email content ---------------------------------------------------
function buildEmail(r) {
    const name = firstName(r.name);
    const when = whenEAT(r.starts_at);
    const subject = `Reminder: ${r.title} starts ${relative(r.starts_at)} (${eat(r.starts_at, { hour: '2-digit', minute: '2-digit' })} EAT)`;
    const settings = env('APP_URL') ? `${env('APP_URL').replace(/\/+$/, '')}` : 'the Live classes tab of your course';
    const joinLine = r.join_link ? `Join here: ${r.join_link}` : 'The join link will appear in the Live classes tab of your course shortly before the class starts.';

    const text = [
        `Hello ${name},`, '',
        `A quick reminder that your live class is coming up ${relative(r.starts_at)}.`, '',
        r.title, when, r.host_name ? `With ${r.host_name}` : '', '',
        r.description || '', r.description ? '' : null,
        joinLine, '',
        'A calendar invitation is attached so you can add the class to your calendar. Live classes are optional and do not affect your certificate.', '',
        `Warm regards,`, `${BRAND}`, '',
        `You are receiving this because you joined the free AI Fundamentals course. You can turn reminders off in ${settings}.`
    ].filter(x => x !== null && x !== undefined).join('\n').replace(/\n{3,}/g, '\n\n');

    const html = `<!doctype html><html><body style="margin:0;padding:0;background:${PAPER};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e7e2da;border-radius:14px;">
<tr><td style="padding:28px 28px 8px 28px;font-family:Georgia,'Times New Roman',serif;color:${VIOLET};font-size:14px;letter-spacing:.04em;text-transform:uppercase;">${esc(BRAND)}</td></tr>
<tr><td style="padding:4px 28px 0 28px;font-family:Georgia,'Times New Roman',serif;color:#1f1b2e;font-size:24px;line-height:1.3;">${esc(r.title)}</td></tr>
<tr><td style="padding:12px 28px 0 28px;font-family:Arial,Helvetica,sans-serif;color:#3b3650;font-size:16px;line-height:1.6;">
<p style="margin:0 0 12px 0;">Hello ${esc(name)},</p>
<p style="margin:0 0 12px 0;">A quick reminder that your live class is coming up ${esc(relative(r.starts_at))}.</p>
<p style="margin:0 0 12px 0;padding:12px 14px;background:${PAPER};border-radius:10px;"><strong>${esc(when)}</strong>${r.host_name ? `<br>With ${esc(r.host_name)}` : ''}</p>
${r.description ? `<p style="margin:0 0 12px 0;">${esc(r.description)}</p>` : ''}
</td></tr>
<tr><td style="padding:8px 28px 4px 28px;">${r.join_link
        ? `<a href="${esc(r.join_link)}" style="display:inline-block;background:${VIOLET};color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;padding:12px 22px;border-radius:10px;">Join the live class</a>`
        : `<p style="margin:0;font-family:Arial,Helvetica,sans-serif;color:#3b3650;font-size:15px;">The join link will appear in the Live classes tab of your course shortly before the class starts.</p>`}</td></tr>
<tr><td style="padding:14px 28px 0 28px;font-family:Arial,Helvetica,sans-serif;color:#3b3650;font-size:14px;line-height:1.6;">A calendar invitation is attached so you can add the class to your calendar. Live classes are optional and do not affect your certificate.</td></tr>
<tr><td style="padding:18px 28px 26px 28px;font-family:Arial,Helvetica,sans-serif;color:#6b6580;font-size:12px;line-height:1.6;">You are receiving this because you joined the free AI Fundamentals course. You can turn reminders off in ${esc(settings)}.</td></tr>
</table></td></tr></table></body></html>`;

    return { subject, text, html };
}

// ---------- WhatsApp (Meta Cloud API) --------------------------------------
async function sendWhatsApp(r) {
    const body = {
        messaging_product: 'whatsapp',
        to: r.phone.replace(/^\+/, ''),
        type: 'template',
        template: {
            name: env('WHATSAPP_TEMPLATE_NAME', 'live_class_reminder'),
            language: { code: env('WHATSAPP_TEMPLATE_LANG', 'en') },
            components: [{
                type: 'body',
                parameters: [firstName(r.name), r.title, whenEAT(r.starts_at), r.join_link || 'the Live classes tab of your course']
                    .map(t => ({ type: 'text', text: String(t).replace(/\s+/g, ' ').slice(0, 500) }))
            }]
        }
    };
    const res = await fetch(`https://graph.facebook.com/v20.0/${env('WHATSAPP_PHONE_ID')}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${env('WHATSAPP_TOKEN')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`WhatsApp API ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

// ---------- Main ------------------------------------------------------------
async function main() {
    log(DRY ? 'DRY RUN: nothing will be sent or recorded.' : 'Starting reminder run.');
    const due = (await rpc('reminders_due', { p_secret: SECRET })) || [];
    log(`${due.length} reminder(s) due.`);
    if (!due.length) return;

    // Email transport
    const smtpReady = !!(env('SMTP_HOST') && env('SMTP_USER') && env('SMTP_PASS'));
    let transporter = null;
    if (smtpReady && !DRY) {
        let nodemailer;
        try { nodemailer = (await import('nodemailer')).default; }
        catch { throw new Error('nodemailer is not installed. Run "npm install" at the repository root.'); }
        const port = Number(env('SMTP_PORT', '587'));
        transporter = nodemailer.createTransport({ host: env('SMTP_HOST'), port, secure: port === 465, auth: { user: env('SMTP_USER'), pass: env('SMTP_PASS') } });
    }
    const waReady = !!(env('WHATSAPP_TOKEN') && env('WHATSAPP_PHONE_ID'));
    if (!smtpReady) log('Email channel skipped: SMTP_HOST / SMTP_USER / SMTP_PASS are not all set.');
    if (!waReady) log('WhatsApp channel skipped: WHATSAPP_TOKEN / WHATSAPP_PHONE_ID are not set.');

    const results = [];
    const stats = { sent: 0, failed: 0, skipped: 0, unconfigured: 0 };
    const flush = async () => {
        if (!results.length || DRY) { results.length = 0; return; }
        const batch = results.splice(0, results.length);
        try { await rpc('reminders_mark_sent', { p_secret: SECRET, p_rows: batch }); }
        catch (e) { log('WARNING: could not record results, these may be re-sent next run:', e.message); }
    };

    const fromName = env('SMTP_FROM_NAME', BRAND);
    const fromEmail = env('SMTP_FROM_EMAIL') || env('SMTP_USER');

    try {
        for (const r of due) {
            const key = { session_id: r.session_id, user_id: r.user_id, channel: r.channel, kind: r.kind };
            const label = `${r.kind} ${r.channel} "${r.title}" -> ${r.channel === 'email' ? maskEmail(r.email) : maskPhone(r.phone)}`;
            const configured = r.channel === 'email' ? smtpReady : waReady;
            if (DRY) { log('[dry]', configured ? 'would send' : 'would skip (channel not configured)', label); continue; }
            if (!configured) { stats.unconfigured++; continue; }
            try {
                if (r.channel === 'email') {
                    const m = buildEmail(r);
                    await transporter.sendMail({
                        from: `"${fromName.replace(/"/g, '')}" <${fromEmail}>`, to: r.email,
                        subject: m.subject, text: m.text, html: m.html,
                        attachments: [{ filename: 'live-class.ics', content: buildIcs(r), contentType: 'text/calendar; charset=utf-8; method=PUBLISH' }]
                    });
                } else {
                    await sendWhatsApp(r);
                }
                stats.sent++; results.push({ ...key, status: 'sent' }); log('sent', label);
            } catch (e) {
                stats.failed++; results.push({ ...key, status: 'failed' }); log('FAILED', label, '-', e.message);
            }
            if (results.length >= 10) await flush();
            await new Promise(res => setTimeout(res, 150)); // gentle pacing for SMTP / API limits
        }
    } finally {
        await flush();
    }
    log(`Done. sent=${stats.sent} failed=${stats.failed} left-for-later(channel not configured)=${stats.unconfigured}`);
}

main().catch(e => { console.error(e.message || e); process.exit(1); });
