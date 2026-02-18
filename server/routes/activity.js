import express from 'express'
import { supabase } from '../config/supabase.js'
import { authenticateToken, requireSuperAdmin } from '../middleware/auth.js'

const router = express.Router()

/**
 * GET /api/activity - Get activity logs with filtering (Super Admin only)
 */
router.get('/', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const {
            userId,
            action,
            tableName,
            startDate,
            endDate,
            limit = 100,
            offset = 0
        } = req.query

        // Build query
        let query = supabase
            .from('activity_logs')
            .select(`
                *,
                admin_users!activity_logs_user_id_fkey (
                    username,
                    full_name,
                    role
                )
            `)
            .order('created_at', { ascending: false })

        // Apply filters
        if (userId) {
            query = query.eq('user_id', userId)
        }
        if (action) {
            query = query.eq('action', action)
        }
        if (tableName) {
            query = query.eq('table_name', tableName)
        }
        if (startDate) {
            query = query.gte('created_at', startDate)
        }
        if (endDate) {
            query = query.lte('created_at', endDate)
        }

        // Apply pagination
        query = query.range(offset, offset + parseInt(limit) - 1)

        const { data: logs, error, count } = await query

        if (error) {
            console.error('Error fetching activity logs:', error)
            return res.status(500).json({ error: 'Failed to fetch activity logs' })
        }

        res.json({
            logs,
            pagination: {
                offset: parseInt(offset),
                limit: parseInt(limit),
                total: count
            }
        })
    } catch (error) {
        console.error('Get activity logs error:', error)
        res.status(500).json({ error: 'Server error' })
    }
})

/**
 * GET /api/activity/stats - Get activity statistics (Super Admin only)
 */
router.get('/stats', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        // Get total logs count
        const { count: totalLogs } = await supabase
            .from('activity_logs')
            .select('*', { count: 'exact', head: true })

        // Get logs by action type
        const { data: actionStats } = await supabase
            .from('activity_logs')
            .select('action')

        // Group by action
        const actionCounts = actionStats?.reduce((acc, log) => {
            acc[log.action] = (acc[log.action] || 0) + 1
            return acc
        }, {}) || {}

        // Get most active users (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: recentLogs } = await supabase
            .from('activity_logs')
            .select(`
                user_id,
                admin_users!activity_logs_user_id_fkey (
                    username,
                    full_name
                )
            `)
            .gte('created_at', thirtyDaysAgo.toISOString())

        const userActivity = recentLogs?.reduce((acc, log) => {
            const userId = log.user_id
            if (!acc[userId]) {
                acc[userId] = {
                    userId,
                    username: log.admin_users?.username,
                    fullName: log.admin_users?.full_name,
                    count: 0
                }
            }
            acc[userId].count++
            return acc
        }, {}) || {}

        const topUsers = Object.values(userActivity)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)

        res.json({
            totalLogs,
            actionCounts,
            topUsers
        })
    } catch (error) {
        console.error('Get activity stats error:', error)
        res.status(500).json({ error: 'Server error' })
    }
})

export default router
