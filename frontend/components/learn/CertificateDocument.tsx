import React, { useMemo } from 'react';
import QRCode from 'qrcode';

interface Props {
    name: string;
    courseTitle: string;
    issuedAt: string;
    certId: string;
    sample?: boolean;
    provisional?: boolean;
}

// The certificate is drawn on a 842 x 595 canvas (A4 landscape in points) and scales with its container.
const u = (n: number) => `${((n * 100) / 842).toFixed(3)}cqw`;

const monthYear = (iso: string) => {
    const d = new Date(iso);
    const month = d.toLocaleDateString('en-GB', { month: 'long', timeZone: 'Africa/Kampala' });
    const year = d.toLocaleDateString('en-GB', { year: 'numeric', timeZone: 'Africa/Kampala' });
    return `${month}, ${year}`;
};

// Where the QR code leads: the public page that confirms this certificate is real
export const verifyUrlFor = (certId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin.replace('//admin.', '//www.') : 'https://www.welileschoolofai.org';
    return `${origin}/verify/${encodeURIComponent(certId)}`;
};

const HEAD = '"Outfit", "DM Sans", system-ui, sans-serif';
const BODY = '"DM Sans", "Inter", system-ui, sans-serif';
const ROUND = '"Chewy", "Baloo 2", "Comic Sans MS", cursive';

/** The verification code that takes the place of the printed seal: a rounded, brand-purple QR on a clean white tile. */
const VerifyQr: React.FC<{ url: string }> = ({ url }) => {
    const { size, cells } = useMemo(() => {
        const q = QRCode.create(url, { errorCorrectionLevel: 'Q' });
        const n = q.modules.size;
        const data = q.modules.data as unknown as ArrayLike<number>;
        const out: [number, number][] = [];
        const inFinder = (x: number, y: number) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (data[y * n + x] && !inFinder(x, y)) out.push([x, y]);
        return { size: n, cells: out };
    }, [url]);
    const PURPLE = '#3f1a7d';
    const quiet = 0;
    const finder = (fx: number, fy: number) => (
        <g key={`${fx}-${fy}`}>
            <rect x={fx + 0.5} y={fy + 0.5} width={6} height={6} rx={1.9} fill="none" stroke={PURPLE} strokeWidth={1} />
            <rect x={fx + 2} y={fy + 2} width={3} height={3} rx={0.9} fill={PURPLE} />
        </g>
    );
    return (
        <svg viewBox={`${-quiet} ${-quiet} ${size + quiet * 2} ${size + quiet * 2}`} width="100%" height="100%" role="img" aria-label="QR code to verify this certificate" shapeRendering="geometricPrecision">
            {cells.map(([x, y]) => <rect key={`${x}-${y}`} x={x + 0.03} y={y + 0.03} width={0.94} height={0.94} rx={0.3} fill={PURPLE} />)}
            {finder(0, 0)}
            {finder(size - 7, 0)}
            {finder(0, size - 7)}
        </svg>
    );
};

/**
 * The certificate. Layout, wording, artwork and signature follow the approved Welile School of AI template;
 * only the name, issue month and certificate ID change per learner. The QR code (where the seal used to be) opens the verify page.
 */
const CertificateDocument: React.FC<Props> = ({ name, issuedAt, certId, sample, provisional }) => {
    const shown = (name || 'Your Name').toUpperCase();

    return (
        <div
            className="cert-print-area w-full relative select-none overflow-hidden"
            style={{
                aspectRatio: '842 / 595',
                containerType: 'inline-size',
                background: '#ffffff url(/cert/bg.jpg) center / 100% 100% no-repeat',
                color: '#111111',
                fontFamily: BODY,
            }}
        >
            {/* Welile wordmark */}
            <div className="absolute" style={{ left: u(88), top: u(36) }}>
                <a href="https://welile.com/" target="_blank" rel="noopener noreferrer" aria-label="Welile" style={{ textDecoration: 'none' }}>
                    <span style={{ fontFamily: ROUND, color: '#491e8a', fontSize: u(54), lineHeight: 1, letterSpacing: '0.005em' }}>Welile</span>
                    <span style={{ fontFamily: HEAD, color: '#491e8a', fontSize: u(11), fontWeight: 600, position: 'absolute', left: u(118), top: u(2) }}>TM</span>
                </a>
            </div>

            {/* Title */}
            <div className="absolute" style={{ left: u(88), top: u(108) }}>
                <p style={{ fontFamily: HEAD, fontSize: u(62), lineHeight: 1.05, fontWeight: 400, letterSpacing: '-0.005em' }}>Certificate</p>
                <p style={{ fontFamily: HEAD, fontSize: u(24.5), lineHeight: 1.2, fontWeight: 400, marginTop: u(0.5) }}>of Completion</p>
            </div>

            <p className="absolute" style={{ left: u(90), top: u(232), fontSize: u(13.2) }}>This certificate is awarded to</p>

            <p
                className="absolute"
                style={{ left: u(89), top: u(266), fontFamily: HEAD, fontSize: u(43.5), fontWeight: 300, lineHeight: 1.1, letterSpacing: '0.005em', whiteSpace: 'nowrap' }}
            >
                {shown}
            </p>

            <p className="absolute" style={{ left: u(90), top: u(331), fontSize: u(13.3), lineHeight: 1.47, whiteSpace: 'nowrap' }}>
                For successfully completing the AI Fundamentals Program, demonstrating strong commitment,<br />
                performance, and dedication throughout the training conducted by Welile<br />
                <a href="https://welile.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                    Technologies
                </a>{' '}
                School of AI in {monthYear(issuedAt)}.
            </p>

            {/* Director */}
            <p className="absolute" style={{ left: u(90), top: u(441), fontSize: u(13.2) }}>Director</p>
            <img
                src="/cert/signature-director.png"
                alt="Signature of Collines Tumwiine, Director"
                className="absolute"
                style={{ left: u(94), top: u(458), width: u(124) }}
            />
            <div className="absolute" style={{ left: u(90), top: u(518), width: u(100), height: u(1), background: '#555' }} />
            <p className="absolute" style={{ left: u(90), top: u(522), fontFamily: '"Montserrat", ' + BODY, fontSize: u(12.2), fontWeight: 500, letterSpacing: '0.01em' }}>
                COLLINES TUMWIINE
            </p>

            {/* Verification QR, where the seal used to sit */}
            <div className="absolute flex flex-col items-center" style={{ left: u(364), top: u(414), width: u(132) }}>
                <div
                    style={{
                        width: u(132), height: u(132), padding: u(10), background: '#ffffff', borderRadius: u(16),
                        border: `${u(1.1)} solid #d9ccf2`, boxShadow: `0 ${u(2)} ${u(8)} rgba(73, 30, 138, 0.12)`,
                    }}
                >
                    <VerifyQr url={verifyUrlFor(certId)} />
                </div>
                <p style={{ marginTop: u(6), fontFamily: BODY, fontSize: u(7.8), fontWeight: 700, letterSpacing: '0.16em', color: '#491e8a', textAlign: 'center' }}>SCAN TO VERIFY</p>
                <p className="font-mono" style={{ marginTop: u(1.6), fontSize: u(5.6), color: '#6b6580', letterSpacing: '0.04em', textAlign: 'center', whiteSpace: 'nowrap' }}>{certId}</p>
            </div>

            {/* School of AI */}
            <div className="absolute flex items-center" style={{ left: u(640), top: u(509), gap: u(7) }}>
                <span
                    style={{
                        fontFamily: ROUND,
                        fontSize: u(34),
                        lineHeight: 1,
                        background: 'linear-gradient(90deg, #7aa9f2 0%, #78c2f3 100%)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                    }}
                >
                    School of
                </span>
                <img src="/cert/ai-icon.png" alt="AI" style={{ height: u(40) }} />
            </div>

            {(sample || provisional) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="uppercase font-bold -rotate-12" style={{ fontSize: '11cqw', letterSpacing: '0.2em', color: 'rgba(100,100,120,0.18)' }}>
                        {sample ? 'Sample' : 'Pending'}
                    </span>
                </div>
            )}
        </div>
    );
};

export default CertificateDocument;
