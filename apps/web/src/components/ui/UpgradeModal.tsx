'use client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Check, Lightbulb, MessageSquare, FileText, BarChart2, Building2 } from 'lucide-react'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
}

const FREE_LIMITS = [
  { icon: Lightbulb,    text: '1 idea only' },
  { icon: MessageSquare, text: '5 AI chat messages' },
  { icon: FileText,     text: 'Pitch Deck only' },
]

const BUILD_UNLOCKS = [
  { icon: Lightbulb,    text: '10 ideas' },
  { icon: MessageSquare, text: 'Unlimited AI chat' },
  { icon: FileText,     text: 'All 6 document types' },
  { icon: BarChart2,    text: 'Agentic Market Research' },
  { icon: Building2,    text: 'Business Formation Navigator' },
]

export default function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const router = useRouter()

  function handleUpgrade() {
    onClose()
    router.push('/pricing')
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative px-6 pt-6 pb-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <h2 className="font-heading text-lg font-bold text-[var(--text-primary)] leading-tight">
                        You've hit your free limit
                      </h2>
                      <p className="text-[var(--text-secondary)] text-sm mt-0.5">
                        Upgrade to keep building
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors mt-0.5 shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-5">
                {/* Free tier limits */}
                <div>
                  <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">
                    Your current plan — Validate (Free)
                  </p>
                  <div className="space-y-2">
                    {FREE_LIMITS.map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                        <span className="text-sm text-[var(--text-secondary)] line-through">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Divider with arrow */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                  <div className="w-7 h-7 rounded-full bg-orange-500/15 border border-orange-500/25 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-orange-400" />
                  </div>
                  <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                </div>

                {/* Build tier unlocks */}
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest">
                      Build — $19/month
                    </p>
                    <span className="text-[10px] font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/25 px-2 py-0.5 rounded-full">
                      Most popular
                    </span>
                  </div>
                  <div className="space-y-2">
                    {BUILD_UNLOCKS.map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <Icon className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                        <span className="text-sm text-[var(--text-primary)]">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 flex flex-col gap-2.5">
                <button
                  onClick={handleUpgrade}
                  className="w-full bg-orange-500 hover:bg-orange-500/90 text-white text-sm font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-orange-500/25"
                >
                  View Plans & Upgrade
                </button>
                <button
                  onClick={onClose}
                  className="w-full text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-sm py-2 transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
