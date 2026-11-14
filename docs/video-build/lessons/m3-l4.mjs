import { render, shellFor, on, ON, CSS } from '../lesson-lib.mjs';
const [FF, AUDIO, OUT, TOTALS] = process.argv.slice(2);
const TOTAL = parseFloat(TOTALS || '516.57');
const meta = { mod: 'Module 3 · Make AI work for you', id: 'm3-l4', title: 'Job 3: Summarise long and messy things' };
const S = shellFor(meta);
const slides = [];
const RED = '#991b1b', GRN = '#166534';
const row = (n, i, num, html) => `<div class="card row ${on(n, i)}" style="padding:22px 36px"><span class="num">${num}</span><span>${html}</span></div>`;
const you = (cls, txt) => `<div class="card hl ${cls}" style="padding:22px 40px"><div style="font-size:28px;font-weight:700;color:#5b21b6;letter-spacing:.06em;margin-bottom:8px">YOU TYPE</div><div style="font-size:38px;line-height:1.35">${txt}</div></div>`;
const bar = (n, i, html, extra = '') => `<div class="card hl ${on(n, i)}" style="margin-top:22px;padding:20px 36px;${extra}"><div style="font-size:42px;font-weight:700">${html}</div></div>`;
const chip = (n, i, t, c = '', fs = 36) => `<span class="pill ${c} ${on(n, i)}" style="font-size:${fs}px;padding:12px 30px">${t}</span>`;
const hdr = (eb, h) => `<div class="eyebrow">${eb}</div><h2 style="margin-bottom:20px">${h}</h2>`;
const mark = t => `<span style="background:#fde68a;color:#78350f;border-radius:10px;padding:2px 10px">${t}</span>`;

slides.push({ start: 0, steps: [0, 8, 16], html: n => `<html><head><style>${CSS}</style></head><body>
<div class="bar"><span><b>WELILE SCHOOL OF AI</b> &nbsp;·&nbsp; AI Fundamentals</span><span>${meta.mod}</span></div>
<div class="wrap center"><div class="eyebrow">Module 3 · Job 3</div><h1 style="font-size:100px">Summarise<br><span class="violet">long and messy things</span></h1>
<p class="it ${ON(n,1)}" style="font-size:42px;margin-top:40px;color:#44403c">To summarise: make something long <b>shorter</b>, keeping the main points.</p>
<p class="it ${ON(n,2)}" style="font-size:44px;margin-top:20px;color:#5b21b6;font-weight:600">A summary is not a copy. It is the part you need to know.</p></div></body></html>` });

slides.push({ start: 21, steps: [21, 25, 27.5, 30, 34, 44], html: n => S(`${hdr('We all have long and messy things', 'Sound familiar?')}
<div class="grid2" style="gap:20px">
<div class="card ${on(n,1)}" style="min-height:170px"><div class="big" style="font-size:38px">A 40-page handout</div><div style="font-size:28px;margin-top:8px;color:#57534e">From a lecturer</div></div>
<div class="card ${on(n,2)}" style="min-height:170px"><div class="big" style="font-size:38px">A WhatsApp thread</div><div style="font-size:28px;margin-top:8px;color:#57534e">With 90 messages</div></div>
<div class="card ${on(n,3)}" style="min-height:170px"><div class="big" style="font-size:38px">Meeting minutes</div><div style="font-size:28px;margin-top:8px;color:#57534e">That nobody wrote down properly</div></div>
<div class="card ${on(n,4)}" style="min-height:170px"><div class="big" style="font-size:38px">A report from work</div><div style="font-size:28px;margin-top:8px;color:#57534e">To read before tomorrow morning</div></div></div>
${bar(n,5,'A chatbot can take you from long and messy to <span class="violet">short and clear.</span>')}`) });

slides.push({ start: 50, steps: [50, 52, 60, 63, 67, 71, 77], html: n => S(`${hdr('Three ways', 'What can you ask for?')}
<div class="grid3" style="gap:22px">
<div class="card ${on(n,1)}" style="min-height:420px"><div class="num">1</div><div class="big" style="font-size:40px;margin-top:14px">A long document</div><div style="font-size:30px;margin-top:10px;color:#44403c">A few <b>bullet points</b>.</div><div class="it ${ON(n,2)}" style="font-size:26px;margin-top:12px;color:#57534e">A bullet point is one short line in a list.</div></div>
<div class="card ${on(n,3)}" style="min-height:420px"><div class="num">2</div><div class="big" style="font-size:40px;margin-top:14px">Meeting notes</div><div style="font-size:30px;margin-top:10px;color:#44403c">The <b>action items</b>.</div><div class="it ${ON(n,4)}" style="font-size:26px;margin-top:12px;color:#57534e">An action item is a task someone has to do.</div></div>
<div class="card ${on(n,5)}" style="min-height:420px"><div class="num">3</div><div class="big" style="font-size:40px;margin-top:14px">Messy notes</div><div style="font-size:30px;margin-top:10px;color:#44403c">A <b>table</b>: task, owner, due date.</div><div class="it ${ON(n,6)}" style="font-size:26px;margin-top:12px;color:#57534e">The owner is the person responsible for the task.</div></div></div>`) });

slides.push({ start: 79, steps: [79, 85, 89, 95, 98.5, 103, 109], html: n => S(`${hdr('The first case', 'A long document')}
${you(on(n,1), `Summarize this 3-page report into ${n >= 3 ? mark('3') : '3'} key takeaways.`)}
<p class="${on(n,2)}" style="font-size:32px;margin-top:16px;color:#57534e">A takeaway is the main thing to remember.</p>
<p class="${on(n,3)}" style="font-size:36px;margin-top:10px;color:#44403c">The number tells the chatbot <b>how short</b> you want it.</p>
<p class="${on(n,4)}" style="font-size:36px;margin-top:6px;color:#92400e;font-weight:600">That is the format part of the three-part request from Module 2.</p>
<div class="card ${on(n,5)}" style="margin-top:16px;padding:18px 36px"><div style="font-size:34px">A student: a <b>public article</b>. A business owner: a <b>long report</b>.</div></div>
<p class="${on(n,6)}" style="font-size:36px;margin-top:12px;color:#5b21b6;font-weight:600">In both cases, the chatbot has something to work with, because you gave it the text.</p>`) });

slides.push({ start: 113, steps: [113, 117, 120, 122], html: n => S(`${hdr('But there is a warning', 'A summary can go wrong')}
<div style="display:flex;flex-direction:column;gap:16px">
${row(n,1,1,'It can <b>leave out something important</b>')}
${row(n,2,2,'It can <b>change a number or a name</b>')}</div>
${bar(n,3,'So we always <span class="violet">check the summary against the original.</span>')}`) });

slides.push({ start: 126, steps: [126, 133, 144, 151, 154, 156, 159, 163], html: n => S(`${hdr('Messy notes from a planning call · try-it-now task', 'I will do it first')}
<div class="card" style="padding:26px 40px"><div class="muted" style="font-size:26px;margin-bottom:8px">Notes I pasted</div><div style="font-size:34px;line-height:1.55">
<span class="it ${ON(n,2)}">Planning call, Friday.</span> <span class="it ${ON(n,3)}">Grace will send venue quotes by Monday.</span> <span class="it ${ON(n,4)}">We need to confirm 40 guests.</span> <span class="it ${ON(n,5)}">Joseph says catering budget is 2 million.</span> <span class="it ${ON(n,6)}">Brian to design the invitation, needs it before the 14th.</span> <span class="it ${ON(n,7)}">Still not sure if the hall is free on the 20th.</span></div></div>
<p class="${on(n,1)}" style="font-size:34px;margin-top:20px;color:#5b21b6;font-weight:600">These are sample notes, safe to paste.</p>`) });

slides.push({ start: 166, steps: [166, 169, 171, 173], html: n => S(`${hdr('It is a bit messy, is it not?', 'What makes it messy')}
<div style="display:flex;flex-direction:column;gap:16px">
${row(n,1,1,'The <b>tasks</b> are hidden inside sentences')}
${row(n,2,2,'Some have a <b>person</b>. Some do not')}
${row(n,3,3,'Some have a <b>date</b>. Some do not')}</div>`) });

slides.push({ start: 176, steps: [176, 178, 187], html: n => S(`${hdr('Now the request', 'Ask for a table')}
${you(on(n,1), 'Make a table with three columns: task, owner, due date. If something is missing, write not stated.')}
<p class="${on(n,2)}" style="font-size:40px;margin-top:26px;color:#5b21b6;font-weight:600">And here is the table…</p>`) });

const T = (n) => `<table style="border-collapse:separate;border-spacing:0;width:100%;font-size:38px"><tr style="background:#ede9fe;color:#4c1d95;font-weight:700"><td style="padding:18px 28px;border-radius:18px 0 0 0">Task</td><td style="padding:18px 28px">Owner</td><td style="padding:18px 28px;border-radius:0 18px 0 0">Due date</td></tr>
<tr class="it ${ON(n,2)}" style="background:#fff"><td style="padding:18px 28px;border-bottom:1px solid #e7e2da">Send venue quotes</td><td style="padding:18px 28px;border-bottom:1px solid #e7e2da">Grace</td><td style="padding:18px 28px;border-bottom:1px solid #e7e2da">Monday</td></tr>
<tr class="it ${ON(n,3)}" style="background:#fff"><td style="padding:18px 28px;border-bottom:1px solid #e7e2da">Confirm 40 guests</td><td style="padding:18px 28px;border-bottom:1px solid #e7e2da;color:${GRN};font-weight:700">Not stated</td><td style="padding:18px 28px;border-bottom:1px solid #e7e2da;color:${GRN};font-weight:700">Not stated</td></tr>
<tr class="it ${ON(n,4)}" style="background:#fff"><td style="padding:18px 28px">Design the invitation</td><td style="padding:18px 28px">Brian</td><td style="padding:18px 28px">Before the 14th</td></tr></table>`;
slides.push({ start: 187, steps: [187, 192, 197, 201, 205], html: n => S(`${hdr('The chatbot’s table', 'Let me read it')}<div class="card" style="padding:0;overflow:hidden">${T(n)}</div>`) });

slides.push({ start: 209, steps: [209, 214, 216, 218, 223, 228, 235], html: n => S(`${hdr('Why did I add “If something is missing, write not stated”?', 'Because of how chatbots work')}
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'A chatbot <b>predicts what fits</b>')}
${row(n,2,2,'If there is a gap, it may <b>fill it with a guess</b>')}
<div class="card ${on(n,3)}" style="padding:18px 36px;border-color:#dc2626;background:#fef2f2"><div style="font-size:34px">It might make <b>Grace the owner</b> of the guest list, because her name is nearby.</div></div>
<div class="card ${on(n,4)}" style="padding:18px 36px;border-color:#dc2626;background:#fef2f2"><div style="font-size:34px">It might <b>invent a due date</b>. Neat, and wrong.</div></div>
<div class="card hl ${on(n,5)}" style="padding:18px 36px"><div style="font-size:36px">“Not stated” gives it a <b>safe way to say the notes do not say</b>. <span class="it ${ON(n,6)}" style="color:${GRN};font-weight:700">Much better than a confident guess.</span></div></div></div>`) });

slides.push({ start: 237, steps: [237, 244, 251, 256], html: n => S(`${hdr('The most important step', 'Check the table against the notes')}
<div style="display:flex;flex-direction:column;gap:16px">
<div class="card ${on(n,1)}" style="padding:20px 36px"><div style="font-size:38px"><span style="color:${GRN};font-weight:700">✔</span> <b>Row 1:</b> Grace, venue quotes, by Monday. It is in the notes.</div></div>
<div class="card ${on(n,2)}" style="padding:20px 36px"><div style="font-size:38px"><span style="color:${GRN};font-weight:700">✔</span> <b>Row 2:</b> Confirm 40 guests. The notes do not say who or when, so <b>“not stated”</b> is correct.</div></div>
<div class="card ${on(n,3)}" style="padding:20px 36px"><div style="font-size:38px"><span style="color:${GRN};font-weight:700">✔</span> <b>Row 3:</b> Brian, the invitation, before the 14th.</div></div></div>`) });

slides.push({ start: 260, steps: [260, 264, 267, 274, 281], html: n => S(`${hdr('A second question', 'Is anything left out?')}
<div style="display:flex;flex-direction:column;gap:16px">
<div class="card ${on(n,2)}" style="padding:22px 36px"><div style="font-size:38px">“Joseph says the <b>catering budget is 2 million</b>.” <span class="pill amber" style="font-size:28px">Not a task</span></div></div>
<div class="card ${on(n,3)}" style="padding:22px 36px"><div style="font-size:38px">“Not sure if the <b>hall is free on the 20th</b>.” <span class="pill amber" style="font-size:28px">A question someone must answer</span></div></div></div>
${bar(n,4,'Not lost by mistake. <span class="violet">But I do not want to forget them.</span>')}`) });

slides.push({ start: 287, steps: [287, 289, 294, 299, 304], html: n => S(`${hdr('So I ask a follow-up', 'Do not restart. Refine.')}
${you(on(n,1), 'What information in the notes is not in the table?')}
<div class="card ${on(n,2)}" style="margin-top:20px;padding:22px 36px"><div class="pill green">The chatbot gives me</div><div style="font-size:38px;margin-top:10px">The <b>catering budget</b> and the <b>hall question</b>.</div></div>
<p class="${on(n,3)}" style="font-size:38px;margin-top:20px;color:#5b21b6;font-weight:600">A table of tasks, and a short list of open points.</p>
<p class="${on(n,4)}" style="font-size:34px;margin-top:6px;color:#44403c">I can send it to the team, after I check it once more.</p>`) });

slides.push({ start: 307, steps: [307, 309.5, 317, 321], html: n => S(`<div class="center" style="gap:12px"><h1 style="font-size:120px;line-height:1.15" class="it ${ON(n,1)}">AI drafts. <span class="violet">You decide.</span></h1>
<p class="it ${ON(n,2)}" style="font-size:42px;margin-top:20px;color:#44403c">The chatbot sorted the messy notes.</p>
<p class="it ${ON(n,3)}" style="font-size:42px;margin-top:6px;color:#5b21b6;font-weight:600">I made sure nothing was invented and nothing important was lost.</p></div>`) });

slides.push({ start: 325, steps: [325, 328, 336, 340, 345, 347, 348.5, 350, 354], html: n => S(`${hdr('Some practical points', 'Three habits')}
<div style="display:flex;flex-direction:column;gap:12px">
<div class="card row ${on(n,1)}" style="padding:18px 36px"><span class="num">1</span><span><b>Always give the chatbot the text.</b><br><span style="font-size:28px;color:#57534e" class="it ${ON(n,2)}">Do not ask it to summarise something it has not seen. AI works better with your own material.</span></span></div>
<div class="card row ${on(n,3)}" style="padding:18px 36px"><span class="num">2</span><span><b>Tell it how short, and in what shape.</b><br><span style="display:flex;gap:12px;flex-wrap:wrap;margin-top:8px">${chip(n,4,'“Three key takeaways”','',26)}${chip(n,5,'“A table with three columns”','',26)}${chip(n,6,'“Five bullet points”','',26)}</span></span></div>
<div class="card row ${on(n,7)}" style="padding:18px 36px"><span class="num">3</span><span><b>Check the numbers, names and dates.</b><br><span style="display:flex;gap:12px;flex-wrap:wrap;margin-top:8px" class="it ${ON(n,8)}">${chip(n,8,'40 guests','amber',26)}${chip(n,8,'2 million','amber',26)}${chip(n,8,'the 14th','amber',26)}${chip(n,8,'the 20th','amber',26)}<span style="font-size:26px;color:#57534e;align-self:center">Find each one in the original.</span></span></span></div></div>`) });

slides.push({ start: 361, steps: [361, 365, 370, 372, 375, 378], html: n => S(`${hdr('The same idea with the three-takeaways prompt', 'Check where each point comes from')}
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'I paste a <b>public article</b> and ask for three takeaways')}
${row(n,2,2,'I do <b>not</b> just copy them')}
${row(n,3,3,'I <b>find the place in the article</b> where each one comes from')}</div>
<div class="card ${on(n,4)}" style="margin-top:20px;padding:20px 36px;border-color:#dc2626;background:#fef2f2"><div style="font-size:40px;font-weight:700;color:${RED}">If I cannot find it, I do not use it.</div></div>
<p class="${on(n,5)}" style="font-size:34px;margin-top:16px;color:#44403c">Two minutes. It protects me from passing on something the chatbot made up.</p>`) });

slides.push({ start: 383, steps: [383, 388.5], html: n => S(`<div class="center" style="gap:18px"><div class="eyebrow">Point four</div>
<h1 style="font-size:84px;line-height:1.15" class="it ${ON(n,0)}">If it matters, <span class="violet">read the original too.</span></h1>
<p class="it ${ON(n,1)}" style="font-size:42px;margin-top:20px;color:#44403c">A summary is a shortcut for <b>first understanding</b>. It is not always a replacement for reading the important part yourself.</p></div>`) });

slides.push({ start: 396, steps: [396, 406.3, 411.7, 424, 433], html: n => S(`${hdr('The privacy point matters a lot here', 'Real notes often hold private details')}
<div style="display:flex;flex-direction:column;gap:12px">
${row(n,0,1,'Real meeting notes often have <b>names, phone numbers, salaries and private business decisions</b>. They do not go into a public chatbot')}
${row(n,1,2,'My planning-call notes were <b>samples</b>, safe to paste')}
${row(n,2,3,'For your own work, <b>remove names and private numbers</b> first, or describe the problem instead')}
${row(n,3,4,'A full contract: remove names and amounts, or use a tool <b>your organisation has approved</b>')}</div>
<div class="card ${on(n,4)}" style="margin-top:16px;padding:16px 36px;border-color:#dc2626;background:#fef2f2"><div style="font-size:32px;color:${RED};font-weight:700">Never: a mobile money statement, a client list, or a copy of someone’s ID. Module 5 covers this.</div></div>`) });

slides.push({ start: 440, steps: [440, 441.5, 444.8, 447.5, 451.5], html: n => S(`${hdr('So the job is simple', 'Four steps')}
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'Take something <b>long or messy</b>')}
${row(n,2,2,'Tell the chatbot the <b>shape</b> you want')}
${row(n,3,3,'Ask for <b>“not stated”</b> where there are gaps')}
${row(n,4,4,'<b>Check it against the original</b>')}</div>`) });

slides.push({ start: 454.1, steps: [454.1, 456.5, 460.3, 473.9], html: n => S(`<div class="eyebrow">Your task · pause and try</div><h2 style="margin-bottom:20px">Try the planning-call notes</h2>
<div style="display:flex;flex-direction:column;gap:16px">
${row(n,1,1,'Paste the <b>sample planning-call notes</b> into your chatbot')}
${row(n,2,2,'Ask: <b>“Make a table with three columns: task, owner, due date. If something is missing, write not stated.”</b>')}
${row(n,3,3,'Then <b>check every row</b> against the notes')}</div>`) });

slides.push({ start: 481, steps: [481, 490, 495.8], html: n => S(`<div class="center"><div class="eyebrow">Summary</div>
<h1 style="font-size:66px;max-width:1700px;line-height:1.2">Summarising turns <span class="violet">long and messy</span> into <span class="violet">short and clear.</span></h1>
<h1 style="font-size:66px;max-width:1700px;line-height:1.2;margin-top:6px" class="it ${ON(n,1)}">But only <span style="color:${RED}">you</span> can check that nothing was invented or lost.</h1>
<p class="it ${ON(n,2)}" style="font-size:38px;margin-top:44px;color:#57534e"><b>Next:</b> Job 4. We use AI for numbers: a spreadsheet formula, without writing code.</p></div>`) });

await render({ FF, CHROME: process.env.CHROME, AUDIO, OUT, TOTAL, slides, dir: process.env.FRAMES || 'frames-m3-l4' });
