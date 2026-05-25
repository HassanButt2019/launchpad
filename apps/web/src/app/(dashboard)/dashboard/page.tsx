'use client'
import Link from 'next/link'
import { Plus, Lightbulb, ArrowRight, TrendingUp, Zap, CheckCircle2, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useIdeas } from '@/hooks/useIdeas'
import { IdeaStage, Idea } from '@launchpad/shared'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'
import NewIdeaButton from '@/components/ui/NewIdeaButton'

const stageOrder: IdeaStage[] = [
  IdeaStage.DRAFT,
  IdeaStage.VALIDATING,
  IdeaStage.VALIDATED,
  IdeaStage.BUILDING,
  IdeaStage.INCORPORATED,
]

const stageMeta: Record<IdeaStage, { label: string; color: string; barColor: string; textColor: string }> = {
  DRAFT:       { label: 'Draft',        color: 'bg-stone-500/15',   barColor: 'bg-stone-500',   textColor: 'text-stone-400' },
  VALIDATING:  { label: 'Validating',   color: 'bg-amber-500/15',   barColor: 'bg-amber-400',   textColor: 'text-amber-400' },
  VALIDATED:   { label: 'Validated',    color: 'bg-emerald-500/15', barColor: 'bg-emerald-400', textColor: 'text-emerald-400' },
  BUILDING:    { label: 'Building',     color: 'bg-orange-500/15',  barColor: 'bg-orange-400',  textColor: 'text-orange-400' },
  INCORPORATED:{ label: 'Incorporated', color: 'bg-blue-500/15',    barColor: 'bg-blue-400',    textColor: 'text-blue-400' },
}

const stageDot: Record<IdeaStage, string> = {
  DRAFT: 'bg-stone-500',
  VALIDATING: 'bg-amber-400',
  VALIDATED: 'bg-emerald-400',
  BUILDING: 'bg-orange-400',
  INCORPORATED: 'bg-blue-400',
}

const boldStages = new Set<IdeaStage>([
  IdeaStage.DRAFT,
  IdeaStage.VALIDATING,
  IdeaStage.VALIDATED,
  IdeaStage.BUILDING,
  IdeaStage.INCORPORATED,
])

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const { data: ideas = [], isLoading } = useIdeas()
  const user = useAuthStore((s) => s.user)

  const firstName = user?.full_name?.split(' ')[0] ?? 'there'
  const totalIdeas = ideas.length
  const validatedCount = ideas.filter((i: Idea) => i.stage === IdeaStage.VALIDATED || i.stage === IdeaStage.BUILDING || i.stage === IdeaStage.INCORPORATED).length
  const buildingCount = ideas.filter((i: Idea) => i.stage === IdeaStage.BUILDING).length
  const incorporatedCount = ideas.filter((i: Idea) => i.stage === IdeaStage.INCORPORATED).length

  const stageCounts: Record<IdeaStage, number> = {
    DRAFT: 0, VALIDATING: 0, VALIDATED: 0, BUILDING: 0, INCORPORATED: 0,
  }
  ideas.forEach((i: Idea) => { stageCounts[i.stage] = (stageCounts[i.stage] ?? 0) + 1 })

  const recentIdeas = [...ideas]
    .sort((a: Idea, b: Idea) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6)

  const stats = [
    { label: 'Total Ideas', value: totalIdeas, icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    { label: 'Validated', value: validatedCount, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/15' },
    { label: 'Building', value: buildingCount, icon: Zap, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/15' },
    { label: 'Incorporated', value: incorporatedCount, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/15' },
  ]

  return (
    <div className="space-y-8">
      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-heading text-3xl font-bold text-[var(--text-primary)] tracking-tight leading-tight">
            {greeting()}, {firstName}.
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            {totalIdeas === 0
              ? 'Start your first idea to get going'
              : `${totalIdeas} idea${totalIdeas !== 1 ? 's' : ''} in your workspace`}
          </p>
        </div>
        <NewIdeaButton variant="primary" />
      </motion.div>

      {/* ── Stat cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl p-5 flex flex-col gap-3"
          >
            <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center', bg)}>
              <Icon className={cn('w-5 h-5', color)} />
            </div>
            <div>
              <p className="font-heading text-3xl font-bold text-[var(--text-primary)] leading-none">{value}</p>
              <p className="text-[var(--text-secondary)] text-xs mt-1">{label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── Main content grid ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6"
      >
        {/* Pipeline chart — wider */}
        <div className="xl:col-span-2 bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading text-base font-semibold text-[var(--text-primary)]">Pipeline Overview</h2>
              <p className="text-[var(--text-secondary)] text-xs mt-0.5">Ideas distribution across stages</p>
            </div>
          </div>
          <div className="space-y-5">
            {stageOrder.map((stage) => {
              const { label, barColor, textColor } = stageMeta[stage]
              const count = stageCounts[stage] ?? 0
              const pct = totalIdeas > 0 ? (count / totalIdeas) * 100 : 0
              return (
                <div key={stage} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={cn('text-xs', boldStages.has(stage) ? 'font-bold' : 'font-medium', textColor)}>{label}</span>
                    <span className="text-[var(--text-secondary)] text-xs">{count} idea{count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--bg-surface-hover)] overflow-hidden">
                    <motion.div
                      className={cn('h-full rounded-full', barColor)}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          {totalIdeas === 0 && (
            <div className="mt-6 text-center">
              <p className="text-[var(--text-muted)] text-xs">No ideas yet — create one to populate the pipeline</p>
            </div>
          )}
        </div>

        {/* Quick Activity */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl p-6 flex flex-col">
          <h2 className="font-heading text-base font-semibold text-[var(--text-primary)] mb-1">Quick Stats</h2>
          <p className="text-[var(--text-secondary)] text-xs mb-6">At a glance</p>
          <div className="space-y-4 flex-1">
            {stageOrder.map((stage) => {
              const { label, color, textColor } = stageMeta[stage]
              const count = stageCounts[stage] ?? 0
              return (
                <div key={stage} className="flex items-center gap-3">
                  <div className={cn('w-2.5 h-2.5 rounded-full', stageDot[stage])} />
                  <span className="text-stone-400 text-sm flex-1">{label}</span>
                  <span className="text-[var(--text-primary)] text-sm font-semibold">{count}</span>
                </div>
              )
            })}
          </div>
          <div className="h-px bg-[var(--border-subtle)] my-4" />
          <NewIdeaButton variant="secondary" label="Add New Idea" className="w-full justify-center py-2.5" />
        </div>
      </motion.div>

      {/* ── Recent ideas table ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.18 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading text-base font-semibold text-[var(--text-primary)]">Recent Ideas</h2>
            <p className="text-[var(--text-secondary)] text-xs mt-0.5">Your latest startup concepts</p>
          </div>
          {ideas.length > 0 && (
            <Link
              href="/ideas"
              className="flex items-center gap-1 text-orange-400 hover:text-orange-300 text-xs font-medium transition-colors"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse border-b border-[var(--border-subtle)] last:border-0 bg-[var(--bg-surface)]" />
            ))}
          </div>
        ) : ideas.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-ui)] bg-[var(--bg-surface)] p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-5">
              <Lightbulb className="w-7 h-7 text-orange-400" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-2">No ideas yet</h3>
            <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-xs mx-auto">
              Submit your first startup idea and let AI help you validate and refine it.
            </p>
            <NewIdeaButton label="Submit your first idea" />
          </div>
        ) : (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_140px_160px_100px_40px] gap-4 px-5 py-3 border-b border-[var(--border-subtle)]">
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Idea</span>
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Stage</span>
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Market Size</span>
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Created</span>
              <span />
            </div>
            {recentIdeas.map((idea: Idea, i: number) => {
              const stage = idea.stage as IdeaStage
              const { label, textColor, color } = stageMeta[stage]
              return (
                <motion.div
                  key={idea.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.04 * i }}
                >
                  <Link
                    href={`/ideas/${idea.id}`}
                    className="group grid grid-cols-[1fr_140px_160px_100px_40px] gap-4 px-5 py-4 hover:bg-[var(--bg-surface)] transition-colors border-b border-[var(--border-subtle)] last:border-0 items-center"
                  >
                    <div className="min-w-0">
                      <p className="text-[var(--text-primary)] text-sm font-medium truncate">{idea.title}</p>
                      <p className="text-[var(--text-secondary)] text-xs truncate mt-0.5">{idea.description}</p>
                    </div>
                    <div>
                      <span className={cn('text-[11px] font-bold px-2.5 py-1 rounded-full', color, textColor)}>
                        {label}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-sm">
                        {idea.market_size ?? <span className="text-[var(--text-muted)]">—</span>}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)] text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(idea.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-orange-400 transition-colors" />
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
