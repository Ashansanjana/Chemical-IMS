import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import { supabase } from '../config/supabase.js'

dotenv.config()

// Create email transporter
let transporter = null

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    })

    console.log('✉️  Email notifications configured')
} else {
    console.warn('⚠️  SMTP credentials not found - email notifications disabled')
}

/**
 * Check for low stock chemicals and send notifications
 * @param {string} chemicalId - Optional specific chemical ID to check
 */
export async function checkLowStockAndNotify(chemicalId = null) {
    try {
        // Build query
        let query = supabase
            .from('chemicals')
            .select('*')

        if (chemicalId) {
            query = query.eq('id', chemicalId)
        }

        const { data: chemicals, error } = await query

        if (error) throw error

        // Filter for low stock
        const lowStockChemicals = chemicals.filter(
            c => c.current_stock <= c.low_stock_threshold
        )

        if (lowStockChemicals.length === 0) {
            console.log('✅ No low stock chemicals found')
            return
        }

        console.log(`⚠️  Found ${lowStockChemicals.length} low stock chemical(s)`)

        // Send email if configured
        if (transporter && process.env.NOTIFICATION_EMAIL) {
            await sendLowStockEmail(lowStockChemicals)
        } else {
            // Just log to console if email not configured
            console.log('Low stock chemicals:')
            lowStockChemicals.forEach(c => {
                console.log(`  - ${c.name}: ${c.current_stock} ${c.unit} (threshold: ${c.low_stock_threshold})`)
            })
        }
    } catch (error) {
        console.error('Error checking low stock:', error)
        throw error
    }
}

/**
 * Send low stock notification email
 */
async function sendLowStockEmail(chemicals) {
    try {
        const chemicalsList = chemicals.map(c =>
            `• ${c.name}: ${c.current_stock} ${c.unit} (Threshold: ${c.low_stock_threshold} ${c.unit})`
        ).join('\n')

        const htmlList = chemicals.map(c =>
            `<li><strong>${c.name}</strong>: ${c.current_stock} ${c.unit} <span style="color: #ef4444;">(Threshold: ${c.low_stock_threshold} ${c.unit})</span></li>`
        ).join('')

        const mailOptions = {
            from: process.env.SMTP_USER,
            to: process.env.NOTIFICATION_EMAIL,
            subject: `⚠️ Low Stock Alert: ${chemicals.length} Chemical(s) Need Restocking`,
            text: `Low Stock Alert\n\nThe following chemicals are at or below their low stock threshold:\n\n${chemicalsList}\n\nPlease restock as soon as possible.\n\n---\nChemical Observation System`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; }
            .footer { background: #1f2937; color: #9ca3af; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
            ul { background: white; padding: 20px; border-radius: 8px; list-style: none; }
            li { padding: 10px; border-bottom: 1px solid #e5e7eb; }
            li:last-child { border-bottom: none; }
            .warning { color: #ef4444; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">⚠️ Low Stock Alert</h1>
              <p style="margin: 10px 0 0 0;">Chemical Inventory Management System</p>
            </div>
            <div class="content">
              <p>The following <span class="warning">${chemicals.length} chemical(s)</span> are at or below their low stock threshold:</p>
              <ul>
                ${htmlList}
              </ul>
              <p><strong>Action Required:</strong> Please restock these chemicals as soon as possible to ensure continuous operation.</p>
            </div>
            <div class="footer">
              <p>Chemical Observation System | Treatment Plant Inventory Management</p>
              <p>${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
        </html>
      `
        }

        await transporter.sendMail(mailOptions)
        console.log(`📧 Low stock notification sent to ${process.env.NOTIFICATION_EMAIL}`)
    } catch (error) {
        console.error('Error sending email:', error)
        throw error
    }
}
