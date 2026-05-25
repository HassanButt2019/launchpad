'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  ChevronLeft,
  FileText,
  AlertTriangle,
  Loader2,
  X,
  RefreshCw,
  Eye,
  Download,
} from 'lucide-react'
import {
  useFormationProfile,
  useFormationDocuments,
  useGenerateFormationDocument,
  useJurisdictions,
} from '@/hooks/useFormation'
import { cn } from '@/lib/utils'
import type { FormationDocument } from '@launchpad/shared'

const JURISDICTION_DOCS: Record<string, string[]> = {
  US: [
    'Certificate of Incorporation',
    'Bylaws',
    'Founder Stock Purchase Agreement',
    '83(b) Election Letter',
    'IP Assignment Agreement',
    'Shareholder Agreement',
  ],
  UK: [
    'Memorandum of Association',
    'Articles of Association',
    'Shareholder Agreement',
    'Share Certificates',
  ],
  UAE: [
    'MOA/AOA',
    'Shareholder Resolution',
    'Share Certificates',
    'Shareholder Agreement',
  ],
}

const DEFAULT_DOCS = [
  'Articles of Incorporation',
  'Shareholder Agreement',
  'Share Certificates',
  'IP Assignment Agreement',
]

function getDocTypes(jurisdiction: string): string[] {
  const key = Object.keys(JURISDICTION_DOCS).find((k) =>
    jurisdiction.toUpperCase().includes(k)
  )
  return key ? JURISDICTION_DOCS[key] : DEFAULT_DOCS
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  GENERATED: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  PENDING: 'bg-stone-500/10 border-stone-500/20 text-stone-400',
  ready: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
}

const mdComponents = {
  h1: ({ children }: any) => (
    <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)] mt-8 mb-4 pb-2 border-b border-[var(--border-subtle)]">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="font-heading text-lg font-bold text-[var(--text-primary)] mt-6 mb-3">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="font-heading text-base font-semibold text-[var(--text-primary)] mt-5 mb-2">
      {children}
    </h3>
  ),
  p: ({ children }: any) => (
    <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-3">{children}</p>
  ),
  ul: ({ children }: any) => <ul className="space-y-1.5 mb-4 ml-1">{children}</ul>,
  ol: ({ children }: any) => (
    <ol className="space-y-1.5 mb-4 ml-1 list-decimal list-inside">{children}</ol>
  ),
  li: ({ children, ordered }: any) =>
    ordered ? (
      <li className="text-sm text-[var(--text-secondary)] ml-4 leading-relaxed">{children}</li>
    ) : (
      <li className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 mt-2" />
        <span>{children}</span>
      </li>
    ),
  strong: ({ children }: any) => (
    <strong className="font-semibold text-[var(--text-primary)]">{children}</strong>
  ),
  em: ({ children }: any) => (
    <em className="text-[var(--text-secondary)] italic">{children}</em>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-orange-500/40 pl-4 my-4 text-[var(--text-secondary)] text-sm italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-[var(--border-subtle)] my-6" />,
  code: ({ inline, children }: any) =>
    inline ? (
      <code className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded px-1.5 py-0.5 text-xs font-mono text-orange-400">
        {children}
      </code>
    ) : (
      <pre className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-xl p-4 overflow-x-auto my-4">
        <code className="text-xs font-mono text-[var(--text-secondary)] whitespace-pre">{children}</code>
      </pre>
    ),
}

function DocumentModal({
  doc,
  onClose,
  onRegenerate,
  isRegenerating,
}: {
  doc: FormationDocument
  onClose: () => void
  onRegenerate?: () => void
  isRegenerating?: boolean
}) {
  const handleDownload = () => {
    if (!doc.content) return
    const blob = new Blob([doc.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.doc_type.replace(/\s+/g, '_')}_v${doc.version}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[var(--bg-base)] border border-[var(--border-strong)] rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-ui)] shrink-0"
            style={{ backgroundColor: 'var(--bg-sidebar)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-[var(--text-primary)] text-sm">
                  {doc.doc_type}
                </h3>
                <p className="text-[var(--text-muted)] text-[11px] mt-0.5">
                  {doc.jurisdiction} · {doc.status} · v{doc.version} ·{' '}
                  {new Date(doc.generated_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {doc.content && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs px-3 py-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Legal disclaimer */}
          <div className="flex items-center gap-2 px-6 py-2.5 bg-amber-500/[0.06] border-b border-amber-500/15 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <p className="text-amber-400/80 text-[11px]">
              AI-generated draft — review with a qualified attorney before filing.
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {doc.content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                {doc.content}
              </ReactMarkdown>
            ) : (
              <div className="text-center py-16">
                <FileText className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
                <p className="text-[var(--text-secondary)] text-sm">No content available yet.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {onRegenerate && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-sidebar)] shrink-0">
              <p className="text-[10px] text-[var(--text-muted)]">v{doc.version} · {doc.jurisdiction}</p>
              <button
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[var(--border-ui)] hover:border-orange-500/30 text-[var(--text-secondary)] hover:text-orange-400 rounded-lg transition-colors disabled:opacity-50"
              >
                {isRegenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                {isRegenerating ? 'Regenerating…' : 'Regenerate'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function FormationDocumentsPage() {
  const params = useParams()
  const ideaId = params.id as string
  const [viewingDoc, setViewingDoc] = useState<FormationDocument | null>(null)

  const { data: profile, isLoading: profileLoading } = useFormationProfile(ideaId)
  const { data: documents = [], isLoading: docsLoading } = useFormationDocuments(ideaId)
  const { data: jurisdictions = [] } = useJurisdictions()
  const { mutate: generateDoc, isPending: isGenerating, variables: generatingVars } =
    useGenerateFormationDocument(ideaId)

  const jInfo = jurisdictions.find((j: { code: string }) => j.code === profile?.jurisdiction)
  const jurisdictionName = jInfo?.name ?? profile?.jurisdiction ?? ''
  const isLoading = profileLoading || docsLoading
  const docTypes = profile ? getDocTypes(profile.jurisdiction) : []

  const existingDocsByType = (documents as FormationDocument[]).reduce<
    Record<string, FormationDocument>
  >((acc, doc) => {
    acc[doc.doc_type] = doc
    return acc
  }, {})

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl h-20 animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl h-36 animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--text-secondary)]">Formation not started yet.</p>
        <Link
          href={`/ideas/${ideaId}/formation`}
          className="text-orange-400 text-sm mt-2 inline-block"
        >
          Start Formation
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Link
          href={`/ideas/${ideaId}/formation`}
          className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Formation
        </Link>
        <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">
          Formation Documents
        </h1>
        {jurisdictionName && (
          <p className="text-[var(--text-secondary)] text-sm mt-1">{jurisdictionName}</p>
        )}
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-4">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-amber-200/70 text-xs leading-relaxed">
          <span className="font-semibold text-amber-400">For reference only.</span> AI-generated
          drafts are a starting point. Have a qualified attorney review all documents before filing.
        </p>
      </div>

      {/* Document grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {docTypes.map((docType, idx) => {
          const existing = existingDocsByType[docType]
          const isThisGenerating = isGenerating && generatingVars?.doc_type === docType
          const docStatus = existing?.status ?? null

          return (
            <motion.div
              key={docType}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-2xl p-5 flex flex-col"
            >
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-3">
                <FileText className="w-4 h-4 text-orange-400" />
              </div>
              <h3 className="text-[var(--text-primary)] text-sm font-semibold mb-1 leading-snug">
                {docType}
              </h3>
              {docStatus && (
                <span
                  className={cn(
                    'self-start text-[10px] px-2 py-0.5 rounded-full border mb-2',
                    STATUS_STYLES[docStatus] ?? STATUS_STYLES.PENDING
                  )}
                >
                  {docStatus}
                </span>
              )}
              <div className="mt-auto pt-3 flex flex-col gap-2">
                {existing ? (
                  <>
                    <button
                      onClick={() => setViewingDoc(existing)}
                      className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] text-xs font-medium transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                    <button
                      onClick={() => generateDoc({ doc_type: docType, jurisdiction: profile.jurisdiction })}
                      disabled={isThisGenerating}
                      className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-[var(--border-ui)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {isThisGenerating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      {isThisGenerating ? 'Generating…' : 'Regenerate'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => generateDoc({ doc_type: docType, jurisdiction: profile.jurisdiction })}
                    disabled={isThisGenerating}
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {isThisGenerating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating…
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5" />
                        Generate
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {viewingDoc && (
        <DocumentModal
          doc={viewingDoc}
          onClose={() => setViewingDoc(null)}
          onRegenerate={() => {
            generateDoc({ doc_type: viewingDoc.doc_type, jurisdiction: profile.jurisdiction })
            setViewingDoc(null)
          }}
          isRegenerating={isGenerating && generatingVars?.doc_type === viewingDoc.doc_type}
        />
      )}
    </div>
  )
}
