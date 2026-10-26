// Currency utility for converting and formatting USD and UGX
// Features a live dollar exchange rate with a +300 UGX increase.
// Example: If live market rate is 4,000 UGX, the platform converts at 4,300 UGX.

export type CurrencyType = 'USD' | 'UGX';

export const RATE_MARKUP = 300; // 300 UGX increase
const FALLBACK_BASE_RATE = 3700;
const FALLBACK_EFFECTIVE_RATE = FALLBACK_BASE_RATE + RATE_MARKUP; // 4000 UGX

// In-memory active exchange rate (defaults to cached or fallback)
let currentBaseRate: number = (() => {
  const cached = localStorage.getItem('schoolofai-base-rate');
  return cached ? Number(cached) : FALLBACK_BASE_RATE;
})();

let currentEffectiveRate: number = (() => {
  const cached = localStorage.getItem('schoolofai-effective-rate');
  return cached ? Number(cached) : (currentBaseRate + RATE_MARKUP);
})();

export const getBaseExchangeRate = (): number => currentBaseRate;
export const getExchangeRate = (): number => currentEffectiveRate;
export const getMarkup = (): number => RATE_MARKUP;

/**
 * Fetches the live USD to UGX exchange rate and adds the +300 UGX increase.
 * Uses local caching (30 mins) to prevent excessive network requests.
 */
export const fetchLiveExchangeRate = async (forceRefresh = false): Promise<number> => {
  const lastFetched = Number(localStorage.getItem('schoolofai-rate-timestamp') || '0');
  const now = Date.now();
  const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  if (!forceRefresh && (now - lastFetched < CACHE_TTL) && currentEffectiveRate > 0) {
    return currentEffectiveRate;
  }

  let baseRate = FALLBACK_BASE_RATE;

  try {
    // 1. Try internal backend live currency endpoint
    const res = await fetch('/api/currency/rate');
    if (res.ok) {
      const data = await res.json();
      if (data.effectiveRate) {
        currentBaseRate = Number(data.baseRate) || (data.effectiveRate - RATE_MARKUP);
        currentEffectiveRate = Number(data.effectiveRate);
        saveRateCache(currentBaseRate, currentEffectiveRate);
        return currentEffectiveRate;
      }
    }
  } catch (err) {
    console.warn('[Currency] Backend rate endpoint unavailable, trying direct API:', err);
  }

  // 2. Direct public rate fallback
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (res.ok) {
      const data = await res.json();
      if (data.rates?.UGX) {
        baseRate = Math.round(data.rates.UGX);
      }
    }
  } catch (err2) {
    try {
      const res2 = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (res2.ok) {
        const data2 = await res2.json();
        if (data2.rates?.UGX) {
          baseRate = Math.round(data2.rates.UGX);
        }
      }
    } catch (err3) {
      console.warn('[Currency] All live rate APIs failed, using fallback base rate:', baseRate);
    }
  }

  currentBaseRate = baseRate;
  currentEffectiveRate = baseRate + RATE_MARKUP;
  saveRateCache(currentBaseRate, currentEffectiveRate);
  return currentEffectiveRate;
};

function saveRateCache(base: number, effective: number) {
  localStorage.setItem('schoolofai-base-rate', String(base));
  localStorage.setItem('schoolofai-effective-rate', String(effective));
  localStorage.setItem('schoolofai-rate-timestamp', String(Date.now()));
  window.dispatchEvent(new Event('currency-change'));
}

// Auto-trigger live rate refresh in the background
if (typeof window !== 'undefined') {
  setTimeout(() => {
    fetchLiveExchangeRate().catch((e) => console.warn('Background rate fetch warning:', e));
  }, 100);
}

export const getCurrencyPreference = (): CurrencyType => {
  return (localStorage.getItem('schoolofai-currency') as CurrencyType) || 'USD';
};

export const setCurrencyPreference = (currency: CurrencyType) => {
  localStorage.setItem('schoolofai-currency', currency);
  window.dispatchEvent(new Event('currency-change'));
};

/**
 * Converts USD amount to UGX (using live rate + 300 UGX markup).
 */
export const convertAmount = (usdAmount: number): number => {
  const currency = getCurrencyPreference();
  if (currency === 'UGX') {
    return Math.round(usdAmount * currentEffectiveRate);
  }
  return usdAmount;
};

/**
 * Formats a USD amount according to active currency preference (USD or live UGX with markup).
 */
export const formatAmount = (usdAmount: number): string => {
  const currency = getCurrencyPreference();
  if (currency === 'UGX') {
    const ugxAmount = Math.round(usdAmount * currentEffectiveRate);
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      maximumFractionDigits: 0
    }).format(ugxAmount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(usdAmount);
};

/**
 * Formats a raw amount in a specific currency.
 */
export const formatRawAmount = (amount: number, currency: CurrencyType): string => {
  if (currency === 'UGX') {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      maximumFractionDigits: 0
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};
