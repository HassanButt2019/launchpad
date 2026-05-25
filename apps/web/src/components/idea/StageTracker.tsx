import { IdeaStage } from '@launchpad/shared'
import { cn } from '@/lib/utils'
import { FileText, Search, CheckCircle2, Hammer, Building2 } from 'lucide-react'

const STAGES: { stage: IdeaStage; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { stage: IdeaStage.DRAFT,        label: 'Draft',        desc: 'Idea captured',      icon: FileText },
  { stage: IdeaStage.VALIDATING,   label: 'Validating',   desc: 'Running AI checks',  icon: Search },
  { stage: IdeaStage.VALIDATED,    label: 'Validated',    desc: 'Idea confirmed',      icon: CheckCircle2 },
  { stage: IdeaStage.BUILDING,     label: 'Building',     desc: 'In development',      icon: Hammer },
  { stage: IdeaStage.INCORPORATED, label: 'Incorporated', desc: 'Company formed',      icon: Building2 },
]

const stageOrder = Object.values(IdeaStage)

interface Props {
  stage: IdeaStage
}

export function StageTracker({ stage }: Props) {
  const currentIndex = stageOrder.indexOf(stage)

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <p className="font-heading text-sm font-semibold text-[var(--text-primary)]">Progress</p>
        <p className="text-[var(--text-secondary)] text-xs">
          Step {currentIndex + 1} of {STAGES.length}
        </p>
      </div>
      <div className="flex items-start">
        {STAGES.map(({ stage: s, label, desc, icon: Icon }, i) => {
          const isCompleted = i < currentIndex
          const isActive = i === currentIndex
          const isFuture = i > currentIndex

          return (
            <div key={s} className="flex items-start flex-1 last:flex-none">
              <div className="flex flex-col items-center w-full">
                <div className="flex items-center w-full mb-3">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 border',
                      isCompleted
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : isActive
                        ? 'bg-orange-500/15 border-orange-500/30 text-orange-400 ring-2 ring-orange-500/20 ring-offset-2 ring-offset-[var(--ring-offset)]'
                        : 'bg-[var(--bg-input)] border-[var(--border-ui)] text-[var(--text-muted)]'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {i < STAGES.length - 1 && (
                    <div className="flex-1 h-px mx-2 mt-0 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[var(--bg-surface-hover)]" />
                      {isCompleted && (
                        <div className="absolute inset-0 bg-emerald-500/50" />
                      )}
                    </div>
                  )}
                </div>
                <div className="text-center px-1">
                  <p
                    className={cn(
                      'text-xs font-semibold leading-tight',
                      isCompleted ? 'text-emerald-400' : isActive ? 'text-orange-400' : 'text-[var(--text-muted)]'
                    )}
                  >
                    {label}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-tight hidden sm:block">{desc}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
