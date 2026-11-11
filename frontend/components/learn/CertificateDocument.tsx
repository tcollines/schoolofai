import React from 'react';

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

const monthYear = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'Africa/Kampala' });

const HEAD = '"Outfit", "DM Sans", system-ui, sans-serif';
const BODY = '"DM Sans", "Inter", system-ui, sans-serif';
const ROUND = '"Chewy", "Baloo 2", "Comic Sans MS", cursive';

const Seal: React.FC = () => {
    // A rounded-petal rosette, as on the printed template
    const petals = 20;
    const ring = (base: number, amp: number) => {
        const pts: string[] = [];
        for (let i = 0; i < petals * 10; i++) {
            const a = (i / (petals * 10)) * Math.PI * 2;
            const r = base + amp * Math.abs(Math.cos((a * petals) / 2));
            pts.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`);
        }
        return pts.join(' ');
    };
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
            <polygon points={ring(43.6, 5.2)} fill="#cf6560" />
            <polygon points={ring(38.6, 4.4)} fill="none" stroke="#fff" strokeOpacity="0.9" strokeWidth="0.6" />
        </svg>
    );
};

/**
 * The certificate. Layout, wording, artwork and signature follow the approved Welile School of AI template;
 * only the name, issue month and certificate ID change per learner.
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
            <div className="absolute" style={{ left: u(88), top: u(112) }}>
                <p style={{ fontFamily: HEAD, fontSize: u(62), lineHeight: 1.05, fontWeight: 400, letterSpacing: '-0.005em' }}>Certificate</p>
                <p style={{ fontFamily: HEAD, fontSize: u(24.5), lineHeight: 1.2, fontWeight: 400, marginTop: u(2) }}>of Completion</p>
            </div>

            <p className="absolute" style={{ left: u(90), top: u(241), fontSize: u(13.2) }}>This certificate is awarded to</p>

            <p
                className="absolute"
                style={{ left: u(89), top: u(277), fontFamily: HEAD, fontSize: u(38), fontWeight: 300, lineHeight: 1.1, letterSpacing: '0.005em', whiteSpace: 'nowrap' }}
            >
                {shown}
            </p>

            <p className="absolute" style={{ left: u(90), top: u(340), width: u(584), fontSize: u(13.2), lineHeight: 1.45 }}>
                For successfully completing the AI Fundamentals Program, demonstrating strong commitment, performance, and dedication
                throughout the six-week training conducted by{' '}
                <a
                    href="https://welile.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                >
                    Welile Technologies
                </a>{' '}
                School of AI in {monthYear(issuedAt)}.
            </p>

            {/* Director */}
            <p className="absolute" style={{ left: u(90), top: u(450), fontSize: u(13.2) }}>Director</p>
            <img
                src="/cert/signature-director.png"
                alt="Signature of Collines Tumwiine, Director"
                className="absolute"
                style={{ left: u(94), top: u(463), width: u(124) }}
            />
            <div className="absolute" style={{ left: u(90), top: u(523), width: u(100), height: u(1), background: '#555' }} />
            <p className="absolute" style={{ left: u(90), top: u(531), fontFamily: '"Montserrat", ' + BODY, fontSize: u(12.2), fontWeight: 500, letterSpacing: '0.01em' }}>
                COLLINES TUMWIINE
            </p>

            {/* Seal */}
            <div className="absolute" style={{ left: u(355), top: u(413), width: u(152), height: u(152) }}>
                <Seal />
            </div>

            {/* School of AI */}
            <div className="absolute flex items-center" style={{ left: u(640), top: u(513), gap: u(7) }}>
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

            {/* Certificate ID: small and quiet, for verification */}
            <p className="absolute font-mono" style={{ left: u(90), top: u(566), fontSize: u(7), color: '#7a7a85', letterSpacing: '0.03em' }}>
                Certificate ID {certId} · Verify at {typeof window !== 'undefined' ? window.location.host : 'welileschoolofai.org'}/verify/{certId}
            </p>

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
