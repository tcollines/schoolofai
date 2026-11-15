import { render, shellFor, on, ON, CSS } from '../lesson-lib.mjs';
const [FF, AUDIO, OUT, TOTALS] = process.argv.slice(2);
const TOTAL = parseFloat(TOTALS || '538.57');
const meta = { mod: 'Module 6 · Using AI responsibly', id: 'm6-l2', title: 'Stay the human in the loop, and your 30-day plan' };
const S = shellFor(meta);
const slides = [];
const RED = '#991b1b', GRN = '#166534';
const row = (n, i, num, html) => `<div class="card row ${on(n, i)}" style="padding:22px 36px"><span class="num">${num}</span><span>${html}</span></div>`;
const bar = (n, i, html, extra = '') => `<div class="card hl ${on(n, i)}" style="margin-top:22px;padding:20px 36px;${extra}"><div style="font-size:42px;font-weight:700">${html}</div></div>`;
const chip = (n, i, t, c = '', fs = 36) => `<span class="pill ${c} ${on(n, i)}" style="font-size:${fs}px;padding:12px 30px">${t}</span>`;
const hdr = (eb, h) => `<div class="eyebrow">${eb}</div><h2 style="margin-bottom:20px">${h}</h2>`;
const three = (n, i) => `<span class="pill ${on(n, i)}" style="font-size:44px;padding:14px 36px;background:#ede9fe">Use it.</span> <span class="pill ${on(n, i + 1)}" style="font-size:44px;padding:14px 36px;background:#dbeafe;color:#1e40af">Check it.</span> <span class="pill ${on(n, i + 2)}" style="font-size:44px;padding:14px 36px;background:#dcfce7;color:#166534">Protect people.</span>`;

slides.push({ start: 0, steps: [0, 11.5, 18.6, 27.8, 34.6], html: n => `<html><head><style>${CSS}</style></head><body>
<div class="bar"><span><b>WELILE SCHOOL OF AI</b> &nbsp;·&nbsp; AI Fundamentals</span><span>${meta.mod}</span></div>
<div class="wrap center"><div class="eyebrow">Module 6 · Lesson 2 · The last lesson</div><h1 style="font-size:96px">Stay the human<br><span class="violet">in the loop</span></h1><p style="font-size:44px;margin-top:10px;color:#57534e">…and your 30-day plan</p>
<p class="it ${ON(n,1)}" style="font-size:38px;margin-top:30px;color:#44403c">You have come a long way. At the start, AI may have felt like something for experts.</p>
<p class="it ${ON(n,2)}" style="font-size:38px;margin-top:8px;color:#44403c">Now you can ask it clearly, put it to work, check it, notice bias and protect private information.</p>
<p class="it ${ON(n,3)}" style="font-size:42px;margin-top:14px;color:#5b21b6;font-weight:600">One big idea. One practical plan.</p></div></body></html>` });

slides.push({ start: 40.2, steps: [40.2, 42.6, 46, 50.6], html: n => S(`${hdr('Let me explain the phrase', '“Human in the loop”')}
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'A <b>loop</b> is a process that goes round, step by step')}
${row(n,2,2,'<b>Human in the loop</b> means a person is part of that process')}</div>
${bar(n,3,'A person <span class="violet">reviews and decides</span> before AI output affects real people.')}`) });

slides.push({ start: 54.8, steps: [54.8, 57.2, 65.8, 68.5, 71.5, 74.5, 80], html: n => S(`${hdr('Why?', 'AI is powerful, but…')}
<div style="display:flex;gap:14px;flex-wrap:wrap">${chip(n,1,'No human judgment','red',38)}${chip(n,2,'No empathy','red',38)}${chip(n,2,'No common sense','red',38)}</div>
<div style="display:flex;flex-direction:column;gap:12px;margin-top:22px">
<div class="card ${on(n,3)}" style="padding:16px 32px"><div style="font-size:34px">It does not know your <b>customer is grieving</b>.</div></div>
<div class="card ${on(n,4)}" style="padding:16px 32px"><div style="font-size:34px">It does not know your lecturer expects <b>your own voice</b>.</div></div>
<div class="card ${on(n,5)}" style="padding:16px 32px"><div style="font-size:34px">It does not know a word in Luganda <b>carries a different feeling in your village</b>.</div></div></div>
<p class="${on(n,6)}" style="font-size:44px;margin-top:20px;color:#5b21b6;font-weight:700">You know these things.</p>`) });

slides.push({ start: 82.9, steps: [82.9, 86, 89.5, 92.5], html: n => S(`${hdr('So three jobs stay with you', 'What stays human')}
<div style="display:flex;flex-direction:column;gap:16px">
${row(n,1,1,'<b>You verify</b> the facts')}${row(n,2,2,'<b>You protect</b> privacy')}${row(n,3,3,'<b>You make</b> the decision')}</div>`) });

slides.push({ start: 95.3, steps: [95.3, 102.1, 108.5], html: n => S(`${hdr('A real situation', 'The bakery, again')}
<div class="card ${on(n,1)}" style="padding:22px 36px"><div style="font-size:38px">A small bakery uses a chatbot to <b>draft a message</b> to a customer whose <b>cake order went wrong</b>.</div></div>
<div class="card ${on(n,2)}" style="margin-top:18px;padding:22px 36px"><div style="font-size:38px">The chatbot writes a polite apology, <b>quickly</b>. Good.</div></div>
<p class="${on(n,2)}" style="font-size:42px;margin-top:22px;color:#5b21b6;font-weight:600">Now the human does their part.</p>`) });

slides.push({ start: 116, steps: [116, 123.2, 132, 137.4, 140.5, 148.2, 150.5], html: n => S(`${hdr('The owner does three things', 'Verify. Protect. Decide.')}
<div style="display:flex;flex-direction:column;gap:14px">
<div class="card ${on(n,0)}" style="padding:18px 36px"><div style="font-size:34px"><b>Checks the facts.</b> Was it the Saturday order? Was the price UGX 120,000? <span class="pill green ${on(n,1)}" style="font-size:28px;margin-left:10px">Verifying</span></div></div>
<div class="card ${on(n,2)}" style="padding:18px 36px"><div style="font-size:34px"><b>Leaves out the customer’s phone number</b> when asking for help. <span class="pill green ${on(n,3)}" style="font-size:28px;margin-left:10px">Protecting privacy</span></div></div>
<div class="card ${on(n,4)}" style="padding:18px 36px"><div style="font-size:34px"><b>Reads it and asks:</b> Would I be happy to send this? Does it sound like me? Should I offer a refund? <span class="pill green ${on(n,5)}" style="font-size:28px;margin-left:10px">Deciding</span></div></div></div>
${bar(n,6,'The chatbot cannot decide that. It does not own the bakery. <span class="violet">You do.</span>')}`) });

slides.push({ start: 158.4, steps: [158.4, 160.5, 166, 172.5], html: n => S(`<div class="center" style="gap:14px"><div class="eyebrow">The whole course in one line</div>
<h1 style="font-size:120px;line-height:1.2" class="it ${ON(n,1)}"><span class="violet">Use</span> it.</h1>
<h1 style="font-size:120px;line-height:1.2" class="it ${ON(n,2)}"><span style="color:#1e40af">Check</span> it.</h1>
<h1 style="font-size:120px;line-height:1.2" class="it ${ON(n,3)}"><span style="color:${GRN}">Protect</span> people.</h1></div>`) });

slides.push({ start: 179.8, steps: [179.8, 184.5, 197.2, 205.1, 210.3, 214.7, 224.6], html: n => S(`<div class="grid3" style="gap:22px;margin-top:6px;align-items:start">
<div class="card" style="min-height:620px;border-color:#6d28d9"><div class="pill">Use it</div><div style="font-size:32px;margin-top:14px;line-height:1.4">AI is a powerful <b>co-pilot for real tasks</b>.<div class="it ${ON(n,1)}" style="margin-top:12px;font-size:28px;color:#57534e">A teacher, a shopkeeper, a counsellor, a tailor: in every field.</div><div class="it ${ON(n,2)}" style="margin-top:12px"><b>Brainstorm. Draft. Summarise. Automate.</b></div></div></div>
<div class="card ${on(n,3)}" style="min-height:620px;border-color:#2563eb"><div class="pill" style="background:#dbeafe;color:#1e40af">Check it</div><div style="font-size:32px;margin-top:14px;line-height:1.4"><b>Verify the facts</b>, and look for <b>bias</b>, before you rely on anything.</div></div>
<div class="card ${on(n,5)}" style="min-height:620px;border-color:#16a34a"><div class="pill green">Protect people</div><div style="font-size:32px;margin-top:14px;line-height:1.4">Keep <b>private and confidential information</b> out of public tools.</div></div></div>
<p class="${on(n,6)}" style="font-size:40px;margin-top:20px;color:#5b21b6;font-weight:700;text-align:center">If you remember nothing else, remember those six words.</p>`) });

slides.push({ start: 232.7, steps: [232.7, 236.4, 241.7], html: n => S(`<div class="center" style="gap:16px"><div class="eyebrow">Now, the plan</div>
<h1 style="font-size:84px;line-height:1.15" class="it ${ON(n,0)}">Knowing something is good.</h1>
<h1 style="font-size:84px;line-height:1.15" class="it ${ON(n,1)}"><span class="violet">Using it every week is better.</span></h1>
<p class="it ${ON(n,2)}" style="font-size:44px;margin-top:20px;color:#44403c">A simple <b>30-day plan</b>, built on a small habit.</p></div>`) });

slides.push({ start: 245.7, steps: [245.7, 252.5, 256.3, 262.1, 272.4, 279.2], html: n => S(`${hdr('First, three checks', 'Run them on anything AI helps you make')}
<div style="display:flex;flex-direction:column;gap:12px">
${row(n,1,1,'<b>Is it true?</b> Have I verified the facts that matter?')}
${row(n,2,2,'<b>Is it right for my reader?</b> Do the tone and length suit them?')}
<div class="card ${on(n,3)}" style="padding:12px 36px 12px 124px;background:#fffbeb;border-color:#d97706"><div style="font-size:28px;color:#78350f">People do not like reading a lot. A 1,000-word article? They will not read it.</div></div>
${row(n,4,3,'<b>Is it safe to share?</b> Have I left out personal and confidential information?')}</div>
<p class="${on(n,5)}" style="font-size:38px;margin-top:16px;color:#5b21b6;font-weight:600">About a minute. Use them on an email, a report, a post or a homework draft.</p>`) });

slides.push({ start: 289.2, steps: [289.2, 291.7, 300.6, 303.5, 309.3, 322.2, 325.1, 332.2, 334.4, 341.5, 343.4], html: n => S(`<div class="eyebrow">Your 30-day plan</div>
<div class="grid2" style="gap:18px;margin-top:6px">
<div class="card ${on(n,1)}" style="min-height:260px"><div class="pill">Week 1</div><div style="font-size:30px;margin-top:10px;line-height:1.35"><b>Pick one task you do every week.</b> An email, meeting minutes, a spreadsheet.<div class="it ${ON(n,2)}" style="margin-top:8px;color:#57534e">Try the prompts from this course on it.</div></div></div>
<div class="card ${on(n,3)}" style="min-height:260px"><div class="pill">Week 2</div><div style="font-size:30px;margin-top:10px;line-height:1.35"><b>Add a second task.</b><div class="it ${ON(n,4)}" style="margin-top:8px;color:#57534e">Note the time you save, even ten minutes. Numbers keep you honest.</div></div></div>
<div class="card ${on(n,5)}" style="min-height:260px"><div class="pill">Week 3</div><div style="font-size:30px;margin-top:10px;line-height:1.35"><b>Teach one person one idea.</b> A sister, a classmate, a colleague at the market.<div class="it ${ON(n,6)}" style="margin-top:8px;color:#57534e">Explain it in your own words. Teaching is the best way to learn.</div></div></div>
<div class="card ${on(n,8)}" style="min-height:260px"><div class="pill">Week 4</div><div style="font-size:30px;margin-top:10px;line-height:1.35"><b>Review your wins and your misses.</b> What worked? What went wrong? Choose your next step.</div></div></div>
${bar(n,10,'A miss is not a failure. <span class="violet">It is the check doing its job.</span>')}`) });

slides.push({ start: 347.2, steps: [347.2, 350.4, 360.2, 369.3, 374.5, 380.1], html: n => S(`${hdr('An example of how it may look', 'A student in Kampala')}
<div style="display:flex;flex-direction:column;gap:12px">
${row(n,1,1,'<b>Week 1:</b> turns rough lecture notes into a clear summary')}
${row(n,2,2,'<b>Week 2:</b> adds a polite email to a lecturer. Saves about <b>20 minutes a day</b>')}
${row(n,3,3,'<b>Week 3:</b> teaches her roommate to write a prompt with <b>context, task and format</b>')}
${row(n,4,4,'<b>Week 4:</b> one summary had a <b>wrong date</b>, so she decides to <b>check every date</b> from now on')}</div>
<p class="${on(n,5)}" style="font-size:42px;margin-top:20px;color:#5b21b6;font-weight:600">That is a perfect month.</p>`) });

slides.push({ start: 383.2, steps: [383.2, 386.5, 388.8, 391.5], html: n => S(`<div class="center" style="gap:14px">
<h1 style="font-size:84px;line-height:1.15" class="it ${ON(n,0)}">Small steps, <span class="violet">done every week.</span></h1>
<p class="it ${ON(n,1)}" style="font-size:44px;margin-top:16px;color:#44403c">You do not need a big project.</p>
<p class="it ${ON(n,2)}" style="font-size:44px;margin-top:6px;color:#44403c">You do not need to be the best in your class or office.</p>
<p class="it ${ON(n,3)}" style="font-size:48px;margin-top:14px;color:#5b21b6;font-weight:700">You only need to keep going, and keep the checks.</p></div>`) });

slides.push({ start: 395.6, steps: [395.6, 400.8, 403.5, 405.2, 409.2, 414.7, 420.5, 429.2], html: n => S(`${hdr('Now, where you finish', 'What comes next')}
<div style="display:flex;flex-direction:column;gap:10px">
${row(n,1,1,'Complete the <b>module quiz</b>')}
${row(n,2,2,'Take the <b>final assessment</b>: <span class="it ${ON(n,3)}">20 questions, <b>80%</b> to pass. <span class="it ${ON(n,4)}">Three tries in 24 hours, so no pressure.</span></span>')}
${row(n,5,3,'Get your <b>certificate</b>, with a <b>unique ID</b> anyone can verify online')}
${row(n,6,4,'Optional <b>live classes</b>, in the timetable. Replays are posted afterwards')}
${row(n,7,5,'Ask us about the <b>next programmes</b> from Welile School of AI')}</div>`) });

slides.push({ start: 438.6, steps: [438.6, 442.7, 450.4], html: n => S(`<div class="center" style="gap:16px"><div class="eyebrow">Remember who you are in this</div>
<h1 style="font-size:84px;line-height:1.15" class="it ${ON(n,0)}">You are <span style="color:${RED}">not a passenger.</span></h1>
<h1 style="font-size:70px;line-height:1.2" class="it ${ON(n,1)}">You are the person in charge. <span class="violet">AI is the assistant.</span></h1>
<div style="margin-top:20px">${three(n,2)}</div></div>`) });

slides.push({ start: 455.4, steps: [455.4, 459.8, 465.5, 473.7], html: n => S(`${hdr('One more thing', 'Tell your friends, family and colleagues')}
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'The course is <b>open to everyone</b> who wants to learn how to use AI')}
${row(n,2,2,'It is a <b>free course</b>, available to anyone who registers')}</div>
${bar(n,3,'Be our <span class="violet">ambassador.</span>')}`) });

slides.push({ start: 476.3, steps: [476.3, 480, 490.5, 493], html: n => S(`<div class="eyebrow">Your task · pause and try</div><h2 style="margin-bottom:20px">Write your Week 1 task</h2>
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'Write it on <b>paper</b>, in your <b>phone notes</b>, or in the <b>notes tab</b> beside this lesson')}
${row(n,2,2,'<b>One real task you do every week</b> that you will try with AI')}
${row(n,3,3,'Add <b>a date</b> for when you will do it')}</div>`) });

slides.push({ start: 494.5, steps: [494.5, 495.5, 498, 500.5, 504.8], html: n => S(`<div class="eyebrow">In one breath</div><h2 style="margin-bottom:20px">You are the human in the loop</h2>
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'You <b>verify</b> the facts')}${row(n,2,2,'You <b>protect</b> privacy')}${row(n,3,3,'You <b>make</b> the decision')}</div>
<div style="margin-top:26px">${three(n,4)}</div>`) });

slides.push({ start: 510, steps: [510, 512.8, 516.5, 519.8, 525.9, 537.4], html: n => S(`<div class="center"><div class="eyebrow">Take your next steps</div>
<h1 style="font-size:60px;max-width:1700px;line-height:1.25" class="it ${ON(n,1)}">Take your module quiz, then the final assessment, then <span class="violet">get your certificate.</span></h1>
<p class="it ${ON(n,2)}" style="font-size:40px;margin-top:20px;color:#44403c">Come to a live class if you have questions.</p>
<p class="it ${ON(n,3)}" style="font-size:40px;margin-top:6px;color:#44403c">Ask us about the next programmes from Welile School of AI.</p>
<p class="it ${ON(n,4)}" style="font-size:44px;margin-top:26px;color:#5b21b6;font-weight:600">Thank you for learning with us. Be a good ambassador for this school of AI.</p>
<h1 style="font-size:80px;margin-top:20px" class="it ${ON(n,5)}">Thank you so much.</h1></div>`) });

await render({ FF, CHROME: process.env.CHROME, AUDIO, OUT, TOTAL, slides, dir: process.env.FRAMES || 'frames-m6-l2' });
