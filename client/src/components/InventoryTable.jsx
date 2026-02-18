import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { isSuperAdmin, getUser } from '../lib/auth'

export default function InventoryTable() {
    const [chemicals, setChemicals] = useState([])
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState(null)
    const [confirmDelete, setConfirmDelete] = useState(null) // { id, name }

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
        } catch (error) {
            console.error('Error fetching chemicals:', error)
            toast.error('Failed to fetch chemicals')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteConfirm = async () => {
        if (!confirmDelete) return
        const { id, name, current_stock } = confirmDelete
        setConfirmDelete(null)
        setDeleting(id)
        try {
            // Log the delete action BEFORE deleting (so chemical_id FK still resolves)
            const currentUser = getUser()
            await supabase.from('stock_logs').insert({
                chemical_id: id,
                chemical_name: name,
                action_type: 'delete',
                amount: current_stock ?? 0,
                previous_stock: current_stock ?? 0,
                new_stock: 0,
                notes: `Chemical "${name}" deleted from system`,
                admin_user_id: currentUser?.id || null
            })

            const { error } = await supabase
                .from('chemicals')
                .delete()
                .eq('id', id)

            if (error) throw error

            setChemicals(chemicals.filter(c => c.id !== id))
            toast.success(`Successfully deleted "${name}"`)
        } catch (error) {
            console.error('Error deleting chemical:', error)
            toast.error('Failed to delete chemical')
        } finally {
            setDeleting(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Confirm Delete Dialog */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                        <h3 className="text-lg font-semibold text-white mb-2">Confirm Delete</h3>
                        <p className="text-slate-300 text-sm mb-6">
                            Are you sure you want to delete <span className="font-semibold text-white">"{confirmDelete.name}"</span>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all text-sm font-medium"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Chemical Inventory</h2>
                    <p className="text-slate-400">Manage and view all chemicals in the system</p>
                </div>
                <span className="text-sm text-slate-400">{chemicals.length} chemicals</span>
            </div>

            <div className="card overflow-hidden p-0">
                {chemicals.length === 0 ? (
                    <div className="p-12 text-center">
                        <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-slate-400 text-lg">No chemicals in inventory</p>
                        <p className="text-slate-500 text-sm mt-1">Add your first chemical to get started</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="table-header">
                                <tr>
                                    <th className="px-6 py-3 text-left">Chemical Name</th>
                                    <th className="px-6 py-3 text-left">Current Stock</th>
                                    <th className="px-6 py-3 text-left">Unit</th>
                                    <th className="px-6 py-3 text-left">Low Stock Threshold</th>
                                    <th className="px-6 py-3 text-left">Status</th>
                                    <th className="px-6 py-3 text-left">Last Updated</th>
                                    {isSuperAdmin() && <th className="px-6 py-3 text-center">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {chemicals.map((chemical) => {
                                    const isLowStock = chemical.current_stock <= chemical.low_stock_threshold
                                    return (
                                        <tr key={chemical.id} className="table-row">
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-white">{chemical.name}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`font-semibold ${isLowStock ? 'text-red-400' : 'text-green-400'}`}>
                                                    {chemical.current_stock}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">{chemical.unit}</td>
                                            <td className="px-6 py-4 text-slate-300">{chemical.low_stock_threshold}</td>
                                            <td className="px-6 py-4">
                                                {isLowStock ? (
                                                    <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                                                        Low Stock
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                                                        Good
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 text-sm">
                                                {new Date(chemical.updated_at).toLocaleDateString()}
                                            </td>
                                            {isSuperAdmin() && (
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => setConfirmDelete({ id: chemical.id, name: chemical.name, current_stock: chemical.current_stock })}
                                                        disabled={deleting === chemical.id}
                                                        className="btn-danger text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {deleting === chemical.id ? 'Deleting...' : 'Delete'}
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
