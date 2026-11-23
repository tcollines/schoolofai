// Plain file downloads for the admin console: no print window. A canvas becomes a PNG or one-page PDF, text becomes a
// multi-page PDF, and the file is saved straight away.

/** Save a blob to the user's device. */
export function saveBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export const safeFileName = (s: string) =>
    s.normalize('NFKD').replace(/[^\w\s.-]+/g, '').trim().replace(/\s+/g, '-').slice(0, 80) || 'download';

const toBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
    new Promise<Blob>((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not create the file.'))), type, quality));

export const canvasToPngBlob = (canvas: HTMLCanvasElement) => toBlob(canvas, 'image/png');

// ---- a tiny PDF writer (Latin-1 text and JPEG pages) ------------------------------------------------------------
const latin1 = (s: string) => {
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
    return out;
};

class Pdf {
    private chunks: Uint8Array[] = [];
    private len = 0;
    private offsets: number[] = [];
    push(p: Uint8Array | string) { const b = typeof p === 'string' ? latin1(p) : p; this.chunks.push(b); this.len += b.length; }
    obj(n: number, body: () => void) { this.offsets[n] = this.len; this.push(`${n} 0 obj\n`); body(); this.push('\nendobj\n'); }
    finish(count: number): Blob {
        const xref = this.len;
        let t = `xref\n0 ${count + 1}\n0000000000 65535 f \n`;
        for (let n = 1; n <= count; n++) t += `${String(this.offsets[n]).padStart(10, '0')} 00000 n \n`;
        this.push(t + `trailer\n<< /Size ${count + 1} /Root 1 0 R /Info << /Producer (Welile School of AI) >> >>\nstartxref\n${xref}\n%%EOF`);
        return new Blob(this.chunks as BlobPart[], { type: 'application/pdf' });
    }
}

/** A canvas as a one-page PDF (A4 landscape or portrait, the image fills the page). */
export async function canvasToPdfBlob(canvas: HTMLCanvasElement, landscape = true): Promise<Blob> {
    const jpeg = new Uint8Array(await (await toBlob(canvas, 'image/jpeg', 0.95)).arrayBuffer());
    const pw = landscape ? 841.89 : 595.28;
    const ph = landscape ? 595.28 : 841.89;
    const pdf = new Pdf();
    pdf.push('%PDF-1.4\n');
    pdf.obj(1, () => pdf.push('<< /Type /Catalog /Pages 2 0 R >>'));
    pdf.obj(2, () => pdf.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
    pdf.obj(3, () => pdf.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`));
    const content = `q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`;
    pdf.obj(4, () => pdf.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
    pdf.obj(5, () => {
        pdf.push(`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
        pdf.push(jpeg);
        pdf.push('\nendstream');
    });
    return pdf.finish(5);
}

const WIN_ANSI: Record<string, number> = { '•': 0x95, '—': 0x97, '–': 0x96, '’': 0x92, '‘': 0x91, '“': 0x93, '”': 0x94, '…': 0x85, '·': 0xb7 };
const toAnsi = (s: string) => [...s].map(ch => (WIN_ANSI[ch] !== undefined ? String.fromCharCode(WIN_ANSI[ch]) : ch.charCodeAt(0) < 256 ? ch : '?')).join('');
const esc = (s: string) => toAnsi(s).replace(/[\\()]/g, m => '\\' + m);

/** Plain text as a multi-page A4 PDF. The first line is the title; lines in capitals are section headings. */
export function textToPdfBlob(lines: string[]): Blob {
    const PW = 595.28, PH = 841.89, M = 54, SIZE = 10.5, LEAD = 15;
    const measure = document.createElement('canvas').getContext('2d')!;
    const widthOf = (t: string, bold: boolean, size: number) => { measure.font = `${bold ? 'bold ' : ''}${size}px Helvetica, Arial, sans-serif`; return measure.measureText(t).width; };
    type Row = { text: string; bold: boolean; size: number; gap: number };
    const rows: Row[] = [];
    lines.forEach((raw, idx) => {
        const text = raw.trimEnd();
        if (!text) { rows.push({ text: '', bold: false, size: SIZE, gap: 6 }); return; }
        const heading = idx === 0 || (text === text.toUpperCase() && /[A-Z]/.test(text) && !text.startsWith('•'));
        const size = idx === 0 ? 14 : heading ? 11.5 : SIZE;
        const indent = text.startsWith('•') ? '    ' : '';
        const words = text.split(' ');
        let line = '';
        words.forEach(w => {
            const test = line ? `${line} ${w}` : w;
            if (widthOf(test, heading, size) > PW - 2 * M && line) { rows.push({ text: line, bold: heading, size, gap: 0 }); line = indent + w; } else line = test;
        });
        rows.push({ text: line, bold: heading, size, gap: heading && idx > 0 ? 6 : 0 });
    });

    const pages: string[] = [];
    let y = PH - M;
    let cur: string[] = [];
    const flush = () => { pages.push(cur.join('\n')); cur = []; y = PH - M; };
    rows.forEach(r => {
        const need = r.size + 4 + r.gap;
        if (y - need < M) flush();
        y -= r.gap;
        if (r.text) cur.push(`BT /${r.bold ? 'F2' : 'F1'} ${r.size} Tf ${M} ${(y - r.size).toFixed(2)} Td (${esc(r.text)}) Tj ET`);
        y -= r.text ? Math.max(LEAD, r.size + 4) : LEAD * 0.5;
    });
    flush();

    const n = pages.length;
    const pdf = new Pdf();
    pdf.push('%PDF-1.4\n');
    pdf.obj(1, () => pdf.push('<< /Type /Catalog /Pages 2 0 R >>'));
    pdf.obj(2, () => pdf.push(`<< /Type /Pages /Kids [${pages.map((_, i) => `${5 + i * 2} 0 R`).join(' ')}] /Count ${n} >>`));
    pdf.obj(3, () => pdf.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'));
    pdf.obj(4, () => pdf.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'));
    pages.forEach((content, i) => {
        pdf.obj(5 + i * 2, () => pdf.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`));
        pdf.obj(6 + i * 2, () => pdf.push(`<< /Length ${latin1(content).length} >>\nstream\n${content}\nendstream`));
    });
    return pdf.finish(4 + n * 2);
}
