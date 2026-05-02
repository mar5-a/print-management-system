/**
 * jwt.ts
 * Handles JWT signing/verification and password hashing.
 * Uses a hand-rolled HS256 JWT (no external library) and scrypt for password hashing.
 */
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { config } from '../config.js'
import type { UserRole } from '../types/index.js'

interface TokenPayload {
  sub: string       // user's database id
  role: UserRole    // primary role (highest privilege)
  roles: UserRole[] // all assigned roles
  iat: number       // issued-at (unix seconds)
  exp: number       // expiry (unix seconds)
}

// Pre-compute the static JWT header so it isn't rebuilt on every sign call
const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))

// Tokens expire after 24 hours
const expiresInSeconds = 60 * 60 * 24

// scrypt cost parameters — N=16384 is a reasonable cost for a server
const scryptParams = { N: 16_384, r: 8, p: 1 }
const keyLength = 64

/** Encode a buffer or string to base64url (URL-safe, no padding). */
function base64Url(input: Buffer | string) {
  const buffer = typeof input === 'string' ? Buffer.from(input) : input
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/** Decode a base64url string back to a Buffer. */
function base64UrlDecode(input: string) {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (input.length % 4)) % 4)
  return Buffer.from(padded, 'base64')
}

/** Sign a new JWT with the server secret. Adds iat and exp automatically. */
export function signJwt(payload: Omit<TokenPayload, 'iat' | 'exp'>) {
  const now = Math.floor(Date.now() / 1000)
  const body = base64Url(JSON.stringify({ ...payload, iat: now, exp: now + expiresInSeconds }))
  const unsigned = `${header}.${body}`
  const signature = base64Url(createHmac('sha256', config.jwtSecret).update(unsigned).digest())

  return `${unsigned}.${signature}`
}

/**
 * Verify a JWT string. Throws if the signature is invalid or the token is expired.
 * Uses timingSafeEqual to prevent timing attacks on signature comparison.
 */
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

/**
 * Hash a plaintext password using scrypt with a random 16-byte salt.
 * Returns a "salt:hash" string suitable for storage.
 */
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, keyLength, scryptParams).toString('hex')

  return `${salt}:${hash}`
}

/**
 * Verify a plaintext password against a stored "salt:hash" string.
 * Uses timingSafeEqual to prevent timing attacks.
 */
export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':')

  if (!salt || !hash) {
    return false
  }

  const storedHash = Buffer.from(hash, 'hex')
  const candidate = scryptSync(password, salt, keyLength, scryptParams)

  return storedHash.length === candidate.length && timingSafeEqual(storedHash, candidate)
}
