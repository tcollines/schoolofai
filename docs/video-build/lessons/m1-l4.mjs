import { render, shellFor, on, ON, CSS, nest } from '../lesson-lib.mjs';
const [FF, AUDIO, OUT, TOTALS] = process.argv.slice(2);
const TOTAL = parseFloat(TOTALS || '462.2');
const meta = { mod: 'Module 1 · What is AI?', id: 'm1-l4', title: 'Deep learning and the AI family' };
const S = shellFor(meta);
const slides = [];
const split = (ring, right) => `<div style="display:flex;gap:56px;align-items:flex-end;height:100%">${ring}<div style="flex:1;align-self:center">${right}</div></div>`;

// 1 title
slides.push({ start: 0, steps: [0, 2.0, 12.6, 16.7, 24.9], html: n => `<html><head><style>${CSS}</style></head><body>
<div class="bar"><span><b>WELILE SCHOOL OF AI</b> &nbsp;·&nbsp; AI Fundamentals</span><span>${meta.mod}</span></div>
<div class="wrap center"><div class="eyebrow">Lesson 4</div><h1 style="font-size:104px">Deep learning and the AI family</h1>
<div style="display:flex;gap:18px;margin-top:44px;flex-wrap:wrap"><span class="pill it ${ON(n,1)}" style="font-size:36px">AI</span><span class="pill it ${ON(n,1)}" style="font-size:36px">Machine learning</span><span class="pill it ${ON(n,2)}" style="font-size:36px">Deep learning</span><span class="pill it ${ON(n,2)}" style="font-size:36px">Generative AI</span></div>
<p class="it ${ON(n,3)}" style="font-size:42px;margin-top:36px;color:#44403c">Not the same thing. Just related, and the relationship is simple.</p>
<p class="it ${ON(n,4)}" style="font-size:44px;margin-top:20px;color:#5b21b6;font-weight:600;font-family:Fraunces,serif">One picture: circles inside circles.</p></div></body></html>` });

// 2 taxi statements
slides.push({ start: 33.5, steps: [33.5, 38.9, 44.1, 46.0, 48.1, 49.5, 52.5], html: n => S(`<div class="eyebrow">Something with nothing to do with computers</div><h2 style="margin-bottom:30px">Taxis, cars and vehicles</h2>
<div style="display:flex;flex-direction:column;gap:18px">
<div class="card row ${on(n,1)}"><span style="font-size:56px">🚕</span><span>Every taxi is a <b>car</b>.</span></div>
<div class="card row ${on(n,2)}"><span style="font-size:56px">🚗</span><span>Every car is a <b>vehicle</b>.</span></div>
<div class="card row ${on(n,3)}"><span style="font-size:56px">❓</span><span>But is every vehicle a car? <b class="${n>=4?'':''}" style="color:#991b1b">${n>=4?'No.':''}</b></span></div></div>
<div style="display:flex;gap:24px;margin-top:24px"><div class="card ${on(n,5)}" style="padding:18px 30px;font-size:34px">🏍 A boda boda is a vehicle, <b>not a car</b></div><div class="card ${on(n,6)}" style="padding:18px 30px;font-size:34px">🚌 A bus is a vehicle, <b>not a car</b></div></div>`) });

// 3 taxi circles
const taxi = [{ label: 'Vehicles', sub: 'cars, buses, boda bodas…' }, { label: 'Cars' }, { label: 'Taxis' }];
slides.push({ start: 57.5, steps: [57.5, 61.0, 65.2, 68.7, 71.5, 73.7, 78.5], html: n => S(split(nest(taxi, [n >= 2, n >= 1, n >= 0], -1, 760), `
<div class="eyebrow">Draw it as circles</div>
<div class="card row ${on(n,3)}" style="margin-bottom:16px"><span>Every taxi is a car.</span></div>
<div class="card row ${on(n,4)}" style="margin-bottom:16px"><span>Every car is a vehicle.</span></div>
<div class="card row ${on(n,5)}" style="margin-bottom:16px"><span>But not every vehicle is a car.</span></div>
<p class="${on(n,6)}" style="font-size:40px;margin-top:26px;color:#5b21b6;font-weight:600">Keep that picture in your head. The AI family works the same way.</p>`)) });

// 4 AI family circles
const fam = [{ label: 'AI', sub: 'jobs that need human thinking' }, { label: 'Machine learning', sub: 'learns from examples' }, { label: 'Deep learning' }, { label: 'Generative AI' }];
const cap = [
  ['The biggest circle', 'AI: a computer doing a job that normally needs human thinking.'],
  ['Inside it', 'Machine learning: the kind of AI that learns from examples instead of written rules.'],
  ['Careful', 'Machine learning is a kind of AI, but <b>not all AI is machine learning</b>.'],
  ['For example', 'The old rule-based spam filter, with its handwritten rules, is <b>AI</b>. But it is <b>not machine learning</b>.'],
  ['Inside machine learning', 'Deep learning is a kind of machine learning.'],
  ['The smallest circle, for now', 'Generative AI.'],
  ['The link', 'Generative AI is <b>built on</b> deep learning.'],
];
slides.push({ start: 87.3, steps: [87.3, 94.3, 102.4, 107.8, 115.1, 124.0, 129.3], html: n => S(split(nest(fam, [true, n >= 1, n >= 4, n >= 5], [0, 1, 1, 0, 2, 3, 3][n], 780), `
<div class="card hl" style="padding:36px 44px"><div class="eyebrow" style="margin-bottom:12px">${cap[n][0]}</div><div style="font-size:44px;line-height:1.3">${cap[n][1]}</div></div>`)) });

// 5 chain
slides.push({ start: 133.1, steps: [133.1, 136.9, 140.7, 145.0], html: n => S(`<div class="eyebrow">The whole chain in one go</div><h2 style="margin-bottom:36px">Who is built on what?</h2>
<div style="display:flex;flex-direction:column;gap:20px">
<div class="card row ${on(n,1)}"><span class="pill" style="font-size:36px">Generative AI</span><span class="muted">is built on</span><span class="pill" style="font-size:36px">deep learning</span></div>
<div class="card row ${on(n,2)}"><span class="pill" style="font-size:36px">Deep learning</span><span class="muted">is a kind of</span><span class="pill" style="font-size:36px">machine learning</span></div>
<div class="card row ${on(n,3)}"><span class="pill" style="font-size:36px">Machine learning</span><span class="muted">is a kind of</span><span class="pill" style="font-size:36px">AI</span></div></div>`) });

// 6 taxi analogy
slides.push({ start: 150.7, steps: [150.7, 154.4, 157.4, 159.5, 162.4], html: n => S(`<div class="eyebrow">If you remember the taxi</div><h2 style="margin-bottom:30px">…you can already review this</h2>
<div style="display:flex;flex-direction:column;gap:16px">
${[['🚕','Generative AI','is like the taxi',1],['🚗','Deep learning','is the car',2],['🚙','Machine learning','is like the vehicle',3],['🛣','AI','is everything that moves on the road',4]].map(r=>`<div class="card row ${on(n,r[3])}" style="padding:18px 36px"><span style="font-size:52px">${r[0]}</span><span class="pill" style="font-size:36px;min-width:420px;text-align:center">${r[1]}</span><span>${r[2]}</span></div>`).join('')}</div>`) });

// 7 inside deep learning
slides.push({ start: 167.0, steps: [167.0, 170.6, 175.0, 177.4], html: n => S(`<div class="center"><div class="eyebrow">Now, inside the circle called deep learning</div><h1 style="font-size:84px">It is where the most exciting results come from.</h1>
<div class="it ${ON(n,2)}" style="margin-top:50px"><span class="pill" style="font-size:52px;padding:18px 44px">Deep learning uses <b>layers</b></span></div>
<p class="it ${ON(n,3)}" style="font-size:40px;margin-top:34px;color:#57534e">Let me explain with a picture of a face.</p></div>`) });

// 8 face layers
const lay = [['🖼','The photo','A huge grid of tiny dots of colour'],['╱ ⌒','Layer 1','Finds edges and lines'],['◯ ⬭','Layer 2','Finds shapes'],['👁','Layer 3','“That looks like an eye”'],['🙂','Layer 4','Puts eyes, nose and mouth together: “That is a face”']];
const stepsFace = [181.1, 185.6, 191.8, 200.9, 210.3, 215.9, 223.9, 227.6, 231.6];
slides.push({ start: 181.1, steps: stepsFace, html: n => S(`<div class="eyebrow">Your phone is trying to recognise a face</div><h2 style="margin-bottom:34px">Each layer builds on the one before it</h2>
<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:22px">${lay.map((l,i)=>{const at=[0,1,2,3,4,5][i]; const vis = i===0?n>=0: n>=[0,2,3,4,5][i]; return `<div class="card it ${vis?'on':''} ${(n<2?0:n<3?1:n<4?2:n<5?3:n<6?4:-1)===i?'hl':''}" style="min-height:400px;padding:26px 22px;text-align:center"><div style="font-size:${i===1||i===2?64:86}px;line-height:1.2;height:110px;color:#6d28d9">${l[0]}</div><div class="eyebrow" style="margin:14px 0 8px;font-size:22px">${l[1]}</div><div style="font-size:30px;line-height:1.3">${l[2]}</div></div>`}).join('')}</div>
<p class="${on(n,6)}" style="font-size:36px;margin-top:30px;color:#44403c">Simple things at the start, more meaningful things at the end.</p>
<p class="${on(n,8)}" style="font-size:40px;margin-top:10px;color:#5b21b6;font-weight:600">That is why it is called <b>deep</b>: the more layers, the deeper.</p>`) });

// 9 tailor
slides.push({ start: 236.3, steps: [236.3, 239.2, 241.7, 244.2, 247.2], html: n => S(`<div class="eyebrow">Think of how a tailor looks at a customer</div><h2 style="margin-bottom:34px">From small details to the full picture</h2>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:28px">
<div class="card ${on(n,1)}" style="min-height:260px"><div class="num">1</div><div style="font-size:42px;margin-top:20px;line-height:1.25">First, the shape of a <b>shoulder</b></div></div>
<div class="card ${on(n,2)}" style="min-height:260px"><div class="num">2</div><div style="font-size:42px;margin-top:20px;line-height:1.25">Then the length of an <b>arm</b></div></div>
<div class="card hl ${on(n,3)}" style="min-height:260px"><div class="num">3</div><div style="font-size:42px;margin-top:20px;line-height:1.25">Then the whole <b>size of the person</b></div></div></div>
<p class="${on(n,4)}" style="font-size:40px;margin-top:36px;color:#5b21b6;font-weight:600">She builds up from small details to a full picture. Deep learning does it a little like that.</p>`) });

// 10 neural network
slides.push({ start: 255.2, steps: [255.2, 258.9, 263.6, 271.4, 273.8, 277.0, 280.1], html: n => S(`<div class="eyebrow">So what is deep learning, exactly?</div>
<h1 class="it ${ON(n,1)}" style="font-size:66px;max-width:1650px">A kind of computer system called a <span class="violet">neural network</span>.</h1>
<div class="grid2" style="margin-top:44px">
<div class="card ${on(n,2)}" style="min-height:250px"><div class="pill">Loosely inspired by</div><div style="font-size:40px;margin-top:20px;line-height:1.3">How brain cells connect to each other</div></div>
<div class="card hl ${on(n,4)}" style="min-height:250px"><div class="pill red">But, to be clear</div><div style="font-size:44px;margin-top:20px;line-height:1.25"><b>It is maths. It is not a brain.</b></div></div></div>
<p class="${on(n,5)}" style="font-size:36px;margin-top:28px;color:#57534e">There are no real brains in your phone. The word “neural” can mislead you.</p>`) });

// 11 messy data
slides.push({ start: 285.9, steps: [285.9, 289.9, 293.8, 297.2, 301.5, 304.3, 309.6, 314.5], html: n => S(`<div class="eyebrow">What is deep learning good at?</div><h1 style="font-size:70px">Messy data.</h1>
<div class="grid2" style="margin-top:34px">
<div class="card ${on(n,3)}" style="min-height:300px"><div class="pill green">Neat data</div><div style="font-size:36px;margin-top:18px;line-height:1.35">Rows and columns, like a <b>table of prices</b>.</div></div>
<div class="card hl ${on(n,2)}" style="min-height:300px"><div class="pill amber">Messy data</div><div style="font-size:36px;margin-top:18px;line-height:1.5"><span class="${on(n,4)}">📷 A photo is millions of dots.</span><br><span class="${on(n,5)}">🔊 A voice is a wave of sound.</span></div></div></div>
<p class="${on(n,6)}" style="font-size:36px;margin-top:26px;color:#57534e">It is hard to put these in rows. It is hard to say exactly what makes a face a face.</p>
<p class="${on(n,7)}" style="font-size:40px;margin-top:10px;color:#5b21b6;font-weight:600">Deep learning, with its layers, finds the patterns by itself.</p>`) });

// 12 where you meet it
slides.push({ start: 320.7, steps: [320.7, 323.7, 327.4], html: n => S(`<div class="eyebrow">That is why…</div><h2 style="margin-bottom:34px">Deep learning is already in your pocket</h2>
<div class="grid2"><div class="card ${on(n,0)}" style="min-height:260px"><div style="font-size:90px">🔓</div><div class="big" style="font-size:50px;margin-top:10px">Face unlock</div></div>
<div class="card ${on(n,1)}" style="min-height:260px"><div style="font-size:90px">🎙</div><div class="big" style="font-size:50px;margin-top:10px">Voice assistants</div></div></div>
<p class="${on(n,2)}" style="font-size:38px;margin-top:34px;color:#44403c">When you speak to your phone, it understands you even with a noisy street behind you. Deep learning is likely at work.</p>`) });

// 13 practise the family
slides.push({ start: 336.5, steps: [336.5, 341.3, 347.5, 356.3], html: n => S(`<div class="eyebrow">Let us practise the family</div><h2 style="margin-bottom:30px">Which circle is it?</h2>
<div style="display:flex;flex-direction:column;gap:18px">
<div class="card ${on(n,1)}" style="padding:22px 36px"><div style="font-size:38px"><b>Your spam filter</b>, learning from marked messages</div><div class="pill" style="margin-top:12px">Machine learning</div></div>
<div class="card ${on(n,2)}" style="padding:22px 36px"><div style="font-size:38px"><b>Face unlock</b>, finding edges, then shapes, then a face</div><div class="pill" style="margin-top:12px">Deep learning, which is a kind of machine learning</div></div>
<div class="card ${on(n,3)}" style="padding:22px 36px"><div style="font-size:38px"><b>A chatbot</b> writing messages for you</div><div class="pill" style="margin-top:12px">Generative AI, built on deep learning</div></div></div>`) });

// 14 shop owner
const q = [['Is she using AI?', 'Yes', 'green', 3], ['Is she using machine learning?', 'She could be', 'amber', 4], ['Is she using deep learning?', 'Probably: photos are messy data', 'amber', 6], ['Is she using generative AI?', 'Not if it only sorts: generative AI creates', 'red', 8]];
const qAt = [2, 3, 5, 7];
slides.push({ start: 363.2, steps: [363.2, 365.7, 370.7, 372.3, 374.1, 375.3, 377.1, 379.2, 382.1, 386.4], html: n => S(`<div class="eyebrow">A question to think about</div><h2 style="margin-bottom:20px">A shop owner sorts her customers' photos with AI</h2>
<div style="display:flex;flex-direction:column;gap:14px">${q.map((r,i)=>`<div class="card row ${on(n,qAt[i])}" style="padding:16px 34px;justify-content:space-between"><span style="font-size:38px;min-width:640px">${r[0]}</span><span class="pill ${r[2]} ${on(n,r[3])}" style="font-size:30px">${r[1]}</span></div>`).join('')}</div>
<p class="${on(n,9)}" style="font-size:36px;margin-top:26px;color:#57534e">Generative AI is the topic of the next video.</p>`) });

// 15 keep the circles
slides.push({ start: 389.0, steps: [389.0, 392.0, 394.0, 397.8], html: n => S(split(nest(fam.map(f => ({ label: f.label })), [true, true, true, true], -1, 780), `
<div class="card" style="padding:34px 40px"><div class="eyebrow" style="margin-bottom:10px">You don't need to memorise every detail</div><div class="big" style="font-size:52px;line-height:1.2">Just keep the circles in mind.</div></div>
<div class="card hl ${on(n,2)}" style="margin-top:22px;padding:30px 40px;font-size:40px;line-height:1.4"><b>AI</b> contains <b>machine learning</b>, which contains <b>deep learning</b>, <span class="${on(n,3)}">which in turn contains <b>generative AI</b>.</span></div>`)) });

// 16 task
slides.push({ start: 404.6, steps: [404.6, 408.2, 412.1, 417.1, 420.2, 423.8, 426.1], html: n => S(`<div class="eyebrow">Your task · pause and try this prompt</div><h2 style="margin-bottom:26px">Draw the circles on a piece of paper</h2>
<div class="card row ${on(n,1)}" style="padding:20px 34px;font-size:38px">Start with <b>AI</b> on the outside, and finish with <b>generative AI</b> on the inside.</div>
<p class="${on(n,3)}" style="font-size:36px;margin:26px 0 14px;color:#44403c">Then write one example in each circle:</p>
<div class="grid2" style="gap:16px">${[['AI','A handwritten-rule filter',4],['Machine learning','A spam filter that learns from examples',5],['Deep learning','Face unlock',6],['Generative AI','A chatbot',6]].map(r=>`<div class="card ${on(n,r[2])}" style="padding:16px 28px"><span class="eyebrow" style="font-size:20px;margin:0">${r[0]}</span><div style="font-size:33px;margin-top:4px">${r[1]}</div></div>`).join('')}</div>
<div class="${on(n,0)}" style="margin-top:22px"><span class="pill" style="font-size:32px">Pause the video now, then come back</span></div>`) });

// 17 recap
slides.push({ start: 431.3, steps: [431.3, 437.7, 440.7, 443.5, 448.9], html: n => S(`<div class="eyebrow">Recap</div>
<h1 style="font-size:60px;max-width:1700px;line-height:1.15">AI contains machine learning, which contains deep learning<span class="${on(n,1)} it">, which contains generative AI.</span></h1>
<div class="card ${on(n,2)}" style="margin-top:36px;padding:24px 36px;font-size:38px"><b>Deep learning is strong with messy data:</b> <span class="${on(n,3)} it" style="font-weight:600;color:#5b21b6">photos, video and voices.</span></div>
<p class="${on(n,4)}" style="font-size:38px;margin-top:34px;color:#57534e"><b>Next:</b> the innermost circle, generative AI, and the large language models behind chatbots like ChatGPT, Gemini and Claude.</p>`) });

await render({ FF, CHROME: process.env.CHROME, AUDIO, OUT, TOTAL, slides, dir: process.env.FRAMES || 'frames-m1-l4' });
