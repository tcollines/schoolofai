import { render, shellFor, on, ON, CSS } from '../lesson-lib.mjs';
const [FF, AUDIO, OUT, TOTALS] = process.argv.slice(2);
const TOTAL = parseFloat(TOTALS || '523.57');
const meta = { mod: 'Module 5 · Fair and private', id: 'm5-l1', title: 'How bias gets into AI' };
const S = shellFor(meta);
const slides = [];
const RED = '#991b1b', GRN = '#166534';
const row = (n, i, num, html) => `<div class="card row ${on(n, i)}" style="padding:22px 36px"><span class="num">${num}</span><span>${html}</span></div>`;
const you = (cls, txt) => `<div class="card hl ${cls}" style="padding:22px 40px"><div style="font-size:28px;font-weight:700;color:#5b21b6;letter-spacing:.06em;margin-bottom:8px">YOU TYPE</div><div style="font-size:38px;line-height:1.35">${txt}</div></div>`;
const bar = (n, i, html, extra = '') => `<div class="card hl ${on(n, i)}" style="margin-top:22px;padding:20px 36px;${extra}"><div style="font-size:42px;font-weight:700">${html}</div></div>`;
const chip = (n, i, t, c = '', fs = 36) => `<span class="pill ${c} ${on(n, i)}" style="font-size:${fs}px;padding:12px 30px">${t}</span>`;
const hdr = (eb, h) => `<div class="eyebrow">${eb}</div><h2 style="margin-bottom:20px">${h}</h2>`;
const big = (n, i, html, fs = 84) => `<h1 style="font-size:${fs}px;line-height:1.15" class="it ${ON(n, i)}">${html}</h1>`;

slides.push({ start: 0, steps: [0, 4.7, 12.8], html: n => `<html><head><style>${CSS}</style></head><body>
<div class="bar"><span><b>WELILE SCHOOL OF AI</b> &nbsp;·&nbsp; AI Fundamentals</span><span>${meta.mod}</span></div>
<div class="wrap center"><div class="eyebrow">Module 5 · Lesson 1</div><h1 style="font-size:104px">How bias gets<br><span class="violet">into AI</span></h1>
<p class="it ${ON(n,1)}" style="font-size:42px;margin-top:40px;color:#44403c">In Module 4: AI can sound completely sure and still be wrong.</p>
<p class="it ${ON(n,2)}" style="font-size:44px;margin-top:20px;color:#5b21b6;font-weight:600">A second limit: <b>bias</b>.</p></div></body></html>` });

slides.push({ start: 17.7, steps: [17.7, 26.5, 29.5, 38.5, 42.5], html: n => S(`<div class="eyebrow">First, the word</div><h1 style="font-size:120px" class="it ${ON(n,0)}">Bias</h1>
<div class="card hl ${on(n,1)}" style="margin-top:14px;padding:26px 40px"><div style="font-size:44px;line-height:1.3">An <b class="violet">unfair pattern</b> in an AI’s answers.</div>
<div style="font-size:38px;margin-top:10px;color:#44403c" class="it ${ON(n,2)}">A pattern that treats some people <b>better than others</b>, or <b>leaves some people out</b>.</div></div>
<p class="${on(n,3)}" style="font-size:38px;margin-top:26px;color:#44403c">This topic can feel heavy. It does not need to.</p>
<p class="${on(n,4)}" style="font-size:42px;margin-top:6px;color:#5b21b6;font-weight:600">Bias is something you can <b>notice</b>, and something you can <b>reduce</b>.</p>`) });

slides.push({ start: 50.3, steps: [50.3, 54.8, 58.4, 60.8, 63, 65.5, 67.8], html: n => S(`<div class="eyebrow">Where does AI get its knowledge?</div>
<h1 style="font-size:88px;line-height:1.15" class="it ${ON(n,1)}">AI learns from <span class="violet">human data.</span></h1>
<p class="${on(n,2)}" style="font-size:38px;margin-top:24px;color:#44403c">A chatbot learned from <b>what people wrote</b>:</p>
<div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:14px">${chip(n,2,'Books','',42)}${chip(n,3,'Websites','',42)}${chip(n,4,'Posts','',42)}${chip(n,5,'Records','',42)}</div>
<p class="${on(n,6)}" style="font-size:42px;margin-top:26px;color:#5b21b6;font-weight:600">Millions and millions of words. Even social media posts.</p>`) });

slides.push({ start: 75.5, steps: [75.5, 82, 85.5, 91.3, 102.3], html: n => S(`<div class="eyebrow">Here is the important part</div><h2 style="margin-bottom:22px">Human history is unequal</h2>
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'For a long time, some jobs were done <b>mostly by men</b>')}
${row(n,2,2,'Some groups had <b>more money, more schooling and more voice</b> than others')}
${row(n,3,3,'Some people <b>wrote a great deal</b>. Some were <b>written about</b>, but rarely asked')}</div>
${bar(n,4,'All of that is <span style="color:'+RED+'">sitting in the data.</span> Old patterns and old stereotypes come along with it.')}`) });

slides.push({ start: 107.9, steps: [107.9, 111.5, 113.2, 114.8], html: n => S(`<div class="center" style="gap:16px"><div class="eyebrow">So the answers can be…</div>
<h1 style="font-size:100px;line-height:1.15" class="it ${ON(n,0)}">Unfair.</h1>
<div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:14px">${chip(n,1,'Sexist','red',48)}${chip(n,2,'Racist','red',48)}${chip(n,3,'Or they simply leave some people out','red',48)}</div></div>`) });

slides.push({ start: 117.6, steps: [117.6, 122.4], html: n => S(`<div class="center" style="gap:16px"><div class="eyebrow">Notice what I am not saying</div>
<h1 style="font-size:88px;line-height:1.15" class="it ${ON(n,0)}">I am not saying AI has <span style="color:${RED}">opinions.</span></h1>
<p class="it ${ON(n,1)}" style="font-size:48px;margin-top:20px;color:#5b21b6;font-weight:600">It has none. It copies patterns it was shown.</p></div>`) });

slides.push({ start: 127, steps: [127, 132, 140, 145.1, 152, 158.7], html: n => S(`<div class="eyebrow">Think of a young tailor in Entebbe</div><h2 style="margin-bottom:20px">The apprentice</h2>
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'Learns by watching <b>one senior tailor for ten years</b>')}
${row(n,1,2,'The senior tailor only ever sewed for <b>one kind of customer</b>')}
${row(n,2,3,'The apprentice becomes <b>very good</b> at sewing for that customer')}
${row(n,3,4,'…and a little <b>clumsy with everyone else</b>')}</div>
<p class="${on(n,4)}" style="font-size:36px;margin-top:20px;color:#44403c">Nobody told the apprentice to be unfair. That is just what they saw.</p>
<p class="${on(n,5)}" style="font-size:42px;margin-top:6px;color:#5b21b6;font-weight:700">AI is like that apprentice: skilled at what it saw most.</p>`) });

slides.push({ start: 165.2, steps: [165.2, 169, 175.5, 194.1], html: n => S(`<div class="eyebrow">There is a second part to this</div>
<h1 style="font-size:80px;line-height:1.15" class="it ${ON(n,1)}">AI can <span class="violet">know less</span> about some people, places and languages.</h1>
<div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:24px">${chip(n,2,'A village','',40)}${chip(n,2,'A dialect','',40)}${chip(n,2,'A language like Luganda or Lusoga','',40)}</div>
<div class="card ${on(n,2)}" style="margin-top:20px;padding:20px 36px"><div style="font-size:36px">Very little written about it? <b>Less for the AI to learn from.</b></div></div>
<div class="card hl ${on(n,3)}" style="margin-top:16px;padding:20px 36px"><div style="font-size:38px">Its answers can be <b>thinner</b> or <b>less accurate</b>.</div></div>`) });

slides.push({ start: 211, steps: [211, 214.1, 220.9, 229], html: n => S(`<div class="eyebrow">A habit to build</div><h2 style="margin-bottom:22px">Test it on what you know</h2>
<div style="display:flex;gap:16px;flex-wrap:wrap" class="${on(n,1)}">${chip(n,1,'Your own town','',44)}${chip(n,1,'Your own school','',44)}${chip(n,1,'Your own language','',44)}</div>
<div class="card ${on(n,2)}" style="margin-top:26px;padding:22px 36px"><div style="font-size:40px">You are the expert on those, so you will <b>quickly see how well it does</b>.</div></div>
<div class="card hl ${on(n,3)}" style="margin-top:18px;padding:22px 36px"><div style="font-size:40px">If the text is important, <b>ask a fluent speaker to check it</b>.</div></div>`) });

slides.push({ start: 232.9, steps: [232.9, 236, 241.4, 249.6, 260.2], html: n => S(`<div class="eyebrow">A small example, live</div><h2 style="margin-bottom:20px">Something very simple</h2>
${you(on(n,1), 'Write two sentences about a doctor and two sentences about a nurse.')}
<div class="card ${on(n,2)}" style="margin-top:20px;padding:20px 36px"><div style="font-size:38px"><b>Results vary.</b> Sometimes a chatbot makes an assumption, and sometimes it does not.</div></div>
<div class="card ${on(n,3)}" style="margin-top:14px;padding:20px 36px"><div style="font-size:34px;color:#57534e">I cannot promise what you will see on your own phone today. That is fine.</div></div>
${bar(n,4,'The skill is not catching the AI out. <span class="violet">The skill is looking.</span>')}`) });

slides.push({ start: 264.6, steps: [264.6, 270.8, 278.9, 283.4, 289.6, 292.2, 300.8], html: n => S(`<div class="eyebrow">A real example</div><h2 style="margin-bottom:20px">The hiring tool</h2>
<div style="display:flex;flex-direction:column;gap:12px">
${row(n,1,1,'Amazon built an <b>experimental tool to rate job applicants</b>')}
${row(n,2,2,'It learned from <b>years and years of past CVs</b>')}
<div class="${on(n,3)}" style="font-size:28px;color:#57534e;padding-left:92px">A CV is the document where you list your education and work.</div>
${row(n,4,3,'Most of those CVs came from <b>men</b>')}
${row(n,5,4,'The tool began <b style="color:'+RED+'">marking down CVs that mentioned women</b>')}</div>
<p class="${on(n,6)}" style="font-size:36px;margin-top:18px;color:#44403c">Amazon <b>scrapped it</b>. <span style="color:#57534e;font-size:28px">Reported by Reuters, 2018.</span></p>`) });

slides.push({ start: 308.1, steps: [308.1, 317.4, 320.5, 324.8], html: n => S(`<div class="eyebrow">Look at the line</div>
<h1 style="font-size:76px;line-height:1.15" class="it ${ON(n,0)}">Nobody told it to be unfair.<br><span class="violet">It copied a pattern in the data.</span></h1>
<div class="grid2" style="margin-top:26px;gap:22px;align-items:center">
<div class="card ${on(n,1)}" style="padding:22px 32px"><div class="pill amber">The past data</div><div style="font-size:38px;margin-top:10px">Mostly <b>men</b>.</div></div>
<div class="card ${on(n,2)}" style="padding:22px 32px"><div class="pill red">So the pattern</div><div style="font-size:38px;margin-top:10px">Favoured <b>men</b>.</div></div></div>
<p class="${on(n,3)}" style="font-size:40px;margin-top:22px;color:${RED};font-weight:700">It did exactly what its training taught it. That was the problem.</p>`) });

slides.push({ start: 328.9, steps: [328.9, 333.7, 343.7, 350.1, 356.7], html: n => S(`<div class="eyebrow">Closer to home · <span style="color:${RED}">an illustration, not a real case</span></div><h2 style="margin-bottom:20px">A company in Kampala</h2>
<div style="display:flex;flex-direction:column;gap:12px">
${row(n,1,1,'It receives <b>500 CVs</b> for one job')}
${row(n,2,2,'A busy HR manager is tempted to <b>let a tool sort them</b>')}
${row(n,3,3,'The tool learned from the company’s <b>past hires</b>, mostly from one background')}</div>
${bar(n,4,'It may keep choosing <span style="color:'+RED+'">the same kind of person.</span> <span style="font-size:30px;font-weight:400;color:#57534e">Not because anyone wanted that. Because it is the pattern.</span>')}`) });

slides.push({ start: 366, steps: [366, 370.4, 375.2, 380.9], html: n => S(`<div class="eyebrow">Think of the person on the other side</div>
<h1 style="font-size:70px;line-height:1.2" class="it ${ON(n,0)}">A young woman from a small town, with a <span class="violet">strong CV.</span></h1>
<p class="${on(n,1)}" style="font-size:46px;margin-top:20px;color:${RED};font-weight:700">She never gets called.</p>
<p class="${on(n,2)}" style="font-size:38px;margin-top:8px;color:#44403c">She does not know why. Nobody does.</p>
${bar(n,3,'That is why we <span class="violet">keep a human involved</span> when decisions are about people.')}`) });

slides.push({ start: 384.6, steps: [384.6, 385.5, 390, 394.5, 399.7], html: n => S(`<div class="eyebrow">Let me pull the ideas together</div><h2 style="margin-bottom:20px">Why AI can be unfair</h2>
<div style="display:flex;flex-direction:column;gap:14px">
${row(n,1,1,'AI learns from <b>what people wrote</b>')}
${row(n,2,2,'Human history is unequal, so <b>the data is unequal too</b>')}
${row(n,3,3,'<b>Nobody has to tell AI to be unfair.</b> It copies the patterns in its data')}</div>
<p class="${on(n,4)}" style="font-size:36px;margin-top:20px;color:#5b21b6;font-weight:600">And it can know less about some people, places and languages. Test it on what you know.</p>`) });

slides.push({ start: 412.4, steps: [412.4, 421.2, 427, 430.5], html: n => S(`<div class="eyebrow">One more point on the hiring story</div>
<h1 style="font-size:84px;line-height:1.15" class="it ${ON(n,1)}">The tool was a <span class="violet">mirror.</span></h1>
<p class="${on(n,2)}" style="font-size:42px;margin-top:22px;color:#44403c">It showed the company a pattern that was <b>already in its own history</b>.</p>
${bar(n,3,'When we notice a pattern, <span style="color:'+GRN+'">we have a chance to change it.</span> A hopeful way to see it.')}`) });

slides.push({ start: 440, steps: [440, 440.8, 446.4], html: n => S(`<div class="center" style="gap:18px"><div class="eyebrow">None of this means be afraid</div>
<h1 style="font-size:70px;line-height:1.2" class="it ${ON(n,1)}">Read its answers the way <span class="violet">a good editor reads a draft.</span></h1>
<p class="it ${ON(n,2)}" style="font-size:52px;margin-top:24px;color:#5b21b6;font-weight:600">Who is in this picture? <span style="color:${RED}">Who is missing?</span></p></div>`) });

slides.push({ start: 460.4, steps: [460.4, 461, 465, 468.2], html: n => S(`<div class="eyebrow">Your task · pause and try</div><h2 style="margin-bottom:20px">Test it on what you know</h2>
<div style="display:flex;flex-direction:column;gap:16px">
${row(n,1,1,'Pick something you know very well: <b>your town, school or language</b>')}
${row(n,2,2,'Ask a chatbot a few questions about it')}
${row(n,3,3,'Note <b>one thing it got right</b>, and <b>one thing that felt thin, wrong or left out</b>')}</div>`) });

slides.push({ start: 484.6, steps: [484.6, 498.2, 504.4], html: n => S(`<div class="center"><div class="eyebrow">Summary</div>
<h1 style="font-size:64px;max-width:1700px;line-height:1.2">AI learns from what people wrote, so it can <span style="color:${RED}">copy old unfair patterns.</span> Nobody has to tell it to.</h1>
<p class="it ${ON(n,1)}" style="font-size:40px;margin-top:40px;color:#44403c">If it copies old things, what can we do about it?</p>
<p class="it ${ON(n,2)}" style="font-size:38px;margin-top:10px;color:#57534e"><b>Next:</b> spot bias in a real answer, and four habits that reduce it.</p></div>`) });

await render({ FF, CHROME: process.env.CHROME, AUDIO, OUT, TOTAL, slides, dir: process.env.FRAMES || 'frames-m5-l1' });
