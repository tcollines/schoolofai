const axios = require('axios');

let cachedRate = null;
let lastFetched = 0;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache
const RATE_MARKUP = 300; // 300 UGX increase over live dollar rate
const FALLBACK_BASE_RATE = 3700;

/**
 * Fetches the live USD to UGX exchange rate and adds a 300 UGX markup.
 * Example: if live rate is 4000 UGX, the effective conversion rate is 4300 UGX.
 */
async function getLiveUsdToUgxRate() {
    const now = Date.now();
    if (cachedRate && (now - lastFetched < CACHE_TTL_MS)) {
        return cachedRate;
    }

    let baseRate = FALLBACK_BASE_RATE;

    try {
        const res = await axios.get('https://open.er-api.com/v6/latest/USD', { timeout: 6000 });
        if (res.data?.rates?.UGX && typeof res.data.rates.UGX === 'number') {
            baseRate = Math.round(res.data.rates.UGX);
        }
    } catch (e1) {
        try {
            const res2 = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', { timeout: 6000 });
            if (res2.data?.rates?.UGX && typeof res2.data.rates.UGX === 'number') {
                baseRate = Math.round(res2.data.rates.UGX);
            }
        } catch (e2) {
            console.warn('[Currency] Exchange rate API unavailable, falling back to base rate:', baseRate);
        }
    }

    const effectiveRate = baseRate + RATE_MARKUP;

    cachedRate = {
        currency: 'UGX',
        baseRate,
        markup: RATE_MARKUP,
        effectiveRate,
        formula: `live_rate (${baseRate}) + ${RATE_MARKUP} = ${effectiveRate} UGX/USD`,
        timestamp: new Date().toISOString()
    };

    lastFetched = now;
    console.log(`[Currency] Live USD/UGX rate updated: Base ${baseRate} + ${RATE_MARKUP} = ${effectiveRate} UGX`);
    return cachedRate;
}

/**
 * Converts a USD amount to UGX using live dollar rate + 300 UGX.
 */
async function convertUsdToUgx(usdAmount) {
    const rateInfo = await getLiveUsdToUgxRate();
    return Math.round(usdAmount * rateInfo.effectiveRate);
}

module.exports = {
    getLiveUsdToUgxRate,
    convertUsdToUgx,
    RATE_MARKUP
};
