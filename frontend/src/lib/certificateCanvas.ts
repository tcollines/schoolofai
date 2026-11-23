// Draws the certificate onto a canvas so it can be saved as a PDF or an image in one tap.
// The layout is the same 842 x 595 canvas (A4 landscape, in points) that CertificateDocument shows on screen:
// if a position changes there, change it here too.
import QRCode from 'qrcode';

const HEAD = '"Outfit", "DM Sans", system-ui, sans-serif';
const BODY = '"DM Sans", "Inter", system-ui, sans-serif';
const ROUND = '"Chewy", "Baloo 2", "Comic Sans MS", cursive';
const MONT = '"Montserrat", "DM Sans", system-ui, sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

const W = 842;
const H = 595;
const PURPLE = '#491e8a';

export interface CertificateData {
    name: string;
    issuedAt: string;
    certId: string;
    verifyUrl: string;
}

const monthYear = (iso: string) => {
    const d = new Date(iso);
    const month = d.toLocaleDateString('en-GB', { month: 'long', timeZone: 'Africa/Kampala' });
    const year = d.toLocaleDateString('en-GB', { year: 'numeric', timeZone: 'Africa/Kampala' });
    return `${month}, ${year}`;
};

const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Could not load ${src}`));
        img.src = src;
    });

const FONT_FACES = [
    '400 62px "Outfit"', '300 43px "Outfit"', '400 13px "DM Sans"', '700 8px "DM Sans"', '400 34px "Chewy"', '500 12px "Montserrat"',
];

/** Draw `text` with its top edge at `top` the way CSS lays out a line box of the given line-height. */
function drawLine(
    ctx: CanvasRenderingContext2D, text: string, x: number, top: number, size: number, font: string, color: string,
    opts: { weight?: number; lineHeight?: number; spacingEm?: number; align?: 'left' | 'center' } = {}
) {
    ctx.font = `${opts.weight ?? 400} ${size}px ${font}`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'alphabetic';
    const m = ctx.measureText('Hg');
    const fa = m.fontBoundingBoxAscent ?? size * 0.95;
    const fd = m.fontBoundingBoxDescent ?? size * 0.25;
    const lh = opts.lineHeight ? opts.lineHeight * size : fa + fd;
    const baseline = top + (lh - (fa + fd)) / 2 + fa;
    const gap = (opts.spacingEm ?? 0) * size;
    if (!gap) {
        ctx.textAlign = opts.align === 'center' ? 'center' : 'left';
        ctx.fillText(text, x, baseline);
    } else {
        // letter-spaced text, drawn one letter at a time so it works in every browser
        ctx.textAlign = 'left';
        const widths = [...text].map(ch => ctx.measureText(ch).width);
        const total = widths.reduce((a, b) => a + b, 0) + gap * (widths.length - 1);
        let cx = opts.align === 'center' ? x - total / 2 : x;
        [...text].forEach((ch, i) => { ctx.fillText(ch, cx, baseline); cx += widths[i] + gap; });
    }
    return lh;
}

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
};

function drawQr(ctx: CanvasRenderingContext2D, url: string, x: number, y: number, size: number) {
    const q = QRCode.create(url, { errorCorrectionLevel: 'Q' });
    const n = q.modules.size;
    const data = q.modules.data as unknown as ArrayLike<number>;
    const c = size / n;
    const inFinder = (cx: number, cy: number) => (cx < 7 && cy < 7) || (cx >= n - 7 && cy < 7) || (cx < 7 && cy >= n - 7);
    ctx.fillStyle = '#3f1a7d';
    for (let cy = 0; cy < n; cy++) for (let cx = 0; cx < n; cx++) {
        if (data[cy * n + cx] && !inFinder(cx, cy)) { roundRect(ctx, x + (cx + 0.03) * c, y + (cy + 0.03) * c, 0.94 * c, 0.94 * c, 0.3 * c); ctx.fill(); }
    }
    const finder = (fx: number, fy: number) => {
        ctx.strokeStyle = '#3f1a7d';
        ctx.lineWidth = c;
        roundRect(ctx, x + (fx + 0.5) * c, y + (fy + 0.5) * c, 6 * c, 6 * c, 1.9 * c);
        ctx.stroke();
        roundRect(ctx, x + (fx + 2) * c, y + (fy + 2) * c, 3 * c, 3 * c, 0.9 * c);
        ctx.fill();
    };
    finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
}

/** Render the certificate to a canvas. `width` is in pixels; 2526 is about 300 dpi on A4. */
export async function renderCertificateCanvas(data: CertificateData, width = 2526): Promise<HTMLCanvasElement> {
    try { await Promise.all(FONT_FACES.map(f => document.fonts.load(f))); await document.fonts.ready; } catch { /* draw with fallback fonts */ }
    const [bg, sig, icon] = await Promise.all([loadImage('/cert/bg.jpg'), loadImage('/cert/signature-director.png'), loadImage('/cert/ai-icon.png')]);

    const s = width / W;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(W * s);
    canvas.height = Math.round(H * s);
    const ctx = canvas.getContext('2d')!;
    ctx.scale(s, s);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0, W, H);

    const ink = '#111111';
    // Welile wordmark
    drawLine(ctx, 'Welile', 88, 36, 54, ROUND, PURPLE, { lineHeight: 1 });
    drawLine(ctx, 'TM', 88 + 118, 36 + 2, 11, HEAD, PURPLE, { weight: 600 });
    // Title
    const lh = drawLine(ctx, 'Certificate', 88, 108, 62, HEAD, ink, { lineHeight: 1.05 });
    drawLine(ctx, 'of Completion', 88, 108 + lh + 0.5, 24.5, HEAD, ink, { lineHeight: 1.2 });
    drawLine(ctx, 'This certificate is awarded to', 90, 232, 13.2, BODY, ink);
    drawLine(ctx, (data.name || 'Your Name').toUpperCase(), 89, 266, 43.5, HEAD, ink, { weight: 300, lineHeight: 1.1 });
    const body = [
        'For successfully completing the AI Fundamentals Program, demonstrating strong commitment,',
        'performance, and dedication throughout the training conducted by Welile',
        `Technologies School of AI in ${monthYear(data.issuedAt)}.`,
    ];
    body.forEach((line, i) => drawLine(ctx, line, 90, 331 + i * 13.3 * 1.47, 13.3, BODY, ink, { lineHeight: 1.47 }));

    // Director
    drawLine(ctx, 'Director', 90, 441, 13.2, BODY, ink);
    ctx.drawImage(sig, 94, 458, 124, (124 * sig.naturalHeight) / sig.naturalWidth);
    ctx.fillStyle = '#555555';
    ctx.fillRect(90, 518, 100, 1);
    drawLine(ctx, 'COLLINES TUMWIINE', 90, 522, 12.2, MONT, ink, { weight: 500, spacingEm: 0.01 });

    // Verification QR where the printed seal used to sit
    ctx.save();
    ctx.shadowColor = 'rgba(73, 30, 138, 0.12)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, 364, 414, 132, 132, 16);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#d9ccf2';
    ctx.lineWidth = 1.1;
    roundRect(ctx, 364.55, 414.55, 130.9, 130.9, 15.5);
    ctx.stroke();
    drawQr(ctx, data.verifyUrl, 374, 424, 112);
    const cap = drawLine(ctx, 'SCAN TO VERIFY', 430, 414 + 132 + 6, 7.8, BODY, PURPLE, { weight: 700, spacingEm: 0.16, align: 'center' });
    drawLine(ctx, data.certId, 430, 414 + 132 + 6 + cap + 1.6, 5.6, MONO, '#6b6580', { spacingEm: 0.04, align: 'center' });

    // School of AI
    ctx.font = `400 34px ${ROUND}`;
    const textW = ctx.measureText('School of').width;
    const grad = ctx.createLinearGradient(640, 0, 640 + textW, 0);
    grad.addColorStop(0, '#7aa9f2');
    grad.addColorStop(1, '#78c2f3');
    drawLine(ctx, 'School of', 640, 509 + (40 - 34) / 2, 34, ROUND, grad as unknown as string, { lineHeight: 1 });
    ctx.drawImage(icon, 640 + textW + 7, 509, (40 * icon.naturalWidth) / icon.naturalHeight, 40);

    return canvas;
}
