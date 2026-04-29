import { createHmac, timingSafeEqual, randomBytes, scryptSync } from 'node:crypto'
import type { TokenPayload } from '../types/index.js'

// ── JWT ──────────────────────────────────────────────────────────────────────

function b64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function b64urlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (input.length % 4)) % 4)
  return Buffer.from(padded, 'base64')
}

const HEADER = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
const EXPIRES_IN = 60 * 60 * 24 // 24 hours

export function signJwt(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  const secret = process.env.JWT_SECRET ?? 'change-me'
  const now = Math.floor(Date.now() / 1000)
  const body = b64url(JSON.stringify({ ...payload, iat: now, exp: now + EXPIRES_IN }))
  const unsigned = `${HEADER}.${body}`
  const sig = b64url(createHmac('sha256', secret).update(unsigned).digest())
  return `${unsigned}.${sig}`
}

export function verifyJwt(token: string): TokenPayload {
  const secret = process.env.JWT_SECRET ?? 'change-me'
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Malformed token')

  const [header, payload, sig] = parts
  const unsigned = `${header}.${payload}`
  const expectedSig = b64url(createHmac('sha256', secret).update(unsigned).digest())

  const a = Buffer.from(sig)
  const b = Buffer.from(expectedSig)
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error('Invalid signature')

  const data = JSON.parse(b64urlDecode(payload).toString()) as TokenPayload
  if (data.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired')
  return data
}

// ── Password hashing (Node built-in scrypt) ──────────────────────────────────

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 }
const KEY_LEN = 64

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, KEY_LEN, SCRYPT_PARAMS).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const hashBuf = Buffer.from(hash, 'hex')
  const candidate = scryptSync(password, salt, KEY_LEN, SCRYPT_PARAMS)
  return hashBuf.length === candidate.length && timingSafeEqual(hashBuf, candidate)
}
