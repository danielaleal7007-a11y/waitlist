# Payment Integration Guide

This guide covers integrating Korapay and Cryptomus payment gateways.

## Overview

SMM Panel supports multiple payment methods:
- **Korapay**: Card payments, bank transfers (NGN, USD, GHS, KES)
- **Cryptomus**: Cryptocurrency payments (BTC, ETH, USDT, etc.)
- **Wallet**: Internal wallet balance

## Korapay Integration

### Setup

1. Sign up at [korapay.com](https://korapay.com)
2. Verify your business
3. Get API credentials from dashboard

### Configuration

Add to `.env`:

```env
KORAPAY_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
KORAPAY_SECRET_KEY=sk_test_xxxxxxxxxxxxx
KORAPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
KORAPAY_BASE_URL=https://api.korapay.com/merchant/api/v1
```

### Payment Flow

1. User initiates payment
2. Create payment session via Korapay API
3. Redirect user to Korapay checkout
4. User completes payment
5. Korapay sends webhook
6. Verify webhook signature
7. Update order status
8. Credit user wallet

### Webhook Setup

1. Log in to Korapay dashboard
2. Go to Settings → Webhooks
3. Add webhook URL: `https://your-domain.com/api/webhooks/korapay`
4. Select events: `charge.success`, `charge.failed`
5. Copy webhook secret to `.env`

### Implementation

```typescript
// Create payment session
import { getPaymentAdapter } from '@/lib/payments'

const korapay = getPaymentAdapter('korapay')

const session = await korapay.createPaymentSession({
  amount: 100.00,
  currency: 'USD',
  orderId: 'order_123',
  userId: 'user_456',
  callbackUrl: 'https://your-domain.com/payment/callback',
  metadata: {
    order_id: 'order_123'
  }
})

// Redirect user
window.location.href = session.paymentUrl
```

### Webhook Handler

```typescript
// src/app/api/webhooks/korapay/route.ts
import { NextRequest } from 'next/server'
import { getPaymentAdapter } from '@/lib/payments'

export async function POST(req: NextRequest) {
  const korapay = getPaymentAdapter('korapay')
  const signature = req.headers.get('x-korapay-signature') || ''
  const payload = await req.text()
  
  // Verify signature
  const isValid = korapay.verifyWebhook(
    payload,
    signature,
    process.env.KORAPAY_WEBHOOK_SECRET!
  )
  
  if (!isValid) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }
  
  const event = JSON.parse(payload)
  
  // Handle webhook
  const result = await korapay.handleWebhook({
    id: event.event.id,
    type: event.event.type,
    data: event.data,
    timestamp: Date.now()
  })
  
  // Update order/payment
  await prisma.payment.update({
    where: { providerPaymentId: result.paymentId },
    data: {
      status: result.status === 'completed' ? 'COMPLETED' : 'FAILED',
      webhookVerified: true
    }
  })
  
  return Response.json({ received: true })
}
```

### Supported Currencies

- USD (United States Dollar)
- NGN (Nigerian Naira)
- GHS (Ghanaian Cedi)
- KES (Kenyan Shilling)
- ZAR (South African Rand)

### Test Cards

**Successful Payment:**
```
Card Number: 5123450000000008
CVV: 100
Expiry: 12/25
OTP: 123456
```

**Failed Payment:**
```
Card Number: 5060666666666666666
CVV: 100
Expiry: 12/25
```

## Cryptomus Integration

### Setup

1. Sign up at [cryptomus.com](https://cryptomus.com)
2. Create a merchant
3. Get API credentials

### Configuration

Add to `.env`:

```env
CRYPTOMUS_API_KEY=xxxxxxxxxxxxx
CRYPTOMUS_MERCHANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
CRYPTOMUS_WEBHOOK_SECRET=xxxxxxxxxxxxx
CRYPTOMUS_BASE_URL=https://api.cryptomus.com/v1
```

### Payment Flow

1. User selects crypto payment
2. Create invoice via Cryptomus API
3. Display payment page with QR code
4. User sends crypto to address
5. Cryptomus confirms transaction
6. Webhook sent to your server
7. Credit user wallet

### Webhook Setup

1. Log in to Cryptomus dashboard
2. Go to Settings → Notifications
3. Add webhook URL: `https://your-domain.com/api/webhooks/cryptomus`
4. Copy webhook secret

### Implementation

```typescript
import { getPaymentAdapter } from '@/lib/payments'

const cryptomus = getPaymentAdapter('cryptomus')

const session = await cryptomus.createPaymentSession({
  amount: 100.00,
  currency: 'USDT',
  orderId: 'order_123',
  userId: 'user_456',
  callbackUrl: 'https://your-domain.com/payment/callback'
})

// Display payment page
return (
  <div>
    <h2>Send {session.amount} USDT</h2>
    <QRCode value={session.paymentUrl} />
    <p>Address: {session.metadata.address}</p>
  </div>
)
```

### Webhook Handler

```typescript
// src/app/api/webhooks/cryptomus/route.ts
import { NextRequest } from 'next/server'
import { getPaymentAdapter } from '@/lib/payments'

export async function POST(req: NextRequest) {
  const cryptomus = getPaymentAdapter('cryptomus')
  const signature = req.headers.get('sign') || ''
  const payload = await req.text()
  
  // Verify signature
  const isValid = cryptomus.verifyWebhook(
    payload,
    signature,
    process.env.CRYPTOMUS_WEBHOOK_SECRET!
  )
  
  if (!isValid) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }
  
  const event = JSON.parse(payload)
  
  // Handle webhook
  const result = await cryptomus.handleWebhook({
    id: event.uuid,
    type: event.type,
    data: event,
    timestamp: Date.now()
  })
  
  // Update payment
  await prisma.payment.update({
    where: { providerPaymentId: result.paymentId },
    data: {
      status: result.status === 'completed' ? 'COMPLETED' : 'FAILED'
    }
  })
  
  return Response.json({ received: true })
}
```

### Supported Cryptocurrencies

- BTC (Bitcoin)
- ETH (Ethereum)
- USDT (Tether TRC20/ERC20)
- USDC (USD Coin)
- LTC (Litecoin)
- TRX (Tron)
- BNB (Binance Coin)

### Test Mode

Use testnet for development:

```env
CRYPTOMUS_BASE_URL=https://api.cryptomus.com/v1/test
```

## Wallet System

Internal wallet for storing credits.

### Add Funds

Users can add funds via:
- Korapay (card/bank)
- Cryptomus (crypto)
- Manual credit (admin only)

### Wallet Transactions

All wallet operations are logged:

```typescript
await prisma.walletTransaction.create({
  data: {
    userId: user.id,
    type: 'DEPOSIT',
    amount: 100.00,
    currency: 'USD',
    balanceBefore: user.walletBalance,
    balanceAfter: user.walletBalance + 100.00,
    description: 'Added funds via Korapay',
    reference: payment.id
  }
})
```

### Payment Priority

When placing orders:

1. Check wallet balance first
2. If insufficient, use payment gateway
3. Or use partial payment (wallet + gateway)

## Security

### Webhook Verification

Always verify webhook signatures:

```typescript
function verifyWebhook(payload: string, signature: string, secret: string) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return hash === signature
}
```

### Idempotency

Prevent duplicate processing:

```typescript
async function handleWebhook(eventId: string) {
  // Check if already processed
  const existing = await prisma.webhookLog.findUnique({
    where: { eventId }
  })
  
  if (existing?.processed) {
    return { success: true, message: 'Already processed' }
  }
  
  // Process webhook
  // ...
  
  // Mark as processed
  await prisma.webhookLog.update({
    where: { eventId },
    data: { processed: true }
  })
}
```

### IP Whitelisting

Restrict webhooks to provider IPs:

```typescript
const KORAPAY_IPS = ['52.31.139.75', '52.49.173.169']

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.ip
  
  if (!KORAPAY_IPS.includes(ip)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Process webhook
}
```

## Testing

### Test Webhook

Use tools to test webhooks locally:

**ngrok:**
```bash
ngrok http 3000
# Use ngrok URL for webhook: https://abc123.ngrok.io/api/webhooks/korapay
```

**Webhook.site:**
1. Go to webhook.site
2. Copy unique URL
3. Use as webhook endpoint
4. View incoming webhooks

### Manual Testing

Trigger test webhooks from provider dashboards:
- Korapay: Dashboard → Developers → Webhooks → Send Test
- Cryptomus: Settings → Notifications → Test Webhook

## Troubleshooting

### Webhook Not Received

1. Check webhook URL is publicly accessible
2. Verify SSL certificate is valid
3. Check firewall/security groups
4. Review webhook logs in provider dashboard

### Payment Stuck

1. Check webhook was received
2. Verify signature validation passed
3. Check payment status via API
4. Manual reconciliation if needed

### Duplicate Payments

1. Implement idempotency
2. Check eventId/transactionId
3. Refund duplicate charges

## Monitoring

Track payment metrics:

```typescript
// Payment success rate
const successRate = await prisma.payment.groupBy({
  by: ['status'],
  _count: true,
  where: {
    createdAt: {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }
  }
})

// Average processing time
const avgTime = await prisma.payment.aggregate({
  _avg: {
    processingTime: true
  },
  where: {
    status: 'COMPLETED'
  }
})
```

## Best Practices

1. **Always verify webhooks**: Never trust webhooks without verification
2. **Log everything**: Keep detailed logs of all payment operations
3. **Handle retries**: Implement exponential backoff for failed payments
4. **Notify users**: Send email/SMS for payment confirmations
5. **Reconcile daily**: Compare your records with provider reports
6. **Test thoroughly**: Use test mode extensively before going live
7. **Monitor closely**: Set up alerts for failed payments
8. **Keep keys secure**: Never commit API keys to version control

## Support

- Korapay Support: support@korapay.com
- Cryptomus Support: support@cryptomus.com
- Documentation: /docs/payments
