import React, { useEffect } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { setReferral, logReferralClick } from '../../src/lib/acquisition';

/**
 * Staff short link: /r/<slug>  ->  records the referral (first touch wins) and sends the visitor on
 * to the free course page (or ?to=/some/path). The student never sees a "ref" parameter.
 */
const ReferralRedirect: React.FC = () => {
    const { slug = '' } = useParams();
    const [params] = useSearchParams();
    const requested = params.get('to') || '';
    // only allow internal paths
    const target = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/free/ai-fundamentals';

    useEffect(() => {
        if (slug) {
            setReferral(slug);
            void logReferralClick(slug.toLowerCase(), target);
        }
    }, [slug, target]);

    return <Navigate to={target} replace />;
};

export default ReferralRedirect;
