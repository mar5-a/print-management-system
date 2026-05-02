import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { config } from '../config.js'
import type { UserRole } from '../types/api.js'

interface TokenPayload {
  sub: string
  role: UserRole
  roles: UserRole[]
  iat: number
  exp: number
}

const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
const expiresInSeconds = 60 * 60 * 24
const scryptParams = { N: 16_384, r: 8, p: 1 }
const keyLength = 64

function base64Url(input: Buffer | string) {
  const buffer = typeof input === 'string' ? Buffer.from(input) : input
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64UrlDecode(input: string) {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (input.length % 4)) % 4)
  return Buffer.from(padded, 'base64')
}

export function signJwt(payload: Omit<TokenPayload, 'iat' | 'exp'>) {
  const now = Math.floor(Date.now() / 1000)
  const body = base64Url(JSON.stringify({ ...payload, iat: now, exp: now + expiresInSeconds }))
  const unsigned = `${header}.${body}`
  const signature = base64Url(createHmac('sha256', config.jwtSecret).update(unsigned).digest())

  return `${unsigned}.${signature}`
}

export function verifyJwt(token: string): TokenPayload {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Malformed token')
  }

  const [encodedHeader, encodedPayload, signature] = parts
  const unsigned = `${encodedHeader}.${encodedPayload}`
  const expectedSignature = base64Url(createHmac('sha256', config.jwtSecret).update(unsigned).digest())
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    throw new Error('Invalid token signature')
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload).toString()) as TokenPayload

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired')
  }

  return payload
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, keyLength, scryptParams).toString('hex')

  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':')

  if (!salt || !hash) {
    return false
  }

  const storedHash = Buffer.from(hash, 'hex')
  const candidate = scryptSync(password, salt, keyLength, scryptParams)

  return storedHash.length === candidate.length && timingSafeEqual(storedHash, candidate)
}
