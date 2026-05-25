'use client'
import { useState } from 'react'
import {
  FileText,
  BarChart2,
  Code2,
  Search,
  DollarSign,
  Scale,
  Sparkles,
  Eye,
  X,
  MapPin,
  Loader2,
} from 'lucide-react'
import { DocumentType } from '@launchpad/shared'
import { useGenerateDocument, useDocument } from '@/hooks/useIdeas'
import { DocumentEditor } from './DocumentEditor'
import { ResearchProgress } from './ResearchProgress'
import { cn } from '@/lib/utils'

const docTypeConfig: Record<
  DocumentType,
  { label: string; icon: React.ComponentType<{ className?: string }>; description: string }
> = {
  PITCH_DECK:      { label: 'Pitch Deck',      icon: BarChart2, description: 'Investor-ready presentation outline' },
  BUSINESS_PLAN:   { label: 'Business Plan',   icon: FileText,  description: 'Comprehensive business strategy document' },
  MVP_SPEC:        { label: 'MVP Spec',         icon: Code2,     description: 'Minimum viable product specification' },
  MARKET_RESEARCH: { label: 'Market Research', icon: Search,    description: 'Market analysis and competitive landscape' },
  FINANCIAL_MODEL: { label: 'Financial Model', icon: DollarSign,description: 'Revenue projections and cost structure' },
  LEGAL_CHECKLIST: { label: 'Legal Checklist', icon: Scale,     description: 'Jurisdiction-specific legal requirements' },
}

const JURISDICTIONS = [
  { group: 'United States', options: ['Delaware (C-Corp)', 'Wyoming (LLC)', 'California', 'Florida', 'New York', 'Texas'] },
  { group: 'United Kingdom', options: ['England & Wales (Ltd)', 'Scotland'] },
  { group: 'European Union', options: ['Germany (GmbH)', 'Netherlands (BV)', 'Estonia (OÜ / e-Residency)', 'France (SAS)', 'Ireland (Ltd)'] },
  { group: 'Middle East', options: ['UAE – Dubai Mainland', 'UAE – DMCC Free Zone', 'UAE – DIFC', 'UAE – ADGM', 'UAE – IFZA Free Zone', 'Saudi Arabia'] },
  { group: 'Asia Pacific', options: ['Singapore (Pte Ltd)', 'Hong Kong (Ltd)', 'Australia (Pty Ltd)'] },
  { group: 'Other', options: ['Canada (Federal)', 'Cayman Islands (Exempted)', 'BVI (Business Company)'] },
]

const statusConfig: Record<string, string> = {
  draft:      'bg-stone-500/15 text-stone-400',
  generating: 'bg-amber-500/15 text-amber-400',
  ready:      'bg-emerald-500/15 text-emerald-400',
  error:      'bg-red-500/15 text-red-400',
}

interface Props {
  docType: DocumentType
  document: { id: string; status: string; version: number; content?: string } | null
  ideaId: string
}

function JurisdictionPicker({ onConfirm, onClose }: { onConfirm: (j: string) => void; onClose: () => void }) {
  const [selected, setSelected] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--bg-base)] border border-[var(--border-strong)] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-orange-500/15 border border-orange-500/25 flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div>
              <p className="font-heading font-semibold text-[var(--text-primary)] text-sm">Choose Jurisdiction</p>
              <p className="text-[var(--text-muted)] text-[11px]">Legal requirements vary by country & entity type</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-[var(--bg-surface-hover)] flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="px-5 py-4 max-h-80 overflow-y-auto space-y-4">
          {JURISDICTIONS.map((group) => (
            <div key={group.group}>
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">{group.group}</p>
              <div className="flex flex-wrap gap-1.5">
                {group.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSelected(opt)}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-lg border transition-all',
                      selected === opt
                        ? 'bg-orange-500/15 border-orange-500/40 text-orange-300'
                        : 'bg-[var(--bg-input)] border-[var(--border-ui)] text-[var(--text-secondary)] hover:text-stone-200 hover:border-white/20'
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-[var(--border-subtle)]">
          <button
            onClick={() => selected && onConfirm(selected)}
            disabled={!selected}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-500/90 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors shadow-md shadow-orange-500/20"
          >
            <Sparkles className="w-4 h-4" />
            Generate for {selected || '…'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function DocumentCard({ docType, document, ideaId }: Props) {
  const [editorOpen, setEditorOpen] = useState(false)
  const [jurisdictionPickerOpen, setJurisdictionPickerOpen] = useState(false)
  const [researchOpen, setResearchOpen] = useState(false)
  const { mutate: generate, isPending } = useGenerateDocument(ideaId)
  const { label, icon: Icon, description } = docTypeConfig[docType]
  const { data: fullDocument, isLoading: isLoadingContent } = useDocument(
    ideaId,
    editorOpen && document ? document.id : null
  )

  const isMarketResearch = docType === DocumentType.MARKET_RESEARCH

  const handleGenerate = () => {
    if (isMarketResearch) {
      setResearchOpen(true)
    } else if (docType === DocumentType.LEGAL_CHECKLIST) {
      setJurisdictionPickerOpen(true)
    } else {
      generate(docType)
    }
  }

  const handleJurisdictionConfirm = (jurisdiction: string) => {
    setJurisdictionPickerOpen(false)
    generate({ docType, jurisdiction })
  }

  return (
    <>
      <div className="relative bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-xl p-5 flex flex-col gap-4 hover:border-white/[0.12] transition-colors">
        {isPending && (
          <div className="absolute inset-0 bg-[var(--bg-surface)]/80 backdrop-blur-[2px] rounded-xl flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-orange-400 text-xs font-medium">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating…
            </div>
          </div>
        )}
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Icon className="w-4 h-4 text-orange-400" />
          </div>
          {document && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]">
              v{document.version}
            </span>
          )}
        </div>
        <div>
          <h3 className="font-heading font-semibold text-[var(--text-primary)] text-sm mb-1">{label}</h3>
          <p className="text-[var(--text-secondary)] text-xs leading-relaxed">{description}</p>
        </div>
        {document && (
          <span className={`self-start text-[11px] font-medium px-2 py-0.5 rounded-full ${statusConfig[document.status] ?? statusConfig.draft}`}>
            {document.status}
          </span>
        )}
        <div className="flex gap-2 mt-auto">
          {document ? (
            <>
              <button
                onClick={() => setEditorOpen(true)}
                disabled={isLoadingContent}
                className="flex-1 flex items-center justify-center gap-1.5 border border-[var(--border-strong)] hover:border-orange-500/30 text-[var(--text-secondary)] hover:text-white text-xs font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Eye className="w-3.5 h-3.5" />
                {isLoadingContent ? 'Loading…' : 'View'}
              </button>
              <button
                onClick={handleGenerate}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-1.5 border border-[var(--border-strong)] hover:border-orange-500/30 text-[var(--text-secondary)] hover:text-white text-xs font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Regenerate
              </button>
            </>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isPending ? 'Generating…' : isMarketResearch ? 'Research with AI' : 'Generate'}
            </button>
          )}
        </div>
      </div>

      {jurisdictionPickerOpen && (
        <JurisdictionPicker
          onConfirm={handleJurisdictionConfirm}
          onClose={() => setJurisdictionPickerOpen(false)}
        />
      )}

      {editorOpen && document && fullDocument && (
        <DocumentEditor
          document={fullDocument}
          ideaId={ideaId}
          docType={docType}
          onClose={() => setEditorOpen(false)}
        />
      )}

      {researchOpen && (
        <ResearchProgress
          ideaId={ideaId}
          onClose={() => setResearchOpen(false)}
        />
      )}
    </>
  )
}
