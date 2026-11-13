import { render, shellFor, on, ON, CSS } from '../lesson-lib.mjs';
const [FF, AUDIO, OUT, TOTALS] = process.argv.slice(2);
const TOTAL = parseFloat(TOTALS || '408.06');
const meta = { mod: 'Module 2 · How to talk to AI', id: 'm2-l4', title: 'Give it your own text to work from' };
const S = shellFor(meta);
const slides = [];
const COL = { c: ['#ede9fe', '#5b21b6', '#6d28d9'], t: ['#dbeafe', '#1e40af', '#2563eb'], f: ['#fef3c7', '#92400e', '#d97706'] };
const mark = (k, text) => `<span style="background:${COL[k][0]};color:${COL[k][1]};border-radius:10px;padding:2px 10px">${text}</span>`;
const say = t => `<span class="pill" style="font-size:34px;background:#ede9fe;color:#4c1d95">${t}</span>`;
const row = (n, i, num, html) => `<div class="card row ${on(n, i)}" style="padding:22px 36px"><span class="num">${num}</span><span>${html}</span></div>`;

// 1 title
slides.push({ start: 0, steps: [0, 6.2, 10.2], html: n => `<html><head><style>${CSS}</style></head><body>
<div class="bar"><span><b>WELILE SCHOOL OF AI</b> &nbsp;·&nbsp; AI Fundamentals</span><span>${meta.mod}</span></div>
<div class="wrap center"><div class="eyebrow">Lesson 4</div><h1 style="font-size:100px">Give it your own text<br><span class="violet">to work from</span></h1>
<p class="it ${ON(n,1)}" style="font-size:42px;margin-top:40px;color:#44403c">So far, you asked the chatbot to write things from nothing.</p>
<p class="it ${ON(n,2)}" style="font-size:44px;margin-top:20px;color:#5b21b6;font-weight:600">Now: give it your own material.</p></div></body></html>` });

// 2 market helper
slides.push({ start: 14, steps: [14, 18.4, 22.4, 25.8, 29.5, 31.3, 36.3], html: n => S(`<div class="eyebrow">Think about a market stall</div><h2 style="margin-bottom:24px">You ask a helper to sell for you</h2>
<div class="grid2"><div class="card ${on(n,2)}" style="min-height:250px"><div class="pill red">With nothing</div><div style="font-size:40px;margin-top:18px;line-height:1.3">They do not know what to do.</div></div>
<div class="card hl ${on(n,3)}" style="min-height:250px"><div class="pill green">With the stock list and prices</div><div style="font-size:40px;margin-top:18px;line-height:1.3">They can start at once.</div></div></div>
<p class="${on(n,4)}" style="font-size:42px;margin-top:28px;color:#5b21b6;font-weight:600">A chatbot is like that helper.</p>
<p class="${on(n,5)}" style="font-size:36px;margin-top:10px;color:#44403c">With your material in front of it, it does not have to guess.</p>
<p class="${on(n,6)}" style="font-size:36px;margin-top:8px;color:#57534e">It works from what you gave it, so the result is closer to what you meant.</p>`) });

// 3 three things to paste
slides.push({ start: 42, steps: [42, 45.2, 55.2, 66.2, 75.6], html: n => S(`<div class="eyebrow">What can you give it? Three common things</div>
<div class="grid3" style="margin-top:6px">
<div class="card ${on(n,1)}" style="min-height:420px"><div class="num">1</div><div class="big" style="font-size:54px;margin-top:20px">A draft</div><div style="font-size:30px;margin-top:12px;line-height:1.35;color:#44403c">Something you wrote yourself that you want improved: a paragraph, a school assignment, a short bio for your CV, a message to a customer.</div></div>
<div class="card ${on(n,2)}" style="min-height:420px"><div class="num">2</div><div class="big" style="font-size:54px;margin-top:20px">A set of notes</div><div style="font-size:30px;margin-top:12px;line-height:1.35;color:#44403c">Rough lines from a meeting, a class or a phone call. They are untidy, and you want them organised.</div></div>
<div class="card ${on(n,3)}" style="min-height:420px"><div class="num">3</div><div class="big" style="font-size:54px;margin-top:20px">A description</div><div style="font-size:30px;margin-top:12px;line-height:1.35;color:#44403c">A situation in your own words, and you ask for help with it.</div></div></div>
<div class="card hl ${on(n,4)}" style="margin-top:24px;padding:20px 36px"><div style="font-size:38px"><b>In each case, two things:</b> paste in the text, and say what to do with it.</div></div>`) });

// 4 pattern
slides.push({ start: 81, steps: [81, 83.6, 94.3, 98.6, 105.3, 108.3], html: n => S(`<div class="eyebrow">The pattern</div><h2 style="margin-bottom:22px">First the instruction. Then paste the text.</h2>
<div class="card hl ${on(n,1)}" style="font-size:38px;line-height:1.5">${mark('t','Improve this for a friendly newsletter.')} ${mark('f','Keep the meaning.')}<div style="margin-top:12px">${mark('c','[ the text you pasted goes below ]')}</div></div>
<p class="${on(n,2)}" style="font-size:36px;margin-top:22px;color:#44403c">The same three-part idea you already know:</p>
<div class="grid3" style="margin-top:16px">
<div class="card ${on(n,3)}" style="padding:20px 28px;border-color:${COL.c[2]};background:${COL.c[0]}"><div class="big" style="font-size:44px;color:${COL.c[1]}">Context</div><div style="font-size:30px;margin-top:6px">The material you paste</div></div>
<div class="card ${on(n,4)}" style="padding:20px 28px;border-color:${COL.t[2]};background:${COL.t[0]}"><div class="big" style="font-size:44px;color:${COL.t[1]}">Task</div><div style="font-size:30px;margin-top:6px">What you want done</div></div>
<div class="card ${on(n,5)}" style="padding:20px 28px;border-color:${COL.f[2]};background:${COL.f[0]}"><div class="big" style="font-size:44px;color:${COL.f[1]}">Format</div><div style="font-size:30px;margin-top:6px">How you want it to look</div></div></div>`) });

// 5 demo compare
slides.push({ start: 110, steps: [110, 124.3, 128.4, 130.3, 134.3, 136.3, 140.4], html: n => S(`<div class="eyebrow">Live demo · compare</div><h2 style="margin-bottom:22px">My three rough sentences, and the answer</h2>
<div class="card" style="padding:20px 32px;font-size:32px;line-height:1.4"><span class="muted" style="font-size:26px;display:block;margin-bottom:4px">What I pasted: “Improve this for a friendly newsletter.” plus three rough sentences about a visit to the market.</span></div>
<div class="grid2" style="margin-top:22px">
<div class="${on(n,2)}"><div class="pill green">What did it keep?</div><div class="card hl" style="margin-top:14px;min-height:240px"><div style="font-size:38px;line-height:1.5"><span class="it ${ON(n,3)}">The market · the tomatoes<br>the onions · the old teacher</span></div></div></div>
<div class="${on(n,4)}"><div class="pill amber">What did it add?</div><div class="card" style="margin-top:14px;min-height:240px"><div style="font-size:38px;line-height:1.5"><span class="it ${ON(n,5)}">A friendly opening<br>Words I did not say</span><br><span class="it ${ON(n,6)}" style="color:#991b1b">A small detail that never happened</span></div></div></div></div>`) });

// 6 read against original
slides.push({ start: 142.2, steps: [142.2, 144.6, 151.3, 154.3], html: n => S(`<div class="eyebrow">The last point matters</div><h2 style="margin-bottom:24px">Read the result against your original</h2>
<div style="display:flex;flex-direction:column;gap:18px">
<div class="card ${on(n,1)}" style="padding:22px 36px"><div style="font-size:40px;line-height:1.3">When you give the chatbot your text, <b>always compare</b> the answer with what you wrote.</div></div>
<div class="card hl ${on(n,2)}" style="padding:22px 36px"><div style="font-size:42px">✔ Did it keep <b>your meaning</b>?</div></div>
<div class="card hl ${on(n,3)}" style="padding:22px 36px"><div style="font-size:42px">✔ Did it add <b>anything untrue</b>?</div></div></div>`) });

// 7 say when you do not know
slides.push({ start: 157.2, steps: [157.2, 166.3, 171.3, 177.6, 180.6], html: n => S(`<div class="eyebrow">Another useful thing</div><h2 style="margin-bottom:24px">Ask it to say when it does not know</h2>
<div class="card ${on(n,1)}"><div style="font-size:30px;font-weight:700;color:#5b21b6;letter-spacing:.06em">WHY?</div><div style="font-size:40px;line-height:1.35;margin-top:6px" class="it ${ON(n,2)}">A chatbot will usually try to answer, even when the information is not there.</div></div>
<div class="card hl ${on(n,3)}" style="margin-top:24px"><div style="font-size:30px;color:#57534e;margin-bottom:10px">So you say:</div><div style="font-size:40px;line-height:1.5">${mark('t','Use only the text I gave you.')}<span class="it ${ON(n,4)}"> ${mark('f','If something is not in the text, write “Not stated”.')}</span></div></div>`) });

// 8 notes example
slides.push({ start: 184.3, steps: [184.3, 192.3, 200.3, 202.6, 206.3, 209.3, 211.6], html: n => S(`<div class="eyebrow">Example · a few rough notes</div><h2 style="margin-bottom:20px">See how it handles missing information</h2>
<div class="grid2" style="align-items:start">
<div class="card" style="min-height:300px"><div class="muted" style="font-size:26px;margin-bottom:8px">Notes I pasted</div><div style="font-size:34px;line-height:1.5">Supplier meeting. Prices agreed. Delivery on Friday. Follow up with Joseph.</div></div>
<div class="card hl ${on(n,1)}" style="min-height:300px"><div class="muted" style="font-size:26px;margin-bottom:8px">Its answer</div><div style="font-size:34px;line-height:1.55">Prices: agreed<br>Delivery: Friday<br>Follow-up: Joseph<br><span class="it ${ON(n,2)}">Venue: <b style="color:#166534">Not stated</b></span></div></div></div>
<p class="${on(n,3)}" style="font-size:38px;margin-top:20px;color:#5b21b6;font-weight:600">It did not invent a venue. It said “Not stated”, because I told it to.</p>
<p class="${on(n,4)}" style="font-size:34px;margin-top:8px;color:#44403c">A simple way to cut down made-up answers. <span class="${on(n,5)}" style="color:#991b1b;font-weight:700">It does not remove them.</span> <span class="${on(n,6)}">But it helps.</span></p>`) });

// 9 careful what you paste
slides.push({ start: 216.3, steps: [216.3, 221.4, 228.3, 231.6, 237.4, 241.3, 243.3, 245.5, 247.7, 250.5], html: n => S(`<div class="eyebrow">The most important part of this video</div><h1 style="font-size:84px" class="it ${ON(n,1)}">Be careful what you <span style="color:#991b1b">paste</span>.</h1>
<p class="${on(n,2)}" style="font-size:34px;margin-top:16px;color:#57534e">Free tools may use what you type to learn.</p>
<p class="${on(n,3)}" style="font-size:38px;margin-top:6px;color:#44403c">Nothing private, confidential or personal goes into a public tool.</p>
<p class="${on(n,4)}" style="font-size:32px;margin-top:6px;color:#57534e"><b>Public tool:</b> a chatbot that anyone can use.</p>
<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:20px">
<span class="pill red ${on(n,5)}" style="font-size:32px">Passwords and PINs, including mobile money</span>
<span class="pill red ${on(n,6)}" style="font-size:32px">National ID and passport numbers</span>
<span class="pill red ${on(n,7)}" style="font-size:32px">Bank account details</span>
<span class="pill red ${on(n,8)}" style="font-size:32px">Other people's private details</span>
<span class="pill red ${on(n,9)}" style="font-size:32px">Confidential work or business information</span></div>`) });

// 10 three small things
slides.push({ start: 255.3, steps: [255.3, 260.3, 269.4, 276.3, 281.4], html: n => S(`<div class="eyebrow">Before you paste anything</div><h2 style="margin-bottom:22px">Three small things</h2>
<div style="display:flex;flex-direction:column;gap:18px">
${row(n,1,1,'<b>Read it through.</b> Look for names, numbers, ID numbers, addresses and amounts that identify a person.')}
${row(n,2,2,'<b>Remove them.</b> Delete them, or replace them with something general, like “the customer”.')}
${row(n,3,3,'<b>Ask yourself:</b> if this were read out in a public place, would it matter?')}</div>
<div class="card hl ${on(n,4)}" style="margin-top:22px;padding:20px 36px"><div style="font-size:42px;font-weight:700;color:#991b1b">If the answer is yes, do not paste it.</div></div>`) });

// 11 describe the problem
slides.push({ start: 286.4, steps: [286.4, 293.3, 296.3, 301.3, 312.3], html: n => S(`<div class="eyebrow">A saying that helps</div><h1 style="font-size:84px">Describe the problem, <span class="violet">not the person.</span></h1>
<p class="${on(n,1)}" style="font-size:34px;margin-top:20px;color:#44403c">A customer sends a complaint to your shop.</p>
<div class="grid2" style="margin-top:14px">
<div class="card ${on(n,2)}" style="min-height:230px"><div class="pill red">Do not</div><div style="font-size:34px;margin-top:14px;line-height:1.35">Paste the whole message, with their <b>name</b> and <b>phone number</b>.</div></div>
<div class="card hl ${on(n,3)}" style="min-height:230px"><div class="pill green">Instead</div><div style="font-size:34px;margin-top:14px;line-height:1.35">“A customer says their delivery was two days late. Write a simple reply.”</div></div></div>
<p class="${on(n,4)}" style="font-size:36px;margin-top:20px;color:#5b21b6;font-weight:600">You can add the name yourself when you edit.</p>`) });

// 12 tenant
slides.push({ start: 314.8, steps: [314.8, 325.3, 329.3, 337.3], html: n => S(`<div class="eyebrow">Another example · a late rent message</div><h2 style="margin-bottom:24px">A message to a tenant</h2>
<div class="card ${on(n,1)}"><div class="pill red">Do not paste</div><div style="font-size:40px;margin-top:14px;line-height:1.35">The tenant's <b>name</b>, the <b>house number</b> or the <b>amount</b>.</div></div>
<div class="card hl ${on(n,2)}" style="margin-top:22px"><div class="pill green">Write instead</div><div style="font-size:38px;margin-top:14px;line-height:1.4">“A tenant is a week behind on the rent. Write a firm but kind message asking them to pay by Friday.”</div></div>
<p class="${on(n,3)}" style="font-size:40px;margin-top:22px;color:#5b21b6;font-weight:600">Then add the details yourself.</p>`) });

// 13 review
slides.push({ start: 341.3, steps: [341.3, 343.4, 347.4, 352.3, 354.6, 358.4], html: n => S(`<div class="eyebrow">Let us review</div><h2 style="margin-bottom:22px">Your own material works better</h2>
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'AI does much better when you give it <b>your own material</b>')}
${row(n,2,2,'Paste in a draft, notes or a description, and <b>say what to do</b>')}
${row(n,3,3,'Ask it to say <b>“Not stated”</b> when it does not know')}
${row(n,4,4,'<b>Remove</b> names, numbers and private details')}
${row(n,5,5,'<b>Describe the problem, not the person</b>')}</div>`) });

// 14 task
slides.push({ start: 361.3, steps: [361.3, 363.6, 370.3, 373.6, 381.3, 383.6], html: n => S(`<div class="eyebrow">Your task · pause and try</div><h2 style="margin-bottom:22px">Three rough sentences about your day</h2>
<div style="display:flex;flex-direction:column;gap:18px">
${row(n,2,1,'Write <b>three rough sentences</b> about your day. No names or private details.')}
${row(n,3,2,'Paste them and ask: ' + say('Improve this for a friendly newsletter, keeping the meaning.'))}
${row(n,4,3,'<b>Compare.</b> What did it keep? What did it add?')}</div>
<div class="${on(n,5)}" style="margin-top:26px"><span class="pill" style="font-size:34px">Pause the video now, then come back</span></div>`) });

// 15 summary + next module
slides.push({ start: 385.3, steps: [385.3, 396.3, 398.6], html: n => S(`<div class="center"><div class="eyebrow">Summary</div>
<h1 style="font-size:64px;max-width:1700px;line-height:1.2">Give the chatbot your own text, <span class="violet">tell it what to do</span>, and keep every private detail out.</h1>
<p class="it ${ON(n,1)}" style="font-size:42px;margin-top:40px;color:#44403c">That finishes <b>how to talk to AI</b>.</p>
<p class="it ${ON(n,2)}" style="font-size:38px;margin-top:18px;color:#57534e"><b>Next module:</b> what happens when AI gets it wrong, starting with why it sounds so sure even when it is wrong.</p></div>`) });

await render({ FF, CHROME: process.env.CHROME, AUDIO, OUT, TOTAL, slides, dir: process.env.FRAMES || 'frames-m2-l4' });
