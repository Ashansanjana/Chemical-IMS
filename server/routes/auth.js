import express from 'express'
import { supabase } from '../config/supabase.js'
import { hashPassword, verifyPassword } from '../utils/hash.js'
import { generateToken, verifyToken } from '../middleware/auth.js'

const router = express.Router()

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' })
        }

        // Get user from database
        const { data: user, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('username', username)
            .eq('is_active', true)
            .single()

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid username or password' })
        }

        // Verify password
        const isValidPassword = verifyPassword(password, user.password_hash)

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid username or password' })
        }

        // Update last login
        await supabase
            .from('admin_users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id)

        // Generate JWT token
        const token = generateToken({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        })

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.full_name,
                role: user.role
            }
        })
    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({ error: 'Server error during login' })
    }
})

// Verify token endpoint
router.get('/verify', (req, res) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
        return res.status(401).json({ valid: false, error: 'No token provided' })
    }

    const payload = verifyToken(token)

    if (!payload) {
        return res.status(403).json({ valid: false, error: 'Invalid token' })
    }

    res.json({
        valid: true,
        user: {
            id: payload.id,
            username: payload.username,
            email: payload.email
        }
    })
})

// Logout endpoint (client-side token removal)
router.post('/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' })
})

export default router
