// Plain file downloads: no print window. A canvas becomes a PNG or a one-page PDF and is saved straight away.

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

/** A canvas as a PNG file. */
export async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return toBlob(canvas, 'image/png');
}

/** A canvas as a one-page PDF (A4 landscape or portrait, image fills the page). */
export async function canvasToPdfBlob(canvas: HTMLCanvasElement, landscape = true): Promise<Blob> {
    const jpeg = new Uint8Array(await (await toBlob(canvas, 'image/jpeg', 0.95)).arrayBuffer());
    const pw = landscape ? 841.89 : 595.28;
    const ph = landscape ? 595.28 : 841.89;
    const enc = new TextEncoder();
    const parts: (Uint8Array | string)[] = [];
    const offsets: number[] = [];
    let length = 0;
    const push = (p: Uint8Array | string) => { parts.push(p); length += typeof p === 'string' ? enc.encode(p).length : p.length; };
    const obj = (n: number, body: () => void) => { offsets[n] = length; push(`${n} 0 obj\n`); body(); push('\nendobj\n'); };

    push('%PDF-1.4\n');
    obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
    obj(2, () => push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
    obj(3, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`));
    const content = `q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`;
    obj(4, () => push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
    obj(5, () => {
        push(`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
        push(jpeg);
        push('\nendstream');
    });
    const xref = length;
    push(`xref\n0 6\n0000000000 65535 f \n${[1, 2, 3, 4, 5].map(n => String(offsets[n]).padStart(10, '0') + ' 00000 n \n').join('')}`);
    push(`trailer\n<< /Size 6 /Root 1 0 R /Info << /Producer (Welile School of AI) >> >>\nstartxref\n${xref}\n%%EOF`);

    const chunks = parts.map(p => (typeof p === 'string' ? enc.encode(p) : p));
    return new Blob(chunks, { type: 'application/pdf' });
}
