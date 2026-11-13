import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const FF = process.argv[2], OUT = process.argv[3], AUDIO = process.argv[4] || null;
// default timings match 'Registration advert' narration; last value = total seconds
const T = process.env.TIMES ? JSON.parse(process.env.TIMES) : [0, 7.9, 13.2, 19.8, 25.6, 33.1, 38.5, 41.0, 43.6, 45.7, 49.5, 57.6, 63.56];
const b64 = n => 'data:image/png;base64,' + fs.readFileSync(`${process.env.SOCIAL || 'social'}/${n}.png`).toString('base64');
const IMG = { home: b64('home'), course: b64('course'), signup: b64('signup') };
const CSS = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=DM+Sans:wght@500;700&display=swap');
*{box-sizing:border-box;margin:0}body{width:1080px;height:1920px;background:linear-gradient(180deg,#f4efff 0%,#faf8f5 45%);font-family:'DM Sans',sans-serif;position:relative;overflow:hidden;color:#1c1917}
.brand{position:absolute;top:70px;left:0;right:0;text-align:center;font-weight:700;letter-spacing:.2em;font-size:30px;color:#5b21b6}
.badge{position:absolute;top:130px;left:0;right:0;text-align:center}
.badge span{display:inline-block;background:#6d28d9;color:#fff;font-weight:700;font-size:38px;letter-spacing:.1em;padding:12px 34px;border-radius:999px}
.phone{position:absolute;left:230px;top:215px;width:620px;height:1342px;border-radius:56px;border:14px solid #1c1917;background:#fff;overflow:hidden;box-shadow:0 40px 90px rgba(76,29,149,.28)}
.phone img{width:100%;height:100%;display:block;object-fit:cover;object-position:top}
.ring{position:absolute;border:7px solid #f59e0b;border-radius:26px;box-shadow:0 0 0 9999px rgba(20,10,40,.0),0 0 0 8px rgba(245,158,11,.25)}
.url{position:absolute;top:1130px;left:90px;right:90px;text-align:center}
.url span{display:inline-block;background:#1c1917;color:#fff;font-weight:700;font-size:46px;padding:20px 40px;border-radius:24px}
.cap{position:absolute;left:60px;right:60px;bottom:90px;min-height:250px;background:#fff;border:3px solid #e9e3f7;border-radius:44px;padding:42px 46px;text-align:center;font-family:'Fraunces',serif;font-weight:700;font-size:62px;line-height:1.15;box-shadow:0 20px 50px rgba(76,29,149,.14);display:flex;align-items:center;justify-content:center}
.cap small{display:block;font-family:'DM Sans';font-weight:500;font-size:36px;color:#57534e;margin-top:14px}
.cta{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:0 80px}
`;
const ring = (x1, y1, x2, y2) => `<div class="ring" style="left:${x1}%;top:${y1}%;width:${x2 - x1}%;height:${y2 - y1}%"></div>`;
const page = ({ img, rings = '', step = '', cap, sub = '', url = '' }) => `<html><head><style>${CSS}</style></head><body>
<div class="brand">WELILE SCHOOL OF AI</div>${step ? `<div class="badge"><span>${step}</span></div>` : ''}
<div class="phone"><img src="${IMG[img]}">${rings}</div>${url ? `<div class="url"><span>${url}</span></div>` : ''}
<div class="cap"><div>${cap}${sub ? `<small>${sub}</small>` : ''}</div></div></body></html>`;
const hook = (big, small, emoji = '') => `<html><head><style>${CSS}</style></head><body><div class="brand">WELILE SCHOOL OF AI</div><div class="cta">
 ${emoji ? `<div style="font-size:150px;margin-bottom:50px">${emoji}</div>` : ''}
 <div style="font-family:Fraunces,serif;font-weight:700;font-size:104px;line-height:1.08">${big}</div>
 ${small ? `<div style="margin-top:44px;font-size:52px;line-height:1.3;color:#57534e">${small}</div>` : ''}</div></body></html>`;
const frames = [
  hook('You keep hearing about AI.', 'On the radio. On TV. All the time.', '📻 📺'),
  hook('Friends say it can do <span style="color:#6d28d9">everything</span>.', '', '💬'),
  hook('But what could it actually do <span style="color:#6d28d9">for you</span>?', '', '🤔'),
  hook('Find out at Welile School of AI', 'AI Fundamentals · a free course', '🎓'),
  hook('A simple course that introduces you to AI.', 'In plain language. On any phone.', '📱'),
  page({ img: 'home', step: 'STEP 1', cap: 'Go to the website', sub: 'welileschoolofai.org' }),
  page({ img: 'home', step: 'STEP 2', rings: ring(3, 48, 97, 55), cap: 'Tap “Study AI for free”' }),
  page({ img: 'course', step: 'STEP 2', rings: ring(3, 62.5, 97, 69), cap: 'Then tap “Start studying”' }),
  page({ img: 'signup', step: 'STEP 3', rings: ring(10, 40, 90, 67), cap: 'Create your account', sub: 'Quick and easy' }),
  page({ img: 'signup', step: 'STEP 3', rings: ring(58, 82.5, 90, 87.5), cap: 'Fill in your details', sub: 'or continue with Google' }),
  page({ img: 'course', step: 'STEP 4', rings: ring(3, 44.8, 97, 60), cap: 'Watch your welcome video', sub: 'A few minutes. You will see how it all works.' }),
  `<html><head><style>${CSS}</style></head><body><div class="brand">WELILE SCHOOL OF AI</div><div class="cta">
   <div style="font-family:Fraunces,serif;font-weight:700;font-size:96px;line-height:1.05">Lessons begin Monday 16th November</div>
   <div style="margin-top:40px;background:#1c1917;color:#fff;font-weight:700;font-size:56px;padding:26px 50px;border-radius:30px">welileschoolofai.org</div>
   <div style="margin-top:60px;background:#fff;border:3px solid #e9e3f7;border-radius:40px;padding:44px 50px;font-size:50px;line-height:1.3;width:100%">
     <b style="color:#5b21b6">Live classes</b><br>Monday, Wednesday and Friday<br><b>2:00 pm</b> (East Africa Time)<br><span style="font-size:40px;color:#57534e">or learn at your own pace</span></div>
   <div style="margin-top:50px;font-size:44px;color:#57534e">Register free today. Let's learn together.</div></div></body></html>`
];
fs.mkdirSync('sframes', { recursive: true });
const br = await chromium.launch({ executablePath: process.env.CHROME, headless: true });
const pg = await br.newPage({ viewport: { width: 1080, height: 1920 } });
for (let i = 0; i < frames.length; i++) { await pg.setContent(frames[i], { waitUntil: 'networkidle' }); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(250); await pg.screenshot({ path: `sframes/f${i}.png` }); }
await br.close();
let list = '';
for (let i = 0; i < frames.length; i++) {
  const dur = (T[i + 1] - T[i]).toFixed(3);
  const zoom = `zoompan=z='1.0+0.00018*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.round(dur * 25)}:s=1080x1920:fps=25`;
  execFileSync(FF, ['-y', '-loglevel', 'error', '-loop', '1', '-i', `sframes/f${i}.png`, '-t', dur, '-vf', `scale=2160:3840,${zoom},format=yuv420p`, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', `sclip${i}.mp4`]);
  list += `file 'sclip${i}.mp4'\n`;
}
fs.writeFileSync('slist.txt', list);
const args = ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'slist.txt'];
if (AUDIO) args.push('-i', AUDIO, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest');
else args.push('-c:v', 'copy');
args.push('-movflags', '+faststart', OUT);
execFileSync(FF, args);
console.log('done', OUT);
