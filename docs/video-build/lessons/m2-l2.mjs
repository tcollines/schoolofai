import { render, shellFor, on, ON, CSS } from '../lesson-lib.mjs';
const [FF, AUDIO, OUT, TOTALS] = process.argv.slice(2);
const TOTAL = parseFloat(TOTALS || '559.18');
const meta = { mod: 'Module 2 · How to talk to AI', id: 'm2-l2', title: 'Context, task, format' };
const S = shellFor(meta);
const slides = [];
// the three colours used all lesson: context = violet, task = blue, format = amber
const COL = { c: ['#ede9fe', '#5b21b6', '#6d28d9'], t: ['#dbeafe', '#1e40af', '#2563eb'], f: ['#fef3c7', '#92400e', '#d97706'] };
const mark = (k, text) => `<span style="background:${COL[k][0]};color:${COL[k][1]};border-radius:10px;padding:2px 10px;box-decoration-break:clone;-webkit-box-decoration-break:clone">${text}</span>`;
const tag = (k, label) => `<span class="pill" style="background:${COL[k][0]};color:${COL[k][1]};font-size:30px;border:2px solid ${COL[k][2]}">${label}</span>`;
const bakery = (n, a) => `${mark('c', 'I run a small bakery in Entebbe.')} ${mark('t', 'Write a short, friendly email to a customer confirming their cake order for Saturday, UGX 120,000, pickup at 10am.')} ${mark('f', 'Keep it under 100 words.')}`;
const quote = t => `<div class="card" style="font-size:40px;line-height:1.5;background:#fff">${t}</div>`;

// 1 title + shop story part 1
slides.push({ start: 0, steps: [0, 3, 8.4, 14.6, 17.8, 21.3], html: n => S(`<div class="eyebrow">Lesson 2</div><h1 style="font-size:96px">Context, task, format</h1>
<p class="it ${ON(n,1)}" style="font-size:42px;margin-top:34px;color:#44403c">Picture a shop. You walk in.</p>
<div class="it ${ON(n,2)}" style="margin-top:24px"><span class="pill" style="font-size:44px;padding:16px 36px">“Give me something.”</span></div>
<div class="grid3" style="margin-top:34px">
<div class="card ${on(n,3)}" style="padding:24px 30px"><div style="font-size:38px;font-weight:700">What do you want?</div></div>
<div class="card ${on(n,4)}" style="padding:24px 30px"><div style="font-size:38px;font-weight:700">For whom is it?</div></div>
<div class="card ${on(n,5)}" style="padding:24px 30px"><div style="font-size:38px;font-weight:700">How much do you have?</div></div></div>`) });

// 2 shop story part 2
slides.push({ start: 25.6, steps: [25.6, 34.3, 42.8, 45.2, 48.5], html: n => S(`<div class="eyebrow">Now say it clearly</div><h2 style="margin-bottom:30px">The shopkeeper knows exactly what to do</h2>
<div class="card hl big" style="font-size:44px;line-height:1.4;font-weight:600;color:#3b0764">“I need a gift for my sister's birthday on Saturday. She likes books. I can spend about UGX 30,000.”</div>
<p class="${on(n,1)}" style="font-size:36px;margin-top:26px;color:#57534e">Who, when, what she likes, how much. Nothing left to guess.</p>
<div class="grid2" style="margin-top:20px"><div class="card ${on(n,2)}" style="padding:24px 34px"><div style="font-size:38px;line-height:1.3"><b>A chatbot is the same.</b> It cannot read your mind. It only has the words you type.</div></div>
<div class="card hl ${on(n,4)}" style="padding:24px 34px"><div style="font-size:38px;line-height:1.3;color:#5b21b6;font-weight:700">More useful detail in, more useful answer out.</div></div></div>`) });

// 3 weak vs strong
slides.push({ start: 53.5, steps: [53.5, 60, 66.4, 72.6, 77.9, 97, 101.7, 104.6], html: n => S(`<div class="eyebrow">Weak versus strong</div>
<div class="grid2" style="margin-top:6px;align-items:start">
<div><div class="pill red">Weak</div><div class="card ${on(n,0)}" style="margin-top:16px"><div class="big" style="font-size:60px">“Write an email.”</div></div>
<div style="display:flex;flex-direction:column;gap:10px;margin-top:20px;font-size:34px;color:#57534e">
<div class="it ${ON(n,1)}">Who is it to? What is it about?</div><div class="it ${ON(n,2)}">How long? Friendly or formal?</div>
<div class="it ${ON(n,3)}" style="color:#991b1b;font-weight:700">The chatbot has to guess every one. So the answer is general.</div></div></div>
<div class="${on(n,4)}"><div class="pill green">Strong</div><div class="card hl" style="margin-top:16px;font-size:34px;line-height:1.55">“I run a small bakery in Entebbe. Write a short, friendly email to a customer confirming their cake order for Saturday, UGX 120,000, pickup at 10am. Keep it under 100 words.”</div>
<div style="display:flex;flex-direction:column;gap:10px;margin-top:20px;font-size:34px">
<div class="it ${ON(n,5)}">✔ It says <b>who you are</b></div><div class="it ${ON(n,6)}">✔ It says <b>what you want</b></div><div class="it ${ON(n,7)}">✔ It says <b>how you want it</b></div></div></div></div>`) });

// 4 three parts intro
slides.push({ start: 108.3, steps: [108.3, 113], html: n => S(`<div class="eyebrow">A good request has three parts</div><h2>Let us take them one at a time</h2>
<div class="grid3 it ${ON(n,1)}">${[['c','1','Context','Who you are and the situation'],['t','2','Task','What you want it to do'],['f','3','Format','Length, tone, shape']].map(p => `<div class="card" style="min-height:340px;border-color:${COL[p[0]][2]};background:${COL[p[0]][0]}"><div class="num" style="background:${COL[p[0]][2]}">${p[1]}</div><div class="big" style="font-size:62px;margin-top:24px;color:${COL[p[0]][1]}">${p[2]}</div><div style="font-size:34px;margin-top:12px;line-height:1.3;color:#44403c">${p[3]}</div></div>`).join('')}</div>`) });

// 5 context
slides.push({ start: 119.3, steps: [119.3, 126.2, 133], html: n => S(`<div class="eyebrow" style="color:${COL.c[2]}">Part 1</div><h1 style="font-size:100px;color:${COL.c[1]}">Context</h1>
<p style="font-size:44px;margin-top:10px;line-height:1.3">Who you are, and the situation. <span class="muted">The background the chatbot needs.</span></p>
${`<div class="${on(n,1)}" style="margin-top:36px">${quote(mark('c','I run a small bakery in Entebbe.'))}</div>`}
<p class="${on(n,2)}" style="font-size:40px;margin-top:30px;color:${COL.c[1]};font-weight:600">Now it knows you run a business, and where. It writes like a baker, not like a bank.</p>`) });

// 6 task
slides.push({ start: 140, steps: [140, 144.6, 153, 157.8], html: n => S(`<div class="eyebrow" style="color:${COL.t[2]}">Part 2</div><h1 style="font-size:100px;color:${COL.t[1]}">Task</h1>
<p style="font-size:44px;margin-top:10px;line-height:1.3">What you want it to do.</p>
<div class="${on(n,1)}" style="margin-top:30px">${quote(mark('t','Write a short, friendly email to a customer confirming their cake order.'))}</div>
<div class="${on(n,2)}" style="display:flex;flex-wrap:wrap;gap:14px;margin-top:30px">${['Write','Explain','List','Compare','Summarise','Translate'].map(w=>`<span class="pill" style="background:${COL.t[0]};color:${COL.t[1]};font-size:34px">${w}</span>`).join('')}</div>
<p class="${on(n,3)}" style="font-size:40px;margin-top:28px;color:${COL.t[1]};font-weight:600">One clear task is better than five muddled ones.</p>`) });

// 7 format
slides.push({ start: 161, steps: [161, 168, 175.8, 178.6, 181.6, 189], html: n => S(`<div class="eyebrow" style="color:${COL.f[2]}">Part 3</div><h1 style="font-size:100px;color:${COL.f[1]}">Format</h1>
<p style="font-size:44px;margin-top:10px;line-height:1.3">How you want the answer to look.</p>
<div class="${on(n,1)}" style="display:flex;gap:14px;margin-top:26px">${['Length','Tone','Shape'].map(w=>`<span class="pill" style="background:${COL.f[0]};color:${COL.f[1]};font-size:36px">${w}</span>`).join('')}</div>
<div class="grid3" style="margin-top:28px">
<div class="card ${on(n,2)}" style="padding:24px 30px;font-size:34px;line-height:1.3">${mark('f','Keep it under 100 words.')}</div>
<div class="card ${on(n,3)}" style="padding:24px 30px;font-size:34px;line-height:1.3">${mark('f','In three bullet points.')}</div>
<div class="card ${on(n,4)}" style="padding:24px 30px;font-size:34px;line-height:1.3">${mark('f','A short message I can send on WhatsApp.')}</div></div>
<p class="${on(n,5)}" style="font-size:40px;margin-top:30px;color:${COL.f[1]};font-weight:600">It saves you editing time. The answer arrives in a shape you can use.</p>`) });

// 8 colour-coded bakery prompt
slides.push({ start: 197.4, steps: [197.4, 207.6, 217.6, 227.4], html: n => S(`<div class="eyebrow">Back to the bakery prompt</div><h2 style="margin-bottom:26px">Context, task, format. That is all you need.</h2>
<div style="display:flex;flex-direction:column;gap:18px">
<div class="card ${on(n,1)}" style="padding:24px 34px;display:grid;grid-template-columns:200px 1fr;gap:24px;align-items:center">${tag('c','Context')}<div style="font-size:36px;line-height:1.3">${mark('c','I run a small bakery in Entebbe.')}</div></div>
<div class="card ${on(n,2)}" style="padding:24px 34px;display:grid;grid-template-columns:200px 1fr;gap:24px;align-items:center">${tag('t','Task')}<div style="font-size:36px;line-height:1.3">${mark('t','Write a short, friendly email to a customer confirming their cake order for Saturday, UGX 120,000, pickup at 10am.')}</div></div>
<div class="card ${on(n,3)}" style="padding:24px 34px;display:grid;grid-template-columns:200px 1fr;gap:24px;align-items:center">${tag('f','Format')}<div style="font-size:36px;line-height:1.3">${mark('f','Keep it under 100 words.')}</div></div></div>`) });

// 9 live demo
slides.push({ start: 233.2, steps: [233.2, 244.8, 253.2, 261.5, 267.4], html: n => S(`<div class="eyebrow">Live demo · same chatbot, same minute</div>
<div class="grid2" style="margin-top:6px;align-items:start">
<div class="${on(n,0)}"><div class="pill red">Weak prompt</div><div class="card" style="margin-top:16px;min-height:360px"><div class="muted" style="font-size:30px;margin-bottom:12px">What you saw</div><div class="it ${ON(n,1)}" style="font-size:40px;line-height:1.35">It asked who the email was for, or wrote something general. <b>It had to guess.</b></div></div></div>
<div class="${on(n,2)}"><div class="pill green">Strong prompt</div><div class="card hl" style="margin-top:16px;min-height:360px"><div class="muted" style="font-size:30px;margin-bottom:12px">What you saw</div>
<div style="display:flex;flex-direction:column;gap:10px;font-size:40px"><div class="it ${ON(n,2)}">✔ The date is there</div><div class="it ${ON(n,3)}">✔ The amount is there</div><div class="it ${ON(n,3)}">✔ The pickup time is there</div><div class="it ${ON(n,3)}">✔ And it is short</div></div></div></div></div>
<p class="${on(n,4)}" style="font-size:42px;margin-top:30px;color:#5b21b6;font-weight:600">Same chatbot. Same minute. Only the words I typed changed.</p>`) });

// 10 boda boda
slides.push({ start: 273, steps: [273, 278.8, 292.8, 300.4, 314.8, 320, 324.6], html: n => S(`<div class="eyebrow">Example 1 · Moses, a boda boda rider</div><p class="${on(n,1)}" style="font-size:36px;color:#44403c;margin-bottom:18px">He wants to tell regular customers he now takes bookings by phone for airport runs.</p>
<div class="${on(n,2)}"><div class="pill red">Weak</div> <span style="font-size:42px;margin-left:16px" class="big">“Write a message.”</span></div>
<div class="${on(n,3)}" style="margin-top:22px"><div class="pill green">Strong</div><div class="card hl" style="margin-top:12px;font-size:34px;line-height:1.55">${mark('c','I am a boda boda rider with many regular customers.')} ${mark('t','Write a message I can send on WhatsApp telling them I now take bookings for airport trips.')} ${mark('f','Keep it friendly, about 60 words, and end with a request to call me.')}</div></div>
<div style="display:flex;flex-direction:column;gap:10px;margin-top:20px;font-size:32px">
<div class="it ${ON(n,4)}">${tag('c','Context')} a rider with regular customers</div>
<div class="it ${ON(n,5)}">${tag('t','Task')} the message about airport bookings</div>
<div class="it ${ON(n,6)}">${tag('f','Format')} short, friendly, 60 words, ends with a request to call</div></div>`) });

// 11 student
slides.push({ start: 331, steps: [331, 338, 343.6, 355.8, 360.3, 363.6], html: n => S(`<div class="eyebrow">Example 2 · Nakato, a university student</div><p class="${on(n,0)}" style="font-size:36px;color:#44403c;margin-bottom:18px">She has a five-minute presentation on saving money.</p>
<div class="${on(n,1)}"><div class="pill red">Weak</div> <span style="font-size:42px;margin-left:16px" class="big">“Help me with my presentation.”</span></div>
<div class="${on(n,2)}" style="margin-top:22px"><div class="pill green">Strong</div><div class="card hl" style="margin-top:12px;font-size:34px;line-height:1.55">${mark('c','I am a second-year student with a five-minute presentation on saving money.')} ${mark('t','Give me an outline')} ${mark('f','of five points, each with one sentence in simple English.')}</div></div>
<div style="display:flex;flex-direction:column;gap:10px;margin-top:20px;font-size:32px">
<div class="it ${ON(n,3)}">${tag('c','Context')} a second-year student with a five-minute talk</div>
<div class="it ${ON(n,4)}">${tag('t','Task')} an outline</div>
<div class="it ${ON(n,5)}">${tag('f','Format')} five points, one sentence each, simple English</div></div>`) });

// 12 long prompts?
slides.push({ start: 368.4, steps: [368.4, 372.8, 379.6, 384.4, 389.6, 392.9, 395.8, 398.6], html: n => S(`<div class="eyebrow">A fair question</div><h2 style="margin-bottom:22px">Must I always write long prompts?</h2>
<div class="grid2"><div class="card ${on(n,1)}" style="padding:24px 34px"><div style="font-size:42px;font-weight:700;color:#166534">No.</div><div style="font-size:36px;margin-top:6px;line-height:1.3">Include the detail that matters.</div></div>
<div class="card ${on(n,2)}" style="padding:24px 34px"><div style="font-size:36px;line-height:1.3">Sometimes that is <b>one sentence</b>. Other times, <b>four</b>.</div></div></div>
<div class="${on(n,3)}" style="font-size:30px;font-weight:700;letter-spacing:.08em;color:#5b21b6;margin:30px 0 14px">BEFORE YOU PRESS SEND, ASK:</div>
<div style="display:flex;flex-direction:column;gap:12px">
<div class="card row ${on(n,4)}" style="padding:16px 30px">${tag('c','Context')} Does it know who I am and the situation?</div>
<div class="card row ${on(n,5)}" style="padding:16px 30px">${tag('t','Task')} Does it know what I want it to do?</div>
<div class="card row ${on(n,6)}" style="padding:16px 30px">${tag('f','Format')} Does it know how I want the answer to look?</div></div>
<p class="${on(n,7)}" style="font-size:38px;margin-top:20px;color:#166534;font-weight:700">Yes to all three? You are ready.</p>`) });

// 13 details come from you
slides.push({ start: 403.4, steps: [403.4, 408.5, 410.6, 415.9], html: n => S(`<div class="eyebrow">Notice the details</div><h2>They came from you, not the chatbot</h2>
<div class="${on(n,1)}" style="display:flex;gap:16px;margin-bottom:26px"><span class="pill" style="font-size:36px">UGX 120,000</span><span class="pill" style="font-size:36px">Pickup at 10am</span><span class="pill" style="font-size:36px">Saturday</span></div>
<div class="card ${on(n,2)}"><div style="font-size:42px;line-height:1.35">The chatbot does not know your prices or your customers. <b>You do.</b></div></div>
<div class="card hl ${on(n,3)}" style="margin-top:24px"><div style="font-size:42px;line-height:1.35;color:#5b21b6;font-weight:600">You give it the real facts. It helps you with the words.</div></div>`) });

// 14 order tip
slides.push({ start: 421.6, steps: [421.6, 427.8, 436.8], html: n => S(`<div class="eyebrow">A small tip</div><h2>The order does not matter</h2>
<p style="font-size:40px;color:#44403c">As long as all three parts are there.</p>
<div class="${on(n,1)}" style="display:flex;align-items:center;gap:20px;margin-top:40px">${tag('c','Context')}<span class="arrow">→</span>${tag('t','Task')}<span class="arrow">→</span>${tag('f','Format')}<span class="muted" style="font-size:32px;margin-left:16px">Many people start here. It feels like telling a story.</span></div>
<p class="${on(n,2)}" style="font-size:42px;margin-top:44px;color:#5b21b6;font-weight:600">Use whichever order feels easiest.</p>`) });

// 15 missing a part
slides.push({ start: 442.9, steps: [442.9, 448.5, 451, 454.2], html: n => S(`<div class="eyebrow">If the answer misses the mark</div><h2>Look at your three parts</h2>
<div class="card ${on(n,0)}"><div style="font-size:42px;line-height:1.35">One or two of them is probably missing.</div></div>
<div class="card ${on(n,1)}" style="margin-top:22px"><div style="font-size:40px;line-height:1.35">Usually it is the <b>context</b> or the <b>format</b>.</div></div>
<div class="card hl ${on(n,2)}" style="margin-top:22px"><div style="font-size:40px;line-height:1.35;color:#5b21b6;font-weight:600">Fix that part and try again.</div></div>
<p class="${on(n,3)}" style="font-size:34px;margin-top:26px;color:#57534e">Next lesson: an even faster way to improve an answer.</p>`) });

// 16 privacy
slides.push({ start: 461.6, steps: [461.6, 464.6, 473.8, 481], html: n => S(`<div class="eyebrow">One more thing</div><h2>Do not put private details in</h2>
<div class="card ${on(n,1)}"><div style="font-size:40px;line-height:1.35">For the bakery, I did not type the customer's <b>name</b> or <b>phone number</b>. Only the order details.</div></div>
<div class="card hl ${on(n,2)}" style="margin-top:24px"><div style="font-size:40px;line-height:1.35">AI already saves you time. A few seconds to add the name yourself, afterwards, is worth it.</div></div>
<p class="${on(n,3)}" style="font-size:34px;margin-top:26px;color:#57534e">We will say more about privacy later in the course.</p>`) });

// 17 put it together
slides.push({ start: 491.3, steps: [491.3, 493.9, 498.4, 501.6, 506], html: n => S(`<div class="eyebrow">Putting it together</div><h2 style="margin-bottom:26px">A good request has three parts</h2>
<div class="grid3">${[['c','1','Context','Who you are and the situation',1],['t','2','Task','What you want it to do',2],['f','3','Format','Length, tone, shape',3]].map(p => `<div class="card ${on(n,p[4])}" style="min-height:300px;border-color:${COL[p[0]][2]};background:${COL[p[0]][0]}"><div class="num" style="background:${COL[p[0]][2]}">${p[1]}</div><div class="big" style="font-size:56px;margin-top:20px;color:${COL[p[0]][1]}">${p[2]}</div><div style="font-size:32px;margin-top:10px;line-height:1.3;color:#44403c">${p[3]}</div></div>`).join('')}</div>
<p class="${on(n,4)}" style="font-size:44px;margin-top:34px;color:#5b21b6;font-weight:600">More useful detail in, more useful answer out.</p>`) });

// 18 task
slides.push({ start: 513, steps: [513, 516.5, 521.5, 526.5, 529.5], html: n => S(`<div class="eyebrow">Your task · pause and try</div><h2>Weak, then strong</h2>
<div style="display:flex;flex-direction:column;gap:20px">
<div class="card row ${on(n,1)}"><span class="num">1</span><span>Type the weak prompt: <b>“Write an email.”</b></span></div>
<div class="card row ${on(n,2)}"><span class="num">2</span><span>Now write <b>your own version</b> with context, task and format</span></div>
<div class="card row ${on(n,3)}"><span class="num">3</span><span><b>Compare</b> the two answers</span></div></div>
<div class="${on(n,4)}" style="margin-top:30px"><span class="pill" style="font-size:36px">Pause the video now, then come back</span></div>`) });

// 19 summary
slides.push({ start: 530.7, steps: [530.7, 533.8, 536.2, 538.8, 541.5], html: n => S(`<div class="center"><div class="eyebrow">Summary</div>
<h1 style="font-size:70px;line-height:1.25"><span class="it ${ON(n,1)}">Give it ${mark('c','context')}.</span><br><span class="it ${ON(n,2)}">Give it a ${mark('t','task')}.</span><br><span class="it ${ON(n,3)}">Give it a ${mark('f','format')}.</span></h1>
<p class="it ${ON(n,4)}" style="font-size:44px;margin-top:44px;color:#5b21b6;font-weight:600">Then the answer you get back is far more useful.</p></div>`) });

// 20 next
slides.push({ start: 548.9, steps: [548.9, 553.8], html: n => S(`<div class="center"><div class="eyebrow">Even a strong prompt…</div>
<h1 style="font-size:74px;max-width:1700px">…is sometimes not quite right.</h1>
<p class="it ${ON(n,1)}" style="font-size:44px;margin-top:44px;color:#57534e"><b>Next:</b> refine the answer, instead of starting again.</p></div>`) });

await render({ FF, CHROME: process.env.CHROME, AUDIO, OUT, TOTAL, slides, dir: process.env.FRAMES || 'frames-m2-l2' });
