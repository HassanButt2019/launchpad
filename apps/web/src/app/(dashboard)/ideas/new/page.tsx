'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ideaSchema, IdeaInput, IdeaStage } from '@launchpad/shared'
import { useCreateIdea, useIdeas } from '@/hooks/useIdeas'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Check, Zap } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import UpgradeModal from '@/components/ui/UpgradeModal'

const FREE_IDEA_LIMIT = 1

const STEPS = [
  { title: 'Basic Info', description: 'Name and stage of your idea' },
  { title: 'Problem & Market', description: 'Define the problem you are solving' },
  { title: 'Solution', description: 'Describe your solution and unique edge' },
  { title: 'Review', description: 'Confirm details and submit' },
]

const inputClass =
  'w-full bg-[var(--bg-input)] border border-[var(--border-strong)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 placeholder:text-[var(--text-muted)] transition-all'

const labelClass = 'block text-xs font-medium text-stone-400 mb-1.5 tracking-wide'

const SAMPLE_IDEAS: { label: string; emoji: string; data: IdeaInput }[] = [
  {
    label: 'AI Code Review',
    emoji: '🤖',
    data: {
      title: 'AI-Powered Code Review for Small Engineering Teams',
      stage: IdeaStage.DRAFT,
      problem_statement:
        'Small engineering teams (2–10 devs) spend 20–30% of their time on manual code reviews. Reviews are inconsistent, miss security vulnerabilities, and slow down shipping. Hiring a senior engineer just for reviews is too expensive.',
      target_audience: 'Small SaaS engineering teams of 2–15 developers, especially CTOs and tech leads at early-stage startups',
      market_size: '$4.2B',
      description:
        'An AI-powered code review assistant that automatically reviews pull requests for bugs, security vulnerabilities, performance issues, and code style. It integrates directly into GitHub, GitLab, and Bitbucket and provides actionable inline comments within 60 seconds of a PR being opened.',
      unique_value_prop:
        'Unlike existing tools, we focus exclusively on small teams with a simple flat-rate pricing model, zero configuration setup, and context-aware suggestions that understand the team\'s existing codebase patterns.',
    },
  },
  {
    label: 'Freelancer Finance',
    emoji: '💰',
    data: {
      title: 'Freelancer Finance Manager — Invoicing, Tax & Cash Flow in One',
      stage: IdeaStage.DRAFT,
      problem_statement:
        'Independent freelancers and solopreneurs lose an average of 12 hours per month managing invoices, tracking expenses, and preparing for quarterly taxes. Most accounting tools are built for companies, not solo workers, and are overly complex and expensive.',
      target_audience: 'Independent freelancers, contractors, and solopreneurs earning $30k–$200k/year, particularly in design, development, writing, and consulting',
      market_size: '$12B',
      description:
        'A mobile-first finance app for freelancers that combines invoice creation, expense tracking, tax estimation, and cash flow forecasting. It automatically categorises transactions from connected bank accounts, estimates quarterly tax obligations in real time, and reminds users when to set aside money.',
      unique_value_prop:
        'Built exclusively for solo workers — not teams. Flat $9/month pricing, 2-minute onboarding, and a tax estimation engine calibrated per country (US, UK, UAE). Competitors charge 3x more and require accountant-level knowledge.',
    },
  },
  {
    label: 'Dubai F&B Finder',
    emoji: '🍽️',
    data: {
      title: 'Dubai Hidden Gems — Hyperlocal Restaurant Discovery for Expats',
      stage: IdeaStage.DRAFT,
      problem_statement:
        'Dubai has 13,000+ restaurants but expats and tourists rely on TripAdvisor and Google Maps, which are dominated by paid placements and tourist traps. Discovering authentic, affordable local restaurants — especially non-English ones — is genuinely hard.',
      target_audience: 'Expats living in Dubai (3.5M people), tourists, and food-curious residents who want authentic local dining experiences beyond the tourist belt',
      market_size: '$800M',
      description:
        'A curated restaurant discovery app for Dubai that surfaces hidden local gems using a community-driven rating system, multilingual menu scanning, and neighbourhood-first browsing. Users can filter by cuisine, price range, language of menu, and "expat-recommended" tags. Monetised via premium restaurant profiles and reservation commissions.',
      unique_value_prop:
        'The only Dubai food app built around authenticity over advertising. Multilingual support (Arabic, English, Urdu, Tagalog), community curation by verified residents, and a "no paid placement" policy that larger platforms can\'t match.',
    },
  },
  {
    label: 'Remote Team Wellness',
    emoji: '🧘',
    data: {
      title: 'PulseCheck — Async Mental Wellness Platform for Remote Teams',
      stage: IdeaStage.VALIDATING,
      problem_statement:
        'Remote teams suffer from invisible burnout — managers have no visibility into team morale, wellbeing, or early signs of disengagement. Annual surveys miss real-time issues. Employees are reluctant to report struggles directly to their manager.',
      target_audience: 'HR managers and team leads at remote-first companies with 20–500 employees, particularly in tech, agencies, and consulting firms',
      market_size: '$6.5B',
      description:
        'A weekly 3-minute async check-in tool for remote teams. Employees respond to anonymous mood and workload questions. Managers get an aggregated team wellness dashboard showing trends, risk flags, and actionable nudges. Integrates with Slack, Teams, and Notion.',
      unique_value_prop:
        'Fully anonymous for employees (not even the admin can identify individual responses), 3-minute weekly commitment, and AI-generated manager nudges that suggest specific actions — not just data. Priced per team at $49/month, not per seat.',
    },
  },
  {
    label: 'Legal Doc AI',
    emoji: '⚖️',
    data: {
      title: 'ClauseAI — Plain-English Legal Document Generator for Startups',
      stage: IdeaStage.DRAFT,
      problem_statement:
        'Early-stage founders need legal documents (NDAs, founder agreements, employment contracts, SaaS terms) but can\'t afford lawyers at $300–$500/hour. Free templates from the internet are generic, outdated, and potentially dangerous to use without customisation.',
      target_audience: 'Pre-seed and seed-stage startup founders, solopreneurs launching SaaS products, and small business owners in the US, UK, and UAE',
      market_size: '$2.8B',
      description:
        'An AI-powered legal document generator that creates jurisdiction-specific, startup-ready contracts in plain English. Users answer a short questionnaire, and the system generates a customised document with clause-by-clause explanations. Covers NDAs, co-founder agreements, employment contracts, SaaS terms, and privacy policies.',
      unique_value_prop:
        'Every document includes a plain-English explanation of each clause, a risk flag for unusual terms, and jurisdiction toggle (US/UK/UAE). One-time purchase per document ($29–$79) — no subscription. Cheaper than a lawyer, safer than a generic template.',
    },
  },
  {
    label: 'EcoPackaging B2B',
    emoji: '📦',
    data: {
      title: 'GreenShip — Sustainable Packaging Marketplace for E-commerce Brands',
      stage: IdeaStage.DRAFT,
      problem_statement:
        'Small e-commerce brands want to switch to sustainable packaging but face a fragmented supplier market, high minimum order quantities (MOQs), confusing certifications, and prices 40–60% higher than standard packaging. Most sustainable options require bulk orders they can\'t afford.',
      target_audience: 'E-commerce brands doing $100k–$5M/year in revenue, particularly in fashion, beauty, food, and lifestyle — brands that care about their environmental footprint and customer perception',
      market_size: '$9.1B',
      description:
        'A B2B marketplace connecting small e-commerce brands with vetted sustainable packaging suppliers. Brands can order custom-branded eco-packaging with low MOQs (as few as 100 units), browse by material certification (FSC, compostable, recycled), and get instant CO2 savings estimates per order. Group-buying pools reduce costs for smaller brands.',
      unique_value_prop:
        'The only sustainable packaging marketplace with MOQs starting at 100 units (vs 1,000+ on competitors), a verified certification database, and a group-buy feature that lets small brands combine orders to unlock better pricing.',
    },
  },
]

export default function NewIdeaPage() {
  const [step, setStep] = useState(0)
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const router = useRouter()
  const { mutate: createIdea, isPending, error } = useCreateIdea()

  // URL-bypass guard — fires when user navigates directly to /ideas/new
  const user = useAuthStore((s) => s.user)
  const { data: ideas = [] } = useIdeas()
  const isBlocked =
    (user?.subscription_tier ?? 'validate') === 'validate' &&
    ideas.length >= FREE_IDEA_LIMIT

  if (isBlocked) {
    return (
      <div className="max-w-2xl mx-auto">
        <UpgradeModal open={true} onClose={() => router.push('/ideas')} />
      </div>
    )
  }

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    reset,
    formState: { errors },
  } = useForm<IdeaInput>({
    resolver: zodResolver(ideaSchema),
    defaultValues: { stage: IdeaStage.DRAFT },
  })

  const values = watch()

  const stepFields: (keyof IdeaInput)[][] = [
    ['title', 'stage'],
    ['problem_statement', 'target_audience', 'market_size'],
    ['description', 'unique_value_prop'],
    [],
  ]

  const handleNext = async () => {
    const valid = await trigger(stepFields[step] as (keyof IdeaInput)[])
    if (valid) setStep((s) => s + 1)
  }

  const onSubmit = (data: IdeaInput) => {
    createIdea(data, {
      onSuccess: (idea) => router.push(`/ideas/${idea.id}`),
    })
  }

  const applyPreset = (preset: typeof SAMPLE_IDEAS[0]) => {
    reset(preset.data)
    setActivePreset(preset.label)
    setStep(0)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-[var(--text-primary)] mb-1 tracking-tight">New Idea</h1>
        <p className="text-[var(--text-secondary)] text-sm">Fill in the details to validate your startup idea</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
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
                'text-sm hidden sm:block',
                i === step ? 'text-[var(--text-primary)] font-medium' : i < step ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]'
              )}
            >
              {s.title}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={cn('h-px w-6 sm:w-12 transition-colors', i < step ? 'bg-emerald-500/60' : 'bg-[var(--bg-surface-hover)]')}
              />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="relative rounded-2xl border border-[var(--border-ui)] bg-[var(--bg-surface)] p-8">
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-orange-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative">
          <h2 className="font-heading text-xl font-semibold text-[var(--text-primary)] mb-1">
            {STEPS[step].title}
          </h2>
          <p className="text-[var(--text-secondary)] text-sm mb-6">{STEPS[step].description}</p>

          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Step 0: Basic Info */}
                {step === 0 && (
                  <div className="space-y-5">
                    <div>
                      <label className={labelClass}>
                        Idea Title <span className="text-red-400">*</span>
                      </label>
                      <input
                        {...register('title')}
                        type="text"
                        className={inputClass}
                        placeholder="e.g. AI-powered code review for small teams"
                      />
                      {errors.title && (
                        <p className="text-red-400 text-xs mt-1.5">{errors.title.message}</p>
                      )}
                    </div>
                    <div>
                      <label className={labelClass}>Stage</label>
                      <select {...register('stage')} className={inputClass}>
                        {Object.values(IdeaStage).map((s) => (
                          <option key={s} value={s} className="bg-[#1a1917]">
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 1: Problem & Market */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <label className={labelClass}>
                        Problem Statement <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        {...register('problem_statement')}
                        rows={4}
                        className={cn(inputClass, 'resize-none')}
                        placeholder="What specific problem are you solving?"
                      />
                      {errors.problem_statement && (
                        <p className="text-red-400 text-xs mt-1.5">
                          {errors.problem_statement.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={labelClass}>
                        Target Audience <span className="text-red-400">*</span>
                      </label>
                      <input
                        {...register('target_audience')}
                        type="text"
                        className={inputClass}
                        placeholder="e.g. Small engineering teams (2–15 devs)"
                      />
                      {errors.target_audience && (
                        <p className="text-red-400 text-xs mt-1.5">
                          {errors.target_audience.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={labelClass}>Market Size (optional)</label>
                      <input
                        {...register('market_size')}
                        type="text"
                        className={inputClass}
                        placeholder="e.g. $4.2B"
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Solution */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <label className={labelClass}>
                        Description <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        {...register('description')}
                        rows={4}
                        className={cn(inputClass, 'resize-none')}
                        placeholder="Describe your solution in detail..."
                      />
                      {errors.description && (
                        <p className="text-red-400 text-xs mt-1.5">{errors.description.message}</p>
                      )}
                    </div>
                    <div>
                      <label className={labelClass}>
                        Unique Value Proposition <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        {...register('unique_value_prop')}
                        rows={3}
                        className={cn(inputClass, 'resize-none')}
                        placeholder="What makes your solution unique?"
                      />
                      {errors.unique_value_prop && (
                        <p className="text-red-400 text-xs mt-1.5">
                          {errors.unique_value_prop.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Review */}
                {step === 3 && (
                  <div className="space-y-3">
                    {[
                      { label: 'Title', value: values.title },
                      { label: 'Stage', value: values.stage },
                      { label: 'Problem Statement', value: values.problem_statement },
                      { label: 'Target Audience', value: values.target_audience },
                      { label: 'Market Size', value: values.market_size || '—' },
                      { label: 'Description', value: values.description },
                      { label: 'Unique Value Prop', value: values.unique_value_prop },
                    ].map(({ label, value }) => (
                      <div key={label} className="border-b border-[var(--border-subtle)] pb-3 last:border-0">
                        <p className="text-[var(--text-muted)] text-[11px] uppercase tracking-wider mb-0.5">{label}</p>
                        <p className="text-[var(--text-primary)] text-sm whitespace-pre-wrap">{value}</p>
                      </div>
                    ))}
                    {error && (
                      <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mt-2">
                        <p className="font-medium">Failed to create idea.</p>
                        <p className="text-xs mt-0.5 text-red-400/70">
                          {(error as { response?: { data?: { detail?: string } } })?.response?.data?.detail
                            || (error as Error)?.message
                            || 'Unknown error'}
                        </p>
                      </div>
                    )}
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
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-500/90 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-md shadow-orange-500/20"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-500/90 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-md shadow-orange-500/20 disabled:opacity-60"
                >
                  {isPending ? 'Creating...' : 'Submit Idea'}
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* ── Quick-fill presets ── */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span className="text-[var(--text-muted)] text-xs uppercase tracking-widest font-medium">
            Quick fill — test ideas
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_IDEAS.map((preset) => (
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
              {activePreset === preset.label && (
                <Check className="w-3 h-3 text-orange-400" />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
