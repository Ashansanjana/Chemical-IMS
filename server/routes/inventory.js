import express from 'express'
import { checkLowStockAndNotify } from '../services/notification.js'
import { logActivity } from '../middleware/activityLogger.js'

const router = express.Router()

// Manual trigger for low stock notification check
router.post('/notifications/check-low-stock',
    logActivity('CHECK_LOW_STOCK', 'inventory'),
    async (req, res) => {
        try {
            const { chemicalId } = req.body
            await checkLowStockAndNotify(chemicalId)
            res.json({ success: true, message: 'Low stock check completed' })
        } catch (error) {
            console.error('Error checking low stock:', error)
            res.status(500).json({ error: 'Failed to check low stock' })
        }
    }
)

export default router
