import { render, shellFor, on, ON, CSS } from '../lesson-lib.mjs';
const [FF, AUDIO, OUT, TOTALS] = process.argv.slice(2);
const TOTAL = parseFloat(TOTALS || '505.36');
const meta = { mod: 'Module 3 · Make AI work for you', id: 'm3-l5', title: 'Job 4: Automate without writing code' };
const S = shellFor(meta);
const slides = [];
const RED = '#991b1b', GRN = '#166534';
const row = (n, i, num, html) => `<div class="card row ${on(n, i)}" style="padding:22px 36px"><span class="num">${num}</span><span>${html}</span></div>`;
const you = (cls, txt) => `<div class="card hl ${cls}" style="padding:22px 40px"><div style="font-size:28px;font-weight:700;color:#5b21b6;letter-spacing:.06em;margin-bottom:8px">YOU TYPE</div><div style="font-size:36px;line-height:1.35">${txt}</div></div>`;
const bar = (n, i, html, extra = '') => `<div class="card hl ${on(n, i)}" style="margin-top:22px;padding:20px 36px;${extra}"><div style="font-size:42px;font-weight:700">${html}</div></div>`;
const hdr = (eb, h) => `<div class="eyebrow">${eb}</div><h2 style="margin-bottom:20px">${h}</h2>`;
const mark = t => `<span style="background:#fde68a;color:#78350f;border-radius:10px;padding:2px 12px;font-weight:700">${t}</span>`;
const SALES = [['Jan', '1,200,000'], ['Feb', '1,380,000'], ['Mar', '1,242,000'], ['Apr', '1,490,400']];
const GROWTH = ['', '15%', '−10%', '20%'];
// spreadsheet mock: showC = show growth column, hiB2 = highlight B2, showN = number of growth rows visible
const sheet = (o = {}) => `<div class="card" style="padding:0;overflow:hidden;max-width:1100px"><table style="border-collapse:collapse;width:100%;font-size:34px">
<tr style="background:#f5f5f4;color:#57534e;font-weight:700"><td style="padding:12px 24px;width:90px"></td><td style="padding:12px 24px">A · Month</td><td style="padding:12px 24px">B · Sales (UGX)</td>${o.showC ? '<td style="padding:12px 24px;background:#ede9fe;color:#4c1d95">C · Growth</td>' : ''}</tr>
${SALES.map((r, i) => `<tr style="border-top:1px solid #e7e2da"><td style="padding:12px 24px;color:#a8a29e">${i + 2}</td><td style="padding:12px 24px">${r[0]}</td><td style="padding:12px 24px;${o.hiB2 && i === 0 ? 'background:#fde68a;font-weight:700' : ''}">${r[1]}</td>${o.showC ? `<td style="padding:12px 24px;background:#faf5ff;font-weight:700;color:${GROWTH[i] && GROWTH[i].startsWith('−') ? RED : GRN}">${i >= 1 && i <= (o.rows || 0) ? GROWTH[i] : ''}</td>` : ''}</tr>`).join('')}</table></div>`;

slides.push({ start: 0, steps: [0, 7.6, 15.2], html: n => `<html><head><style>${CSS}</style></head><body>
<div class="bar"><span><b>WELILE SCHOOL OF AI</b> &nbsp;·&nbsp; AI Fundamentals</span><span>${meta.mod}</span></div>
<div class="wrap center"><div class="eyebrow">Module 3 · Job 4</div><h1 style="font-size:100px">Automate<br><span class="violet">without writing code</span></h1>
<p class="it ${ON(n,1)}" style="font-size:42px;margin-top:40px;color:#44403c">To automate: let a tool do <b>repeating work</b> for you, so you do not do it by hand every time.</p>
<p class="it ${ON(n,2)}" style="font-size:44px;margin-top:20px;color:#5b21b6;font-weight:600">And you can do it without writing code.</p></div></body></html>` });

slides.push({ start: 15.2, steps: [15.2, 18.1, 21.4, 27.2, 30.9], html: n => S(`${hdr('Without writing code', 'You do not need to be a programmer')}
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'<b>Code</b> is the written instructions a computer follows')}
${row(n,2,2,'Many people think you must be a programmer to automate anything')}
${row(n,3,3,'With a chatbot, you can <b>describe what you want in plain words</b>')}</div>
${bar(n,4,'It helps close the gap between what you can <span class="violet">imagine</span> and what you can <span class="violet">build on your own.</span>')}`) });

slides.push({ start: 36.5, steps: [36.5, 39.6, 42.4, 48.5, 53.5, 56.7, 60.6, 63.7], html: n => S(`${hdr('Three ways to use it', 'What can a chatbot automate?')}
<div class="grid3" style="gap:22px">
<div class="card ${on(n,1)}" style="min-height:470px"><div class="num">1</div><div class="big" style="font-size:38px;margin-top:14px">Spreadsheet formulas</div><div style="font-size:26px;margin-top:12px;color:#57534e;line-height:1.4" class="it ${ON(n,2)}">A spreadsheet is a grid of rows and columns, like Excel or Google Sheets.</div><div style="font-size:26px;margin-top:10px;color:#57534e;line-height:1.4" class="it ${ON(n,3)}">A formula is an instruction the spreadsheet follows to calculate something. Ask for one in plain words.</div></div>
<div class="card ${on(n,4)}" style="min-height:470px"><div class="num">2</div><div class="big" style="font-size:38px;margin-top:14px">Troubleshooting</div><div style="font-size:28px;margin-top:12px;color:#44403c;line-height:1.4" class="it ${ON(n,5)}">When software is not behaving, ask for <b>step-by-step help</b>.</div></div>
<div class="card ${on(n,6)}" style="min-height:470px"><div class="num">3</div><div class="big" style="font-size:38px;margin-top:14px">Small macros</div><div style="font-size:26px;margin-top:12px;color:#57534e;line-height:1.4" class="it ${ON(n,7)}">A macro is a small set of steps a spreadsheet can repeat for you, to save repetitive clicking and copying.</div></div></div>`) });

slides.push({ start: 71, steps: [71, 74.5], html: n => S(`<div class="center" style="gap:18px"><div class="eyebrow">Today</div>
<h1 style="font-size:92px;line-height:1.15" class="it ${ON(n,0)}">We spend our time on <span class="violet">spreadsheet formulas.</span></h1>
<p class="it ${ON(n,1)}" style="font-size:44px;margin-top:20px;color:#44403c">It is the one you can <b>try straight away</b>.</p></div>`) });

slides.push({ start: 79, steps: [79, 82.7, 86.7, 92.8, 93.9, 96.7], html: n => S(`${hdr('Back to our baker', 'Did I sell more this month?')}
<div class="card ${on(n,1)}" style="padding:22px 36px"><div style="font-size:38px">She writes down her <b>sales at the end of every month</b>.</div></div>
<div class="card ${on(n,2)}" style="margin-top:16px;padding:22px 36px"><div style="font-size:38px">She wants to know: did I sell <b>more than last month</b>, and <b>by how much</b>?</div></div>
<div class="grid2" style="margin-top:20px;gap:22px">
<div class="card ${on(n,4)}" style="min-height:170px"><div class="pill amber">By hand</div><div style="font-size:34px;margin-top:12px">Work it out on a calculator, for every month.</div></div>
<div class="card hl ${on(n,5)}" style="min-height:170px"><div class="pill green">With a formula</div><div style="font-size:34px;margin-top:12px">Ask a chatbot for a formula. The spreadsheet does it <b>every time</b>.</div></div></div>`) });

slides.push({ start: 101.8, steps: [101.8, 106.8, 113, 116.9, 122.3, 127.7], html: n => S(`${hdr('Here is my spreadsheet', 'Months and sales')}
<div class="${on(n,1)}">${sheet({ showC: n >= 4, hiB2: n >= 3 })}</div>
<p class="${on(n,2)}" style="font-size:30px;margin-top:14px;color:#57534e">Sample numbers I made up for this lesson.</p>
<p class="${on(n,3)}" style="font-size:32px;margin-top:6px;color:#44403c">They start in cell <b>B2</b>. A cell is one box in the grid.</p>
<p class="${on(n,5)}" style="font-size:34px;margin-top:6px;color:#5b21b6;font-weight:600">Growth: how much sales went up or down compared with last month, as a percentage.</p>`) });

slides.push({ start: 139.8, steps: [139.8, 148.2, 163.3], html: n => S(`${hdr('Now to the chatbot', 'You do not need to know the formula')}
<div class="card ${on(n,0)}" style="padding:18px 36px;margin-bottom:18px"><div style="font-size:36px">You just <b>describe</b> it.</div></div>
${you(on(n,1), 'My monthly sales are in column B, starting at B2. Write a formula in C3 that shows growth compared with last month as a percentage, and explain it in simple words.')}
<div class="card hl ${on(n,2)}" style="margin-top:20px;padding:22px 36px;text-align:center"><div class="muted" style="font-size:26px">It should look something like</div><div class="big" style="font-size:80px;letter-spacing:.02em">=(B3−B2)/B2</div></div>`) });

slides.push({ start: 170.9, steps: [170.9, 173.5, 181.8, 186.5, 190.9], html: n => S(`${hdr('And it explains it', 'Read the explanation')}
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'This month’s sales <b>minus</b> last month’s: that is the <b>change</b>')}
${row(n,2,2,'Divide the change by <b>last month’s sales</b>: that is the <b>growth</b>')}
${row(n,3,3,'Format the cell as a <b>percentage</b>')}</div>
${bar(n,4,'I asked for the explanation. <span class="violet">If I do not understand it, I cannot check it.</span>')}`) });

slides.push({ start: 202.4, steps: [202.4, 205], html: n => S(`${hdr('Paste it in C3', 'Format the column as a percentage')}
<div style="display:flex;gap:40px;align-items:center"><div style="flex:1">${sheet({ showC: true, rows: n >= 1 ? 1 : 0 })}</div>
<div class="card hl ${on(n,1)}" style="padding:30px 44px;text-align:center"><div class="muted" style="font-size:26px">C3 shows</div><div class="big" style="font-size:120px;color:${GRN}">15%</div></div></div>`) });

slides.push({ start: 208.6, steps: [208.6, 213.9, 219.6], html: n => S(`<div class="center" style="gap:16px"><div class="eyebrow">Do I believe it? Not yet.</div>
<h1 style="font-size:84px;line-height:1.15" class="it ${ON(n,0)}">Sounding right is <span style="color:${RED}">not the same as being right.</span></h1>
<p class="it ${ON(n,1)}" style="font-size:40px;margin-top:16px;color:#44403c">The formula looks sensible. The explanation sounds sensible. But I have not tested it.</p>
<p class="it ${ON(n,2)}" style="font-size:44px;margin-top:8px;color:#5b21b6;font-weight:700">So I test it on one row, with a calculator.</p></div>`) });

slides.push({ start: 222, steps: [222, 227.3, 234.5, 240.4, 244.5, 251.6], html: n => S(`${hdr('The worked check', 'One row, with a calculator')}
<div class="grid2" style="gap:22px;align-items:start">
<div><div class="card ${on(n,1)}" style="padding:22px 36px"><div style="font-size:36px">February <b>1,380,000</b><br>January <b>1,200,000</b></div></div>
<div class="card ${on(n,2)}" style="margin-top:16px;padding:20px 36px"><div style="font-size:38px">1,380,000 − 1,200,000 = <b>180,000</b></div></div>
<div class="card ${on(n,3)}" style="margin-top:16px;padding:20px 36px"><div style="font-size:38px">180,000 ÷ 1,200,000 = <b>0.15</b></div></div></div>
<div class="card hl ${on(n,4)}" style="padding:26px 36px;text-align:center"><div style="font-size:34px">As a percentage: <b>15%</b></div><div style="font-size:40px;margin-top:14px">Spreadsheet: <b>15%</b><br>Calculator: <b>15%</b></div><div style="font-size:56px;font-weight:700;color:${GRN};margin-top:14px">They match ✔</div></div></div>
<p class="${on(n,5)}" style="font-size:38px;margin-top:20px;color:#5b21b6;font-weight:600">I trust it because I tested it, not because the chatbot sounded sure.</p>`) });

slides.push({ start: 258.8, steps: [258.8, 265.8, 271.2], html: n => S(`${hdr('Extra careful', 'Check a second row too')}
<div style="display:flex;gap:40px;align-items:center"><div style="flex:1">${sheet({ showC: true, rows: n >= 2 ? 2 : 1 })}</div></div>
<p class="${on(n,1)}" style="font-size:38px;margin-top:20px;color:#44403c">March fell compared with February, so the formula should show a <b>negative number</b>.</p>
<p class="${on(n,2)}" style="font-size:38px;margin-top:8px;color:#5b21b6;font-weight:600">It shows a drop of 10%. That makes sense: 1,242,000 is lower than 1,380,000.</p>`) });

slides.push({ start: 280.1, steps: [280.1, 287, 290.6, 294.1, 298.6, 308.9, 316.5], html: n => S(`${hdr('One more question a careful person asks', 'What if last month could be zero?')}
<div class="grid2" style="gap:20px">
<div class="card ${on(n,1)}" style="padding:18px 30px"><div style="font-size:32px">A new product sold <b>nothing</b> in its first month.</div></div>
<div class="card ${on(n,2)}" style="padding:18px 30px;border-color:#dc2626;background:#fef2f2"><div style="font-size:32px">The formula would <b>divide by zero</b>. The spreadsheet shows an <b style="color:${RED}">error</b>.</div></div></div>
<p class="${on(n,3)}" style="font-size:34px;margin-top:16px;color:#5b21b6;font-weight:600">I do not start again. I refine.</p>
<div style="margin-top:10px">${you(on(n,4), 'Change the formula so it does not show an error if last month’s sales are zero.')}</div>
<div class="grid2" style="margin-top:14px;gap:20px"><div class="card ${on(n,5)}" style="padding:16px 30px"><div style="font-size:32px">A new version, with an <b>extra check at the start</b>.</div></div><div class="card hl ${on(n,6)}" style="padding:16px 30px"><div style="font-size:32px">Test it on the normal row: still <b style="color:${GRN}">15%</b> ✔</div></div></div>`) });

slides.push({ start: 323.8, steps: [323.8, 328.4, 334.8, 339.3, 341.9, 350], html: n => S(`${hdr('Something about learning', 'Do not become dependent')}
${row(n,1,1,'It is tempting to let the chatbot do everything and learn nothing. That makes you <b>dependent</b>')}
<div class="card hl ${on(n,2)}" style="margin-top:16px;padding:20px 36px"><div style="font-size:42px;font-weight:700">Use it to <span class="violet">speed up</span> while you learn the skill, not to <span style="color:${RED}">avoid learning it.</span></div></div>
<div style="display:flex;flex-direction:column;gap:12px;margin-top:16px">
${row(n,3,2,'Ask for the <b>explanation</b>, every time')}
${row(n,4,3,'Next time, <b>write a similar formula yourself</b> and ask the chatbot to check it')}</div>
<p class="${on(n,5)}" style="font-size:34px;margin-top:14px;color:#44403c">Over a few weeks, you will need it less for the easy ones.</p>`) });

slides.push({ start: 355.6, steps: [355.6, 360.2, 364.8, 372.5, 377.5], html: n => S(`${hdr('The same goes for…', 'Troubleshooting and macros')}
<div class="grid2" style="gap:24px;align-items:start">
<div class="card" style="min-height:430px"><div class="pill">Troubleshooting</div><div style="font-size:32px;margin-top:14px;line-height:1.45"><div class="it ${ON(n,0)}">A program gives an error message?</div><div class="it ${ON(n,1)}" style="margin-top:10px">Describe <b>what happened</b> and <b>what you see</b>. Ask for step-by-step help.</div><div class="it ${ON(n,2)}" style="margin-top:10px">Do the steps <b>one at a time</b>. Check each works before moving on.</div></div></div>
<div class="card" style="min-height:430px"><div class="pill amber">Macros</div><div style="font-size:32px;margin-top:14px;line-height:1.45"><div class="it ${ON(n,3)}"><b>Start small.</b> Test on a <b>copy</b>.</div><div class="it ${ON(n,4)}" style="margin-top:10px;color:${RED};font-weight:700">Never run something you do not understand on your only copy of important work.</div></div></div></div>`) });

slides.push({ start: 384.7, steps: [384.7, 392.9, 396.9, 401.3], html: n => S(`${hdr('The privacy point, once more', 'You do not need to paste your real data')}
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,0,1,'<b>Describe the columns</b>, as I did. Use <b>made-up numbers</b> to test')}
<div class="card ${on(n,2)}" style="padding:20px 36px;border-color:#dc2626;background:#fef2f2"><div style="font-size:36px;color:${RED};font-weight:700">Do not paste a customer list, a mobile money statement, or anyone’s personal details into a public chatbot.</div></div></div>
${bar(n,3,'Describe the problem, <span class="violet">not the person.</span> <span style="font-size:30px;font-weight:400;color:#57534e">Module 5 covers this fully.</span>')}`) });

slides.push({ start: 405.2, steps: [405.2, 407, 410.2, 414.5, 418.3], html: n => S(`${hdr('Let me pull the whole module together', 'Four jobs')}
<div class="grid2" style="gap:22px">
<div class="card ${on(n,1)}" style="min-height:230px"><div class="num">1</div><div class="big" style="font-size:44px;margin-top:10px">Brainstorm</div><div style="font-size:30px;margin-top:6px;color:#57534e">Beat the blank page.</div></div>
<div class="card ${on(n,2)}" style="min-height:230px"><div class="num">2</div><div class="big" style="font-size:44px;margin-top:10px">Draft</div><div style="font-size:30px;margin-top:6px;color:#57534e">A first version you make your own.</div></div>
<div class="card ${on(n,3)}" style="min-height:230px"><div class="num">3</div><div class="big" style="font-size:44px;margin-top:10px">Summarise</div><div style="font-size:30px;margin-top:6px;color:#57534e">Long and messy to short and clear.</div></div>
<div class="card ${on(n,4)}" style="min-height:230px"><div class="num">4</div><div class="big" style="font-size:44px;margin-top:10px">Automate</div><div style="font-size:30px;margin-top:6px;color:#57534e">Repetitive work, no code.</div></div></div>`) });

slides.push({ start: 421.5, steps: [421.5, 423, 425.5, 427.8, 430.7], html: n => S(`${hdr('And one rule for all of them', 'AI drafts. You decide.')}
<p class="${on(n,1)}" style="font-size:38px;margin-bottom:16px;color:#44403c">Before you use anything, ask three questions:</p>
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,2,1,'<b>Is it true?</b>')}${row(n,3,2,'<b>Is it right for my reader?</b>')}${row(n,4,3,'<b>Is it safe to share?</b>')}</div>`) });

slides.push({ start: 433.2, steps: [433.2, 436.5, 440, 445.1, 451.1], html: n => S(`<div class="eyebrow">This week</div><h2 style="margin-bottom:20px">Try it on one real task</h2>
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'Pick <b>one task</b>: an email, some minutes, or a spreadsheet')}
${row(n,2,2,'Try this module’s prompts on it, and <b>edit the result</b>')}
${row(n,3,3,'Note <b>how long it took</b>')}
${row(n,4,4,'Come back with <b>one win</b> (something the AI did well) and <b>one miss</b> (something it got wrong)')}</div>
<p class="${on(n,5)}" style="font-size:32px;margin-top:16px;color:#5b21b6;font-weight:600">You can add it in the Q&A tab of the lesson, or your notes tab.</p>`) });

slides.push({ start: 459.5, steps: [459.5, 463.2, 471.4, 476.5], html: n => S(`<div class="eyebrow">Your task · pause and try</div><h2 style="margin-bottom:20px">Ask for a formula, then test it</h2>
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'Type: <b>“My monthly sales are in column B, starting at B2. Write a formula in C3 that shows growth compared with last month as a percentage, and explain it in simple words.”</b>')}
${row(n,2,2,'<b>Test the answer on one row</b> with a calculator')}
${row(n,3,3,'Then ask for a version that <b>avoids dividing by zero</b>')}</div>`) });

slides.push({ start: 482.8, steps: [482.8, 489.2, 495.8], html: n => S(`<div class="center"><div class="eyebrow">Summary</div>
<h1 style="font-size:66px;max-width:1700px;line-height:1.2">Ask for the formula in <span class="violet">plain words</span>, then <span class="violet">test it on one row</span> before you trust it.</h1>
<h1 style="font-size:66px;max-width:1700px;line-height:1.2;margin-top:6px" class="it ${ON(n,1)}">You now have <span class="violet">four jobs</span> to use every week.</h1>
<p class="it ${ON(n,2)}" style="font-size:38px;margin-top:44px;color:#57534e"><b>Next module:</b> when AI gets it wrong, and why it can sound sure while being wrong.</p></div>`) });

await render({ FF, CHROME: process.env.CHROME, AUDIO, OUT, TOTAL, slides, dir: process.env.FRAMES || 'frames-m3-l5' });
