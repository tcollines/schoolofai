import { render, shellFor, on, ON, CSS } from '../lesson-lib.mjs';
const [FF, AUDIO, OUT, TOTALS] = process.argv.slice(2);
const TOTAL = parseFloat(TOTALS || '552.57');
const meta = { mod: 'Module 4 · When AI gets it wrong', id: 'm4-l3', title: 'How to fact-check in three steps' };
const S = shellFor(meta);
const slides = [];
const RED = '#991b1b', GRN = '#166534';
const row = (n, i, num, html) => `<div class="card row ${on(n, i)}" style="padding:22px 36px"><span class="num">${num}</span><span>${html}</span></div>`;
const pill = (n, i, t, c = '', fs = 40) => `<span class="pill ${c} ${on(n, i)}" style="font-size:${fs}px;padding:12px 32px">${t}</span>`;
const stepHead = (k, t) => `<div class="eyebrow">Step ${k} of 3</div><h2 style="margin-bottom:22px">${t}</h2>`;
const mk = t => `<span style="background:#fde68a;color:#78350f;border-radius:10px;padding:2px 12px;font-weight:700">${t}</span>`;

// 1 title
slides.push({ start: 0, steps: [0, 3.2, 5.8, 10.9], html: n => `<html><head><style>${CSS}</style></head><body>
<div class="bar"><span><b>WELILE SCHOOL OF AI</b> &nbsp;·&nbsp; AI Fundamentals</span><span>${meta.mod}</span></div>
<div class="wrap center"><div class="eyebrow">Module 4 · Lesson 3</div><h1 style="font-size:100px">How to fact-check<br><span class="violet">in three steps</span></h1>
<p class="it ${ON(n,1)}" style="font-size:42px;margin-top:40px;color:#44403c">AI can be sure and wrong.</p>
<p class="it ${ON(n,2)}" style="font-size:42px;margin-top:14px;color:#44403c">And we are responsible for what we use.</p>
<p class="it ${ON(n,3)}" style="font-size:44px;margin-top:20px;color:#5b21b6;font-weight:600">So what do you actually do about it?</p></div></body></html>` });

// 2 definition
slides.push({ start: 14.9, steps: [14.9, 18.9, 25.7, 30.4, 32.8, 36.2], html: n => S(`<div class="eyebrow">The answer is a simple habit</div><h1 style="font-size:96px" class="it ${ON(n,0)}">Fact-checking</h1>
<div class="card hl ${on(n,1)}" style="margin-top:18px;padding:26px 40px"><div style="font-size:44px;line-height:1.3">Verify a claim with a trusted source <b class="violet" style="font-size:48px">${n >= 2 ? 'outside the chatbot.' : '…'}</b></div></div>
<div class="card ${on(n,3)}" style="margin-top:22px;padding:22px 36px"><div style="font-size:38px">Asking the same chatbot <b>“Are you sure?”</b> is <b style="color:${RED}">not a check.</b></div>
<div style="font-size:36px;margin-top:10px;color:#57534e" class="it ${ON(n,4)}">It may just say, “Yes, I am sure”, in the same confident voice.</div></div>
<p class="${on(n,5)}" style="font-size:40px;margin-top:20px;color:#5b21b6;font-weight:600">You need a second source. One that is not the chatbot.</p>`) });

// 3 overview
slides.push({ start: 41.4, steps: [41.4, 44.4, 47.5], html: n => S(`<div class="eyebrow">The method</div><h2 style="margin-bottom:26px">Three steps</h2>
<div class="grid3">
<div class="card ${on(n,0)}" style="min-height:300px"><div class="num">1</div><div class="big" style="font-size:46px;margin-top:18px;line-height:1.15">Mark the claims that matter</div></div>
<div class="card ${on(n,0)}" style="min-height:300px"><div class="num">2</div><div class="big" style="font-size:46px;margin-top:18px;line-height:1.15">Check them outside the chatbot</div></div>
<div class="card ${on(n,0)}" style="min-height:300px"><div class="num">3</div><div class="big" style="font-size:46px;margin-top:18px;line-height:1.15">Ask for sources, then open them</div></div></div>
<p class="${on(n,1)}" style="font-size:38px;margin-top:30px;color:#44403c">It takes a few minutes, and with practice, less.</p>
<p class="${on(n,2)}" style="font-size:34px;margin-top:8px;color:#57534e">AI already saves you a lot of time. A few minutes to check is worth it.</p>`) });

// 4 step 1
slides.push({ start: 57, steps: [57, 61.3, 69.1, 75.6, 76.7, 77.7, 78.8, 79.7, 80.6, 81], html: n => S(`${stepHead(1, 'Mark the claims that matter')}
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'You do <b>not</b> need to check every word. You would never finish')}
${row(n,2,2,'A <b>claim</b> is a statement that says something is true')}</div>
<p class="${on(n,3)}" style="font-size:36px;margin:22px 0 12px;color:#44403c">Which claims should you mark?</p>
<div style="display:flex;gap:14px;flex-wrap:wrap">${pill(n,3,'Names')}${pill(n,4,'Numbers')}${pill(n,5,'Dates')}${pill(n,6,'Quotes')}${pill(n,7,'Sources')}${pill(n,8,'Laws')}</div>
<p class="${on(n,9)}" style="font-size:36px;margin-top:22px;color:${RED};font-weight:600">Easy to invent. Costly to get wrong.</p>`) });

// 5 example
slides.push({ start: 85.3, steps: [85.3, 91.5, 98, 101.9, 105.4, 108.5, 111, 117.5], html: n => S(`<div class="eyebrow">Example · a university assignment</div><h2 style="margin-bottom:20px">The history of mobile money in East Africa</h2>
<div class="card ${on(n,1)}" style="padding:22px 36px;font-size:34px">You ask a chatbot for the history of mobile money in East Africa.</div>
<div class="card ${on(n,2)}" style="margin-top:18px;padding:26px 36px;font-size:36px;line-height:1.9">The answer comes back as a paragraph.<br>
<span class="it ${ON(n,4)}">Mobile money started in ${mk('a year')}.</span> <span class="it ${ON(n,5)}">About ${mk('a figure')} people use it,</span> <span class="it ${ON(n,6)}">says ${mk('a named report')}.</span><br>
<span class="it ${ON(n,7)}" style="color:#57534e">The general explanation of how it works? Read it and judge with your own knowledge.</span></div>
<p class="${on(n,3)}" style="font-size:36px;margin-top:18px;color:#5b21b6;font-weight:600">I underline three things: those are my claims to check.</p>`) });

// 6 demo
slides.push({ start: 125.4, steps: [125.4, 127, 133.1, 141.3, 145.7], html: n => S(`<div class="eyebrow">Live demo · mark the claims</div><h2 style="margin-bottom:20px">Ask a chatbot, then highlight</h2>
<div class="card hl ${on(n,1)}" style="padding:24px 40px"><div style="font-size:28px;font-weight:700;color:#5b21b6;letter-spacing:.06em;margin-bottom:8px">YOU TYPE</div><div style="font-size:38px;line-height:1.35">Write a short paragraph about how mobile money has helped small traders in Uganda. Include <b>one statistic</b> and <b>one source</b>.</div></div>
<div class="card ${on(n,2)}" style="margin-top:20px;padding:22px 40px"><div style="font-size:36px;line-height:1.5">Highlight each ${mk('number')} ${mk('date')} ${mk('name')} ${mk('source')} in the answer.</div></div>
<p class="${on(n,3)}" style="font-size:38px;margin-top:20px;color:${RED};font-weight:600">I am not going to trust them yet.</p>
<p class="${on(n,4)}" style="font-size:34px;margin-top:6px;color:#44403c">Everyone will have different claims to check.</p>`) });

// 7 step 2 places
slides.push({ start: 150.8, steps: [150.8, 154.8, 157, 159.2, 161, 163.1], html: n => S(`${stepHead(2, 'Check them outside the chatbot')}
<p class="${on(n,1)}" style="font-size:38px;margin-bottom:20px;color:#44403c">Where do you check? Four places work well.</p>
<div class="grid2" style="gap:22px">
<div class="card ${on(n,2)}" style="min-height:190px"><div class="num">1</div><div class="big" style="font-size:46px;margin-top:12px">An official website</div></div>
<div class="card ${on(n,3)}" style="min-height:190px"><div class="num">2</div><div class="big" style="font-size:46px;margin-top:12px">A textbook</div></div>
<div class="card ${on(n,4)}" style="min-height:190px"><div class="num">3</div><div class="big" style="font-size:46px;margin-top:12px">A trusted news source</div></div>
<div class="card ${on(n,5)}" style="min-height:190px"><div class="num">4</div><div class="big" style="font-size:46px;margin-top:12px">An expert</div></div></div>`) });

// 8 official website
slides.push({ start: 166.3, steps: [166.3, 168.3, 172.3, 184.6, 187.5, 191.2], html: n => S(`<div class="eyebrow">Place 1 · An official website</div><h2 style="margin-bottom:20px">The website of the body that would know</h2>
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'A law → <b>the government’s own site</b>')}
<div class="card ${on(n,2)}" style="padding:16px 36px;background:#fef3c7;border-color:#d97706"><div style="font-size:30px;color:#78350f">Government sites are not always up to date. Look for organisations that publish the information online.</div></div>
${row(n,3,2,'A school rule → <b>the school or the ministry</b>')}
${row(n,4,3,'A mobile money tariff → <b>the company’s own page</b> or the agent’s printed list')}
${row(n,5,4,'A price at a shop → <b>the shop itself</b>')}</div>`) });

// 9 textbook news expert
slides.push({ start: 197.5, steps: [197.5, 200, 207.2, 216.2, 239.8, 246.7], html: n => S(`<div class="eyebrow">Places 2, 3 and 4</div>
<div class="grid3" style="margin-top:6px;gap:22px">
<div class="card ${on(n,0)}" style="min-height:470px"><div class="big" style="font-size:44px">A textbook</div><div style="font-size:30px;margin-top:14px;line-height:1.4;color:#44403c" class="it ${ON(n,1)}">Good for <b>settled facts</b>: definitions, history and science.</div></div>
<div class="card ${on(n,2)}" style="min-height:470px"><div class="big" style="font-size:44px">A trusted news source</div><div style="font-size:30px;margin-top:14px;line-height:1.4;color:#44403c">Good for <b>recent events</b>. Choose a careful one, and see whether more than one reports it.</div><div class="it ${ON(n,3)}" style="font-size:28px;margin-top:14px;padding:14px 18px;background:#ede9fe;border-radius:16px;color:#4c1d95">“The president has been voted out”? Check trusted news agencies in that country.</div></div>
<div class="card ${on(n,4)}" style="min-height:470px"><div class="big" style="font-size:44px">An expert</div><div style="font-size:30px;margin-top:14px;line-height:1.4;color:#44403c">A doctor, a pharmacist, a lawyer, a teacher, an accountant.</div><div class="it ${ON(n,5)}" style="font-size:30px;margin-top:14px;font-weight:700;color:#5b21b6">For the most serious questions, a person is the best check of all.</div></div></div>`) });

// 10 check the number
slides.push({ start: 252.8, steps: [252.8, 257.5, 261.6, 264.2, 268.4], html: n => S(`<div class="eyebrow">Live demo · check one claim</div><h2 style="margin-bottom:22px">Search for the figure on an official site</h2>
<div style="display:flex;flex-direction:column;gap:18px">
<div class="card ${on(n,1)}" style="padding:18px 36px"><div style="font-size:38px">🔍 Take the highlighted number. Search for it.</div></div>
<div class="card hl ${on(n,2)}" style="padding:20px 36px;border-color:#16a34a;box-shadow:0 0 0 4px #dcfce7"><div style="font-size:40px"><b style="color:${GRN}">Same figure, same year?</b> Good.</div></div>
<div class="card ${on(n,3)}" style="padding:20px 36px"><div style="font-size:40px"><b style="color:#92400e">A different figure?</b> Use the real one.</div></div>
<div class="card ${on(n,4)}" style="padding:20px 36px;border-color:#dc2626;background:#fef2f2"><div style="font-size:40px"><b style="color:${RED}">Nothing found?</b> Do not use the claim. You cannot justify it.</div></div></div>`) });

// 11 step 3
slides.push({ start: 275.3, steps: [275.3, 277.5, 286, 292, 301.4, 304.2, 309.4], html: n => S(`${stepHead(3, 'Ask for sources, then open them')}
<div class="card hl ${on(n,1)}" style="padding:22px 40px"><div style="font-size:28px;font-weight:700;color:#5b21b6;letter-spacing:.06em;margin-bottom:6px">YOU TYPE</div><div style="font-size:40px">Give me the source for each of these claims.</div></div>
<p class="${on(n,2)}" style="font-size:36px;margin-top:20px;color:#166534;font-weight:600">A good starting point to check.</p>
<div class="card ${on(n,3)}" style="margin-top:14px;padding:20px 36px;border-color:#dc2626;background:#fef2f2"><div style="font-size:40px"><b style="color:${RED}">The catch:</b> sources can be invented too<span class="it ${ON(n,4)}"> (remember the Golden Boda)</span>.</div></div>
<div class="card ${on(n,5)}" style="margin-top:14px;padding:20px 36px"><div style="font-size:38px"><b>So open them.</b> Click the link. Find the document.<span class="it ${ON(n,6)}"> <b class="violet">Look for the claim inside it.</b></span></div></div>`) });

// 12 rule
slides.push({ start: 316.8, steps: [316.8, 318.6, 323.3, 331.5, 335.2], html: n => S(`<div class="eyebrow">Here is the rule</div>
<h1 style="font-size:84px;line-height:1.15" class="it ${ON(n,1)}">If the link does not exist, or does not say that, <span style="color:${RED}">do not use the claim.</span></h1>
<p class="${on(n,2)}" style="margin-top:26px"><span class="pill" style="font-size:36px">Say it with me</span></p>
<div class="card ${on(n,3)}" style="margin-top:26px;padding:22px 36px"><div style="font-size:38px">That includes a link that <b>opens but says something different</b>.</div></div>
<p class="${on(n,4)}" style="font-size:40px;margin-top:20px;color:#5b21b6;font-weight:600">A real page is not enough. It has to support the claim.</p>`) });

// 13 three steps recap
slides.push({ start: 339, steps: [339, 339.6, 340.9, 342.6, 345.2], html: n => S(`<div class="eyebrow">Three steps</div><h2 style="margin-bottom:24px">The whole method</h2>
<div style="display:flex;flex-direction:column;gap:16px">
${row(n,1,1,'<b>Mark</b> the claims that matter')}
${row(n,2,2,'<b>Check</b> them outside the chatbot')}
${row(n,3,3,'Ask for <b>sources</b>, then <b>open</b> them')}</div>
<p class="${on(n,4)}" style="font-size:38px;margin-top:26px;color:#5b21b6;font-weight:600">Now: not everything needs the same effort.</p>`) });

// 14 riskier
slides.push({ start: 348.1, steps: [348.1, 353.5, 357.4, 358.3, 359.2, 360.1], html: n => S(`<div class="center" style="gap:18px"><div class="eyebrow">One more idea</div>
<h1 style="font-size:92px;line-height:1.15" class="it ${ON(n,1)}">The riskier the topic,<br><span class="violet">the more you check.</span></h1>
<p class="${on(n,2)}" style="font-size:38px;margin-top:20px;color:#44403c">Which topics are the riskiest?</p>
<div style="display:flex;gap:18px;margin-top:8px">${pill(n,2,'Health','red',46)}${pill(n,3,'Law','red',46)}${pill(n,4,'Money','red',46)}${pill(n,5,'Safety','red',46)}</div></div>`) });

// 15 examples of risk
slides.push({ start: 361.2, steps: [361.2, 362.2, 368.4, 373.8, 379.4, 383.4], html: n => S(`<div class="eyebrow">Think about it</div><h2 style="margin-bottom:20px">What if the chatbot is wrong?</h2>
<div style="display:flex;flex-direction:column;gap:12px">
<div class="card ${on(n,1)}" style="padding:16px 36px;border-color:#16a34a;background:#f0fdf4"><div style="font-size:36px"><b style="color:${GRN}">A name for your shop</b>, and the name is odd → nothing bad. Pick another.</div></div>
<div class="card ${on(n,2)}" style="padding:16px 36px;border-color:#dc2626;background:#fef2f2"><div style="font-size:36px"><b style="color:${RED}">Health:</b> the dose of a medicine for a child → could harm someone.</div></div>
<div class="card ${on(n,3)}" style="padding:16px 36px;border-color:#dc2626;background:#fef2f2"><div style="font-size:36px"><b style="color:${RED}">Law:</b> what a law says → could land you in trouble.</div></div>
<div class="card ${on(n,4)}" style="padding:16px 36px;border-color:#dc2626;background:#fef2f2"><div style="font-size:36px"><b style="color:${RED}">Money:</b> advice → could cost you your savings.</div></div>
<div class="card ${on(n,5)}" style="padding:16px 36px;border-color:#dc2626;background:#fef2f2"><div style="font-size:36px"><b style="color:${RED}">Safety:</b> an instruction → could hurt someone.</div></div></div>`) });

// 16 place to start
slides.push({ start: 389.7, steps: [389.7, 395.4, 397.4, 399.2, 403.5], html: n => S(`<div class="eyebrow">For those four topics</div><h2 style="margin-bottom:22px">A place to start, <span class="violet">not a place to finish</span></h2>
<div class="grid2" style="gap:20px">
<div class="card ${on(n,1)}" style="min-height:190px"><div class="pill red">Health</div><div style="font-size:36px;margin-top:12px">Ask a <b>doctor or a pharmacist</b>.</div></div>
<div class="card ${on(n,2)}" style="min-height:190px"><div class="pill red">Law</div><div style="font-size:36px;margin-top:12px">Read it from an <b>official source</b>.</div></div>
<div class="card ${on(n,3)}" style="min-height:190px"><div class="pill red">Money</div><div style="font-size:36px;margin-top:12px">A <b>trusted source or an expert</b>.</div></div>
<div class="card ${on(n,4)}" style="min-height:190px"><div class="pill red">Safety</div><div style="font-size:36px;margin-top:12px"><b>Do not guess</b> when safety is at stake.</div></div></div>`) });

// 17 reduce not remove
slides.push({ start: 406.2, steps: [406.2, 415, 422.8, 432.8, 443, 446.8], html: n => S(`<div class="eyebrow">A question people often ask</div><h2 style="margin-bottom:18px">Can I stop AI from hallucinating at all?</h2>
<div class="card hl ${on(n,1)}" style="padding:18px 36px"><div style="font-size:44px;font-weight:700">You can <span style="color:${GRN}">reduce</span> it. You cannot <span style="color:${RED}">remove</span> it.</div></div>
<div style="display:flex;flex-direction:column;gap:12px;margin-top:18px">
${row(n,2,1,'<b>Give it the text</b> to work from (Module 2)')}
${row(n,3,2,'Ask it to say <b>when it does not know</b>: “not stated”')}
${row(n,4,3,'Ask it for <b>sources</b>, then open them')}</div>
<p class="${on(n,5)}" style="font-size:36px;margin-top:16px;color:#5b21b6;font-weight:600">Less likely, not impossible. So the fact-check stays.</p>`) });

// 18 languages
slides.push({ start: 453.7, steps: [453.7, 461, 472.2], html: n => S(`<div class="eyebrow">A note on languages</div><h2 style="margin-bottom:22px">Luganda, Lusoga, Swahili and others</h2>
<div style="display:flex;flex-direction:column;gap:16px">
${row(n,0,1,'If you write in these languages, chatbots <b>often do worse</b>')}
${row(n,1,2,'There is <b>less data</b> in those languages')}
${row(n,2,3,'Translating or writing in your language? <b>Ask a fluent speaker</b> to check anything important')}</div>`) });

// 19 whole method
slides.push({ start: 482, steps: [482, 484, 486, 487.8, 490.9], html: n => S(`<div class="eyebrow">Let me put the whole method together</div><h2 style="margin-bottom:22px">Fact-checking, in four lines</h2>
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'<b>Mark</b> the claims that matter')}
${row(n,2,2,'<b>Check</b> them outside the chatbot')}
${row(n,3,3,'Ask for <b>sources</b>, then <b>open</b> them')}
${row(n,4,4,'Check <b>more</b> when the topic is health, law, money or safety')}</div>`) });

// 20 task
slides.push({ start: 494.8, steps: [494.8, 499, 504.5, 510.9, 516.5], html: n => S(`<div class="eyebrow">Your task · pause and try</div><h2 style="margin-bottom:22px">Fact-check one real answer</h2>
<div style="display:flex;flex-direction:column;gap:16px">
${row(n,1,1,'Ask a chatbot a factual question you can check: <b>a short paragraph with a number and a source</b>')}
${row(n,2,2,'<b>Mark the claims</b> that matter. Check at least one <b>outside the chatbot</b>')}
${row(n,3,3,'<b>Open its source.</b> Does it say what the chatbot claims?')}</div>
<div class="${on(n,4)}" style="margin-top:22px"><span class="pill" style="font-size:34px">Pause the video now, then come back</span></div>`) });

// 21 summary
slides.push({ start: 522.2, steps: [522.2, 529.8, 535.5], html: n => S(`<div class="center"><div class="eyebrow">Summary</div>
<h1 style="font-size:62px;max-width:1700px;line-height:1.2">Mark the claims that matter, <span class="violet">check them outside the chatbot</span>, and open the sources.</h1>
<h1 style="font-size:62px;max-width:1700px;line-height:1.2;margin-top:8px" class="it ${ON(n,1)}">If the link does not exist or does not say that, <span style="color:${RED}">you do not use the claim.</span></h1>
<p class="it ${ON(n,2)}" style="font-size:38px;margin-top:40px;color:#57534e"><b>Next module:</b> fairness, and how bias gets into AI in the first place.</p></div>`) });

await render({ FF, CHROME: process.env.CHROME, AUDIO, OUT, TOTAL, slides, dir: process.env.FRAMES || 'frames-m4-l3' });
