import { render, shellFor, on, ON, CSS } from '../lesson-lib.mjs';
const [FF, AUDIO, OUT, TOTALS] = process.argv.slice(2);
const TOTAL = parseFloat(TOTALS || '383.76');
const meta = { mod: 'Module 5 · Fair and private', id: 'm5-l2', title: 'Spot bias and reduce it' };
const S = shellFor(meta);
const slides = [];
const RED = '#991b1b', GRN = '#166534';
const row = (n, i, num, html) => `<div class="card row ${on(n, i)}" style="padding:22px 36px"><span class="num">${num}</span><span>${html}</span></div>`;
const you = (cls, txt) => `<div class="card hl ${cls}" style="padding:22px 40px"><div style="font-size:28px;font-weight:700;color:#5b21b6;letter-spacing:.06em;margin-bottom:8px">YOU TYPE</div><div style="font-size:38px;line-height:1.35">${txt}</div></div>`;
const bar = (n, i, html, extra = '') => `<div class="card hl ${on(n, i)}" style="margin-top:22px;padding:20px 36px;${extra}"><div style="font-size:42px;font-weight:700">${html}</div></div>`;
const chip = (n, i, t, c = '', fs = 36) => `<span class="pill ${c} ${on(n, i)}" style="font-size:${fs}px;padding:12px 30px">${t}</span>`;
const hdr = (eb, h) => `<div class="eyebrow">${eb}</div><h2 style="margin-bottom:20px">${h}</h2>`;
const habit = (k, t) => `<div class="eyebrow">Habit ${k} of 4</div><h2 style="margin-bottom:20px">${t}</h2>`;

slides.push({ start: 0, steps: [0, 4, 11.1, 16.7], html: n => `<html><head><style>${CSS}</style></head><body>
<div class="bar"><span><b>WELILE SCHOOL OF AI</b> &nbsp;·&nbsp; AI Fundamentals</span><span>${meta.mod}</span></div>
<div class="wrap center"><div class="eyebrow">Module 5 · Lesson 2</div><h1 style="font-size:104px">Spot bias<br><span class="violet">and reduce it</span></h1>
<p class="it ${ON(n,1)}" style="font-size:42px;margin-top:40px;color:#44403c">Last lesson: how bias gets into AI.</p>
<p class="it ${ON(n,2)}" style="font-size:42px;margin-top:14px;color:#44403c">Now we practise <b>spotting</b> it, then learn <b>four habits</b> that reduce it.</p>
<p class="it ${ON(n,3)}" style="font-size:40px;margin-top:14px;color:#5b21b6;font-weight:600">An ordinary chatbot on your phone is enough.</p></div></body></html>` });

slides.push({ start: 21.7, steps: [21.7, 28, 38.9, 42], html: n => S(`${hdr('A short exercise · about two minutes', 'A very short story')}
${you(on(n,1), 'Write a short story about a nurse, a boda boda rider and a company director.')}
<div class="card ${on(n,2)}" style="margin-top:22px;padding:22px 36px"><div style="font-size:38px">We are <b>not</b> trying to prove that AI is bad.</div></div>
<div class="card hl ${on(n,3)}" style="margin-top:16px;padding:22px 36px"><div style="font-size:38px">We are <b>reading carefully</b>, the way you read a draft from a new colleague.</div></div>`) });

slides.push({ start: 46.2, steps: [46.2, 52.1, 55.4, 60.4, 65.3], html: n => S(`${hdr('Why this exercise is worth doing', 'A small, safe place to see how AI fills in blanks')}
<div class="card ${on(n,2)}" style="padding:20px 36px"><div class="muted" style="font-size:26px;margin-bottom:8px">I gave it only three jobs</div><div style="display:flex;gap:14px">${chip(n,2,'A nurse','',38)}${chip(n,2,'A boda boda rider','',38)}${chip(n,2,'A company director','',38)}</div></div>
<div class="card ${on(n,3)}" style="margin-top:18px;padding:20px 36px"><div class="muted" style="font-size:26px;margin-bottom:8px">I did not say who these people are. So it added, by itself:</div><div style="display:flex;gap:14px;flex-wrap:wrap">${chip(n,3,'Names','amber',38)}${chip(n,3,'Genders','amber',38)}${chip(n,3,'Home towns','amber',38)}${chip(n,3,'Money','amber',38)}</div></div>
${bar(n,4,'Those additions show <span class="violet">the patterns it leans on.</span>')}`) });

slides.push({ start: 73, steps: [73, 79.7, 88.5, 91.6, 99.8], html: n => S(`${hdr('I read the story slowly', 'And ask four questions')}
<div class="grid2" style="gap:20px">
<div class="card ${on(n,1)}" style="min-height:230px"><div class="num">1</div><div class="big" style="font-size:36px;margin-top:10px">Who is a man, and who is a woman?</div><div style="font-size:26px;margin-top:8px;color:#57534e">Is the nurse a woman? The rider a man? The director a man?</div></div>
<div class="card ${on(n,2)}" style="min-height:230px"><div class="num">2</div><div class="big" style="font-size:36px;margin-top:10px">What names did it choose?</div><div style="font-size:26px;margin-top:8px;color:#57534e">Do all the names come from one region?</div></div>
<div class="card ${on(n,3)}" style="min-height:230px"><div class="num">3</div><div class="big" style="font-size:36px;margin-top:10px">Which region or tribe?</div><div style="font-size:26px;margin-top:8px;color:#57534e">Does the story say it, or only suggest it?</div></div>
<div class="card ${on(n,4)}" style="min-height:230px"><div class="num">4</div><div class="big" style="font-size:36px;margin-top:10px">Who is rich?</div><div style="font-size:26px;margin-top:8px;color:#57534e">Who is poor? Who has the power, and who is helping?</div></div></div>`) });

slides.push({ start: 112, steps: [112, 117.7, 122.6, 128], html: n => S(`<div class="eyebrow">Something important</div>
<h1 style="font-size:100px;line-height:1.15" class="it ${ON(n,0)}">Results <span class="violet">vary.</span></h1>
<p class="${on(n,1)}" style="font-size:40px;margin-top:18px;color:#44403c">Some days a chatbot makes these assumptions. Some days it does not.</p>
<p class="${on(n,2)}" style="font-size:38px;margin-top:8px;color:#57534e">Run it again tomorrow and you may see something different. Do not worry if your story looks fair.</p>
${bar(n,3,'The skill is not finding bias every time. <span class="violet">The skill is looking, every time.</span>')}`) });

slides.push({ start: 134.6, steps: [134.6, 136.5, 148.9, 153.3, 154.8, 156.2, 161.2, 166], html: n => S(`${hdr('Step two', 'Tell the chatbot what you want')}
${you(on(n,1), 'Rewrite this without assuming anyone’s gender, tribe or background.')}
<p class="${on(n,2)}" style="font-size:38px;margin-top:20px;color:#44403c">Is the new version better? Compare it with the first one.</p>
<div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:10px">${chip(n,3,'Did the names change?','',34)}${chip(n,4,'Did the roles change?','',34)}${chip(n,5,'Did the story still work?','',34)}</div>
<p class="${on(n,6)}" style="font-size:36px;margin-top:20px;color:#44403c">Sometimes yes. Sometimes it only changes a few words. <b>Then you can say more.</b></p>
<p class="${on(n,7)}" style="font-size:42px;margin-top:8px;color:#5b21b6;font-weight:600">You are in charge of the conversation.</p>`) });

slides.push({ start: 168.3, steps: [168.3, 173.2, 180.7, 185.5], html: n => S(`${habit(1, 'Look for who is missing')}
<div class="card hl ${on(n,1)}" style="padding:24px 40px"><div style="font-size:44px;line-height:1.3">Who is <b>missing</b>? Who is shown as a <b>stereotype</b>?</div></div>
<div class="card ${on(n,2)}" style="margin-top:20px;padding:20px 36px"><div style="font-size:36px">Every doctor in the answer is a man, and every cleaner is a woman? <b style="color:${RED}">Worth noticing.</b></div></div>
<div class="card ${on(n,3)}" style="margin-top:16px;padding:20px 36px"><div style="font-size:36px">A story about a market has <b>no one from outside the capital</b>? <b class="violet">Ask why.</b></div></div>`) });

slides.push({ start: 189.6, steps: [189.6, 192, 195.7, 197.5, 204, 211], html: n => S(`${habit(2, 'Never let AI decide alone about people')}
<div style="display:flex;gap:14px;flex-wrap:wrap" class="${on(n,1)}">${chip(n,1,'Hiring','red',38)}${chip(n,1,'Marks','red',38)}${chip(n,1,'Loans','red',38)}${chip(n,1,'Discipline','red',38)}</div>
<p class="${on(n,2)}" style="font-size:38px;margin-top:12px;color:${RED};font-weight:700">These decisions change lives.</p>
<div class="grid2" style="margin-top:12px;gap:20px">
<div class="card ${on(n,3)}" style="padding:20px 30px"><div style="font-size:32px">A headteacher lets a tool decide <b>which students get a place</b>, with no teacher reviewing it.</div></div>
<div class="card ${on(n,4)}" style="padding:20px 30px"><div style="font-size:32px">A small lender lets a tool decide <b>who gets a loan</b>.</div></div></div>
${bar(n,5,'The tool can be <span class="violet">one input.</span> A person must look, ask questions and take responsibility.')}`) });

slides.push({ start: 216, steps: [216, 221.9, 224.8, 226.6], html: n => S(`${habit(3, 'Say what you want')}
<div class="card ${on(n,0)}" style="padding:22px 36px"><div style="font-size:38px">You can write it <b>in your prompt</b>.</div></div>
<div class="card hl ${on(n,1)}" style="margin-top:18px;padding:22px 36px"><div style="font-size:40px">“Use varied names and roles.”</div></div>
<div class="card hl ${on(n,2)}" style="margin-top:14px;padding:22px 36px"><div style="font-size:40px">“Include women and men in different jobs.”</div></div>
<p class="${on(n,3)}" style="font-size:38px;margin-top:20px;color:#5b21b6;font-weight:600">The chatbot cannot read your mind, but it can follow your instruction.</p>`) });

slides.push({ start: 230.8, steps: [230.8, 234.5, 239.2, 256, 262.2, 266.4, 274.1], html: n => S(`${habit(4, 'Ask the people who would be affected')}
<p class="${on(n,1)}" style="font-size:40px;color:#5b21b6;font-weight:600;margin-bottom:12px">They notice what you miss.</p>
<div class="card ${on(n,2)}" style="padding:18px 36px"><div style="font-size:34px">An example: you run a <b>bakery</b> and use AI to write a <b>job advert</b> for a sales assistant.</div></div>
<div style="font-size:30px;margin-top:14px;color:#44403c" class="${on(n,3)}">Before you post it, show it to two or three people:</div>
<div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:8px">${chip(n,3,'A young woman','',34)}${chip(n,3,'A young man','',34)}${chip(n,4,'Someone who speaks a different language','',34)}</div>
<div class="card hl ${on(n,5)}" style="margin-top:16px;padding:18px 36px"><div style="font-size:38px">Ask one question: <b>“Does this advert feel like it is for me?”</b></div></div>
<p class="${on(n,6)}" style="font-size:36px;margin-top:12px;color:#5b21b6;font-weight:600">Their answers will teach you more than any tool.</p>`) });

slides.push({ start: 274.1, steps: [274.1, 280.3, 282.8, 286.5, 289.2], html: n => S(`${hdr('The four habits, slowly', 'Say them with me')}
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'<b>Look</b> for who is missing')}
${row(n,2,2,'<b>Never</b> let AI decide alone about people')}
${row(n,3,3,'<b>Say</b> what you want')}
${row(n,4,4,'<b>Ask</b> the people who would be affected')}</div>`) });

slides.push({ start: 295.4, steps: [295.4, 300.9, 306.6, 310.2], html: n => S(`${hdr('Two small cautions', 'Do not overcorrect, and stay the editor')}
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,0,1,'Do <b>not swing too far the other way</b> and force every story into a pattern')}
${row(n,1,2,'The aim is a <b>fair and natural picture</b>, not a script')}
${row(n,2,3,'<b>You are the editor.</b> The chatbot offers a draft. You decide what goes under your name')}</div>
${bar(n,3,'You do not need to be perfect. <span class="violet">You only need to look, and keep a person in charge.</span>')}`) });

slides.push({ start: 315.6, steps: [315.6, 322.3, 327.2, 333, 342.8], html: n => S(`<div class="eyebrow">Your task · pause and try</div><h2 style="margin-bottom:20px">Try it on your own</h2>
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'Type: <b>“Write a short story about a nurse, a boda boda rider and a company director.”</b>')}
${row(n,2,2,'Read it for assumptions about <b>gender, names, region or tribe</b>, and <b>who is rich</b>')}
${row(n,3,3,'Ask it to <b>rewrite without assuming</b> anyone’s gender, tribe or background, and compare')}</div>
<p class="${on(n,4)}" style="font-size:34px;margin-top:18px;color:#5b21b6;font-weight:600">Then try another topic: your line of work, a hobby, football, rugby, art.</p>`) });

slides.push({ start: 358.7, steps: [358.7, 364.9, 371.3], html: n => S(`<div class="center"><div class="eyebrow">Summary</div>
<h1 style="font-size:62px;max-width:1700px;line-height:1.2">Read every answer for <span class="violet">who is missing.</span></h1>
<h1 style="font-size:62px;max-width:1700px;line-height:1.2;margin-top:6px" class="it ${ON(n,1)}">Keep <span class="violet">a person in charge</span> of decisions about people. Say what you want. Ask the people who will be affected.</h1>
<p class="it ${ON(n,2)}" style="font-size:38px;margin-top:40px;color:#57534e"><b>Next:</b> from fairness to privacy. What happens to the words you type?</p></div>`) });

await render({ FF, CHROME: process.env.CHROME, AUDIO, OUT, TOTAL, slides, dir: process.env.FRAMES || 'frames-m5-l2' });
