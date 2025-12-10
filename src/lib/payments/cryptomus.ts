import crypto from 'crypto'
import { PaymentAdapter, PaymentSession, PaymentWebhookEvent } from './types'

export class CryptomusAdapter implements PaymentAdapter {
  name = 'Cryptomus'
  private baseUrl: string
  private apiKey: string
  private merchantId: string

  constructor() {
    this.baseUrl = process.env.CRYPTOMUS_BASE_URL || 'https://api.cryptomus.com/v1'
    this.apiKey = process.env.CRYPTOMUS_API_KEY || ''
    this.merchantId = process.env.CRYPTOMUS_MERCHANT_ID || ''
  }

  private generateSignature(data: any): string {
    const jsonData = JSON.stringify(data)
    const base64Data = Buffer.from(jsonData).toString('base64')
    return crypto
      .createHash('md5')
      .update(base64Data + this.apiKey)
      .digest('hex')
  }

  async createPaymentSession(params: {
    amount: number
    currency: string
    orderId?: string
    userId: string
    callbackUrl: string
    metadata?: Record<string, any>
  }): Promise<PaymentSession> {
    try {
      const data = {
        amount: params.amount.toString(),
        currency: params.currency,
        order_id: params.orderId || `order_${Date.now()}`,
        url_return: params.callbackUrl,
        url_callback: params.callbackUrl,
        lifetime: 3600, // 1 hour
      }

      const signature = this.generateSignature(data)

      const response = await fetch(`${this.baseUrl}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'merchant': this.merchantId,
          'sign': signature,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Cryptomus API error: ${response.statusText}`)
      }

      const result = await response.json()

      return {
        id: result.result.order_id,
        amount: params.amount,
        currency: params.currency,
        status: 'pending',
        paymentUrl: result.result.url,
        metadata: result.result,
      }
    } catch (error) {
      console.error('Cryptomus createPaymentSession error:', error)
      throw error
    }
  }

  verifyWebhook(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): boolean {
    try {
      const data = JSON.parse(typeof payload === 'string' ? payload : payload.toString())
      const base64Data = Buffer.from(JSON.stringify(data)).toString('base64')
      const expectedSignature = crypto
        .createHash('md5')
        .update(base64Data + (secret || process.env.CRYPTOMUS_WEBHOOK_SECRET || ''))
        .digest('hex')

      return expectedSignature === signature
    } catch (error) {
      console.error('Cryptomus webhook verification error:', error)
      return false
    }
  }

  async handleWebhook(event: PaymentWebhookEvent): Promise<{
    paymentId: string
    status: 'pending' | 'completed' | 'failed'
    amount: number
    currency: string
    metadata?: Record<string, any>
  }> {
    const eventData = event.data

    let status: 'pending' | 'completed' | 'failed' = 'pending'
    
    if (eventData.status === 'paid' || eventData.status === 'paid_over') {
      status = 'completed'
    } else if (eventData.status === 'cancel' || eventData.status === 'system_fail' || eventData.status === 'fail') {
      status = 'failed'
    }

    return {
      paymentId: eventData.order_id,
      status,
      amount: parseFloat(eventData.amount),
      currency: eventData.currency,
      metadata: eventData,
    }
  }

  async getPaymentStatus(paymentId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
    amount: number
    currency: string
  }> {
    try {
      const data = {
        order_id: paymentId,
      }

      const signature = this.generateSignature(data)

      const response = await fetch(
        `${this.baseUrl}/payment/info`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'merchant': this.merchantId,
            'sign': signature,
          },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) {
        throw new Error(`Cryptomus API error: ${response.statusText}`)
      }

      const result = await response.json()
      const payment = result.result

      let status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' = 'pending'
      
      switch (payment.status) {
        case 'paid':
        case 'paid_over':
          status = 'completed'
          break
        case 'cancel':
        case 'system_fail':
        case 'fail':
          status = 'failed'
          break
        case 'process':
        case 'check':
        case 'confirm_check':
          status = 'processing'
          break
        case 'refund_process':
        case 'refund_fail':
        case 'refund_paid':
          status = 'refunded'
          break
        default:
          status = 'pending'
      }

      return {
        status,
        amount: parseFloat(payment.amount),
        currency: payment.currency,
      }
    } catch (error) {
      console.error('Cryptomus getPaymentStatus error:', error)
      throw error
    }
  }
}
