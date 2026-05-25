'use client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { StartupJourney } from '@/components/journey/StartupJourney'

export default function JourneyPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/ideas/${id}`} className="text-muted hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">Startup Journey</h1>
          <p className="text-muted text-sm">Track your progress from idea to launch</p>
        </div>
      </div>
      <StartupJourney ideaId={id} />
    </div>
  )
}
