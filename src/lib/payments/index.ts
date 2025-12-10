import { PaymentAdapter } from './types'
import { KorapayAdapter } from './korapay'
import { CryptomusAdapter } from './cryptomus'

const adapters: Map<string, PaymentAdapter> = new Map()

// Initialize adapters
adapters.set('korapay', new KorapayAdapter())
adapters.set('cryptomus', new CryptomusAdapter())

export function getPaymentAdapter(provider: string): PaymentAdapter {
  const adapter = adapters.get(provider.toLowerCase())
  
  if (!adapter) {
    throw new Error(`Payment adapter not found for provider: ${provider}`)
  }
  
  return adapter
}

export function getAllPaymentAdapters(): PaymentAdapter[] {
  return Array.from(adapters.values())
}

export { KorapayAdapter, CryptomusAdapter }
export * from './types'
