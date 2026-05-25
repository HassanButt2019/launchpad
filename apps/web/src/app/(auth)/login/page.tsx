'use client'

import { Suspense, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, LoginInput } from '@launchpad/shared'
import { useLogin } from '@/hooks/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Rocket, Shield, Brain, FileText, Map, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

const featureBadges = [
  { icon: <Lock className="w-3.5 h-3.5" />, label: 'Encrypted Idea Vault' },
  { icon: <Brain className="w-3.5 h-3.5" />, label: 'AI Idea Validation' },
  { icon: <FileText className="w-3.5 h-3.5" />, label: 'Startup Docs Hub' },
  { icon: <Map className="w-3.5 h-3.5" />, label: 'Validate → Build → Launch' },
]

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { mutate: login, isPending, error } = useLogin()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('reason') === 'session_expired') {
      toast.warning('Your session expired. Please sign in again.')
    }
  }, [searchParams])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const onSubmit = (data: LoginInput) =>
    login(data, { onSuccess: () => router.push('/dashboard') })

  return (
    <div className="min-h-screen flex overflow-hidden">

      {/* ══════ LEFT PANEL — warm white ══════ */}
      <div className="hidden lg:flex flex-1 flex-col px-16 py-14 bg-[#fafaf8] relative overflow-hidden">

        {/* Subtle warm texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.45]"
          style={{
            backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(249,115,22,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(251,146,60,0.08) 0%, transparent 50%)',
          }}
        />

        {/* Faint dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, #1c1917 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 relative z-10"
        >
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-200">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading text-xl font-bold text-stone-900 tracking-tight">LaunchPad</span>
        </motion.div>

        {/* Hero text — vertically centered */}
        <div className="flex-1 flex flex-col justify-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            <h1 className="font-heading text-[2.8rem] leading-[1.12] font-bold text-stone-900 max-w-lg">
              Turn your startup idea into a{' '}
              <span className="text-orange-500">
                launch-ready business.
              </span>
            </h1>
            <p className="mt-5 text-[var(--text-secondary)] text-[1.05rem] leading-relaxed max-w-md">
              Securely validate your concept, generate founder documents, and follow a clear roadmap from validation to launch.
            </p>
          </motion.div>

          {/* Feature badges */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-wrap gap-2 mt-8"
          >
            {featureBadges.map((b) => (
              <div
                key={b.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-orange-200 bg-orange-50 text-orange-700 text-xs font-medium"
              >
                {b.icon}
                {b.label}
              </div>
            ))}
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-xs text-stone-400 tracking-widest uppercase"
          >
            Validate your idea. Build with clarity. Launch with confidence.
          </motion.p>
        </div>

        {/* Bottom decoration strip */}
        <div className="h-1 w-24 rounded-full bg-gradient-to-r from-orange-400 to-orange-200 relative z-10" />
      </div>

      {/* ══════ RIGHT PANEL — dark charcoal ══════ */}
      <div className="w-full lg:w-[480px] xl:w-[520px] flex items-center justify-center px-6 py-12 bg-[var(--bg-base)] relative z-10">

        {/* Warm glow behind form */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(249,115,22,0.07) 0%, transparent 70%)',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-[400px] z-10"
        >
          {/* Card glow rim */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-orange-500/25 via-orange-400/10 to-transparent blur-sm" />

          <div className="relative rounded-2xl border border-[var(--border-ui)] bg-[var(--bg-input)] backdrop-blur-xl p-8 shadow-2xl">

            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading text-lg font-bold text-[var(--text-primary)]">LaunchPad</span>
            </div>

            <h2 className="font-heading text-2xl font-bold text-[var(--text-primary)] mb-1">Welcome back</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-8">Sign in to your mission control</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1.5 tracking-wide">
                  Email address
                </label>
                <motion.div
                  animate={{
                    boxShadow: focusedField === 'email'
                      ? '0 0 0 1.5px rgba(249,115,22,0.6), 0 0 16px rgba(249,115,22,0.1)'
                      : '0 0 0 0px transparent',
                  }}
                  transition={{ duration: 0.15 }}
                  className="rounded-xl"
                >
                  <input
                    {...register('email')}
                    type="email"
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-strong)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm focus:outline-none focus:border-orange-500/40 placeholder:text-[var(--text-muted)] transition-colors"
                    placeholder="you@startup.com"
                  />
                </motion.div>
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-stone-400 tracking-wide">Password</label>
                  <Link href="/forgot-password" className="text-xs text-orange-400 hover:text-orange-300 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <motion.div
                  animate={{
                    boxShadow: focusedField === 'password'
                      ? '0 0 0 1.5px rgba(249,115,22,0.6), 0 0 16px rgba(249,115,22,0.1)'
                      : '0 0 0 0px transparent',
                  }}
                  transition={{ duration: 0.15 }}
                  className="rounded-xl relative"
                >
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-strong)] rounded-xl px-4 py-3 pr-11 text-[var(--text-primary)] text-sm focus:outline-none focus:border-orange-500/40 placeholder:text-[var(--text-muted)] transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-stone-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </motion.div>
                {errors.password && (
                  <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>
                )}
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    rememberMe ? 'bg-orange-500 border-orange-500' : 'border-white/20 bg-transparent'
                  }`}
                >
                  {rememberMe && (
                    <motion.svg
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none"
                    >
                      <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                  )}
                </button>
                <span className="text-xs text-[var(--text-secondary)]">Remember me for 30 days</span>
              </div>

              {/* Error */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                >
                  Invalid email or password. Please try again.
                </motion.p>
              )}

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isPending}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="relative w-full overflow-hidden rounded-xl py-3 font-semibold text-sm text-white bg-orange-500 hover:bg-orange-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full"
                  whileHover={{ translateX: '200%' }}
                  transition={{ duration: 0.55 }}
                />
                <span className="relative flex items-center justify-center gap-2">
                  {isPending ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                      />
                      Signing in...
                    </>
                  ) : (
                    <>Login to LaunchPad <ArrowRight className="w-4 h-4" /></>
                  )}
                </span>
              </motion.button>
            </form>

            <p className="text-center text-xs text-[var(--text-muted)] mt-6">
              New founder?{' '}
              <Link href="/register" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
                Create your LaunchPad account
              </Link>
            </p>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[var(--text-muted)]">
              <Shield className="w-3 h-3" />
              Your ideas are encrypted and protected.
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}
