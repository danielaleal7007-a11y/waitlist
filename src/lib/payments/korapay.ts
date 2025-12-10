import crypto from 'crypto'
import { PaymentAdapter, PaymentSession, PaymentWebhookEvent } from './types'

export class KorapayAdapter implements PaymentAdapter {
  name = 'Korapay'
  private baseUrl: string
  private publicKey: string
  private secretKey: string

  constructor() {
    this.baseUrl = process.env.KORAPAY_BASE_URL || 'https://api.korapay.com/merchant/api/v1'
    this.publicKey = process.env.KORAPAY_PUBLIC_KEY || ''
    this.secretKey = process.env.KORAPAY_SECRET_KEY || ''
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
      const response = await fetch(`${this.baseUrl}/charges/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.secretKey}`,
        },
        body: JSON.stringify({
          amount: params.amount,
          currency: params.currency,
          redirect_url: params.callbackUrl,
          reference: params.orderId || `order_${Date.now()}`,
          customer: {
            email: `user_${params.userId}@smmpanel.com`, // Should be actual user email
          },
          metadata: params.metadata,
        }),
      })

      if (!response.ok) {
        throw new Error(`Korapay API error: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        id: data.data.reference,
        amount: params.amount,
        currency: params.currency,
        status: 'pending',
        paymentUrl: data.data.checkout_url,
        metadata: data.data,
      }
    } catch (error) {
      console.error('Korapay createPaymentSession error:', error)
      throw error
    }
  }

  verifyWebhook(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): boolean {
    try {
      const hash = crypto
        .createHmac('sha256', secret || process.env.KORAPAY_WEBHOOK_SECRET || '')
        .update(typeof payload === 'string' ? payload : payload.toString())
        .digest('hex')

      return hash === signature
    } catch (error) {
      console.error('Korapay webhook verification error:', error)
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
    
    if (eventData.status === 'success') {
      status = 'completed'
    } else if (eventData.status === 'failed') {
      status = 'failed'
    }

    return {
      paymentId: eventData.reference,
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
      const response = await fetch(
        `${this.baseUrl}/charges/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Korapay API error: ${response.statusText}`)
      }

      const data = await response.json()
      const charge = data.data

      let status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' = 'pending'
      
      switch (charge.status) {
        case 'success':
          status = 'completed'
          break
        case 'failed':
          status = 'failed'
          break
        case 'processing':
          status = 'processing'
          break
        default:
          status = 'pending'
      }

      return {
        status,
        amount: parseFloat(charge.amount),
        currency: charge.currency,
      }
    } catch (error) {
      console.error('Korapay getPaymentStatus error:', error)
      throw error
    }
  }
}
