"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { forgotPassword, login, resetPasswordWithCode, verifyResetCode } from '@/lib/api/auth'
import logo from '@/assets/logo.png'
import background from '@/assets/background.png'
import { toast } from 'sonner'
import { getStoredLanguage, setStoredLanguage, t } from '@/lib/i18n'
import { useAuth } from '@/app/provider'

export default function LoginPage() {
  const router = useRouter()
  const { refreshSession } = useAuth()
  const [language, setLanguage] = useState<'fr' | 'en'>(getStoredLanguage())
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [resetStep, setResetStep] = useState<'idle' | 'verify' | 'newPassword'>('idle')
  const [resetEmail, setResetEmail] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  useEffect(() => {
    setLanguage(getStoredLanguage())
  }, [router])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await login(email, password)
      await refreshSession()
      toast.success('Connexion réussie')
      const nextPath = new URLSearchParams(window.location.search).get('next')
      router.push(nextPath && nextPath.startsWith('/') ? nextPath : '/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Identifiants invalides')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    const targetEmail = email.trim()
    if (!targetEmail) {
      toast.error(t('emailLabel', language))
      return
    }

    try {
      setResetLoading(true)
      setResetEmail(targetEmail)
      await forgotPassword(targetEmail)
      setResetStep('verify')
      toast.success(t('codeSentSuccess', language))
    } catch (error: any) {
      toast.error(error.message || 'Unable to send the reset code.')
    } finally {
      setResetLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!resetEmail || !resetCode.trim()) {
      toast.error(t('invalidCode', language))
      return
    }

    try {
      setResetLoading(true)
      await verifyResetCode(resetEmail, resetCode.trim())
      setResetStep('newPassword')
      toast.success(t('codeVerified', language))
    } catch (error: any) {
      toast.error(error.message || t('invalidCode', language))
    } finally {
      setResetLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!resetEmail || !resetCode.trim()) {
      toast.error(t('invalidCode', language))
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('passwordMismatch', language))
      return
    }

    try {
      setResetLoading(true)
      await resetPasswordWithCode(resetEmail, resetCode.trim(), newPassword)
      setResetStep('idle')
      setNewPassword('')
      setConfirmPassword('')
      setResetCode('')
      toast.success(t('passwordResetSuccess', language))
    } catch (error: any) {
      toast.error(error.message || 'Unable to reset the password.')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-7xl overflow-hidden rounded-[30px] border border-sky-100 bg-white shadow-[0_30px_80px_-30px_rgba(37,99,235,0.35)]">
        <section className="relative hidden w-[46%] overflow-hidden bg-slate-950 lg:flex">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-90"
            style={{ backgroundImage: `url(${background.src})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-blue-900/80 to-sky-700/70" />

          <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-12">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
                <Image src={logo} alt="StockDz logo" width={30} height={30} className="object-contain" />
              </div>
              <div>
                <div className="text-2xl font-semibold tracking-tight text-white">StockDz</div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-blue-100/80">Business OS</div>
              </div>
            </div>

            <div className="max-w-md space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-blue-50 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                {t('smartManagement', language)}
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-semibold leading-tight tracking-[-0.04em] text-white xl:text-5xl">
                  {t('allBusinessUnderControl', language)}
                </h1>
                <p className="max-w-sm text-base text-blue-50/85">
                  {t('businessDescription', language)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-blue-50/90 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-white">{t('realTimeInventory', language)}</div>
                  <div className="text-xs text-blue-100/80">{t('realTimeInventoryDescription', language)}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex w-full items-center justify-center bg-white p-5 sm:p-8 lg:w-[54%] lg:p-10 xl:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 ring-1 ring-blue-200">
                  <Image src={logo} alt="StockDz logo" width={24} height={24} className="object-contain" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-slate-900">StockDz</div>
                </div>
              </div>
              <div className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-700">
                {t('loginPageBadge', language)}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-900">{t('loginTitle', language)}</h2>
              <p className="mt-2 text-sm text-slate-500">{t('loginSubtitle', language)}</p>
            </div>

            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">{t('emailLabel', language)}</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailLabel', language)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">{t('passwordLabel', language)}</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('passwordLabel', language)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-11 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="inline-flex items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  {t('rememberMe', language)}
                </label>

                <button
                  type="button"
                  onClick={() => router.push('/forgot-password')}
                  className="font-medium text-blue-600 transition hover:text-blue-700 focus:outline-none focus:underline"
                >
                  {t('forgotPassword', language)}
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-4 py-6 text-base font-semibold text-white shadow-[0_14px_30px_-12px_rgba(37,99,235,0.7)] transition hover:bg-blue-700 focus-visible:ring-4 focus-visible:ring-blue-200"
              >
                <span className="inline-flex items-center gap-2">
                  {loading ? t('loginLoading', language) : t('loginButton', language)}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </span>
              </Button>
            </form>

            {resetStep !== 'idle' && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                {resetStep === 'verify' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900">{t('enterCodeTitle', language)}</h3>
                    <div className="space-y-2">
                      <label htmlFor="resetCode" className="block text-sm font-medium text-slate-700">{t('codeField', language)}</label>
                      <input
                        id="resetCode"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        placeholder="123456"
                      />
                    </div>
                    <Button type="button" onClick={handleVerifyCode} disabled={resetLoading} className="w-full">
                      {resetLoading ? t('sendCodeLoading', language) : t('verifyCode', language)}
                    </Button>
                  </div>
                )}

                {resetStep === 'newPassword' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700">{t('newPasswordLabel', language)}</label>
                      <input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">{t('confirmPasswordLabel', language)}</label>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                    <Button type="button" onClick={handlePasswordReset} disabled={resetLoading} className="w-full">
                      {resetLoading ? t('sendCodeLoading', language) : t('resetPasswordLabel', language)}
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 text-center text-sm text-slate-500">
              {t('noAccount', language)}{' '}
              <button
                type="button"
                onClick={() => router.push('/register')}
                className="font-semibold text-blue-600 transition hover:text-blue-700 focus:outline-none focus:underline"
              >
                {t('createAccount', language)}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

