import { supabase } from '../config/supabase.js'

/**
 * Middleware to log all database-modifying activities
 */
export function logActivity(action, tableName = null) {
    return async (req, res, next) => {
        // Store original methods
        const originalJson = res.json.bind(res)

        // Override res.json to capture response
        res.json = function (data) {
            // Only log successful operations (2xx status codes)
            if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
                // Log asynchronously (don't wait for it)
                logToDatabase(req, action, tableName, data).catch(err => {
                    console.error('Activity logging failed:', err)
                })
            }
            return originalJson(data)
        }

        next()
    }
}

/**
 * Helper function to write to activity_logs table
 */
async function logToDatabase(req, action, tableName, responseData) {
    try {
        const logEntry = {
            user_id: req.user.id,
            action: action,
            table_name: tableName,
            record_id: extractRecordId(req, responseData),
            old_values: req.oldValues || null,
            new_values: extractNewValues(req, responseData),
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.get('user-agent') || null
        }

        await supabase
            .from('activity_logs')
            .insert(logEntry)
    } catch (error) {
        // Silent fail - don't break the request if logging fails
        console.error('Failed to write activity log:', error)
    }
}

/**
 * Extract record ID from request or response
 */
function extractRecordId(req, responseData) {
    // Try to get from URL params first
    if (req.params && req.params.id) {
        return req.params.id
    }

    // Try to get from response data
    if (responseData && responseData.id) {
        return String(responseData.id)
    }

    // For array responses (bulk operations)
    if (Array.isArray(responseData) && responseData.length > 0 && responseData[0].id) {
        return responseData.map(item => item.id).join(',')
    }

    return null
}

/**
 * Extract new values from request body or response
 */
function extractNewValues(req, responseData) {
    // Prefer response data if available
    if (responseData && typeof responseData === 'object') {
        // Don't log the entire response, just relevant fields
        const { success, token, error, ...relevantData } = responseData
        if (Object.keys(relevantData).length > 0) {
            return relevantData
        }
    }

    // Fall back to request body
    if (req.body && typeof req.body === 'object') {
        // Remove sensitive fields
        const { password, password_hash, token, ...safeBody } = req.body
        return Object.keys(safeBody).length > 0 ? safeBody : null
    }

    return null
}

/**
 * Middleware to capture old values before update/delete
 */
export function captureOldValues(tableName, idField = 'id') {
    return async (req, res, next) => {
        try {
            const recordId = req.params[idField]

            if (recordId) {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .eq(idField, recordId)
                    .single()

                if (!error && data) {
                    req.oldValues = data
                }
            }
        } catch (error) {
            // Continue even if we can't capture old values
            console.error('Failed to capture old values:', error)
        }

        next()
    }
}
