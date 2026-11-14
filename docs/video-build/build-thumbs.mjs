// Builds one thumbnail per lesson video -> frontend/public/thumb/<id>.jpg
// Usage: CHROME=... node build-thumbs.mjs <outDir> [id ...]
import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';
const out = process.argv[2];
const only = process.argv.slice(3);
const photo = 'data:image/webp;base64,' + fs.readFileSync(path.resolve('../../frontend/public/instructor/timothy.webp')).toString('base64');

const MODS = {
  0: { name: 'Welcome', line: 'How this course works', motif: 'rays' },
  1: { name: 'What AI really is', line: 'AI, machine learning and generative AI in plain language', motif: 'nest' },
  2: { name: 'How to talk to AI', line: 'Ask clearly. Improve answers. Use your own text.', motif: 'prompt' },
  4: { name: 'When AI gets it wrong', line: 'Hallucinations, real cases and fact-checking', motif: 'warn' },
};
const L = [
  ['m0-l1', 0, 'Welcome to AI Fundamentals', 5],
  ['m1-l1', 1, 'You already use AI', 6],
  ['m1-l2', 1, "What AI is, and what it isn't", 7],
  ['m1-l3', 1, 'Machine learning: from rules to examples', 9],
  ['m1-l4', 1, 'Deep learning and the AI family', 8],
  ['m1-l5', 1, 'Generative AI and large language models', 9],
  ['m2-l1', 2, 'Pick a tool and get set up', 7],
  ['m2-l2', 2, 'Context, task, format: the three-part prompt', 9],
  ['m2-l3', 2, "Not quite right? Refine, don't restart", 7],
  ['m2-l4', 2, 'Give it your own text to work from', 7],
  ['m4-l1', 4, 'Why AI sounds sure and is wrong', 7],
];
const highlight = { 'm1-l2': 0, 'm1-l3': 1, 'm1-l4': 2, 'm1-l5': 3 };

const motif = (m, id) => {
  if (m === 'nest') {
    const h = highlight[id] ?? -1;
    const rings = [['AI', 560, '#ede9fe', '#a78bfa'], ['Machine learning', 430, '#ddd6fe', '#8b5cf6'], ['Deep learning', 300, '#c4b5fd', '#7c3aed'], ['Generative AI', 170, '#6d28d9', '#4c1d95']];
    return `<div style="position:relative;width:560px;height:560px">${rings.map(([t, s, bg, bd], i) => `<div style="position:absolute;left:${(560 - s) / 2}px;bottom:0;width:${s}px;height:${s}px;border-radius:50%;background:${bg};border:${h === i ? 7 : 3}px solid ${bd};display:flex;justify-content:center;padding-top:${i === 3 ? 62 : 34}px;box-sizing:border-box;font-weight:700;font-size:${i === 3 ? 28 : 25}px;color:${i === 3 ? '#fff' : '#4c1d95'};text-align:center;line-height:1.1">${i === 3 ? 'Generative<br>AI' : t}</div>`).join('')}</div>`;
  }
  if (m === 'prompt') {
    const chip = (t, bg, c) => `<div style="background:${bg};color:${c};border-radius:26px;padding:26px 40px;font-size:50px;font-weight:700;box-shadow:0 6px 18px rgba(0,0,0,.08)">${t}</div>`;
    return `<div style="display:flex;flex-direction:column;gap:26px;align-items:flex-start">${chip('Context', '#ede9fe', '#5b21b6')}${chip('Task', '#dbeafe', '#1e40af')}${chip('Format', '#fef3c7', '#92400e')}</div>`;
  }
  if (m === 'warn') {
    return `<div style="width:560px"><div style="background:#fff;border:3px solid #e7e2da;border-radius:36px 36px 36px 8px;padding:34px 40px;font-size:42px;line-height:1.3;box-shadow:0 10px 30px rgba(0,0,0,.08)">“That one, with the <b>blue stripe</b>.”</div>
    <div style="display:flex;gap:16px;margin-top:24px;align-items:center"><span style="background:#dcfce7;color:#166534;border-radius:999px;padding:10px 28px;font-size:34px;font-weight:700">Sounds sure</span><span style="background:#fee2e2;color:#991b1b;border-radius:999px;padding:10px 28px;font-size:34px;font-weight:700">Wrong bus</span></div></div>`;
  }
  return `<svg width="520" height="520" viewBox="-260 -260 520 520">${Array.from({ length: 12 }, (_, i) => `<rect x="-9" y="-250" width="18" height="${i % 2 ? 70 : 110}" rx="9" fill="${i % 2 ? '#c4b5fd' : '#8b5cf6'}" transform="rotate(${i * 30})"/>`).join('')}<circle r="120" fill="#6d28d9"/><text y="26" text-anchor="middle" font-size="84" font-weight="700" fill="#fff" font-family="Fraunces,serif">AI</text></svg>`;
};

const html = ([id, mod, title, min]) => {
  const M = MODS[mod];
  const lesson = id.split('-l')[1];
  return `<html><head><style>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{width:1920px;height:1080px;font-family:'DM Sans',sans-serif;background:#faf7f2;position:relative;overflow:hidden;color:#1c1917}
.blob{position:absolute;right:-260px;top:-260px;width:1100px;height:1100px;border-radius:50%;background:radial-gradient(circle,#ddd6fe 0%,rgba(221,214,254,0) 68%)}
.blob2{position:absolute;left:-300px;bottom:-420px;width:900px;height:900px;border-radius:50%;background:radial-gradient(circle,#fef3c7 0%,rgba(254,243,199,0) 68%)}
.left{position:absolute;left:110px;top:120px;width:1000px;bottom:110px;display:flex;flex-direction:column}
.brand{font-size:28px;font-weight:700;letter-spacing:.04em;color:#6d28d9}
.eyebrow{margin-top:80px;font-size:34px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#6d28d9}
h1{margin-top:22px;font-family:'Fraunces',serif;font-weight:600;font-size:${title.length > 38 ? 86 : 104}px;line-height:1.08;letter-spacing:-.01em}
.line{margin-top:36px;font-size:38px;color:#57534e;line-height:1.35;max-width:880px}
.who{margin-top:auto;display:flex;align-items:center;gap:22px;font-size:30px;color:#44403c}
.who img{width:92px;height:92px;border-radius:50%;object-fit:cover;border:4px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.15)}
.who b{display:block;color:#1c1917}
.right{position:absolute;right:110px;top:0;bottom:0;display:flex;align-items:center;justify-content:center;width:600px}
.play{position:absolute;right:110px;bottom:90px;width:116px;height:116px;border-radius:50%;background:#6d28d9;box-shadow:0 10px 30px rgba(109,40,217,.45);display:flex;align-items:center;justify-content:center}
.play:after{content:'';margin-left:10px;border-left:38px solid #fff;border-top:24px solid transparent;border-bottom:24px solid transparent}
.min{position:absolute;right:250px;bottom:126px;font-size:30px;font-weight:700;color:#57534e}
</style></head><body><div class="blob"></div><div class="blob2"></div>
<div class="left"><div class="brand">WELILE SCHOOL OF AI</div>
<div class="eyebrow">Module ${mod} · ${M.name}</div><h1>${title}</h1><div class="line">${M.line}</div>
<div class="who"><img src="${photo}"><div><b>Timothy Christian Waniaye</b>Lesson ${lesson} · AI Fundamentals</div></div></div>
<div class="right" style="top:-40px">${motif(M.motif, id)}</div><div class="min">${min} min</div><div class="play"></div></body></html>`;
};

const b = await chromium.launch({ executablePath: process.env.CHROME });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
fs.mkdirSync(out, { recursive: true });
for (const l of L) {
  if (only.length && !only.includes(l[0])) continue;
  await p.setContent(html(l), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: `${out}/${l[0]}.jpg`, type: 'jpeg', quality: 86 });
  console.log('thumb', l[0]);
}
await b.close();
