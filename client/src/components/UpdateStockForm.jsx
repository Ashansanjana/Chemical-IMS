import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getUser } from '../lib/auth'
import { API_URL } from '../lib/api'
import toast from 'react-hot-toast'

export default function UpdateStockForm() {
    const [chemicals, setChemicals] = useState([])
    const [selectedChemical, setSelectedChemical] = useState('')
    const [amount, setAmount] = useState('')
    const [action, setAction] = useState('add')
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchChemicals()
    }, [])

    const fetchChemicals = async () => {
        setLoading(true)
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

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!selectedChemical || !amount) {
            toast.error('Please fill in all fields')
            return
        }

        const amountNum = parseFloat(amount)
        if (isNaN(amountNum) || amountNum <= 0) {
            toast.error('Please enter a valid amount')
            return
        }

        setSubmitting(true)

        try {
            // Get current chemical data
            const { data: chemical, error: fetchError } = await supabase
                .from('chemicals')
                .select('*')
                .eq('id', selectedChemical)
                .single()

            if (fetchError) throw fetchError

            // Calculate new stock
            const previousStock = chemical.current_stock
            const newStock = action === 'add'
                ? previousStock + amountNum
                : Math.max(0, previousStock - amountNum)

            // Update chemical stock
            const { error: updateError } = await supabase
                .from('chemicals')
                .update({ current_stock: newStock })
                .eq('id', selectedChemical)

            if (updateError) throw updateError

            // Create stock log
            const currentUser = getUser()
            const { error: logError } = await supabase
                .from('stock_logs')
                .insert({
                    chemical_id: selectedChemical,
                    action_type: action,
                    amount: amountNum,
                    previous_stock: previousStock,
                    new_stock: newStock,
                    notes: `${action === 'add' ? 'Added' : 'Removed'} ${amountNum} ${chemical.unit}`,
                    admin_user_id: currentUser?.id || null
                })

            if (logError) throw logError

            toast.success(`Successfully ${action === 'add' ? 'added' : 'removed'} ${amountNum} ${chemical.unit} ${action === 'add' ? 'to' : 'from'} ${chemical.name}`)

            // Reset form
            setAmount('')
            setSelectedChemical('')
            setAction('add')

            // Refresh chemicals
            fetchChemicals()

            // Check if stock is low and notify
            if (newStock <= chemical.low_stock_threshold) {
                try {
                    await fetch(`${API_URL}/api/notifications/check-low-stock`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chemicalId: selectedChemical })
                    })
                } catch (err) {
                    console.error('Failed to send notification:', err)
                }
            }
        } catch (error) {
            console.error('Error updating stock:', error)
            toast.error('Failed to update stock')
        } finally {
            setSubmitting(false)
        }
    }

    const selectedChemicalData = chemicals.find(c => c.id === selectedChemical)

    const amountNum = parseFloat(amount)
    const isExceedingStock = action === 'remove' &&
        selectedChemicalData &&
        !isNaN(amountNum) &&
        amountNum > selectedChemicalData.current_stock

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">Update Stock</h2>
                <p className="text-slate-400">Add or remove chemical stock quantities</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form */}
                <div className="card">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Action Type */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Action Type</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setAction('add')}
                                    className={`py-3 px-4 rounded-lg font-medium transition-all ${action === 'add'
                                        ? 'bg-green-600 text-white shadow-lg'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    Add Stock
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAction('remove')}
                                    className={`py-3 px-4 rounded-lg font-medium transition-all ${action === 'remove'
                                        ? 'bg-red-600 text-white shadow-lg'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    Remove Stock
                                </button>
                            </div>
                        </div>

                        {/* Select Chemical */}
                        <div>
                            <label htmlFor="chemical" className="block text-sm font-medium text-slate-300 mb-2">
                                Select Chemical *
                            </label>
                            <select
                                id="chemical"
                                value={selectedChemical}
                                onChange={(e) => setSelectedChemical(e.target.value)}
                                className="input-field"
                                required
                            >
                                <option value="">-- Choose a chemical --</option>
                                {chemicals.map((chemical) => (
                                    <option key={chemical.id} value={chemical.id}>
                                        {chemical.name} (Current: {chemical.current_stock} {chemical.unit})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Amount */}
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-2">
                                Amount {selectedChemicalData && `(${selectedChemicalData.unit})`} *
                            </label>
                            <input
                                id="amount"
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="input-field"
                                placeholder="Enter amount"
                                required
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting || loading || isExceedingStock}
                            className={`w-full ${action === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {submitting ? 'Updating...' : isExceedingStock ? 'Exceeds Available Stock' : `${action === 'add' ? 'Add' : 'Remove'} Stock`}
                        </button>
                    </form>
                </div>

                {/* Preview */}
                {selectedChemicalData && (
                    <div className="card">
                        <h3 className="text-xl font-semibold text-white mb-4">Stock Preview</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-slate-700/50 rounded-lg">
                                <span className="text-slate-300">Chemical</span>
                                <span className="font-semibold text-white">{selectedChemicalData.name}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-slate-700/50 rounded-lg">
                                <span className="text-slate-300">Current Stock</span>
                                <span className="font-semibold text-white">{selectedChemicalData.current_stock} {selectedChemicalData.unit}</span>
                            </div>
                            {amount && !isNaN(parseFloat(amount)) && (
                                <>
                                    <div className="flex justify-between items-center p-4 bg-slate-700/50 rounded-lg">
                                        <span className="text-slate-300">Change</span>
                                        <span className={`font-semibold ${action === 'add' ? 'text-green-400' : 'text-red-400'}`}>
                                            {action === 'add' ? '+' : '-'}{parseFloat(amount)} {selectedChemicalData.unit}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-blue-600/20 border border-blue-500/50 rounded-lg">
                                        <span className="text-blue-300 font-medium">New Stock</span>
                                        <span className="font-bold text-white text-lg">
                                            {action === 'add'
                                                ? selectedChemicalData.current_stock + parseFloat(amount)
                                                : Math.max(0, selectedChemicalData.current_stock - parseFloat(amount))
                                            } {selectedChemicalData.unit}
                                        </span>
                                    </div>
                                    {isExceedingStock && (
                                        <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-4">
                                            <div className="flex items-center space-x-2">
                                                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                </svg>
                                                <span className="text-orange-400 font-medium">Cannot remove more than available stock ({selectedChemicalData.current_stock} {selectedChemicalData.unit})</span>
                                            </div>
                                        </div>
                                    )}
                                    {!isExceedingStock && (action === 'remove' ? Math.max(0, selectedChemicalData.current_stock - parseFloat(amount)) : selectedChemicalData.current_stock + parseFloat(amount)) <= selectedChemicalData.low_stock_threshold && (
                                        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                                            <div className="flex items-center space-x-2">
                                                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                <span className="text-red-400 font-medium">Low stock alert will be triggered</span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
