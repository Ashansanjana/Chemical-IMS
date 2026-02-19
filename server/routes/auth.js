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

// Change password endpoint (for logged-in users)
router.post('/change-password', async (req, res) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'Access token required' })

    const { verifyToken } = await import('../middleware/auth.js')
    const payload = verifyToken(token)
    if (!payload) return res.status(403).json({ error: 'Invalid or expired token' })

    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password are required' })
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' })
    }

    try {
        // Get current user
        const { data: user, error } = await supabase
            .from('admin_users')
            .select('id, password_hash')
            .eq('id', payload.id)
            .single()

        if (error || !user) {
            return res.status(404).json({ error: 'User not found' })
        }

        // Verify current password
        if (!verifyPassword(currentPassword, user.password_hash)) {
            return res.status(400).json({ error: 'Current password is incorrect' })
        }

        // Update password
        const { error: updateError } = await supabase
            .from('admin_users')
            .update({ password_hash: hashPassword(newPassword) })
            .eq('id', payload.id)

        if (updateError) {
            console.error('Error updating password:', updateError)
            return res.status(500).json({ error: 'Failed to update password' })
        }

        res.json({ success: true, message: 'Password changed successfully' })
    } catch (error) {
        console.error('Change password error:', error)
        res.status(500).json({ error: 'Server error' })
    }
})

// Logout endpoint (client-side token removal)
router.post('/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' })
})

export default router
