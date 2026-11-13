import { render, shellFor, on, ON, CSS } from '../lesson-lib.mjs';
const [FF, AUDIO, OUT, TOTALS] = process.argv.slice(2);
const TOTAL = parseFloat(TOTALS || '444.6');
const meta = { mod: 'Module 1 · What is AI?', id: 'm1-l2', title: "What AI is, and what it isn't" };
const S = shellFor(meta);
const slides = [];

// 1 title
slides.push({ start: 0, steps: [0, 2.1, 8.4], html: n => `<html><head><style>${CSS}</style></head><body>
<div class="bar"><span><b>WELILE SCHOOL OF AI</b> &nbsp;·&nbsp; AI Fundamentals</span><span>${meta.mod}</span></div>
<div class="wrap center"><div class="eyebrow">Lesson 2</div><h1 style="font-size:104px">What AI is, and what it isn't</h1>
<p class="it ${ON(n,1)}" style="font-size:46px;margin-top:44px;color:#44403c;font-family:Fraunces,serif">Last time: you already use AI every day.</p>
<p class="it ${ON(n,2)}" style="font-size:40px;margin-top:22px;color:#57534e">Now, a clear definition, and three mistakes to avoid.</p></div></body></html>` });

// 2 definition
slides.push({ start: 11.5, steps: [11.5, 13.8, 20.6, 24.1, 30.5], html: n => S(`<div class="eyebrow">A simple definition</div>
<h1 class="it ${ON(n,1)}" style="font-size:78px;max-width:1650px">AI is a computer doing a job that normally needs <span class="violet">human thinking</span>.</h1>
<p class="${on(n,2)}" style="font-size:36px;margin-top:30px;color:#57534e">In full, AI stands for <b>artificial intelligence</b>.</p>
<div class="grid2" style="margin-top:30px">
<div class="card ${on(n,3)}"><div class="eyebrow" style="margin-bottom:10px">Artificial</div><div style="font-size:42px;line-height:1.3">Made by people. <span class="muted">Not natural.</span></div></div>
<div class="card ${on(n,4)}"><div class="eyebrow" style="margin-bottom:10px">Intelligence</div><div style="font-size:42px;line-height:1.3">The ability to understand, decide or solve problems.</div></div></div>`).replace('<h1 class="it  ','<h1 class="it ') });

// 3 kinds of jobs
slides.push({ start: 42.8, steps: [42.8, 46.0, 47.2, 48.6], html: n => S(`<div class="eyebrow">The jobs we mean</div><h2>What kind of jobs?</h2>
<div class="grid3">${[['🗣','Understanding speech'],['⚖','Making decisions'],['🌍','Translating languages']].map((j,i)=>`<div class="card ${on(n,i+1)}" style="min-height:300px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center"><div style="font-size:86px">${j[0]}</div><div style="font-size:42px;font-weight:700;margin-top:18px">${j[1]}</div></div>`).join('')}</div>
<p class="it ${ON(n,0)}" style="font-size:40px;margin-top:36px;color:#57534e">Jobs a person would normally do with their brain.</p>`) });

// 4 three examples
const ex = [
  ['Google Maps', 'Picks the fastest route and guesses when you will arrive.', 'Before: someone who knew the roads, like a boda boda rider who knows which road floods and which junction jams at 5 o\'clock.'],
  ['Google Translate', 'Turns Luganda into English, and back again.', 'Before: a human translator. Now you get a quick version of a relative\'s message in seconds.'],
  ['Your bank app', 'Flags strange payments on your account.', 'Before: a clerk checking accounts line by line. Now a 10 million deposit on a quiet evening gets flagged at once.'],
];
slides.push({ start: 52, steps: [52, 59, 65.5, 85.3, 91.5, 106, 114.2], html: n => S(`<div class="eyebrow">Three examples · ask “who did this job before?”</div><h2 style="margin-bottom:30px">Everyday AI, doing a person's job</h2>
<div style="display:flex;flex-direction:column;gap:20px">${ex.map((e,i)=>{const a=1+i*2,b=a+1;return `<div class="card ${on(n,a)}" style="padding:22px 36px;display:grid;grid-template-columns:430px 1fr;gap:30px;align-items:center;${n>a-1?'':''}">
<div><div class="big" style="font-size:44px;color:#5b21b6">${e[0]}</div><div class="muted" style="font-size:27px;margin-top:6px;line-height:1.3">${e[1]}</div></div>
<div class="it ${ON(n,b-1)}" style="font-size:29px;line-height:1.35;color:#292524">${e[2]}</div></div>`}).join('')}</div>`) });

// 5 three different jobs
slides.push({ start: 131.4, steps: [131.4, 134.4, 142.7], html: n => S(`<div class="center"><div class="eyebrow">Three different jobs</div>
<h1 style="font-size:76px">The route. The translation. The strange payment.</h1>
<p class="it ${ON(n,1)}" style="font-size:42px;margin-top:40px;color:#57534e;max-width:1500px;line-height:1.35">You may use all three in a single day without a second thought.</p>
<div class="it ${ON(n,2)}" style="margin-top:34px"><span class="pill">Each one used to need a human</span></div></div>`) });

// 6 narrow job
slides.push({ start: 148.7, steps: [148.7, 151.1, 155.2, 156.8], html: n => S(`<div class="center"><div class="eyebrow">Notice something</div>
<h1 style="font-size:88px">One narrow job at a time.</h1>
<div class="grid2" style="margin-top:50px">
<div class="card ${on(n,2)}"><div style="font-size:30px;font-weight:700;color:#991b1b;letter-spacing:.06em">NOT</div><div style="font-size:44px;margin-top:8px">Running your life</div></div>
<div class="card hl ${on(n,3)}"><div style="font-size:30px;font-weight:700;color:#166534;letter-spacing:.06em">BUT</div><div style="font-size:44px;margin-top:8px">Helping with a task</div></div></div></div>`) });

// 7 three mistakes title
slides.push({ start: 158.5, steps: [158.5, 162, 167.9], html: n => S(`<div class="center"><div class="eyebrow">A word of care</div>
<h1 style="font-size:92px">The word “AI” gets used in many ways.</h1>
<p class="it ${ON(n,1)}" style="font-size:44px;margin-top:40px;color:#57534e">Some of those ways confuse people.</p>
<div class="it ${ON(n,2)}" style="margin-top:36px"><span class="pill" style="font-size:38px">Three common mistakes</span></div></div>`) });

// 8 mistake 1
slides.push({ start: 170.9, steps: [170.9, 176.0, 186.5, 195.1, 204.2], html: n => S(`<div class="eyebrow">Mistake 1</div><h1 style="font-size:84px">AI is not a robot.</h1>
<div class="grid2" style="margin-top:44px">
<div class="card ${on(n,1)}" style="min-height:300px"><div class="pill red">What films show</div><div style="font-size:42px;margin-top:26px;line-height:1.3">A metal person with a face and arms.</div></div>
<div class="card hl ${on(n,2)}" style="min-height:300px"><div class="pill green">What AI mostly is</div><div style="font-size:42px;margin-top:26px;line-height:1.3">Software, living on your phone or in a data centre.</div></div></div>
<p class="${on(n,3)}" style="font-size:34px;margin-top:30px;color:#57534e"><b>Data centre:</b> a building full of powerful computers connected to the internet.</p>
<p class="${on(n,4)}" style="font-size:38px;margin-top:14px;color:#5b21b6;font-weight:600">Using Google Maps, you are not talking to a robot. You are using a program.</p>`) });

// 9 mistake 2
slides.push({ start: 209.5, steps: [209.5, 213.8, 218.6, 227, 236.3, 245.3], html: n => S(`<div class="eyebrow">Mistake 2</div><h1 style="font-size:84px">AI is not new.</h1>
<p class="${on(n,1)}" style="font-size:36px;margin-top:20px;color:#57534e">“It was invented in the last couple of years.” It wasn't.</p>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:34px">
<div class="card ${on(n,2)}" style="min-height:290px"><div class="big" style="font-size:96px;color:#6d28d9">1950s</div><div style="font-size:36px;margin-top:10px">The name “AI” dates back to here. People have worked on it for a very long time.</div></div>
<div class="card hl ${on(n,4)}" style="min-height:290px"><div class="pill">What is new</div><div class="big" style="font-size:60px;margin-top:14px">Generative AI</div><div style="font-size:34px;margin-top:6px">It can create text, pictures and more.</div></div></div>
<p class="${on(n,3)}" style="font-size:34px;margin-top:26px;color:#57534e">That is why spam filters and map apps have been around for years.</p>
<p class="${on(n,5)}" style="font-size:32px;margin-top:8px;color:#5b21b6;font-weight:600">We will meet it properly in a few videos.</p>`) });

// 10 mistake 3
slides.push({ start: 255.4, steps: [255.4, 262, 266.1, 273, 275.1, 279.5, 294], html: n => S(`<div class="eyebrow">Mistake 3</div><h1 style="font-size:78px">AI is not a person thinking.</h1>
<div class="grid2" style="margin-top:38px">
<div class="card ${on(n,1)}" style="min-height:250px"><div class="pill amber">It looks like thinking</div><div style="font-size:36px;margin-top:20px;line-height:1.3">A chatbot answers in good sentences, and it feels like someone is there.</div></div>
<div class="card hl ${on(n,4)}" style="min-height:250px"><div class="pill green">What it really does</div><div style="font-size:36px;margin-top:20px;line-height:1.3">It <b>finds patterns in data</b>, then uses them.</div></div></div>
<div class="${on(n,5)}" style="margin-top:30px;font-size:34px;color:#44403c"><b>Data</b> is just information: words, numbers, pictures or sounds.</div>
<p class="${on(n,6)}" style="font-size:40px;margin-top:22px;color:#5b21b6;font-weight:600">The results look like thinking. It is not a human mind.</p>`) });

// 11 really thinking
slides.push({ start: 300, steps: [300, 306, 317.3], html: n => S(`<div class="center"><div class="eyebrow">People often ask</div>
<h1 style="font-size:86px">“So is it really thinking?”</h1>
<p class="it ${ON(n,1)}" style="font-size:42px;margin-top:40px;color:#57534e;max-width:1500px;line-height:1.35">It finds patterns, and the result can look like thinking. But it is not a person. Experts still debate how best to describe it.</p>
<div class="it ${ON(n,2)}" style="margin-top:34px"><span class="pill" style="font-size:36px">All you need: it finds patterns, and it is not a human mind.</span></div></div>`) });

// 12 bakery
slides.push({ start: 328.2, steps: [328.2, 331.1, 341, 345.6, 356.3], html: n => S(`<div class="eyebrow">Why this matters in practice</div><h2 style="margin-bottom:26px">A small bakery in Kampala</h2>
<p class="${on(n,1)}" style="font-size:36px;color:#44403c;margin-bottom:30px">The owner uses a chatbot to write a message to her customers.</p>
<div class="grid2">
<div class="card ${on(n,2)}" style="min-height:300px"><div class="pill red">She thinks it is a wise person</div><div style="font-size:38px;margin-top:22px;line-height:1.3">She trusts it too much.</div></div>
<div class="card hl ${on(n,3)}" style="min-height:300px"><div class="pill green">She knows it finds patterns</div><div style="font-size:38px;margin-top:22px;line-height:1.3">She reads what it wrote and fixes anything wrong before she sends it.</div></div></div>
<p class="${on(n,4)}" style="font-size:38px;margin-top:30px;color:#5b21b6;font-weight:600">A small difference in understanding protects her business.</p>`) });

// 13 put it together
slides.push({ start: 361.5, steps: [361.5, 364, 369], html: n => S(`<div class="center"><div class="eyebrow">Putting it together</div>
<h1 style="font-size:74px;max-width:1700px">AI is a computer doing a job that normally needs human thinking<span class="it ${ON(n,2)}">, by finding patterns in data.</span></h1></div>`).replace('<h1 style="font-size:74px;max-width:1700px">', '<h1 style="font-size:74px;max-width:1700px">') });

// 14 say it out loud
slides.push({ start: 373.8, steps: [373.8, 381.7], html: n => S(`<div class="eyebrow">Try it · out loud</div><h2>Explain it to a friend at the market</h2>
<div class="card"><div class="muted" style="font-size:30px;margin-bottom:10px">In your own words. If you say something like this, you have it:</div>
<div class="it ${ON(n,1)} big" style="font-size:46px;line-height:1.3;color:#5b21b6;opacity:${n>0?1:0}">“AI is software that does jobs that normally need a person, like choosing a route or translating a language.”</div></div>`) });

// 15 mistakes recap
slides.push({ start: 392.6, steps: [392.6, 395.2, 397.4, 398.8], html: n => S(`<div class="eyebrow">Remember the three mistakes</div><h2>AI is…</h2>
<div class="grid3">${[['Not a robot','Mostly software'],['Not new','The name dates from the 1950s'],['Not a person thinking','It finds patterns']].map((m,i)=>`<div class="card ${on(n,i+1)}" style="min-height:300px"><div class="num">${i+1}</div><div class="big" style="font-size:54px;margin-top:22px;line-height:1.1">${m[0]}</div><div class="muted" style="font-size:32px;margin-top:14px">${m[1]}</div></div>`).join('')}</div>`) });

// 16 task
slides.push({ start: 402.6, steps: [402.6, 406.9, 415.2, 421.5], html: n => S(`<div class="eyebrow">Your task · pause and try this prompt</div><h2>Explain AI in your own words</h2>
<div style="display:flex;flex-direction:column;gap:22px">
<div class="card row ${on(n,1)}"><span class="num">1</span><span>Explain AI to a friend, out loud or in writing, in <b>one or two sentences</b></span></div>
<div class="card row ${on(n,2)}"><span class="num">2</span><span>Use <b>one example from your phone</b>, such as Maps or translation</span></div></div>
<div class="${on(n,3)}" style="margin-top:34px"><span class="pill" style="font-size:36px">Pause the video now, then come back</span></div>`) });

// 17 summary + next
slides.push({ start: 423.1, steps: [423.1, 429.6, 437.3], html: n => S(`<div class="center"><div class="eyebrow">Summary</div>
<h1 style="font-size:66px;max-width:1700px">AI is a computer doing a job that normally needs human thinking.<br><span class="${ON(n,1)} it violet" style="display:inline-block;margin-top:14px">Not a robot. Not new. Not a person.</span></h1>
<p class="it ${ON(n,2)}" style="font-size:40px;margin-top:50px;color:#57534e"><b>Next:</b> how a computer can learn to do these jobs. It is called machine learning.</p></div>`) });


await render({ FF, CHROME: process.env.CHROME, AUDIO, OUT, TOTAL, slides, dir: process.env.FRAMES || 'frames-m1-l2' });
