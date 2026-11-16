// Builds a live-class slide deck (PDF) from a deck file.
//   CHROME=... node build-deck.mjs lecture-1.mjs "<out dir>"
// Slides are 1920x1080, one per page, big readable text: the presenter reads straight from them.
import { chromium } from '/Users/Timothy/Desktop/schoolofai/schoolofai/docs/video-build/node_modules/playwright-core/index.mjs';
import fs from 'fs';
import path from 'path';
const deckFile = process.argv[2];
const outDir = process.argv[3] || '.';
const deck = (await import(path.resolve(deckFile))).default;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
@page { size: 1920px 1080px; margin: 0 }
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#faf8f5}
body{font-family:'DM Sans',sans-serif;color:#1c1917;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.slide{width:1920px;height:1080px;position:relative;overflow:hidden;page-break-after:always;background:#faf8f5;padding:130px 120px 110px}
.bar{position:absolute;left:0;right:0;top:0;height:78px;display:flex;align-items:center;justify-content:space-between;padding:0 120px;font-size:24px;color:#57534e;border-bottom:1px solid #e7e2da}
.bar b{color:#6d28d9;letter-spacing:.03em}
.foot{position:absolute;left:120px;right:120px;bottom:34px;font-size:22px;color:#78750;display:flex;justify-content:space-between;color:#78716c}
.eyebrow{font-size:28px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#6d28d9;margin-bottom:22px}
h1{font-family:'Fraunces',serif;font-weight:600;font-size:104px;line-height:1.08;letter-spacing:-.01em}
h2{font-family:'Fraunces',serif;font-weight:600;font-size:72px;line-height:1.1;margin-bottom:38px}
.violet{color:#5b21b6}.red{color:#991b1b}.green{color:#166534}.amber{color:#92400e}
.lead{font-size:46px;line-height:1.35;color:#292524}
.sub{font-size:36px;line-height:1.4;color:#57534e}
.list{display:flex;flex-direction:column;gap:22px}
.item{display:flex;gap:28px;align-items:flex-start;background:#fff;border:1.5px solid #e7e2da;border-radius:26px;padding:24px 36px;font-size:42px;line-height:1.3}
.item .n{flex:none;width:62px;height:62px;border-radius:50%;background:#6d28d9;color:#fff;font-weight:700;font-size:32px;display:flex;align-items:center;justify-content:center;margin-top:2px}
.item.hl{border-color:#6d28d9;box-shadow:0 0 0 4px #ede9fe}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:30px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
.card{background:#fff;border:1.5px solid #e7e2da;border-radius:28px;padding:34px 38px;font-size:38px;line-height:1.35}
.card h3{font-family:'Fraunces',serif;font-size:50px;font-weight:600;margin-bottom:10px;line-height:1.1}
.pill{display:inline-block;background:#ede9fe;color:#5b21b6;border-radius:999px;padding:10px 28px;font-size:32px;font-weight:600;margin:6px 10px 6px 0}
.pill.red{background:#fee2e2;color:#991b1b}.pill.green{background:#dcfce7;color:#166534}.pill.amber{background:#fef3c7;color:#92400e}.pill.blue{background:#dbeafe;color:#1e40af}
.prompt{background:#fff;border:2px solid #6d28d9;box-shadow:0 0 0 5px #ede9fe;border-radius:28px;padding:34px 44px}
.prompt .t{font-size:26px;font-weight:700;letter-spacing:.08em;color:#5b21b6;margin-bottom:10px}
.prompt .q{font-size:44px;line-height:1.35}
.big{font-family:'Fraunces',serif;font-weight:600;font-size:96px;line-height:1.12}
.center{height:100%;display:flex;flex-direction:column;justify-content:center}
.note{margin-top:30px;font-size:34px;color:#57534e;line-height:1.4}
table{border-collapse:collapse;width:100%;font-size:36px}
td,th{padding:20px 28px;text-align:left;border-bottom:1.5px solid #e7e2da;vertical-align:top}
th{background:#ede9fe;color:#4c1d95}
.tag{display:inline-block;font-size:26px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;border-radius:12px;padding:6px 16px;margin-right:12px}
.mark{background:#fde68a;color:#78350f;border-radius:10px;padding:2px 12px;font-weight:700}
.slide.compact h2{font-size:62px;margin-bottom:26px}.slide.compact .item{font-size:36px;padding:18px 30px;gap:22px}.slide.compact .item .n{width:52px;height:52px;font-size:28px}.slide.compact .list{gap:16px}.slide.compact .note{font-size:30px;margin-top:20px}.slide.compact .prompt .q{font-size:38px}.slide.compact .lead{font-size:40px}.slide.compact .card{font-size:34px;padding:26px 32px}.slide.compact table{font-size:32px}.slide.compact td,.slide.compact th{padding:14px 24px}
.ring{position:relative;width:820px;height:820px}
.ring div{position:absolute;border-radius:50%;left:50%;transform:translateX(-50%);bottom:0;display:flex;justify-content:center;font-weight:700;text-align:center}
`;
const slidesHtml = deck.slides.map((s, i) => `<section class="slide${s.includes('<!--compact-->') ? ' compact' : ''}"><div class="bar"><span><b>WELILE SCHOOL OF AI</b> &nbsp;·&nbsp; ${deck.short}</span><span>${deck.part}</span></div>${s}<div class="foot"><span>${deck.title}</span><span>${i + 1} / ${deck.slides.length}</span></div></section>`).join('\n');
const html = `<html><head><meta charset="utf-8"><title>${deck.title}</title><style>${CSS}</style></head><body>${slidesHtml}</body></html>`;

({ executablePath: process.env.CHROME });
const b = await chromium.launch({ executablePath: process.env.CHROME });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.setContent(html, { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
// overflow check: warn when content runs into the footer area
const over = await p.evaluate(() => [...document.querySelectorAll('.slide')].map((sl, i) => {
    const top = sl.getBoundingClientRect().top; let bottom = 0;
    sl.querySelectorAll(':scope > *:not(.bar):not(.foot)').forEach(el => { bottom = Math.max(bottom, el.getBoundingClientRect().bottom - top); el.querySelectorAll('*').forEach(c => { bottom = Math.max(bottom, c.getBoundingClientRect().bottom - top); }); });
    return bottom > 985 ? `slide ${i + 1} bottom ${Math.round(bottom)}` : null;
}).filter(Boolean));
if (over.length) console.log('OVERFLOW:', over.join('; '));
fs.mkdirSync(outDir, { recursive: true });
const pdf = path.join(outDir, deck.file + '.pdf');
await p.pdf({ path: pdf, width: '1920px', height: '1080px', printBackground: true, preferCSSPageSize: true });
// contact sheet for a quick visual check
await p.setViewportSize({ width: 1920, height: 1080 });
const n = await p.locator('.slide').count();
for (const i of (process.env.PREVIEW || '').split(',').filter(Boolean).map(Number)) {
    await p.locator('.slide').nth(i).screenshot({ path: path.join(outDir, `preview-${String(i + 1).padStart(2, '0')}.png`) });
}
console.log('slides', n, '->', pdf);
await b.close();
