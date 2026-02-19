import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { getToken } from '../lib/auth'
import { API_URL } from '../lib/api'
import './ChangePassword.css'

export default function ChangePassword() {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [loading, setLoading] = useState(false)
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const handleChange = (field) => (e) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }))
    }

    const getStrength = (pwd) => {
        if (!pwd) return { score: 0, label: '', color: '' }
        let score = 0
        if (pwd.length >= 8) score++
        if (/[A-Z]/.test(pwd)) score++
        if (/[0-9]/.test(pwd)) score++
        if (/[^A-Za-z0-9]/.test(pwd)) score++
        const levels = [
            { score: 0, label: '', color: '' },
            { score: 1, label: 'Weak', color: '#ef4444' },
            { score: 2, label: 'Fair', color: '#f59e0b' },
            { score: 3, label: 'Good', color: '#3b82f6' },
            { score: 4, label: 'Strong', color: '#10b981' }
        ]
        return levels[score]
    }

    const strength = getStrength(formData.newPassword)

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('New passwords do not match')
            return
        }

        if (formData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        setLoading(true)
        try {
            const response = await fetch(`${API_URL}/api/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                })
            })

            const data = await response.json()

            if (!response.ok) {
                toast.error(data.error || 'Failed to change password')
                return
            }

            toast.success('Password changed successfully!')
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        } catch (error) {
            console.error('Change password error:', error)
            toast.error('Failed to change password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="chpwd-wrapper">
            <div className="chpwd-card">
                {/* Icon */}
                <div className="chpwd-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="11" width="18" height="11" rx="2" fill="#1e40af" stroke="#3b82f6" strokeWidth="1.5" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
                        <circle cx="12" cy="16" r="1.5" fill="#93c5fd" />
                    </svg>
                </div>

                <h2 className="chpwd-title">Change Password</h2>
                <p className="chpwd-subtitle">Update your account password below</p>

                <form className="chpwd-form" onSubmit={handleSubmit}>
                    {/* Current Password */}
                    <div className="chpwd-field">
                        <label>Current Password</label>
                        <div className="chpwd-input-wrap">
                            <input
                                type={showCurrent ? 'text' : 'password'}
                                value={formData.currentPassword}
                                onChange={handleChange('currentPassword')}
                                placeholder="Enter current password"
                                required
                            />
                            <button type="button" className="chpwd-eye" onClick={() => setShowCurrent(v => !v)}>
                                {showCurrent ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div className="chpwd-field">
                        <label>New Password</label>
                        <div className="chpwd-input-wrap">
                            <input
                                type={showNew ? 'text' : 'password'}
                                value={formData.newPassword}
                                onChange={handleChange('newPassword')}
                                placeholder="Enter new password"
                                required
                            />
                            <button type="button" className="chpwd-eye" onClick={() => setShowNew(v => !v)}>
                                {showNew ? '🙈' : '👁️'}
                            </button>
                        </div>
                        {/* Strength meter */}
                        {formData.newPassword && (
                            <div className="chpwd-strength">
                                <div className="chpwd-strength-bar">
                                    {[1, 2, 3, 4].map(i => (
                                        <div
                                            key={i}
                                            className="chpwd-strength-seg"
                                            style={{ background: i <= strength.score ? strength.color : '#334155' }}
                                        />
                                    ))}
                                </div>
                                <span style={{ color: strength.color }}>{strength.label}</span>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="chpwd-field">
                        <label>Confirm New Password</label>
                        <div className="chpwd-input-wrap">
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                value={formData.confirmPassword}
                                onChange={handleChange('confirmPassword')}
                                placeholder="Re-enter new password"
                                required
                            />
                            <button type="button" className="chpwd-eye" onClick={() => setShowConfirm(v => !v)}>
                                {showConfirm ? '🙈' : '👁️'}
                            </button>
                        </div>
                        {/* Match indicator */}
                        {formData.confirmPassword && (
                            <div className={`chpwd-match ${formData.newPassword === formData.confirmPassword ? 'match' : 'nomatch'}`}>
                                {formData.newPassword === formData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="chpwd-submit"
                        disabled={loading}
                    >
                        {loading ? 'Updating...' : '🔒 Update Password'}
                    </button>
                </form>
            </div>
        </div>
    )
}
