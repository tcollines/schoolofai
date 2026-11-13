import { render, shellFor, on, ON, CSS } from '../lesson-lib.mjs';
const [FF, AUDIO, OUT, TOTALS] = process.argv.slice(2);
const TOTAL = parseFloat(TOTALS || '413.96');
const meta = { mod: 'Module 2 · How to talk to AI', id: 'm2-l3', title: "Not quite right? Refine, don't restart" };
const S = shellFor(meta);
const slides = [];
const say = t => `<span class="pill" style="font-size:36px;background:#ede9fe;color:#4c1d95">${t}</span>`;
const row = (n, i, num, html) => `<div class="card row ${on(n, i)}" style="padding:22px 36px"><span class="num">${num}</span><span>${html}</span></div>`;

// 1 title
slides.push({ start: 0, steps: [0, 3, 11.2, 18.2], html: n => `<html><head><style>${CSS}</style></head><body>
<div class="bar"><span><b>WELILE SCHOOL OF AI</b> &nbsp;·&nbsp; AI Fundamentals</span><span>${meta.mod}</span></div>
<div class="wrap center"><div class="eyebrow">Lesson 3</div><h1 style="font-size:100px">Not quite right?<br><span class="violet">Refine, don't restart.</span></h1>
<p class="it ${ON(n,1)}" style="font-size:42px;margin-top:40px;color:#44403c">You wrote a good prompt. The answer is nearly right, but not quite.</p>
<p class="it ${ON(n,2)}" style="font-size:40px;margin-top:20px;color:#57534e">Most people close the chat, start a new one, and type the whole request again.</p>
<p class="it ${ON(n,3)}" style="font-size:52px;margin-top:26px;color:#991b1b;font-weight:700;font-family:Fraunces,serif">Please don't do that.</p></div></body></html>` });

// 2 tailor
slides.push({ start: 22, steps: [22, 27.2, 30.2, 32.2, 36.5, 40.2, 47.2], html: n => S(`<div class="eyebrow">Think of a tailor</div><h2 style="margin-bottom:26px">A shirt that is a little long in the sleeves</h2>
<div class="grid2"><div class="card ${on(n,1)}" style="min-height:190px"><div style="font-size:42px;line-height:1.3">The customer comes to collect the shirt…</div></div>
<div class="card ${on(n,2)}" style="min-height:190px"><div style="font-size:42px;line-height:1.3">…and the sleeves are <b>too long</b>.</div></div></div>
<div class="grid2" style="margin-top:22px"><div class="card ${on(n,3)}" style="padding:22px 34px"><div style="font-size:38px;line-height:1.3">“Throw it away and start again from the cloth?”</div><div class="${on(n,4)}" style="font-size:44px;font-weight:700;color:#991b1b;margin-top:8px">Of course not.</div></div>
<div class="card hl ${on(n,5)}" style="padding:22px 34px"><div style="font-size:34px;line-height:1.35"><span class="pill green">Stays</span> <span style="margin-left:10px">collar · buttons · stitching</span></div><div class="${on(n,6)}" style="font-size:34px;line-height:1.35;margin-top:14px"><span class="pill amber">Changes</span> <span style="margin-left:10px"><b>only the sleeves</b></span></div></div></div>`) });

// 3 refining defined
slides.push({ start: 49, steps: [49, 54.2, 57.6, 62.2], html: n => S(`<div class="eyebrow">Treat a chatbot answer the same way</div><h2 style="margin-bottom:28px">Starting over throws away what was already good</h2>
<div class="grid2"><div class="card ${on(n,1)}" style="min-height:230px"><div class="pill red">Not quite right?</div><div style="font-size:44px;margin-top:20px;line-height:1.3">Do not start again.</div></div>
<div class="card hl ${on(n,2)}" style="min-height:230px"><div class="pill green">Instead</div><div style="font-size:44px;margin-top:20px;line-height:1.3">Give a <b>follow-up instruction</b>.</div></div></div>
<div class="card ${on(n,3)}" style="margin-top:26px"><span class="pill" style="font-size:34px">Refine</span><span style="font-size:42px;margin-left:22px">to improve an answer with a follow-up.</span></div>`) });

// 4 why it works
slides.push({ start: 67, steps: [67, 69.2, 73.4, 79.6, 82.4], html: n => S(`<div class="eyebrow">Why does this work?</div><h2>The chatbot remembers the conversation</h2>
<div class="card ${on(n,1)}"><div style="font-size:42px;line-height:1.35">It remembers what you said <b>in the same conversation</b>.</div></div>
<div class="card ${on(n,2)}" style="margin-top:22px;padding:24px 36px"><div style="font-size:30px;color:#57534e;margin-bottom:8px">You type</div><div style="font-size:50px;font-weight:700;color:#5b21b6">“Make it shorter.”</div><div class="it ${ON(n,3)}" style="font-size:38px;margin-top:10px">It looks at the answer above, and changes it.</div></div>
<div class="card hl ${on(n,4)}" style="margin-top:22px"><div style="font-size:40px;line-height:1.35">You do not repeat your <b>context</b>, <b>task</b> or <b>format</b>. They are already there.</div></div>`) });

// 5 six phrases
const phrases = [
  ['Make it shorter.', 'Too long for a WhatsApp message or a notice. Say how short: “about 50 words”.'],
  ['Make it warmer.', 'It sounds cold or stiff, like a message to a loyal customer.'],
  ['Explain that in simpler words.', 'You did not understand something. Very useful for students.'],
  ['Use a more formal tone.', 'A bank, a school office, a government office. Something official.'],
  ['Give me three versions.', 'You want choices, so you can pick the one that sounds most like you.'],
  ['Add an example.', 'An idea feels abstract. An example makes it clearer.'],
];
slides.push({ start: 87, steps: [87, 94, 108, 118, 127, 136.5, 145.5, 159.5], html: n => S(`<div class="eyebrow">Six short instructions</div><h2 style="margin-bottom:22px;font-size:60px">You do not have to memorise them. Keep them nearby.</h2>
<div class="grid2" style="gap:20px">${phrases.map((p,i)=>`<div class="card ${on(n,i+1)}" style="padding:18px 30px;min-height:170px"><div class="big" style="font-size:44px;color:#5b21b6">${p[0]}</div><div style="font-size:29px;margin-top:10px;line-height:1.35;color:#44403c">${p[1]}</div></div>`).join('')}</div>
<p class="${on(n,7)}" style="font-size:34px;margin-top:14px;color:#57534e">None of them is long or clever. Short and plain works best.</p>`) });

// 6 live walk-through
slides.push({ start: 170.5, steps: [170.5, 174.8, 189, 204, 218.2, 227.5, 233.5], html: n => S(`<div class="eyebrow">Live demo · refine step by step</div><h2 style="margin-bottom:22px">A thank-you message to a customer</h2>
<div style="display:flex;flex-direction:column;gap:16px">
<div class="card ${on(n,1)}" style="padding:18px 32px;display:grid;grid-template-columns:200px 1fr;gap:20px;align-items:center"><span class="muted" style="font-size:28px;font-weight:700">ASK</span><span style="font-size:36px">A short thank-you message to our customer.</span></div>
<div class="card ${on(n,2)}" style="padding:18px 32px;display:grid;grid-template-columns:200px 1fr;gap:20px;align-items:center"><span class="muted" style="font-size:28px;font-weight:700">A BIT STIFF</span><span style="font-size:36px">So I do not start again. I type: ${say('Make it warmer.')}</span></div>
<div class="card ${on(n,3)}" style="padding:18px 32px;display:grid;grid-template-columns:200px 1fr;gap:20px;align-items:center"><span class="muted" style="font-size:28px;font-weight:700">TOO LONG</span><span style="font-size:36px">Friendly now, but long for WhatsApp. ${say('Make it shorter.')}</span></div>
<div class="card hl ${on(n,4)}" style="padding:18px 32px;display:grid;grid-template-columns:200px 1fr;gap:20px;align-items:center"><span style="font-size:28px;font-weight:700;color:#166534">WARM + SHORT</span><span style="font-size:36px">Nothing lost along the way.</span></div>
<div class="card ${on(n,5)}" style="padding:18px 32px;display:grid;grid-template-columns:200px 1fr;gap:20px;align-items:center"><span class="muted" style="font-size:28px;font-weight:700">CHOICES</span><span style="font-size:36px">${say('Give me three versions.')}</span></div>
<div class="card ${on(n,6)}" style="padding:18px 32px;display:grid;grid-template-columns:200px 1fr;gap:20px;align-items:center"><span class="muted" style="font-size:28px;font-weight:700">PICK</span><span style="font-size:36px">I choose the one I like best.</span></div></div>`) });

// 7 edit by hand
slides.push({ start: 236.3, steps: [236.3, 242.2, 243.6, 247.4, 252.2, 254.6, 264.6], html: n => S(`<div class="eyebrow">The last step is the most important</div><h2 style="margin-bottom:24px">Edit it by hand</h2>
<div style="display:flex;flex-direction:column;gap:16px">
${row(n,2,1,'Add the <b>customer’s name</b>. I did not type it into the chatbot.')}
${row(n,3,2,'Add a <b>personal detail</b>, such as “your order will be ready on Friday”.')}
${row(n,4,3,'<b>Fix anything that is not true.</b> The chatbot does not know my shop hours or my prices. It may have guessed.')}</div>
<p class="${on(n,5)}" style="font-size:36px;margin-top:22px;color:#57534e">I read it carefully before I send it.</p>
<div class="card hl ${on(n,6)}" style="margin-top:14px;padding:20px 36px"><div style="font-size:42px;font-weight:700;color:#5b21b6">The chatbot gives you a draft. The final touches are yours.</div></div>`) });

// 8 refine more than once
slides.push({ start: 269.5, steps: [269.5, 275.4, 282.4], html: n => S(`<div class="eyebrow">A few things you can do</div><h2>You can refine more than once</h2>
<div class="card ${on(n,1)}"><div style="font-size:42px;line-height:1.35">There is <b>no limit</b> to how many follow-ups you can give in a session.</div></div>
<div class="card hl ${on(n,2)}" style="margin-top:24px"><div style="font-size:42px;line-height:1.35;color:#5b21b6;font-weight:600">Two or three small changes usually get you there.</div></div>`) });

// 9 be specific
slides.push({ start: 285.2, steps: [285.2, 287.6, 290.6, 296.4], html: n => S(`<div class="eyebrow">You can be specific</div><h2 style="margin-bottom:24px">Instead of “make it better”, say how</h2>
<div style="display:flex;flex-direction:column;gap:18px">
<div class="card ${on(n,1)}" style="padding:22px 36px"><span class="pill red">Vague</span><span style="font-size:42px;margin-left:24px">“Make it better.”</span></div>
<div class="card ${on(n,2)}" style="padding:22px 36px"><span class="pill amber">Better</span><span style="font-size:42px;margin-left:24px">“Make it shorter.”</span></div>
<div class="card hl ${on(n,3)}" style="padding:22px 36px"><span class="pill green">Best</span><span style="font-size:40px;margin-left:24px;line-height:1.4">“Make it warmer, and add one sentence thanking them for choosing a local shop.”</span></div></div>`) });

// 10 undo
slides.push({ start: 302.4, steps: [302.4, 307.6, 313.2], html: n => S(`<div class="eyebrow">You can undo</div><h2>Do not like a change? Say so.</h2>
<div class="card ${on(n,0)}"><div style="font-size:42px">${say('Go back to the first version.')}</div></div>
<div class="card ${on(n,1)}" style="margin-top:22px"><div style="font-size:34px;color:#57534e;margin-bottom:8px">Or, more precisely</div><div style="font-size:42px">${say('Keep the first paragraph. Change only the last one.')}</div></div>
<p class="${on(n,2)}" style="font-size:42px;margin-top:34px;color:#5b21b6;font-weight:600">Feel free to experiment.</p>`) });

// 11 sometimes start fresh
slides.push({ start: 316.4, steps: [316.4, 322.2, 325.4, 333.3], html: n => S(`<div class="eyebrow">An exception</div><h2>Sometimes you do start fresh</h2>
<div class="card ${on(n,1)}"><div style="font-size:42px;line-height:1.35">The chatbot has <b>misunderstood your whole task</b>.</div></div>
<div class="card ${on(n,2)}" style="margin-top:22px"><div style="font-size:42px;line-height:1.35">The conversation has become <b>too long and confused</b>.</div></div>
<div class="card hl ${on(n,3)}" style="margin-top:22px"><div style="font-size:46px;font-weight:700;color:#5b21b6">Most of the time, just refine.</div></div>`) });

// 12 reminder
slides.push({ start: 337.3, steps: [337.3, 340.4, 343.6, 345.6, 350.6], html: n => S(`<div class="center"><div class="eyebrow">One reminder</div>
<h1 style="font-size:84px;max-width:1650px">Refining makes an answer <span class="violet">sound</span> better.<br><span class="it ${ON(n,2)}" style="color:#991b1b">It does not make it true.</span></h1>
<p class="it ${ON(n,3)}" style="font-size:42px;margin-top:40px;color:#44403c">A price, a date, a fact: <b>you</b> are still the one who checks it.</p>
<p class="it ${ON(n,4)}" style="font-size:34px;margin-top:20px;color:#57534e">We will spend a whole module on that soon.</p></div>`) });

// 13 review
slides.push({ start: 354.4, steps: [354.4, 360.4, 362.2, 363.2, 364.6, 366.6, 368.2, 370.4], html: n => S(`<div class="eyebrow">Let us review</div><h2 style="margin-bottom:22px">Not quite right? Do not start again.</h2>
<div class="card hl ${on(n,0)}" style="padding:22px 36px;font-size:42px;font-weight:600;color:#5b21b6">Give a follow-up instruction</div>
<div style="display:flex;flex-wrap:wrap;gap:16px;margin-top:28px">
<span class="pill ${on(n,2)}" style="font-size:34px">Make it shorter</span><span class="pill ${on(n,3)}" style="font-size:34px">Make it warmer</span><span class="pill ${on(n,4)}" style="font-size:34px">Explain it simpler</span><span class="pill ${on(n,5)}" style="font-size:34px">More formal</span><span class="pill ${on(n,6)}" style="font-size:34px">Three versions</span><span class="pill ${on(n,7)}" style="font-size:34px">Add an example</span></div>
<p class="${on(n,7)}" style="font-size:42px;margin-top:34px;color:#44403c">Then <b>edit by hand</b>.</p>`) });

// 14 task
slides.push({ start: 373.2, steps: [373.2, 377.6, 381.2, 383.2, 384.6, 387.6, 390], html: n => S(`<div class="eyebrow">Your task · pause and try</div><h2 style="margin-bottom:22px">Refine a thank-you message</h2>
<div style="display:flex;flex-direction:column;gap:16px">
${row(n,1,1,'Ask for a <b>short thank-you message</b> to a customer')}
${row(n,2,2,'Ask it to <b>make the message warmer</b>')}
${row(n,3,3,'Then <b>shorter</b>')}
${row(n,4,4,'Then give it to you in <b>three versions</b>')}
${row(n,5,5,'Pick your favourite and <b>edit it</b>')}</div>
<div class="${on(n,6)}" style="margin-top:22px"><span class="pill" style="font-size:34px">Pause the video now, then come back</span></div>`) });

// 15 summary
slides.push({ start: 391.2, steps: [391.2, 400.4], html: n => S(`<div class="center"><div class="eyebrow">Summary</div>
<h1 style="font-size:66px;max-width:1700px;line-height:1.2">When the answer is nearly right, <span class="violet">refine it with a short follow-up</span> instead of starting again.</h1>
<p class="it ${ON(n,1)}" style="font-size:40px;margin-top:46px;color:#57534e"><b>Next:</b> give the chatbot your own text to work from, and what you must never paste into it.</p></div>`) });

await render({ FF, CHROME: process.env.CHROME, AUDIO, OUT, TOTAL, slides, dir: process.env.FRAMES || 'frames-m2-l3' });
