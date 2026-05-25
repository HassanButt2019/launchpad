'use client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronLeft, Check, CalendarDays, RefreshCw } from 'lucide-react'
import { useComplianceEvents, useToggleComplianceEvent } from '@/hooks/useFormation'
import { cn } from '@/lib/utils'
import type { ComplianceEvent } from '@launchpad/shared'

const RECURRENCE_STYLES: Record<string, string> = {
  ANNUAL: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  QUARTERLY: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  ONE_TIME: 'bg-stone-500/10 border-stone-500/20 text-stone-400',
  MONTHLY: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
}

function EventRow({ event, onToggle }: { event: ComplianceEvent; onToggle: () => void }) {
  const date = new Date(event.due_date)
  const month = date.toLocaleString('default', { month: 'short' }).toUpperCase()
  const day = date.getDate()
  const isOverdue = !event.completed && date < new Date()

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-4 p-4"
    >
      {/* Date block */}
      <div
        className={cn(
          'flex flex-col items-center justify-center w-12 h-12 rounded-xl border shrink-0',
          event.completed
            ? 'bg-stone-500/10 border-stone-500/20'
            : isOverdue
            ? 'bg-red-500/10 border-red-500/20'
            : 'bg-orange-500/10 border-orange-500/20'
        )}
      >
        <span
          className={cn(
            'text-[9px] font-bold uppercase tracking-widest',
            event.completed ? 'text-[var(--text-secondary)]' : isOverdue ? 'text-red-400' : 'text-orange-400'
          )}
        >
          {month}
        </span>
        <span
          className={cn(
            'text-lg font-bold leading-none',
            event.completed ? 'text-[var(--text-secondary)]' : isOverdue ? 'text-red-400' : 'text-orange-400'
          )}
        >
          {day}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <p
            className={cn(
              'text-sm font-medium',
              event.completed ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'
            )}
          >
            {event.title}
          </p>
          {event.recurrence && (
            <span
              className={cn(
                'flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border',
                RECURRENCE_STYLES[event.recurrence] ?? RECURRENCE_STYLES.ONE_TIME
              )}
            >
              {event.recurrence !== 'ONE_TIME' && <RefreshCw className="w-2.5 h-2.5" />}
              {event.recurrence.replace(/_/g, ' ')}
            </span>
          )}
          {isOverdue && !event.completed && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border bg-red-500/10 border-red-500/20 text-red-400">
              Overdue
            </span>
          )}
        </div>
        <p className="text-[var(--text-secondary)] text-xs mt-0.5 leading-relaxed">{event.description}</p>
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center gap-1.5 shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all',
          event.completed
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
            : 'border-[var(--border-strong)] text-[var(--text-secondary)] hover:border-orange-500/30 hover:text-orange-400'
        )}
      >
        <Check className="w-3.5 h-3.5" />
        {event.completed ? 'Done' : 'Mark Done'}
      </button>
    </motion.div>
  )
}

export default function CompliancePage() {
  const params = useParams()
  const ideaId = params.id as string

  const { data: events = [], isLoading } = useComplianceEvents(ideaId)
  const { mutate: toggleEvent } = useToggleComplianceEvent(ideaId)

  const sorted = [...(events as ComplianceEvent[])].sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  )

  const upcoming = sorted.filter((e) => !e.completed)
  const completed = sorted.filter((e) => e.completed)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl h-20 animate-pulse" />
        <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl h-48 animate-pulse" />
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
        <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">Compliance Calendar</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Stay on top of your legal obligations</p>
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl p-12 text-center"
        >
          <CalendarDays className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="text-[var(--text-primary)] font-semibold mb-2">No compliance events yet</h3>
          <p className="text-[var(--text-secondary)] text-sm max-w-xs mx-auto">
            Compliance events will appear here once your formation is processed.
          </p>
        </motion.div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-widest mb-3">
            Upcoming ({upcoming.length})
          </p>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl divide-y divide-white/[0.05]">
            {upcoming.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <EventRow
                  event={event}
                  onToggle={() => toggleEvent({ eventId: event.id, completed: true })}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-widest mb-3">
            Completed ({completed.length})
          </p>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl divide-y divide-white/[0.05] opacity-70">
            {completed.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <EventRow
                  event={event}
                  onToggle={() => toggleEvent({ eventId: event.id, completed: false })}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
