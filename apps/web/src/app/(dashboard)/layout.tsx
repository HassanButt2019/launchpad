'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Rocket,
  LayoutDashboard,
  Lightbulb,
  CreditCard,
  ShieldCheck,
  LogOut,
  Plus,
  ChevronRight,
  Bell,
} from 'lucide-react'
import { useLogout, useCurrentUser } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { ApiHealthIndicator } from '@/components/ui/ApiHealthIndicator'
import NewIdeaButton from '@/components/ui/NewIdeaButton'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ideas', label: 'Ideas', icon: Lightbulb },
  { href: '/pricing', label: 'Pricing', icon: CreditCard },
]

function getBreadcrumb(pathname: string): { label: string; href?: string }[] {
  const segments = pathname.split('/').filter(Boolean)
  const crumbs: { label: string; href?: string }[] = []

  if (segments[0] === 'dashboard') {
    crumbs.push({ label: 'Dashboard' })
  } else if (segments[0] === 'pricing') {
    crumbs.push({ label: 'Pricing' })
  } else if (segments[0] === 'ideas') {
    crumbs.push({ label: 'Ideas', href: '/ideas' })
    if (segments[1] === 'new') {
      crumbs.push({ label: 'New Idea' })
    } else if (segments[1]) {
      crumbs.push({ label: 'Idea Detail', href: `/ideas/${segments[1]}` })
      if (segments[2]) {
        const sectionLabel: Record<string, string> = {
          validate: 'Validate',
          documents: 'Documents',
          journey: 'Journey',
          formation: 'Formation',
          chat: 'AI Co-Founder',
        }
        crumbs.push({ label: sectionLabel[segments[2]] ?? segments[2] })
      }
      if (segments[3]) {
        const subLabel: Record<string, string> = {
          wizard: 'Wizard',
          checklist: 'Checklist',
          compliance: 'Compliance',
        }
        crumbs.push({ label: subLabel[segments[3]] ?? segments[3] })
      }
    }
  }
  return crumbs
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { mutate: logout } = useLogout()
  const user = useAuthStore((s) => s.user)
  const { data: currentUser } = useCurrentUser()
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const displayName = user?.full_name || currentUser?.full_name || 'User'
  const displayEmail = user?.email || currentUser?.email || ''
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const breadcrumbs = getBreadcrumb(pathname)

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      {/* Ambient radial gradient */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 0% 100%, var(--ambient-gradient) 0%, transparent 65%)',
        }}
      />

      {/* ── Sidebar ── */}
      <aside
        className="relative z-10 w-[240px] shrink-0 flex flex-col"
        style={{
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-heading text-[15px] font-bold tracking-tight block leading-none"
              style={{ color: 'var(--text-primary)' }}>
              LaunchPad
            </span>
            <span className="text-[10px] leading-none" style={{ color: 'var(--text-muted)' }}>
              Startup Studio
            </span>
          </div>
        </div>

        <div className="mx-5 h-px mb-5" style={{ backgroundColor: 'var(--border-subtle)' }} />

        {/* New Idea CTA */}
        <div className="px-3 mb-4">
          <NewIdeaButton variant="secondary" className="w-full px-4 justify-start" />
        </div>

        <p
          className="px-5 text-[10px] font-semibold uppercase tracking-widest mb-2"
          style={{ color: 'var(--text-muted)' }}
        >
          Workspace
        </p>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'text-orange-500 dark:text-orange-400 bg-orange-500/[0.08] border border-orange-500/[0.12]'
                    : 'hover:bg-[var(--bg-surface-hover)]'
                )}
                style={active ? {} : { color: 'var(--text-muted)' }}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-orange-500" />
                )}
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="w-3 h-3 shrink-0 opacity-50" />}
              </Link>
            )
          })}
        </nav>

        {/* API health */}
        <div className="px-5 pb-3">
          <ApiHealthIndicator />
        </div>

        <div className="px-4 pb-3">
          <div
            className="rounded-xl p-3"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-ui)',
            }}
          >
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p
                className="text-[11px] leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                Your startup ideas and AI analysis are encrypted to keep your work private and protected.
              </p>
            </div>
          </div>
        </div>

        {/* User footer */}
        <div className="px-4 pb-5 mt-2">
          <div className="h-px mb-4" style={{ backgroundColor: 'var(--border-subtle)' }} />
          <a
            href="https://tritechx.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 flex items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-[var(--bg-surface-hover)]"
            style={{
              border: '1px solid var(--border-ui)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <Image
              src="/brand/tritechx-logo.png"
              alt="TritechX logo"
              width={72}
              height={22}
              className="h-auto w-[72px] shrink-0"
            />
            <span
              className="text-[10px] leading-tight"
              style={{ color: 'var(--text-muted)' }}
            >
              Developed by TritechX Technical Team
            </span>
          </a>
          <div
            className="rounded-xl p-3"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-ui)',
            }}
          >
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[12px] font-semibold truncate leading-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {displayName}
                </p>
                <p
                  className="text-[10px] truncate leading-tight"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {displayEmail}
                </p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 text-xs w-full px-2 py-1.5 rounded-lg hover:bg-red-500/[0.06] hover:text-red-500 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header
          className="h-14 shrink-0 flex items-center justify-between px-8 backdrop-blur-sm"
          style={{
            backgroundColor: 'var(--header-bg)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {i > 0 && (
                  <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                )}
                {crumb.href && i < breadcrumbs.length - 1 ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-orange-500 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    style={{
                      color: i === breadcrumbs.length - 1
                        ? 'var(--text-primary)'
                        : 'var(--text-secondary)',
                      fontWeight: i === breadcrumbs.length - 1 ? 500 : 400,
                    }}
                  >
                    {crumb.label}
                  </span>
                )}
              </div>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((open) => !open)}
                className="relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-surface-hover)]"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Open notifications"
                aria-expanded={notificationsOpen}
              >
                <Bell className="w-4 h-4" />
                <span className="absolute right-1.5 top-1.5 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-[var(--header-bg)]" />
              </button>

              {notificationsOpen && (
                <div
                  className="absolute right-0 top-11 w-80 rounded-xl border p-4 shadow-2xl z-50"
                  style={{
                    backgroundColor: 'var(--bg-modal)',
                    borderColor: 'var(--border-ui)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/25 flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Supported regions
                      </p>
                      <p
                        className="text-xs leading-relaxed mt-1"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Currently, the app is fully functional for the USA, Europe, and Dubai.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-[11px] font-bold">
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-6">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  )
}
