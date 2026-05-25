'use client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useDocuments } from '@/hooks/useIdeas'
import { DocumentCard } from '@/components/documents/DocumentCard'
import { DocumentType } from '@launchpad/shared'

const ALL_DOC_TYPES = Object.values(DocumentType)

export default function DocumentsPage() {
  const params = useParams()
  const id = params.id as string

  const { data: documents = [], isLoading } = useDocuments(id)

  // Map existing documents by type for quick lookup
  const docByType = (documents as { doc_type: DocumentType }[]).reduce(
    (acc, doc) => ({ ...acc, [doc.doc_type]: doc }),
    {} as Record<DocumentType, (typeof documents)[0]>
  )

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/ideas/${id}`} className="text-[var(--text-secondary)] hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">Documents</h1>
          <p className="text-[var(--text-secondary)] text-sm">AI-generated startup documents for your idea</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-[var(--bg-surface)] border border-[var(--border-ui)] rounded-xl h-36 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ALL_DOC_TYPES.map((docType) => (
            <DocumentCard
              key={docType}
              docType={docType}
              document={docByType[docType] || null}
              ideaId={id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
