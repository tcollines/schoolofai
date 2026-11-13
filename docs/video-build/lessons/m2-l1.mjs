import { render, shellFor, on, ON, CSS } from '../lesson-lib.mjs';
const [FF, AUDIO, OUT, TOTALS] = process.argv.slice(2);
const TOTAL = parseFloat(TOTALS || '416.57');
const meta = { mod: 'Module 2 · How to talk to AI', id: 'm2-l1', title: 'Pick a tool and get set up' };
const S = shellFor(meta);
const slides = [];
const stepCard = (n, i, num, title, sub) => `<div class="card row ${on(n, i)}" style="padding:26px 36px"><span class="num">${num}</span><span><b>${title}</b>${sub ? `<span class="muted" style="font-size:30px;display:block;margin-top:4px">${sub}</span>` : ''}</span></div>`;

// 1 title
slides.push({ start: 0, steps: [0, 9, 16.5, 23], html: n => `<html><head><style>${CSS}</style></head><body>
<div class="bar"><span><b>WELILE SCHOOL OF AI</b> &nbsp;·&nbsp; AI Fundamentals</span><span>${meta.mod}</span></div>
<div class="wrap center"><div class="eyebrow">Lesson 1</div><h1 style="font-size:104px">Pick a tool and get set up</h1>
<p class="it ${ON(n,1)}" style="font-size:44px;margin-top:44px;color:#44403c;font-family:Fraunces,serif">Last module: what AI is. This module: using it.</p>
<p class="it ${ON(n,2)}" style="font-size:40px;margin-top:22px;color:#57534e">Learn to talk to AI so it gives answers you can actually use.</p>
<p class="it ${ON(n,3)}" style="font-size:40px;margin-top:22px;color:#5b21b6;font-weight:600">First, we need a tool to talk to. About ten minutes. You only do it once.</p></div></body></html>` });

// 2 pick one
slides.push({ start: 39.4, steps: [39.4, 43, 54.5, 61.6, 69.8, 77.2], html: n => S(`<div class="center"><div class="eyebrow">The most important idea</div>
<h1 style="font-size:100px" class="it ${ON(n,1)}">Pick one. <span class="violet">Learn it well.</span></h1>
<p class="${on(n,2)}" style="font-size:36px;margin-top:30px;color:#57534e"><b>Chatbot:</b> a program you type to, and it types back, like a conversation on WhatsApp.</p>
<div class="${on(n,3)}" style="display:flex;gap:22px;margin-top:34px"><span class="pill" style="font-size:40px">ChatGPT</span><span class="pill" style="font-size:40px">Gemini</span><span class="pill" style="font-size:40px">Claude</span></div>
<p class="${on(n,4)}" style="font-size:36px;margin-top:30px;color:#44403c">Any major chatbot can do the jobs in this course. The skills work in all of them.</p>
<p class="${on(n,5)}" style="font-size:38px;margin-top:14px;color:#5b21b6;font-weight:600">Do not spend weeks comparing. Try another one later.</p></div>`) });

// 3 three questions
slides.push({ start: 84.5, steps: [84.5, 93, 107.5, 121.5, 127.5], html: n => S(`<div class="eyebrow">How do you pick?</div><h2>Ask yourself three simple questions</h2>
<div style="display:flex;flex-direction:column;gap:22px">
${stepCard(n,1,1,'Does it work on my phone?','A smartphone is enough for this whole course.')}
${stepCard(n,2,2,'Can I sign in easily?','Most tools use an email address or an existing account.')}
${stepCard(n,3,3,'Does the free version do enough?','Free versions have limits. For learning, that is usually fine.')}</div>`) });

// 4 Grace
slides.push({ start: 140, steps: [140, 145.6, 152.4, 160.2, 164.9], html: n => S(`<div class="eyebrow">A real person</div><h2>Grace, a tailor in Entebbe</h2>
<div class="grid2">
<div class="card ${on(n,1)}" style="min-height:260px"><div style="font-size:30px;font-weight:700;color:#5b21b6;letter-spacing:.06em">HER JOB</div><div style="font-size:40px;margin-top:10px;line-height:1.3">Write messages to customers about finished orders.</div></div>
<div class="card ${on(n,2)}" style="min-height:260px"><div style="font-size:30px;font-weight:700;color:#5b21b6;letter-spacing:.06em">WHAT SHE HAS</div><div style="font-size:40px;margin-top:10px;line-height:1.3">A phone, a Gmail address, and not much spare data.</div></div></div>
<div class="card hl ${on(n,3)}" style="margin-top:28px"><div style="font-size:30px;font-weight:700;color:#166534;letter-spacing:.06em">HER BEST TOOL</div><div style="font-size:40px;margin-top:8px;line-height:1.3">The one she can open on her phone, sign into with that Gmail, and use without stress.</div></div>
<p class="${on(n,4)}" style="font-size:38px;margin-top:26px;color:#5b21b6;font-weight:600">That is the whole decision. You can make it the same way.</p>`) });

// 5 four steps
slides.push({ start: 170.8, steps: [170.8, 182.5, 200.5, 232, 311.5], html: n => S(`<div class="eyebrow">Now let us set it up</div><h2>Four set-up steps</h2>
<div style="display:flex;flex-direction:column;gap:20px">
${stepCard(n,1,1,'Open your chatbot and sign in','Use the sign-in method that is easiest for you.')}
${stepCard(n,2,2,'Find the box where you type','Look for “Ask anything” or “Message”.')}
${stepCard(n,3,3,'Find the settings','Many people skip this. Please do not.')}
${stepCard(n,4,4,'Say hello','Send your first message.')}</div>`) });

// 6 step 1
slides.push({ start: 187.5, steps: [187.5, 192.5], html: n => S(`<div class="eyebrow">Step 1</div><h1 style="font-size:84px">Open it and sign in.</h1>
<div class="card" style="margin-top:44px"><div style="font-size:42px;line-height:1.35">Use the sign-in method that is easiest for you.</div></div>
<div class="card hl it ${ON(n,1)}" style="margin-top:24px"><div style="font-size:40px;line-height:1.35">Asked to <b>confirm your email</b>? Do that, then come back.</div></div>`) });

// 7 step 2: the box + prompt
slides.push({ start: 202.5, steps: [202.5, 211, 214.5, 222.6], html: n => S(`<div class="eyebrow">Step 2</div><h1 style="font-size:84px">Find where you type.</h1>
<div class="${on(n,1)}" style="margin-top:36px;border:3px solid #6d28d9;border-radius:30px;padding:30px 36px;background:#fff;display:flex;justify-content:space-between;align-items:center;font-size:40px;color:#a8a29e"><span>Ask anything</span><span style="width:70px;height:70px;border-radius:35px;background:#6d28d9;color:#fff;font-size:42px;display:flex;align-items:center;justify-content:center">↑</span></div>
<div class="card hl ${on(n,2)}" style="margin-top:34px"><span class="pill" style="font-size:34px">Prompt</span><span style="font-size:42px;margin-left:24px">What you type. <b>The instruction you give the AI.</b></span></div>
<p class="${on(n,3)}" style="font-size:36px;margin-top:28px;color:#57534e">Next to the box is the <b>send button</b>. On a phone it is often an arrow. Find it now.</p>`) });

// 8 step 3: free tools may use what you type
slides.push({ start: 236.6, steps: [236.6, 240, 244, 250, 252.5, 254.2, 255.6, 258.5, 262.6], html: n => S(`<div class="eyebrow">Step 3 · Why settings matter</div><h1 style="font-size:78px" class="it ${ON(n,1)}">Free tools may use <span style="color:#991b1b">what you type</span>.</h1>
<p class="${on(n,2)}" style="font-size:36px;margin-top:22px;color:#57534e">The words you send could be kept, or used to improve the tool.</p>
<div class="card hl ${on(n,3)}" style="margin-top:28px;padding:26px 36px"><div style="font-size:40px;font-weight:700;color:#5b21b6">Keep private information out. Things like:</div>
<div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:22px"><span class="pill red ${on(n,4)}">Passwords</span><span class="pill red ${on(n,5)}">PINs</span><span class="pill red ${on(n,6)}">Mobile money details</span><span class="pill red ${on(n,7)}">ID numbers</span><span class="pill red ${on(n,8)}">Other people's personal details</span></div></div>
<p class="${on(n,8)}" style="font-size:34px;margin-top:24px;color:#57534e">We cover this properly later in the course.</p>`) });

// 9 finding settings
slides.push({ start: 270.8, steps: [270.8, 274.5, 279, 282.5, 291.8, 297.4, 304.8], html: n => S(`<div class="eyebrow">Step 3 · Find the settings</div><h2 style="margin-bottom:30px">Menus change. So look for these.</h2>
<div class="grid2">
<div class="card ${on(n,1)}"><div style="font-size:30px;font-weight:700;color:#5b21b6;letter-spacing:.06em">TAP</div><div style="font-size:40px;margin-top:8px;line-height:1.3">Your profile picture or name, or a small menu icon.</div></div>
<div class="card ${on(n,2)}"><div style="font-size:30px;font-weight:700;color:#5b21b6;letter-spacing:.06em">LOOK FOR</div><div style="font-size:40px;margin-top:8px;line-height:1.3">Settings · Privacy · Data controls · Data and privacy</div></div></div>
<div class="card ${on(n,4)}" style="margin-top:24px"><div style="font-size:38px;line-height:1.35">Read how your chats are used. Many tools let you <b>limit</b> it. Choose what suits you.</div></div>
<div class="card hl ${on(n,5)}" style="margin-top:24px"><div style="font-size:40px;line-height:1.3;color:#991b1b;font-weight:700">A setting is not permission to paste secrets.</div><div class="it ${ON(n,6)}" style="font-size:34px;margin-top:8px;color:#57534e">Even with the safest setting, keep private information out in the first place.</div></div>`) });

// 10 step 4: say hello
slides.push({ start: 311.8, steps: [311.8, 317, 326, 328.5, 330.8, 333], html: n => S(`<div class="eyebrow">Step 4</div><h1 style="font-size:84px">Say hello.</h1>
<div class="${on(n,1)}" style="margin-top:34px;border:3px solid #6d28d9;border-radius:30px;padding:30px 36px;background:#fff;font-size:44px"><span class="muted" style="font-size:28px;display:block;margin-bottom:6px">Type exactly:</span><b>Introduce yourself in two sentences.</b></div>
<div class="grid3" style="margin-top:34px">
<div class="card ${on(n,2)}"><div style="font-size:40px;font-weight:700">Friendly?</div></div>
<div class="card ${on(n,3)}"><div style="font-size:40px;font-weight:700">Short?</div></div>
<div class="card ${on(n,4)}"><div style="font-size:40px;font-weight:700">Says what it can do?</div></div></div>
<p class="${on(n,5)}" style="font-size:38px;margin-top:30px;color:#5b21b6;font-weight:600">You gave it little to work with, so the answer is general. The next video fixes that.</p>`) });

// 11 languages
slides.push({ start: 334, steps: [334, 341, 349.5, 355, 362.6], html: n => S(`<div class="eyebrow">One honest note</div><h2>Other languages</h2>
<div class="card ${on(n,1)}"><div style="font-size:40px;line-height:1.35">You can type in <b>Luganda, Lusoga, German, French</b>, or the language of your choice. Sometimes it works.</div></div>
<div class="card ${on(n,2)}" style="margin-top:24px"><div class="pill amber">But the quality is uneven</div><div style="font-size:38px;margin-top:18px;line-height:1.35">It may understand part of what you say and miss the rest.</div></div>
<div class="card hl ${on(n,3)}" style="margin-top:24px"><div style="font-size:40px;line-height:1.35">If the text matters, ask a <b>fluent speaker</b> to check it before you use it.</div><div style="font-size:30px;margin-top:8px;color:#57534e">A customer message. A notice for the community.</div></div>`) });

// 12 recap of what you have done
slides.push({ start: 369.6, steps: [369.6, 371.2, 372.6, 373.8, 375], html: n => S(`<div class="eyebrow">Where you are now</div><h2>You have…</h2>
<div style="display:flex;flex-direction:column;gap:16px">
<div class="card row ${on(n,1)}" style="padding:22px 36px">✅&nbsp; Chosen one tool</div>
<div class="card row ${on(n,2)}" style="padding:22px 36px">✅&nbsp; Signed in and found the box</div>
<div class="card row ${on(n,3)}" style="padding:22px 36px">✅&nbsp; Found the settings</div>
<div class="card row ${on(n,4)}" style="padding:22px 36px">✅&nbsp; Sent your first message</div></div>`) });

// 13 task
slides.push({ start: 376.4, steps: [376.4, 381, 387.5, 391], html: n => S(`<div class="eyebrow">Your task · pause and try</div><h2>Set up your tool</h2>
<div style="display:flex;flex-direction:column;gap:20px">
<div class="card row ${on(n,1)}"><span class="num">1</span><span>Open your chosen chatbot and <b>sign in</b></span></div>
<div class="card row ${on(n,2)}"><span class="num">2</span><span>Find the <b>settings page</b> and read how your chats are used</span></div>
<div class="card row ${on(n,3)}"><span class="num">3</span><span>Type <b>“Introduce yourself in two sentences.”</b> and notice how it answers</span></div></div>
<div style="margin-top:30px"><span class="pill" style="font-size:36px">Pause the video now, then come back</span></div>`) });

// 14 summary
slides.push({ start: 395.2, steps: [395.2, 399, 402, 405, 410.8], html: n => S(`<div class="center"><div class="eyebrow">Summary</div>
<h1 style="font-size:62px;max-width:1700px;line-height:1.2"><span class="${ON(n,0)}">Pick one tool. Sign in.</span><br><span class="it ${ON(n,1)}">Know where you type.</span><br><span class="it ${ON(n,2)}">Know where the privacy settings are.</span><br><span class="it ${ON(n,3)} violet">A setting is never permission to paste secrets.</span></h1>
<p class="it ${ON(n,4)}" style="font-size:40px;margin-top:44px;color:#57534e"><b>Next:</b> the three-part prompt that turns a weak request into a strong one.</p></div>`) });

await render({ FF, CHROME: process.env.CHROME, AUDIO, OUT, TOTAL, slides, dir: process.env.FRAMES || 'frames-m2-l1' });
