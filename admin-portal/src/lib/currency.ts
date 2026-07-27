// Currency utility for converting and formatting USD and UGX

export type CurrencyType = 'USD' | 'UGX';

const EXCHANGE_RATE = 3700; // 1 USD = 3700 UGX

export const getCurrencyPreference = (): CurrencyType => {
  return (localStorage.getItem('schoolofai-currency') as CurrencyType) || 'USD';
};

export const setCurrencyPreference = (currency: CurrencyType) => {
  localStorage.setItem('schoolofai-currency', currency);
  window.dispatchEvent(new Event('currency-change'));
};

export const convertAmount = (usdAmount: number): number => {
  const currency = getCurrencyPreference();
  if (currency === 'UGX') {
    return Math.round(usdAmount * EXCHANGE_RATE);
  }
  return usdAmount;
};

export const formatAmount = (usdAmount: number): string => {
  const currency = getCurrencyPreference();
  if (currency === 'UGX') {
    const ugxAmount = Math.round(usdAmount * EXCHANGE_RATE);
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
