#!/usr/bin/env node
// Welile School of AI - one-off: email the Lesson 1 notes (PDF) to a short list of students.
//   node scripts/send-lesson-notes.mjs [--dry]
// Env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_NAME, APP_URL, NOTES_RECIPIENTS (JSON: [{"name":"..","email":".."}])
import { readFile } from 'node:fs/promises';
const DRY = process.argv.includes('--dry');
const env = (k, d = '') => (process.env[k] ?? d).toString().trim();
const APP = (env('APP_URL') || 'https://www.welileschoolofai.org').replace(/\/+$/, '');
const BRAND = 'Welile School of AI';
const VIOLET = '#6d28d9', PAPER = '#faf8f5';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const first = n => { const f = String(n || '').trim().split(/\s+/)[0] || 'there'; return f.charAt(0).toUpperCase() + f.slice(1).toLowerCase(); };
const mask = e => String(e || '').replace(/^(.).*(@.*)$/, '$1***$2');
const list = JSON.parse(env('NOTES_RECIPIENTS', '[]'));
const link = `${APP}/learn/ai-fundamentals`;

function build(name) {
    const subject = 'Your Lesson 1 notes: AI Fundamentals';
    const text = [`Hello ${name},`, '', 'Thank you for joining Lesson 1 of AI Fundamentals. It was good to have you in class.', '',
        'Your notes from the lesson are attached as a PDF. Keep them handy and look through them again when you can.', '',
        'The next class is Thursday 19 November at 2:00 pm East Africa Time. Your join link is in your reminder email and on the Live classes page of the course.', '',
        `One small thing: learning is easier with company. If a friend or colleague has been curious about AI, they are welcome to join the same free course at ${link}. They can start any time, and you can study together.`, '',
        'Warm regards,', BRAND].join('\n');
    const html = `<!doctype html><html><body style="margin:0;padding:0;background:${PAPER};"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e7e2da;border-radius:14px;">
<tr><td style="padding:28px 28px 8px;font-family:Georgia,serif;color:${VIOLET};font-size:14px;letter-spacing:.04em;text-transform:uppercase;">${esc(BRAND)}</td></tr>
<tr><td style="padding:4px 28px 0;font-family:Georgia,serif;color:#1f1b2e;font-size:24px;line-height:1.3;">Your Lesson 1 notes</td></tr>
<tr><td style="padding:12px 28px 0;font-family:Arial,Helvetica,sans-serif;color:#3b3650;font-size:16px;line-height:1.6;">
<p style="margin:0 0 12px;">Hello ${esc(name)},</p>
<p style="margin:0 0 12px;">Thank you for joining Lesson 1 of <strong>AI Fundamentals</strong>. It was good to have you in class.</p>
<p style="margin:0 0 12px;">Your notes from the lesson are attached as a PDF. Keep them handy and look through them again when you can.</p>
<p style="margin:0 0 12px;">The next class is <strong>Thursday 19 November at 2:00 pm</strong> East Africa Time. Your join link is in your reminder email and on the Live classes page of the course.</p>
<p style="margin:0 0 12px;">One small thing: learning is easier with company. If a friend or colleague has been curious about AI, they are welcome to join the same free course. They can start any time, and you can study together.</p></td></tr>
<tr><td style="padding:4px 28px 6px;"><a href="${esc(link)}" style="display:inline-block;background:${VIOLET};color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;padding:12px 22px;border-radius:10px;">Share the free course</a></td></tr>
<tr><td style="padding:18px 28px 26px;font-family:Arial,Helvetica,sans-serif;color:#6b6580;font-size:12px;line-height:1.6;">You are receiving this because you attended Lesson 1 of the free AI Fundamentals course.</td></tr>
</table></td></tr></table></body></html>`;
    return { subject, text, html };
}

async function main() {
    console.log(`${list.length} recipient(s).`);
    if (!list.length) throw new Error('NOTES_RECIPIENTS is empty.');
    if (DRY) { list.forEach(r => console.log('[dry]', first(r.name), mask(r.email))); return; }
    if (!(env('SMTP_HOST') && env('SMTP_USER') && env('SMTP_PASS'))) throw new Error('SMTP settings are not all set.');
    const pdf = await readFile(new URL('../docs/live-decks/out/AI-Fundamentals-Lesson-1-Teaching-Deck.pdf', import.meta.url));
    const nodemailer = (await import('nodemailer')).default;
    const port = Number(env('SMTP_PORT', '587'));
    const tx = nodemailer.createTransport({ host: env('SMTP_HOST'), port, secure: port === 465, auth: { user: env('SMTP_USER'), pass: env('SMTP_PASS') } });
    const fromName = env('SMTP_FROM_NAME', BRAND).replace(/"/g, '');
    let sent = 0, failed = 0;
    for (const r of list) {
        try {
            const m = build(first(r.name));
            await tx.sendMail({ from: `"${fromName}" <${env('SMTP_USER')}>`, to: r.email, subject: m.subject, text: m.text, html: m.html,
                attachments: [{ filename: 'AI-Fundamentals-Lesson-1-Notes.pdf', content: pdf, contentType: 'application/pdf' }] });
            sent++; console.log('sent', mask(r.email));
        } catch (e) { failed++; console.log('FAILED', mask(r.email), e.message); }
        await new Promise(res => setTimeout(res, 300));
    }
    console.log(`Done. sent=${sent} failed=${failed}`);
}
main().catch(e => { console.error('Run failed:', e.message); process.exit(1); });
