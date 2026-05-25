'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Zap,
  Trash2,
  FileText,
  Map,
  Calendar,
  Target,
  Users,
  TrendingUp,
  Lightbulb,
  Building2,
  ArrowRight,
  ChevronRight,
  MessageSquare,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useIdea, useDeleteIdea, useValidationReport } from '@/hooks/useIdeas'
import { ValidationScore } from '@/components/idea/ValidationScore'
import { StageTracker } from '@/components/idea/StageTracker'
import { IdeaStage } from '@launchpad/shared'
import { cn } from '@/lib/utils'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

const stageColors: Record<IdeaStage, string> = {
  DRAFT:        'bg-stone-500/20 text-stone-400 border-stone-500/20',
  VALIDATING:   'bg-amber-500/20 text-amber-400 border-amber-500/20',
  VALIDATED:    'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
  BUILDING:     'bg-orange-500/15 text-orange-400 border-orange-500/20',
  INCORPORATED: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
}

const stageGlow: Record<IdeaStage, string> = {
  DRAFT:        'from-stone-500/8',
  VALIDATING:   'from-amber-500/8',
  VALIDATED:    'from-emerald-500/8',
  BUILDING:     'from-orange-500/8',
  INCORPORATED: 'from-blue-500/8',
}

export default function IdeaPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { data: idea, isLoading } = useIdea(id)
  const { data: report } = useValidationReport(id)
  const { mutate: deleteIdea, isPending: isDeleting } = useDeleteIdea()

  const handleDelete = () => setShowDeleteConfirm(true)
  const confirmDelete = () => {
    setShowDeleteConfirm(false)
    deleteIdea(id, { onSuccess: () => router.push('/dashboard') })
  }

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl h-40 animate-pulse" />
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl h-60 animate-pulse" />
          <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl h-60 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!idea) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl p-16 text-center">
        <p className="text-[var(--text-secondary)] mb-3">Idea not found.</p>
        <Link href="/dashboard" className="text-orange-400 text-sm hover:text-orange-300 transition-colors">
          ← Back to Dashboard
        </Link>
      </div>
    )
  }

  const stage = idea.stage as IdeaStage

  const quickActions = [
    { href: `/ideas/${id}/chat`, icon: MessageSquare, label: 'AI Co-Founder', desc: 'Chat with your AI advisor' },
    { href: `/ideas/${id}/validate`, icon: Zap, label: 'AI Validation', desc: 'Validate with AI analysis' },
    { href: `/ideas/${id}/documents`, icon: FileText, label: 'Documents', desc: 'Generate business docs' },
    { href: `/ideas/${id}/journey`, icon: Map, label: 'Startup Journey', desc: 'Track your milestones' },
    { href: `/ideas/${id}/formation`, icon: Building2, label: 'Formation', desc: 'Incorporate your startup' },
  ]

  const infoFields = [
    { icon: Target, label: 'Problem Statement', value: idea.problem_statement },
    { icon: Users, label: 'Target Audience', value: idea.target_audience },
    { icon: Lightbulb, label: 'Unique Value Proposition', value: idea.unique_value_prop },
    ...(idea.market_size ? [{ icon: TrendingUp, label: 'Market Size', value: idea.market_size }] : []),
  ]

  return (
    <div className="space-y-6">
      {/* ── Hero banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(
          'relative rounded-2xl border border-[var(--border-ui)] overflow-hidden',
          'bg-gradient-to-br',
          stageGlow[stage],
          'via-white/[0.01] to-transparent'
        )}
      >
        <div className="absolute inset-0 bg-white/[0.015]" />
        <div className="relative p-7">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-3">
                <span
                  className={cn(
                    'text-xs font-bold px-2.5 py-1 rounded-full border',
                    stageColors[stage]
                  )}
                >
                  {stage}
                </span>
                <span className="flex items-center gap-1 text-[var(--text-muted)] text-xs">
                  <Calendar className="w-3 h-3" />
                  {new Date(idea.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </span>
              </div>
              <h1 className="font-heading text-3xl font-bold text-[var(--text-primary)] leading-tight mb-2">{idea.title}</h1>
              <p className="text-stone-400 text-base leading-relaxed max-w-2xl">{idea.description}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {(stage === IdeaStage.VALIDATED || stage === IdeaStage.BUILDING || stage === IdeaStage.INCORPORATED) && (
                <Link
                  href={`/ideas/${id}/formation`}
                  className="flex items-center gap-2 border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
                >
                  <Building2 className="w-4 h-4" />
                  {stage === IdeaStage.INCORPORATED ? 'Formation' : 'Get Incorporated'}
                </Link>
              )}
              <Link
                href={`/ideas/${id}/validate`}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-500/90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-orange-500/20"
              >
                <Zap className="w-4 h-4" />
                {report ? 'View Validation' : 'Validate Idea'}
              </Link>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 border border-white/10 hover:border-red-500/40 text-[var(--text-secondary)] hover:text-red-400 text-sm px-3 py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Stage Tracker ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06 }}
      >
        <StageTracker stage={stage} />
      </motion.div>

      {/* ── Main split ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
        className="grid grid-cols-1 xl:grid-cols-5 gap-6"
      >
        {/* Left: Details (3/5) */}
        <div className="xl:col-span-3 space-y-5">
          {/* Overview */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
              <h2 className="font-heading font-semibold text-[var(--text-primary)] text-base">Idea Details</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {infoFields.map(({ icon: Icon, label, value }) => (
                <div key={label} className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-xs">
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </div>
                  <p className="text-stone-200 text-sm leading-relaxed">{value || <span className="text-[var(--text-muted)]">Not specified</span>}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Validation score full-width if available */}
          {report && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-semibold text-[var(--text-primary)] text-base">Validation Score</h2>
                <Link
                  href={`/ideas/${id}/validate`}
                  className="text-orange-400 hover:text-orange-300 text-xs flex items-center gap-1 transition-colors"
                >
                  View full report <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <ValidationScore report={report} size="md" />
            </div>
          )}
        </div>

        {/* Right: Quick Actions (2/5) */}
        <div className="xl:col-span-2 space-y-5">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
              <h2 className="font-heading font-semibold text-[var(--text-primary)] text-base">Quick Actions</h2>
            </div>
            <div className="p-3">
              {quickActions.map(({ href, icon: Icon, label, desc }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center gap-4 px-3 py-3.5 rounded-xl hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-[var(--bg-surface-hover)] border border-[var(--border-ui)] flex items-center justify-center shrink-0 group-hover:border-orange-500/20 group-hover:bg-orange-500/5 transition-colors">
                    <Icon className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-orange-400 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-stone-200 text-sm font-medium">{label}</p>
                    <p className="text-[var(--text-muted)] text-xs">{desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-orange-400 transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* Metadata card */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl p-5">
            <h3 className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-widest mb-4">Metadata</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] text-xs">Stage</span>
                <span className={cn('text-[11px] font-bold px-2.5 py-1 rounded-full border', stageColors[stage])}>
                  {stage}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] text-xs">Created</span>
                <span className="text-stone-300 text-xs">
                  {new Date(idea.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] text-xs">Validated</span>
                <span className="text-stone-300 text-xs">{report ? 'Yes' : 'Not yet'}</span>
              </div>
              {idea.market_size && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)] text-xs">Market Size</span>
                  <span className="text-stone-300 text-xs">{idea.market_size}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete this idea?"
          description="This will permanently delete the idea and all associated documents, validation reports, and chat history. This cannot be undone."
          confirmLabel="Delete idea"
          variant="danger"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}
