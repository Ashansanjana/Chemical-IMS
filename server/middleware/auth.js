import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
const JWT_EXPIRES_IN = '7d' // Token expires in 7 days

/**
 * Generate JWT token
 */
export function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET)
    } catch (error) {
        return null
    }
}

/**
 * Authentication middleware
 */
export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' })
    }

    const payload = verifyToken(token)

    if (!payload) {
        return res.status(403).json({ error: 'Invalid or expired token' })
    }

    req.user = payload
    next()
}

/**
 * Middleware to require specific role
 */
export function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' })
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                required: allowedRoles,
                current: req.user.role
            })
        }

        next()
    }
}

/**
 * Middleware to require super admin role
 */
export function requireSuperAdmin(req, res, next) {
    return requireRole('SUPER_ADMIN')(req, res, next)
}

