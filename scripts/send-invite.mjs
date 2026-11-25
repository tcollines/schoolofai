#!/usr/bin/env node
// Welile School of AI - one-off: invite people an agent registered to open their own account.
//   node scripts/send-invite.mjs [--dry]
// Env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_NAME, INVITE_RECIPIENTS (JSON: [{"name":"..","email":"..","link":"..","agent":".."}])
const DRY = process.argv.includes('--dry');
const env = (k, d = '') => (process.env[k] ?? d).toString().trim();
const BRAND = 'Welile School of AI';
const VIOLET = '#6d28d9', PAPER = '#faf8f5';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const first = n => { const f = String(n || '').trim().split(/\s+/)[0] || 'there'; return f.charAt(0).toUpperCase() + f.slice(1).toLowerCase(); };
const mask = e => String(e || '').replace(/^(.).*(@.*)$/, '$1***$2');
const list = JSON.parse(env('INVITE_RECIPIENTS', '[]'));

function build(r) {
    const name = first(r.name), agent = first(r.agent);
    const subject = 'One last step to open your free AI Fundamentals account';
    const text = [`Hello ${name},`, '',
        `${agent} from Welile School of AI registered you for our free AI Fundamentals course. One last step: open your own account so you can start learning.`, '',
        `Open your account here (it takes about a minute): ${r.link}`, '',
        'You can use your Google account or an email and password. If you use email, we will send you a link to confirm it. Check your spam folder if you do not see it.', '',
        'What you get: free lessons you can do on your phone, live classes on Wednesday and Friday at 2:00 pm East Africa Time, and a free certificate.', '',
        'If you would rather not hear from us, just reply to this email and we will leave you alone.', '',
        'Warm regards,', BRAND].join('\n');
    const html = `<!doctype html><html><body style="margin:0;padding:0;background:${PAPER};"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e7e2da;border-radius:14px;">
<tr><td style="padding:28px 28px 8px;font-family:Georgia,serif;color:${VIOLET};font-size:14px;letter-spacing:.04em;text-transform:uppercase;">${esc(BRAND)}</td></tr>
<tr><td style="padding:4px 28px 0;font-family:Georgia,serif;color:#1f1b2e;font-size:24px;line-height:1.3;">One last step to start learning</td></tr>
<tr><td style="padding:12px 28px 0;font-family:Arial,Helvetica,sans-serif;color:#3b3650;font-size:16px;line-height:1.6;">
<p style="margin:0 0 12px;">Hello ${esc(name)},</p>
<p style="margin:0 0 12px;">${esc(agent)} from Welile School of AI registered you for our free <strong>AI Fundamentals</strong> course. One last step: open your own account so you can start learning.</p>
<p style="margin:0 0 12px;">You can use your <strong>Google account</strong>, or an email and password. If you use email, we will send you a link to confirm it. Check your spam folder if you do not see it.</p>
<p style="margin:0 0 12px;">What you get: free lessons on your phone, live classes on <strong>Wednesday and Friday at 2:00 pm</strong> East Africa Time, and a free certificate.</p></td></tr>
<tr><td style="padding:4px 28px 6px;"><a href="${esc(r.link)}" style="display:inline-block;background:${VIOLET};color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;padding:12px 22px;border-radius:10px;">Open my account</a></td></tr>
<tr><td style="padding:18px 28px 26px;font-family:Arial,Helvetica,sans-serif;color:#6b6580;font-size:12px;line-height:1.6;">You are receiving this because ${esc(agent)} registered you with your permission. If you would rather not hear from us, reply to this email and we will leave you alone.</td></tr>
</table></td></tr></table></body></html>`;
    return { subject, text, html };
}

async function main() {
    console.log(`${list.length} recipient(s).`);
    if (!list.length) throw new Error('INVITE_RECIPIENTS is empty.');
    if (DRY) { list.forEach(r => console.log('[dry]', first(r.name), mask(r.email), 'link ok:', /^https:\/\//.test(r.link || ''))); return; }
    if (!(env('SMTP_HOST') && env('SMTP_USER') && env('SMTP_PASS'))) throw new Error('SMTP settings are not all set.');
    const nodemailer = (await import('nodemailer')).default;
    const port = Number(env('SMTP_PORT', '587'));
    const tx = nodemailer.createTransport({ host: env('SMTP_HOST'), port, secure: port === 465, auth: { user: env('SMTP_USER'), pass: env('SMTP_PASS') } });
    const fromName = env('SMTP_FROM_NAME', BRAND).replace(/"/g, '');
    let sent = 0, failed = 0;
    for (const r of list) {
        try {
            const m = build(r);
            await tx.sendMail({ from: `"${fromName}" <${env('SMTP_USER')}>`, to: r.email, subject: m.subject, text: m.text, html: m.html });
            sent++; console.log('sent', mask(r.email));
        } catch (e) { failed++; console.log('FAILED', mask(r.email), e.message); }
        await new Promise(res => setTimeout(res, 300));
    }
    console.log(`Done. sent=${sent} failed=${failed}`);
}
main().catch(e => { console.error('Run failed:', e.message); process.exit(1); });
