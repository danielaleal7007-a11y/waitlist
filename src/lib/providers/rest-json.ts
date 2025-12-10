import {
  ProviderAdapter,
  ProviderService,
  ProviderOrder,
  CreateOrderParams,
  ProviderConfig,
} from './types'

/**
 * Generic REST JSON provider adapter
 * Compatible with most SMM panel APIs
 */
export class RestJsonProviderAdapter implements ProviderAdapter {
  name: string
  type: 'REST_JSON' = 'REST_JSON'
  private config: ProviderConfig

  constructor(config: ProviderConfig) {
    this.config = config
    this.name = config.name
  }

  private async makeRequest(
    action: string,
    params: Record<string, any> = {}
  ): Promise<any> {
    const url = new URL(this.config.baseUrl)
    url.searchParams.set('key', this.config.apiKey)
    url.searchParams.set('action', action)

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value))
    })

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.meta?.headers || {}),
        },
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        throw new Error(`Provider API error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeout)
      throw error
    }
  }

  async getServices(): Promise<ProviderService[]> {
    try {
      const data = await this.makeRequest('services')

      if (!Array.isArray(data)) {
        throw new Error('Invalid response format')
      }

      return data.map((service: any) => ({
        id: String(service.service),
        name: service.name,
        category: service.category || 'Other',
        rate: parseFloat(service.rate) * this.config.rateMultiplier,
        min: parseInt(service.min, 10),
        max: parseInt(service.max, 10),
        description: service.description,
      }))
    } catch (error) {
      console.error('Provider getServices error:', error)
      throw error
    }
  }

  async createOrder(params: CreateOrderParams): Promise<ProviderOrder> {
    try {
      const data = await this.makeRequest('add', {
        service: params.service,
        link: params.link,
        quantity: params.quantity,
        ...(params.runs && { runs: params.runs }),
        ...(params.interval && { interval: params.interval }),
      })

      return {
        orderId: String(data.order),
        status: 'pending',
        charge: data.charge,
      }
    } catch (error) {
      console.error('Provider createOrder error:', error)
      throw error
    }
  }

  async getOrderStatus(orderId: string): Promise<ProviderOrder> {
    try {
      const data = await this.makeRequest('status', {
        order: orderId,
      })

      let status: ProviderOrder['status'] = 'pending'
      
      const statusMap: Record<string, ProviderOrder['status']> = {
        'Pending': 'pending',
        'In progress': 'processing',
        'Processing': 'processing',
        'Partial': 'partial',
        'Completed': 'completed',
        'Canceled': 'canceled',
        'Refunded': 'refunded',
      }

      status = statusMap[data.status] || 'pending'

      return {
        orderId: String(data.order),
        status,
        startCount: data.start_count,
        remains: data.remains,
        charge: data.charge,
      }
    } catch (error) {
      console.error('Provider getOrderStatus error:', error)
      throw error
    }
  }

  async getBalance(): Promise<number | null> {
    try {
      const data = await this.makeRequest('balance')
      return parseFloat(data.balance) || null
    } catch (error) {
      console.error('Provider getBalance error:', error)
      return null
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getBalance()
      return true
    } catch (error) {
      return false
    }
  }
}

// Mock provider for testing
export class MockProviderAdapter implements ProviderAdapter {
  name = 'Mock Provider'
  type: 'REST_JSON' = 'REST_JSON'

  async getServices(): Promise<ProviderService[]> {
    return [
      {
        id: '1',
        name: 'Instagram Followers',
        category: 'Instagram',
        rate: 0.5,
        min: 100,
        max: 10000,
        description: 'High quality Instagram followers',
      },
      {
        id: '2',
        name: 'TikTok Likes',
        category: 'TikTok',
        rate: 0.3,
        min: 100,
        max: 50000,
        description: 'Real TikTok likes',
      },
      {
        id: '3',
        name: 'YouTube Views',
        category: 'YouTube',
        rate: 0.8,
        min: 100,
        max: 100000,
        description: 'Organic YouTube views',
      },
    ]
  }

  async createOrder(params: CreateOrderParams): Promise<ProviderOrder> {
    return {
      orderId: `mock_${Date.now()}`,
      status: 'pending',
      charge: 10.0,
    }
  }

  async getOrderStatus(orderId: string): Promise<ProviderOrder> {
    return {
      orderId,
      status: 'completed',
      startCount: 100,
      remains: 0,
      charge: 10.0,
    }
  }

  async getBalance(): Promise<number | null> {
    return 1000.0
  }

  async testConnection(): Promise<boolean> {
    return true
  }
}
