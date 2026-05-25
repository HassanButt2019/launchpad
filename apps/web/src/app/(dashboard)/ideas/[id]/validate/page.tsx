'use client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Zap,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Lightbulb,
  RefreshCw,
  Swords,
  TrendingUp,
  ExternalLink,
  Globe,
  Info,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useValidationReport, useValidateIdea } from '@/hooks/useIdeas'
import { ValidationScore } from '@/components/idea/ValidationScore'
import { cn } from '@/lib/utils'

function ScoreLabel({ score }: { score: number }) {
  if (score >= 90) return <span className="text-emerald-400 font-semibold">Exceptional</span>
  if (score >= 80) return <span className="text-emerald-400 font-semibold">Strong</span>
  if (score >= 65) return <span className="text-amber-400 font-semibold">Promising</span>
  if (score >= 50) return <span className="text-orange-400 font-semibold">Needs Work</span>
  return <span className="text-red-400 font-semibold">Weak</span>
}

function ScoreDimension({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className="text-[var(--text-primary)] font-medium">{value}/{max}</span>
      </div>
      <div className="h-1.5 bg-[var(--bg-surface-hover)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={cn(
            'h-full rounded-full',
            pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-orange-500'
          )}
        />
      </div>
    </div>
  )
}

export default function ValidatePage() {
  const params = useParams()
  const id = params.id as string

  const { data: report, isLoading } = useValidationReport(id)
  const { mutate: validate, isPending } = useValidateIdea(id)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl h-48 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl h-40 animate-pulse" />
          <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl h-40 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/ideas/${id}`} className="text-[var(--text-secondary)] hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">AI Validation</h1>
          {report && (
            <p className="text-[var(--text-muted)] text-xs mt-0.5">
              Last run {new Date(report.generated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>

      {!report ? (
        /* ── Empty state ── */
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl p-12 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/15 flex items-center justify-center mx-auto mb-5">
            <Zap className="w-8 h-8 text-orange-400" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-[var(--text-primary)] mb-2">
            Ready to validate your idea?
          </h2>
          <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto mb-8 leading-relaxed">
            The AI analyst will search the web for real market data, identify actual competitors,
            score your idea across 5 VC dimensions, and give specific, actionable recommendations.
          </p>
          <button
            onClick={() => validate()}
            disabled={isPending}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-500/90 text-white font-semibold px-7 py-3 rounded-xl transition-colors disabled:opacity-60 shadow-lg shadow-orange-500/20"
          >
            {isPending ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Analysing…</>
            ) : (
              <><Zap className="w-4 h-4" /> Run AI Validation</>
            )}
          </button>
          {isPending && (
            <p className="text-[var(--text-muted)] text-xs mt-4">
              Searching the web + running AI analysis — takes ~20 seconds…
            </p>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-5"
        >
          {/* ── Score hero ── */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl p-7">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <ValidationScore report={report} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-heading text-xl font-semibold text-[var(--text-primary)]">
                    <ScoreLabel score={report.score} />
                  </h2>
                  <span className="text-[var(--text-muted)] text-sm">— {report.score}/100</span>
                </div>
                {report.score_rationale && (
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-5">
                    {report.score_rationale}
                  </p>
                )}

                {/* Score breakdown bars */}
                <div className="space-y-2.5 max-w-sm">
                  <ScoreDimension label="Market Opportunity" value={Math.round(report.score * 0.25)} max={25} />
                  <ScoreDimension label="Problem Clarity" value={Math.round(report.score * 0.20)} max={20} />
                  <ScoreDimension label="Differentiation" value={Math.round(report.score * 0.20)} max={20} />
                  <ScoreDimension label="Execution Feasibility" value={Math.round(report.score * 0.20)} max={20} />
                  <ScoreDimension label="Market Timing" value={Math.round(report.score * 0.15)} max={15} />
                </div>
              </div>

              <button
                onClick={() => validate()}
                disabled={isPending}
                className="self-start flex items-center gap-2 border border-[var(--border-ui)] hover:border-orange-500/40 text-[var(--text-secondary)] hover:text-white text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={cn('w-4 h-4', isPending && 'animate-spin')} />
                Re-validate
              </button>
            </div>
          </div>

          {/* ── Market Opportunity ── */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <h3 className="font-heading font-semibold text-[var(--text-primary)] text-sm">Market Opportunity</h3>
            </div>
            {report.market_opportunity ? (
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                {report.market_opportunity}
              </p>
            ) : (
              <p className="text-[var(--text-muted)] text-sm italic flex items-center gap-2">
                <Info className="w-3.5 h-3.5 shrink-0" />
                Re-validate to see web-researched market analysis.
              </p>
            )}
          </div>

          {/* ── Strengths + Weaknesses ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <h3 className="font-heading font-semibold text-[var(--text-primary)] text-sm">Strengths</h3>
              </div>
              <ul className="space-y-3">
                {(report.strengths || []).map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="w-4 h-4 text-red-400" />
                <h3 className="font-heading font-semibold text-[var(--text-primary)] text-sm">Weaknesses & Risks</h3>
              </div>
              <ul className="space-y-3">
                {(report.weaknesses || []).map((w: string, i: number) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── Competitive Landscape ── */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <Swords className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <h3 className="font-heading font-semibold text-[var(--text-primary)] text-sm">Competitive Landscape</h3>
              {(report.sources?.length ?? 0) > 0 && (
                <span className="ml-auto flex items-center gap-1 text-[10px] text-[var(--text-muted)] bg-[var(--bg-surface-hover)] border border-[var(--border-ui)] px-2 py-0.5 rounded-full">
                  <Globe className="w-2.5 h-2.5" />
                  Web-researched
                </span>
              )}
            </div>
            {report.competitive_landscape ? (
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                {report.competitive_landscape}
              </p>
            ) : (
              <p className="text-[var(--text-muted)] text-sm italic flex items-center gap-2">
                <Info className="w-3.5 h-3.5 shrink-0" />
                Re-validate to see web-researched competitor analysis.
              </p>
            )}
          </div>

          {/* ── Recommendations ── */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <h3 className="font-heading font-semibold text-[var(--text-primary)] text-sm">Recommendations</h3>
            </div>
            <ol className="space-y-3">
              {(report.recommendations || []).map((r: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                  <span className="w-6 h-6 rounded-full bg-amber-400/10 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {r}
                </li>
              ))}
            </ol>
          </div>

          {/* ── Sources ── */}
          {(report.sources?.length ?? 0) > 0 && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">Research Sources</h3>
              </div>
              <div className="space-y-1.5">
                {(report.sources || []).map((url: string, i: number) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-orange-400 transition-colors group truncate"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0 group-hover:text-orange-400" />
                    <span className="truncate">{url}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
