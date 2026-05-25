'use client'
import { CheckCircle2, Circle, ExternalLink, Target, Hammer, Rocket } from 'lucide-react'
import { useChecklist, useUpdateChecklistItem } from '@/hooks/useIdeas'
import { ChecklistPhase, Checklist } from '@launchpad/shared'

const phaseConfig: Record<
  ChecklistPhase,
  {
    icon: React.ComponentType<{ className?: string }>
    label: string
    color: string
    bg: string
  }
> = {
  VALIDATE: { icon: Target, label: 'Validate', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  BUILD: { icon: Hammer, label: 'Build', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  LAUNCH: { icon: Rocket, label: 'Launch', color: 'text-green-400', bg: 'bg-green-500/20' },
}

const phaseOffsets: Record<ChecklistPhase, number> = {
  VALIDATE: 0,
  BUILD: 8,
  LAUNCH: 16,
}

interface Props {
  ideaId: string
}

export function StartupJourney({ ideaId }: Props) {
  const { data: checklists = [], isLoading } = useChecklist(ideaId)
  const { mutate: updateItem } = useUpdateChecklistItem(ideaId)

  const getChecklist = (phase: ChecklistPhase): Checklist | undefined =>
    (checklists as Checklist[]).find((c) => c.phase === phase)

  if (isLoading) {
    return (
      <div className="flex gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-xl h-64 animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (checklists.length === 0) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl p-10 text-center">
        <Target className="w-10 h-10 text-orange-400 mx-auto mb-4 opacity-50" />
        <h3 className="font-heading font-semibold text-[var(--text-primary)] mb-2">No journey data yet</h3>
        <p className="text-[var(--text-secondary)] text-sm">
          Run AI validation first to unlock your startup journey checklist.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      {(['VALIDATE', 'BUILD', 'LAUNCH'] as ChecklistPhase[]).map((phase) => {
        const checklist = getChecklist(phase)
        const { icon: Icon, label, color, bg } = phaseConfig[phase]
        const items = checklist?.items || []
        const completed = items.filter((i) => i.completed).length
        const total = items.length
        const progress = total ? (completed / total) * 100 : 0
        const offset = phaseOffsets[phase]

        return (
          <div
            key={phase}
            className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-[var(--text-primary)] text-sm">{label}</h3>
                <p className="text-[var(--text-secondary)] text-xs">
                  {completed}/{total} tasks
                </p>
              </div>
            </div>
            <div className="w-full bg-[var(--bg-surface-hover)] rounded-full h-1.5 mb-4">
              <div
                className="bg-orange-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <ul className="space-y-2.5">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 group">
                  <button
                    onClick={() =>
                      updateItem({ itemId: offset + i, completed: !item.completed })
                    }
                    className="mt-0.5 shrink-0 hover:scale-110 transition-transform"
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-[var(--text-muted)] group-hover:text-white transition-colors" />
                    )}
                  </button>
                  <span
                    className={`text-sm flex-1 ${
                      item.completed ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {item.task}
                  </span>
                  {item.resource_url && (
                    <a
                      href={item.resource_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 mt-0.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)] hover:text-orange-400 transition-colors" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
