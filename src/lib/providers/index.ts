import { ProviderAdapter, ProviderConfig } from './types'
import { RestJsonProviderAdapter, MockProviderAdapter } from './rest-json'

export function createProviderAdapter(config: ProviderConfig): ProviderAdapter {
  switch (config.type) {
    case 'REST_JSON':
      return new RestJsonProviderAdapter(config)
    default:
      throw new Error(`Unsupported provider type: ${config.type}`)
  }
}

export function createMockProvider(): ProviderAdapter {
  return new MockProviderAdapter()
}

export * from './types'
export { RestJsonProviderAdapter, MockProviderAdapter }
