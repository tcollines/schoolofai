import { render, shellFor, on, ON, CSS } from '../lesson-lib.mjs';
const [FF, AUDIO, OUT, TOTALS] = process.argv.slice(2);
const TOTAL = parseFloat(TOTALS || '455.58');
const meta = { mod: 'Module 5 · Fair and private', id: 'm5-l3', title: 'Your words may not stay private' };
const S = shellFor(meta);
const slides = [];
const RED = '#991b1b', GRN = '#166534';
const row = (n, i, num, html) => `<div class="card row ${on(n, i)}" style="padding:22px 36px"><span class="num">${num}</span><span>${html}</span></div>`;
const bar = (n, i, html, extra = '') => `<div class="card hl ${on(n, i)}" style="margin-top:22px;padding:20px 36px;${extra}"><div style="font-size:42px;font-weight:700">${html}</div></div>`;
const chip = (n, i, t, c = '', fs = 36) => `<span class="pill ${c} ${on(n, i)}" style="font-size:${fs}px;padding:12px 30px">${t}</span>`;
const hdr = (eb, h) => `<div class="eyebrow">${eb}</div><h2 style="margin-bottom:20px">${h}</h2>`;
const redcard = (n, i, html) => `<div class="card ${on(n, i)}" style="padding:22px 36px;border-color:#dc2626;background:#fef2f2"><div style="font-size:42px;color:${RED};font-weight:700">${html}</div></div>`;
const hi = (n, i, t) => n >= i ? `<span style="background:#fecaca;color:${RED};border-radius:10px;padding:2px 10px;font-weight:700">${t}</span>` : t;

slides.push({ start: 0, steps: [0, 4, 8, 14], html: n => `<html><head><style>${CSS}</style></head><body>
<div class="bar"><span><b>WELILE SCHOOL OF AI</b> &nbsp;·&nbsp; AI Fundamentals</span><span>${meta.mod}</span></div>
<div class="wrap center"><div class="eyebrow">Module 5 · Lesson 3</div><h1 style="font-size:100px">Your words may<br><span class="violet">not stay private</span></h1>
<p class="it ${ON(n,1)}" style="font-size:40px;margin-top:40px;color:#44403c">So far: what AI gets wrong, and how bias gets in.</p>
<p class="it ${ON(n,2)}" style="font-size:42px;margin-top:14px;color:#44403c">Now something that depends on <b>you</b>: privacy.</p>
<p class="it ${ON(n,3)}" style="font-size:42px;margin-top:14px;color:#5b21b6;font-weight:600">The main message, in one sentence.</p></div></body></html>` });

slides.push({ start: 20, steps: [20, 25, 30, 33, 38], html: n => S(`${hdr('Let me explain', 'A public AI tool')}
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'An AI service that <b>anyone can use</b>')}
${row(n,2,2,'A <b>free chatbot</b> is a good example')}
${row(n,3,3,'Public tools <b>may use what you type</b> to train their models')}</div>
${bar(n,4,'And they <span style="color:'+RED+'">could reveal it later.</span>')}`) });

slides.push({ start: 45, steps: [45, 47, 49, 52, 57], html: n => S(`${hdr('I want to be careful here', 'What I am, and am not, saying')}
<div style="display:flex;gap:14px;flex-wrap:wrap">${chip(n,0,'Not every tool does this','',36)}${chip(n,1,'Not saying it will happen to you','',36)}${chip(n,2,'Policies differ between tools','',36)}</div>
<div class="card ${on(n,3)}" style="margin-top:24px;padding:22px 36px"><div style="font-size:42px">It is <b style="color:${RED}">possible</b>, and you <b>cannot always be sure</b>.</div></div>
${bar(n,4,'So decide <span class="violet">before you type</span> what is safe to share.')}`) });

slides.push({ start: 61, steps: [61, 66, 67.5, 69, 70.5, 74], html: n => S(`<div class="eyebrow">Think of it like this</div><h2 style="margin-bottom:20px">Typing into a public chatbot is like speaking in a busy market</h2>
<div style="display:flex;gap:14px;flex-wrap:wrap">${chip(n,1,'Chat about prices','green',38)}${chip(n,2,'The weather','green',38)}${chip(n,3,'The football','green',38)}</div>
<div class="card ${on(n,4)}" style="margin-top:26px;padding:24px 36px;border-color:#dc2626;background:#fef2f2"><div style="font-size:42px;color:${RED};font-weight:700">But you would not read out your mobile money PIN to the whole market.</div></div>
<p class="${on(n,5)}" style="font-size:38px;margin-top:20px;color:#44403c">Even if you believed nobody was listening.</p>`) });

slides.push({ start: 78, steps: [78, 81, 84, 85.5, 87, 88.5, 94, 98, 101], html: n => S(`${hdr('Why does this matter so much for us?', 'Many of us use free tools')}
<div style="display:flex;gap:14px;flex-wrap:wrap">${chip(n,2,'On shared phones','',38)}${chip(n,3,'On public Wi-Fi','',38)}${chip(n,4,'In internet cafes','',38)}</div>
<p class="${on(n,5)}" style="font-size:36px;margin-top:20px;color:#44403c">Because data is expensive. A free tool is useful, and I use them.</p>
<div class="card hl ${on(n,6)}" style="margin-top:20px;padding:22px 36px"><div style="font-size:46px;font-weight:700">Free does <span style="color:${RED}">not</span> mean private.</div><div style="font-size:34px;margin-top:8px;color:#44403c" class="it ${ON(n,7)}">It simply means you did not pay in money.</div></div>
<p class="${on(n,8)}" style="font-size:42px;margin-top:18px;color:#5b21b6;font-weight:600">So we pay attention instead.</p>`) });

slides.push({ start: 111, steps: [111, 113, 115, 117, 119], html: n => S(`<div class="eyebrow">Here is the rule</div><h2 style="margin-bottom:22px">Never put in…</h2>
<div style="display:flex;flex-direction:column;gap:16px">
${redcard(n,1,'Confidential work information')}${redcard(n,2,'Passwords')}${redcard(n,3,'Personal information')}</div>
${bar(n,4,'No exceptions.')}`) });

slides.push({ start: 123, steps: [123, 127.2, 128.8, 130.8, 132.3], html: n => S(`${hdr('Confidential work information', 'Anything your employer or business would not want outside')}
<div class="grid2" style="gap:20px">
<div class="card ${on(n,1)}" style="padding:26px 36px"><div style="font-size:40px"><b>Unreleased results</b></div></div>
<div class="card ${on(n,2)}" style="padding:26px 36px"><div style="font-size:40px"><b>A price list for a tender</b></div></div>
<div class="card ${on(n,3)}" style="padding:26px 36px"><div style="font-size:40px"><b>A contract</b></div></div>
<div class="card ${on(n,4)}" style="padding:26px 36px"><div style="font-size:40px"><b>Staff records</b></div></div></div>`) });

slides.push({ start: 136, steps: [136, 138, 139.5, 141, 142.5], html: n => S(`${hdr('Passwords and PINs', 'These never go into a chatbot')}
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'Your <b>email password</b>')}${row(n,2,2,'Your <b>mobile money PIN</b>')}${row(n,3,3,'Your <b>bank login</b>')}</div>
${bar(n,4,'Never. <span style="color:'+RED+'">Ever.</span>')}`) });

slides.push({ start: 145, steps: [145, 151, 155, 162, 165, 169, 171.5, 172.8, 173.8, 175.2], html: n => S(`<div class="eyebrow">And personal information has a special name</div>
<div style="display:flex;align-items:baseline;gap:30px"><h1 style="font-size:130px" class="it ${ON(n,1)}">PII</h1><div style="font-size:36px;color:#57534e" class="it ${ON(n,2)}">personally identifiable information</div></div>
<div class="card hl ${on(n,3)}" style="margin-top:6px;padding:20px 36px"><div style="font-size:42px">Anything that <b class="violet">identifies a person</b>.</div></div>
<div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:22px">${chip(n,4,'A name with a phone number','red',34)}${chip(n,5,'An ID number','red',34)}${chip(n,6,'An address','red',34)}${chip(n,7,'A photo','red',34)}${chip(n,8,'Medical details','red',34)}${chip(n,9,'Bank or mobile money details','red',34)}</div>`) });

slides.push({ start: 178, steps: [178, 183, 188, 194], html: n => S(`${hdr('Notice something', 'Why the combination matters')}
<div class="card" style="padding:22px 36px"><div style="font-size:38px">A name on its own may not say very much.</div><div style="display:flex;gap:14px;margin-top:12px" class="it ${ON(n,1)}">${chip(n,1,'Many people are called Sarah','',32)}${chip(n,1,'…Christian','',32)}${chip(n,1,'…Emma','',32)}</div></div>
<div class="card hl ${on(n,2)}" style="margin-top:20px;padding:24px 36px"><div style="font-size:44px">A name <b>together with a phone number</b> points to <b class="violet">one particular person</b>.</div></div>
<p class="${on(n,3)}" style="font-size:40px;margin-top:20px;color:#5b21b6;font-weight:600">That is why the combination matters.</p>`) });

slides.push({ start: 196, steps: [196, 200, 207, 214], html: n => S(`<div class="eyebrow">A message I made up for this video · not a real person</div><h2 style="margin-bottom:20px">How many pieces of personal information?</h2>
<div class="card ${on(n,1)}" style="padding:28px 40px"><div style="font-size:38px;line-height:1.6">“Please write a reply to Sarah Namukasa, 0772 000 000, ID number CM00000000000. She says her mobile money payment of UGX 150,000 did not reach her account.”</div></div>
<p class="${on(n,2)}" style="font-size:40px;margin-top:24px;color:#5b21b6;font-weight:600">Look closely. How many can you find?</p>
<p class="${on(n,3)}" style="font-size:36px;margin-top:6px;color:#44403c">Pause the video and count them.</p>`) });

slides.push({ start: 220, steps: [220, 222, 223.2, 224.4, 225.8, 227.2, 229.5], html: n => S(`<div class="eyebrow">I count four</div><h2 style="margin-bottom:20px">The pieces of PII</h2>
<div class="card" style="padding:26px 40px"><div style="font-size:36px;line-height:1.7">“Please write a reply to ${hi(n,1,'Sarah Namukasa')}, ${hi(n,2,'0772 000 000')}, ${hi(n,3,'ID number CM00000000000')}. She says her ${hi(n,4,'mobile money payment of UGX 150,000')} did not reach her account.”</div></div>
<div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:20px">${chip(n,1,'1 · The name','red',32)}${chip(n,2,'2 · The phone number','red',32)}${chip(n,3,'3 · The ID number','red',32)}${chip(n,4,'4 · The payment detail','red',32)}</div>
<p class="${on(n,5)}" style="font-size:36px;margin-top:20px;color:#44403c">Any one of these could be sensitive.</p>
<p class="${on(n,6)}" style="font-size:42px;margin-top:6px;color:${RED};font-weight:700">Together, they identify one real person and their money.</p>`) });

slides.push({ start: 233, steps: [233, 240, 243], html: n => S(`<div class="center" style="gap:18px"><div class="eyebrow">If this were a real message from a customer</div>
<h1 style="font-size:80px;line-height:1.15" class="it ${ON(n,0)}">Pasting it into a public chatbot would be <span style="color:${RED}">a mistake.</span></h1>
<p class="it ${ON(n,1)}" style="font-size:44px;margin-top:20px;color:#44403c">The customer <b>trusted you</b> with those details.</p>
<p class="it ${ON(n,2)}" style="font-size:44px;margin-top:6px;color:#5b21b6;font-weight:600">They did not agree to share them with a tool.</p></div>`) });

slides.push({ start: 247, steps: [247, 250, 251.5, 253, 255, 258], html: n => S(`${hdr('Notice what is not on the list', 'Not PII')}
<div style="display:flex;flex-direction:column;gap:14px">
<div class="card ${on(n,1)}" style="padding:20px 36px;border-color:#16a34a;background:#f0fdf4"><div style="font-size:40px"><span style="color:${GRN};font-weight:700">✔</span> Your <b>favourite food</b></div></div>
<div class="card ${on(n,2)}" style="padding:20px 36px;border-color:#16a34a;background:#f0fdf4"><div style="font-size:40px"><span style="color:${GRN};font-weight:700">✔</span> The name of a <b>famous footballer</b></div></div>
<div class="card ${on(n,3)}" style="padding:20px 36px;border-color:#16a34a;background:#f0fdf4"><div style="font-size:40px"><span style="color:${GRN};font-weight:700">✔</span> A <b>made-up character</b></div></div></div>
<p class="${on(n,4)}" style="font-size:38px;margin-top:20px;color:#44403c">Most of what you type will be perfectly fine.</p>
<p class="${on(n,5)}" style="font-size:40px;margin-top:6px;color:#5b21b6;font-weight:600">The list is short, and it is specific.</p>`) });

slides.push({ start: 263, steps: [263, 268, 274, 280, 283, 289, 295, 298], html: n => S(`${hdr('Two more everyday situations', 'Tailor and student')}
<div class="grid2" style="gap:22px;align-items:start">
<div class="card" style="min-height:470px"><div class="pill amber">The tailor in Entebbe</div><div style="font-size:32px;margin-top:14px;line-height:1.45">
<div class="it ${ON(n,1)}">A notebook of customers: <b>names, phone numbers, measurements</b>.</div>
<div class="it ${ON(n,2)}" style="margin-top:10px">Tempting to <b>photograph the pages</b> and ask a chatbot to organise them.</div>
<div class="it ${ON(n,3)}" style="margin-top:10px;color:${RED};font-weight:700">But it is full of personal information.</div>
<div class="it ${ON(n,4)}" style="margin-top:10px;color:#5b21b6">The tailor can still ask for help. Next lesson shows how.</div></div></div>
<div class="card" style="min-height:470px"><div class="pill">A student</div><div style="font-size:32px;margin-top:14px;line-height:1.45">
<div class="it ${ON(n,5)}">Writing about a <b>family illness</b>.</div>
<div class="it ${ON(n,6)}" style="margin-top:10px">A medical report has <b>details that belong to one person</b>.</div>
<div class="it ${ON(n,7)}" style="margin-top:10px;color:${RED};font-weight:700">Those details stay out of a public tool.</div></div></div></div>`) });

slides.push({ start: 300, steps: [300, 303, 305.5, 308, 310.5, 315], html: n => S(`<div class="eyebrow">A question I hear often</div><h2 style="margin-bottom:20px" class="it ${ON(n,1)}">“Is deleting my chat enough?”</h2>
<h1 style="font-size:90px;line-height:1.15" class="it ${ON(n,2)}">Not always.</h1>
<div style="display:flex;flex-direction:column;gap:14px;margin-top:14px">
${row(n,3,1,'<b>Policies differ</b> by tool')}
${row(n,4,2,'Deleting may help, but you cannot be sure <b>what happened before you deleted it</b>')}</div>
${bar(n,5,'The safe move: <span class="violet">do not paste secrets in the first place.</span>')}`) });

slides.push({ start: 319, steps: [319, 321, 329, 332, 338, 342, 345], html: n => S(`<div class="eyebrow">Another one</div><h2 style="margin-bottom:20px">“I changed a setting, so now it is private.”</h2>
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,2,1,'<b>Be careful.</b> Many tools let you limit how your chats are used. It is good to check')}
${row(n,4,2,'In Module 2 we looked at the <b>settings page</b>')}</div>
<div class="card hl ${on(n,5)}" style="margin-top:20px;padding:22px 36px"><div style="font-size:42px;font-weight:700">A setting is <span style="color:${RED}">not permission</span> to paste secrets.</div></div>
<p class="${on(n,6)}" style="font-size:38px;margin-top:16px;color:#44403c">It <b>reduces</b> the risk. It does not <b>remove</b> it.</p>`) });

slides.push({ start: 351, steps: [351, 353, 359, 365], html: n => S(`${hdr('Let me bring this together', 'Three things')}
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'Public AI tools <b>may use what you type</b>, and could reveal it later')}
${row(n,2,2,'<b>Never paste</b> passwords, PINs, ID numbers or confidential work information')}
${row(n,3,3,'<b>PII</b> is anything that identifies a person: a name with a phone number, an ID number, an address, a photo, medical details, bank or mobile money details')}</div>`) });

slides.push({ start: 380, steps: [380, 383, 386.5, 388, 389.5, 391, 393, 397], html: n => S(`<div class="eyebrow">A thought to take with you</div>
<h1 style="font-size:70px;line-height:1.2" class="it ${ON(n,1)}">You are not only protecting yourself. <span class="violet">You are protecting everyone whose details you hold.</span></h1>
<div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:22px">${chip(n,2,'Your customers','',38)}${chip(n,3,'Your classmates','',38)}${chip(n,4,'Your patients','',38)}${chip(n,5,'Your family','',38)}</div>
<p class="${on(n,6)}" style="font-size:38px;margin-top:24px;color:#44403c">A real responsibility, and a small one to carry.</p>
<p class="${on(n,7)}" style="font-size:44px;margin-top:6px;color:#5b21b6;font-weight:700">It only needs a pause before you press send.</p>`) });

slides.push({ start: 407, steps: [407, 412, 417, 423], html: n => S(`<div class="eyebrow">Your task · pause and try</div><h2 style="margin-bottom:20px">Look back at what you typed</h2>
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'Look back at the <b>last few things you typed</b> into any chatbot')}
${row(n,2,2,'Did any contain <b>a password, an ID number, or a name with a phone number</b>?')}
${row(n,3,3,'If so, make a note to <b>describe the situation without those details</b> next time')}</div>`) });

slides.push({ start: 428, steps: [428, 435, 441], html: n => S(`<div class="center"><div class="eyebrow">Summary</div>
<h1 style="font-size:66px;max-width:1700px;line-height:1.2">Public AI tools <span style="color:${RED}">may keep and use</span> what you type,</h1>
<h1 style="font-size:66px;max-width:1700px;line-height:1.2;margin-top:6px" class="it ${ON(n,1)}">so <span class="violet">personal and confidential information stays out.</span></h1>
<p class="it ${ON(n,2)}" style="font-size:38px;margin-top:44px;color:#57534e"><b>Next:</b> safer habits and three simple rules, so you can still get help without sharing your secrets.</p></div>`) });

await render({ FF, CHROME: process.env.CHROME, AUDIO, OUT, TOTAL, slides, dir: process.env.FRAMES || 'frames-m5-l3' });
