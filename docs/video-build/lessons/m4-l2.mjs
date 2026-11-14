import { render, shellFor, on, ON, CSS } from '../lesson-lib.mjs';
const [FF, AUDIO, OUT, TOTALS] = process.argv.slice(2);
const TOTAL = parseFloat(TOTALS || '524.56');
const meta = { mod: 'Module 4 · When AI gets it wrong', id: 'm4-l2', title: 'Real cases: the lawyers and the airline' };
const S = shellFor(meta);
const slides = [];
const RED = '#991b1b', GRN = '#166534';
const row = (n, i, num, html) => `<div class="card row ${on(n, i)}" style="padding:22px 36px"><span class="num">${num}</span><span>${html}</span></div>`;
const tag = (t, c = '') => `<span class="pill ${c}" style="font-size:30px">${t}</span>`;

// 1 title
slides.push({ start: 0, steps: [0, 4, 11, 16], html: n => `<html><head><style>${CSS}</style></head><body>
<div class="bar"><span><b>WELILE SCHOOL OF AI</b> &nbsp;·&nbsp; AI Fundamentals</span><span>${meta.mod}</span></div>
<div class="wrap center"><div class="eyebrow">Module 4 · Lesson 2</div><h1 style="font-size:100px">Real cases:<br><span class="violet">the lawyers and the airline</span></h1>
<p class="it ${ON(n,1)}" style="font-size:42px;margin-top:40px;color:#44403c">Interesting, but does it really matter?</p>
<p class="it ${ON(n,2)}" style="font-size:42px;margin-top:14px;color:#44403c">Is it only a funny mistake?</p>
<p class="it ${ON(n,3)}" style="font-size:44px;margin-top:20px;color:#5b21b6;font-weight:600">Two real cases, told plainly.</p></div></body></html>` });

// 2 lawyers
slides.push({ start: 31, steps: [31, 37, 50, 54, 68, 76], html: n => S(`<div class="eyebrow">Case one · New York · 2023</div><h2 style="margin-bottom:22px">The lawyers</h2>
<div style="display:flex;flex-direction:column;gap:16px">
${row(n,1,1,'Two lawyers filed <b>court papers</b>: the written documents a lawyer gives a judge to make an argument')}
${row(n,2,2,'In them, they <b>cited six cases</b>')}
${row(n,3,3,'To cite a case is to <b>point to an earlier court decision</b>. A normal, important part of the job')}</div>
<div class="card hl ${on(n,4)}" style="margin-top:20px;padding:20px 36px;border-color:#dc2626;box-shadow:0 0 0 4px #fee2e2"><div style="font-size:42px;font-weight:700;color:${RED}">But ChatGPT had invented all six. They did not exist.</div></div>
<p class="${on(n,5)}" style="font-size:34px;margin-top:16px;color:#44403c">The cases sounded real, with names and details that looked right.</p>`) });

// 3 fine + judge
slides.push({ start: 86, steps: [86, 89, 99, 103, 110], html: n => S(`<div class="eyebrow">The result</div>
<div style="display:flex;gap:40px;align-items:center"><div class="card ${on(n,1)}" style="padding:30px 44px;text-align:center"><div class="big" style="font-size:96px;color:${RED}">$5,000</div><div style="font-size:30px;margin-top:6px;color:#57534e">fined in total, the lawyers and their firm</div></div></div>
<div class="card hl ${on(n,2)}" style="margin-top:28px;padding:26px 40px"><div class="muted" style="font-size:26px;margin-bottom:8px">What the judge said</div><div style="font-size:46px;line-height:1.3" class="big">“Using AI for help is <span style="color:${GRN}">not improper</span>.”</div>
<div style="font-size:42px;line-height:1.3;margin-top:10px" class="big it ${ON(n,3)}">“But lawyers <span style="color:${RED}">must check</span> what they file.”</div></div>
<p class="${on(n,4)}" style="font-size:38px;margin-top:22px;color:#5b21b6;font-weight:600">A fair and balanced point. Using AI is allowed. Checking is the person's job.</p>`) });

// 4 what went wrong
slides.push({ start: 119, steps: [119, 121, 125, 131, 135], html: n => S(`<div class="eyebrow">Think about what went wrong</div><h2 style="margin-bottom:22px">It was not that the chatbot sounded foolish</h2>
<div style="display:flex;flex-direction:column;gap:16px">
${row(n,1,1,'It was the <b>opposite</b>')}
${row(n,2,2,'The invented cases <b>looked believable</b>')}
${row(n,3,3,'Just what we learnt: a made-up answer can look <b>more convincing</b> than a true one')}</div>
<div class="card hl ${on(n,4)}" style="margin-top:22px;padding:22px 36px"><div style="font-size:44px;font-weight:700;color:${RED}">And nobody opened the sources to see if the cases were real.</div></div>`) });

// 5 airline 1
slides.push({ start: 139, steps: [139, 146, 155, 167, 174], html: n => S(`<div class="eyebrow">Case two · Canada · 2024</div><h2 style="margin-bottom:22px">The airline</h2>
<div class="grid2" style="gap:22px">
<div class="card ${on(n,1)}" style="min-height:230px"><div class="num">1</div><div style="font-size:34px;margin-top:12px;line-height:1.35">Air Canada had a <b>chatbot on its website</b>. A customer asked about a <b>bereavement discount</b>.</div></div>
<div class="card ${on(n,2)}" style="min-height:230px"><div class="pill amber">Bereavement</div><div style="font-size:32px;margin-top:12px;line-height:1.35">The time after someone close has died. Some airlines offer a lower fare for travelling to a funeral.</div></div>
<div class="card ${on(n,3)}" style="min-height:230px;background:#fef3c7"><div class="pill amber">The chatbot said</div><div style="font-size:36px;margin-top:12px;line-height:1.35">You can claim the discount <b>after your trip</b>.</div></div>
<div class="card hl ${on(n,4)}" style="min-height:230px;border-color:#dc2626;box-shadow:0 0 0 4px #fee2e2"><div class="pill red">The real policy</div><div style="font-size:36px;margin-top:12px;line-height:1.35">Said <b>otherwise</b>.</div></div></div>`) });

// 6 airline 2 tribunal
slides.push({ start: 177, steps: [177, 181, 185, 192], html: n => S(`<div class="eyebrow">The customer took it further</div><h2 style="margin-bottom:22px">The tribunal</h2>
<div style="display:flex;flex-direction:column;gap:16px">
${row(n,1,1,'A <b>tribunal</b> is a body that settles disputes, a little like a court')}
${row(n,2,2,'It held the <b>airline responsible</b> for what its chatbot had said')}</div>
<div class="card hl ${on(n,3)}" style="margin-top:24px;padding:24px 40px;text-align:center"><div style="font-size:34px;color:#57534e">The airline was ordered to pay about</div><div class="big" style="font-size:100px;color:${RED}">CA$812</div></div>`) });

// 7 pause on that
slides.push({ start: 203, steps: [203, 206, 210, 213, 216, 218], html: n => S(`<div class="eyebrow">Let me pause on that</div><h2 style="margin-bottom:22px">The airline's own website</h2>
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'The chatbot was on the <b>airline’s own website</b>')}
${row(n,2,2,'The customer had <b>no reason to doubt it</b>')}
${row(n,3,3,'A clear answer, in a <b>friendly voice</b>')}
${row(n,4,4,'But the answer was <b style="color:'+RED+'">wrong</b>')}</div>
<div class="card hl ${on(n,5)}" style="margin-top:22px;padding:20px 36px"><div style="font-size:42px;font-weight:700;color:#5b21b6">Who must answer for it? The tribunal said: the airline.</div></div>`) });

// 8 side by side
slides.push({ start: 225, steps: [225, 231, 233, 237, 245, 251, 257], html: n => S(`<div class="eyebrow">Two cases, side by side</div><h2 style="margin-bottom:22px">What do they have in common?</h2>
<div class="grid2" style="gap:26px">
<div class="card ${on(n,1)}" style="min-height:430px"><div class="num">1</div><div class="big" style="font-size:44px;margin-top:14px">Both looked <span style="color:${RED}">believable</span></div>
<div style="font-size:32px;margin-top:16px;line-height:1.4;color:#44403c"><div class="${on(n,2)}">The invented cases looked like real cases.</div><div class="${on(n,3)}" style="margin-top:10px">The chatbot's answer sounded like real company policy.</div><div class="${on(n,3)}" style="margin-top:10px;font-weight:700;color:${RED}">Neither looked like a mistake.</div></div></div>
<div class="card hl ${on(n,4)}" style="min-height:430px"><div class="num">2</div><div class="big" style="font-size:44px;margin-top:14px">A <span style="color:#5b21b6">person</span> or company was held responsible</div>
<div style="font-size:32px;margin-top:16px;line-height:1.4;color:#44403c"><div class="${on(n,5)}"><b>Not the chatbot.</b></div><div class="${on(n,5)}" style="margin-top:10px">It does not pay a fine. It does not go to a tribunal.</div><div class="${on(n,6)}" style="margin-top:10px;font-weight:700;color:#5b21b6">A person or a company does.</div></div></div></div>`) });

// 9 the AI told me
slides.push({ start: 259, steps: [259, 264, 272], html: n => S(`<div class="center" style="gap:18px"><div class="eyebrow">The lesson to carry with you</div>
<h1 style="font-size:104px;line-height:1.12" class="it ${ON(n,0)}">You can never say,</h1>
<h1 style="font-size:104px;line-height:1.12;color:${RED}" class="it ${ON(n,1)}">“The AI told me.”</h1>
<p class="it ${ON(n,2)}" style="font-size:46px;margin-top:30px;color:#5b21b6;font-weight:600">If you use what AI gives you, you are the one who answers for it.</p></div>`) });

// 10 imaginary shop
slides.push({ start: 277, steps: [277, 287, 304, 311, 317, 326], html: n => S(`<div class="eyebrow">Closer to home · <span style="color:${RED}">this did not happen, I am inventing it</span></div><h2 style="margin-bottom:18px" class="it ${ON(n,1)}">A small shop in Entebbe, with a WhatsApp chatbot</h2>
<div style="display:flex;flex-direction:column;gap:16px">
<div class="${on(n,2)}" style="background:#ede9fe;color:#4c1d95;border-radius:30px;padding:20px 34px;font-size:38px;max-width:1000px"><b style="font-size:24px;letter-spacing:.08em">CUSTOMER</b><br>Can I get my money back if the phone case does not fit?</div>
<div class="${on(n,3)}" style="background:#fef3c7;color:#78350f;border-radius:30px;padding:20px 34px;font-size:38px;max-width:1000px;margin-left:auto"><b style="font-size:24px;letter-spacing:.08em">SHOP CHATBOT</b><br>Yes, within <b>thirty days</b>.</div>
<div class="${on(n,4)}"><span class="pill red" style="font-size:34px">The shop's real rule: seven days. The customer comes on day twenty.</span></div>
<div class="card hl ${on(n,5)}" style="padding:18px 36px"><div style="font-size:42px;font-weight:700">Who is in trouble? <span style="color:${RED}">The shop owner.</span> Not the chatbot.</div></div></div>`) });

// 11 student quotation
slides.push({ start: 334, steps: [334, 337.5, 343, 347], html: n => S(`<div class="eyebrow">Another example · also imagined</div><h2 style="margin-bottom:22px">A student and a famous speech</h2>
<div style="display:flex;flex-direction:column;gap:16px">
${row(n,0,1,'A student asks a chatbot for a <b>quotation from a famous speech</b>')}
${row(n,1,2,'…and puts it in an <b>essay</b>')}
${row(n,2,3,'The quotation is <b style="color:'+RED+'">invented</b>. The lecturer cannot find it')}</div>
<div class="card hl ${on(n,3)}" style="margin-top:22px;padding:20px 36px"><div style="font-size:44px;font-weight:700">Whose name is on the essay? <span class="violet">The student's.</span></div></div>`) });

// 12 size changes
slides.push({ start: 364, steps: [364, 368, 372], html: n => S(`<div class="eyebrow">The size of the problem changes</div>
<div class="grid2" style="margin-top:6px"><div class="card ${on(n,0)}" style="min-height:240px;text-align:center"><div class="pill red">A court fine</div><div class="big" style="font-size:54px;margin-top:20px">Serious</div></div>
<div class="card ${on(n,1)}" style="min-height:240px;text-align:center"><div class="pill amber">A lost mark</div><div class="big" style="font-size:54px;margin-top:20px">Smaller</div></div></div>
<div class="card hl ${on(n,2)}" style="margin-top:26px;padding:24px 36px"><div style="font-size:46px;font-weight:700;color:#5b21b6">But the idea is the same: the person who uses the answer is responsible for it.</div></div>`) });

// 13 not never use AI
slides.push({ start: 376, steps: [376, 382, 386], html: n => S(`<div class="center" style="gap:20px"><div class="eyebrow">Let us be fair</div>
<p style="font-size:42px;color:#44403c">It is easy to take the wrong lesson from these stories.</p>
<h1 style="font-size:92px" class="it ${ON(n,1)}">The lesson is <span style="color:${RED}">not</span> “never use AI.”</h1>
<p class="it ${ON(n,2)}" style="font-size:42px;margin-top:20px;color:#44403c">Remember the judge: using AI for help is <b>not improper</b>.</p></div>`) });

// 14 key
slides.push({ start: 395, steps: [395, 397, 399, 403], html: n => S(`<div class="center" style="gap:12px"><div class="eyebrow">The lesson is this</div>
<h1 style="font-size:100px;line-height:1.15" class="it ${ON(n,1)}">Using AI is <span style="color:${GRN}">fine.</span></h1>
<h1 style="font-size:100px;line-height:1.15" class="it ${ON(n,2)}">Checking what you use is <span class="violet">your job.</span></h1>
<p class="it ${ON(n,3)}" style="font-size:40px;margin-top:30px;color:#44403c">A skill you can learn. It does not take long. <b>Next video: a simple three-step method.</b></p></div>`) });

// 15 question
slides.push({ start: 410, steps: [410, 418, 422, 426], html: n => S(`<div class="eyebrow">A question that works every time</div><h2 style="margin-bottom:24px">Before you use anything AI has told you, ask:</h2>
<div class="card hl ${on(n,1)}" style="padding:36px 44px"><div class="big" style="font-size:64px;line-height:1.2">“If this is wrong, <span style="color:${RED}">who will be responsible?</span>”</div></div>
<div class="card ${on(n,3)}" style="margin-top:28px;padding:24px 40px;background:#ede9fe;border-color:#6d28d9"><div style="font-size:48px;font-weight:700;color:#4c1d95">If the answer is “me”, then check it.</div></div>`) });

// 16 summary
slides.push({ start: 429, steps: [429, 430, 443, 449, 464], html: n => S(`<div class="eyebrow">Let me sum up</div><h2 style="margin-bottom:22px">Two real cases</h2>
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'<b>2023:</b> two New York lawyers cited six cases ChatGPT had invented, and were fined <b>$5,000</b>')}
${row(n,2,2,'The judge: using AI for help is not improper, but lawyers <b>must check</b> what they file')}
${row(n,3,3,'<b>2024:</b> an airline chatbot gave wrong bereavement-discount information, and a tribunal made the airline pay about <b>CA$812</b>')}
${row(n,4,4,'Both looked believable. In both, <b>a person was responsible</b>')}</div>`) });

// 17 task
slides.push({ start: 472, steps: [472, 477, 482, 489], html: n => S(`<div class="eyebrow">Your task · think about it</div><h2 style="margin-bottom:22px">No hands-on task this time</h2>
<div style="display:flex;flex-direction:column;gap:18px">
${row(n,1,1,'Think of <b>one thing you could use AI for this week</b>')}
${row(n,2,2,'Ask: if the answer were wrong, <b>who would be responsible</b>, and what would it cost?')}
${row(n,3,3,'Write down <b>one thing you would check</b> before using it')}</div>`) });

// 18 summary + bridge
slides.push({ start: 492, steps: [492, 503, 510], html: n => S(`<div class="center"><div class="eyebrow">Summary</div>
<h1 style="font-size:64px;max-width:1700px;line-height:1.2">Both mistakes looked believable, and in both cases <span style="color:${RED}">a person was responsible.</span></h1>
<h1 style="font-size:64px;max-width:1700px;line-height:1.2;margin-top:8px" class="it ${ON(n,1)}">Using AI is fine. <span class="violet">Checking what you use is your job.</span></h1>
<p class="it ${ON(n,2)}" style="font-size:38px;margin-top:44px;color:#57534e"><b>Next:</b> how to check, with a simple three-step method.</p></div>`) });

await render({ FF, CHROME: process.env.CHROME, AUDIO, OUT, TOTAL, slides, dir: process.env.FRAMES || 'frames-m4-l2' });
