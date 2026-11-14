import { render, shellFor, on, ON, CSS } from '../lesson-lib.mjs';
const [FF, AUDIO, OUT, TOTALS] = process.argv.slice(2);
const TOTAL = parseFloat(TOTALS || '462.65');
const meta = { mod: 'Module 4 · When AI gets it wrong', id: 'm4-l1', title: 'Why AI sounds sure and is wrong' };
const S = shellFor(meta);
const slides = [];
const row = (n, i, num, html) => `<div class="card row ${on(n, i)}" style="padding:22px 36px"><span class="num">${num}</span><span>${html}</span></div>`;
const bubble = (cls, who, txt, bg, col) => `<div class="${cls}" style="max-width:1100px;background:${bg};color:${col};border-radius:30px;padding:22px 34px;font-size:40px;line-height:1.3"><div style="font-size:24px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.7;margin-bottom:6px">${who}</div>${txt}</div>`;
const RED = '#991b1b';

// 1 title
slides.push({ start: 0, steps: [0, 4, 11.6], html: n => `<html><head><style>${CSS}</style></head><body>
<div class="bar"><span><b>WELILE SCHOOL OF AI</b> &nbsp;·&nbsp; AI Fundamentals</span><span>${meta.mod}</span></div>
<div class="wrap center"><div class="eyebrow">Module 4 · Lesson 1</div><h1 style="font-size:100px">Why AI sounds sure<br><span class="violet">and is wrong</span></h1>
<p class="it ${ON(n,1)}" style="font-size:42px;margin-top:40px;color:#44403c">You now know how to ask AI well.</p>
<p class="it ${ON(n,2)}" style="font-size:44px;margin-top:20px;color:#5b21b6;font-weight:600">What happens when the answer is wrong?</p></div></body></html>` });

// 2 sure and wrong
slides.push({ start: 14.2, steps: [14.2, 17.6, 23.2, 30.1], html: n => S(`<div class="center" style="gap:10px"><div class="eyebrow">The most important sentence in this module</div>
<h1 style="font-size:104px;line-height:1.12" class="it ${ON(n,1)}">AI can sound <span style="color:#166534">completely sure</span></h1>
<h1 style="font-size:104px;line-height:1.12" class="it ${ON(n,2)}">and be <span style="color:${RED}">completely wrong.</span></h1>
<p class="it ${ON(n,3)}" style="font-size:42px;margin-top:34px;color:#5b21b6;font-weight:600">Sure, and wrong. At the same time.</p></div>`) });

// 3 bus stop
slides.push({ start: 34.8, steps: [34.8, 37.8, 45.8, 51.1, 56.2, 64.5], html: n => S(`<div class="eyebrow">Picture a taxi stop in Kampala</div>
<div style="display:flex;flex-direction:column;gap:20px;margin-top:6px">
${bubble(on(n,1), 'Someone asks', 'Which bus goes to Entebbe?', '#ede9fe', '#4c1d95')}
<div class="${on(n,2)}"><span class="pill amber" style="font-size:32px">He does not know. He does not want to look foolish.</span></div>
<div class="${on(n,3)}" style="align-self:flex-end;margin-left:auto;max-width:1100px;background:#fef3c7;color:#78350f;border-radius:30px;padding:22px 34px;font-size:40px;line-height:1.3"><div style="font-size:24px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.7;margin-bottom:6px">The man</div>“That one, with the blue stripe.”</div>
<div class="${on(n,4)}" style="display:flex;gap:14px"><span class="pill green" style="font-size:32px">Calm</span><span class="pill green" style="font-size:32px">Clear</span><span class="pill green" style="font-size:32px">Sounds sure</span></div>
<div class="${on(n,5)}"><span class="pill red" style="font-size:34px">…and he may be completely wrong. You find out on the wrong bus.</span></div></div>`) });

// 4 chatbot like that man
slides.push({ start: 71.4, steps: [71.4, 74.2, 78.5, 83.9], html: n => S(`<div class="eyebrow">A chatbot can behave a little like that man</div><h2 style="margin-bottom:24px">It does not mean to mislead you</h2>
<div class="grid3">
<div class="card ${on(n,1)}" style="min-height:230px"><div class="big" style="font-size:46px">A calm voice</div><div style="font-size:30px;margin-top:10px;color:#44403c">Confident, never hesitating.</div></div>
<div class="card ${on(n,2)}" style="min-height:230px"><div class="big" style="font-size:46px">Nice words</div><div style="font-size:30px;margin-top:10px;color:#44403c">Good grammar, smooth sentences.</div></div>
<div class="card ${on(n,2)}" style="min-height:230px"><div class="big" style="font-size:46px">Tidy detail</div><div style="font-size:30px;margin-top:10px;color:#44403c">It reads like an expert wrote it.</div></div></div>
<div class="card hl ${on(n,3)}" style="margin-top:28px;padding:24px 36px"><div style="font-size:48px;font-weight:700;color:${RED}">And the answer can be false.</div></div>`) });

// 5 definition
slides.push({ start: 87.1, steps: [87.1, 90.6, 96.9, 103.1, 106.2, 107.8, 109.2, 110.3], html: n => S(`<div class="eyebrow">There is a name for this</div><h1 style="font-size:110px" class="it ${ON(n,1)}">Hallucination</h1>
<div class="card hl ${on(n,2)}" style="margin-top:20px;padding:26px 40px"><div style="font-size:46px;line-height:1.3">When AI states <b style="color:${RED}">something false</b> as if it were <b style="color:#166534">true</b>.</div></div>
<p class="${on(n,3)}" style="font-size:36px;margin-top:26px;color:#44403c">What kind of things can it make up?</p>
<div style="display:flex;gap:18px;margin-top:14px;flex-wrap:wrap">
<span class="pill ${on(n,4)}" style="font-size:42px;padding:14px 38px">Facts</span><span class="pill ${on(n,5)}" style="font-size:42px;padding:14px 38px">Quotes</span><span class="pill ${on(n,6)}" style="font-size:42px;padding:14px 38px">Sources</span><span class="pill ${on(n,7)}" style="font-size:42px;padding:14px 38px">Numbers</span></div>`) });

// 6 examples of inventions
slides.push({ start: 111.0, steps: [111.0, 111.5, 114.2, 117.0, 120.9], html: n => S(`<div class="eyebrow">What invented looks like</div><h2 style="margin-bottom:22px">Believable, and not real</h2>
<div class="grid2">
<div class="card ${on(n,1)}" style="min-height:250px"><div class="pill red">Facts and names</div><div style="font-size:40px;margin-top:16px;line-height:1.3">The name of a <b>book that does not exist</b></div></div>
<div class="card ${on(n,2)}" style="min-height:250px"><div class="pill red">Quotes</div><div style="font-size:40px;margin-top:16px;line-height:1.3">A quote that <b>nobody ever said</b></div></div>
<div class="card ${on(n,3)}" style="min-height:250px"><div class="pill red">Sources</div><div style="font-size:40px;margin-top:16px;line-height:1.3">A web link that <b>goes nowhere</b></div></div>
<div class="card ${on(n,4)}" style="min-height:250px"><div class="pill red">Numbers</div><div style="font-size:40px;margin-top:16px;line-height:1.3">A figure that looks exact, but is <b>invented</b></div></div></div>`) });

// 7 as if it were true
slides.push({ start: 125.7, steps: [125.7, 129.6, 134.2, 138.9, 142.3], html: n => S(`<div class="eyebrow">Notice the words</div><h1 style="font-size:96px" class="it ${ON(n,1)}">“As if it were true.”</h1>
<div style="display:flex;flex-direction:column;gap:18px;margin-top:30px">
<div class="card ${on(n,2)}" style="padding:22px 36px"><div style="font-size:40px"><span style="text-decoration:line-through;color:#a8a29e">“I am guessing here.”</span> &nbsp;<span class="pill red" style="font-size:28px">It never says this</span></div></div>
<div class="card ${on(n,3)}" style="padding:22px 36px"><div style="font-size:40px">It says it in <b>the same tone</b> as everything else.</div></div>
<div class="card hl ${on(n,4)}" style="padding:22px 36px"><div style="font-size:42px;font-weight:700;color:#5b21b6">That is what makes hallucinations hard to spot.</div></div></div>`) });

// 8 how it works
slides.push({ start: 145.6, steps: [145.6, 148.4, 153.6, 156.6, 160.6], html: n => S(`<div class="eyebrow">So why does this happen?</div><h2 style="margin-bottom:26px">How these tools work</h2>
<div style="display:flex;align-items:center;gap:22px">
<div class="card ${on(n,1)}" style="flex:1;min-height:280px"><div class="num">1</div><div class="big" style="font-size:44px;margin-top:16px">Learns from a huge amount of text</div></div>
<div class="arrow ${on(n,2)}">→</div>
<div class="card ${on(n,2)}" style="flex:1;min-height:280px"><div class="num">2</div><div class="big" style="font-size:44px;margin-top:16px">Predicts the next word</div></div>
<div class="arrow ${on(n,3)}">→</div>
<div class="card ${on(n,3)}" style="flex:1;min-height:280px"><div class="num">3</div><div class="big" style="font-size:44px;margin-top:16px">…then the next, and the next</div></div></div>
<p class="${on(n,4)}" style="font-size:34px;margin-top:30px;color:#57534e">A large language model, from Module 1.</p>`) });

// 9 key
slides.push({ start: 160.6, steps: [160.6, 162.8, 165.2], html: n => S(`<div class="center" style="gap:18px"><div class="eyebrow">Here is the key</div>
<h1 style="font-size:96px;line-height:1.15" class="it ${ON(n,1)}">It predicts what <span style="color:#166534">sounds likely.</span></h1>
<h1 style="font-size:96px;line-height:1.15" class="it ${ON(n,2)}">It does <span style="color:${RED}">not check</span> what is true.</h1></div>`) });

// 10 phone keyboard
slides.push({ start: 167.4, steps: [167.4, 170.7, 174.6, 177.1], html: n => S(`<div class="eyebrow">Something you already know</div><h2 style="margin-bottom:22px">Your phone keyboard guesses the next word</h2>
<div style="display:flex;gap:50px;align-items:center">
<div style="width:560px;background:#1c1917;border-radius:44px;padding:30px;box-shadow:0 10px 30px rgba(0,0,0,.18)">
<div style="background:#fff;border-radius:22px;padding:22px 26px;font-size:46px;min-height:80px" class="it ${ON(n,1)}">Good<span style="color:#6d28d9">|</span></div>
<div style="display:flex;gap:10px;margin-top:20px" class="it ${ON(n,2)}"><div style="flex:1;background:#44403c;color:#fff;border-radius:16px;padding:16px;font-size:34px;text-align:center">morning</div><div style="flex:1;background:#44403c;color:#fff;border-radius:16px;padding:16px;font-size:34px;text-align:center">evening</div></div></div>
<div style="flex:1;display:flex;flex-direction:column;gap:20px">
<div class="card ${on(n,1)}" style="padding:22px 32px;font-size:36px">Type the word <b>“Good”</b> in a chat.</div>
<div class="card ${on(n,2)}" style="padding:22px 32px;font-size:36px">It suggests <b>“morning”</b> or <b>“evening”</b>.</div>
<div class="card hl ${on(n,3)}" style="padding:22px 32px;font-size:36px">Your phone is <b>guessing</b>, based on patterns.</div></div></div>`) });

// 11 bigger scale
slides.push({ start: 180.5, steps: [180.5, 185.2, 189.5, 193.9, 200.2], html: n => S(`<div class="eyebrow">The same idea, on a much bigger scale</div><h2 style="margin-bottom:24px">A large language model</h2>
<div style="display:flex;flex-direction:column;gap:16px">
${row(n,1,1,'Learns patterns from an <b>enormous amount of writing</b>')}
${row(n,2,2,'You ask a question. It builds a reply <b>word by word</b>')}
${row(n,3,3,'The reply <b>fits the patterns</b>, so it sounds right')}</div>
<div class="card hl ${on(n,4)}" style="margin-top:24px;padding:22px 36px"><div style="font-size:46px;font-weight:700;color:${RED}">Sounding right is not the same as being right.</div></div>`) });

// 12 book shelf
slides.push({ start: 203.4, steps: [203.4, 205.3, 211.3, 215.6, 219.4], html: n => S(`<div class="eyebrow">Think of it like this</div><h2 style="margin-bottom:22px">Asking for a book title</h2>
<div class="card ${on(n,1)}" style="padding:22px 36px;font-size:38px">You ask for the title of a book by a certain author.</div>
<div class="grid2" style="margin-top:20px">
<div class="card ${on(n,2)}" style="min-height:180px;font-size:34px;line-height:1.35">It knows what <b>book titles usually look like</b>.<div class="${on(n,3)}" style="margin-top:12px">It knows how an <b>author's name sits</b> beside a title.</div></div>
<div class="card hl ${on(n,4)}" style="min-height:180px;font-size:38px;line-height:1.35">It can produce something that <b>looks exactly like a real book</b>.</div></div>
<div class="card ${on(n,5)}" style="margin-top:20px;padding:22px 36px;border-color:#dc2626;background:#fef2f2"><div style="font-size:40px"><b style="color:${RED}">✗ No step</b> where it goes to a shelf and checks that the book exists.</div></div>`) });

// 13 convincing
slides.push({ start: 225.4, steps: [225.4, 228.8, 234.3, 237.8, 240.1, 242.1, 247.5], html: n => S(`<div class="eyebrow">Remember this</div><h2 style="margin-bottom:22px" class="it ${ON(n,1)}">A made-up answer can look <span style="color:${RED}">more convincing</span> than a true one.</h2>
<div class="grid2" style="margin-top:8px">
<div class="${on(n,3)}"><div class="pill red">The made-up answer</div><div class="card" style="margin-top:12px;min-height:330px"><div style="font-size:38px;line-height:1.45">It is <b>smooth</b>.<br><span class="it ${ON(n,4)}">It has <b>detail</b>.<br>A nice <b>name</b>, a <b>year</b>, a <b>place</b>.</span></div></div></div>
<div class="${on(n,5)}"><div class="pill green">A careful person</div><div class="card hl" style="margin-top:12px;min-height:330px"><div style="font-size:38px;line-height:1.45">“I am not sure. You should check.”<br><span class="it ${ON(n,6)}" style="color:#57534e">Sounds weaker, but it is <b>more honest</b>.</span></div></div></div></div>`) });

// 14 confidence
slides.push({ start: 249.9, steps: [249.9, 257.0], html: n => S(`<div class="center" style="gap:24px"><div class="eyebrow">So please</div>
<h1 style="font-size:88px;line-height:1.15">Do not judge an answer by how <span class="violet">confident</span> it sounds.</h1>
<h1 style="font-size:100px;margin-top:20px;color:${RED}" class="it ${ON(n,1)}">Confidence is not evidence.</h1></div>`) });

// 15 Uganda example
slides.push({ start: 259.6, steps: [259.6, 264.6, 275.1, 282.8, 290.6], html: n => S(`<div class="eyebrow">A Ugandan example</div><h2 style="margin-bottom:20px">A school assignment</h2>
<div class="grid2" style="gap:22px">
<div class="card ${on(n,1)}" style="min-height:240px"><div class="num">1</div><div style="font-size:34px;margin-top:14px;line-height:1.35">A student asks: <b>“Give me five facts about a village in western Uganda, with the year it was founded.”</b></div></div>
<div class="card ${on(n,2)}" style="min-height:240px"><div class="num">2</div><div style="font-size:34px;margin-top:14px;line-height:1.35">Five tidy sentences, a year and a clan name. <b>It looks perfect.</b></div></div>
<div class="card ${on(n,3)}" style="min-height:240px"><div class="num">3</div><div style="font-size:34px;margin-top:14px;line-height:1.35">With little real information, it <b>fills the gaps</b> with things that merely <b>sound right</b>.</div></div>
<div class="card hl ${on(n,4)}" style="min-height:240px;border-color:#dc2626;box-shadow:0 0 0 4px #fee2e2"><div class="num" style="background:#dc2626">4</div><div style="font-size:34px;margin-top:14px;line-height:1.35">The student submits it. A teacher <b>from that area</b> reads it and knows it is wrong.</div></div></div>`) });

// 16 not afraid
slides.push({ start: 298.6, steps: [298.6, 303.4, 308.6, 316.4, 321.8], html: n => S(`<div class="eyebrow">I do not want you to be afraid of AI</div><h2 style="margin-bottom:24px">Hallucinations do not make AI useless</h2>
<div style="display:flex;flex-direction:column;gap:16px">
${row(n,1,1,'They mean we use it <b>in a smart way</b>')}
${row(n,2,2,'Think of AI as a <b>fast, well-read assistant</b> who sometimes makes things up')}</div>
<div class="grid2" style="margin-top:24px">
<div class="card hl ${on(n,3)}" style="padding:24px 36px;text-align:center"><div class="big" style="font-size:52px;color:#166534">Very useful</div></div>
<div class="card hl ${on(n,4)}" style="padding:24px 36px;text-align:center"><div class="big" style="font-size:52px;color:#5b21b6">Always checked</div></div></div>`) });

// 17 catch it
slides.push({ start: 324.3, steps: [324.3, 327.3, 331.5], html: n => S(`<div class="center" style="gap:20px"><div class="eyebrow">Good news</div>
<h1 style="font-size:100px;line-height:1.15" class="it ${ON(n,1)}">You can <span class="violet">catch</span> hallucinations.</h1>
<p class="it ${ON(n,2)}" style="font-size:46px;margin-top:20px;color:#44403c">The best way to learn what one looks like is <b>to see one yourself</b>.</p></div>`) });

// 18 demo step 1
slides.push({ start: 333.8, steps: [333.8, 337.7, 348.4], html: n => S(`<div class="eyebrow">Live demo · step 1</div><h2 style="margin-bottom:26px">Open your chatbot and type exactly:</h2>
<div class="card hl ${on(n,1)}" style="padding:34px 44px"><div style="font-size:30px;font-weight:700;color:#5b21b6;letter-spacing:.06em;margin-bottom:10px">YOU TYPE</div><div style="font-size:44px;line-height:1.35">Tell me about the 1987 book <b>The Golden Boda of Nansana</b> and its main characters.</div></div>
<p class="${on(n,2)}" style="font-size:40px;margin-top:30px;color:${RED};font-weight:700">Look at that. I made that book up.</p>`) });

// 19 result
slides.push({ start: 350.6, steps: [350.6, 351.6, 357.5, 362.9, 365.1], html: n => S(`<div class="eyebrow">What happened</div><h2 style="margin-bottom:22px">The book does not exist</h2>
<div class="grid2">
<div class="card ${on(n,1)}" style="min-height:270px"><div class="pill amber">It may…</div><div style="font-size:38px;margin-top:16px;line-height:1.35">Give a <b>plot, characters and a theme</b>, as if it had read the real book.</div></div>
<div class="card ${on(n,2)}" style="min-height:270px"><div class="pill green">Or it may…</div><div style="font-size:38px;margin-top:16px;line-height:1.35">Say it <b>cannot find</b> that book.</div></div></div>
<p class="${on(n,3)}" style="font-size:38px;margin-top:24px;color:#44403c">Results vary. Both can happen.</p>
<div class="card hl ${on(n,4)}" style="margin-top:14px;padding:20px 36px"><div style="font-size:40px;font-weight:700;color:${RED}">If it tells you about the book, that is a hallucination.</div></div>`) });

// 20 sources step
slides.push({ start: 368.5, steps: [368.5, 370.0, 373.8, 374.8, 376.8, 378.2], html: n => S(`<div class="eyebrow">Live demo · step 2</div><h2 style="margin-bottom:22px">Ask for the sources</h2>
<div class="card hl ${on(n,1)}" style="padding:26px 44px"><div style="font-size:30px;font-weight:700;color:#5b21b6;letter-spacing:.06em;margin-bottom:8px">YOU TYPE</div><div style="font-size:44px">Give me three sources for that.</div></div>
<div style="font-size:38px;font-weight:700;margin:26px 0 12px" class="${on(n,2)}">Now check them:</div>
<div style="display:flex;gap:18px;flex-wrap:wrap">
<span class="pill ${on(n,2)}" style="font-size:36px">Do they exist?</span><span class="pill ${on(n,3)}" style="font-size:36px">Are the titles real?</span><span class="pill ${on(n,4)}" style="font-size:36px">Does the link open?</span></div>
<p class="${on(n,5)}" style="font-size:38px;margin-top:28px;color:#5b21b6;font-weight:600">🔍 Search for one of them in a search engine.</p>`) });

// 21 lesson
slides.push({ start: 386.9, steps: [386.9, 388.7, 397.2, 399.3, 400.2, 401.0, 401.8], html: n => S(`<div class="eyebrow">This is the lesson</div><h2 style="margin-bottom:22px" class="it ${ON(n,1)}">If the sources do not exist, or do not say what the chatbot claims, <span style="color:${RED}">we cannot use the claim.</span></h2>
<p class="${on(n,2)}" style="font-size:42px;margin-top:20px;color:#44403c">If it can invent a book, it can invent…</p>
<div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:18px">
<span class="pill red ${on(n,3)}" style="font-size:42px;padding:14px 38px">a statistic</span><span class="pill red ${on(n,4)}" style="font-size:42px;padding:14px 38px">a quote</span><span class="pill red ${on(n,5)}" style="font-size:42px;padding:14px 38px">a date</span><span class="pill red ${on(n,6)}" style="font-size:42px;padding:14px 38px">a name</span></div>`) });

// 22 review
slides.push({ start: 402.5, steps: [402.5, 403.5, 407.8, 413.0, 418.0, 422.9], html: n => S(`<div class="eyebrow">Let me sum up</div><h2 style="margin-bottom:22px">Why AI sounds sure and is wrong</h2>
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'AI can sound <b>completely sure</b> and be <b>completely wrong</b>')}
${row(n,2,2,'A <b>hallucination</b> is false information stated as if it were true')}
${row(n,3,3,'It <b>predicts what sounds likely</b> and does not check what is true')}
${row(n,4,4,'A made-up answer can look <b>more convincing</b> than a true one')}
${row(n,5,5,'Invented <b>facts, quotes, sources and numbers</b> can all look convincing')}</div>`) });

// 23 task
slides.push({ start: 426.9, steps: [426.9, 432.1, 435.0, 438.5], html: n => S(`<div class="eyebrow">Your task · pause and try</div><h2 style="margin-bottom:22px">Catch one yourself</h2>
<div style="display:flex;flex-direction:column;gap:18px">
${row(n,1,1,'Ask about something that does not exist: <b>“Tell me about the 1987 book The Golden Boda of Nansana and its main characters.”</b>')}
${row(n,2,2,'Then ask: <b>“Give me three sources for that.”</b>')}
${row(n,3,3,'Try to find the sources. <b>Do they exist?</b>')}</div>`) });

// 24 summary + bridge
slides.push({ start: 441.7, steps: [441.7, 450.4, 453.8], html: n => S(`<div class="center"><div class="eyebrow">Summary</div>
<h1 style="font-size:62px;max-width:1700px;line-height:1.2">AI <span class="violet">predicts what sounds likely</span> and does not check what is true,</h1>
<h1 style="font-size:62px;max-width:1700px;line-height:1.2;margin-top:6px" class="it ${ON(n,1)}">so it can be <span style="color:${RED}">sure and wrong</span> at the same time.</h1>
<p class="it ${ON(n,2)}" style="font-size:38px;margin-top:44px;color:#57534e"><b>Next:</b> two real cases where believable AI mistakes cost people money.</p></div>`) });

await render({ FF, CHROME: process.env.CHROME, AUDIO, OUT, TOTAL, slides, dir: process.env.FRAMES || 'frames-m4-l1' });
