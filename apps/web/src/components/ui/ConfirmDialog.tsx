'use client'

import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[var(--bg-modal)] border border-[var(--border-strong)] rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-start gap-4 mb-5">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              variant === 'danger'
                ? 'bg-red-500/10 border border-red-500/20'
                : 'bg-amber-500/10 border border-amber-500/20'
            )}
          >
            <AlertTriangle
              className={cn('w-5 h-5', variant === 'danger' ? 'text-red-400' : 'text-amber-400')}
            />
          </div>
          <div>
            <p className="font-heading font-semibold text-[var(--text-primary)] text-sm mb-1">
              {title}
            </p>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="text-sm px-4 py-2 border border-[var(--border-ui)] hover:border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'text-sm px-4 py-2 rounded-xl font-medium transition-colors',
              variant === 'danger'
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
