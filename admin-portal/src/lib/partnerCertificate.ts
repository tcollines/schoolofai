// The Certificate of Partnership, drawn on a canvas so it can be saved as a PDF in one tap.
export interface PartnerCertificateData { name: string; type: string; logo?: string | null; date?: Date }

const loadImage = (src: string) =>
    new Promise<HTMLImageElement | null>(resolve => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
    const lines: string[] = [];
    let line = '';
    text.split(' ').forEach(w => {
        const t = line ? `${line} ${w}` : w;
        if (ctx.measureText(t).width > maxWidth && line) { lines.push(line); line = w; } else line = t;
    });
    if (line) lines.push(line);
    return lines;
}

/** A4 landscape at 2x (about 190 dpi). */
export async function renderPartnerCertificate(d: PartnerCertificateData): Promise<HTMLCanvasElement> {
    const W = 1123, H = 794, S = 2;
    const canvas = document.createElement('canvas');
    canvas.width = W * S; canvas.height = H * S;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(S, S);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // double border, as on the printed design
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 20;
    ctx.strokeRect(10, 10, W - 20, H - 20);
    ctx.lineWidth = 2;
    ctx.strokeRect(34, 34, W - 68, H - 68);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const serif = '"Times New Roman", Times, serif';
    let y = 112;
    const logo = d.logo ? await loadImage(d.logo) : null;
    if (logo) {
        const max = 110;
        const k = Math.min(max / logo.naturalWidth, max / logo.naturalHeight);
        const lw = logo.naturalWidth * k, lh = logo.naturalHeight * k;
        try { ctx.drawImage(logo, W / 2 - lw / 2, y - 20, lw, lh); y += lh + 6; } catch { /* skip the logo */ }
    }
    ctx.fillStyle = '#4c1d95';
    ctx.font = `bold 56px ${serif}`;
    ctx.fillText('Certificate of Partnership', W / 2, y + 40);
    ctx.fillStyle = '#6b7280';
    ctx.font = `24px ${serif}`;
    [...'WELILE SCHOOL OF AI'].reduce((x, ch, i, arr) => { // letter-spaced
        if (i === 0) {
            const total = arr.reduce((a, c) => a + ctx.measureText(c).width + 2, 0) - 2;
            x = W / 2 - total / 2;
        }
        ctx.textAlign = 'left';
        ctx.fillText(ch, x, y + 92);
        return x + ctx.measureText(ch).width + 2;
    }, 0);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#4b5563';
    ctx.font = `20px ${serif}`;
    ctx.fillText('This proudly certifies that', W / 2, y + 150);
    ctx.fillStyle = '#111827';
    ctx.font = `bold 40px ${serif}`;
    ctx.fillText(d.name, W / 2, y + 212);
    const nameW = Math.max(ctx.measureText(d.name).width, 400);
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(W / 2 - nameW / 2, y + 226, nameW, 2);
    ctx.fillStyle = '#4b5563';
    ctx.font = `20px ${serif}`;
    wrap(ctx, `is an official ${d.type} partner of the Welile School of AI, dedicated to advancing artificial intelligence education and empowering the next generation of tech leaders.`, 640)
        .forEach((line, i) => ctx.fillText(line, W / 2, y + 276 + i * 32));

    // date and signature
    const base = H - 128;
    ctx.fillStyle = '#000000';
    ctx.fillRect(150, base, 220, 1);
    ctx.fillRect(W - 370, base, 220, 1);
    ctx.font = `bold 18px ${serif}`;
    ctx.fillText((d.date || new Date()).toLocaleDateString(), 260, base + 28);
    ctx.fillStyle = '#4c1d95';
    ctx.font = `28px "Brush Script MT", "Snell Roundhand", cursive`;
    ctx.fillText('Welile Director', W - 260, base - 12);
    ctx.fillStyle = '#000000';
    ctx.font = `13px ${serif}`;
    ctx.fillText('Date of Issuance', 260, base + 50);
    ctx.fillText('Authorized Signature', W - 260, base + 28);
    return canvas;
}
