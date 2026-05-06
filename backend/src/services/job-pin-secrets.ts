import crypto from 'node:crypto'
import { config } from '../config.js'

const algorithm = 'aes-256-gcm'

function encryptionKey() {
  return crypto.createHash('sha256').update(config.jobPinEncryptionKey).digest()
}

export function generateDevicePin() {
  return crypto.randomInt(0, 10_000).toString().padStart(4, '0')
}

export function encryptDevicePin(pin: string) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(algorithm, encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(pin, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return [
    'v1',
    iv.toString('base64url'),
    tag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join(':')
}

export function decryptDevicePin(secret: string) {
  const [version, ivText, tagText, encryptedText] = secret.split(':')

  if (version !== 'v1' || !ivText || !tagText || !encryptedText) {
    throw new Error('Invalid device PIN secret.')
  }

  const decipher = crypto.createDecipheriv(algorithm, encryptionKey(), Buffer.from(ivText, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagText, 'base64url'))

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}
