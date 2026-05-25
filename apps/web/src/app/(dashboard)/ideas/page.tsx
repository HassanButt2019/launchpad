'use client'
import Link from 'next/link'
import { Plus, Lightbulb, Search, ArrowRight, Clock, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useIdeas, useValidationReport } from '@/hooks/useIdeas'
import { IdeaStage, Idea } from '@launchpad/shared'
import { cn } from '@/lib/utils'
import NewIdeaButton from '@/components/ui/NewIdeaButton'

function IdeaScoreBadge({ ideaId }: { ideaId: string }) {
  const { data: report } = useValidationReport(ideaId)
  if (!report) return <span className="text-[var(--text-muted)] text-sm">—</span>
  const color =
    report.score >= 70 ? 'text-emerald-400' :
    report.score >= 50 ? 'text-amber-400' : 'text-red-400'
  return (
    <span className={cn('text-sm font-semibold tabular-nums', color)}>
      {report.score}
      <span className="text-[var(--text-muted)] font-normal text-xs">/100</span>
    </span>
  )
}

const STAGE_FILTERS: { label: string; value: IdeaStage | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Draft', value: IdeaStage.DRAFT },
  { label: 'Validating', value: IdeaStage.VALIDATING },
  { label: 'Validated', value: IdeaStage.VALIDATED },
  { label: 'Building', value: IdeaStage.BUILDING },
  { label: 'Incorporated', value: IdeaStage.INCORPORATED },
]

const stageMeta: Record<IdeaStage, { label: string; dotColor: string; badgeClass: string }> = {
  DRAFT:        { label: 'Draft',        dotColor: 'bg-stone-500',   badgeClass: 'bg-stone-500/15 text-stone-400 border-stone-500/20' },
  VALIDATING:   { label: 'Validating',   dotColor: 'bg-amber-400',   badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  VALIDATED:    { label: 'Validated',    dotColor: 'bg-emerald-400', badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  BUILDING:     { label: 'Building',     dotColor: 'bg-orange-400',  badgeClass: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
  INCORPORATED: { label: 'Incorporated', dotColor: 'bg-blue-400',    badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
}

export default function IdeasPage() {
  const { data: ideas = [], isLoading } = useIdeas()
  const [filter, setFilter] = useState<IdeaStage | 'ALL'>('ALL')
  const [search, setSearch] = useState('')

  const filtered = ideas.filter((idea: Idea) => {
    const matchesStage = filter === 'ALL' || idea.stage === filter
    const matchesSearch =
      !search ||
      idea.title.toLowerCase().includes(search.toLowerCase()) ||
      idea.description?.toLowerCase().includes(search.toLowerCase())
    return matchesStage && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-heading text-3xl font-bold text-[var(--text-primary)] tracking-tight">Ideas</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            {ideas.length} idea{ideas.length !== 1 ? 's' : ''} in your workspace
          </p>
        </div>
        <NewIdeaButton variant="primary" />
      </motion.div>

      {/* Search + Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.07 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ideas by title or description…"
            className="w-full bg-[var(--bg-input)] border border-[var(--border-ui)] rounded-xl pl-10 pr-4 py-2.5 text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-orange-500/40 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-xl p-1 shrink-0">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--text-muted)] ml-1.5" />
          {STAGE_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                filter === value
                  ? 'bg-orange-500/15 text-orange-400 border border-orange-500/25'
                  : 'text-[var(--text-muted)] hover:text-stone-300'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.14 }}
      >
        {isLoading ? (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-[68px] animate-pulse border-b border-[var(--border-subtle)] last:border-0 bg-[var(--bg-surface)]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-ui)] bg-[var(--bg-surface)] py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-5">
              <Lightbulb className="w-7 h-7 text-orange-400" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-2">
              {search || filter !== 'ALL' ? 'No matching ideas' : 'No ideas yet'}
            </h3>
            <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-xs mx-auto">
              {search || filter !== 'ALL'
                ? 'Try a different search term or filter.'
                : 'Submit your first startup idea and let AI help you validate it.'}
            </p>
            {!search && filter === 'ALL' && (
              <NewIdeaButton label="Submit your first idea" />
            )}
          </div>
        ) : (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_150px_90px_110px_44px] gap-4 px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Idea</span>
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Stage</span>
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">AI Score</span>
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Created</span>
              <span />
            </div>

            {filtered.map((idea: Idea, i: number) => {
              const stage = idea.stage as IdeaStage
              const { label, dotColor, badgeClass } = stageMeta[stage]
              return (
                <motion.div
                  key={idea.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    href={`/ideas/${idea.id}`}
                    className="group grid grid-cols-[1fr_150px_90px_110px_44px] gap-4 px-5 py-4 hover:bg-[var(--bg-surface)] transition-colors border-b border-[var(--border-subtle)] last:border-0 items-center"
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <span className={cn('w-2 h-2 rounded-full shrink-0', dotColor)} />
                      <div className="min-w-0">
                        <p className="text-[var(--text-primary)] text-sm font-medium truncate leading-tight">{idea.title}</p>
                        <p className="text-[var(--text-secondary)] text-xs truncate mt-0.5 leading-tight">{idea.description}</p>
                      </div>
                    </div>
                    <div>
                      <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full border', badgeClass)}>
                        {label}
                      </span>
                    </div>
                    <div>
                      <IdeaScoreBadge ideaId={idea.id} />
                    </div>
                    <div>
                      <span className="flex items-center gap-1.5 text-[var(--text-secondary)] text-xs">
                        <Clock className="w-3 h-3" />
                        {new Date(idea.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
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

      {filtered.length > 0 && (
        <p className="text-[var(--text-muted)] text-xs text-center">
          Showing {filtered.length} of {ideas.length} idea{ideas.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
