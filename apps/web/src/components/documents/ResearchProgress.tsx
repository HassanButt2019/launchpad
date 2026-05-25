'use client'

import { useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Sparkles,
  X,
  Download,
  Search,
  Brain,
  BarChart2,
  CheckCircle2,
  Loader2,
  Globe,
  AlertCircle,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { ideaKeys } from '@/hooks/useIdeas'
import { cn } from '@/lib/utils'

// ── Step config ────────────────────────────────────────────────────────────

const STEPS = [
  { key: 'planning',     label: 'Planning',     icon: Brain },
  { key: 'searching',    label: 'Web Search',   icon: Globe },
  { key: 'analyzing',    label: 'Analysing',    icon: Search },
  { key: 'synthesizing', label: 'Synthesising', icon: BarChart2 },
] as const

type StepKey = (typeof STEPS)[number]['key'] | 'done'

const STEP_ORDER: StepKey[] = ['planning', 'searching', 'analyzing', 'synthesizing', 'done']

// ── Markdown components ────────────────────────────────────────────────────

const mdComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-lg font-bold text-[var(--text-primary)] mt-6 mb-3 first:mt-0 border-b border-[var(--border-subtle)] pb-2">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-base font-bold text-[var(--text-primary)] mt-5 mb-2 first:mt-0">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-sm font-semibold text-stone-300 mt-4 mb-1.5 first:mt-0">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-sm text-stone-300 leading-relaxed mb-3 last:mb-0">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="space-y-1.5 mb-3 pl-1">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="space-y-1.5 mb-3 pl-4 list-decimal">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-sm text-stone-300 leading-relaxed flex gap-2">
      <span className="text-orange-400 mt-1 shrink-0 text-xs">•</span>
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic text-stone-400">{children}</em>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-orange-500/40 pl-4 my-3 text-stone-400 text-sm italic bg-orange-500/5 py-2 rounded-r-lg">
      {children}
    </blockquote>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto my-3 rounded-lg border border-[var(--border-ui)]">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="bg-[var(--bg-surface-hover)] border-b border-[var(--border-ui)]">{children}</thead>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="px-3 py-2 text-stone-300 text-xs border-b border-[var(--border-subtle)] last:border-0">{children}</td>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 underline decoration-orange-500/30 transition-colors">
      {children}
    </a>
  ),
  hr: () => <hr className="border-[var(--border-subtle)] my-4" />,
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    const isBlock = className?.includes('language-')
    return isBlock ? (
      <pre className="bg-black/30 border border-[var(--border-ui)] rounded-lg p-3 overflow-x-auto my-2">
        <code className="text-xs font-mono text-stone-300">{children}</code>
      </pre>
    ) : (
      <code className="bg-black/25 text-orange-300 text-xs font-mono px-1.5 py-0.5 rounded">{children}</code>
    )
  },
}

// ── Main component ─────────────────────────────────────────────────────────

interface Props {
  ideaId: string
  onClose: () => void
}

export function ResearchProgress({ ideaId, onClose }: Props) {
  const qc = useQueryClient()
  const [currentStep, setCurrentStep] = useState<StepKey>('planning')
  const [stepMessages, setStepMessages] = useState<Record<string, string>>({})
  const [searchLog, setSearchLog] = useState<string[]>([])
  const [report, setReport] = useState('')
  const [isDone, setIsDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  const start = useCallback(async () => {
    setIsRunning(true)
    setReport('')
    setError(null)
    setIsDone(false)
    setSearchLog([])
    setStepMessages({})
    setCurrentStep('planning')

    const token = useAuthStore.getState().accessToken
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    abortRef.current = new AbortController()

    try {
      const res = await fetch(
        `${baseURL}/api/v1/ideas/${ideaId}/documents/market-research/stream`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: abortRef.current.signal,
        }
      )

      if (!res.ok) {
        throw new Error(`Server error ${res.status}`)
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        for (const line of text.split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))

            if (event.type === 'progress') {
              const step = event.step as StepKey
              setCurrentStep(step)
              setStepMessages((prev) => ({ ...prev, [step]: event.message }))
              if (step === 'searching') {
                setSearchLog((prev) => [...prev, event.message.replace('Searching: ', '')])
              }
            } else if (event.type === 'chunk') {
              setReport((prev) => {
                const next = prev + event.content
                // auto-scroll
                setTimeout(() => {
                  reportRef.current?.scrollTo({ top: reportRef.current.scrollHeight, behavior: 'smooth' })
                }, 50)
                return next
              })
            } else if (event.type === 'done') {
              setIsDone(true)
              setCurrentStep('done')
              qc.invalidateQueries({ queryKey: ideaKeys.documents(ideaId) })
            } else if (event.type === 'error') {
              setError(event.message)
            }
          } catch {
            // malformed SSE line
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'Research failed. Please try again.')
      }
    } finally {
      setIsRunning(false)
    }
  }, [ideaId, qc])

  const handleDownload = () => {
    const blob = new Blob([report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'market-research.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  const currentStepIdx = STEP_ORDER.indexOf(currentStep)
  const showReport = report.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={!isRunning ? onClose : undefined} />

      <div className="relative bg-[var(--bg-base)] border border-[var(--border-strong)] rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/25 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <p className="font-heading font-semibold text-[var(--text-primary)] text-sm">Agentic Market Research</p>
              <p className="text-[var(--text-muted)] text-xs">
                {isDone ? 'Report complete — saved to your documents' : isRunning ? 'AI agent researching your market…' : 'Live web research + AI synthesis'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDone && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[var(--border-ui)] text-[var(--text-secondary)] hover:text-white hover:border-white/20 rounded-lg transition-colors"
              >
                <Download className="w-3 h-3" />
                Export .md
              </button>
            )}
            {!isRunning && (
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg hover:bg-[var(--bg-surface-hover)] flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Progress steps ── */}
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] shrink-0">
          <div className="flex items-center gap-2">
            {STEPS.map((step, i) => {
              const stepIdx = STEP_ORDER.indexOf(step.key)
              const isDoneStep = isDone || stepIdx < currentStepIdx
              const isActive = step.key === currentStep && isRunning
              const isPending = stepIdx > currentStepIdx && !isDone
              const Icon = step.icon

              return (
                <div key={step.key} className="flex items-center gap-2 flex-1">
                  <div
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                      isDoneStep && 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400',
                      isActive && 'bg-orange-500/10 border border-orange-500/30 text-orange-300',
                      isPending && 'bg-[var(--bg-surface)] border border-[var(--border-ui)] text-[var(--text-muted)]',
                    )}
                  >
                    {isDoneStep ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    ) : isActive ? (
                      <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                    ) : (
                      <Icon className="w-3 h-3 shrink-0" />
                    )}
                    <span className="hidden sm:inline">{step.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'flex-1 h-px transition-colors',
                        stepIdx < currentStepIdx || isDone ? 'bg-emerald-500/30' : 'bg-[var(--border-ui)]'
                      )}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Search log */}
          {searchLog.length > 0 && (
            <div className="mt-3 space-y-1 max-h-20 overflow-y-auto">
              {searchLog.map((q, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                  <Globe className="w-2.5 h-2.5 shrink-0 text-orange-400/60" />
                  {q}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Report or empty state ── */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {!isRunning && !showReport && !error ? (
            /* Launch state */
            <div className="flex flex-col items-center justify-center h-full gap-5 p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <Search className="w-8 h-8 text-orange-400" />
              </div>
              <div>
                <p className="text-[var(--text-primary)] font-semibold text-base mb-2">Real-time market intelligence</p>
                <p className="text-[var(--text-muted)] text-sm max-w-sm leading-relaxed">
                  The AI agent will search the web for live market data, find competitors with funding info, analyse trends, and synthesise everything into a full research report.
                </p>
              </div>
              <button
                onClick={start}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-500/90 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-orange-500/20 text-sm"
              >
                <Sparkles className="w-4 h-4" />
                Start Market Research
              </button>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
              <AlertCircle className="w-10 h-10 text-red-400" />
              <p className="text-red-300 text-sm">{error}</p>
              <button
                onClick={start}
                className="text-xs px-4 py-2 border border-[var(--border-ui)] text-[var(--text-secondary)] hover:text-white rounded-lg transition-colors"
              >
                Try again
              </button>
            </div>
          ) : (
            /* Streaming report */
            <div ref={reportRef} className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={mdComponents as Record<string, React.ComponentType<unknown>>}
                >
                  {report}
                </ReactMarkdown>
                {isRunning && (
                  <span className="inline-block w-0.5 h-4 bg-orange-400 animate-pulse ml-0.5 align-middle" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {(isRunning || isDone) && (
          <div className="px-5 py-3 border-t border-[var(--border-subtle)] shrink-0 flex items-center justify-between">
            <p className="text-[10px] text-[var(--text-muted)]">
              {isDone
                ? `Report saved to your documents`
                : stepMessages[currentStep] || 'Working…'}
            </p>
            {isRunning && (
              <button
                onClick={() => abortRef.current?.abort()}
                className="text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors"
              >
                Cancel
              </button>
            )}
            {isDone && (
              <div className="flex items-center gap-2">
                <button
                  onClick={start}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[var(--border-ui)] text-[var(--text-muted)] hover:text-orange-400 hover:border-orange-500/30 rounded-lg transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  Re-run Research
                </button>
                <button
                  onClick={onClose}
                  className="text-xs px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-ui)] hover:border-orange-500/30 text-[var(--text-secondary)] hover:text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
