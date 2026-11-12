import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const FF = process.argv[2], AUDIO = process.argv[3], OUT = process.argv[4];
const TOTAL = 287.0;
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
<div class="wrap">${inner}</div><div class="foot"><span>${foot}</span><span>m0-l1 · Welcome to AI Fundamentals</span></div></body></html>`;
const on = (n, i) => `it ${n > i ? 'on' : ''}`;

const slides = [];
// 1 presenter intro (rendered separately, Ken Burns)
slides.push({ intro: true, start: 0 });
// 2 title
slides.push({ start: 10, steps: [10], html: () => `<html><head><style>${CSS}</style></head><body>
<div class="bar"><span><b>WELILE SCHOOL OF AI</b></span><span>Free course</span></div>
<div class="wrap" style="display:flex;flex-direction:column;justify-content:center">
<div class="eyebrow">Welcome</div><h1>AI Fundamentals:<br>Use AI with Confidence</h1>
<p style="font-size:38px;margin-top:40px;color:#44403c;max-width:1300px;line-height:1.4">A free course from Welile School of AI, Entebbe. Sponsored by Welile Technologies, so the lessons and the certificate cost nothing.</p>
<div style="margin-top:48px;display:flex;gap:18px"><span class="pill">Free</span><span class="pill">About 6 hours</span><span class="pill">Certificate at the end</span></div></div></body></html>` });
// 3 who is this for
const who = ['Students and school leavers','Job seekers and freelancers','Small business owners and their teams','Anyone curious about AI'];
const whoT = [32.5, 35.2, 38.4, 41.3];
slides.push({ start: 30, steps: [30, ...whoT, 45.9, 60.8], html: n => shell(`<div class="eyebrow">Who is this for?</div><h2>This course is for you</h2>
<div class="grid2">${who.map((w,i)=>`<div class="card ${on(n,i)}" style="font-size:42px;font-weight:600;min-height:150px;display:flex;align-items:center">${w}</div>`).join('')}</div>
<p class="${on(n,4)}" style="font-size:44px;margin-top:56px;color:#44403c">No technical background needed. If you can send a message on your phone, you can do this course.</p>`) });
// 4 outcomes
const outs = ['Explain what AI is in one clear sentence, and how machine learning, deep learning and generative AI fit together','Tell AI that sorts things apart from AI that creates things','Ask AI clearly with context, task and format, and improve its answers','Use AI to brainstorm, draft, summarise and automate everyday work','Check what AI gives you, spot made-up facts and notice bias','Know what must never go into a public AI tool, and stay the human in charge'];
slides.push({ start: 70, steps: [70, 74.4, 83.9, 90.5, 100, 108.1, 114.7], html: n => shell(`<div class="eyebrow">By the end you will be able to</div><h2 style="margin-bottom:36px">Six things</h2>
<div style="display:flex;flex-direction:column;gap:20px">${outs.map((o,i)=>`<div class="row ${on(n,i)}"><span class="num">${i+1}</span><span style="font-size:36px">${o}</span></div>`).join('')}</div>`) });
slides.push({ start: 124.4, steps: [124.4], html: () => shell(`<div style="height:100%;display:flex;flex-direction:column;justify-content:center"><div class="eyebrow">Remember</div><h1 style="font-size:96px">You use AI well,<br>and you stay in control.</h1><p style="font-size:40px;margin-top:40px;color:#57534e">This course is not about letting a computer take over.</p></div>`) });
// 5 how it works
const steps5 = [['Short videos','About 5 minutes each, like this one'],['Try it','A few minutes of hands-on practice after most videos'],['Module quiz','Pass mark 70%. Retake as often as you like'],['Final assessment','20 questions, 80% to pass, 3 tries in 24 hours'],['Your certificate','Issued straight away, with a unique ID anyone can verify']];
slides.push({ start: 133.5, steps: [133.5, 137.4, 142.9, 153.6, 162, 172.8, 183.6], html: n => shell(`<div class="eyebrow">How the course works</div><h2 style="margin-bottom:36px">Seven short modules</h2>
<div style="display:flex;flex-direction:column;gap:18px">${steps5.map((s,i)=>`<div class="card row ${on(n,i)}" style="padding:22px 36px"><span class="num">${i+1}</span><div><div style="font-weight:700;font-size:38px">${s[0]}</div><div class="muted" style="font-size:30px">${s[1]}</div></div></div>`).join('')}</div>
<p class="${on(n,5)}" style="font-size:36px;margin-top:30px;color:#44403c">About six hours in total. Most people finish in one to two weeks. Study at your own pace.</p>`) });
// 6 tips
const tips = [['Low on data?','Turn on Data saver, or switch to Audio only'],['Written notes','Every lesson has notes you can read'],['Stuck? Ask','Use the Q&A tab under each lesson'],['Live classes','Optional, listed in the timetable, replays posted']];
slides.push({ start: 194.7, steps: [194.7, 195.7, 205.4, 207.5, 212.8], html: n => shell(`<div class="eyebrow">Two more things</div><h2>Study your way</h2>
<div class="grid2">${tips.map((s,i)=>`<div class="card ${on(n,i)}" style="min-height:220px"><div style="font-weight:700;font-size:44px;color:#5b21b6">${s[0]}</div><div style="font-size:36px;margin-top:14px;color:#292524">${s[1]}</div></div>`).join('')}</div>`) });
// 7 chatbot
const bots = ['ChatGPT','Gemini','Claude'];
slides.push({ start: 221.8, steps: [221.8, 227.3, 229.5, 231.5, 238.1], html: n => shell(`<div class="eyebrow">One last request</div><h2>Keep a chatbot open</h2>
<p style="font-size:42px;color:#44403c;max-width:1500px;line-height:1.35">A chatbot is an AI tool you type to. Keep one open on your phone while you study.</p>
<div style="display:flex;gap:28px;margin-top:56px">${bots.map((b,i)=>`<div class="card ${on(n,i)}" style="font-size:54px;font-weight:700;padding:46px 70px">${b}</div>`).join('')}</div>
<p class="${on(n,3)}" style="font-size:36px;margin-top:48px;color:#57534e">No chatbot yet? Module 2 shows you how to pick one and set it up.</p>`) });
// 8 try it
slides.push({ start: 247.4, steps: [247.4, 252.7], html: n => shell(`<div style="height:100%;display:flex;flex-direction:column;justify-content:center"><div class="eyebrow">${n>1?'Pause and try it':'Let us begin'}</div>
<h1>${n>1?'Open a chatbot and keep it open in another tab or app':'You learn AI by using it'}</h1></div>`) });
// 9 next
slides.push({ start: 270, steps: [270, 279.9], html: n => shell(`<div style="height:100%;display:flex;flex-direction:column;justify-content:center"><div class="eyebrow">${n>1?'Up next':'Recap'}</div>
<h1>${n>1?'You have been using AI for years, and you may not even know it.':'Free. Short videos, hands-on tasks and quizzes, ending with a certificate.'}</h1></div>`) });

const introHtml = `<html><head><style>${CSS}</style></head><body style="background:#f1ede6">
<img src="data:image/webp;base64,${fs.readFileSync('timothy.webp').toString('base64')}" style="position:absolute;left:0;top:0;width:1080px;height:1080px;object-fit:cover">
<div style="position:absolute;left:1080px;top:0;right:0;bottom:0;display:flex;flex-direction:column;justify-content:center;padding:0 90px;background:#faf8f5">
<div class="eyebrow">Welcome</div><h1 style="font-size:70px">Timothy Christian Waniaye</h1><p style="font-size:34px;color:#57534e;margin-top:22px;line-height:1.4">Your instructor<br>Welile School of AI</p>
<div style="margin-top:50px"><span class="pill">AI Fundamentals</span></div></div></body></html>`;

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
