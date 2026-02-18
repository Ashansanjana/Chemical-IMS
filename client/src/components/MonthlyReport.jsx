import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { isSuperAdmin, getUser } from '../lib/auth'

// ─── Super Admin View (existing grouped summary) ───────────────────────────
function SuperAdminReport() {
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
    const [reportData, setReportData] = useState([])
    const [loading, setLoading] = useState(false)
    const [totals, setTotals] = useState({ addedByUnit: {}, removedByUnit: {}, transactions: 0 })

    useEffect(() => {
        if (selectedMonth) fetchReport()
    }, [selectedMonth])

    const fetchReport = async () => {
        setLoading(true)
        try {
            const startDate = new Date(selectedMonth + '-01')
            const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59)

            const { data: logs, error } = await supabase
                .from('stock_logs')
                .select('*, chemical_name, chemicals (name, unit)')
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString())
                .order('created_at', { ascending: false })

            if (error) throw error

            const grouped = {}
            const addedByUnit = {}
            const removedByUnit = {}

            logs.forEach(log => {
                // Use snapshot name if chemical was deleted
                const chemicalName = log.chemicals?.name || log.chemical_name || 'Deleted Chemical'
                const unit = log.chemicals?.unit || '-'
                if (!grouped[chemicalName]) {
                    grouped[chemicalName] = { name: chemicalName, unit, added: 0, removed: 0, transactions: 0, logs: [] }
                }
                // Only count real add/remove actions for known (non-deleted) chemicals in the summary totals
                const isKnownUnit = unit !== '-'
                if (log.action_type === 'add') {
                    grouped[chemicalName].added += log.amount
                    if (isKnownUnit) addedByUnit[unit] = (addedByUnit[unit] || 0) + log.amount
                } else if (log.action_type === 'remove') {
                    grouped[chemicalName].removed += log.amount
                    if (isKnownUnit) removedByUnit[unit] = (removedByUnit[unit] || 0) + log.amount
                }
                // Don't count 'delete' action as a transaction in the summary
                if (log.action_type !== 'delete') {
                    grouped[chemicalName].transactions++
                }
                grouped[chemicalName].logs.push(log)
            })

            setReportData(Object.values(grouped))
            setTotals({ addedByUnit, removedByUnit, transactions: logs.length })
        } catch (error) {
            console.error('Error fetching report:', error)
            toast.error('Failed to fetch report')
        } finally {
            setLoading(false)
        }
    }

    const exportReport = () => {
        let csv = 'Chemical,Unit,Added,Removed,Net Change,Transactions\n'
        reportData.forEach(item => {
            csv += `${item.name},${item.unit},${item.added},${item.removed},${item.added - item.removed},${item.transactions}\n`
        })
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `chemical-report-${selectedMonth}.csv`
        a.click()
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">Monthly Report</h2>
                <p className="text-slate-400">View and export chemical usage statistics</p>
            </div>

            <div className="card">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex-1">
                        <label htmlFor="month" className="block text-sm font-medium text-slate-300 mb-2">Select Month</label>
                        <input
                            id="month"
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="input-field max-w-xs"
                        />
                    </div>
                    {reportData.length > 0 && (
                        <button onClick={exportReport} className="btn-secondary flex items-center space-x-2 mt-6">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Export CSV</span>
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="card bg-gradient-to-br from-green-600 to-green-700 border-none">
                            <p className="text-green-100 text-sm font-medium">Total Added</p>
                            {Object.keys(totals.addedByUnit).length === 0 ? (
                                <p className="text-white mt-1 text-sm">No additions</p>
                            ) : (
                                Object.entries(totals.addedByUnit).map(([unit, val]) => (
                                    <p key={unit} className="text-white mt-1">
                                        <span className="text-3xl font-bold">{val.toFixed(2)}</span>
                                        <span className="text-green-200 text-sm ml-2">{unit}</span>
                                    </p>
                                ))
                            )}
                        </div>
                        <div className="card bg-gradient-to-br from-red-600 to-red-700 border-none">
                            <p className="text-red-100 text-sm font-medium">Total Removed</p>
                            {Object.keys(totals.removedByUnit).length === 0 ? (
                                <p className="text-white mt-1 text-sm">No removals</p>
                            ) : (
                                Object.entries(totals.removedByUnit).map(([unit, val]) => (
                                    <p key={unit} className="text-white mt-1">
                                        <span className="text-3xl font-bold">{val.toFixed(2)}</span>
                                        <span className="text-red-200 text-sm ml-2">{unit}</span>
                                    </p>
                                ))
                            )}
                        </div>
                        <div className="card bg-gradient-to-br from-blue-600 to-blue-700 border-none">
                            <p className="text-blue-100 text-sm font-medium">Transactions</p>
                            <p className="text-3xl font-bold text-white mt-1">{totals.transactions}</p>
                            <p className="text-blue-200 text-xs mt-1">Total actions</p>
                        </div>
                    </div>

                    <div className="card overflow-hidden p-0">
                        {reportData.length === 0 ? (
                            <div className="p-12 text-center">
                                <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-slate-400 text-lg">No data for selected month</p>
                                <p className="text-slate-500 text-sm mt-1">Try selecting a different month</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="table-header">
                                        <tr>
                                            <th className="px-6 py-3 text-left">Chemical</th>
                                            <th className="px-6 py-3 text-left">Unit</th>
                                            <th className="px-6 py-3 text-right">Added</th>
                                            <th className="px-6 py-3 text-right">Removed</th>
                                            <th className="px-6 py-3 text-right">Net Change</th>
                                            <th className="px-6 py-3 text-center">Transactions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.map((item, index) => {
                                            const netChange = item.added - item.removed
                                            return (
                                                <tr key={index} className="table-row">
                                                    <td className="px-6 py-4 font-medium text-white">{item.name}</td>
                                                    <td className="px-6 py-4 text-slate-300">{item.unit}</td>
                                                    <td className="px-6 py-4 text-right text-green-400 font-semibold">+{item.added.toFixed(2)}</td>
                                                    <td className="px-6 py-4 text-right text-red-400 font-semibold">-{item.removed.toFixed(2)}</td>
                                                    <td className={`px-6 py-4 text-right font-semibold ${netChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {netChange >= 0 ? '+' : ''}{netChange.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-slate-300">{item.transactions}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

// ─── Admin View (own transactions, date range, detailed log) ───────────────
function AdminReport() {
    const today = new Date().toISOString().slice(0, 10)
    const firstOfMonth = new Date().toISOString().slice(0, 7) + '-01'

    const [startDate, setStartDate] = useState(firstOfMonth)
    const [endDate, setEndDate] = useState(today)
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(false)

    const currentUser = getUser()

    useEffect(() => {
        fetchLogs()
    }, [])

    const fetchLogs = async () => {
        if (!startDate || !endDate) return
        setLoading(true)
        try {
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)

            let query = supabase
                .from('stock_logs')
                .select('*, chemical_name, chemicals (name, unit), admin_users (username, full_name)')
                .gte('created_at', start.toISOString())
                .lte('created_at', end.toISOString())
                .order('created_at', { ascending: false })

            // Filter by this admin's user id
            if (currentUser?.id) {
                query = query.eq('admin_user_id', currentUser.id)
            }

            const { data, error } = await query
            if (error) throw error
            setLogs(data || [])
        } catch (error) {
            console.error('Error fetching logs:', error)
            toast.error('Failed to fetch transactions')
        } finally {
            setLoading(false)
        }
    }

    const exportCSV = () => {
        if (logs.length === 0) return
        let csv = 'Date & Time,Admin User,Chemical,Action,Amount,Previous Stock,New Stock,Notes\n'
        logs.forEach(log => {
            const adminName = log.admin_users?.full_name || log.admin_users?.username || 'Unknown'
            const chemical = log.chemicals?.name || log.chemical_name || 'Deleted Chemical'
            const unit = log.chemicals?.unit || ''
            const date = new Date(log.created_at).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: true
            })
            csv += `"${date}","${adminName}","${chemical}","${log.action_type.toUpperCase()}","${log.amount} ${unit}","${log.previous_stock} ${unit}","${log.new_stock} ${unit}","${log.notes || ''}"\n`
        })
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `my-transactions-${startDate}-to-${endDate}.csv`
        a.click()
        toast.success('Report downloaded!')
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">My Transactions</h2>
                <p className="text-slate-400">View and download your stock activity for a selected date range</p>
            </div>

            {/* Date Range Controls */}
            <div className="card">
                <div className="flex flex-col sm:flex-row gap-4 items-end justify-between">
                    <div className="flex flex-col sm:flex-row gap-4 flex-1">
                        <div className="flex-1">
                            <label htmlFor="startDate" className="block text-sm font-medium text-slate-300 mb-2">From</label>
                            <input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="input-field"
                            />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="endDate" className="block text-sm font-medium text-slate-300 mb-2">To</label>
                            <input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="input-field"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchLogs}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            Search
                        </button>
                        {logs.length > 0 && (
                            <button
                                onClick={exportCSV}
                                className="btn-secondary flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download CSV
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Results */}
            {loading ? (
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="card overflow-hidden p-0">
                    {logs.length === 0 ? (
                        <div className="p-12 text-center">
                            <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-slate-400 text-lg">No transactions found</p>
                            <p className="text-slate-500 text-sm mt-1">Try adjusting the date range and searching again</p>
                        </div>
                    ) : (
                        <>
                            <div className="px-6 py-3 border-b border-slate-700 flex items-center justify-between">
                                <span className="text-slate-400 text-sm">{logs.length} transaction{logs.length !== 1 ? 's' : ''} found</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="table-header">
                                        <tr>
                                            <th className="px-6 py-3 text-left whitespace-nowrap">Date &amp; Time</th>
                                            <th className="px-6 py-3 text-left">Admin User</th>
                                            <th className="px-6 py-3 text-left">Chemical</th>
                                            <th className="px-6 py-3 text-left">Action</th>
                                            <th className="px-6 py-3 text-left">Amount</th>
                                            <th className="px-6 py-3 text-left whitespace-nowrap">Previous Stock</th>
                                            <th className="px-6 py-3 text-left whitespace-nowrap">New Stock</th>
                                            <th className="px-6 py-3 text-left">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log) => {
                                            const adminName = log.admin_users?.full_name || log.admin_users?.username || 'Unknown'
                                            const unit = log.chemicals?.unit || ''
                                            const chemicalName = log.chemicals?.name || log.chemical_name || 'Deleted Chemical'
                                            const isAdd = log.action_type === 'add'
                                            const isDelete = log.action_type === 'delete'
                                            const dateStr = new Date(log.created_at).toLocaleString('en-US', {
                                                month: 'short', day: 'numeric', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit', hour12: true
                                            })

                                            const actionBadge = isDelete
                                                ? <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-500/30 text-slate-300 border border-slate-500/40">🗑 DELETED</span>
                                                : isAdd
                                                    ? <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/40">+ ADD</span>
                                                    : <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40">- REMOVE</span>

                                            const amountColor = isDelete ? 'text-slate-400' : isAdd ? 'text-green-400' : 'text-red-400'
                                            const amountPrefix = isDelete ? '' : isAdd ? '+' : '-'

                                            return (
                                                <tr key={log.id} className="table-row">
                                                    <td className="px-6 py-4 text-slate-300 text-sm whitespace-nowrap">{dateStr}</td>
                                                    <td className="px-6 py-4 font-medium text-white">{adminName}</td>
                                                    <td className="px-6 py-4 font-semibold text-white">
                                                        {chemicalName}
                                                        {isDelete && <span className="ml-2 text-xs text-slate-500">(deleted)</span>}
                                                    </td>
                                                    <td className="px-6 py-4">{actionBadge}</td>
                                                    <td className={`px-6 py-4 font-semibold ${amountColor}`}>
                                                        {amountPrefix}{log.amount} {unit}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-300">{log.previous_stock} {unit}</td>
                                                    <td className="px-6 py-4 font-bold text-white">{log.new_stock} {unit}</td>
                                                    <td className="px-6 py-4 text-slate-400 text-sm">{log.notes || '-'}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

// ─── Root export ───────────────────────────────────────────────────────────
export default function MonthlyReport() {
    return isSuperAdmin() ? <SuperAdminReport /> : <AdminReport />
}
