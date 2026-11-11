import React from 'react';

/** "Welile Technologies" as a quiet link to welile.com (inherits colour; only a faint dotted underline). */
const WelileTechLink: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <a
        href="https://welile.com/"
        target="_blank"
        rel="noopener noreferrer"
        className={`underline decoration-dotted decoration-1 underline-offset-[3px] decoration-stone-400 hover:decoration-solid ${className}`}
    >
        {children ?? 'Welile Technologies'}
    </a>
);

export default WelileTechLink;

/** Turns every "Welile Technologies" inside a plain string into a quiet link. */
export const linkifyWelileTech = (text: string): React.ReactNode =>
    text.split('Welile Technologies').flatMap((part, i, arr) =>
        i < arr.length - 1 ? [part, <WelileTechLink key={i} />] : [part]
    );
