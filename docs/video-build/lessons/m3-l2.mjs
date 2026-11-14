import { render, shellFor, on, ON, CSS } from '../lesson-lib.mjs';
const [FF, AUDIO, OUT, TOTALS] = process.argv.slice(2);
const TOTAL = parseFloat(TOTALS || '548.57');
const meta = { mod: 'Module 3 · Make AI work for you', id: 'm3-l2', title: 'Job 1: Beat the blank page (brainstorm)' };
const S = shellFor(meta);
const slides = [];
const RED = '#991b1b', GRN = '#166534';
const COL = { c: ['#ede9fe', '#5b21b6'], t: ['#dbeafe', '#1e40af'], f: ['#fef3c7', '#92400e'] };
const mark = (k, text) => `<span style="background:${COL[k][0]};color:${COL[k][1]};border-radius:10px;padding:2px 10px">${text}</span>`;
const row = (n, i, num, html) => `<div class="card row ${on(n, i)}" style="padding:22px 36px"><span class="num">${num}</span><span>${html}</span></div>`;
const you = (cls, txt) => `<div class="card hl ${cls}" style="padding:22px 40px"><div style="font-size:28px;font-weight:700;color:#5b21b6;letter-spacing:.06em;margin-bottom:8px">YOU TYPE</div><div style="font-size:38px;line-height:1.35">${txt}</div></div>`;
const bar = (n, i, html, extra = '') => `<div class="card hl ${on(n, i)}" style="margin-top:22px;padding:20px 36px;${extra}"><div style="font-size:42px;font-weight:700">${html}</div></div>`;

slides.push({ start: 0, steps: [0, 5, 14], html: n => `<html><head><style>${CSS}</style></head><body>
<div class="bar"><span><b>WELILE SCHOOL OF AI</b> &nbsp;·&nbsp; AI Fundamentals</span><span>${meta.mod}</span></div>
<div class="wrap center"><div class="eyebrow">Module 3 · Job 1</div><h1 style="font-size:100px">Beat the blank page<br><span class="violet">brainstorm</span></h1>
<p class="it ${ON(n,1)}" style="font-size:42px;margin-top:40px;color:#44403c">To brainstorm: come up with <b>many ideas quickly</b>, before you choose one.</p>
<p class="it ${ON(n,2)}" style="font-size:44px;margin-top:20px;color:#5b21b6;font-weight:600">You do not judge yet. You collect.</p></div></body></html>` });

slides.push({ start: 17, steps: [17, 31, 40, 48, 55, 63], html: n => S(`<div class="eyebrow">Everyone knows the blank page</div><h2 style="margin-bottom:20px">You sit down. The page stays empty.</h2>
<div class="grid2" style="gap:20px">
<div class="card ${on(n,1)}" style="min-height:190px"><div class="pill">A tailor</div><div style="font-size:32px;margin-top:10px;line-height:1.35">Opening a second shop. Needs a <b>name for the signboard</b> and a short line.</div></div>
<div class="card ${on(n,2)}" style="min-height:190px"><div class="pill">A university student</div><div style="font-size:32px;margin-top:10px;line-height:1.35">Must give a <b>ten-minute talk</b>, with no outline.</div></div>
<div class="card ${on(n,3)}" style="min-height:190px"><div class="pill">A market stall owner</div><div style="font-size:32px;margin-top:10px;line-height:1.35">Wants to promote a <b>Saturday special</b>.</div></div>
<div class="card ${on(n,4)}" style="min-height:190px"><div class="pill">An online business owner</div><div style="font-size:32px;margin-top:10px;line-height:1.35">Needs a <b>marketing plan</b>, and does not know where to start.</div></div></div>
${bar(n,5,'The problem is not that you have no brain. <span style="color:'+RED+'">The problem is the empty page.</span>')}`) });

slides.push({ start: 68, steps: [68, 70], html: n => S(`<div class="center" style="gap:18px"><div class="eyebrow">That is where a chatbot helps most</div>
<h1 style="font-size:92px;line-height:1.15" class="it ${ON(n,0)}">From nothing to a first draft <span class="violet">worth reacting to.</span></h1>
<p class="it ${ON(n,1)}" style="font-size:48px;margin-top:20px;color:#44403c">And it does it in <b>seconds</b>.</p></div>`) });

slides.push({ start: 78, steps: [78, 80, 84, 88, 90.5, 92.5], html: n => S(`<div class="eyebrow">Here is what you can ask for</div><h2 style="margin-bottom:20px">Four things to brainstorm</h2>
<div class="grid2" style="gap:22px">
<div class="card ${on(n,1)}" style="min-height:230px"><div class="big" style="font-size:44px">Ten taglines</div><div style="font-size:30px;margin-top:10px;color:#57534e" class="it ${ON(n,2)}">A tagline is a short line that sums up what you do.</div></div>
<div class="card ${on(n,3)}" style="min-height:230px"><div class="big" style="font-size:44px">An outline for a talk</div></div>
<div class="card ${on(n,4)}" style="min-height:230px"><div class="big" style="font-size:44px">A meeting agenda</div></div>
<div class="card ${on(n,5)}" style="min-height:230px"><div class="big" style="font-size:44px">Interview questions</div><div style="font-size:30px;margin-top:10px;color:#57534e">For someone you want to hire.</div></div></div>`) });

slides.push({ start: 95, steps: [95, 103, 110, 115, 118, 122], html: n => S(`<div class="eyebrow">A simple example</div><h2 style="margin-bottom:20px">Look at what the prompt does</h2>
${you('', `Generate ${n >= 3 ? mark('f','5') : '5'} ${n >= 4 ? mark('t','meeting agenda items') : 'meeting agenda items'} ${n >= 5 ? mark('c','for a project kickoff') : 'for a project kickoff'}.`)}
<p class="${on(n,1)}" style="font-size:32px;margin-top:16px;color:#57534e">A project kickoff is the first meeting of a new project.</p>
<div style="display:flex;gap:14px;margin-top:18px;flex-wrap:wrap"><span class="${on(n,2)}">${mark('f','a number: five')}</span><span class="${on(n,3)}">${mark('t','names the task')}</span><span class="${on(n,4)}">${mark('c','a little context')}</span></div>
<p class="${on(n,5)}" style="font-size:42px;margin-top:22px;color:#5b21b6;font-weight:600">It is short, and it works.</p>`) });

slides.push({ start: 124, steps: [124, 128, 133, 138, 144], html: n => S(`<div class="eyebrow">Remember the three-part request from Module 2</div><h2 style="margin-bottom:20px">Add your context and format</h2>
<div class="grid2" style="gap:24px;align-items:start">
<div class="card ${on(n,2)}" style="min-height:300px"><div class="pill red">Thin</div><div style="font-size:42px;margin-top:20px;line-height:1.3">“Give me shop names.”</div></div>
<div class="card hl ${on(n,3)}" style="min-height:300px"><div class="pill green">Something to work with</div><div style="font-size:32px;margin-top:16px;line-height:1.45">${mark('c','I am a tailor in Entebbe opening a second shop.')} ${mark('t','Give me 10 name ideas,')} ${mark('f','short enough for a signboard, in plain English.')}</div></div></div>
<p class="${on(n,4)}" style="font-size:40px;margin-top:24px;color:#5b21b6;font-weight:600">The second one gives the chatbot somewhere to start.</p>`) });

slides.push({ start: 150, steps: [150, 153, 162, 164, 169], html: n => S(`<div class="eyebrow">The same idea for a university student</div><h2 style="margin-bottom:20px">A ten-minute talk</h2>
${you(on(n,1), 'I am a second-year student. I must give a ten-minute talk on saving money. Give me an outline with five main points.')}
<div class="card ${on(n,2)}" style="margin-top:20px;padding:20px 36px"><div style="font-size:38px">Now the student has <b>a skeleton</b>.</div></div>
<div class="card ${on(n,3)}" style="margin-top:16px;padding:20px 36px"><div style="font-size:36px">The student still chooses which points are <b>true</b>, which are <b>useful</b>, which to <b>drop</b>.</div></div>
<p class="${on(n,4)}" style="font-size:38px;margin-top:18px;color:#5b21b6;font-weight:600">And adds a real story from campus life. That makes a talk memorable.</p>`) });

slides.push({ start: 176, steps: [176, 178, 184], html: n => S(`<div class="eyebrow">Or the market stall owner</div><h2 style="margin-bottom:20px">A Saturday special</h2>
${you(on(n,1), 'Give me five short lines to tell customers about my Saturday special.')}
<div class="card ${on(n,2)}" style="margin-top:22px;padding:24px 36px"><div style="font-size:40px">The owner <b>reads them</b>, <b>picks one</b>, and changes a word so it <b class="violet">sounds like the market</b>.</div></div>`) });

slides.push({ start: 189, steps: [189, 192, 195, 210], html: n => S(`<div class="eyebrow">Now we do it together · your try-it-now task</div><h2 style="margin-bottom:20px">A school fundraiser</h2>
${you(on(n,2), 'I am organising a school fundraiser for 400 students. Give me 10 ideas to raise money.')}
<div class="card ${on(n,3)}" style="margin-top:22px;padding:22px 36px"><div class="pill amber">The answer</div><div style="font-size:42px;margin-top:12px">Ten ideas, <b>numbered</b>.</div></div>`) });

slides.push({ start: 216, steps: [216, 219, 223, 225, 228, 230], html: n => S(`<div class="eyebrow">I do not accept all ten</div><h2 style="margin-bottom:20px">I read them, and ask myself</h2>
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,2,1,'Would this <b>work at my school</b>?')}
${row(n,3,2,'Does it <b>cost money before it makes money</b>?')}
${row(n,4,3,'Do we have the <b>time and the people</b>?')}
${row(n,5,4,'Is it <b>allowed</b> by our school?')}</div>`) });

slides.push({ start: 234, steps: [234, 236, 238, 242], html: n => S(`<div class="eyebrow">The chatbot does not know</div><h2 style="margin-bottom:20px">Your school</h2>
<div class="grid3" style="gap:22px">
<div class="card ${on(n,1)}" style="min-height:200px"><div class="pill red">Does not know</div><div class="big" style="font-size:40px;margin-top:14px">Your school</div></div>
<div class="card ${on(n,2)}" style="min-height:200px"><div class="pill red">Does not know</div><div class="big" style="font-size:40px;margin-top:14px">Your head teacher</div></div>
<div class="card ${on(n,3)}" style="min-height:200px"><div class="pill red">Does not know</div><div class="big" style="font-size:40px;margin-top:14px">Your budget or rules</div></div></div>
${bar(n,4,'You know the context. <span class="violet">So you decide what is best.</span>')}`) });

slides.push({ start: 258, steps: [258, 261], html: n => S(`<div class="eyebrow">Next</div><h2 style="margin-bottom:24px">Pick the best two</h2>
<div class="grid2" style="gap:26px"><div class="card hl ${on(n,0)}" style="min-height:260px;text-align:center"><div class="big" style="font-size:150px;color:#6d28d9">3</div></div>
<div class="card hl ${on(n,1)}" style="min-height:260px;text-align:center"><div class="big" style="font-size:150px;color:#6d28d9">7</div></div></div>
<p class="${on(n,1)}" style="font-size:36px;margin-top:20px;color:#44403c">The two I like best. Say, number 3 and number 7.</p>`) });

slides.push({ start: 264, steps: [264, 268, 272, 278, 283, 287], html: n => S(`<div class="eyebrow">Do not start over</div><h2 style="margin-bottom:20px">Refine, do not restart</h2>
<div class="card ${on(n,1)}" style="padding:18px 36px"><div style="font-size:34px">Remember Module 2. <b>Starting over throws away what was already good.</b></div></div>
<div style="margin-top:20px">${you(on(n,3), 'Make idea 3 cheaper and easier to run.')}</div>
<div class="card ${on(n,4)}" style="margin-top:20px;padding:20px 36px"><div class="pill green">Now a leaner version</div><div style="font-size:38px;margin-top:10px">Fewer things to buy. Fewer people to organise.</div></div>`) });

slides.push({ start: 290, steps: [290, 293, 295, 299, 303], html: n => S(`<div class="eyebrow">Is it good? I check.</div><h2 style="margin-bottom:20px">Does it still make sense?</h2>
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'Does it <b>still make sense</b>?')}
${row(n,2,2,'Are there steps I know are <b>not realistic</b>?')}
<div class="card ${on(n,3)}" style="padding:20px 36px;border-color:#dc2626;background:#fef2f2"><div style="font-size:36px">“Get a famous musician to perform for free”</div></div>
<div class="${on(n,4)}"><span class="pill red" style="font-size:36px">I laugh, and delete it.</span></div></div>`) });

slides.push({ start: 306, steps: [306, 308, 310.5, 316, 319.8, 321.5, 324, 326], html: n => S(`<div class="eyebrow">Notice something</div>
<h1 style="font-size:76px;line-height:1.15" class="it ${ON(n,1)}">You did not get one answer.<br>You got <span class="violet">options to react to.</span></h1>
<p class="it ${ON(n,2)}" style="font-size:44px;margin-top:20px;color:${GRN};font-weight:700">That is the real value.</p>
<div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:22px"><span class="pill ${on(n,3)}" style="font-size:34px">“Not this one.”</span><span class="pill ${on(n,4)}" style="font-size:34px">“This one, but cheaper.”</span><span class="pill ${on(n,5)}" style="font-size:34px">“This one, but for older students.”</span></div>
<p class="${on(n,6)}" style="font-size:38px;margin-top:22px;color:#44403c">You are thinking. The chatbot is feeding you material.</p>
<p class="${on(n,7)}" style="font-size:42px;margin-top:6px;color:#5b21b6;font-weight:600">That is a co-pilot at work.</p>`) });

slides.push({ start: 333, steps: [333, 335, 337, 339, 341], html: n => S(`<div class="eyebrow">You can keep going</div><h2 style="margin-bottom:20px">Each follow-up costs a few seconds</h2>
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'Ask for <b>ten more</b>')}
${row(n,2,2,'Ask for ideas that <b>need no money</b>')}
${row(n,3,3,'Ask for the <b>same idea in a different style</b>')}</div>`) });

slides.push({ start: 345, steps: [345, 348, 357, 363, 369, 375], html: n => S(`<div class="eyebrow">Three habits for this job</div><h2 style="margin-bottom:20px">How to brainstorm well</h2>
<div style="display:flex;flex-direction:column;gap:14px">
<div class="card row ${on(n,1)}" style="padding:20px 36px"><span class="num">1</span><span><b>Ask for many ideas at once.</b><br><span style="font-size:30px;color:#57534e">Ten is better than one. The best idea is often number seven.</span></span></div>
<div class="card row ${on(n,2)}" style="padding:20px 36px"><span class="num">2</span><span><b>Pick the best two and refine them.</b><br><span style="font-size:30px;color:#57534e">Do not try to polish all ten.</span></span></div>
<div class="card row ${on(n,3)}" style="padding:20px 36px"><span class="num">3</span><span><b>Treat answers as inspiration, then make them yours.</b><br><span style="font-size:30px;color:#57534e"><span class="it ${ON(n,4)}">Inspiration is a spark to start from, not the finished product. </span><span class="it ${ON(n,5)}">Change the words. Add what only you know.</span></span></span></div></div>`) });

slides.push({ start: 381, steps: [381, 385, 391, 396, 398, 404, 410], html: n => S(`<div class="eyebrow">A small warning</div><h2 style="margin-bottom:20px">Many of its ideas sound alike</h2>
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'A chatbot has seen so many examples that its ideas <b>can sound alike</b>')}
${row(n,2,2,'Taglines can sound <b>generic</b>. If every shop used the same line, <b>nobody would remember yours</b>')}</div>
<div class="card hl ${on(n,4)}" style="margin-top:20px;padding:20px 36px"><div style="font-size:42px;font-weight:700">When you find a line you like, <span class="violet">bend it.</span> Put your own twist on it.</div></div>
<p class="${on(n,5)}" style="font-size:34px;margin-top:16px;color:#44403c">A Luganda phrase your customers love? Use it.</p>
<p class="${on(n,6)}" style="font-size:32px;margin-top:6px;color:#57534e">Chatbots can help in other languages, but the quality can be uneven. Check anything important.</p>`) });

slides.push({ start: 428, steps: [428, 433, 439, 445, 447, 449, 452], html: n => S(`<div class="eyebrow">A word on privacy</div><h2 style="margin-bottom:20px">Think before you type</h2>
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'Brainstorming is usually safe: you ask for <b>ideas</b>, not secrets')}
${row(n,3,2,'Real names, phone numbers or confidential plans? <b>Take them out first</b>')}</div>
<div class="grid2" style="margin-top:20px;gap:22px">
<div class="card hl ${on(n,4)}" style="padding:20px 32px"><div style="font-size:36px">Describe <b>the shop</b>, not the customer.</div></div>
<div class="card hl ${on(n,5)}" style="padding:20px 32px"><div style="font-size:36px">Describe <b>the school fundraiser</b>, not the child.</div></div></div>
<p class="${on(n,6)}" style="font-size:32px;margin-top:18px;color:#57534e">Module 5 covers this in full.</p>`) });

slides.push({ start: 458, steps: [458, 460, 464, 470], html: n => S(`<div class="center" style="gap:16px"><div class="eyebrow">Let me say it once more</div>
<h2 style="font-size:60px" class="it ${ON(n,1)}">You are not asking the chatbot to <span style="color:${RED}">decide for you.</span></h2>
<h2 style="font-size:60px" class="it ${ON(n,2)}">You are asking it to put <b>ten things on the table</b> so that <span class="violet">you can choose.</span></h2>
<h1 style="font-size:100px;margin-top:20px" class="it ${ON(n,3)}">AI drafts. <span class="violet">You decide.</span></h1></div>`) });

slides.push({ start: 473, steps: [473, 477, 480, 486, 489, 493, 505], html: n => S(`<div class="eyebrow">Your task · pause and try</div><h2 style="margin-bottom:20px">Brainstorm a fundraiser</h2>
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,2,1,'Type: <b>“I am organising a school fundraiser for 400 students. Give me 10 ideas to raise money.”</b>')}
${row(n,3,2,'<b>Pick the two ideas</b> you like best')}
${row(n,4,3,'Ask: <b>“Make idea 3 cheaper and easier to run.”</b>')}
${row(n,5,4,'Read the new version. <b>Would you really use it?</b>')}</div>
<p class="${on(n,6)}" style="font-size:34px;margin-top:20px;color:#5b21b6;font-weight:600">You can use a different topic if you like. It does not have to be idea 3.</p>`) });

slides.push({ start: 512, steps: [512, 520, 535], html: n => S(`<div class="center"><div class="eyebrow">Summary</div>
<h1 style="font-size:70px;max-width:1700px;line-height:1.2">When you are stuck, <span class="violet">ask for many ideas.</span></h1>
<h1 style="font-size:70px;max-width:1700px;line-height:1.2;margin-top:6px" class="it ${ON(n,1)}">Pick two, refine them, <span class="violet">make them yours.</span></h1>
<p class="it ${ON(n,2)}" style="font-size:38px;margin-top:44px;color:#57534e"><b>Next:</b> Job 2, drafting in seconds and finishing in your own voice.</p></div>`) });

await render({ FF, CHROME: process.env.CHROME, AUDIO, OUT, TOTAL, slides, dir: process.env.FRAMES || 'frames-m3-l2' });
