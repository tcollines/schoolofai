import { render, shellFor, on, ON, CSS } from '../lesson-lib.mjs';
const [FF, AUDIO, OUT, TOTALS] = process.argv.slice(2);
const TOTAL = parseFloat(TOTALS || '617.77');
const meta = { mod: 'Module 3 · Make AI work for you', id: 'm3-l3', title: 'Job 2: Draft in seconds, finish in your own voice' };
const S = shellFor(meta);
const slides = [];
const RED = '#991b1b', GRN = '#166534';
const row = (n, i, num, html) => `<div class="card row ${on(n, i)}" style="padding:22px 36px"><span class="num">${num}</span><span>${html}</span></div>`;
const you = (cls, txt) => `<div class="card hl ${cls}" style="padding:22px 40px"><div style="font-size:28px;font-weight:700;color:#5b21b6;letter-spacing:.06em;margin-bottom:8px">YOU TYPE</div><div style="font-size:38px;line-height:1.35">${txt}</div></div>`;
const bar = (n, i, html, extra = '') => `<div class="card hl ${on(n, i)}" style="margin-top:22px;padding:20px 36px;${extra}"><div style="font-size:42px;font-weight:700">${html}</div></div>`;
const chip = (n, i, t, c = '', fs = 36) => `<span class="pill ${c} ${on(n, i)}" style="font-size:${fs}px;padding:12px 30px">${t}</span>`;
const tick = (n, i, html) => `<div class="card ${on(n, i)}" style="padding:18px 36px"><div style="font-size:40px"><span style="color:${GRN};font-weight:700">✔</span> ${html}</div></div>`;
const hdr = (eb, h) => `<div class="eyebrow">${eb}</div><h2 style="margin-bottom:20px">${h}</h2>`;

slides.push({ start: 0, steps: [0, 8.8, 14.2], html: n => `<html><head><style>${CSS}</style></head><body>
<div class="bar"><span><b>WELILE SCHOOL OF AI</b> &nbsp;·&nbsp; AI Fundamentals</span><span>${meta.mod}</span></div>
<div class="wrap center"><div class="eyebrow">Module 3 · Job 2</div><h1 style="font-size:96px">Draft in seconds,<br><span class="violet">finish in your own voice</span></h1>
<p class="it ${ON(n,1)}" style="font-size:44px;margin-top:40px;color:#44403c">A draft is a <b>first version</b>. It is not the final one.</p></div></body></html>` });

slides.push({ start: 14.2, steps: [14.2, 20.1, 26.9, 31.5, 36.9], html: n => S(`${hdr('Think of a tailor', 'The pinned version')}
<div class="grid2" style="gap:24px">
<div class="card ${on(n,0)}" style="min-height:250px"><div class="pill amber">The tailor</div><div style="font-size:34px;margin-top:14px;line-height:1.4">Cuts the cloth and <b>pins it on you</b> before the final stitching.</div><div style="font-size:30px;margin-top:10px;color:#57534e" class="it ${ON(n,1)}">It is not the finished shirt. It is there so you can see <b>what needs to change</b>.</div></div>
<div class="card ${on(n,2)}" style="min-height:250px"><div class="pill">The chatbot</div><div style="font-size:34px;margin-top:14px;line-height:1.4">Very good at the pinned version.</div><div style="font-size:30px;margin-top:10px;color:#57534e" class="it ${ON(n,3)}">The first version of an <b>email, a report or a social media post</b>, in seconds.</div></div></div>
${bar(n,4,'But <span class="violet">you</span> are the one who fits it to the customer. That is the job.')}`) });

slides.push({ start: 43.4, steps: [43.4, 49.7, 59.8], html: n => S(`${hdr('Have you noticed this?', 'Posts with the chatbot’s words still in them')}
<div class="card ${on(n,1)}" style="padding:26px 40px"><div style="font-size:38px;line-height:1.45">People post on social media with <b>leftover words from the chatbot</b> still inside the post.</div></div>
<div class="card ${on(n,2)}" style="margin-top:22px;padding:26px 40px;border-color:#dc2626;background:#fef2f2"><div style="font-size:42px;font-weight:700;color:${RED}">They posted it without reading it.</div></div>`) });

slides.push({ start: 64.2, steps: [64.2, 66.5, 72.3, 79.1], html: n => S(`${hdr('The pattern', 'AI drafts. You edit. You send.')}
<div class="grid3" style="gap:24px">
<div class="card ${on(n,1)}" style="min-height:320px"><div class="num">1</div><div class="big" style="font-size:52px;margin-top:16px">AI drafts</div><div style="font-size:32px;margin-top:12px;color:#44403c">The first version, in seconds.</div></div>
<div class="card ${on(n,2)}" style="min-height:320px"><div class="num">2</div><div class="big" style="font-size:52px;margin-top:16px">You edit</div><div style="font-size:32px;margin-top:12px;color:#44403c">The facts, the tone, and your own voice.</div></div>
<div class="card hl ${on(n,3)}" style="min-height:320px"><div class="num">3</div><div class="big" style="font-size:52px;margin-top:16px">You send</div><div style="font-size:32px;margin-top:12px;color:#44403c">Only after you have <b>read it</b>.</div></div></div>`) });

slides.push({ start: 86, steps: [86, 90.1, 91.1, 92.1, 93.1, 94.1], html: n => S(`${hdr('A useful word', 'Tone')}
<div class="card" style="padding:22px 40px"><div style="font-size:40px">Tone is <b>how a message feels</b> to the reader.</div></div>
<div style="display:flex;gap:16px;margin-top:22px;flex-wrap:wrap">${chip(n,1,'Friendly','',44)}${chip(n,2,'Formal','',44)}${chip(n,3,'Warm','',44)}${chip(n,4,'Fun','',44)}</div>
<p class="${on(n,5)}" style="font-size:42px;margin-top:28px;color:#5b21b6;font-weight:600">The right tone for your landlord is not the right tone for your best friend.</p>`) });

slides.push({ start: 98.4, steps: [98.4, 105.5], html: n => S(`${hdr('This works well for', 'Emails, reports and social media posts')}
<div class="grid3" style="gap:22px"><div class="card" style="padding:30px;text-align:center"><div class="big" style="font-size:46px">Emails</div></div><div class="card" style="padding:30px;text-align:center"><div class="big" style="font-size:46px">Reports</div></div><div class="card" style="padding:30px;text-align:center"><div class="big" style="font-size:46px">Social posts</div></div></div>
<p class="${on(n,1)}" style="font-size:38px;margin:30px 0 14px;color:#44403c">Whenever you read a draft, ask two questions:</p>
<div class="grid2" style="gap:22px"><div class="card hl ${on(n,1)}" style="padding:24px 32px"><div style="font-size:42px;font-weight:700">Is it clear?</div></div><div class="card hl ${on(n,1)}" style="padding:24px 32px"><div style="font-size:42px;font-weight:700">Does the tone suit my reader?</div></div></div>`) });

slides.push({ start: 111.2, steps: [111.2, 115.5, 121.9, 127.8, 131], html: n => S(`${hdr('A real situation', 'A quote with no reply')}
<div style="display:flex;flex-direction:column;gap:16px">
${row(n,1,1,'You sent a <b>quote to a client</b>. Five days have passed')}
${row(n,2,2,'No reply. You need to follow up, but <b>do not want to sound pushy</b>')}
${row(n,3,3,'Many people stay <b>stuck here for an hour</b>')}</div>
<p class="${on(n,4)}" style="font-size:42px;margin-top:26px;color:#5b21b6;font-weight:600">Let us see how long it takes with a chatbot.</p>`) });

slides.push({ start: 133, steps: [133, 141, 147.2, 160.4], html: n => S(`${hdr('Live demo', 'Ask for the follow-up email')}
${you(on(n,1), 'Write a polite follow-up email to a client who has not replied to my quote for five days. Keep it short and friendly.')}
<div class="card ${on(n,2)}" style="margin-top:20px;padding:20px 36px"><div class="pill green">A good result</div><div style="font-size:34px;margin-top:10px;line-height:1.4">A greeting · a polite reminder about the quote · an offer to answer questions · a closing line</div></div>
<div class="card ${on(n,3)}" style="margin-top:16px;padding:18px 36px;background:#fef3c7;border-color:#d97706"><div style="font-size:34px;color:#78350f"><b>Watch for</b> placeholders and invented details. Point them out.</div></div>`) });

slides.push({ start: 167.6, steps: [167.6, 169.5, 173, 177.7, 180.3, 182.7], html: n => S(`${hdr('Here it is. Not bad.', 'What the draft does')}
<div style="display:flex;flex-direction:column;gap:14px">
${tick(n,1,'It has a <b>greeting</b>')}${tick(n,2,'It <b>reminds</b> the client about the quote')}${tick(n,3,'It <b>offers to answer questions</b>')}${tick(n,4,'It <b>closes politely</b>')}</div>
${bar(n,5,'But I do not send it. <span style="color:'+RED+'">Now the real work starts.</span>')}`) });

slides.push({ start: 186.3, steps: [186.3, 190.5, 197.4, 203, 207.5, 212.5], html: n => S(`${hdr('First, I read it slowly', 'Is anything untrue?')}
<div class="card ${on(n,0)}" style="padding:18px 36px"><div style="font-size:36px">Is it clear? Is there anything I would <b>never say</b>?</div></div>
<div class="card ${on(n,2)}" style="margin-top:20px;padding:26px 40px;border-color:#dc2626;background:#fef2f2"><div class="muted" style="font-size:26px;margin-bottom:6px">In the draft</div><div style="font-size:44px">“<b style="color:${RED}">As we discussed on the phone…</b>”</div></div>
<p class="${on(n,3)}" style="font-size:38px;margin-top:18px;color:#44403c">Did we speak on the phone? <b>No.</b> We only sent a quote.</p>
<p class="${on(n,4)}" style="font-size:36px;margin-top:6px;color:#57534e">The chatbot made it up to make the email sound natural.</p>
<p class="${on(n,5)}" style="font-size:36px;margin-top:6px;color:${RED};font-weight:600">The client might think I am confused, or careless.</p>`) });

slides.push({ start: 224.9, steps: [224.9, 229.1, 233], html: n => S(`<div class="center" style="gap:16px"><div class="eyebrow">That is why</div>
<h1 style="font-size:100px;line-height:1.15" class="it ${ON(n,0)}">We never send <span style="color:${RED}">the first draft.</span></h1>
<p class="it ${ON(n,1)}" style="font-size:42px;margin-top:20px;color:#44403c">The chatbot has never met my client. It does not know what happened.</p>
<p class="it ${ON(n,2)}" style="font-size:42px;margin-top:8px;color:#5b21b6;font-weight:600">It fills gaps with what sounds likely.</p></div>`) });

slides.push({ start: 235.5, steps: [235.5, 243.4, 252.3, 259.3, 261.8, 264.2, 267.4], html: n => S(`${hdr('Remember Module 2: do not start again', 'Refine')}
<div style="display:flex;gap:16px;flex-wrap:wrap">${chip(n,1,'“Make it warmer.”','',38)}${chip(n,2,'“Make it shorter.”','',38)}${chip(n,3,'“Use a more formal tone.”','',38)}${chip(n,4,'“Explain that in simpler words.”','',38)}${chip(n,5,'“Give me three versions.”','',38)}</div>
<div class="grid2" style="margin-top:26px;gap:22px">
<div class="card ${on(n,1)}" style="padding:22px 32px"><div style="font-size:34px"><b>Warmer:</b> it sounds like someone who cares.</div></div>
<div class="card ${on(n,2)}" style="padding:22px 32px"><div style="font-size:34px"><b>Shorter:</b> a busy client reads a short message. Long ones wait.</div></div></div>
${bar(n,6,'Each takes a few seconds, and you are still saving time.')}`) });

slides.push({ start: 274.7, steps: [274.7, 283.7, 287.7], html: n => S(`${hdr('The last step, and the most important', 'Finish in your own voice')}
<div class="card" style="padding:22px 40px"><div style="font-size:40px">Your own voice is <b>how you really write and speak</b>.</div></div>
<div class="card ${on(n,1)}" style="margin-top:20px;padding:22px 40px"><div style="font-size:38px">If your client knows you, they will know when a message <b>does not sound like you</b>.</div></div>
<div class="card ${on(n,2)}" style="margin-top:20px;padding:22px 40px"><div style="font-size:38px">Chatbot writing can sound <b>stiff</b>, <b>too polished</b>, or full of phrases you would never use.</div></div>`) });

slides.push({ start: 293.5, steps: [293.5, 294.5, 298.8, 313.9], html: n => S(`${hdr('Edit by hand', 'Three things')}
<div style="display:flex;flex-direction:column;gap:16px">
${row(n,1,1,'<b>Add your name.</b> A message without your real name is just a template')}
<div class="card row ${on(n,2)}" style="padding:22px 36px"><span class="num">2</span><span><b>Add one personal detail</b> only you would know<br><span style="font-size:30px;color:#57534e">“I hope the rain did not disturb your week.” The name of the shop. A small detail from last time.</span></span></div>
<div class="card row ${on(n,3)}" style="padding:22px 36px"><span class="num">3</span><span><b>Fix anything untrue</b><br><span style="font-size:30px;color:#57534e">Check the dates, the amounts, the names and the promises.</span></span></div></div>`) });

slides.push({ start: 324.2, steps: [324.2, 328], html: n => S(`<div class="center" style="gap:16px"><div class="eyebrow">After the edit</div>
<h1 style="font-size:100px;line-height:1.15" class="it ${ON(n,0)}">Now it reads <span class="violet">like me.</span></h1>
<p class="it ${ON(n,1)}" style="font-size:48px;margin-top:20px;color:#44403c">And it took minutes, not an hour.</p></div>`) });

slides.push({ start: 341.3, steps: [341.3, 344.9, 350.9, 363.7, 369.5], html: n => S(`${hdr('Quick ways to find your own voice', 'Look for…')}
<div style="display:flex;flex-direction:column;gap:14px">
<div class="card row ${on(n,1)}" style="padding:20px 36px"><span class="num">1</span><span><b>Stiff phrases</b><br><span style="font-size:30px;color:#57534e">Sounds like a letter from a government office? Rewrite it in plain words.</span></span></div>
<div class="card row ${on(n,2)}" style="padding:20px 36px"><span class="num">2</span><span><b>Words you do not use</b><br><span style="font-size:30px;color:#57534e">The draft says “utilise” and you would say “use”? Change it.</span></span></div>
<div class="card row ${on(n,3)}" style="padding:20px 36px"><span class="num">3</span><span><b>What is missing</b><br><span style="font-size:30px;color:#57534e">The chatbot cannot know your client likes short messages, <span class="it ${ON(n,4)}">or that you always end with “Thank you, and have a good week.”</span></span></span></div></div>`) });

slides.push({ start: 380.5, steps: [380.5, 395.7, 401.5, 405.5, 410, 415.8], html: n => S(`${hdr('The same steps work elsewhere', 'A social post, and a report')}
<div class="grid2" style="gap:24px;align-items:start">
<div class="card" style="min-height:430px"><div class="pill amber">A bakery post</div><div style="font-size:30px;margin-top:10px;color:#57534e">A short post about Saturday cakes.</div>
<div style="font-size:34px;margin-top:16px;line-height:1.5"><div class="it ${ON(n,1)}">1 · Ask for a draft</div><div class="it ${ON(n,2)}">2 · Check <b>price, day and pickup time</b> against the real details</div><div class="it ${ON(n,3)}">3 · Add a line <b>only the baker</b> would write</div></div></div>
<div class="card" style="min-height:430px"><div class="pill">A student report</div><div style="font-size:30px;margin-top:10px;color:#57534e">&nbsp;</div>
<div style="font-size:34px;margin-top:16px;line-height:1.5"><div class="it ${ON(n,4)}">1 · Ask first for a <b>structure</b></div><div class="it ${ON(n,5)}">2 · Write the real content <b>in your own words</b></div><div class="it ${ON(n,5)}">3 · Check <b>every fact</b></div></div></div></div>`) });

slides.push({ start: 421.1, steps: [421.1, 432.6], html: n => S(`<div class="center" style="gap:20px"><div class="eyebrow">Here is a good test</div>
<h1 style="font-size:84px;line-height:1.15">Read the message aloud. <span class="violet">Would I say this to the client’s face?</span></h1>
<p class="it ${ON(n,1)}" style="font-size:44px;margin-top:20px;color:${RED};font-weight:600">If I would not, I change it, or ask the AI to rephrase it.</p></div>`) });

slides.push({ start: 440.6, steps: [440.6, 448.8, 453.3, 459.9, 467.5, 472.3, 478.3], html: n => S(`${hdr('Three things to know about drafting', '1 · Privacy')}
<div style="display:flex;flex-direction:column;gap:12px">
${row(n,1,1,'I did not give the client’s <b>name, number or the amount</b>. I wrote “a client”')}
${row(n,2,2,'I <b>add the details myself</b> when I paste the draft into my own email')}
${row(n,3,3,'Asking someone to send money? <b>No PIN, bank details or ID number</b>')}
${row(n,4,4,'Add payment details <b>yourself</b>, in your own email, <b>not in the chatbot</b>')}</div>
<p class="${on(n,5)}" style="font-size:36px;margin-top:18px;color:${RED};font-weight:600">A public chatbot may use what you type.</p>
<p class="${on(n,6)}" style="font-size:30px;margin-top:4px;color:#57534e">Module 5 covers this fully.</p>`) });

slides.push({ start: 478.3, steps: [478.3, 485.1, 491.1], html: n => S(`${hdr('Three things to know about drafting', '2 · Language')}
<div style="display:flex;flex-direction:column;gap:16px">
${row(n,0,1,'A chatbot can write in <b>Luganda</b> to a degree')}
${row(n,1,2,'But the quality is <b>uneven</b>')}
${row(n,2,3,'If the message matters, <b>ask a fluent speaker to check</b> it before you send')}</div>`) });

slides.push({ start: 500.5, steps: [500.5, 505, 509, 514.7, 519], html: n => S(`${hdr('Three things to know about drafting', '3 · The rules')}
<div class="card" style="padding:20px 36px"><div style="font-size:42px;font-weight:700">Is using AI cheating?</div></div>
<div style="display:flex;flex-direction:column;gap:12px;margin-top:16px">
${row(n,1,1,'It depends on the <b>rules at your school or workplace</b>. Follow them')}
${row(n,2,2,'If someone asks whether you used AI, <b>say so</b>')}
${row(n,3,3,'Students: check <b>what your lecturer allows</b> before you hand in anything')}</div>
${bar(n,4,'A draft is a tool for you. <span style="color:'+RED+'">Not a way to hand in work you do not understand.</span>')}`) });

slides.push({ start: 524.9, steps: [524.9, 527, 529.5, 532.5, 535.5, 538, 541], html: n => S(`${hdr('This works for other documents too', 'Same steps every time')}
<div style="display:flex;gap:14px;flex-wrap:wrap">${chip(n,1,'A short report')}${chip(n,2,'A social media caption')}${chip(n,3,'A thank-you note')}${chip(n,4,'A message to your landlord')}</div>
<p class="${on(n,5)}" style="font-size:38px;margin-top:30px;color:#44403c">In every case, the steps are the same:</p>
<div style="display:flex;gap:12px;align-items:center;margin-top:12px;flex-wrap:wrap" class="${on(n,6)}"><span class="pill" style="font-size:36px">Ask clearly</span><span class="arrow" style="font-size:36px">→</span><span class="pill" style="font-size:36px">Get a draft</span><span class="arrow" style="font-size:36px">→</span><span class="pill" style="font-size:36px">Read it</span><span class="arrow" style="font-size:36px">→</span><span class="pill" style="font-size:36px">Refine it</span><span class="arrow" style="font-size:36px">→</span><span class="pill" style="font-size:36px">Edit by hand</span><span class="arrow" style="font-size:36px">→</span><span class="pill green" style="font-size:36px">Send</span></div>`) });

slides.push({ start: 550.3, steps: [550.3, 553.5], html: n => S(`<div class="center" style="gap:12px"><h1 style="font-size:110px;line-height:1.15" class="it ${ON(n,0)}">AI drafts. You edit. <span class="violet">You send.</span></h1>
<p class="it ${ON(n,1)}" style="font-size:52px;margin-top:20px;color:#5b21b6;font-weight:600">The final touches are yours.</p></div>`) });

slides.push({ start: 558.1, steps: [558.1, 559, 565, 572.5, 580.1], html: n => S(`<div class="eyebrow">Your task · pause and try</div><h2 style="margin-bottom:20px">Draft, refine, then edit by hand</h2>
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'Type: <b>“Write a polite follow-up email to a client who has not replied to my quote for five days. Keep it short and friendly.”</b>')}
${row(n,2,2,'Ask it to <b>“Make it warmer”</b>, then <b>“Make it shorter”</b>')}
${row(n,3,3,'Edit by hand: add <b>your name</b>, <b>one personal detail</b>, and fix <b>anything untrue</b>')}</div>
<p class="${on(n,4)}" style="font-size:34px;margin-top:20px;color:#5b21b6;font-weight:600">Play with the prompts, and see how the chatbot makes your life easier.</p>`) });

slides.push({ start: 587.3, steps: [587.3, 593.7, 601.3], html: n => S(`<div class="center"><div class="eyebrow">Summary</div>
<h1 style="font-size:64px;max-width:1700px;line-height:1.2">The AI writes the <span class="violet">first version.</span></h1>
<h1 style="font-size:64px;max-width:1700px;line-height:1.2;margin-top:6px" class="it ${ON(n,1)}">You make it <span class="violet">true, clear and yours</span> before it goes out.</h1>
<p class="it ${ON(n,2)}" style="font-size:38px;margin-top:44px;color:#57534e"><b>Next:</b> Job 3, turning long and messy material into something short and clear.</p></div>`) });

await render({ FF, CHROME: process.env.CHROME, AUDIO, OUT, TOTAL, slides, dir: process.env.FRAMES || 'frames-m3-l3' });
