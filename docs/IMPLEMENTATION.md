# Implementation Guide for Remaining Features

This guide provides step-by-step instructions for implementing the remaining features of the SMM Panel.

## Phase 1: Authentication System

### 1.1 NextAuth Configuration

Create `/src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth'

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials?.email }
        })
        
        if (!user || !user.passwordHash) {
          throw new Error('Invalid credentials')
        }
        
        const isValid = await verifyPassword(
          credentials!.password,
          user.passwordHash
        )
        
        if (!isValid) {
          throw new Error('Invalid credentials')
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          role: user.role
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      session.user.role = token.role
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

### 1.2 Signup Page

Create `/src/app/(auth)/signup/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { validateEmail, validateUsername, validatePassword } from '@/lib/utils'

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    // Validation
    const newErrors: Record<string, string> = {}
    
    if (!formData.displayName) {
      newErrors.displayName = 'Name is required'
    }
    
    if (!validateUsername(formData.username)) {
      newErrors.username = 'Invalid username (3-20 alphanumeric characters)'
    }
    
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email address'
    }
    
    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.errors[0]
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        router.push('/auth/signin?registered=true')
      } else {
        setErrors({ general: data.error })
      }
    } catch (error) {
      setErrors({ general: 'An error occurred. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">Create Account</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Full Name"
              value={formData.displayName}
              onChange={(e) => setFormData({...formData, displayName: e.target.value})}
            />
            {errors.displayName && <p className="text-red-500 text-sm mt-1">{errors.displayName}</p>}
          </div>
          
          <div>
            <Input
              type="text"
              placeholder="Username"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
            {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
          </div>
          
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>
          
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>
          
          <div>
            <Input
              type="password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>
          
          {errors.general && (
            <div className="text-red-500 text-sm text-center">{errors.general}</div>
          )}
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>
        
        <p className="text-center text-sm">
          Already have an account?{' '}
          <a href="/auth/signin" className="text-purple-600 hover:underline">
            Sign In
          </a>
        </p>
      </div>
    </div>
  )
}
```

### 1.3 Signup API Route

Create `/src/app/api/auth/signup/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { validateEmail, validateUsername, validatePassword } from '@/lib/utils'
import { sendTemplateEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { displayName, username, email, password } = body
    
    // Validation
    if (!displayName || !validateUsername(username) || !validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      )
    }
    
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0] },
        { status: 400 }
      )
    }
    
    // Check existing user
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    })
    
    if (existing) {
      return NextResponse.json(
        { error: 'Email or username already exists' },
        { status: 400 }
      )
    }
    
    // Create user
    const passwordHash = await hashPassword(password)
    
    const user = await prisma.user.create({
      data: {
        displayName,
        username,
        email,
        passwordHash,
        role: 'USER'
      }
    })
    
    // Send welcome email
    await sendTemplateEmail({
      to: email,
      template: 'welcome',
      data: {
        displayName,
        username
      }
    })
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
```

## Phase 2: API Routes

### 2.1 Services API

Create `/src/app/api/v1/services/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const active = searchParams.get('active')
    
    const services = await prisma.service.findMany({
      where: {
        ...(category && { category }),
        ...(active !== null && { active: active === 'true' })
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        orderCount: 'desc'
      }
    })
    
    return NextResponse.json({
      success: true,
      data: services
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}
```

### 2.2 Orders API

Create `/src/app/api/v1/orders/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await req.json()
    const { service_id, link, quantity } = body
    
    // Get service
    const service = await prisma.service.findUnique({
      where: { id: service_id },
      include: { provider: true }
    })
    
    if (!service || !service.active) {
      return NextResponse.json(
        { error: 'Service not available' },
        { status: 400 }
      )
    }
    
    // Validate quantity
    if (quantity < service.minQuantity || quantity > service.maxQuantity) {
      return NextResponse.json(
        { error: `Quantity must be between ${service.minQuantity} and ${service.maxQuantity}` },
        { status: 400 }
      )
    }
    
    // Calculate price
    const totalPrice = service.displayPrice * (quantity / 1000)
    
    // Check balance
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })
    
    if (!user || user.walletBalance < totalPrice) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }
    
    // Create order
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        serviceId: service.id,
        providerId: service.providerId,
        quantity,
        link,
        totalPrice,
        currency: user.currency,
        status: 'PENDING'
      }
    })
    
    // Deduct from wallet
    await prisma.user.update({
      where: { id: user.id },
      data: {
        walletBalance: user.walletBalance - totalPrice
      }
    })
    
    // Create wallet transaction
    await prisma.walletTransaction.create({
      data: {
        userId: user.id,
        type: 'ORDER_PAYMENT',
        amount: -totalPrice,
        currency: user.currency,
        balanceBefore: user.walletBalance,
        balanceAfter: user.walletBalance - totalPrice,
        description: `Order payment for ${service.name}`,
        reference: order.id
      }
    })
    
    // TODO: Call provider API to create order
    
    return NextResponse.json({
      success: true,
      data: {
        order_id: order.id,
        service_id: service.id,
        link: order.link,
        quantity: order.quantity,
        status: order.status,
        charge: order.totalPrice,
        currency: order.currency,
        created_at: order.createdAt
      }
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
```

## Phase 3: Admin Panel

### 3.1 Admin Dashboard

Create `/src/app/admin/page.tsx`:

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react'

export default async function AdminDashboard() {
  // Fetch stats
  const [
    totalOrders,
    totalRevenue,
    totalUsers,
    pendingOrders
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { totalPrice: true },
      where: { status: 'COMPLETED' }
    }),
    prisma.user.count(),
    prisma.order.count({ where: { status: 'PENDING' } })
  ])
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalRevenue._sum.totalPrice?.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Add charts and more detailed stats here */}
    </div>
  )
}
```

## Phase 4: Background Workers

### 4.1 Worker Setup

Create `/src/workers/index.ts`:

```typescript
import { Worker } from 'bullmq'
import { processSubscriptionBilling } from './subscription-billing'
import { processProviderSync } from './provider-sync'

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
}

// Subscription billing worker
const subscriptionWorker = new Worker(
  'subscription-billing',
  processSubscriptionBilling,
  { connection }
)

// Provider sync worker
const providerWorker = new Worker(
  'provider-sync',
  processProviderSync,
  { connection }
)

console.log('Workers started')
```

### 4.2 Subscription Billing

Create `/src/workers/subscription-billing.ts`:

```typescript
import { Job } from 'bullmq'
import { prisma } from '@/lib/prisma'

export async function processSubscriptionBilling(job: Job) {
  const { subscriptionId } = job.data
  
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      user: true,
      service: true
    }
  })
  
  if (!subscription || subscription.status !== 'ACTIVE') {
    return
  }
  
  const totalPrice = subscription.service.displayPrice * (subscription.quantity / 1000)
  
  // Check balance
  if (subscription.user.walletBalance < totalPrice) {
    // Increment fail count
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        failCount: subscription.failCount + 1,
        status: subscription.failCount + 1 >= subscription.maxFails ? 'CANCELED' : 'ACTIVE'
      }
    })
    return
  }
  
  // Create order
  // Deduct balance
  // Reset fail count
  // Update next run
}
```

## Testing

### Unit Test Example

Create `/src/lib/__tests__/utils.test.ts`:

```typescript
import { validateEmail, validateUsername, formatCurrency } from '../utils'

describe('Utility Functions', () => {
  test('validateEmail', () => {
    expect(validateEmail('test@example.com')).toBe(true)
    expect(validateEmail('invalid')).toBe(false)
  })
  
  test('validateUsername', () => {
    expect(validateUsername('user123')).toBe(true)
    expect(validateUsername('ab')).toBe(false)
  })
  
  test('formatCurrency', () => {
    expect(formatCurrency(100, 'USD')).toBe('$100.00')
  })
})
```

## Deployment Checklist

- [ ] Set all environment variables in production
- [ ] Run database migrations
- [ ] Configure webhooks in payment providers
- [ ] Set up domain and SSL
- [ ] Configure email service (SMTP/SendGrid)
- [ ] Set up Redis for background jobs
- [ ] Configure monitoring (Sentry, etc.)
- [ ] Test payment flows
- [ ] Test webhook endpoints
- [ ] Load test API endpoints
- [ ] Set up backup strategy
- [ ] Configure CDN (if needed)
- [ ] Set up logging and monitoring
- [ ] Document any customizations

## Next Steps

1. Follow this guide to implement each phase
2. Test thoroughly in development
3. Deploy to staging for testing
4. Deploy to production
5. Monitor and optimize

This implementation guide provides the structure and examples needed to complete the SMM Panel. Each section can be expanded based on specific requirements.
