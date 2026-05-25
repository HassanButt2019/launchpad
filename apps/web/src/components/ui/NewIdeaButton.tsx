'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { useIdeas } from '@/hooks/useIdeas'
import { useAuthStore } from '@/store/auth'
import UpgradeModal from './UpgradeModal'
import { cn } from '@/lib/utils'

interface NewIdeaButtonProps {
  variant?: 'primary' | 'secondary'
  className?: string
  label?: string
}

const FREE_IDEA_LIMIT = 1

export default function NewIdeaButton({
  variant = 'primary',
  className,
  label = 'New Idea',
}: NewIdeaButtonProps) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const { data: ideas = [] } = useIdeas()
  const [showUpgrade, setShowUpgrade] = useState(false)

  function handleClick() {
    const tier = user?.subscription_tier ?? 'validate'
    const isBlocked = tier === 'validate' && ideas.length >= FREE_IDEA_LIMIT
    if (isBlocked) {
      setShowUpgrade(true)
    } else {
      router.push('/ideas/new')
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={cn(
          'inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors',
          variant === 'primary'
            ? 'bg-orange-500 hover:bg-orange-500/90 text-white shadow-lg shadow-orange-500/25'
            : 'bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 hover:border-orange-500/40 text-orange-400',
          className,
        )}
      >
        <Plus className="w-4 h-4" />
        {label}
      </button>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </>
  )
}
