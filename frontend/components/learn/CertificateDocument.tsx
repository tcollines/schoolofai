import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { COURSE } from '../../src/content/aiFundamentals';

interface Props {
    name: string;
    courseTitle: string;
    issuedAt: string;
    certId: string;
    sample?: boolean;
    provisional?: boolean;
}

const dateLong = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Kampala' });

/**
 * The certificate itself. Sized in container-query units so it scales cleanly from a phone to a print page.
 * Signature images are optional: set `signatureUrl` on each signatory in COURSE.signatories.
 */
const CertificateDocument: React.FC<Props> = ({ name, courseTitle, issuedAt, certId, sample, provisional }) => {
    const [qr, setQr] = useState<string>('');
    const verifyUrl = `${window.location.origin}/verify/${certId}`;

    useEffect(() => {
        let cancelled = false;
        QRCode.toDataURL(verifyUrl, { margin: 0, width: 240, color: { dark: '#1c1917', light: '#00000000' } })
            .then(url => { if (!cancelled) setQr(url); })
            .catch(() => undefined);
        return () => { cancelled = true; };
    }, [verifyUrl]);

    const serif = { fontFamily: '"Source Serif 4", Georgia, serif' } as React.CSSProperties;
    const script = { fontFamily: '"Snell Roundhand", "Brush Script MT", "Segoe Script", cursive' } as React.CSSProperties;

    return (
        <div
            className="cert-print-area w-full bg-[#fffdf8] text-[#1c1917] relative select-none"
            style={{ aspectRatio: '297 / 210', containerType: 'inline-size' }}
        >
            {/* borders */}
            <div className="absolute inset-[2.2cqw] border-[0.35cqw] border-violet-800" />
            <div className="absolute inset-[3.2cqw] border-[0.12cqw] border-violet-800/50" />

            <div className="absolute inset-[4.6cqw] flex flex-col items-center text-center">
                {/* header */}
                <div className="flex items-center justify-center gap-[3cqw] w-full">
                    <img src="/schoolofai-logo.png" alt="Welile School of AI" style={{ height: '6.2cqw' }} className="object-contain" />
                </div>

                <p className="uppercase tracking-[0.35em] text-violet-800 font-semibold" style={{ fontSize: '1.25cqw', marginTop: '1.8cqw' }}>Certificate of Completion</p>

                <p style={{ ...serif, fontSize: '1.5cqw', marginTop: '2.2cqw' }} className="text-stone-600">This certifies that</p>
                <p style={{ ...serif, fontSize: '5cqw', lineHeight: 1.1, marginTop: '0.9cqw' }} className="font-semibold">{name || 'Your Name'}</p>
                <div className="bg-violet-800/40" style={{ height: '0.1cqw', width: '38cqw', marginTop: '1cqw' }} />

                <p style={{ ...serif, fontSize: '1.5cqw', marginTop: '1.6cqw' }} className="text-stone-600">has successfully completed the free course</p>
                <p style={{ ...serif, fontSize: '3cqw', lineHeight: 1.15, marginTop: '0.8cqw' }} className="font-semibold text-violet-900">{courseTitle}</p>
                <p style={{ fontSize: '1.2cqw', marginTop: '1cqw' }} className="text-stone-600">A free course sponsored by <span className="font-semibold">{COURSE.sponsor}</span></p>

                {/* footer */}
                <div className="mt-auto w-full grid grid-cols-[1fr_auto_1fr] items-end" style={{ gap: '2cqw' }}>
                    {COURSE.signatories.slice(0, 1).map(s => (
                        <Signature key={s.name} {...s} script={script} />
                    ))}

                    <div className="flex flex-col items-center">
                        {qr ? <img src={qr} alt="QR code to verify this certificate" style={{ width: '7.5cqw', height: '7.5cqw' }} /> : <div style={{ width: '7.5cqw', height: '7.5cqw' }} />}
                        <p style={{ fontSize: '0.95cqw', marginTop: '0.6cqw' }} className="text-stone-600">Scan to verify</p>
                    </div>

                    {COURSE.signatories.slice(1, 2).map(s => (
                        <Signature key={s.name} {...s} script={script} />
                    ))}
                </div>

                <div className="w-full flex justify-between text-stone-600" style={{ fontSize: '1cqw', marginTop: '1.4cqw' }}>
                    <span>Issued {dateLong(issuedAt)}</span>
                    <span className="font-mono tracking-wide">ID {certId}</span>
                    <span>{window.location.host}/verify</span>
                </div>
            </div>

            {(sample || provisional) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="uppercase font-bold text-stone-400/25 -rotate-12" style={{ fontSize: '11cqw', letterSpacing: '0.2em' }}>
                        {sample ? 'Sample' : 'Pending'}
                    </span>
                </div>
            )}
        </div>
    );
};

const Signature: React.FC<{ name: string; title: string; signatureUrl?: string; script: React.CSSProperties }> = ({ name, title, signatureUrl, script }) => (
    <div className="flex flex-col items-center">
        <div className="flex items-end justify-center" style={{ height: '5.2cqw' }}>
            {signatureUrl
                ? <img src={signatureUrl} alt={`Signature of ${name}`} style={{ maxHeight: '5.2cqw' }} className="object-contain" />
                : <span style={{ ...script, fontSize: '3cqw', lineHeight: 1 }} className="text-violet-950">{name}</span>}
        </div>
        <div className="bg-stone-700/60" style={{ height: '0.08cqw', width: '22cqw', marginTop: '0.4cqw' }} />
        <p style={{ fontSize: '1.3cqw', marginTop: '0.5cqw' }} className="font-semibold">{name}</p>
        <p style={{ fontSize: '1cqw' }} className="text-stone-600">{title}</p>
    </div>
);

export default CertificateDocument;
