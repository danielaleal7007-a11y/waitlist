import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminPassword = await hashPassword('admin123')
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smmpanel.com' },
    update: {},
    create: {
      displayName: 'Admin User',
      username: 'admin',
      email: 'admin@smmpanel.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      walletBalance: 1000,
      emailVerified: new Date(),
    },
  })

  console.log('✓ Created admin user:', admin.email)

  // Create test user
  const userPassword = await hashPassword('user123')
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      displayName: 'Test User',
      username: 'testuser',
      email: 'user@example.com',
      passwordHash: userPassword,
      role: 'USER',
      walletBalance: 100,
      emailVerified: new Date(),
    },
  })

  console.log('✓ Created test user:', user.email)

  // Create mock provider
  const provider = await prisma.provider.upsert({
    where: { id: 'mock-provider' },
    update: {},
    create: {
      id: 'mock-provider',
      name: 'Mock Provider',
      type: 'REST_JSON',
      baseUrl: 'https://example.com/api',
      apiKey: 'mock-api-key',
      active: true,
      rateMultiplier: 1.2,
      timeout: 30000,
      maxConcurrency: 10,
    },
  })

  console.log('✓ Created provider:', provider.name)

  // Create sample services
  const services = [
    {
      name: 'Instagram Followers - High Quality',
      category: 'Instagram',
      description: 'Real and active Instagram followers with profile pictures',
      priceBase: 0.5,
      displayPrice: 0.6,
      minQuantity: 100,
      maxQuantity: 10000,
      speed: '1-2 hours',
      tags: ['followers', 'instagram', 'real'],
    },
    {
      name: 'Instagram Likes - Instant',
      category: 'Instagram',
      description: 'Instant Instagram likes from real accounts',
      priceBase: 0.3,
      displayPrice: 0.36,
      minQuantity: 50,
      maxQuantity: 5000,
      speed: 'Instant',
      tags: ['likes', 'instagram', 'instant'],
    },
    {
      name: 'TikTok Views - Fast',
      category: 'TikTok',
      description: 'High-quality TikTok views with fast delivery',
      priceBase: 0.2,
      displayPrice: 0.24,
      minQuantity: 1000,
      maxQuantity: 100000,
      speed: '30 minutes',
      tags: ['views', 'tiktok', 'fast'],
    },
    {
      name: 'YouTube Views - Organic',
      category: 'YouTube',
      description: 'Organic YouTube views from real users',
      priceBase: 0.8,
      displayPrice: 0.96,
      minQuantity: 100,
      maxQuantity: 50000,
      speed: '1-3 days',
      tags: ['views', 'youtube', 'organic'],
    },
    {
      name: 'Twitter Followers - Real',
      category: 'Twitter',
      description: 'Real Twitter followers with complete profiles',
      priceBase: 1.0,
      displayPrice: 1.2,
      minQuantity: 50,
      maxQuantity: 5000,
      speed: '2-4 hours',
      tags: ['followers', 'twitter', 'real'],
    },
    {
      name: 'Facebook Page Likes',
      category: 'Facebook',
      description: 'Quality Facebook page likes from real accounts',
      priceBase: 0.6,
      displayPrice: 0.72,
      minQuantity: 100,
      maxQuantity: 10000,
      speed: '1-2 hours',
      tags: ['likes', 'facebook', 'page'],
    },
  ]

  for (const service of services) {
    await prisma.service.create({
      data: {
        ...service,
        providerId: provider.id,
        active: true,
        featured: Math.random() > 0.5,
        margin: 20,
      },
    })
  }

  console.log(`✓ Created ${services.length} services`)

  // Create currency rates
  const currencies = [
    { currency: 'USD', rate: 1, markup: 0 },
    { currency: 'EUR', rate: 0.92, markup: 0 },
    { currency: 'GBP', rate: 0.79, markup: 0 },
    { currency: 'NGN', rate: 1550, markup: 2 },
    { currency: 'GHS', rate: 15.5, markup: 2 },
    { currency: 'KES', rate: 158, markup: 2 },
    { currency: 'BTC', rate: 0.000023, markup: 1 },
    { currency: 'USDT', rate: 1.001, markup: 0.5 },
  ]

  for (const curr of currencies) {
    await prisma.currencyRate.upsert({
      where: {
        baseCurrency_currency: {
          baseCurrency: 'USD',
          currency: curr.currency,
        },
      },
      update: { rate: curr.rate, markup: curr.markup },
      create: {
        baseCurrency: 'USD',
        currency: curr.currency,
        rate: curr.rate,
        markup: curr.markup,
      },
    })
  }

  console.log(`✓ Created ${currencies.length} currency rates`)

  // Create sample coupon
  await prisma.coupon.create({
    data: {
      code: 'WELCOME10',
      type: 'PERCENTAGE',
      value: 10,
      usageLimit: 100,
      active: true,
      description: 'Welcome discount - 10% off your first order',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  })

  console.log('✓ Created welcome coupon')

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
