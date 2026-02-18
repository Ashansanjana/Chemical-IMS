import express from 'express'
import { supabase } from '../config/supabase.js'
import { hashPassword } from '../utils/hash.js'
import { authenticateToken, requireSuperAdmin } from '../middleware/auth.js'
import { logActivity } from '../middleware/activityLogger.js'

const router = express.Router()

/**
 * GET /api/users - List all admin users (Super Admin only)
 */
router.get('/', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('admin_users')
            .select('id, username, email, full_name, role, is_active, created_at, last_login')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching users:', error)
            return res.status(500).json({ error: 'Failed to fetch users' })
        }

        res.json({ users })
    } catch (error) {
        console.error('Get users error:', error)
        res.status(500).json({ error: 'Server error' })
    }
})

/**
 * POST /api/users - Create new admin user (Super Admin only)
 */
router.post('/',
    authenticateToken,
    requireSuperAdmin,
    logActivity('CREATE', 'admin_users'),
    async (req, res) => {
        try {
            const { username, password, email, fullName, role } = req.body

            // Validation
            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password are required' })
            }

            if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
                return res.status(400).json({ error: 'Invalid role. Must be ADMIN or SUPER_ADMIN' })
            }

            // Check if username already exists
            const { data: existing } = await supabase
                .from('admin_users')
                .select('username')
                .eq('username', username)
                .single()

            if (existing) {
                return res.status(409).json({ error: 'Username already exists' })
            }

            // Hash password
            const passwordHash = hashPassword(password)

            // Create user
            const { data: newUser, error } = await supabase
                .from('admin_users')
                .insert({
                    username,
                    password_hash: passwordHash,
                    email: email || null,
                    full_name: fullName || null,
                    role,
                    is_active: true
                })
                .select('id, username, email, full_name, role, is_active, created_at')
                .single()

            if (error) {
                console.error('Error creating user:', error)
                return res.status(500).json({ error: 'Failed to create user' })
            }

            res.status(201).json({
                success: true,
                message: 'User created successfully',
                user: newUser
            })
        } catch (error) {
            console.error('Create user error:', error)
            res.status(500).json({ error: 'Server error' })
        }
    }
)

/**
 * PUT /api/users/:id - Update admin user (Super Admin only)
 */
router.put('/:id',
    authenticateToken,
    requireSuperAdmin,
    logActivity('UPDATE', 'admin_users'),
    async (req, res) => {
        try {
            const { id } = req.params
            const { email, fullName, role, isActive, password } = req.body

            // Build update object
            const updates = {}
            if (email !== undefined) updates.email = email
            if (fullName !== undefined) updates.full_name = fullName
            if (role !== undefined) {
                if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
                    return res.status(400).json({ error: 'Invalid role' })
                }
                updates.role = role
            }
            if (isActive !== undefined) updates.is_active = isActive
            if (password) {
                updates.password_hash = hashPassword(password)
            }

            if (Object.keys(updates).length === 0) {
                return res.status(400).json({ error: 'No fields to update' })
            }

            // Prevent user from deactivating themselves
            if (updates.is_active === false && id === req.user.id) {
                return res.status(400).json({ error: 'Cannot deactivate your own account' })
            }

            const { data: updatedUser, error } = await supabase
                .from('admin_users')
                .update(updates)
                .eq('id', id)
                .select('id, username, email, full_name, role, is_active')
                .single()

            if (error) {
                console.error('Error updating user:', error)
                return res.status(500).json({ error: 'Failed to update user' })
            }

            if (!updatedUser) {
                return res.status(404).json({ error: 'User not found' })
            }

            res.json({
                success: true,
                message: 'User updated successfully',
                user: updatedUser
            })
        } catch (error) {
            console.error('Update user error:', error)
            res.status(500).json({ error: 'Server error' })
        }
    }
)

/**
 * DELETE /api/users/:id - Deactivate admin user (Super Admin only)
 */
router.delete('/:id',
    authenticateToken,
    requireSuperAdmin,
    logActivity('DELETE', 'admin_users'),
    async (req, res) => {
        try {
            const { id } = req.params

            // Prevent user from deleting themselves
            if (id === req.user.id) {
                return res.status(400).json({ error: 'Cannot delete your own account' })
            }

            // Soft delete (deactivate)
            const { data: deactivatedUser, error } = await supabase
                .from('admin_users')
                .update({ is_active: false })
                .eq('id', id)
                .select('id, username, email, is_active')
                .single()

            if (error) {
                console.error('Error deactivating user:', error)
                return res.status(500).json({ error: 'Failed to deactivate user' })
            }

            if (!deactivatedUser) {
                return res.status(404).json({ error: 'User not found' })
            }

            res.json({
                success: true,
                message: 'User deactivated successfully',
                user: deactivatedUser
            })
        } catch (error) {
            console.error('Delete user error:', error)
            res.status(500).json({ error: 'Server error' })
        }
    }
)

export default router
