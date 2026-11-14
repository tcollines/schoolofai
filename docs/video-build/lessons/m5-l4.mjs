import { render, shellFor, on, ON, CSS } from '../lesson-lib.mjs';
const [FF, AUDIO, OUT, TOTALS] = process.argv.slice(2);
const TOTAL = parseFloat(TOTALS || '355.66');
const meta = { mod: 'Module 5 · Fair and private', id: 'm5-l4', title: 'Safer habits and three rules' };
const S = shellFor(meta);
const slides = [];
const RED = '#991b1b', GRN = '#166534';
const row = (n, i, num, html) => `<div class="card row ${on(n, i)}" style="padding:22px 36px"><span class="num">${num}</span><span>${html}</span></div>`;
const you = (cls, txt) => `<div class="card hl ${cls}" style="padding:22px 40px"><div style="font-size:28px;font-weight:700;color:#5b21b6;letter-spacing:.06em;margin-bottom:8px">YOU TYPE</div><div style="font-size:36px;line-height:1.35">${txt}</div></div>`;
const bar = (n, i, html, extra = '') => `<div class="card hl ${on(n, i)}" style="margin-top:22px;padding:20px 36px;${extra}"><div style="font-size:42px;font-weight:700">${html}</div></div>`;
const chip = (n, i, t, c = '', fs = 36) => `<span class="pill ${c} ${on(n, i)}" style="font-size:${fs}px;padding:12px 30px">${t}</span>`;
const hdr = (eb, h) => `<div class="eyebrow">${eb}</div><h2 style="margin-bottom:20px">${h}</h2>`;
const insteadDo = (n, i, bad, good) => `<div class="grid2" style="gap:22px"><div class="card ${on(n, i)}" style="border-color:#dc2626;background:#fef2f2"><div class="pill red">Instead of this</div><div style="font-size:34px;margin-top:12px;line-height:1.4">${bad}</div></div><div class="card ${on(n, i + 1)}" style="border-color:#16a34a;background:#f0fdf4"><div class="pill green">Do this</div><div style="font-size:34px;margin-top:12px;line-height:1.4">${good}</div></div></div>`;

slides.push({ start: 0, steps: [0, 5, 12, 19], html: n => `<html><head><style>${CSS}</style></head><body>
<div class="bar"><span><b>WELILE SCHOOL OF AI</b> &nbsp;·&nbsp; AI Fundamentals</span><span>${meta.mod}</span></div>
<div class="wrap center"><div class="eyebrow">Module 5 · Lesson 4</div><h1 style="font-size:104px">Safer habits<br><span class="violet">and three rules</span></h1>
<p class="it ${ON(n,1)}" style="font-size:42px;margin-top:40px;color:#44403c">Last lesson: your words may not stay private.</p>
<p class="it ${ON(n,2)}" style="font-size:42px;margin-top:14px;color:#44403c">So how do you still get help, <b>without sharing what you should not</b>?</p>
<p class="it ${ON(n,3)}" style="font-size:46px;margin-top:20px;color:#5b21b6;font-weight:600">Describe the problem, not the person.</p></div></body></html>` });

slides.push({ start: 26, steps: [26, 35, 42, 48, 55], html: n => S(`${hdr('Example one', 'A customer sends a complaint')}
<div class="card" style="padding:20px 36px"><div style="font-size:34px">It has <b>their name and their phone number</b>.</div></div>
<div style="margin-top:20px">${insteadDo(n, 1, 'Paste the whole message into a chatbot and ask for a reply.', 'Describe it.')}</div>
<div style="margin-top:18px" class="${on(n,2)}">${you('', 'A customer says their delivery was two days late. Write a polite reply.')}</div>
<div class="card ${on(n,3)}" style="margin-top:16px;padding:18px 36px"><div style="font-size:34px">Polite, and useful. <b>The chatbot knows nothing about who the customer is.</b></div></div>
<p class="${on(n,4)}" style="font-size:36px;margin-top:12px;color:#5b21b6;font-weight:600">I add the name myself, by hand, in my own message.</p>`) });

slides.push({ start: 61, steps: [61, 65, 69], html: n => S(`<div class="center" style="gap:16px"><div class="eyebrow">Did you notice?</div>
<h1 style="font-size:90px;line-height:1.15" class="it ${ON(n,0)}">How little did I <span class="violet">lose?</span></h1>
<p class="it ${ON(n,1)}" style="font-size:44px;margin-top:16px;color:${GRN};font-weight:700">I still got a clear, polite reply.</p>
<p class="it ${ON(n,2)}" style="font-size:42px;margin-top:6px;color:#44403c">The only thing missing was personal information, and <b>I did not need it</b>.</p></div>`) });

slides.push({ start: 74, steps: [74, 81, 84, 90, 93, 97, 104], html: n => S(`${hdr('Example two', 'A customer list')}
<div class="card" style="padding:18px 36px"><div style="font-size:34px">A small shop. A list with <b>names and phone numbers</b>.</div><div style="display:flex;gap:14px;margin-top:10px" class="it ${ON(n,1)}">${chip(n,1,'Who buys most often?','',30)}${chip(n,1,'Who stopped coming?','',30)}</div></div>
<div class="card ${on(n,2)}" style="margin-top:16px;padding:18px 36px;border-color:#16a34a;background:#f0fdf4"><div style="font-size:34px"><b>Instead of pasting the list</b>, ask how to do the analysis, and practise on <b>made-up data</b>.</div></div>
<div style="margin-top:16px">${you(on(n,3), 'I have a customer list with columns for name, items bought and date. How do I find which customers buy most often? Show me using five made-up customers.')}</div>
<p class="${on(n,4)}" style="font-size:32px;margin-top:12px;color:#44403c">Now I have the method, and I tried it on made-up customers.</p>
<p class="${on(n,5)}" style="font-size:32px;margin-top:4px;color:#44403c">Then I do the real work in <b>my own spreadsheet</b>, on my own phone or laptop.</p>
<p class="${on(n,6)}" style="font-size:36px;margin-top:6px;color:#5b21b6;font-weight:700">Nobody’s real details travelled anywhere.</p>`) });

slides.push({ start: 107, steps: [107, 110, 116, 124], html: n => S(`${hdr('Example three', 'A full contract')}
<div class="card ${on(n,1)}" style="padding:22px 36px"><div style="font-size:38px">A supplier agreement for <b>UGX 8,000,000</b>, with a <b>named company</b>.</div></div>
<div class="card ${on(n,2)}" style="margin-top:18px;padding:22px 36px;border-color:#16a34a;background:#f0fdf4"><div style="font-size:38px"><b>Remove the names and the amounts first.</b> Replace them with words like <span class="pill green" style="font-size:32px">Supplier</span> <span class="pill green" style="font-size:32px">Amount</span></div></div>
<div class="card hl ${on(n,3)}" style="margin-top:18px;padding:22px 36px"><div style="font-size:40px">Or, if your organisation has an <b class="violet">approved tool</b>, use that.</div></div>`) });

slides.push({ start: 129, steps: [129, 134, 140, 143, 147, 150, 155], html: n => S(`<div class="eyebrow">Which brings me to</div><h2 style="margin-bottom:18px">Three rules</h2>
<div style="display:flex;flex-direction:column;gap:14px">
<div class="card row ${on(n,0)}" style="padding:18px 36px"><span class="num">1</span><span><b>Use approved, secure tools</b><br><span style="font-size:28px;color:#57534e"><span class="it ${ON(n,1)}">Company, school or clinic? Ask if there is an approved tool. </span><span class="it ${ON(n,2)}"><b>For anything sensitive, use that.</b></span></span></span></div>
<div class="card row ${on(n,3)}" style="padding:18px 36px"><span class="num">2</span><span><b>Check the settings</b><br><span style="font-size:28px;color:#57534e"><span class="it ${ON(n,4)}">Many tools let you limit how your chats are used. Find that page, and read it. </span><span class="it ${ON(n,5)}" style="color:${RED};font-weight:700">A setting is not permission to paste secrets.</span></span></span></div>
<div class="card hl row ${on(n,6)}" style="padding:18px 36px"><span class="num" style="background:#dc2626">3</span><span><b>Not sure? Do not paste it.</b></span></div></div>`) });

slides.push({ start: 159, steps: [159, 162], html: n => S(`<div class="center" style="gap:18px"><div class="eyebrow">The line to remember</div>
<h1 style="font-size:104px;line-height:1.15" class="it ${ON(n,1)}">Asking costs <span style="color:${GRN}">a minute.</span></h1>
<h1 style="font-size:104px;line-height:1.15" class="it ${ON(n,1)}">A leak can cost <span style="color:${RED}">far more.</span></h1></div>`) });

slides.push({ start: 172, steps: [172, 174, 182, 185, 190, 199], html: n => S(`${hdr('Let me make that real', 'An assistant in a small office')}
<div class="card ${on(n,1)}" style="padding:20px 36px"><div style="font-size:36px">You are <b>not sure</b> whether a document is safe to put into a chatbot.</div></div>
<div class="card ${on(n,2)}" style="margin-top:16px;padding:20px 36px;border-color:#16a34a;background:#f0fdf4"><div style="font-size:36px"><b>Ask your supervisor.</b> It takes a minute.</div><div style="font-size:32px;margin-top:6px;color:#44403c" class="it ${ON(n,3)}">Yes or no, you have lost almost nothing.</div></div>
<div class="card ${on(n,4)}" style="margin-top:16px;padding:20px 36px;border-color:#dc2626;background:#fef2f2"><div style="font-size:36px"><b>Paste first, ask later?</b> If the document was confidential, <b style="color:${RED}">you cannot take it back.</b></div></div>
${bar(n,5,'A minute of asking is <span style="color:'+GRN+'">cheap.</span>')}`) });

slides.push({ start: 201, steps: [201, 203, 208, 212], html: n => S(`<div class="eyebrow">What about speed?</div>
<h1 style="font-size:80px;line-height:1.15" class="it ${ON(n,1)}">It feels faster to paste everything. <span style="color:${RED}">It is not.</span></h1>
<p class="it ${ON(n,2)}" style="font-size:44px;margin-top:24px;color:#44403c">Describing the problem takes about <b>ten seconds longer</b>.</p>
<p class="it ${ON(n,3)}" style="font-size:44px;margin-top:8px;color:#5b21b6;font-weight:600">After a week it becomes a habit, and you will not even notice.</p>`) });

slides.push({ start: 216, steps: [216, 219, 221, 224, 226.3, 227.8, 229.2, 231.5, 234, 238, 241], html: n => S(`<div class="eyebrow">What you can still do</div><h1 style="font-size:90px" class="it ${ON(n,1)}">A lot.</h1>
<div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:14px">${chip(n,2,'A reply to a complaint','green',34)}${chip(n,3,'A polite message','green',34)}${chip(n,4,'A sample budget','green',34)}${chip(n,5,'A lesson plan','green',34)}${chip(n,6,'An outline of a talk','green',34)}${chip(n,7,'Spreadsheet how-to','green',34)}</div>
<p class="${on(n,8)}" style="font-size:36px;margin-top:20px;color:#44403c">All of that works <b>without any personal or confidential details</b>.</p>
<p class="${on(n,9)}" style="font-size:40px;margin-top:8px;color:#5b21b6;font-weight:600">Privacy does not mean you cannot use AI.</p>
${bar(n,10,'You give it <span class="violet">the problem</span>, and keep <span class="violet">the people</span> out of it.')}`) });

slides.push({ start: 245, steps: [245, 249, 253, 256, 260], html: n => S(`${hdr('What about your own information?', 'The same care applies')}
<div style="display:flex;gap:14px;flex-wrap:wrap">${chip(n,1,'Your mobile money PIN','red',38)}${chip(n,1,'Your passwords','red',38)}${chip(n,1,'Your ID number','red',38)}</div>
<p class="${on(n,2)}" style="font-size:38px;margin-top:20px;color:#44403c">They stay out, even when you only want help with <b>your own affairs</b>.</p>
<div class="card ${on(n,3)}" style="margin-top:22px;padding:22px 36px;border-color:#dc2626;background:#fef2f2"><div style="font-size:42px;color:${RED};font-weight:700">If a chatbot ever asks you for a PIN or a password: stop.</div></div>
<p class="${on(n,4)}" style="font-size:36px;margin-top:14px;color:#44403c">That is a sign something is wrong.</p>`) });

slides.push({ start: 262, steps: [262, 266, 273, 276, 285], html: n => S(`${hdr('A small test', 'What do you type?')}
<div class="card ${on(n,1)}" style="padding:20px 36px"><div style="font-size:34px">A customer sends a message with their <b>name</b>, <b>phone number</b> and a complaint about a <b>missing order</b>.</div></div>
<p class="${on(n,2)}" style="font-size:40px;margin-top:20px;color:#5b21b6;font-weight:600">What do you type into the chatbot?</p>
<div style="margin-top:14px">${you(on(n,3), 'A customer says their order did not arrive. Write a polite reply and ask them to confirm their delivery address.')}</div>
${bar(n,4,'No name. No number. <span class="violet">Just the problem.</span>')}`) });

slides.push({ start: 289, steps: [289, 292, 294, 296], html: n => S(`${hdr('The three rules, one more time', 'Say them with me')}
<div style="display:flex;flex-direction:column;gap:16px">
${row(n,1,1,'Use <b>approved, secure tools</b>')}${row(n,2,2,'<b>Check the settings</b>')}${row(n,3,3,'Not sure? <b>Do not paste it</b>')}</div>`) });

slides.push({ start: 299, steps: [299, 302, 308, 314], html: n => S(`<div class="eyebrow">Your task · pause and try</div><h2 style="margin-bottom:20px">Rewrite one real message</h2>
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'Think of <b>one real message, note or document</b> you might paste into a chatbot')}
${row(n,2,2,'Rewrite it so it describes <b>the problem</b>, without any <b>names, phone numbers, ID numbers or amounts</b>')}
${row(n,3,3,'Then <b>send that version</b>')}</div>`) });

slides.push({ start: 325, steps: [325, 332, 335, 340, 344], html: n => S(`<div class="center"><div class="eyebrow">Summary</div>
<h1 style="font-size:70px;max-width:1700px;line-height:1.2" class="it ${ON(n,1)}">Describe <span class="violet">the problem</span>, not the person.</h1>
<h1 style="font-size:70px;max-width:1700px;line-height:1.2;margin-top:6px" class="it ${ON(n,2)}">And when you are not sure, <span style="color:${RED}">do not paste it.</span></h1>
<p class="it ${ON(n,3)}" style="font-size:42px;margin-top:40px;color:#44403c">That finishes Module 5.</p>
<p class="it ${ON(n,4)}" style="font-size:38px;margin-top:10px;color:#57534e"><b>Next, Module 6:</b> everything in one simple guide. Green, amber, red.</p></div>`) });

await render({ FF, CHROME: process.env.CHROME, AUDIO, OUT, TOTAL, slides, dir: process.env.FRAMES || 'frames-m5-l4' });
