import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { getUser } from '../lib/auth'
import toast from 'react-hot-toast'

export default function AddChemicalForm() {
    const [formData, setFormData] = useState({
        name: '',
        currentStock: '',
        unit: 'bags',
        lowStockThreshold: ''
    })
    const [submitting, setSubmitting] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.name || !formData.currentStock || !formData.lowStockThreshold) {
            toast.error('Please fill in all fields')
            return
        }

        const currentStock = parseFloat(formData.currentStock)
        const lowStockThreshold = parseFloat(formData.lowStockThreshold)

        if (isNaN(currentStock) || currentStock < 0) {
            toast.error('Please enter a valid current stock amount')
            return
        }

        if (isNaN(lowStockThreshold) || lowStockThreshold < 0) {
            toast.error('Please enter a valid low stock threshold')
            return
        }

        setSubmitting(true)

        try {
            const { data, error } = await supabase
                .from('chemicals')
                .insert({
                    name: formData.name.trim(),
                    current_stock: currentStock,
                    unit: formData.unit,
                    low_stock_threshold: lowStockThreshold
                })
                .select()

            if (error) {
                if (error.code === '23505') {
                    toast.error('A chemical with this name already exists')
                } else {
                    throw error
                }
                return
            }

            // Create initial stock log
            const currentUser = getUser()
            await supabase
                .from('stock_logs')
                .insert({
                    chemical_id: data[0].id,
                    action_type: 'add',
                    amount: currentStock,
                    previous_stock: 0,
                    new_stock: currentStock,
                    notes: 'Initial stock entry',
                    admin_user_id: currentUser?.id || null
                })

            toast.success(`Successfully added ${formData.name}`)

            // Reset form
            setFormData({
                name: '',
                currentStock: '',
                unit: 'bags',
                lowStockThreshold: ''
            })
        } catch (error) {
            console.error('Error adding chemical:', error)
            toast.error('Failed to add chemical')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">Add New Chemical</h2>
                <p className="text-slate-400">Register a new chemical in the inventory system</p>
            </div>

            <div className="max-w-2xl">
                <div className="card">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Chemical Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                                Chemical Name *
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="e.g., Chlorine, Sodium Hydroxide"
                                required
                            />
                        </div>

                        {/* Unit Selection */}
                        <div>
                            <label htmlFor="unit" className="block text-sm font-medium text-slate-300 mb-2">
                                Unit of Measurement *
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, unit: 'bags' }))}
                                    className={`py-3 px-4 rounded-lg font-medium transition-all ${formData.unit === 'bags'
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    Bags
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, unit: 'kilos' }))}
                                    className={`py-3 px-4 rounded-lg font-medium transition-all ${formData.unit === 'kilos'
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    Kilos
                                </button>
                            </div>
                        </div>

                        {/* Current Stock */}
                        <div>
                            <label htmlFor="currentStock" className="block text-sm font-medium text-slate-300 mb-2">
                                Initial Stock ({formData.unit}) *
                            </label>
                            <input
                                id="currentStock"
                                name="currentStock"
                                type="number"
                                step="0.01"
                                value={formData.currentStock}
                                onChange={handleChange}
                                className="input-field"
                                placeholder={`Enter initial ${formData.unit} amount`}
                                required
                            />
                        </div>

                        {/* Low Stock Threshold */}
                        <div>
                            <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-slate-300 mb-2">
                                Low Stock Alert Threshold ({formData.unit}) *
                            </label>
                            <input
                                id="lowStockThreshold"
                                name="lowStockThreshold"
                                type="number"
                                step="0.01"
                                value={formData.lowStockThreshold}
                                onChange={handleChange}
                                className="input-field"
                                placeholder={`e.g., 20 ${formData.unit}`}
                                required
                            />
                            <p className="text-slate-400 text-sm mt-1">
                                You will receive an alert when stock falls to or below this level
                            </p>
                        </div>

                        {/* Info Card */}
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="text-sm text-blue-300">
                                    <p className="font-medium mb-1">Automatic Notifications</p>
                                    <p className="text-blue-200/80">
                                        Email alerts will be sent automatically when stock levels reach the threshold you specify.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Adding Chemical...' : 'Add Chemical'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
