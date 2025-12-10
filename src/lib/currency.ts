// Currency conversion utilities with caching

const CACHE_KEY = 'currency_rates'
const CACHE_TTL = parseInt(process.env.EXCHANGE_RATE_CACHE_TTL || '3600', 10) * 1000

interface ExchangeRates {
  base: string
  rates: Record<string, number>
  timestamp: number
}

let ratesCache: ExchangeRates | null = null

export const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'NGN',
  'GHS',
  'KES',
  'ZAR',
  'BTC',
  'ETH',
  'USDT',
] as const

export type Currency = typeof SUPPORTED_CURRENCIES[number]

// Mock rates for development (fallback)
const MOCK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  NGN: 1550,
  GHS: 15.5,
  KES: 158,
  ZAR: 19.2,
  BTC: 0.000023,
  ETH: 0.00041,
  USDT: 1.001,
}

export async function fetchExchangeRates(): Promise<ExchangeRates> {
  // Check cache first
  if (ratesCache && Date.now() - ratesCache.timestamp < CACHE_TTL) {
    return ratesCache
  }

  const baseCurrency = process.env.BASE_CURRENCY || 'USD'
  const apiKey = process.env.EXCHANGE_RATE_API_KEY
  const apiUrl = process.env.EXCHANGE_RATE_API_URL

  if (!apiKey || !apiUrl) {
    console.warn('Exchange rate API not configured, using mock rates')
    ratesCache = {
      base: baseCurrency,
      rates: MOCK_RATES,
      timestamp: Date.now(),
    }
    return ratesCache
  }

  try {
    const response = await fetch(`${apiUrl}/${baseCurrency}?apikey=${apiKey}`, {
      next: { revalidate: CACHE_TTL / 1000 },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates')
    }

    const data = await response.json()
    ratesCache = {
      base: data.base || baseCurrency,
      rates: data.rates || MOCK_RATES,
      timestamp: Date.now(),
    }

    return ratesCache
  } catch (error) {
    console.error('Error fetching exchange rates:', error)
    // Return cached data if available, otherwise mock data
    if (ratesCache) {
      return ratesCache
    }
    
    ratesCache = {
      base: baseCurrency,
      rates: MOCK_RATES,
      timestamp: Date.now(),
    }
    return ratesCache
  }
}

export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  markup: number = 0
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount
  }

  const rates = await fetchExchangeRates()
  const fromRate = rates.rates[fromCurrency] || 1
  const toRate = rates.rates[toCurrency] || 1

  // Convert to base currency first, then to target currency
  const baseAmount = amount / fromRate
  const convertedAmount = baseAmount * toRate

  // Apply markup/fee
  const finalAmount = convertedAmount * (1 + markup / 100)

  return Math.round(finalAmount * 100) / 100
}

export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return 1
  }

  const rates = await fetchExchangeRates()
  const fromRate = rates.rates[fromCurrency] || 1
  const toRate = rates.rates[toCurrency] || 1

  return toRate / fromRate
}

export function formatCurrencyWithSymbol(
  amount: number,
  currency: string
): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    NGN: '₦',
    GHS: '₵',
    KES: 'KSh',
    ZAR: 'R',
    BTC: '₿',
    ETH: 'Ξ',
    USDT: '₮',
  }

  const symbol = symbols[currency] || currency
  const formatted = amount.toFixed(2)

  // Crypto currencies show more decimals
  if (['BTC', 'ETH'].includes(currency)) {
    return `${symbol}${amount.toFixed(8)}`
  }

  return `${symbol}${formatted}`
}

// Get currency markup from database or environment
export async function getCurrencyMarkup(currency: string): Promise<number> {
  // This would fetch from database in production
  // For now, return default markup
  const defaultMarkup = parseFloat(process.env.DEFAULT_CURRENCY_MARKUP || '0')
  return defaultMarkup
}

export function isCryptoCurrency(currency: string): boolean {
  return ['BTC', 'ETH', 'USDT', 'USDC', 'BNB'].includes(currency)
}
