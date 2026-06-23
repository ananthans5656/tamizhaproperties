import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        background: 'rgba(14, 17, 23, 0.65)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onCancel}
    >
      <div
        className="tp-card"
        style={{
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 32px 80px rgba(0, 0, 0, 0.35)',
          borderRadius: 18,
          padding: 24,
          border: '1px solid var(--border-strong)',
          animation: 'modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'var(--danger-soft)',
              color: 'var(--danger)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 18,
              fontWeight: 'bold'
            }}
          >
            ⚠️
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>
              {title}
            </h3>
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 24 }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="tp-btn tp-btn-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className="tp-btn"
            style={{
              flex: 1,
              justifyContent: 'center',
              background: 'var(--danger)',
              color: '#fff',
              border: 'none',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
            }}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
