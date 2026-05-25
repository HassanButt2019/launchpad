'use client'
import { motion } from 'framer-motion'
import { ValidationReport } from '@launchpad/shared'

interface Props {
  report: ValidationReport
  size?: 'sm' | 'md' | 'lg'
}

export function ValidationScore({ report, size = 'lg' }: Props) {
  const sizes = { sm: 80, md: 120, lg: 160 }
  const dim = sizes[size]
  const r = dim / 2 - 10
  const circ = 2 * Math.PI * r
  const offset = circ - (report.score / 100) * circ
  const color =
    report.score >= 71 ? '#22c55e' : report.score >= 41 ? '#f59e0b' : '#ef4444'
  const label =
    report.score >= 71 ? 'Strong' : report.score >= 41 ? 'Promising' : 'Needs Work'

  const fontSize =
    size === 'lg' ? 32 : size === 'md' ? 24 : 18

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
          />
          <motion.circle
            cx={dim / 2}
            cy={dim / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-heading font-bold text-[var(--text-primary)]"
            style={{ fontSize }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {report.score}
          </motion.span>
          <span className="text-muted text-xs">/100</span>
        </div>
      </div>
      <span className="font-medium text-sm" style={{ color }}>
        {label}
      </span>
    </div>
  )
}
