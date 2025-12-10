// Payment adapter interfaces

export interface PaymentSession {
  id: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  redirectUrl?: string
  paymentUrl?: string
  metadata?: Record<string, any>
}

export interface PaymentWebhookEvent {
  id: string
  type: string
  data: any
  signature?: string
  timestamp: number
}

export interface PaymentAdapter {
  name: string
  
  // Create a payment session
  createPaymentSession(params: {
    amount: number
    currency: string
    orderId?: string
    userId: string
    callbackUrl: string
    metadata?: Record<string, any>
  }): Promise<PaymentSession>
  
  // Verify webhook signature
  verifyWebhook(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): boolean
  
  // Handle webhook event
  handleWebhook(event: PaymentWebhookEvent): Promise<{
    paymentId: string
    status: 'pending' | 'completed' | 'failed'
    amount: number
    currency: string
    metadata?: Record<string, any>
  }>
  
  // Get payment status
  getPaymentStatus(paymentId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
    amount: number
    currency: string
  }>
  
  // Refund payment (optional)
  refundPayment?(paymentId: string, amount?: number): Promise<{
    success: boolean
    refundId: string
  }>
}
