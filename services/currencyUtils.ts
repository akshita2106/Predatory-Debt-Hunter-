
export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.78,
  INR: 83.12,
  JPY: 149.50,
  AUD: 1.53,
  CAD: 1.35,
};

/**
 * Converts an amount from a base currency (USD) to a target currency.
 * @param amount Amount in USD
 * @param targetCurrency Target currency code (e.g., 'INR')
 * @returns Converted amount
 */
export const convertFromBase = (amount: number, targetCurrency: string): number => {
  const rate = EXCHANGE_RATES[targetCurrency] || 1;
  return amount * rate;
};

/**
 * Converts an amount from a source currency to the base currency (USD).
 * @param amount Amount in source currency
 * @param sourceCurrency Source currency code
 * @returns Amount in USD
 */
export const convertToBase = (amount: number, sourceCurrency: string): number => {
  const rate = EXCHANGE_RATES[sourceCurrency] || 1;
  return amount / rate;
};

/**
 * Formats a number as currency.
 * @param amount Numerical amount
 * @param symbol Currency symbol (e.g., '$')
 * @param code Currency code (e.g., 'USD')
 * @returns Formatted string
 */
export const formatCurrency = (amount: number, symbol: string, code: string): string => {
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
