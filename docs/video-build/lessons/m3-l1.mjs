import { render, shellFor, on, ON, CSS } from '../lesson-lib.mjs';
const [FF, AUDIO, OUT, TOTALS] = process.argv.slice(2);
const TOTAL = parseFloat(TOTALS || '435.25');
const meta = { mod: 'Module 3 · Make AI work for you', id: 'm3-l1', title: 'AI is your co-pilot, not your replacement' };
const S = shellFor(meta);
const slides = [];
const RED = '#991b1b', GRN = '#166534';
const row = (n, i, num, html) => `<div class="card row ${on(n, i)}" style="padding:22px 36px"><span class="num">${num}</span><span>${html}</span></div>`;
const pill = (n, i, t, c = '', fs = 38) => `<span class="pill ${c} ${on(n, i)}" style="font-size:${fs}px;padding:12px 32px">${t}</span>`;

// 1 title
slides.push({ start: 0, steps: [0, 4, 11], html: n => `<html><head><style>${CSS}</style></head><body>
<div class="bar"><span><b>WELILE SCHOOL OF AI</b> &nbsp;·&nbsp; AI Fundamentals</span><span>${meta.mod}</span></div>
<div class="wrap center"><div class="eyebrow">Module 3 · Lesson 1</div><h1 style="font-size:100px">AI is your co-pilot,<br><span class="violet">not your replacement</span></h1>
<p class="it ${ON(n,1)}" style="font-size:42px;margin-top:40px;color:#44403c">In Module 2 you learnt to ask clearly: context, task and format.</p>
<p class="it ${ON(n,2)}" style="font-size:44px;margin-top:20px;color:#5b21b6;font-weight:600">Now we put that skill to work.</p></div></body></html>` });

// 2 boda rider
slides.push({ start: 15, steps: [15, 23, 33, 40], html: n => S(`<div class="eyebrow">Picture a boda boda rider</div><h2 style="margin-bottom:24px">Who is riding?</h2>
<div class="grid2" style="gap:26px">
<div class="card ${on(n,1)}" style="min-height:330px"><div class="pill green">The rider</div><div style="font-size:36px;margin-top:16px;line-height:1.5">Holds the handlebars<br>Chooses the route<br>Watches the traffic<br>Decides when to stop</div></div>
<div class="card ${on(n,2)}" style="min-height:330px"><div class="pill amber">The map on the phone</div><div style="font-size:36px;margin-top:16px;line-height:1.5">Suggests a quicker way round a jam.</div></div></div>
<p class="${on(n,3)}" style="font-size:42px;margin-top:26px;color:#5b21b6;font-weight:600">The map helps. But the rider is still the one riding.</p>`) });

// 3 co-pilot
slides.push({ start: 47, steps: [47, 53, 58], html: n => S(`<div class="center" style="gap:16px"><div class="eyebrow">We have a word for it</div>
<h1 style="font-size:120px" class="it ${ON(n,0)}">Co-pilot</h1>
<div class="card hl ${on(n,1)}" style="margin-top:14px;padding:26px 40px"><div style="font-size:46px;line-height:1.3">AI that <b>helps</b> while <b class="violet">you stay in charge</b>.</div></div>
<p class="${on(n,2)}" style="font-size:42px;margin-top:20px;color:#44403c">Not a replacement for you. A helper <b>beside</b> you.</p></div>`) });

// 4 four things
slides.push({ start: 64, steps: [64, 70, 86, 103, 120], html: n => S(`<div class="eyebrow">What can a co-pilot do for you?</div><h2 style="margin-bottom:22px">Four things in this module</h2>
<div class="grid2" style="gap:22px">
<div class="card ${on(n,1)}" style="min-height:250px"><div class="num">1</div><div class="big" style="font-size:40px;margin-top:12px">Saves time on first drafts</div><div style="font-size:28px;margin-top:8px;color:#57534e">A draft is a first version, not the final one.</div></div>
<div class="card ${on(n,2)}" style="min-height:250px"><div class="num">2</div><div class="big" style="font-size:40px;margin-top:12px">A partner when you are stuck</div><div style="font-size:28px;margin-top:8px;color:#57534e">Ask for ideas, and keep asking.</div></div>
<div class="card ${on(n,3)}" style="min-height:250px"><div class="num">3</div><div class="big" style="font-size:40px;margin-top:12px">Organises information fast</div><div style="font-size:28px;margin-top:8px;color:#57534e">Long documents and messy notes become clear points.</div></div>
<div class="card ${on(n,4)}" style="min-height:250px"><div class="num">4</div><div class="big" style="font-size:40px;margin-top:12px">Simple tasks, no code</div><div style="font-size:28px;margin-top:8px;color:#57534e">A spreadsheet formula in plain words.</div></div></div>`) });

// 5 four jobs
slides.push({ start: 132, steps: [132, 133, 135, 138, 139.2, 140.5], html: n => S(`<div class="eyebrow">These four become our four jobs</div><h2 style="margin-bottom:26px">Each one gets its own video</h2>
<div class="grid2" style="gap:22px">
<div class="card ${on(n,1)}" style="padding:28px 36px"><div class="num">1</div><div class="big" style="font-size:52px;margin-top:10px">Brainstorm</div></div>
<div class="card ${on(n,2)}" style="padding:28px 36px"><div class="num">2</div><div class="big" style="font-size:52px;margin-top:10px">Draft</div></div>
<div class="card ${on(n,3)}" style="padding:28px 36px"><div class="num">3</div><div class="big" style="font-size:52px;margin-top:10px">Summarise</div></div>
<div class="card ${on(n,4)}" style="padding:28px 36px"><div class="num">4</div><div class="big" style="font-size:52px;margin-top:10px">Automate</div></div></div>
<p class="${on(n,5)}" style="font-size:36px;margin-top:22px;color:#44403c">In that order.</p>`) });

// 6 AI drafts you decide
slides.push({ start: 147, steps: [147, 153, 155.8, 157, 160], html: n => S(`<div class="center" style="gap:8px"><div class="eyebrow">The most important idea in the whole module</div>
<h1 style="font-size:150px;line-height:1.1" class="it ${ON(n,1)}">AI drafts.</h1>
<h1 style="font-size:150px;line-height:1.1" class="it ${ON(n,2)}"><span class="violet">You decide.</span></h1>
<p class="it ${ON(n,4)}" style="font-size:44px;margin-top:30px;color:#44403c">You stay in charge.</p></div>`) });

// 7 bakery demo
slides.push({ start: 162, steps: [162, 168, 174, 187, 196], html: n => S(`<div class="eyebrow">Let me show you what that looks like</div><h2 style="margin-bottom:20px">A bakery email</h2>
<div class="card hl ${on(n,2)}" style="padding:22px 40px"><div style="font-size:28px;font-weight:700;color:#5b21b6;letter-spacing:.06em;margin-bottom:8px">YOU TYPE</div><div style="font-size:34px;line-height:1.4">I run a small bakery in Entebbe. Write a short, friendly email to a customer confirming their cake order for Saturday, UGX 120,000, pickup at 10am. Keep it under 100 words.</div></div>
<div class="grid2" style="margin-top:20px;gap:22px">
<div class="card ${on(n,3)}" style="min-height:190px"><div class="pill green">A good result</div><div style="font-size:30px;margin-top:10px;line-height:1.4">A short, friendly email, under 100 words, that mentions <b>Saturday</b>, <b>UGX 120,000</b> and <b>10am</b>.</div></div>
<div class="card ${on(n,4)}" style="min-height:190px"><div class="pill amber">Keep beside it</div><div style="font-size:30px;margin-top:10px;line-height:1.4">The <b>real order details</b>, for example in a notes app.</div></div></div>`) });

// 8 check
slides.push({ start: 208, steps: [208, 212, 214, 216, 218, 220], html: n => S(`<div class="eyebrow">It looks good. But I do not send it yet.</div><h2 style="margin-bottom:22px">I read it slowly, and compare it with my real order</h2>
<div style="display:flex;flex-direction:column;gap:16px">
<div class="card ${on(n,3)}" style="padding:20px 36px"><div style="font-size:42px"><span style="color:${GRN};font-weight:700">✔</span> Does it say <b>Saturday</b>?</div></div>
<div class="card ${on(n,4)}" style="padding:20px 36px"><div style="font-size:42px"><span style="color:${GRN};font-weight:700">✔</span> Does it say <b>UGX 120,000</b>?</div></div>
<div class="card ${on(n,5)}" style="padding:20px 36px"><div style="font-size:42px"><span style="color:${GRN};font-weight:700">✔</span> Does it say <b>ten in the morning</b>?</div></div></div>`) });

// 9 chatbots slip
slides.push({ start: 229, steps: [229, 233, 237, 246], html: n => S(`<div class="eyebrow">Chatbots can slip</div><h2 style="margin-bottom:22px">What can go wrong</h2>
<div style="display:flex;flex-direction:column;gap:16px">
${row(n,1,1,'Sometimes a <b>detail is changed</b>')}
${row(n,2,2,'Sometimes a <b>sentence is added</b> that I never said, like a <b>promise of delivery</b> my bakery does not offer')}</div>
<div class="card hl ${on(n,3)}" style="margin-top:24px;padding:22px 36px"><div style="font-size:30px;color:#57534e">Remember Module 1: a chatbot predicts the next word.</div><div style="font-size:46px;font-weight:700;color:${RED};margin-top:6px">Sounding right is not the same as being right.</div></div>`) });

// 10 shared work
slides.push({ start: 249, steps: [249, 252, 257], html: n => S(`<div class="eyebrow">So the work is shared</div>
<div class="grid2" style="margin-top:6px;gap:26px">
<div class="card ${on(n,1)}" style="min-height:360px"><div class="pill amber">The AI</div><div class="big" style="font-size:48px;margin-top:20px;line-height:1.2">Does the quick part: the <span style="color:#92400e">first version</span>.</div></div>
<div class="card hl ${on(n,2)}" style="min-height:360px"><div class="pill green">Me</div><div class="big" style="font-size:48px;margin-top:20px;line-height:1.2">Does the part that needs a person: <span class="violet">read it, fix it, decide</span> whether it goes out.</div></div></div>`) });

// 11 three checks
slides.push({ start: 263, steps: [263, 268, 279, 284], html: n => S(`<div class="eyebrow">Before I use anything from a chatbot</div><h2 style="margin-bottom:22px">I ask three questions</h2>
<div style="display:flex;flex-direction:column;gap:16px">
<div class="card row ${on(n,1)}" style="padding:22px 36px"><span class="num">1</span><span><b>Is it true?</b><br><span style="font-size:30px;color:#57534e">Check the facts, the names and the numbers.</span></span></div>
<div class="card row ${on(n,2)}" style="padding:22px 36px"><span class="num">2</span><span><b>Is it right for my reader?</b><br><span style="font-size:30px;color:#57534e">Does the tone suit them? Does it sound like me?</span></span></div>
<div class="card row ${on(n,3)}" style="padding:22px 36px"><span class="num">3</span><span><b>Is it safe to share?</b><br><span style="font-size:30px;color:#57534e">What goes in, and what comes out.</span></span></div></div>`) });

// 12 never into chatbot
slides.push({ start: 290, steps: [290, 295, 306, 308, 310.5, 314, 319, 322.5, 328], html: n => S(`<div class="eyebrow">Remember this from day one</div><h2 style="margin-bottom:18px">What never goes into a public chatbot</h2>
<p class="${on(n,1)}" style="font-size:32px;color:#44403c">A public chatbot is one anyone can use, like the free versions of ChatGPT, Gemini or Claude.</p>
<p class="${on(n,2)}" style="font-size:36px;margin-top:8px;color:${RED};font-weight:700">These tools may use what you type.</p>
<div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:20px">
${pill(n,3,'Passwords','red',34)}${pill(n,4,'PINs, including mobile money','red',34)}${pill(n,5,'National ID and passport numbers','red',34)}${pill(n,6,'Bank and card details','red',34)}${pill(n,7,'Other people’s private details','red',34)}${pill(n,8,'Confidential work or business information','red',34)}</div>`) });

// 13 describe the problem
slides.push({ start: 332, steps: [332, 335, 337, 340, 345, 350], html: n => S(`<div class="eyebrow">Notice the bakery request</div><h2 style="margin-bottom:22px">It had none of that</h2>
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'It had <b>a day, an amount and a time</b>')}
${row(n,2,2,'<b>No</b> customer name. <b>No</b> phone number')}</div>
<div class="card hl ${on(n,3)}" style="margin-top:22px;padding:22px 36px"><div style="font-size:46px;font-weight:700">Describe the problem, <span class="violet">not the person.</span></div></div>
<p class="${on(n,4)}" style="font-size:32px;margin-top:20px;color:#57534e">We cover this properly in Module 5.</p>
<p class="${on(n,5)}" style="font-size:42px;margin-top:8px;color:${RED};font-weight:700">If you are not sure, do not paste it.</p>`) });

// 14 how videos fit
slides.push({ start: 353, steps: [353, 357, 361, 362.5, 365.5, 372, 374, 375.5], html: n => S(`<div class="eyebrow">How the next four videos fit together</div>
<div style="display:flex;gap:14px;align-items:center;margin-top:8px">
<div class="card ${on(n,1)}" style="flex:1;padding:22px 20px;text-align:center"><div class="big" style="font-size:34px">Brainstorm</div></div><span class="arrow ${on(n,2)}" style="font-size:40px">→</span>
<div class="card ${on(n,2)}" style="flex:1;padding:22px 20px;text-align:center"><div class="big" style="font-size:34px">Draft</div></div><span class="arrow ${on(n,3)}" style="font-size:40px">→</span>
<div class="card ${on(n,3)}" style="flex:1;padding:22px 20px;text-align:center"><div class="big" style="font-size:34px">Summarise</div></div><span class="arrow ${on(n,4)}" style="font-size:40px">→</span>
<div class="card ${on(n,4)}" style="flex:1;padding:22px 20px;text-align:center"><div class="big" style="font-size:34px">Automate</div></div></div>
<p class="${on(n,5)}" style="font-size:40px;margin-top:44px;color:#44403c">In every one of them, you will do three things:</p>
<div class="grid3" style="margin-top:14px">
<div class="card hl ${on(n,5)}" style="padding:24px;text-align:center"><div class="big" style="font-size:54px">Ask</div></div>
<div class="card hl ${on(n,6)}" style="padding:24px;text-align:center"><div class="big" style="font-size:54px">Check</div></div>
<div class="card hl ${on(n,7)}" style="padding:24px;text-align:center"><div class="big" style="font-size:54px">Make it your own</div></div></div>`) });

// 15 skill
slides.push({ start: 378, steps: [378, 383, 385], html: n => S(`<div class="center" style="gap:16px"><div class="eyebrow">Using AI is a skill you build</div>
<h1 style="font-size:84px;line-height:1.15" class="it ${ON(n,0)}">Like riding a boda boda.</h1>
<p class="it ${ON(n,1)}" style="font-size:44px;margin-top:20px;color:#44403c">Nobody is born able to do it.</p>
<p class="it ${ON(n,2)}" style="font-size:44px;margin-top:8px;color:#5b21b6;font-weight:600">You get better with each task you try.</p></div>`) });

// 16 handlebars
slides.push({ start: 388, steps: [388, 390.5], html: n => S(`<div class="center" style="gap:20px"><h1 style="font-size:96px;line-height:1.15" class="it ${ON(n,0)}">AI is not here to take the handlebars.</h1>
<h1 style="font-size:96px;line-height:1.15" class="it ${ON(n,1)}"><span class="violet">It is here to help you get there faster.</span></h1></div>`) });

// 17 task
slides.push({ start: 393, steps: [393, 398, 403, 408], html: n => S(`<div class="eyebrow">Your task · pause and try</div><h2 style="margin-bottom:22px">One real task from your week</h2>
<div style="display:flex;flex-direction:column;gap:18px">
${row(n,1,1,'Open your chatbot and write down <b>one real task from your week</b> that fits each job')}
<div class="${on(n,2)}" style="display:flex;gap:14px;flex-wrap:wrap;padding-left:92px"><span class="pill">Brainstorm</span><span class="pill">Draft</span><span class="pill">Summarise</span><span class="pill">Automate</span></div>
${row(n,3,2,'<b>Keep the list.</b> You will use it in the next four videos')}</div>`) });

// 18 summary
slides.push({ start: 417, steps: [417, 422, 425], html: n => S(`<div class="center"><div class="eyebrow">Summary</div>
<h1 style="font-size:78px;max-width:1700px;line-height:1.2">AI is your <span class="violet">co-pilot</span>.</h1>
<h1 style="font-size:78px;max-width:1700px;line-height:1.2;margin-top:6px" class="it ${ON(n,1)}">It drafts. You <span class="violet">read, check and decide.</span></h1>
<p class="it ${ON(n,2)}" style="font-size:38px;margin-top:44px;color:#57534e"><b>Next:</b> Job 1, beating the blank page.</p></div>`) });

await render({ FF, CHROME: process.env.CHROME, AUDIO, OUT, TOTAL, slides, dir: process.env.FRAMES || 'frames-m3-l1' });
