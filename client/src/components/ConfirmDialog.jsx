import React from 'react'
import './ConfirmDialog.css'

/**
 * ConfirmDialog - A beautiful custom confirmation modal.
 *
 * Props:
 *   isOpen      {boolean}  - Whether the dialog is visible
 *   type        {string}   - 'danger' | 'warning' | 'info'  (controls icon & confirm btn color)
 *   title       {string}   - Dialog heading
 *   message     {string}   - Body copy / description
 *   confirmText {string}   - Label for confirm button (default "Confirm")
 *   cancelText  {string}   - Label for cancel button (default "Cancel")
 *   onConfirm   {function} - Called when user clicks confirm
 *   onCancel    {function} - Called when user clicks cancel or overlay
 */
export default function ConfirmDialog({
    isOpen,
    type = 'danger',
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel
}) {
    if (!isOpen) return null

    const icons = {
        danger: (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#7f1d1d" />
                <path d="M12 7v5" stroke="#fca5a5" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="12" cy="16" r="1.2" fill="#fca5a5" />
            </svg>
        ),
        warning: (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    fill="#78350f" stroke="#fbbf24" strokeWidth="1.5" />
                <line x1="12" y1="9" x2="12" y2="13" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="16.5" r="1" fill="#fbbf24" />
            </svg>
        ),
        info: (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#1e3a5f" />
                <line x1="12" y1="8" x2="12" y2="8" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="12" y1="11" x2="12" y2="16" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
            </svg>
        )
    }

    return (
        <div className="cdialog-overlay" onClick={onCancel}>
            <div className={`cdialog cdialog--${type}`} onClick={e => e.stopPropagation()}>
                <div className="cdialog__icon">
                    {icons[type]}
                </div>
                <div className="cdialog__body">
                    {title && <h3 className="cdialog__title">{title}</h3>}
                    {message && <p className="cdialog__message">{message}</p>}
                </div>
                <div className="cdialog__actions">
                    <button className="cdialog__btn cdialog__btn--cancel" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button className={`cdialog__btn cdialog__btn--confirm cdialog__btn--${type}`} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
