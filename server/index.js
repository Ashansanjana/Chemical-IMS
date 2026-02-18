import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cron from 'node-cron'
import { checkLowStockAndNotify } from './services/notification.js'
import inventoryRoutes from './routes/inventory.js'
import authRoutes from './routes/auth.js'
import usersRoutes from './routes/users.js'
import activityRoutes from './routes/activity.js'
import stockRoutes from './routes/stock.js'
import { authenticateToken } from './middleware/auth.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:5173'
    ],
    credentials: true
}))
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/inventory', authenticateToken, inventoryRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/activity', activityRoutes)
app.use('/api/stock', stockRoutes)

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Schedule low stock check - runs every day at 9:00 AM
cron.schedule('0 9 * * *', async () => {
    console.log('Running scheduled low stock check...')
    try {
        await checkLowStockAndNotify()
        console.log('Low stock check completed')
    } catch (error) {
        console.error('Error during scheduled check:', error)
    }
})

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
    console.log(`📊 API endpoints available at http://localhost:${PORT}/api`)
    console.log(`⏰ Low stock alerts scheduled daily at 9:00 AM`)
})
