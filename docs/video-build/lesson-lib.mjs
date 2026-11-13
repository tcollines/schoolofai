// Shared slide-video builder for AI Fundamentals lessons.
// A lesson file imports { make } and returns slides keyed to the narration's timestamps (seconds).
// usage (from a lesson file):  node lessons/m1-l2.mjs <ffmpeg> <audio.mp3> <out.mp4>   (env CHROME = Chrome for Testing binary)
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

export const CSS = `
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
.it{opacity:0;transform:translateY(10px)}
.it.on{opacity:1;transform:none}
.card{background:#fff;border:1.5px solid #e7e2da;border-radius:28px;padding:36px 40px}
.card.hl{border-color:#6d28d9;box-shadow:0 0 0 4px #ede9fe}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:28px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
.num{display:inline-flex;width:64px;height:64px;border-radius:32px;background:#6d28d9;color:#fff;font-weight:700;font-size:32px;align-items:center;justify-content:center;flex:none}
.row{display:flex;align-items:center;gap:28px;font-size:40px;line-height:1.25}
.muted{color:#57534e}
.pill{display:inline-block;background:#ede9fe;color:#5b21b6;border-radius:999px;padding:10px 26px;font-size:30px;font-weight:600}
.pill.red{background:#fee2e2;color:#991b1b}.pill.green{background:#dcfce7;color:#166534}.pill.amber{background:#fef3c7;color:#92400e}
.big{font-family:'Fraunces',serif;font-weight:600}
.violet{color:#5b21b6}
.center{height:100%;display:flex;flex-direction:column;justify-content:center}
.arrow{font-size:54px;color:#6d28d9;font-weight:700;align-self:center}
.circle{border-radius:50%;display:flex;align-items:center;justify-content:center;text-align:center;font-weight:700}
`;

// step semantics: visible once the slide has reached step i  (steps[i] is the narration time it appears)
export const on = (n, i) => `it ${n >= i ? 'on' : ''}`;
export const ON = (n, i) => (n >= i ? 'on' : '');

/** page shell: meta = { mod, id, title } */
export const shellFor = meta => (inner, o = {}) => `<html><head><style>${CSS}</style></head><body>
<div class="bar"><span><b>WELILE SCHOOL OF AI</b> &nbsp;·&nbsp; AI Fundamentals</span><span>${o.mod || meta.mod}</span></div>
<div class="wrap">${inner}</div><div class="foot"><span>Welile School of AI · Free course</span><span>${meta.id} · ${meta.title}</span></div></body></html>`;

export async function render({ FF, CHROME, AUDIO, OUT, TOTAL, slides, intro, dir = 'frames' }) {
  fs.mkdirSync(dir, { recursive: true });
  const b = await chromium.launch({ executablePath: CHROME, headless: true });
  const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const shot = async (html, name) => { await pg.setContent(html, { waitUntil: 'networkidle' }); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(250); await pg.screenshot({ path: name }); };
  const entries = [];
  if (intro) { await shot(intro.html, `${dir}/intro.png`); entries.push({ file: `${dir}/intro.png`, start: 0, intro: true }); }
  for (const s of slides) {
    for (let i = 0; i < s.steps.length; i++) {
      const f = `${dir}/s${Math.round(s.start)}_${i}.png`;
      await shot(s.html(i), f);
      entries.push({ file: f, start: s.steps[i] });
    }
  }
  await b.close();
  entries.sort((a, c) => a.start - c.start);
  let list = '';
  entries.forEach((e, i) => {
    const end = i + 1 < entries.length ? entries[i + 1].start : TOTAL;
    const dur = Math.max(0.2, end - e.start).toFixed(3);
    const out = `${dir}/clip${i}.mp4`;
    const vf = e.intro
      ? `scale=3840:2160,zoompan=z='1.0+0.0004*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.round(dur * 25)}:s=1920x1080:fps=25,format=yuv420p`
      : `scale=1920:1080,fps=25,format=yuv420p`;
    execFileSync(FF, ['-y', '-loglevel', 'error', '-loop', '1', '-i', e.file, '-t', dur, '-vf', vf, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', out]);
    list += `file 'clip${i}.mp4'\n`;
  });
  fs.writeFileSync(`${dir}/list.txt`, list);
  execFileSync(FF, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${dir}/list.txt`, '-i', AUDIO, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', OUT]);
  console.log('done', OUT, entries.length, 'frames');
}

/** concentric circles, bottom-aligned. items outer→inner [{label, sub}], vis[i] boolean, hl index to ring-highlight */
export function nest(items, vis, hl = -1, D = 780) {
  const k = items.length, pal = ['#f5f3ff', '#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa'];
  const out = items.map((it, i) => {
    const s = k === 1 ? D : D - i * ((D - 250) / (k - 1));
    const col = pal[Math.min(pal.length - 1, Math.round(i * (pal.length - 1) / Math.max(1, k - 1)))];
    const last = i === k - 1;
    const lab = `<div style="position:absolute;left:0;right:0;${last ? 'top:50%;transform:translateY(-50%)' : 'top:26px'};text-align:center;padding:0 24px"><div style="font-size:${last ? 40 : 42}px;font-weight:700;color:#3b0764;line-height:1.1">${it.label}</div>${it.sub ? `<div style="font-size:25px;color:#5b21b6;margin-top:6px">${it.sub}</div>` : ''}</div>`;
    return `<div style="position:absolute;left:${(D - s) / 2}px;bottom:0;width:${s}px;height:${s}px;border-radius:50%;background:${col};border:3px solid #7c3aed;opacity:${vis[i] ? 1 : 0};${hl === i ? 'box-shadow:0 0 0 8px rgba(124,58,237,.28);' : ''}">${lab}</div>`;
  });
  return `<div style="position:relative;width:${D}px;height:${D}px;flex:none">${out.join('')}</div>`;
}
