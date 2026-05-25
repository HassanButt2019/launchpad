'use client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronLeft, Check, ExternalLink, Sparkles, Clock } from 'lucide-react'
import { useFormationProfile, useToggleFormationChecklist, useJurisdictions } from '@/hooks/useFormation'
import { cn } from '@/lib/utils'
import type { FormationChecklistItem } from '@launchpad/shared'

const CATEGORY_LABELS: Record<string, string> = {
  FORMATION_DOCS: 'Formation Documents',
  REGISTRATION: 'Registration',
  BANKING: 'Banking',
  COMPLIANCE: 'Compliance',
  PRE_APPLICATION: 'Pre-Application',
}

export default function FormationChecklistPage() {
  const params = useParams()
  const ideaId = params.id as string

  const { data: profile, isLoading } = useFormationProfile(ideaId)
  const { data: jurisdictions = [] } = useJurisdictions()
  const { mutate: toggleItem } = useToggleFormationChecklist(ideaId)

  const jInfo = jurisdictions.find((j: { code: string }) => j.code === profile?.jurisdiction)
  const jurisdictionName = jInfo?.name ?? profile?.jurisdiction ?? ''

  const items: FormationChecklistItem[] = profile?.checklist_items ?? []
  const total = items.length
  const completed = items.filter((i) => i.completed).length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  // Group by category
  const grouped = items.reduce<Record<string, FormationChecklistItem[]>>((acc, item) => {
    const cat = item.category ?? 'OTHER'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  // Sort items within each category by sort_order
  for (const cat of Object.keys(grouped)) {
    grouped[cat].sort((a, b) => a.sort_order - b.sort_order)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl h-24 animate-pulse" />
        <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl h-48 animate-pulse" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--text-secondary)]">Formation not started yet.</p>
        <Link href={`/ideas/${ideaId}/formation`} className="text-orange-400 text-sm mt-2 inline-block">
          Start Formation
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back + header */}
      <div>
        <Link
          href={`/ideas/${ideaId}/formation`}
          className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-white text-sm transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Formation
        </Link>
        <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">Formation Checklist</h1>
        {jurisdictionName && (
          <p className="text-[var(--text-secondary)] text-sm mt-1">{jurisdictionName}</p>
        )}
      </div>

      {/* Progress */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[var(--text-secondary)] text-xs">Overall Progress</p>
          <span className="text-orange-400 font-semibold text-sm">{pct}%</span>
        </div>
        <div className="w-full bg-[var(--bg-surface-hover)] rounded-full h-2 mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="bg-orange-500 h-2 rounded-full"
          />
        </div>
        <p className="text-[var(--text-muted)] text-xs">{completed} of {total} items completed</p>
      </div>

      {/* Grouped items */}
      {total === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl">
          <Check className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-[var(--text-secondary)]">No checklist items yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, categoryItems]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-widest">
                  {CATEGORY_LABELS[category] ?? category.replace(/_/g, ' ')}
                </p>
                <span className="text-[var(--text-muted)] text-[10px]">({categoryItems.length})</span>
              </div>
              <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl divide-y divide-white/[0.05]">
                {categoryItems.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="flex items-start gap-4 p-4"
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleItem({ itemId: item.id, completed: !item.completed })}
                      className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                        item.completed
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-stone-600 hover:border-orange-500/60'
                      )}
                    >
                      {item.completed && <Check className="w-3 h-3 text-white" />}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          item.completed ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'
                        )}
                      >
                        {item.title}
                        {item.is_required && !item.completed && (
                          <span className="ml-2 text-[10px] text-red-400/70">required</span>
                        )}
                      </p>
                      <p className="text-[var(--text-secondary)] text-xs mt-0.5 truncate">{item.description}</p>
                    </div>

                    {/* Right badges */}
                    <div className="flex items-center gap-2 shrink-0">
                      {item.can_ai_draft && (
                        <span className="flex items-center gap-1 text-[10px] bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full px-2 py-0.5">
                          <Sparkles className="w-2.5 h-2.5" />
                          Draft
                        </span>
                      )}
                      {item.official_link && (
                        <a
                          href={item.official_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--text-muted)] hover:text-stone-400 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {item.estimated_days > 0 && (
                        <span className="flex items-center gap-1 text-[var(--text-muted)] text-[10px]">
                          <Clock className="w-2.5 h-2.5" />
                          {item.estimated_days}d
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
