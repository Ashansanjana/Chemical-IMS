const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

/**
 * Save authentication data to localStorage
 */
export function saveAuth(token, user) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
}

/**
 * Get auth token from localStorage
 */
export function getToken() {
    return localStorage.getItem(TOKEN_KEY)
}

/**
 * Get user data from localStorage
 */
export function getUser() {
    const userStr = localStorage.getItem(USER_KEY)
    return userStr ? JSON.parse(userStr) : null
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
    return !!getToken()
}

/**
 * Clear authentication data
 */
export function clearAuth() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
}

/**
 * Login API call
 */
export async function login(username, password) {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Login failed')
    }

    const data = await response.json()
    saveAuth(data.token, data.user)
    return data
}

/**
 * Logout
 */
export function logout() {
    clearAuth()
    window.location.href = '/login'
}

/**
 * Verify token is still valid
 */
export async function verifyToken() {
    const token = getToken()
    if (!token) return false

    try {
        const response = await fetch('/api/auth/verify', {
            headers: { 'Authorization': `Bearer ${token}` }
        })

        const data = await response.json()
        return data.valid
    } catch (error) {
        return false
    }
}

/**
 * Get user role
 */
export function getRole() {
    const user = getUser()
    return user?.role || null
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin() {
    return getRole() === 'SUPER_ADMIN'
}

