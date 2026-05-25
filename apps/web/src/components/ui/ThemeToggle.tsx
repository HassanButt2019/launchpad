'use client'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/app/providers'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-stone-500 hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  )
}
