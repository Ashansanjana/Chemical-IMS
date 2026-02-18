import express from 'express'
import { supabase } from '../config/supabase.js'
import { authenticateToken, requireSuperAdmin } from '../middleware/auth.js'

const router = express.Router()

// Get all stock transactions (Super Admin only)
router.get('/transactions',
    authenticateToken,
    requireSuperAdmin,
    async (req, res) => {
        try {
            const {
                startDate,
                endDate,
                adminUserId,
                chemicalId,
                actionType,
                limit = 100,
                offset = 0
            } = req.query

            // Build the query
            let query = supabase
                .from('stock_logs')
                .select(`
                    id,
                    chemical_id,
                    action_type,
                    amount,
                    previous_stock,
                    new_stock,
                    notes,
                    created_at,
                    admin_user_id,
                    chemicals (
                        id,
                        name,
                        unit
                    ),
                    admin_users (
                        id,
                        username,
                        full_name
                    )
                `)
                .order('created_at', { ascending: false })

            // Apply filters
            if (startDate) {
                query = query.gte('created_at', startDate)
            }
            if (endDate) {
                query = query.lte('created_at', endDate)
            }
            if (adminUserId) {
                query = query.eq('admin_user_id', adminUserId)
            }
            if (chemicalId) {
                query = query.eq('chemical_id', chemicalId)
            }
            if (actionType) {
                query = query.eq('action_type', actionType)
            }

            // Pagination
            query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)

            const { data: transactions, error, count } = await query

            if (error) {
                console.error('Error fetching stock transactions:', error)
                return res.status(500).json({ error: 'Failed to fetch stock transactions' })
            }

            res.json({
                transactions: transactions || [],
                total: count,
                limit: parseInt(limit),
                offset: parseInt(offset)
            })
        } catch (error) {
            console.error('Stock transactions error:', error)
            res.status(500).json({ error: 'Server error while fetching transactions' })
        }
    }
)

// Get stock transaction statistics (Super Admin only)
router.get('/stats',
    authenticateToken,
    requireSuperAdmin,
    async (req, res) => {
        try {
            // Total transactions
            const { count: totalTransactions } = await supabase
                .from('stock_logs')
                .select('*', { count: 'exact', head: true })

            // Recent transactions (last 30 days)
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

            const { count: recentTransactions } = await supabase
                .from('stock_logs')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', thirtyDaysAgo.toISOString())

            // Transactions by action type
            const { data: byAction } = await supabase
                .from('stock_logs')
                .select('action_type')

            const actionStats = byAction?.reduce((acc, item) => {
                acc[item.action_type] = (acc[item.action_type] || 0) + 1
                return acc
            }, {})

            res.json({
                totalTransactions: totalTransactions || 0,
                recentTransactions: recentTransactions || 0,
                byAction: actionStats || {}
            })
        } catch (error) {
            console.error('Stock stats error:', error)
            res.status(500).json({ error: 'Server error while fetching statistics' })
        }
    }
)

export default router
