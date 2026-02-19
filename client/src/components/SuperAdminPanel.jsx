import React, { useState } from 'react'
import UserManagement from './UserManagement'
import StockTransactions from './StockTransactions'
import ChangePassword from './ChangePassword'
import './SuperAdminPanel.css'

export default function SuperAdminPanel() {
    const [activeTab, setActiveTab] = useState('users')

    return (
        <div className="super-admin-panel">
            <div className="panel-header">
                <h1>Super Admin Panel</h1>
                <p>Manage users, monitor activity, and track inventory changes</p>
            </div>

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    👥 User Management
                </button>
                <button
                    className={`tab ${activeTab === 'stock' ? 'active' : ''}`}
                    onClick={() => setActiveTab('stock')}
                >
                    📦 Stock Transactions
                </button>
                <button
                    className={`tab ${activeTab === 'password' ? 'active' : ''}`}
                    onClick={() => setActiveTab('password')}
                >
                    🔑 Change Password
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'users' && <UserManagement />}
                {activeTab === 'stock' && <StockTransactions />}
                {activeTab === 'password' && <ChangePassword />}
            </div>
        </div>
    )
}
