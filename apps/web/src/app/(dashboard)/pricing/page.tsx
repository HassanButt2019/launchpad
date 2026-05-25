'use client'
import { motion } from 'framer-motion'
import { Check, X, Zap, Lightbulb, Mail } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

interface Feature {
  label: string
  free: string | boolean
  paid: string | boolean
}

const FEATURES: Feature[] = [
  { label: 'Ideas',                   free: 'Unlimited',  paid: 'Unlimited' },
  { label: 'AI validations',          free: '1 total',    paid: 'Unlimited' },
  { label: 'AI chat messages',        free: '5 total',    paid: 'Unlimited' },
  { label: 'Startup checklist',       free: true,         paid: true },
  { label: 'Journey overview',        free: true,         paid: true },
  { label: 'Pitch deck generation',   free: true,         paid: true },
  { label: 'Business plan',           free: false,        paid: true },
  { label: 'MVP spec',                free: false,        paid: true },
  { label: 'Financial model',         free: false,        paid: true },
  { label: 'Legal checklist',         free: false,        paid: true },
  { label: 'Market research report',  free: false,        paid: true },
  { label: 'Agentic market research', free: false,        paid: true },
  { label: 'Formation navigator',     free: false,        paid: true },
  { label: 'Formation documents',     free: false,        paid: true },
  { label: 'Compliance calendar',     free: false,        paid: true },
]

const TIERS = [
  {
    key: 'validate',
    name: 'Free',
    price: 'Free',
    sub: 'Explore unlimited startup ideas',
    icon: Lightbulb,
    accent: 'stone',
    cta: 'Current plan',
    ctaDisabled: true,
    highlight: false,
  },
  {
    key: 'build',
    name: 'Paid',
    price: '$25',
    sub: 'per month',
    icon: Zap,
    accent: 'orange',
    cta: 'Upgrade to Build',
    ctaDisabled: false,
    highlight: true,
  },
]

const CONTACT_EMAILS = [
  'usamamuhammad833@gmail.com',
  'hassantest318@gmail.com',
  'usama@sourcecanada.ca',
  'muhammad.usama@tritechx.com',
]

function Cell({ value }: { value: string | boolean }) {
  if (value === true)  return <Check className="w-4 h-4 text-emerald-400 mx-auto" />
  if (value === false) return <X className="w-4 h-4 text-[var(--text-muted)] mx-auto" />
  return <span className="text-sm text-[var(--text-primary)] font-medium">{value}</span>
}

export default function PricingPage() {
  const user = useAuthStore((s) => s.user)
  const currentTier = user?.subscription_tier ?? 'validate'
  const paidTierActive = currentTier === 'build' || currentTier === 'launch'

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
          Explore unlimited ideas for free. Upgrade when you need more AI runs, documents, research, and formation tools.
        </p>
      </motion.div>

      {/* Tier cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {TIERS.map((tier) => {
          const isCurrent = tier.key === 'build' ? paidTierActive : currentTier === tier.key
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
                onClick={() => {
                  if (!tier.ctaDisabled && !isCurrent) {
                    document.getElementById('upgrade-contact')?.scrollIntoView({ behavior: 'smooth' })
                  }
                }}
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

      <motion.div
        id="upgrade-contact"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
        className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-orange-400" />
          </div>
          <div className="space-y-4">
            <div>
              <h2 className="font-heading text-xl font-bold text-[var(--text-primary)]">
                Upgrade to Paid
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
                Payments are handled directly with the LaunchPad team. Contact us to schedule a short guidance call, confirm the right plan, and complete payment securely. After the meeting and payment are confirmed, the team will give you paid access.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CONTACT_EMAILS.map((email) => (
                <a
                  key={email}
                  href={`mailto:${email}?subject=LaunchPad Paid Plan Upgrade`}
                  className="text-sm text-orange-400 hover:text-orange-300 bg-orange-500/5 border border-orange-500/15 rounded-xl px-3 py-2 transition-colors"
                >
                  {email}
                </a>
              ))}
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              You will be connected with the responsible person within 48 hours at most. For a quicker response, email at least two of the addresses above. Thank you.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Feature comparison table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.16 }}
        className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl overflow-hidden"
      >
        {/* Table header */}
        <div className="grid grid-cols-[1fr_110px_110px] gap-2 px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
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
              'grid grid-cols-[1fr_110px_110px] gap-2 px-6 py-3 items-center border-b border-[var(--border-subtle)] last:border-0',
              i % 2 === 0 ? 'bg-[var(--bg-surface)]' : 'bg-[var(--bg-surface-hover)]/30',
            )}
          >
            <span className="text-sm text-[var(--text-secondary)]">{f.label}</span>
            <div className="text-center"><Cell value={f.free} /></div>
            <div className="text-center"><Cell value={f.paid} /></div>
          </div>
        ))}
      </motion.div>

      <p className="text-center text-[var(--text-muted)] text-xs pb-4">
        Secure payment and paid access are coordinated by the LaunchPad team after your upgrade call.
      </p>
    </div>
  )
}
