import bcrypt from 'bcrypt'
import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-change-in-production'
)

export interface JWTPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function generateToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as JWTPayload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let key = ''
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `smm_${key}`
}

export function generate2FASecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let secret = ''
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return secret
}

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 15 * 60 * 1000
): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}

export function resetRateLimit(identifier: string): void {
  rateLimitMap.delete(identifier)
}

// Account lockout helper
const lockoutMap = new Map<string, { attempts: number; lockedUntil: number }>()

export function recordFailedLogin(identifier: string): void {
  const record = lockoutMap.get(identifier)
  const now = Date.now()

  if (!record || now > record.lockedUntil) {
    lockoutMap.set(identifier, { attempts: 1, lockedUntil: 0 })
    return
  }

  record.attempts++

  const threshold = parseInt(process.env.ACCOUNT_LOCKOUT_THRESHOLD || '5', 10)
  const duration = parseInt(process.env.ACCOUNT_LOCKOUT_DURATION || '1800000', 10)

  if (record.attempts >= threshold) {
    record.lockedUntil = now + duration
  }
}

export function isAccountLocked(identifier: string): boolean {
  const record = lockoutMap.get(identifier)
  if (!record) return false

  const now = Date.now()
  if (now > record.lockedUntil) {
    lockoutMap.delete(identifier)
    return false
  }

  const threshold = parseInt(process.env.ACCOUNT_LOCKOUT_THRESHOLD || '5', 10)
  return record.attempts >= threshold && now < record.lockedUntil
}

export function resetFailedLogins(identifier: string): void {
  lockoutMap.delete(identifier)
}

export function sanitizeUserData(user: any) {
  const { passwordHash, twoFactorSecret, ...safeUser } = user
  return safeUser
}
