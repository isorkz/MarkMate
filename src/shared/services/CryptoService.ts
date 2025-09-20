import { randomBytes, pbkdf2Sync, createCipheriv, createDecipheriv } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const SALT_LENGTH = 32
const IV_LENGTH = 16
const ITERATIONS = 100000

export class CryptoService {
  /**
   * Derive encryption key from password and salt
   */
  private static deriveKey(password: string, salt: Buffer): Buffer {
    return pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256')
  }

  /**
   * Encrypt plaintext with password
   */
  static encrypt(plaintext: string, password: string): string {
    if (!plaintext) return ''
    
    const salt = randomBytes(SALT_LENGTH)
    const iv = randomBytes(IV_LENGTH)
    const key = this.deriveKey(password, salt)
    
    const cipher = createCipheriv(ALGORITHM, key, iv)
    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    
    // Format: AES256GCM:salt:iv:tag:ciphertext
    return `AES256GCM:${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
  }

  /**
   * Decrypt encrypted data with password
   */
  static decrypt(encryptedData: string, password: string): string {
    if (!encryptedData) return ''
    
    // Handle legacy plaintext keys (migration support)
    if (!encryptedData.startsWith('AES256GCM:')) {
      return encryptedData
    }
    
    try {
      const parts = encryptedData.split(':')
      if (parts.length !== 5 || parts[0] !== 'AES256GCM') {
        throw new Error('Invalid encrypted data format')
      }
      
      const salt = Buffer.from(parts[1], 'hex')
      const iv = Buffer.from(parts[2], 'hex')
      const tag = Buffer.from(parts[3], 'hex')
      const encrypted = parts[4]
      
      const key = this.deriveKey(password, salt)
      
      const decipher = createDecipheriv(ALGORITHM, key, iv)
      decipher.setAuthTag(tag)
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate a random master password
   */
  static generateMasterPassword(): string {
    return randomBytes(32).toString('hex')
  }
}