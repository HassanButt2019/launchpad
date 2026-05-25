'use client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Rocket,
  CheckSquare,
  FileText,
  BarChart2,
  CalendarCheck,
  Clock,
  DollarSign,
  Building2,
  ChevronRight,
  ArrowRight,
} from 'lucide-react'
import { useFormationProfile, useUpdateFormation, useJurisdictions } from '@/hooks/useFormation'
import { cn } from '@/lib/utils'
import type { FormationProfile, JurisdictionInfo } from '@launchpad/shared'

const REGION_FLAGS: Record<string, string> = {
  USA: '🇺🇸',
  UK: '🇬🇧',
  Germany: '🇩🇪',
  Netherlands: '🇳🇱',
  Estonia: '🇪🇪',
  UAE: '🇦🇪',
}

const JURISDICTION_BADGES = [
  { flag: '🇺🇸', label: 'USA' },
  { flag: '🇬🇧', label: 'UK' },
  { flag: '🇩🇪', label: 'Germany' },
  { flag: '🇳🇱', label: 'Netherlands' },
  { flag: '🇪🇪', label: 'Estonia' },
  { flag: '🇦🇪', label: 'UAE' },
]

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  INCORPORATED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  PENDING: 'bg-stone-500/15 text-stone-400 border-stone-500/20',
}

function FormationHero({ ideaId }: { ideaId: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto"
    >
      {/* Hero card */}
      <div className="relative rounded-2xl border border-[var(--border-ui)] bg-[var(--bg-surface)] p-10 text-center overflow-hidden">
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-orange-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative">
          {/* Icon glow box */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-6 shadow-lg shadow-orange-500/10">
            <Rocket className="w-10 h-10 text-orange-400" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">
            Ready to make it official?
          </h1>
          <p className="text-stone-400 text-base mb-8 max-w-md mx-auto leading-relaxed">
            Incorporate your startup in the right jurisdiction with AI-guided documentation.
          </p>

          {/* Feature highlights */}
          <div className="space-y-3 mb-8 text-left max-w-sm mx-auto">
            {[
              {
                icon: Building2,
                title: 'Jurisdiction Recommendation',
                desc: 'AI picks the best country for your startup profile',
              },
              {
                icon: FileText,
                title: 'Document Drafting',
                desc: 'Auto-generate incorporation docs and agreements',
              },
              {
                icon: CalendarCheck,
                title: 'Compliance Calendar',
                desc: 'Never miss a filing deadline or legal obligation',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-[var(--text-primary)] text-sm font-medium">{title}</p>
                  <p className="text-[var(--text-secondary)] text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href={`/ideas/${ideaId}/formation/wizard`}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-500/90 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-orange-500/20"
          >
            <Rocket className="w-4 h-4" />
            Get Incorporated
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Jurisdiction badges */}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {JURISDICTION_BADGES.map(({ flag, label }) => (
          <span
            key={label}
            className="flex items-center gap-1.5 bg-[var(--bg-input)] border border-[var(--border-ui)] rounded-full px-3 py-1.5 text-xs text-stone-400"
          >
            <span>{flag}</span>
            {label}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

function FormationDashboard({
  profile,
  ideaId,
  jurisdictions,
}: {
  profile: FormationProfile
  ideaId: string
  jurisdictions: JurisdictionInfo[]
}) {
  const router = useRouter()
  const { mutate: updateFormation, isPending: isUpdating } = useUpdateFormation(ideaId)

  const jInfo = jurisdictions.find((j) => j.code === profile.jurisdiction)
  const jurisdictionName = jInfo?.name ?? profile.jurisdiction

  const totalChecklist = profile.checklist_items?.length ?? 0
  const completedChecklist = profile.checklist_items?.filter((i) => i.completed).length ?? 0
  const checklistPct = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0

  const docsCount = profile.documents?.length ?? 0
  const upcomingCompliance = profile.compliance_events?.filter((e) => !e.completed).length ?? 0

  const regionFlag = jInfo
    ? REGION_FLAGS[jInfo.region] ?? '🌍'
    : '🌍'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-2xl">{regionFlag}</span>
            <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">{jurisdictionName}</h1>
            <span
              className={cn(
                'text-xs font-medium px-2.5 py-1 rounded-full border',
                STATUS_COLORS[profile.status] ?? STATUS_COLORS.PENDING
              )}
            >
              {profile.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-[var(--text-secondary)] text-sm">
            {profile.legal_structure} · Formation started{' '}
            {new Date(profile.created_at).toLocaleDateString()}
          </p>
        </div>
        {profile.status !== 'INCORPORATED' && (
          <button
            onClick={() =>
              updateFormation({ status: 'INCORPORATED', incorporation_date: new Date().toISOString().split('T')[0] })
            }
            disabled={isUpdating}
            className="flex items-center gap-2 border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-50 shrink-0"
          >
            <Building2 className="w-4 h-4" />
            Mark as Incorporated
          </button>
        )}
      </div>

      {/* Nav cards 2x2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
        {/* Checklist card */}
        <Link href={`/ideas/${ideaId}/formation/checklist`} className="flex">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="group bg-[var(--bg-surface)] border border-[var(--border-ui)] hover:border-orange-500/20 rounded-2xl p-6 cursor-pointer transition-all flex flex-col w-full"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-orange-400" />
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-orange-400 transition-colors" />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-1">Checklist</h3>
            <p className="text-[var(--text-secondary)] text-xs mb-3">
              {completedChecklist}/{totalChecklist} items done
            </p>
            <div className="w-full bg-[var(--bg-surface-hover)] rounded-full h-1.5">
              <div
                className="bg-orange-500 h-1.5 rounded-full transition-all"
                style={{ width: `${checklistPct}%` }}
              />
            </div>
            <p className="text-[var(--text-muted)] text-xs mt-1.5">{checklistPct}% complete</p>
          </motion.div>
        </Link>

        {/* Documents card */}
        <Link href={`/ideas/${ideaId}/formation/documents`} className="flex">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="group bg-[var(--bg-surface)] border border-[var(--border-ui)] hover:border-orange-500/20 rounded-2xl p-6 cursor-pointer transition-all flex flex-col w-full"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-orange-400" />
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-orange-400 transition-colors" />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-1">Documents</h3>
            <p className="text-[var(--text-secondary)] text-xs">
              {docsCount} document{docsCount !== 1 ? 's' : ''} generated
            </p>
          </motion.div>
        </Link>

        {/* Timeline & Costs */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl p-6 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-orange-400" />
            </div>
          </div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-1">Timeline &amp; Costs</h3>
          {jInfo ? (
            <div className="space-y-1">
              <p className="text-[var(--text-secondary)] text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Est. {jInfo.incorporation_days_min}–{jInfo.incorporation_days_max} days
              </p>
              <p className="text-[var(--text-secondary)] text-xs flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                ${jInfo.setup_cost_usd_min.toLocaleString()}–${jInfo.setup_cost_usd_max.toLocaleString()} setup
              </p>
            </div>
          ) : (
            <p className="text-[var(--text-secondary)] text-xs">Est. 1–3 days · $500–$1,500</p>
          )}
        </div>

        {/* Compliance Calendar */}
        <Link href={`/ideas/${ideaId}/formation/compliance`} className="flex">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="group bg-[var(--bg-surface)] border border-[var(--border-ui)] hover:border-orange-500/20 rounded-2xl p-6 cursor-pointer transition-all flex flex-col w-full"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5 text-orange-400" />
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-orange-400 transition-colors" />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-1">Compliance Calendar</h3>
            <p className="text-[var(--text-secondary)] text-xs">
              {upcomingCompliance} upcoming event{upcomingCompliance !== 1 ? 's' : ''}
            </p>
          </motion.div>
        </Link>
      </div>

      {/* Quick stats */}
      {jInfo && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Setup Cost', value: `$${jInfo.setup_cost_usd_min.toLocaleString()}–$${jInfo.setup_cost_usd_max.toLocaleString()}` },
            { label: 'Annual Cost', value: `$${jInfo.annual_cost_usd_min.toLocaleString()}–$${jInfo.annual_cost_usd_max.toLocaleString()}` },
            { label: 'Incorporation', value: `${jInfo.incorporation_days_min}–${jInfo.incorporation_days_max} days` },
            { label: 'Tax Rate', value: jInfo.corporate_tax_rate },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-xl p-4 text-center"
            >
              <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-widest mb-1">{label}</p>
              <p className="text-[var(--text-primary)] text-sm font-semibold">{value}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default function FormationPage() {
  const params = useParams()
  const ideaId = params.id as string

  const { data: profile, isLoading } = useFormationProfile(ideaId)
  const { data: jurisdictions = [] } = useJurisdictions()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl h-64 animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl h-36 animate-pulse" />
          <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl h-36 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return <FormationHero ideaId={ideaId} />
  }

  return (
    <FormationDashboard
      profile={profile}
      ideaId={ideaId}
      jurisdictions={jurisdictions}
    />
  )
}
