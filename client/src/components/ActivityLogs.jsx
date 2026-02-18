import React, { useState, useEffect } from 'react'
import { getToken } from '../lib/auth'
import './ActivityLogs.css'

export default function ActivityLogs() {
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        action: '',
        userId: '',
        startDate: '',
        endDate: ''
    })

    useEffect(() => {
        fetchLogs()
    }, [filters])

    const fetchLogs = async () => {
        try {
            const params = new URLSearchParams()
            if (filters.action) params.append('action', filters.action)
            if (filters.userId) params.append('userId', filters.userId)
            if (filters.startDate) params.append('startDate', filters.startDate)
            if (filters.endDate) params.append('endDate', filters.endDate)
            params.append('limit', '50')

            const response = await fetch(`/api/activity?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            })
            const data = await response.json()
            setLogs(data.logs || [])
        } catch (error) {
            console.error('Failed to fetch activity logs:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString()
    }

    const getActionBadgeClass = (action) => {
        const map = {
            CREATE: 'success',
            UPDATE: 'info',
            DELETE: 'danger',
            LOGIN: 'primary',
            LOGOUT: 'secondary'
        }
        return map[action] || 'default'
    }

    if (loading) {
        return <div className="loading">Loading activity logs...</div>
    }

    return (
        <div className="activity-logs">
            <h2>Activity Logs</h2>

            <div className="filters">
                <div className="filter-group">
                    <label>Action</label>
                    <select
                        value={filters.action}
                        onChange={e => setFilters({ ...filters, action: e.target.value })}
                    >
                        <option value="">All Actions</option>
                        <option value="CREATE">Create</option>
                        <option value="UPDATE">Update</option>
                        <option value="DELETE">Delete</option>
                        <option value="LOGIN">Login</option>
                        <option value="LOGOUT">Logout</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Start Date</label>
                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                    />
                </div>

                <div className="filter-group">
                    <label>End Date</label>
                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                    />
                </div>

                <button className="btn-filter" onClick={fetchLogs}>Apply Filters</button>
            </div>

            <div className="logs-table-container">
                <table className="logs-table">
                    <thead>
                        <tr>
                            <th>Date & Time</th>
                            <th>User</th>
                            <th>Action</th>
                            <th>Table</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                                    No activity logs found
                                </td>
                            </tr>
                        ) : (
                            logs.map(log => (
                                <tr key={log.id}>
                                    <td>{formatDate(log.created_at)}</td>
                                    <td>
                                        <div>
                                            <strong>{log.admin_users?.username || 'Unknown'}</strong>
                                            {log.admin_users?.full_name && (
                                                <div className="user-subtitle">
                                                    {log.admin_users.full_name}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`action-badge ${getActionBadgeClass(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td>{log.table_name || '-'}</td>
                                    <td>
                                        {log.record_id && (
                                            <div className="log-detail">
                                                ID: {log.record_id}
                                            </div>
                                        )}
                                        {log.new_values && (
                                            <details className="json-details">
                                                <summary>View Changes</summary>
                                                <pre>{JSON.stringify(log.new_values, null, 2)}</pre>
                                            </details>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
