'use client'
import { motion } from 'framer-motion'
import { Check, X, Zap, Rocket, Lightbulb } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

interface Feature {
  label: string
  validate: string | boolean
  build: string | boolean
  launch: string | boolean
}

const FEATURES: Feature[] = [
  { label: 'Ideas',                     validate: '1',          build: '10',        launch: 'Unlimited' },
  { label: 'AI Validations',            validate: '1 / idea',   build: 'Unlimited', launch: 'Unlimited' },
  { label: 'AI Chat messages',          validate: '5 / idea',   build: 'Unlimited', launch: 'Unlimited' },
  { label: 'Pitch Deck',                validate: true,         build: true,        launch: true },
  { label: 'MVP Spec',                  validate: false,        build: true,        launch: true },
  { label: 'Business Plan',             validate: false,        build: true,        launch: true },
  { label: 'Financial Model',           validate: false,        build: true,        launch: true },
  { label: 'Legal Checklist',           validate: false,        build: true,        launch: true },
  { label: 'Agentic Market Research',   validate: false,        build: '2 / idea',  launch: 'Unlimited' },
  { label: 'Formation Navigator',       validate: false,        build: true,        launch: true },
  { label: 'Formation Documents',       validate: false,        build: '3 / plan',  launch: 'Unlimited' },
  { label: 'Compliance Calendar',       validate: false,        build: true,        launch: true },
  { label: 'Conversation history',      validate: false,        build: true,        launch: true },
  { label: 'GTM Strategy Generator',    validate: false,        build: false,       launch: true },
  { label: 'Investor Matching',         validate: false,        build: false,       launch: true },
  { label: 'Legal Risk Scanner',        validate: false,        build: false,       launch: true },
  { label: 'Term Sheet Analyzer',       validate: false,        build: false,       launch: true },
  { label: 'Investor CRM',             validate: false,        build: false,       launch: true },
  { label: 'Multi-Agent Validation',    validate: false,        build: false,       launch: true },
  { label: 'Support',                   validate: 'Community',  build: 'Email',     launch: 'Priority' },
]

const TIERS = [
  {
    key: 'validate',
    name: 'Validate',
    price: 'Free',
    sub: 'No credit card required',
    icon: Lightbulb,
    accent: 'stone',
    cta: 'Current plan',
    ctaDisabled: true,
    highlight: false,
  },
  {
    key: 'build',
    name: 'Build',
    price: '$19',
    sub: 'per month',
    icon: Zap,
    accent: 'orange',
    cta: 'Upgrade to Build',
    ctaDisabled: false,
    highlight: true,
  },
  {
    key: 'launch',
    name: 'Launch',
    price: '$49',
    sub: 'per month',
    icon: Rocket,
    accent: 'blue',
    cta: 'Upgrade to Launch',
    ctaDisabled: false,
    highlight: false,
  },
]

function Cell({ value }: { value: string | boolean }) {
  if (value === true)  return <Check className="w-4 h-4 text-emerald-400 mx-auto" />
  if (value === false) return <X className="w-4 h-4 text-[var(--text-muted)] mx-auto" />
  return <span className="text-sm text-[var(--text-primary)] font-medium">{value}</span>
}

export default function PricingPage() {
  const user = useAuthStore((s) => s.user)
  const currentTier = user?.subscription_tier ?? 'validate'

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center space-y-3"
      >
        <h1 className="font-heading text-4xl font-bold text-[var(--text-primary)] tracking-tight">
          Simple, honest pricing
        </h1>
        <p className="text-[var(--text-secondary)] text-base max-w-lg mx-auto">
          Start free and upgrade as your startup grows. No hidden fees, no surprises.
        </p>
      </motion.div>

      {/* Tier cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {TIERS.map((tier) => {
          const isCurrent = currentTier === tier.key
          const Icon = tier.icon
          return (
            <div
              key={tier.key}
              className={cn(
                'relative bg-[var(--bg-surface)] border rounded-2xl p-6 flex flex-col gap-5',
                tier.highlight
                  ? 'border-orange-500/40 ring-1 ring-orange-500/20'
                  : 'border-[var(--border-ui)]',
              )}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[10px] font-bold bg-orange-500 text-white px-3 py-1 rounded-full uppercase tracking-widest">
                    Most popular
                  </span>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    tier.accent === 'orange' ? 'bg-orange-500/15 border border-orange-500/25' :
                    tier.accent === 'blue'   ? 'bg-blue-500/15 border border-blue-500/25' :
                                              'bg-stone-500/15 border border-stone-500/25',
                  )}>
                    <Icon className={cn(
                      'w-4 h-4',
                      tier.accent === 'orange' ? 'text-orange-400' :
                      tier.accent === 'blue'   ? 'text-blue-400' : 'text-stone-400',
                    )} />
                  </div>
                  <span className="font-heading text-base font-bold text-[var(--text-primary)]">
                    {tier.name}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full ml-auto">
                      Current
                    </span>
                  )}
                </div>
                <div className="flex items-end gap-1">
                  <span className="font-heading text-3xl font-bold text-[var(--text-primary)]">
                    {tier.price}
                  </span>
                  {tier.price !== 'Free' && (
                    <span className="text-[var(--text-muted)] text-sm mb-1">/mo</span>
                  )}
                </div>
                <p className="text-[var(--text-muted)] text-xs">{tier.sub}</p>
              </div>

              <button
                disabled={tier.ctaDisabled || isCurrent}
                className={cn(
                  'w-full text-sm font-semibold py-2.5 rounded-xl transition-colors',
                  isCurrent || tier.ctaDisabled
                    ? 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)] cursor-default border border-[var(--border-ui)]'
                    : tier.accent === 'orange'
                      ? 'bg-orange-500 hover:bg-orange-500/90 text-white shadow-lg shadow-orange-500/20'
                      : 'bg-blue-500 hover:bg-blue-500/90 text-white shadow-lg shadow-blue-500/20',
                )}
              >
                {isCurrent ? 'Your current plan' : tier.cta}
              </button>
            </div>
          )
        })}
      </motion.div>

      {/* Feature comparison table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.16 }}
        className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl overflow-hidden"
      >
        {/* Table header */}
        <div className="grid grid-cols-[1fr_100px_100px_100px] gap-2 px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Feature</span>
          {TIERS.map((t) => (
            <span key={t.key} className={cn(
              'text-[10px] font-semibold uppercase tracking-widest text-center',
              t.highlight ? 'text-orange-400' : 'text-[var(--text-muted)]',
            )}>
              {t.name}
            </span>
          ))}
        </div>

        {/* Rows */}
        {FEATURES.map((f, i) => (
          <div
            key={f.label}
            className={cn(
              'grid grid-cols-[1fr_100px_100px_100px] gap-2 px-6 py-3 items-center border-b border-[var(--border-subtle)] last:border-0',
              i % 2 === 0 ? 'bg-[var(--bg-surface)]' : 'bg-[var(--bg-surface-hover)]/30',
            )}
          >
            <span className="text-sm text-[var(--text-secondary)]">{f.label}</span>
            <div className="text-center"><Cell value={f.validate} /></div>
            <div className="text-center"><Cell value={f.build} /></div>
            <div className="text-center"><Cell value={f.launch} /></div>
          </div>
        ))}
      </motion.div>

      <p className="text-center text-[var(--text-muted)] text-xs pb-4">
        Stripe billing coming soon. Contact us to upgrade early.
      </p>
    </div>
  )
}
