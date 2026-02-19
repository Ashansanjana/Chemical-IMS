import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { getToken } from '../lib/auth'
import { API_URL } from '../lib/api'
import ConfirmDialog from './ConfirmDialog'
import './UserManagement.css'

export default function UserManagement() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        fullName: '',
        role: 'ADMIN'
    })
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        type: 'danger',
        title: '',
        message: '',
        confirmText: 'Confirm',
        onConfirm: null
    })

    const openConfirm = (options) => {
        setConfirmDialog({ isOpen: true, ...options })
    }

    const closeConfirm = () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false, onConfirm: null }))
    }


    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_URL}/api/users`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            })
            const data = await response.json()
            setUsers(data.users || [])
        } catch (error) {
            console.error('Failed to fetch users:', error)
            toast.error('Failed to load users')
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = () => {
        setEditingUser(null)
        setFormData({
            username: '',
            password: '',
            email: '',
            fullName: '',
            role: 'ADMIN'
        })
        setShowModal(true)
    }

    const handleEdit = (user) => {
        setEditingUser(user)
        setFormData({
            username: user.username,
            password: '',
            email: user.email || '',
            fullName: user.full_name || '',
            role: user.role
        })
        setShowModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const url = editingUser ? `${API_URL}/api/users/${editingUser.id}` : `${API_URL}/api/users`
            const method = editingUser ? 'PUT' : 'POST'

            const payload = { ...formData }
            if (editingUser && !payload.password) {
                delete payload.password // Don't update password if empty
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                const error = await response.json()
                toast.error(error.error || 'Failed to save user')
                return
            }

            toast.success(editingUser ? 'User updated successfully' : 'User created successfully')
            setShowModal(false)
            fetchUsers()
        } catch (error) {
            console.error('Failed to save user:', error)
            toast.error('Failed to save user')
        }
    }

    const handleActivate = (userId) => {
        openConfirm({
            type: 'info',
            title: 'Activate User',
            message: 'Are you sure you want to activate this user? They will regain full access.',
            confirmText: 'Yes, Activate',
            onConfirm: async () => {
                closeConfirm()
                try {
                    const response = await fetch(`${API_URL}/api/users/${userId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${getToken()}`
                        },
                        body: JSON.stringify({ isActive: true })
                    })

                    if (!response.ok) {
                        const error = await response.json()
                        toast.error(error.error || 'Failed to activate user')
                        return
                    }

                    toast.success('User activated successfully')
                    fetchUsers()
                } catch (error) {
                    console.error('Failed to activate user:', error)
                    toast.error('Failed to activate user')
                }
            }
        })
    }

    const handleDeactivate = (userId) => {
        openConfirm({
            type: 'warning',
            title: 'Deactivate User',
            message: 'This user will lose access to the system. You can re-activate them later.',
            confirmText: 'Yes, Deactivate',
            onConfirm: async () => {
                closeConfirm()
                try {
                    const response = await fetch(`${API_URL}/api/users/${userId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${getToken()}` }
                    })

                    if (!response.ok) {
                        const error = await response.json()
                        toast.error(error.error || 'Failed to deactivate user')
                        return
                    }

                    toast.success('User deactivated successfully')
                    fetchUsers()
                } catch (error) {
                    console.error('Failed to deactivate user:', error)
                    toast.error('Failed to deactivate user')
                }
            }
        })
    }

    const handleDelete = (userId, username) => {
        openConfirm({
            type: 'danger',
            title: 'Permanently Delete User',
            message: `You are about to permanently delete "${username}". This action cannot be undone and all their data will be lost.`,
            confirmText: 'Delete Permanently',
            onConfirm: async () => {
                closeConfirm()
                try {
                    const response = await fetch(`${API_URL}/api/users/${userId}/permanent`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${getToken()}` }
                    })

                    if (!response.ok) {
                        const error = await response.json()
                        toast.error(error.error || 'Failed to delete user')
                        return
                    }

                    toast.success('User permanently deleted')
                    fetchUsers()
                } catch (error) {
                    console.error('Failed to delete user:', error)
                    toast.error('Failed to delete user')
                }
            }
        })
    }

    if (loading) {
        return <div className="loading">Loading users...</div>
    }

    return (
        <div className="user-management">
            <div className="header">
                <h2>User Management</h2>
                <button className="btn-primary" onClick={handleCreate}>
                    + Create User
                </button>
            </div>

            <table className="users-table">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Full Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Last Login</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.username}</td>
                            <td>{user.full_name || '-'}</td>
                            <td>{user.email || '-'}</td>
                            <td>
                                <span className={`role-badge ${user.role.toLowerCase()}`}>
                                    {user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                                </span>
                            </td>
                            <td>
                                <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                                    {user.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td>
                                {user.last_login
                                    ? new Date(user.last_login).toLocaleDateString()
                                    : 'Never'}
                            </td>
                            <td>
                                <button
                                    className="btn-small btn-edit"
                                    onClick={() => handleEdit(user)}
                                >
                                    Edit
                                </button>
                                {user.is_active ? (
                                    <button
                                        className="btn-small btn-danger"
                                        onClick={() => handleDeactivate(user.id)}
                                    >
                                        Deactivate
                                    </button>
                                ) : (
                                    <button
                                        className="btn-small btn-activate"
                                        onClick={() => handleActivate(user.id)}
                                    >
                                        Activate
                                    </button>
                                )}
                                <button
                                    className="btn-small btn-delete"
                                    onClick={() => handleDelete(user.id, user.username)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>{editingUser ? 'Edit User' : 'Create New User'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    disabled={!!editingUser}
                                    required
                                />
                            </div>

                            {!editingUser && (
                                <div className="form-group">
                                    <label>Password</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Role</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    required
                                >
                                    <option value="ADMIN">Admin</option>
                                    <option value="SUPER_ADMIN">Super Admin</option>
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingUser ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                type={confirmDialog.type}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText={confirmDialog.confirmText}
                cancelText="Cancel"
                onConfirm={confirmDialog.onConfirm}
                onCancel={closeConfirm}
            />
        </div>
    )
}
