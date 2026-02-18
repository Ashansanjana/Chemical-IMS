import { Navigate } from 'react-router-dom'
import { isAuthenticated, getRole } from '../lib/auth'

export default function ProtectedRoute({ children, requiredRole }) {
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />
    }

    // If a specific role is required, check if user has it
    if (requiredRole && getRole() !== requiredRole) {
        return <Navigate to="/" replace />
    }

    return children
}

