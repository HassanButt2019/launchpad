import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'
import { Idea, IdeaStage } from '@launchpad/shared'
import { cn } from '@/lib/utils'

const stageDotColor: Record<IdeaStage, string> = {
  DRAFT:        'bg-stone-500',
  VALIDATING:   'bg-amber-400',
  VALIDATED:    'bg-emerald-400',
  BUILDING:     'bg-orange-400',
  INCORPORATED: 'bg-blue-400',
}

const stageBadge: Record<IdeaStage, string> = {
  DRAFT:        'text-stone-400 bg-stone-500/15 border border-stone-500/20',
  VALIDATING:   'text-amber-400 bg-amber-500/15 border border-amber-500/20',
  VALIDATED:    'text-emerald-400 bg-emerald-500/15 border border-emerald-500/20',
  BUILDING:     'text-orange-400 bg-orange-500/15 border border-orange-500/20',
  INCORPORATED: 'text-blue-400 bg-blue-500/15 border border-blue-500/20',
}

const stageLabel: Record<IdeaStage, string> = {
  DRAFT: 'Draft',
  VALIDATING: 'Validating',
  VALIDATED: 'Validated',
  BUILDING: 'Building',
  INCORPORATED: 'Incorporated',
}

interface Props {
  idea: Idea
}

export function IdeaCard({ idea }: Props) {
  const stage = idea.stage as IdeaStage
  return (
    <Link
      href={`/ideas/${idea.id}`}
      className="group grid grid-cols-[1fr_150px_180px_110px_44px] gap-4 px-5 py-4 hover:bg-[var(--bg-surface)] transition-colors border-b border-[var(--border-subtle)] last:border-0 items-center"
    >
      <div className="min-w-0 flex items-center gap-3">
        <span className={cn('w-2 h-2 rounded-full shrink-0', stageDotColor[stage] ?? 'bg-stone-500')} />
        <div className="min-w-0">
          <p className="text-[var(--text-primary)] text-sm font-medium truncate leading-tight">{idea.title}</p>
          <p className="text-[var(--text-secondary)] text-xs truncate mt-0.5 leading-tight">{idea.description}</p>
        </div>
      </div>
      <div>
        <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full', stageBadge[stage] ?? stageBadge.DRAFT)}>
          {stageLabel[stage] ?? stage}
        </span>
      </div>
      <div>
        <span className="text-stone-400 text-sm">
          {idea.market_size || <span className="text-[var(--text-muted)]">Not specified</span>}
        </span>
      </div>
      <div>
        <span className="flex items-center gap-1.5 text-[var(--text-secondary)] text-xs">
          <Clock className="w-3 h-3" />
          {new Date(idea.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>
      <div className="flex justify-end">
        <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-orange-400 transition-colors" />
      </div>
    </Link>
  )
}
