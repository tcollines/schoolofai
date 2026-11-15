import { render, shellFor, on, ON, CSS } from '../lesson-lib.mjs';
const [FF, AUDIO, OUT, TOTALS] = process.argv.slice(2);
const TOTAL = parseFloat(TOTALS || '528.77');
const meta = { mod: 'Module 6 · Using AI responsibly', id: 'm6-l1', title: 'Green, amber, red' };
const S = shellFor(meta);
const slides = [];
const RED = '#991b1b', GRN = '#166534', AMB = '#92400e';
const TL = { g: ['#dcfce7', '#16a34a', GRN], a: ['#fef3c7', '#d97706', AMB], r: ['#fee2e2', '#dc2626', RED] };
const row = (n, i, num, html) => `<div class="card row ${on(n, i)}" style="padding:22px 36px"><span class="num">${num}</span><span>${html}</span></div>`;
const bar = (n, i, html, extra = '') => `<div class="card hl ${on(n, i)}" style="margin-top:22px;padding:20px 36px;${extra}"><div style="font-size:42px;font-weight:700">${html}</div></div>`;
const chip = (n, i, t, k, fs = 34) => `<span class="pill ${on(n, i)}" style="font-size:${fs}px;padding:12px 30px;background:${TL[k][0]};color:${TL[k][2]}">${t}</span>`;
const tag = (k, t) => `<span class="pill" style="font-size:34px;padding:8px 28px;background:${TL[k][1]};color:#fff">${t}</span>`;
const hdr = (k, label, h) => `<div style="display:flex;align-items:center;gap:20px;margin-bottom:18px"><span style="width:56px;height:56px;border-radius:50%;background:${TL[k][1]};flex:none"></span><div><div class="eyebrow" style="margin:0;color:${TL[k][2]}">${label}</div><h2 style="margin:0">${h}</h2></div></div>`;
const light = (k, on_) => `<span style="display:inline-block;width:140px;height:140px;border-radius:50%;background:${TL[k][1]};opacity:${on_ ? 1 : 0};transition:none"></span>`;
const caseCard = (n, i, num, html) => `<div class="card ${on(n, i)}" style="padding:18px 28px;min-height:150px"><div class="num" style="width:50px;height:50px;font-size:26px">${num}</div><div style="font-size:30px;margin-top:10px;line-height:1.3">${html}</div></div>`;
const ans = (n, i, k, num, html) => `<div class="card ${on(n, i)}" style="padding:22px 32px;border-color:${TL[k][1]};background:${TL[k][0]}"><div style="display:flex;gap:20px;align-items:flex-start"><span class="num" style="background:${TL[k][1]}">${num}</span><div style="font-size:34px;line-height:1.35"><b style="color:${TL[k][2]}">${k === 'g' ? 'Green' : k === 'a' ? 'Amber' : 'Red'}.</b> ${html}</div></div></div>`;

slides.push({ start: 0, steps: [0, 4, 9.8, 17, 26], html: n => `<html><head><style>${CSS}</style></head><body>
<div class="bar"><span><b>WELILE SCHOOL OF AI</b> &nbsp;·&nbsp; AI Fundamentals</span><span>${meta.mod}</span></div>
<div class="wrap center"><div class="eyebrow">Module 6 · Lesson 1</div><h1 style="font-size:110px"><span style="color:#16a34a">Green</span>, <span style="color:#d97706">amber</span>, <span style="color:#dc2626">red</span></h1>
<p class="it ${ON(n,1)}" style="font-size:40px;margin-top:36px;color:#44403c">Over five modules you have learnt a lot.</p>
<p class="it ${ON(n,2)}" style="font-size:38px;margin-top:10px;color:#44403c">What AI is. How to ask it clearly. How to put it to work.</p>
<p class="it ${ON(n,3)}" style="font-size:38px;margin-top:10px;color:#44403c">How to check it, notice bias, and protect privacy.</p>
<p class="it ${ON(n,4)}" style="font-size:44px;margin-top:18px;color:#5b21b6;font-weight:600">Now, one simple tool that pulls it all together.</p></div></body></html>` });

slides.push({ start: 32.6, steps: [32.6, 33, 34.2, 35.4, 39.2], html: n => S(`<div class="eyebrow">It works like a traffic light</div>
<div style="display:flex;gap:40px;align-items:center;margin:16px 0 28px">${light('g', n >= 1)}${light('a', n >= 2)}${light('r', n >= 3)}</div>
<h1 style="font-size:76px;line-height:1.15" class="it ${ON(n,4)}">Before you use AI, ask: <span class="violet">which colour is this?</span></h1>`) });

slides.push({ start: 39.2, steps: [39.2, 47.4, 49.2, 51.2, 53.6, 55, 60.7, 66.9, 75.4], html: n => S(`${hdr('g', 'Green means go', 'Low risk')}
<div style="display:flex;gap:14px;flex-wrap:wrap">${chip(n,1,'Brainstorm names and ideas','g')}${chip(n,2,'Draft a thank-you note','g')}${chip(n,3,'Explain a concept simply','g')}${chip(n,4,'Summarise a public article','g')}</div>
<div class="card ${on(n,5)}" style="margin-top:22px;padding:18px 36px"><div style="font-size:36px">Why green? If the AI makes a <b>small mistake</b>, little harm is done.</div><div style="font-size:32px;margin-top:6px;color:#44403c" class="it ${ON(n,6)}">You can see the result, judge it, and improve it.</div></div>
<div class="card ${on(n,7)}" style="margin-top:14px;padding:18px 36px"><div style="font-size:32px">A baker asks for <b>ten name ideas</b> for a new cake. If nine are poor, <b>nothing is lost</b>.</div></div>
<p class="${on(n,8)}" style="font-size:40px;margin-top:16px;color:${GRN};font-weight:700">Green does not mean stop thinking. It means the risk is low.</p>`) });

slides.push({ start: 75.4, steps: [75.4, 82.5, 86.5, 91.2, 94.5, 97.8, 103, 108.3], html: n => S(`${hdr('a', 'Amber means check carefully', 'Useful, but you check')}
<div style="display:flex;gap:14px;flex-wrap:wrap">${chip(n,1,'Facts, numbers and quotes','a')}${chip(n,2,'Health, legal and money information','a')}${chip(n,3,'Anything that goes out under your name','a')}</div>
<div class="card ${on(n,4)}" style="margin-top:22px;padding:18px 36px"><div style="font-size:34px">Remember <b>hallucinations</b> from Module 4.</div><div style="font-size:34px;margin-top:6px" class="it ${ON(n,5)}">A number, a date or a quote is <b>a claim to check</b>.</div></div>
<div class="card ${on(n,6)}" style="margin-top:14px;padding:18px 36px"><div style="font-size:34px">Sending it to a customer, a lecturer or an employer? <b>It carries your name.</b></div></div>
<p class="${on(n,7)}" style="font-size:40px;margin-top:16px;color:${AMB};font-weight:700">You are responsible, so read it carefully first.</p>`) });

slides.push({ start: 113.5, steps: [113.5, 121.3, 126.6, 129.5, 139.3, 143.4, 154.6], html: n => S(`${hdr('r', 'Red means stop', 'Serious or hard to undo')}
<div style="display:flex;flex-direction:column;gap:12px">
<div class="card ${on(n,1)}" style="padding:16px 32px;border-color:#dc2626;background:#fef2f2"><div style="font-size:34px"><b>Pasting personal or confidential information</b> into a public tool</div></div>
<div class="card ${on(n,2)}" style="padding:16px 32px;border-color:#dc2626;background:#fef2f2"><div style="font-size:34px"><b>Letting AI alone decide</b> about people</div></div>
<div class="card ${on(n,3)}" style="padding:16px 32px;border-color:#dc2626;background:#fef2f2"><div style="font-size:34px"><b>Submitting AI work you cannot explain</b>, or that your school or employer does not allow</div></div></div>
<div class="card ${on(n,4)}" style="margin-top:14px;padding:16px 32px"><div style="font-size:32px"><b>Students:</b> if your school has a rule about AI, follow it.</div><div style="font-size:30px;margin-top:6px;color:#44403c" class="it ${ON(n,5)}">Hand in something you cannot explain in your own words? It is not really your work, and it will not help you learn.</div></div>
<p class="${on(n,6)}" style="font-size:38px;margin-top:12px;color:#5b21b6;font-weight:700">Stay human. Your work stays human, and you own it.</p>`) });

slides.push({ start: 160.6, steps: [160.6, 165.1, 171, 177], html: n => S(`<div class="eyebrow">The colours are not fixed for ever</div><h2 style="margin-bottom:22px">A task can move</h2>
<div style="display:flex;align-items:center;gap:24px">
<div class="card ${on(n,1)}" style="flex:1;border-color:#16a34a;background:#f0fdf4"><div class="pill" style="background:#16a34a;color:#fff;font-size:30px">Green</div><div style="font-size:36px;margin-top:12px">Summarise a public article</div></div>
<span class="arrow ${on(n,2)}">→</span>
<div class="card ${on(n,2)}" style="flex:1;border-color:#d97706;background:#fffbeb"><div class="pill" style="background:#d97706;color:#fff;font-size:30px">Amber</div><div style="font-size:36px;margin-top:12px">Quote its figures in a report with your name</div></div></div>
${bar(n,3,'Ask the colour question <span class="violet">again, at each step.</span> That is the habit.')}`) });

slides.push({ start: 182.2, steps: [182.2, 187.8, 195, 201.7, 209.3, 216.6, 224.5, 231.6], html: n => S(`<div class="eyebrow">Your turn</div><h2 style="margin-bottom:18px">Green, amber or red?</h2>
<p style="font-size:32px;color:#44403c;margin-bottom:16px">Six cases. Decide, and say why. <b>Pause the video after each one</b> if you need to.</p>
<div class="grid3" style="gap:20px">
${caseCard(n,2,1,'Asking AI for <b>name ideas</b> for your new shop')}
${caseCard(n,3,2,'Pasting a customer’s <b>ID details</b> to fill a form faster')}
${caseCard(n,4,3,'Asking AI <b>what documents</b> you need to register a business')}
${caseCard(n,5,4,'Asking AI for a <b>cover letter draft</b>, then editing it')}
${caseCard(n,6,5,'Following an AI’s <b>medicine dose for a child</b> without checking')}
${caseCard(n,7,6,'Pasting your company’s <b>unreleased results</b> to get a summary')}</div>`) });

slides.push({ start: 238.3, steps: [238.3, 238.8, 244.8, 258.9], html: n => S(`<div class="eyebrow">The answers</div><h2 style="margin-bottom:18px">Cases one to three</h2>
<div style="display:flex;flex-direction:column;gap:16px">
${ans(n,1,'g',1,'Name ideas for a shop are low risk. Pick the ones you like.')}
${ans(n,2,'r',2,'Personal information never goes into a public tool. A customer’s ID details belong to them, and you were trusted with them.')}
${ans(n,3,'a',3,'A useful start, but rules change and AI can be wrong. <b>Check the official source.</b>')}</div>`) });

slides.push({ start: 271.1, steps: [271.1, 271.6, 282.8, 297.5], html: n => S(`<div class="eyebrow">The answers</div><h2 style="margin-bottom:18px">Cases four to six</h2>
<div style="display:flex;flex-direction:column;gap:16px">
${ans(n,1,'g',4,'A good use, with a note: edit it, make it sound like you, and check that every fact about you is true.')}
${ans(n,2,'r',5,'Health matters. Never follow a medicine dose from a chatbot without checking. Ask a doctor or pharmacist.')}
${ans(n,3,'r',6,'Unreleased company results are confidential. Use only an approved, secure tool, if at all.')}</div>`) });

slides.push({ start: 302.5, steps: [302.5, 310.3, 313.2, 316.4], html: n => S(`<div class="eyebrow">What the six answers have in common</div><h2 style="margin-bottom:20px">Where does the risk sit?</h2>
<div style="display:flex;flex-direction:column;gap:14px">
<div class="card ${on(n,1)}" style="padding:20px 36px;border-color:#16a34a;background:#f0fdf4"><div style="font-size:38px"><b style="color:${GRN}">Green:</b> little can go wrong</div></div>
<div class="card ${on(n,2)}" style="padding:20px 36px;border-color:#d97706;background:#fffbeb"><div style="font-size:38px"><b style="color:${AMB}">Amber:</b> AI is useful, but <b>the final responsibility is always yours</b></div></div>
<div class="card ${on(n,3)}" style="padding:20px 36px;border-color:#dc2626;background:#fef2f2"><div style="font-size:38px"><b style="color:${RED}">Red:</b> the harm to a person, or to your job, can be <b>serious or hard to undo</b></div></div></div>`) });

slides.push({ start: 323.6, steps: [323.6, 326, 330.1], html: n => S(`<div class="center" style="gap:16px"><div class="eyebrow">How did you do?</div>
<h2 style="font-size:56px" class="it ${ON(n,0)}">If you disagreed with one, that is fine.</h2>
<h2 style="font-size:56px" class="it ${ON(n,1)}">The point is not to memorise a list.</h2>
<h1 style="font-size:84px;line-height:1.15;margin-top:14px" class="it ${ON(n,2)}">The point is to <span class="violet">ask the question before you act.</span></h1></div>`) });

slides.push({ start: 336.6, steps: [336.6, 346.6, 349.5, 354.2, 360.3, 367.7], html: n => S(`<div class="eyebrow">The colours work for tasks</div><h2 style="margin-bottom:18px">Choosing a tool? Four questions</h2>
<div class="${on(n,1)}" style="font-size:32px;color:#44403c;margin-bottom:14px">For choosing a tool, or when your school or company asks whether to use one:</div>
<div class="grid2" style="gap:20px">
<div class="card ${on(n,2)}" style="min-height:180px"><div class="num">1</div><div class="big" style="font-size:38px;margin-top:10px">Does it do good for people?</div></div>
<div class="card ${on(n,3)}" style="min-height:180px"><div class="num">2</div><div class="big" style="font-size:38px;margin-top:10px">Is it built and tested for safety?</div><div style="font-size:26px;margin-top:6px;color:#57534e">Or rushed out untested?</div></div>
<div class="card ${on(n,4)}" style="min-height:180px"><div class="num">3</div><div class="big" style="font-size:38px;margin-top:10px">Is it fair?</div><div style="font-size:26px;margin-top:6px;color:#57534e">Does it avoid creating or reinforcing unfair bias?</div></div>
<div class="card ${on(n,5)}" style="min-height:180px"><div class="num">4</div><div class="big" style="font-size:38px;margin-top:10px">Is someone accountable?</div><div style="font-size:26px;margin-top:6px;color:#57534e">Does a real person or company answer to the people it affects?</div></div></div>`) });

slides.push({ start: 373.5, steps: [373.5, 377, 384.1, 393, 401], html: n => S(`<div class="eyebrow">For your information</div><h2 style="margin-bottom:20px">Where the four questions come from</h2>
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'From <b>Google’s original 2018 AI principles</b>')}
${row(n,2,2,'In <b>February 2025</b>, Google restated its principles as <b>three pillars</b>')}</div>
<div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:20px">${chip(n,3,'Bold innovation','a',32)}${chip(n,3,'Responsible development and deployment','g',32)}${chip(n,3,'Collaborative progress','a',32)}</div>
<p class="${on(n,4)}" style="font-size:36px;margin-top:22px;color:#5b21b6;font-weight:600">You do not need to remember that. The four questions are practical, and you can ask them of any tool.</p>`) });

slides.push({ start: 407.1, steps: [407.1, 412.6, 421, 425.3, 428.5, 439.2], html: n => S(`<div class="eyebrow">Think of a mobile money agent</div><h2 style="margin-bottom:20px">Who is accountable?</h2>
<div class="card ${on(n,1)}" style="padding:18px 36px"><div style="font-size:34px">You trust an agent because there is <b>a shop</b>, <b>a name</b>, and <b>a place to complain</b> if something goes wrong.</div></div>
<p class="${on(n,2)}" style="font-size:36px;margin-top:16px;color:#44403c">You can see who is accountable.</p>
<p class="${on(n,3)}" style="font-size:38px;margin-top:6px;color:#5b21b6;font-weight:600">Ask the same of an AI tool.</p>
<div class="card hl ${on(n,4)}" style="margin-top:12px;padding:18px 36px"><div style="font-size:36px;font-weight:700">If it makes a serious mistake, <span class="violet">who answers to the person who was harmed?</span></div></div>
<p class="${on(n,5)}" style="font-size:32px;margin-top:16px;color:#44403c">A headteacher choosing a marking tool, or a shop owner choosing a tool for customer messages, can ask all four before saying yes.</p>`) });

slides.push({ start: 445.8, steps: [445.8, 449, 455.6, 458, 460.5, 465.5, 466.8, 468], html: n => S(`<div class="eyebrow">Let me close with the guide</div>
<div style="display:flex;flex-direction:column;gap:12px;margin-top:6px">
<div class="card ${on(n,1)}" style="padding:16px 36px;border-color:#16a34a;background:#f0fdf4"><div style="font-size:38px"><b style="color:${GRN}">Green.</b> Low risk. Go.</div></div>
<div class="card ${on(n,2)}" style="padding:16px 36px;border-color:#d97706;background:#fffbeb"><div style="font-size:38px"><b style="color:${AMB}">Amber.</b> Check carefully.</div></div>
<div class="card ${on(n,3)}" style="padding:16px 36px;border-color:#dc2626;background:#fef2f2"><div style="font-size:38px"><b style="color:${RED}">Red.</b> Stop.</div></div></div>
<p class="${on(n,4)}" style="font-size:32px;margin-top:18px;color:#44403c">And four questions for any tool:</p>
<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:8px"><span class="pill ${on(n,4)}" style="font-size:32px">Does it do good?</span><span class="pill ${on(n,5)}" style="font-size:32px">Is it safe?</span><span class="pill ${on(n,6)}" style="font-size:32px">Is it fair?</span><span class="pill ${on(n,7)}" style="font-size:32px">Is someone accountable?</span></div>`) });

slides.push({ start: 469.8, steps: [469.8, 471.5, 479.4, 485.4], html: n => S(`<div class="eyebrow">Your task · pause and try</div><h2 style="margin-bottom:20px">Label three things</h2>
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'Write down <b>three things</b> you have done, or want to do, with AI this month')}
${row(n,2,2,'Label each one <span class="pill" style="font-size:30px;background:#16a34a;color:#fff">green</span> <span class="pill" style="font-size:30px;background:#d97706;color:#fff">amber</span> or <span class="pill" style="font-size:30px;background:#dc2626;color:#fff">red</span>')}
${row(n,3,3,'For every amber or red one, note <b>what you will check or change</b>')}</div>`) });

slides.push({ start: 495, steps: [495, 501, 504, 518.2], html: n => S(`<div class="center"><div class="eyebrow">Summary</div>
<h1 style="font-size:68px;max-width:1700px;line-height:1.2" class="it ${ON(n,1)}">Before you use AI, ask <span class="violet">which colour it is.</span></h1>
<h1 style="font-size:68px;max-width:1700px;line-height:1.2;margin-top:10px" class="it ${ON(n,2)}"><span style="color:#16a34a">Green: go.</span> <span style="color:#d97706">Amber: check.</span> <span style="color:#dc2626">Red: stop.</span></h1>
<p class="it ${ON(n,3)}" style="font-size:38px;margin-top:44px;color:#57534e"><b>Next:</b> staying the human in the loop, and your own 30-day plan.</p></div>`) });

await render({ FF, CHROME: process.env.CHROME, AUDIO, OUT, TOTAL, slides, dir: process.env.FRAMES || 'frames-m6-l1' });
