import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function Dashboard() {
    const [chemicals, setChemicals] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ total: 0, lowStock: 0, totalValue: 0 })

    useEffect(() => {
        fetchChemicals()
    }, [])

    const fetchChemicals = async () => {
        try {
            const { data, error } = await supabase
                .from('chemicals')
                .select('*')
                .order('name')

            if (error) throw error

            setChemicals(data || [])

            // Calculate stats
            const lowStockCount = data?.filter(c => c.current_stock <= c.low_stock_threshold).length || 0
            setStats({
                total: data?.length || 0,
                lowStock: lowStockCount,
                totalValue: data?.reduce((sum, c) => sum + c.current_stock, 0) || 0
            })
        } catch (error) {
            console.error('Error fetching chemicals:', error)
        } finally {
            setLoading(false)
        }
    }

    const stockData = chemicals.map(c => ({
        name: c.name,
        stock: c.current_stock,
        threshold: c.low_stock_threshold,
        unit: c.unit
    }))

    const pieData = chemicals.slice(0, 6).map(c => ({
        name: c.name,
        value: c.current_stock
    }))

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
                <p className="text-slate-400">Overview of chemical inventory and stock levels</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card bg-gradient-to-br from-blue-600 to-blue-700 border-none">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Total Chemicals</p>
                            <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
                        </div>
                        <div className="bg-white/20 p-3 rounded-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className={`card border-none ${stats.lowStock > 0 ? 'bg-gradient-to-br from-red-600 to-red-700' : 'bg-gradient-to-br from-green-600 to-green-700'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`${stats.lowStock > 0 ? 'text-red-100' : 'text-green-100'} text-sm font-medium`}>Low Stock Alerts</p>
                            <p className="text-3xl font-bold text-white mt-1">{stats.lowStock}</p>
                        </div>
                        <div className="bg-white/20 p-3 rounded-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="card bg-gradient-to-br from-purple-600 to-purple-700 border-none">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium">Total Stock Units</p>
                            <p className="text-3xl font-bold text-white mt-1">{stats.totalValue.toFixed(0)}</p>
                        </div>
                        <div className="bg-white/20 p-3 rounded-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div className="card">
                    <h3 className="text-xl font-semibold text-white mb-4">Stock Levels vs Thresholds</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stockData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="name" stroke="#94a3b8" angle={-45} textAnchor="end" height={100} />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                labelStyle={{ color: '#f1f5f9' }}
                            />
                            <Legend />
                            <Bar dataKey="stock" fill="#3b82f6" name="Current Stock" />
                            <Bar dataKey="threshold" fill="#ef4444" name="Low Stock Threshold" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie Chart */}
                <div className="card">
                    <h3 className="text-xl font-semibold text-white mb-4">Stock Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                                labelStyle={{ color: '#f1f5f9', fontWeight: 600 }}
                                itemStyle={{ color: '#cbd5e1' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Low Stock Alerts */}
            {stats.lowStock > 0 && (
                <div className="card border-l-4 border-red-500">
                    <div className="flex items-start space-x-3">
                        <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1">
                            <h4 className="text-lg font-semibold text-red-400 mb-2">Low Stock Alerts</h4>
                            <ul className="space-y-1">
                                {chemicals
                                    .filter(c => c.current_stock <= c.low_stock_threshold)
                                    .map(c => (
                                        <li key={c.id} className="text-slate-300">
                                            <span className="font-medium">{c.name}</span>: {c.current_stock} {c.unit}
                                            <span className="text-slate-400"> (Threshold: {c.low_stock_threshold} {c.unit})</span>
                                        </li>
                                    ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
