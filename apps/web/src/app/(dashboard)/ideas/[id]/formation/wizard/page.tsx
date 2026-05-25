'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Rocket,
  Loader2,
  Building2,
  Globe,
  Users,
  TrendingUp,
  Settings,
} from 'lucide-react'
import {
  useRecommendJurisdictions,
  useStartFormation,
  useJurisdictions,
} from '@/hooks/useFormation'
import { cn } from '@/lib/utils'
import type { JurisdictionInfo, JurisdictionRecommendation } from '@launchpad/shared'

const SAMPLE_PROFILES: { label: string; emoji: string; data: WizardState }[] = [
  {
    label: 'US SaaS + VC',
    emoji: '🚀',
    data: {
      founderLocation: 'United States',
      customerLocation: 'United States & Europe',
      businessType: 'SaaS / Software',
      plansVCFunding: true,
      prefersRemoteSetup: true,
      prefersFullOnline: true,
    },
  },
  {
    label: 'Dubai Startup',
    emoji: '🇦🇪',
    data: {
      founderLocation: 'UAE',
      customerLocation: 'Middle East & Global',
      businessType: 'E-commerce',
      plansVCFunding: false,
      prefersRemoteSetup: false,
      prefersFullOnline: false,
    },
  },
  {
    label: 'EU Remote',
    emoji: '🇪🇺',
    data: {
      founderLocation: 'Germany',
      customerLocation: 'European Union',
      businessType: 'Services / Agency',
      plansVCFunding: false,
      prefersRemoteSetup: true,
      prefersFullOnline: true,
    },
  },
  {
    label: 'Bootstrapped Fintech',
    emoji: '💳',
    data: {
      founderLocation: 'United Kingdom',
      customerLocation: 'Global',
      businessType: 'Fintech',
      plansVCFunding: false,
      prefersRemoteSetup: true,
      prefersFullOnline: true,
    },
  },
  {
    label: 'Estonia e-Resident',
    emoji: '🌍',
    data: {
      founderLocation: 'Pakistan',
      customerLocation: 'Global',
      businessType: 'SaaS / Software',
      plansVCFunding: false,
      prefersRemoteSetup: true,
      prefersFullOnline: true,
    },
  },
]

const STEPS = [
  { title: 'Your Location', description: 'Where are you and your co-founders based?', icon: Globe },
  { title: 'Your Customers', description: 'Where are your target customers located?', icon: Users },
  { title: 'Business Type', description: 'What type of business are you building?', icon: Building2 },
  { title: 'VC Funding', description: 'Do you plan to raise venture capital funding?', icon: TrendingUp },
  { title: 'Preferences', description: 'Any incorporation preferences?', icon: Settings },
]

const BUSINESS_TYPES = [
  'SaaS / Software',
  'E-commerce',
  'Services / Agency',
  'Fintech',
  'Hardware',
  'Other',
]

const REGION_FLAGS: Record<string, string> = {
  USA: '🇺🇸',
  UK: '🇬🇧',
  Germany: '🇩🇪',
  Netherlands: '🇳🇱',
  Estonia: '🇪🇪',
  UAE: '🇦🇪',
}

function getFlag(region: string): string {
  for (const [key, flag] of Object.entries(REGION_FLAGS)) {
    if (region.toLowerCase().includes(key.toLowerCase())) return flag
  }
  return '🌍'
}

const inputClass =
  'w-full bg-[var(--bg-input)] border border-[var(--border-strong)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 placeholder:text-[var(--text-muted)] transition-all'
const labelClass = 'block text-xs font-medium text-stone-400 mb-1.5 tracking-wide'

// Declared before SAMPLE_PROFILES so the type is available
interface WizardState {
  founderLocation: string
  customerLocation: string
  businessType: string
  plansVCFunding: boolean | null
  prefersRemoteSetup: boolean
  prefersFullOnline: boolean
}

export default function FormationWizardPage() {
  const params = useParams()
  const router = useRouter()
  const ideaId = params.id as string

  const [step, setStep] = useState(0)
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<JurisdictionRecommendation[]>([])
  const [recommendedJurisdictions, setRecommendedJurisdictions] = useState<JurisdictionInfo[]>([])

  const [form, setForm] = useState<WizardState>({
    founderLocation: '',
    customerLocation: '',
    businessType: '',
    plansVCFunding: null,
    prefersRemoteSetup: false,
    prefersFullOnline: false,
  })

  const applyPreset = (preset: typeof SAMPLE_PROFILES[0]) => {
    setForm(preset.data)
    setActivePreset(preset.label)
    setStep(0)
  }

  const { mutate: recommend, isPending: isAnalyzing } = useRecommendJurisdictions()
  const { mutate: startFormation, isPending: isStarting } = useStartFormation(ideaId)

  const canProceed = () => {
    if (step === 0) return form.founderLocation.trim().length > 0
    if (step === 1) return form.customerLocation.trim().length > 0
    if (step === 2) return form.businessType.length > 0
    if (step === 3) return form.plansVCFunding !== null
    return true
  }

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1)
    } else {
      // Submit
      recommend(
        {
          founder_location: form.founderLocation,
          customer_location: form.customerLocation,
          business_type: form.businessType,
          plans_vc_funding: form.plansVCFunding ?? false,
          prefers_remote_setup: form.prefersRemoteSetup,
          prefers_full_online: form.prefersFullOnline,
        },
        {
          onSuccess: (data) => {
            setRecommendations(data.recommendations ?? [])
            setRecommendedJurisdictions(data.jurisdictions ?? [])
            setShowResults(true)
          },
        }
      )
    }
  }

  const handleProceed = () => {
    if (!selectedJurisdiction) return
    const jInfo = recommendedJurisdictions.find((j) => j.code === selectedJurisdiction)
    startFormation(
      {
        jurisdiction: selectedJurisdiction,
        legal_structure: jInfo?.legal_structure ?? 'LLC',
      },
      {
        onSuccess: () => router.push(`/ideas/${ideaId}/formation`),
      }
    )
  }

  // Loading / analyzing state
  if (isAnalyzing) {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="mb-6"
        >
          <Rocket className="w-12 h-12 text-orange-400" />
        </motion.div>
        <h2 className="font-heading text-xl font-semibold text-[var(--text-primary)] mb-2">Analyzing your profile…</h2>
        <p className="text-[var(--text-secondary)] text-sm">Our AI is finding the best jurisdictions for your startup.</p>
      </div>
    )
  }

  // Results screen
  if (showResults) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">Our Recommendations</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">Select the jurisdiction that fits your startup best</p>
          </div>
          <Link
            href={`/ideas/${ideaId}/formation`}
            className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-white text-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        <div className="space-y-4">
          {recommendations.map((rec, idx) => {
            const jInfo = recommendedJurisdictions.find((j) => j.code === rec.jurisdiction_code)
            if (!jInfo) return null
            const isSelected = selectedJurisdiction === rec.jurisdiction_code
            const flag = getFlag(jInfo.region)

            return (
              <motion.div
                key={rec.jurisdiction_code}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={cn(
                  'rounded-2xl border p-6 transition-all',
                  isSelected
                    ? 'border-orange-500/40 bg-orange-500/[0.04]'
                    : 'border-[var(--border-ui)] bg-[var(--bg-surface)] hover:border-white/[0.12]'
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{flag}</span>
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)] text-lg">{jInfo.name}</h3>
                      <span className="text-xs bg-[var(--bg-surface-hover)] border border-[var(--border-strong)] rounded-full px-2.5 py-0.5 text-stone-400">
                        {jInfo.legal_structure}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-[var(--text-secondary)] text-[10px] uppercase tracking-widest">Match</p>
                      <p className="text-orange-400 font-bold text-lg">{Math.round(rec.score * 100)}%</p>
                    </div>
                  </div>
                </div>

                {/* Key stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Setup Cost', value: `$${jInfo.setup_cost_usd_min.toLocaleString()}–$${jInfo.setup_cost_usd_max.toLocaleString()}` },
                    { label: 'Annual Cost', value: `$${jInfo.annual_cost_usd_min.toLocaleString()}–$${jInfo.annual_cost_usd_max.toLocaleString()}` },
                    { label: 'Incorp. Time', value: `${jInfo.incorporation_days_min}–${jInfo.incorporation_days_max} days` },
                    { label: 'Tax Rate', value: jInfo.corporate_tax_rate },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-[var(--bg-input)] rounded-xl p-3 text-center">
                      <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-widest mb-1">{label}</p>
                      <p className="text-[var(--text-primary)] text-xs font-semibold">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Indicators */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { label: 'Foreign Ownership', value: jInfo.foreign_ownership },
                    { label: 'VC Fundable', value: jInfo.vc_fundable },
                    { label: 'Remote Setup', value: jInfo.remote_setup },
                    { label: '0% Corp Tax', value: jInfo.corporate_tax_rate === '0%' },
                  ].map(({ label, value }) => (
                    <span
                      key={label}
                      className={cn(
                        'flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border',
                        value
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-[var(--bg-input)] border-[var(--border-ui)] text-[var(--text-muted)]'
                      )}
                    >
                      {value ? '✓' : '✗'} {label}
                    </span>
                  ))}
                </div>

                {/* AI reasoning */}
                <p className="text-stone-400 text-xs leading-relaxed mb-4 border-l-2 border-orange-500/30 pl-3 italic">
                  {rec.reasoning}
                </p>

                <button
                  onClick={() => setSelectedJurisdiction(rec.jurisdiction_code)}
                  className={cn(
                    'w-full py-2.5 rounded-xl text-sm font-semibold transition-all',
                    isSelected
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'border border-[var(--border-strong)] text-stone-400 hover:border-orange-500/30 hover:text-orange-400'
                  )}
                >
                  {isSelected ? (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" /> Selected
                    </span>
                  ) : (
                    'Select this jurisdiction'
                  )}
                </button>
              </motion.div>
            )
          })}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleProceed}
            disabled={!selectedJurisdiction || isStarting}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-500/90 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-orange-500/20"
          >
            {isStarting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Starting…
              </>
            ) : (
              <>
                Proceed with selected jurisdiction
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  // Wizard steps
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href={`/ideas/${ideaId}/formation`}
          className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-white text-sm transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Formation
        </Link>
        <h1 className="font-heading text-3xl font-bold text-[var(--text-primary)] mb-1 tracking-tight">Find Your Jurisdiction</h1>
        <p className="text-[var(--text-secondary)] text-sm">Answer a few questions and we'll recommend the best place to incorporate.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                i < step
                  ? 'bg-emerald-500 text-white'
                  : i === step
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                  : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)]'
              )}
            >
              {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span
              className={cn(
                'text-sm hidden sm:block whitespace-nowrap',
                i === step ? 'text-[var(--text-primary)] font-medium' : i < step ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]'
              )}
            >
              {s.title}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={cn('h-px w-6 sm:w-10 transition-colors shrink-0', i < step ? 'bg-emerald-500/60' : 'bg-[var(--bg-surface-hover)]')}
              />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="relative rounded-2xl border border-[var(--border-ui)] bg-[var(--bg-surface)] p-8">
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-orange-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative">
          <h2 className="font-heading text-xl font-semibold text-[var(--text-primary)] mb-1">{STEPS[step].title}</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-6">{STEPS[step].description}</p>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Step 0: Founder Location */}
              {step === 0 && (
                <div>
                  <label className={labelClass}>Founder location</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. United States, Germany, UAE"
                    value={form.founderLocation}
                    onChange={(e) => setForm({ ...form, founderLocation: e.target.value })}
                  />
                  <p className="text-[var(--text-muted)] text-xs mt-2">Where you and your co-founders are primarily based</p>
                </div>
              )}

              {/* Step 1: Customer Location */}
              {step === 1 && (
                <div>
                  <label className={labelClass}>Customer location</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Global, US & Europe, Southeast Asia"
                    value={form.customerLocation}
                    onChange={(e) => setForm({ ...form, customerLocation: e.target.value })}
                  />
                  <p className="text-[var(--text-muted)] text-xs mt-2">Where most of your customers will be located</p>
                </div>
              )}

              {/* Step 2: Business Type */}
              {step === 2 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {BUSINESS_TYPES.map((bt) => (
                    <button
                      key={bt}
                      type="button"
                      onClick={() => setForm({ ...form, businessType: bt })}
                      className={cn(
                        'px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left',
                        form.businessType === bt
                          ? 'bg-orange-500/10 border-orange-500/40 text-orange-400'
                          : 'bg-[var(--bg-surface)] border-[var(--border-strong)] text-stone-400 hover:border-white/[0.15] hover:text-white'
                      )}
                    >
                      {bt}
                    </button>
                  ))}
                </div>
              )}

              {/* Step 3: VC Funding */}
              {step === 3 && (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Yes', sub: 'We plan to raise VC funding', value: true, emoji: '🚀' },
                    { label: 'No', sub: 'Bootstrapped or angel-funded only', value: false, emoji: '🌱' },
                  ].map(({ label, sub, value, emoji }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setForm({ ...form, plansVCFunding: value })}
                      className={cn(
                        'flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border text-center transition-all',
                        form.plansVCFunding === value
                          ? 'bg-orange-500/10 border-orange-500/40 text-orange-400'
                          : 'bg-[var(--bg-surface)] border-[var(--border-strong)] text-stone-400 hover:border-white/[0.15]'
                      )}
                    >
                      <span className="text-3xl">{emoji}</span>
                      <span className="font-semibold text-[var(--text-primary)]">{label}</span>
                      <span className="text-xs text-[var(--text-secondary)]">{sub}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 4: Preferences */}
              {step === 4 && (
                <div className="space-y-4">
                  {[
                    {
                      key: 'prefersRemoteSetup' as const,
                      label: 'Remote / online incorporation preferred',
                      desc: 'No need to travel or visit in person',
                    },
                    {
                      key: 'prefersFullOnline' as const,
                      label: 'Full online operation preferred',
                      desc: 'Operate the business entirely remotely',
                    },
                  ].map(({ key, label, desc }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm({ ...form, [key]: !form[key] })}
                      className={cn(
                        'w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all',
                        form[key]
                          ? 'bg-orange-500/10 border-orange-500/40'
                          : 'bg-[var(--bg-surface)] border-[var(--border-strong)] hover:border-white/[0.15]'
                      )}
                    >
                      <div
                        className={cn(
                          'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                          form[key] ? 'bg-orange-500 border-orange-500' : 'border-stone-600'
                        )}
                      >
                        {form[key] && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <p className={cn('text-sm font-medium', form[key] ? 'text-orange-400' : 'text-stone-300')}>
                          {label}
                        </p>
                        <p className="text-[var(--text-secondary)] text-xs mt-0.5">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-stone-200 text-sm disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-500/90 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-md shadow-orange-500/20"
            >
              {step < STEPS.length - 1 ? (
                <>
                  Next <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  Find Jurisdictions
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick-fill presets */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Rocket className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span className="text-[var(--text-muted)] text-xs uppercase tracking-widest font-medium">
            Quick fill — test profiles
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_PROFILES.map((preset) => (
            <motion.button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset)}
              whileTap={{ scale: 0.96 }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                activePreset === preset.label
                  ? 'bg-orange-500/15 border-orange-500/40 text-orange-300'
                  : 'bg-[var(--bg-input)] border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-stone-200 hover:border-white/20 hover:bg-white/[0.05]'
              )}
            >
              <span>{preset.emoji}</span>
              {preset.label}
              {activePreset === preset.label && <Check className="w-3 h-3 text-orange-400" />}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
