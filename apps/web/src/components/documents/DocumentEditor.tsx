'use client'
import { useState, useEffect, useMemo } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Save, Loader2, Eye, Edit3, FileText, Hash } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { DocumentType } from '@launchpad/shared'
import { useUpdateDocument } from '@/hooks/useIdeas'
import { cn } from '@/lib/utils'

const docTypeLabels: Record<DocumentType, string> = {
  PITCH_DECK: 'Pitch Deck',
  BUSINESS_PLAN: 'Business Plan',
  MVP_SPEC: 'MVP Specification',
  MARKET_RESEARCH: 'Market Research',
  FINANCIAL_MODEL: 'Financial Model',
  LEGAL_CHECKLIST: 'Legal Checklist',
}

interface Props {
  document: { id: string; status: string; version: number; content?: string }
  ideaId: string
  docType: DocumentType
  onClose: () => void
}

function extractHeadings(content: string) {
  return content
    .split('\n')
    .filter((line) => /^#{1,3} /.test(line))
    .map((line) => {
      const level = line.match(/^(#+)/)?.[1].length ?? 1
      const text = line.replace(/^#+\s/, '')
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      return { level, text, id }
    })
}

export function DocumentEditor({ document, ideaId, docType, onClose }: Props) {
  const [content, setContent] = useState(document.content || '')
  const [mode, setMode] = useState<'preview' | 'edit'>('preview')
  const [saved, setSaved] = useState(false)
  const { mutate: updateDoc, isPending } = useUpdateDocument(ideaId)
  const headings = useMemo(() => extractHeadings(content), [content])

  useEffect(() => {
    setContent(document.content || '')
  }, [document.content])

  const handleSave = () => {
    updateDoc(
      { docId: document.id, content },
      {
        onSuccess: () => {
          setSaved(true)
          setMode('preview')
          setTimeout(() => setSaved(false), 2000)
        },
      }
    )
  }

  const scrollTo = (id: string) => {
    const el = window.document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed inset-3 sm:inset-6 z-50 flex flex-col overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-modal)] shadow-2xl">

          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-base)] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-orange-500/15 border border-orange-500/25 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <div>
                <Dialog.Title className="font-heading font-semibold text-[var(--text-primary)] text-sm leading-none">
                  {docTypeLabels[docType]}
                </Dialog.Title>
                <p className="text-[var(--text-muted)] text-[11px] mt-0.5">v{document.version} · AI generated</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg p-0.5">
                <button
                  onClick={() => setMode('preview')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    mode === 'preview' ? 'bg-[var(--bg-surface-hover)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-stone-300'
                  )}
                >
                  <Eye className="w-3 h-3" /> Preview
                </button>
                <button
                  onClick={() => setMode('edit')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    mode === 'edit' ? 'bg-[var(--bg-surface-hover)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-stone-300'
                  )}
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              </div>

              {mode === 'edit' && (
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-500/90 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-60 shadow-md shadow-orange-500/20"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {saved ? 'Saved!' : isPending ? 'Saving…' : 'Save'}
                </button>
              )}

              <Dialog.Close asChild>
                <button className="w-8 h-8 rounded-lg hover:bg-[var(--bg-surface-hover)] flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-1 overflow-hidden">

            {/* TOC sidebar — preview only */}
            {mode === 'preview' && headings.length > 2 && (
              <div className="hidden lg:flex flex-col w-56 shrink-0 border-r border-[var(--border-subtle)] bg-[#0c0b0a] overflow-y-auto py-6 px-4 gap-1">
                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Hash className="w-3 h-3" /> Contents
                </p>
                {headings.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => scrollTo(h.id)}
                    className={cn(
                      'text-left text-xs py-1 px-2 rounded-md transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-stone-200 truncate',
                      h.level === 1 ? 'text-stone-300 font-medium' : h.level === 2 ? 'text-[var(--text-secondary)] pl-3' : 'text-[var(--text-muted)] pl-5'
                    )}
                  >
                    {h.text}
                  </button>
                ))}
              </div>
            )}

            {/* Main content */}
            <div className="flex-1 overflow-y-auto">
              {mode === 'preview' ? (
                <div className="max-w-3xl mx-auto px-8 py-10">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => {
                        const id = String(children).toLowerCase().replace(/[^a-z0-9]+/g, '-')
                        return (
                          <h1 id={id} className="font-heading text-3xl font-bold text-[var(--text-primary)] mb-2 leading-tight scroll-mt-6">
                            {children}
                          </h1>
                        )
                      },
                      h2: ({ children }) => {
                        const id = String(children).toLowerCase().replace(/[^a-z0-9]+/g, '-')
                        return (
                          <h2 id={id} className="font-heading text-xl font-semibold text-[var(--text-primary)] mt-10 mb-4 pb-2 border-b border-[var(--border-subtle)] scroll-mt-6">
                            {children}
                          </h2>
                        )
                      },
                      h3: ({ children }) => {
                        const id = String(children).toLowerCase().replace(/[^a-z0-9]+/g, '-')
                        return (
                          <h3 id={id} className="font-heading text-base font-semibold text-stone-200 mt-6 mb-3 scroll-mt-6">
                            {children}
                          </h3>
                        )
                      },
                      p: ({ children }) => (
                        <p className="text-stone-400 text-sm leading-7 mb-4">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="mb-5 space-y-2">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="mb-5 space-y-2 list-none counter-reset-item">{children}</ol>
                      ),
                      li: ({ children, ordered }: { children: React.ReactNode; ordered?: boolean }) => (
                        <li className="text-stone-400 text-sm flex gap-3 leading-6">
                          <span className="text-orange-500/70 shrink-0 mt-0.5 font-bold text-xs">{ordered ? '→' : '•'}</span>
                          <span className="flex-1">{children}</span>
                        </li>
                      ),
                      strong: ({ children }) => (
                        <strong className="text-stone-100 font-semibold">{children}</strong>
                      ),
                      em: ({ children }) => (
                        <em className="text-stone-300 not-italic border-l-2 border-orange-500/30 pl-3">{children}</em>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="my-5 pl-4 border-l-2 border-orange-500/50 bg-orange-500/[0.04] rounded-r-lg py-3 pr-4">
                          <div className="text-stone-300 text-sm leading-7">{children}</div>
                        </blockquote>
                      ),
                      code: ({ children, className }) => {
                        const isBlock = className?.includes('language-')
                        return isBlock ? (
                          <code className="block bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl px-5 py-4 text-xs text-stone-300 font-mono overflow-x-auto mb-5 leading-6">
                            {children}
                          </code>
                        ) : (
                          <code className="bg-orange-500/10 text-orange-300 text-xs font-mono px-1.5 py-0.5 rounded border border-orange-500/20">
                            {children}
                          </code>
                        )
                      },
                      table: ({ children }) => (
                        <div className="overflow-x-auto mb-6 rounded-xl border border-[var(--border-ui)]">
                          <table className="w-full text-sm border-collapse">{children}</table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-[var(--bg-input)] border-b border-[var(--border-ui)]">{children}</thead>
                      ),
                      th: ({ children }) => (
                        <th className="text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider px-4 py-3">
                          {children}
                        </th>
                      ),
                      tbody: ({ children }) => <tbody>{children}</tbody>,
                      tr: ({ children }) => (
                        <tr className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-colors">
                          {children}
                        </tr>
                      ),
                      td: ({ children }) => (
                        <td className="text-stone-400 text-sm px-4 py-3">{children}</td>
                      ),
                      hr: () => <hr className="border-[var(--border-subtle)] my-8" />,
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-full bg-transparent text-stone-300 text-sm font-mono p-8 resize-none focus:outline-none leading-7"
                  placeholder="Document content will appear here…"
                  spellCheck={false}
                />
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
