import { useState, useEffect } from 'react'
import { getToken } from '../lib/auth'
import { API_URL } from '../lib/api'
import './StockTransactions.css'

export default function StockTransactions() {
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        adminUserId: '',
        chemicalId: '',
        actionType: ''
    })
    const [adminUsers, setAdminUsers] = useState([])
    const [chemicals, setChemicals] = useState([])

    useEffect(() => {
        fetchTransactions()
        fetchAdminUsers()
        fetchChemicals()
    }, [])

    const fetchTransactions = async () => {
        setLoading(true)
        try {
            const token = getToken()
            const queryParams = new URLSearchParams()

            if (filters.startDate) queryParams.append('startDate', filters.startDate)
            if (filters.endDate) queryParams.append('endDate', filters.endDate)
            if (filters.adminUserId) queryParams.append('adminUserId', filters.adminUserId)
            if (filters.chemicalId) queryParams.append('chemicalId', filters.chemicalId)
            if (filters.actionType) queryParams.append('actionType', filters.actionType)

            const response = await fetch(`${API_URL}/api/stock/transactions?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) throw new Error('Failed to fetch transactions')

            const data = await response.json()
            setTransactions(data.transactions || [])
        } catch (error) {
            console.error('Error fetching transactions:', error)
            alert('Failed to fetch stock transactions')
        } finally {
            setLoading(false)
        }
    }

    const fetchAdminUsers = async () => {
        try {
            const token = getToken()
            const response = await fetch(`${API_URL}/api/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setAdminUsers(data.users || [])
            }
        } catch (error) {
            console.error('Error fetching admin users:', error)
        }
    }

    const fetchChemicals = async () => {
        try {
            const { supabase } = await import('../lib/supabase')
            const { data } = await supabase
                .from('chemicals')
                .select('id, name')
                .order('name')
            setChemicals(data || [])
        } catch (error) {
            console.error('Error fetching chemicals:', error)
        }
    }

    const handleFilterChange = (e) => {
        const { name, value } = e.target
        setFilters(prev => ({ ...prev, [name]: value }))
    }

    const handleApplyFilters = (e) => {
        e.preventDefault()
        fetchTransactions()
    }

    const handleResetFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            adminUserId: '',
            chemicalId: '',
            actionType: ''
        })
        setTimeout(() => fetchTransactions(), 100)
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const exportToCSV = () => {
        if (transactions.length === 0) return

        const headers = ['Date & Time', 'Admin User', 'Full Name', 'Chemical', 'Unit', 'Action', 'Amount', 'Previous Stock', 'New Stock', 'Notes']

        const rows = transactions.map(t => [
            formatDate(t.created_at),
            t.admin_users?.username || 'Unknown',
            t.admin_users?.full_name || '',
            t.chemicals?.name || 'N/A',
            t.chemicals?.unit || '',
            t.action_type === 'add' ? 'Add' : 'Remove',
            t.amount,
            t.previous_stock,
            t.new_stock,
            t.notes || ''
        ])

        const escape = (val) => `"${String(val).replace(/"/g, '""')}"`
        const csvContent = [headers, ...rows].map(row => row.map(escape).join(',')).join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        const dateRange = filters.startDate && filters.endDate
            ? `_${filters.startDate}_to_${filters.endDate}`
            : filters.startDate
                ? `_from_${filters.startDate}`
                : filters.endDate
                    ? `_until_${filters.endDate}`
                    : ''
        link.href = url
        link.setAttribute('download', `stock_transactions${dateRange}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    return (
        <div className="stock-transactions">
            <h2>📦 Stock Transactions</h2>

            {/* Filters */}
            <form className="filters" onSubmit={handleApplyFilters}>
                <div className="filter-group">
                    <label>Start Date</label>
                    <input
                        type="date"
                        name="startDate"
                        value={filters.startDate}
                        onChange={handleFilterChange}
                    />
                </div>

                <div className="filter-group">
                    <label>End Date</label>
                    <input
                        type="date"
                        name="endDate"
                        value={filters.endDate}
                        onChange={handleFilterChange}
                    />
                </div>

                <div className="filter-group">
                    <label>Admin User</label>
                    <select
                        name="adminUserId"
                        value={filters.adminUserId}
                        onChange={handleFilterChange}
                    >
                        <option value="">All Users</option>
                        {adminUsers.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.username}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label>Chemical</label>
                    <select
                        name="chemicalId"
                        value={filters.chemicalId}
                        onChange={handleFilterChange}
                    >
                        <option value="">All Chemicals</option>
                        {chemicals.map(chem => (
                            <option key={chem.id} value={chem.id}>
                                {chem.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label>Action</label>
                    <select
                        name="actionType"
                        value={filters.actionType}
                        onChange={handleFilterChange}
                    >
                        <option value="">All Actions</option>
                        <option value="add">Add Stock</option>
                        <option value="remove">Remove Stock</option>
                    </select>
                </div>

                <button type="submit" className="btn-filter">Apply Filters</button>
                <button type="button" className="btn-reset" onClick={handleResetFilters}>Reset</button>
                <button
                    type="button"
                    className="btn-export"
                    onClick={exportToCSV}
                    disabled={transactions.length === 0 || loading}
                    title={transactions.length === 0 ? 'No data to export' : 'Export current results to CSV'}
                >
                    ⬇ Download the Report
                </button>
            </form>

            {/* Transactions Table */}
            {loading ? (
                <div className="loading">Loading stock transactions...</div>
            ) : (
                <div className="transactions-table-container">
                    <table className="transactions-table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Admin User</th>
                                <th>Chemical</th>
                                <th>Action</th>
                                <th>Amount</th>
                                <th>Previous Stock</th>
                                <th>New Stock</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate-400)' }}>
                                        No transactions found
                                    </td>
                                </tr>
                            ) : (
                                transactions.map(transaction => (
                                    <tr key={transaction.id}>
                                        <td>{formatDate(transaction.created_at)}</td>
                                        <td>
                                            <div>
                                                <div className="user-name">
                                                    {transaction.admin_users?.username || 'Unknown'}
                                                </div>
                                                {transaction.admin_users?.full_name && (
                                                    <div className="user-subtitle">
                                                        {transaction.admin_users.full_name}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="chemical-name">{transaction.chemicals?.name || 'N/A'}</div>
                                        </td>
                                        <td>
                                            <span className={`action-badge ${transaction.action_type === 'add' ? 'success' : 'danger'}`}>
                                                {transaction.action_type === 'add' ? '+ Add' : '- Remove'}
                                            </span>
                                        </td>
                                        <td className="amount-cell">
                                            <span className={transaction.action_type === 'add' ? 'text-success' : 'text-danger'}>
                                                {transaction.action_type === 'add' ? '+' : '-'}{transaction.amount} {transaction.chemicals?.unit}
                                            </span>
                                        </td>
                                        <td>{transaction.previous_stock} {transaction.chemicals?.unit}</td>
                                        <td className="new-stock-cell">
                                            <strong>{transaction.new_stock} {transaction.chemicals?.unit}</strong>
                                        </td>
                                        <td className="notes-cell">{transaction.notes || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
