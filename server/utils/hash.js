import crypto from 'crypto'

/**
 * Simple MD5 hash for demo purposes
 * In production, use bcrypt with salt
 */
export function hashPassword(password) {
    return crypto.createHash('md5').update(password).digest('hex')
}

/**
 * Verify password against hash
 */
export function verifyPassword(password, hash) {
    return hashPassword(password) === hash
}
