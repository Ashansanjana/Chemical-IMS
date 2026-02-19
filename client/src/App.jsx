import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Dashboard from './components/Dashboard'
import InventoryTable from './components/InventoryTable'
import UpdateStockForm from './components/UpdateStockForm'
import AddChemicalForm from './components/AddChemicalForm'
import MonthlyReport from './components/MonthlyReport'
import Login from './components/Login'
import ProtectedRoute from './components/ProtectedRoute'
import SuperAdminPanel from './components/SuperAdminPanel'
import ChangePassword from './components/ChangePassword'
import { logout, getUser, isAuthenticated, isSuperAdmin } from './lib/auth'

function App() {
    const location = useLocation()

    const isActive = (path) => location.pathname === path
    const isLoginPage = location.pathname === '/login'

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            {!isLoginPage && (
                <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50 shadow-lg">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="bg-blue-600 p-2 rounded-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                    </svg>
                                </div>
                                <h1 className="text-2xl font-bold text-white">Chemical OBS</h1>
                            </div>

                            {/* Desktop Navigation */}
                            <nav className="hidden md:flex space-x-1">
                                <Link
                                    to="/"
                                    className={`px-4 py-2 rounded-lg transition-all ${isActive('/') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    to="/inventory"
                                    className={`px-4 py-2 rounded-lg transition-all ${isActive('/inventory') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                                >
                                    Inventory
                                </Link>
                                <Link
                                    to="/update"
                                    className={`px-4 py-2 rounded-lg transition-all ${isActive('/update') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                                >
                                    Update Stock
                                </Link>
                                <Link
                                    to="/add"
                                    className={`px-4 py-2 rounded-lg transition-all ${isActive('/add') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                                >
                                    Add Chemical
                                </Link>
                                <Link
                                    to="/reports"
                                    className={`px-4 py-2 rounded-lg transition-all ${isActive('/reports') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                                >
                                    Reports
                                </Link>
                                {isAuthenticated() && !isSuperAdmin() && (
                                    <Link
                                        to="/change-password"
                                        className={`px-4 py-2 rounded-lg transition-all ${isActive('/change-password') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                                    >
                                        🔑 Change Password
                                    </Link>
                                )}
                                {isSuperAdmin() && (
                                    <Link
                                        to="/admin"
                                        className={`px-4 py-2 rounded-lg transition-all ${isActive('/admin') ? 'bg-orange-600 text-white' : 'text-orange-300 hover:bg-slate-700'}`}
                                    >
                                        🔐 Super Admin
                                    </Link>
                                )}
                            </nav>

                            {/* User Menu */}
                            {isAuthenticated() && (
                                <div className="hidden md:flex items-center space-x-3">
                                    <div className="text-right">
                                        <div className="text-slate-300 text-sm font-medium">
                                            {getUser()?.username}
                                        </div>
                                        {getUser()?.role && (
                                            <div className={`text-xs ${getUser()?.role === 'SUPER_ADMIN' ? 'text-orange-400' : 'text-blue-400'}`}>
                                                {getUser()?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all text-sm font-medium"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Mobile Navigation */}
                        <nav className="md:hidden mt-4 flex overflow-x-auto space-x-2 pb-2">
                            <Link to="/" className={`px-3 py-2 rounded-lg whitespace-nowrap text-sm ${isActive('/') ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                Dashboard
                            </Link>
                            <Link to="/inventory" className={`px-3 py-2 rounded-lg whitespace-nowrap text-sm ${isActive('/inventory') ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                Inventory
                            </Link>
                            <Link to="/update" className={`px-3 py-2 rounded-lg whitespace-nowrap text-sm ${isActive('/update') ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                Update
                            </Link>
                            <Link to="/add" className={`px-3 py-2 rounded-lg whitespace-nowrap text-sm ${isActive('/add') ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                Add
                            </Link>
                            <Link to="/reports" className={`px-3 py-2 rounded-lg whitespace-nowrap text-sm ${isActive('/reports') ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                Reports
                            </Link>
                            {isAuthenticated() && !isSuperAdmin() && (
                                <Link to="/change-password" className={`px-3 py-2 rounded-lg whitespace-nowrap text-sm ${isActive('/change-password') ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                    🔑 Password
                                </Link>
                            )}
                            {isSuperAdmin() && (
                                <Link to="/admin" className={`px-3 py-2 rounded-lg whitespace-nowrap text-sm ${isActive('/admin') ? 'bg-orange-600 text-white' : 'bg-slate-700 text-orange-300'}`}>
                                    🔐 Admin
                                </Link>
                            )}
                        </nav>
                    </div>
                </header>
            )}

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/inventory" element={
                        <ProtectedRoute>
                            <InventoryTable />
                        </ProtectedRoute>
                    } />
                    <Route path="/update" element={
                        <ProtectedRoute>
                            <UpdateStockForm />
                        </ProtectedRoute>
                    } />
                    <Route path="/add" element={
                        <ProtectedRoute>
                            <AddChemicalForm />
                        </ProtectedRoute>
                    } />
                    <Route path="/reports" element={
                        <ProtectedRoute>
                            <MonthlyReport />
                        </ProtectedRoute>
                    } />
                    <Route path="/admin" element={
                        <ProtectedRoute requiredRole="SUPER_ADMIN">
                            <SuperAdminPanel />
                        </ProtectedRoute>
                    } />
                    <Route path="/change-password" element={
                        <ProtectedRoute>
                            <ChangePassword />
                        </ProtectedRoute>
                    } />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>

            {/* Footer */}
            {!isLoginPage && (
                <footer className="bg-slate-800/50 border-t border-slate-700 mt-12">
                    <div className="container mx-auto px-4 py-6 text-center text-slate-400 text-sm">
                        <p>Chemical Observation System © 2026 | Treatment Plant Inventory Management</p>
                    </div>
                </footer>
            )}

            {/* Toast Notifications */}
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#1e293b',
                        color: '#f1f5f9',
                        border: '1px solid #475569',
                    },
                    success: {
                        iconTheme: {
                            primary: '#10b981',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />
        </div>
    )
}

export default App
