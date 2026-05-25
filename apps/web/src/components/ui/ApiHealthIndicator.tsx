'use client'

import { useEffect, useState } from 'react'

type Status = 'ok' | 'degraded' | 'checking'

export function ApiHealthIndicator() {
  const [status, setStatus] = useState<Status>('checking')

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/health`,
          { cache: 'no-store' }
        )
        const data = await res.json()
        setStatus(data.status === 'ok' ? 'ok' : 'degraded')
      } catch {
        setStatus('degraded')
      }
    }
    check()
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [])

  if (status === 'checking') return null

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === 'ok' ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
        }`}
      />
      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
        {status === 'ok' ? 'All systems operational' : 'AI service degraded'}
      </span>
    </div>
  )
}
