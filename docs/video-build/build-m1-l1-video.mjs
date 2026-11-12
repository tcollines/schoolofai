import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const FF = process.argv[2], AUDIO = process.argv[3], OUT = process.argv[4];
const TOTAL = 346.36;
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0}
body{width:1920px;height:1080px;background:#faf8f5;font-family:'DM Sans',sans-serif;color:#1c1917;position:relative;overflow:hidden}
.bar{position:absolute;left:0;right:0;top:0;height:84px;display:flex;align-items:center;justify-content:space-between;padding:0 96px;font-size:24px;color:#57534e;border-bottom:1px solid #e7e2da}
.bar b{color:#6d28d9;font-weight:700;letter-spacing:.02em}
.foot{position:absolute;left:96px;right:96px;bottom:44px;font-size:22px;color:#78716c;display:flex;justify-content:space-between}
.wrap{position:absolute;left:96px;right:96px;top:150px;bottom:110px}
h1{font-family:'Fraunces',serif;font-weight:600;font-size:84px;line-height:1.08;letter-spacing:-.01em}
h2{font-family:'Fraunces',serif;font-weight:600;font-size:68px;line-height:1.1;margin-bottom:48px}
.eyebrow{font-size:26px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#6d28d9;margin-bottom:22px}
.it{opacity:0;transform:translateY(10px);transition:none}
.it.on{opacity:1;transform:none}
.card{background:#fff;border:1.5px solid #e7e2da;border-radius:28px;padding:36px 40px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:28px}
.num{display:inline-flex;width:64px;height:64px;border-radius:32px;background:#6d28d9;color:#fff;font-weight:700;font-size:32px;align-items:center;justify-content:center;flex:none}
.row{display:flex;align-items:center;gap:28px;font-size:40px;line-height:1.25}
.muted{color:#57534e}
.pill{display:inline-block;background:#ede9fe;color:#5b21b6;border-radius:999px;padding:10px 26px;font-size:30px;font-weight:600}
`;
const shell = (inner, mod='Module 0 · Welcome', foot='Welile School of AI · Free course') => `<html><head><style>${CSS}</style></head><body>
<div class="bar"><span><b>WELILE SCHOOL OF AI</b> &nbsp;·&nbsp; AI Fundamentals</span><span>${mod}</span></div>
<div class="wrap">${inner}</div><div class="foot"><span>${foot}</span><span>m1-l1 · You already use AI</span></div></body></html>`;
const on = (n, i) => `it ${n > i ? 'on' : ''}`;

const slides = [];
const card = (t, d, show) => `<div class="card row ${show ? 'on' : ''} it" style="padding:22px 36px"><div><div style="font-weight:700;font-size:40px">${t}</div><div class="muted" style="font-size:31px">${d}</div></div></div>`;
// 1 title
slides.push({ start: 0, steps: [0, 5, 14, 19], html: n => `<html><head><style>${CSS}</style></head><body>
<div class="bar"><span><b>WELILE SCHOOL OF AI</b> &nbsp;·&nbsp; AI Fundamentals</span><span>Module 1 · What is AI?</span></div>
<div class="wrap" style="display:flex;flex-direction:column;justify-content:center">
<div class="eyebrow">Lesson 1</div><h1 style="font-size:110px">You already use AI</h1>
<p class="it ${n>0?'on':''}" style="font-size:54px;margin-top:44px;color:#44403c;font-family:Fraunces,serif">Have you used AI today?</p>
<p class="it ${n>1?'on':''}" style="font-size:40px;margin-top:26px;color:#57534e">Even if you have not opened a chatbot, the honest answer is probably yes.</p>
<div class="it ${n>2?'on':''}" style="margin-top:40px"><span class="pill">You have been using AI for years</span></div></div></body></html>` });
// 2 five places
const five = [['Your keyboard','Suggests the next word as you type'],['Video apps','Pick videos you are likely to enjoy'],['Face unlock','Decides whether it is really you'],['Maps','Guesses how long your trip will take'],['Spam filter','Moves suspicious messages out of your inbox']];
slides.push({ start: 24, steps: [24, 27, 43, 59, 74, 87, 114], html: n => shell(`<div class="eyebrow">Look through your phone</div><h2 style="margin-bottom:34px">Five places AI is already working for you</h2>
<div style="display:flex;flex-direction:column;gap:16px">${five.map((f,i)=>`<div class="card row ${on(n,i)}" style="padding:18px 36px"><span class="num">${i+1}</span><div><div style="font-weight:700;font-size:38px">${f[0]}</div><div class="muted" style="font-size:29px">${f[1]}</div></div></div>`).join('')}</div>
<p class="${on(n,5)}" style="font-size:40px;margin-top:24px;color:#5b21b6;font-weight:600">All of that is AI, and you have been using it for years.</p>`, 'Module 1 · What is AI?') });
// 3 three people
const ppl = [['A tailor in Entebbe','Her phone suggests words, her email sorts junk, Maps times the trip to her supplier'],['A boda boda rider in Kampala','Checks the road on Maps before a long trip with a passenger'],['A university student','Scrolls videos on her break, and her phone keeps offering clips she enjoys'],['A shop assistant','A "you have won money" message is already in the spam folder']];
slides.push({ start: 120, steps: [120, 123, 148, 156, 163, 172], html: n => shell(`<div class="eyebrow">Ordinary moments</div><h2 style="margin-bottom:34px">Think about a small business</h2>
<div class="grid2">${ppl.map((p,i)=>`<div class="card ${on(n,i)}" style="min-height:240px"><div style="font-weight:700;font-size:40px;color:#5b21b6">${p[0]}</div><div style="font-size:31px;margin-top:12px;color:#292524;line-height:1.35">${p[1]}</div></div>`).join('')}</div>
<p class="${on(n,4)}" style="font-size:40px;margin-top:34px;color:#44403c">Nobody had to switch it on. It was simply there, doing a small job.</p>`, 'Module 1 · What is AI?') });
// 4 why it matters
slides.push({ start: 182, steps: [182, 192], html: n => shell(`<div style="height:100%;display:flex;flex-direction:column;justify-content:center"><div class="eyebrow">Why this matters</div>
<h1>Once you see AI is already part of your day, it stops being scary.</h1>
<p class="it ${n>0?'on':''}" style="font-size:42px;margin-top:44px;color:#57534e;max-width:1500px;line-height:1.35">It is not a strange new thing from another country. It is something you already trust to get you home and keep spam out.</p></div>`, 'Module 1 · What is AI?') });
// 5 three jobs
const jobs = [['Sort','Spam or not spam. Your face or not your face.'],['Predict','The next word. The arrival time.'],['Create','Something new, such as a message or a picture.']];
slides.push({ start: 200, steps: [200, 211, 217, 221, 227], html: n => shell(`<div class="eyebrow">Most of the time, AI does one of three jobs</div><h2 style="margin-bottom:40px">Sort. Predict. Create.</h2>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:28px">${jobs.map((j,i)=>`<div class="card ${on(n,i)}" style="min-height:330px"><div style="font-family:Fraunces,serif;font-weight:600;font-size:76px;color:#6d28d9">${j[0]}</div><div style="font-size:34px;margin-top:20px;line-height:1.4">${j[1]}</div></div>`).join('')}</div>
<p class="${on(n,3)}" style="font-size:38px;margin-top:40px;color:#44403c">In this course you will see more of the third job. The first two are all around you already.</p>`, 'Module 1 · What is AI?') });
// 6 mapping
const map = [['Face unlock','Sorts','it is you, or it is not'],['Spam filter','Sorts','spam, or not spam'],['Keyboard','Predicts','the next word'],['Maps','Predicts','your arrival time'],['Video recommendations','Predicts','what you will want to watch next']];
slides.push({ start: 237, steps: [237, 240, 245, 249, 252, 255], html: n => shell(`<div class="eyebrow">Our five examples again</div><h2 style="margin-bottom:34px">Which job is each one doing?</h2>
<div style="display:flex;flex-direction:column;gap:16px">${map.map((m,i)=>`<div class="card row ${on(n,i)}" style="padding:20px 36px;justify-content:space-between"><span style="font-weight:700;font-size:40px;min-width:560px">${m[0]}</span><span class="pill" style="min-width:210px;text-align:center">${m[1]}</span><span class="muted" style="font-size:32px;flex:1;text-align:right">${m[2]}</span></div>`).join('')}</div>`, 'Module 1 · What is AI?') });
// 7 task
slides.push({ start: 261, steps: [261, 266, 273, 279, 291], html: n => shell(`<div class="eyebrow">Your task · about 3 minutes</div><h2>Look back over your day</h2>
<div style="display:flex;flex-direction:column;gap:20px">
<div class="card row ${on(n,0)}"><span class="num">1</span><span>Write down <b>three places</b> where AI showed up for you today</span></div>
<div class="card row ${on(n,2)}"><span class="num">2</span><span>Use a notebook or the notes app on your phone</span></div>
<div class="card row ${on(n,3)}"><span class="num">3</span><span>For each one, note: did it <b>sort</b>, <b>predict</b> or <b>create</b>?</span></div></div>
<p class="${on(n,3)}" style="font-size:36px;margin-top:34px;color:#57534e">No wrong answers. The point is to start noticing.</p>
<div class="${on(n,4)}" style="margin-top:26px"><span class="pill" style="font-size:36px">Pause the video now, then come back</span></div>`, 'Module 1 · What is AI?') });
// 8 welcome back
slides.push({ start: 297, steps: [297, 300, 307], html: n => shell(`<div style="height:100%;display:flex;flex-direction:column;justify-content:center"><div class="eyebrow">Welcome back</div>
<h1>Found three quickly? Try for five.</h1>
<p class="it ${n>0?'on':''}" style="font-size:42px;margin-top:40px;color:#57534e">The more you look, the more you will see.</p>
<div class="card it ${n>1?'on':''}" style="margin-top:40px;font-size:38px"><b>Try this prompt:</b> Write down three places AI showed up for you today. For each one, note whether it sorted, predicted or created something.</div></div>`, 'Module 1 · What is AI?') });
// 9 recap
slides.push({ start: 325, steps: [325, 337], html: n => shell(`<div style="height:100%;display:flex;flex-direction:column;justify-content:center"><div class="eyebrow">Recap</div>
<h1 style="font-size:70px">You have been using AI for years: your keyboard, videos, phone lock, maps and spam folder.</h1>
<p style="font-size:44px;margin-top:30px;color:#5b21b6;font-weight:600">So you are not starting from zero.</p>
<p class="it ${n>0?'on':''}" style="font-size:38px;margin-top:50px;color:#57534e"><b>Next:</b> a clear definition of AI, and three common mistakes people make about it.</p></div>`, 'Module 1 · What is AI?') });

const introHtml='';
fs.mkdirSync('frames', { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROME, headless: true });
const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const clips = [];
const shot = async (html, name) => { await pg.setContent(html, { waitUntil: 'networkidle' }); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(300); await pg.screenshot({ path: name }); };
const entries = [];
for (const s of slides) {
  if (s.intro) { entries.push({ file: 'frames/intro.png', start: 0, intro: true }); await shot(introHtml, 'frames/intro.png'); continue; }
  for (let i = 0; i < s.steps.length; i++) {
    const n = i; const f = `frames/s${s.start}_${i}.png`;
    await shot(s.html(n), f);
    entries.push({ file: f, start: s.steps[i] });
  }
}
await b.close();
entries.sort((a, c) => a.start - c.start);
let list = '';
entries.forEach((e, i) => {
  const end = i + 1 < entries.length ? entries[i + 1].start : TOTAL;
  const dur = (end - e.start).toFixed(3);
  const out = `clip${i}.mp4`;
  const vf = e.intro
    ? `scale=3840:2160,zoompan=z='1.0+0.0004*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.round(dur*25)}:s=1920x1080:fps=25,format=yuv420p`
    : `scale=1920:1080,fps=25,format=yuv420p`;
  execFileSync(FF, ['-y','-loglevel','error','-loop','1','-i',e.file,'-t',dur,'-vf',vf,'-c:v','libx264','-preset','veryfast','-crf','20',out]);
  list += `file '${out}'\n`;
});
fs.writeFileSync('list.txt', list);
execFileSync(FF, ['-y','-loglevel','error','-f','concat','-safe','0','-i','list.txt','-i',AUDIO,'-c:v','copy','-c:a','aac','-b:a','128k','-shortest','-movflags','+faststart',OUT]);
console.log('done', OUT);
