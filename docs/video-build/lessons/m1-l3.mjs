import { render, shellFor, on, ON, CSS } from '../lesson-lib.mjs';
const [FF, AUDIO, OUT, TOTALS] = process.argv.slice(2);
const TOTAL = parseFloat(TOTALS || '523.1');
const meta = { mod: 'Module 1 · What is AI?', id: 'm1-l3', title: 'Machine learning: from rules to examples' };
const S = shellFor(meta);
const slides = [];
const msg = (t, extra = '') => `<div class="card" style="padding:20px 28px;font-size:34px;line-height:1.3;${extra}">${t}</div>`;

// 1 title
slides.push({ start: 0, steps: [0, 2.2, 11.0], html: n => `<html><head><style>${CSS}</style></head><body>
<div class="bar"><span><b>WELILE SCHOOL OF AI</b> &nbsp;·&nbsp; AI Fundamentals</span><span>${meta.mod}</span></div>
<div class="wrap center"><div class="eyebrow">Lesson 3</div><h1 style="font-size:98px">Machine learning:<br>from rules to examples</h1>
<p class="it ${ON(n,1)}" style="font-size:44px;margin-top:40px;color:#44403c;font-family:Fraunces,serif">AI is a computer doing a job that normally needs human thinking.</p>
<p class="it ${ON(n,2)}" style="font-size:40px;margin-top:22px;color:#57534e">But how does a computer learn to do such a job?</p></div></body></html>` });

// 2 two ways
slides.push({ start: 18.6, steps: [18.6, 21.0, 23.5, 25.2], html: n => S(`<div class="eyebrow">Two ways to teach a computer</div><h2>An old way, and a much newer one</h2>
<div class="grid2"><div class="card ${on(n,1)} ${n>=3?'hl':''}" style="min-height:330px"><div class="pill amber">The old way</div><div class="big" style="font-size:60px;margin-top:22px;line-height:1.1">A person writes the rules</div></div>
<div class="card ${on(n,2)}" style="min-height:330px"><div class="pill green">The newer way</div><div class="big" style="font-size:60px;margin-top:22px;line-height:1.1">The computer learns from examples</div></div></div>
<p class="${on(n,3)}" style="font-size:36px;margin-top:34px;color:#57534e">Let us start with the old way.</p>`) });

// 3 old way: spam rule
slides.push({ start: 27.7, steps: [27.7, 34.8, 41.0, 48.1, 51.6], html: n => S(`<div class="eyebrow">The old way</div><h2 style="margin-bottom:26px">A person writes the rules</h2>
<p class="${on(n,1)}" style="font-size:36px;color:#44403c;margin-bottom:22px"><b>Spam:</b> unwanted messages, often trying to trick you.</p>
<p class="${on(n,2)}" style="font-size:36px;color:#44403c;margin-bottom:26px">You are building a spam filter. You must tell the computer what spam looks like.</p>
<div class="card hl ${on(n,3)}" style="padding:30px 40px"><div class="eyebrow" style="margin-bottom:12px">Your first rule</div>
<div style="font-size:46px;line-height:1.3"><b class="violet">IF</b> a message says “You have won” <b class="violet">THEN</b> it is spam.</div></div>
<p class="${on(n,4)}" style="font-size:34px;margin-top:24px;color:#57534e">Good. That will work for a while.</p>`) });

// 4 it breaks
slides.push({ start: 59.6, steps: [59.6, 62.5, 66.0, 76.5, 84.4, 92.5, 98.4], html: n => S(`<div class="eyebrow">Then the scammers change the words</div><h2 style="margin-bottom:26px">The rule works… then it doesn't</h2>
<div class="grid2">
<div><div class="eyebrow" style="font-size:22px;margin-bottom:10px">Message 1</div>${msg('“You have won a new phone! Send your details.”')}
<div class="${on(n,2)}" style="margin-top:18px"><span class="pill green" style="font-size:34px">Caught · spam folder</span></div></div>
<div class="${on(n,3)}"><div class="eyebrow" style="font-size:22px;margin-bottom:10px">Message 2</div>${msg('“Congratulations, you are selected.”')}
<div class="${on(n,5)}" style="margin-top:18px"><span class="pill red" style="font-size:34px">Missed · lands in your inbox</span></div></div></div>
<p class="${on(n,4)}" style="font-size:34px;margin-top:28px;color:#57534e">Different words, so the computer follows your rule exactly, and the rule says nothing about “selected”.</p>
<p class="${on(n,6)}" style="font-size:36px;margin-top:14px;color:#5b21b6;font-weight:600">GIGO: what you give the computer is what you get.</p>`) });

// 5 more rules
slides.push({ start: 110.6, steps: [110.6, 119.1, 122.1, 127.1, 131.5], html: n => S(`<div class="eyebrow">Rule after rule after rule</div><h2 style="margin-bottom:26px">So you write another rule</h2>
<div style="display:flex;flex-direction:column;gap:14px">
<div class="card row" style="padding:16px 32px;font-size:34px"><span class="num" style="width:52px;height:52px;font-size:26px">1</span>“You have won”</div>
<div class="card row ${on(n,0)}" style="padding:16px 32px;font-size:34px"><span class="num" style="width:52px;height:52px;font-size:26px">2</span>“Congratulations, you are selected”</div>
<div class="card row ${on(n,1)}" style="padding:16px 32px;font-size:34px"><span class="num" style="width:52px;height:52px;font-size:26px">3</span><span class="muted">…the scammers change the words again, so rule 3</span></div>
<div class="card row ${on(n,2)}" style="padding:16px 32px;font-size:34px"><span class="num" style="width:52px;height:52px;font-size:26px">4</span><span class="muted">Rule 4… rule 5…</span></div></div>
<div class="${on(n,3)}" style="margin-top:26px"><span class="pill red" style="font-size:36px">…and on to a million</span></div>
<p class="${on(n,4)}" style="font-size:38px;margin-top:18px;color:#44403c;font-weight:600">You would need a million rules.</p>`.replace('<div class="card row" style="padding:16px 32px;font-size:34px"><span class="num" style="width:52px;height:52px;font-size:26px">1</span>“You have won”</div>','<div class="card row" style="padding:16px 32px;font-size:34px"><span class="num" style="width:52px;height:52px;font-size:26px">1</span>“You have won”</div>')) });

// 6 still miss things
slides.push({ start: 137.8, steps: [137.8, 141.9, 145.4, 151.1, 157.8], html: n => S(`<div class="eyebrow">Even then</div><h1 style="font-size:78px">You would still miss things.</h1>
<p class="${on(n,1)}" style="font-size:42px;margin-top:34px;color:#44403c">Scammers are creative. There is always one more way to say something.</p>
<div class="card ${on(n,2)}" style="margin-top:34px;padding:26px 34px"><div style="font-size:36px;line-height:1.3"><b>Think of scam messages pretending to be from a mobile money service.</b> There are very many of them.</div></div>
<p class="${on(n,3)}" style="font-size:36px;margin-top:20px;color:#57534e">No person could write every rule needed to catch them.</p>
<div class="${on(n,4)}" style="margin-top:26px"><span class="pill red" style="font-size:38px">Writing rules is slow, and it breaks easily</span></div>`) });

// 7 the new way
const sp = ['“You have won!”', '“Lunch at 1?”', '“Claim your prize”', '“See you tonight”', '“Send your PIN now”'];
const lab = ['SPAM', 'NOT SPAM', 'SPAM', 'NOT SPAM', 'SPAM'];
slides.push({ start: 164.4, steps: [164.4, 169.2, 175.6, 184.7, 189.7], html: n => S(`<div class="eyebrow">The new way · machine learning</div><h2 style="margin-bottom:24px">Instead of writing rules, show examples</h2>
<div style="display:grid;grid-template-columns:1fr 110px 330px;gap:20px;align-items:center">
<div style="display:flex;flex-direction:column;gap:12px">${sp.map((t,i)=>`<div class="card ${on(n,1)}" style="padding:12px 26px;display:flex;justify-content:space-between;align-items:center;font-size:30px"><span>${t}</span><span class="pill ${lab[i]==='SPAM'?'red':'green'} ${on(n,2)}" style="font-size:24px;padding:6px 18px">${lab[i]}</span></div>`).join('')}
<div class="${on(n,1)}" style="font-size:28px;color:#57534e">…10,000 messages, each marked by a person</div></div>
<div class="arrow ${on(n,3)}">→</div>
<div class="card hl ${on(n,3)}" style="text-align:center;padding:40px 20px"><div style="font-size:90px">💻</div><div class="big" style="font-size:42px;margin-top:10px">The computer</div><div class="${on(n,4)}" style="font-size:30px;margin-top:14px;color:#5b21b6;font-weight:600">finds the pattern by itself</div></div></div>`) });

// 8 how it finds the pattern
slides.push({ start: 194.1, steps: [194.1, 198.2, 205.0, 208.2, 212.7], html: n => S(`<div class="eyebrow">What happens inside</div><h2 style="margin-bottom:26px">It looks across all 10,000 messages</h2>
<p class="${on(n,0)}" style="font-size:34px;color:#57534e;margin-bottom:24px">You never tell it that “you have won” is a warning sign, and you never hand it the words.</p>
<div class="grid2">
<div class="card ${on(n,2)}" style="min-height:230px"><div class="pill red">Spam tends to look like…</div><div style="font-size:34px;margin-top:18px;line-height:1.35">urgent prizes, requests for details, strange links</div></div>
<div class="card ${on(n,3)}" style="min-height:230px"><div class="pill green">Ordinary messages tend to look like…</div><div style="font-size:34px;margin-top:18px;line-height:1.35">plans with friends, names you know, normal chat</div></div></div>
<div class="card hl ${on(n,4)}" style="margin-top:26px;padding:22px 34px;font-size:36px"><b>A new message arrives</b> → it compares it with the patterns it found → <b class="violet">it makes a call</b></div>`) });

// 9 most important idea
slides.push({ start: 219.3, steps: [219.3, 225.3, 228.9], html: n => S(`<div class="eyebrow">The most important idea in this video</div><h2>Who finds the rules?</h2>
<div class="grid2"><div class="card ${on(n,1)}" style="min-height:320px"><div class="pill amber">The old way</div><div class="big" style="font-size:56px;margin-top:22px;line-height:1.15">A <span class="violet">person</span> writes the rules</div></div>
<div class="card hl ${on(n,2)}" style="min-height:320px"><div class="pill green">The machine learning way</div><div class="big" style="font-size:56px;margin-top:22px;line-height:1.15">The <span class="violet">computer</span> learns the patterns from examples</div></div></div>`) });

// 10 definition
slides.push({ start: 234.0, steps: [234.0, 237.1, 243.8, 247.4, 252.5], html: n => S(`<div class="eyebrow">The definition</div>
<h1 class="it ${ON(n,1)}" style="font-size:72px;max-width:1700px">Machine learning means <span class="violet">learning from examples</span> instead of following written rules.</h1>
<div class="grid2" style="margin-top:46px"><div class="card ${on(n,2)}"><div class="eyebrow" style="margin-bottom:8px">Machine</div><div style="font-size:42px">just means <b>the computer</b></div></div>
<div class="card ${on(n,3)}"><div class="eyebrow" style="margin-bottom:8px">Learning</div><div style="font-size:42px">it <b>improves</b> from what it is shown</div></div></div>
<p class="${on(n,4)}" style="font-size:40px;margin-top:34px;color:#5b21b6;font-weight:600">Machine learning is a computer learning from examples.</p>`) });

// 11 mango
slides.push({ start: 260.5, steps: [260.5, 274.3, 287.5, 300.0, 302.7, 311.9], html: n => S(`<div class="eyebrow">Think of a child</div><h2 style="margin-bottom:22px">How does a child learn what a mango is?</h2>
<div class="card ${on(n,1)}" style="padding:22px 34px;display:flex;align-items:center;gap:28px"><span style="font-size:52px;white-space:nowrap">🥭🥭🥭🥭</span><span style="font-size:34px;line-height:1.3">A seller holds one up and says <b>“mango”</b>. Big, small, green, yellow. Each time the child hears the word.</span></div>
<div class="card ${on(n,2)}" style="margin-top:18px;padding:20px 34px"><span class="pill red">Never a rule</span><span style="font-size:32px;margin-left:20px;color:#78716c;text-decoration:line-through">“A round oval fruit, with a certain skin, a stone inside, and the colour can vary…”</span></div>
<p class="${on(n,3)}" style="font-size:36px;margin-top:20px;color:#44403c">You just show many mangoes.</p>
<div class="card hl ${on(n,4)}" style="margin-top:14px;padding:20px 34px;display:flex;align-items:center;gap:24px"><span style="font-size:60px">🥭</span><span style="font-size:34px;line-height:1.3">A new mango the child has never seen… <b class="violet">“Mango!”</b></span></div>
<p class="${on(n,5)}" style="font-size:34px;margin-top:14px;color:#5b21b6;font-weight:600">The child found the pattern from the examples. That is machine learning.</p>`) });

// 12 more examples
slides.push({ start: 326.2, steps: [326.2, 331.1, 336.3, 343.0, 351.4], html: n => S(`<div class="eyebrow">One more point</div><h1 style="font-size:76px">The more examples, the better it usually gets.</h1>
<div class="grid2" style="margin-top:40px">
<div class="card ${on(n,1)}" style="min-height:250px"><div class="pill amber">Seen 3 mangoes</div><div style="font-size:36px;margin-top:18px;line-height:1.3">Unsure about a very small green one.</div></div>
<div class="card hl ${on(n,2)}" style="min-height:250px"><div class="pill green">Seen hundreds</div><div style="font-size:36px;margin-top:18px;line-height:1.3">Says “mango” without thinking.</div></div></div>
<p class="${on(n,3)}" style="font-size:36px;margin-top:30px;color:#44403c">It is the same with a spam filter: show it 10,000 messages and it does well…</p>
<p class="${on(n,4)}" style="font-size:36px;margin-top:10px;color:#5b21b6;font-weight:600">…show it many more and it does even better.</p>`) });

// 13 data is a teacher
slides.push({ start: 357.6, steps: [357.6, 362.4, 367.5], html: n => S(`<div class="eyebrow">Examples are data</div><h1 style="font-size:70px;max-width:1700px">Data means information a computer learns from.</h1>
<div style="display:flex;gap:22px;margin-top:40px" class="${on(n,1)}">${['✉️ Messages','📷 Photos','🔊 Sounds','🔢 Numbers'].map(t=>`<span class="pill" style="font-size:36px;padding:14px 32px">${t}</span>`).join('')}</div>
<div class="card hl ${on(n,2)}" style="margin-top:40px;padding:30px 40px"><div class="big" style="font-size:60px">In machine learning, <span class="violet">data is the teacher.</span></div></div>`) });

// 14 compare
slides.push({ start: 373.6, steps: [373.6, 379.2, 380.6, 387.5, 389.7, 394.2], html: n => S(`<div class="eyebrow">Side by side</div><h2 style="margin-bottom:30px">The two ways compared</h2>
<div class="grid2"><div class="card ${on(n,0)}" style="min-height:430px"><div class="pill amber">The rules way</div>
<div class="big ${on(n,1)} it" style="font-size:50px;margin-top:26px;line-height:1.15">A person writes every rule</div>
<div class="${on(n,2)} it" style="font-size:36px;margin-top:22px;line-height:1.35;color:#57534e">Slow, and it breaks easily when something new appears.</div></div>
<div class="card hl ${on(n,0)}" style="min-height:430px"><div class="pill green">The machine learning way</div>
<div class="big ${on(n,3)} it" style="font-size:50px;margin-top:26px;line-height:1.15">The computer learns a pattern from examples</div>
<div class="${on(n,5)} it" style="font-size:36px;margin-top:22px;line-height:1.35;color:#166534">When something new appears, it can often cope, because it learned a pattern and not a list.</div></div></div>`) });

// 15 always right?
slides.push({ start: 401.2, steps: [401.2, 405.2, 408.6], html: n => S(`<div class="center"><div class="eyebrow">A fair question</div><h1 style="font-size:84px">Does machine learning always get it right?</h1>
<p class="it ${ON(n,1)}" style="font-size:80px;margin-top:30px;font-family:Fraunces,serif;color:#991b1b;font-weight:600">No.</p>
<p class="it ${ON(n,2)}" style="font-size:40px;margin-top:6px;color:#44403c;max-width:1600px;line-height:1.35">It can still make mistakes. But it handles the variety of the real world far better than a million handwritten rules.</p></div>`) });

// 16 task intro
slides.push({ start: 414.9, steps: [414.9, 420.8, 424.4, 427.7, 432.1], html: n => S(`<div class="eyebrow">Now it's your turn</div><h2>Think of something you could sort into two groups</h2>
<div style="display:flex;flex-direction:column;gap:18px">
<div class="card row ${on(n,2)}" style="padding:20px 34px"><span style="font-size:52px">🥭</span><span>Ripe mangoes and unripe mangoes</span></div>
<div class="card row ${on(n,3)}" style="padding:20px 34px"><span style="font-size:52px">🍅</span><span>Good tomatoes and bad tomatoes at the market</span></div>
<div class="card row ${on(n,4)}" style="padding:20px 34px"><span style="font-size:52px">🧵</span><span>Fabric good enough to sell, and fabric that isn't</span></div></div>`) });

// 17 describe five examples
slides.push({ start: 438.6, steps: [438.6, 440.7, 447.6, 450.8, 463.9, 467.1, 471.4], html: n => S(`<div class="eyebrow">Your task · about 5 minutes</div><h2 style="margin-bottom:26px">Describe five examples of each group</h2>
<div class="grid2"><div class="card ${on(n,1)}"><div class="pill green">Ripe mango</div><div style="font-size:34px;margin-top:16px;line-height:1.5">Soft to the touch<br>Sweet smell<br>Yellow or red colour</div></div>
<div class="card ${on(n,2)}"><div class="pill red">Not ripe</div><div style="font-size:34px;margin-top:16px;line-height:1.5">Hard<br>No smell<br>Green</div></div></div>
<p class="${on(n,3)}" style="font-size:34px;margin-top:26px;color:#57534e">Write them in a notebook, in your phone, or in the notes box in the course.</p>
<div class="card hl ${on(n,4)}" style="margin-top:18px;padding:20px 34px;font-size:36px">That list is exactly what a machine learning system would be shown: <b class="violet">a tiny training set.</b></div>
<div class="${on(n,6)}" style="margin-top:20px"><span class="pill" style="font-size:36px">Pause the video now, then come back</span></div>`) });

// 18 well done
slides.push({ start: 475.8, steps: [475.8, 479.4], html: n => S(`<div class="center"><div class="eyebrow">Welcome back</div><h1 style="font-size:84px">Well done, if you did that.</h1>
<p class="it ${ON(n,1)}" style="font-size:46px;margin-top:40px;color:#5b21b6;font-weight:600">You have done the main job in machine learning: choosing good examples.</p></div>`) });

// 19 prompt
slides.push({ start: 487.2, steps: [487.2, 489.0], html: n => S(`<div class="center"><div class="eyebrow">Try this prompt</div><div class="card hl" style="padding:36px 44px"><div class="it ${ON(n,1)} big" style="font-size:50px;line-height:1.3;opacity:${n>0?1:0}">Think of something you could sort into two groups. Describe five examples of each.</div></div></div>`) });

// 20 summary
slides.push({ start: 495.3, steps: [495.3, 501.5, 505.7, 509.5, 514.8], html: n => S(`<div class="eyebrow">Summary</div><h2 style="margin-bottom:30px">Machine learning, in three lines</h2>
<div style="display:flex;flex-direction:column;gap:18px">
<div class="card row ${on(n,0)}"><span class="num">1</span><span>The computer learns the pattern <b>from examples</b></span></div>
<div class="card row ${on(n,1)}"><span class="num">2</span><span>Instead of following rules <b>a person wrote</b></span></div>
<div class="card row ${on(n,2)}"><span class="num">3</span><span><b>More examples</b> usually means better results</span></div></div>
<p class="${on(n,3)}" style="font-size:38px;margin-top:34px;color:#57534e"><b>Next:</b> deep learning, and how all these terms fit together, like <span class="${on(n,4)} violet" style="font-weight:600">circles inside circles.</span></p>`) });

await render({ FF, CHROME: process.env.CHROME, AUDIO, OUT, TOTAL, slides, dir: process.env.FRAMES || 'frames-m1-l3' });
