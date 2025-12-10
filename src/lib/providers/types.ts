// Provider adapter interfaces for SMM services

export interface ProviderService {
  id: string
  name: string
  category: string
  rate: number
  min: number
  max: number
  description?: string
}

export interface ProviderOrder {
  orderId: string
  status: 'pending' | 'processing' | 'partial' | 'completed' | 'canceled' | 'refunded'
  startCount?: number
  remains?: number
  charge?: number
}

export interface CreateOrderParams {
  service: string
  link: string
  quantity: number
  runs?: number
  interval?: number
}

export interface ProviderAdapter {
  name: string
  type: 'REST_JSON' | 'REST_XML' | 'SOAP'
  
  // Get available services
  getServices(): Promise<ProviderService[]>
  
  // Create an order
  createOrder(params: CreateOrderParams): Promise<ProviderOrder>
  
  // Get order status
  getOrderStatus(orderId: string): Promise<ProviderOrder>
  
  // Get provider balance (if supported)
  getBalance(): Promise<number | null>
  
  // Test connection
  testConnection(): Promise<boolean>
}

export interface ProviderConfig {
  id: string
  name: string
  type: 'REST_JSON' | 'REST_XML' | 'SOAP'
  baseUrl: string
  apiKey: string
  meta?: {
    headers?: Record<string, string>
    mapping?: {
      services?: string
      order?: string
      status?: string
    }
  }
  rateMultiplier: number
  timeout: number
  maxConcurrency: number
}
