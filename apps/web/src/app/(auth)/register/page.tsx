'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { registerSchema, RegisterInput } from '@launchpad/shared'
import { useRegister } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Rocket, Shield, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useState } from 'react'

const extendedSchema = registerSchema.extend({
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type ExtendedRegisterInput = z.infer<typeof extendedSchema>

export default function RegisterPage() {
  const router = useRouter()
  const { mutate: doRegister, isPending, error } = useRegister()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExtendedRegisterInput>({ resolver: zodResolver(extendedSchema) })

  const onSubmit = (data: ExtendedRegisterInput) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...rest } = data
    doRegister(rest as RegisterInput, {
      onSuccess: () => router.push('/login?registered=true'),
    })
  }

  const focusRing = (field: string) => ({
    animate: {
      boxShadow: focusedField === field
        ? '0 0 0 1.5px rgba(249,115,22,0.6), 0 0 16px rgba(249,115,22,0.1)'
        : '0 0 0 0px transparent',
    },
    transition: { duration: 0.15 },
  })

  const inputClass = "w-full bg-[var(--bg-surface-hover)] border border-[var(--border-strong)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm focus:outline-none focus:border-orange-500/40 placeholder:text-[var(--text-muted)] transition-colors"

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] px-6 py-12 relative overflow-hidden">

      {/* Warm glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(249,115,22,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[420px] z-10"
      >
        {/* Card glow rim */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-orange-500/25 via-orange-400/10 to-transparent blur-sm" />

        <div className="relative rounded-2xl border border-[var(--border-ui)] bg-[var(--bg-input)] backdrop-blur-xl p-8 shadow-2xl">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-900/40">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading text-xl font-bold text-[var(--text-primary)] tracking-tight">LaunchPad</span>
          </div>

          <h2 className="font-heading text-2xl font-bold text-[var(--text-primary)] mb-1">Create your account</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-7">Start validating your startup ideas today</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Full name */}
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5 tracking-wide">Full name</label>
              <motion.div {...focusRing('full_name')} className="rounded-xl">
                <input
                  {...register('full_name')}
                  type="text"
                  onFocus={() => setFocusedField('full_name')}
                  onBlur={() => setFocusedField(null)}
                  className={inputClass}
                  placeholder="Jane Smith"
                />
              </motion.div>
              {errors.full_name && <p className="text-red-400 text-xs mt-1.5">{errors.full_name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5 tracking-wide">Email address</label>
              <motion.div {...focusRing('email')} className="rounded-xl">
                <input
                  {...register('email')}
                  type="email"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className={inputClass}
                  placeholder="you@startup.com"
                />
              </motion.div>
              {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5 tracking-wide">Password</label>
              <motion.div {...focusRing('password')} className="rounded-xl relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className={`${inputClass} pr-11`}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-stone-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </motion.div>
              {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5 tracking-wide">Confirm password</label>
              <motion.div {...focusRing('confirm')} className="rounded-xl relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirm ? 'text' : 'password'}
                  onFocus={() => setFocusedField('confirm')}
                  onBlur={() => setFocusedField(null)}
                  className={`${inputClass} pr-11`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-stone-300 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </motion.div>
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1.5">{errors.confirmPassword.message}</p>}
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                Registration failed. This email may already be in use.
              </motion.p>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isPending}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="relative w-full overflow-hidden rounded-xl py-3 font-semibold text-sm text-white bg-orange-500 disabled:opacity-60 disabled:cursor-not-allowed"
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
                    Creating account...
                  </>
                ) : (
                  <>Create your LaunchPad account <ArrowRight className="w-4 h-4" /></>
                )}
              </span>
            </motion.button>
          </form>

          <p className="text-center text-xs text-[var(--text-muted)] mt-6">
            Already a founder?{' '}
            <Link href="/login" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[var(--text-muted)]">
            <Shield className="w-3 h-3" />
            Your ideas are encrypted and protected.
          </div>
        </div>
      </motion.div>
    </div>
  )
}
