'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { forgotPassword, resetPasswordWithCode, verifyResetCode } from '@/lib/api/auth'
import { getStoredLanguage, setStoredLanguage, t } from '@/lib/i18n'
import logo from '@/assets/logo.png'
import background from '@/assets/background.png'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">Loading...</div>}>
      <ForgotPasswordForm />
    </Suspense>
  )
}

function ForgotPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [language, setLanguage] = useState<'fr' | 'en'>(getStoredLanguage())
  const [step, setStep] = useState<'email' | 'code' | 'password' | 'success'>('email')
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [codeVerified, setCodeVerified] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = getStoredLanguage()
    setLanguage(stored)
    setStoredLanguage(stored)
  }, [])

  const currentTitle = useMemo(() => {
    if (step === 'email') return t('forgotPasswordTitle', language)
    if (step === 'code') return t('enterVerificationCode', language)
    if (step === 'password') return t('createNewPassword', language)
    return t('passwordResetSuccessfully', language)
  }, [step, language])

  const handleSendCode = async () => { 
    const normalized = email.trim()
    if (!normalized) {
      toast.error(t('emailLabel', language))
      return
    }

    try {
      setLoading(true)
      await forgotPassword(normalized, language)
      setStep('code')
      toast.success(t('codeSentSuccess', language))
    } catch (error: any) {
      toast.error(error.message || 'Unable to send reset code.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    const normalizedCode = code.trim()
    if (!normalizedCode || normalizedCode.length !== 6) {
      toast.error(t('invalidVerificationCode', language))
      return
    }

    try {
      setLoading(true)
      await verifyResetCode(email.trim(), normalizedCode, language)
      setCodeVerified(true)
      setStep('password')
      toast.success(t('codeVerified', language))
    } catch (error: any) {
      const rawMessage = String(error?.message || '').toLowerCase()
      const message = rawMessage.includes('expired')
        ? t('verificationCodeExpired', language)
        : t('invalidVerificationCode', language)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    const normalizedCode = code.trim()
    if (!normalizedCode || normalizedCode.length !== 6) {
      toast.error(t('invalidCode', language))
      return
    }

    if (password.length < 8) {
      toast.error(language === 'fr' ? 'Le mot de passe doit contenir au moins 8 caractères.' : 'Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      toast.error(t('passwordMismatch', language))
      return
    }

    try {
      setLoading(true)
      await resetPasswordWithCode(email.trim(), normalizedCode, password, language)
      setStep('success')
      setPassword('')
      setConfirmPassword('')
      setCode('')
      toast.success(t('passwordResetSuccess', language))
    } catch (error: any) {
      toast.error(error.message || 'Unable to reset the password.')
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    if (step === 'email') {
      return (
        <div className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-700">{t('emailLabel', language)}</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailLabel', language)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>
          <Button type="button" onClick={handleSendCode} disabled={loading} className="w-full rounded-xl bg-blue-600 px-4 py-6 text-base font-semibold text-white shadow-[0_14px_30px_-12px_rgba(37,99,235,0.7)] transition hover:bg-blue-700">
            <span className="inline-flex items-center gap-2">
              {loading ? t('sendCodeLoading', language) : t('sendVerificationCode', language)}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </span>
          </Button>
        </div>
      )
    }

    if (step === 'code') {
      return (
        <div className="space-y-5">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
            {t('verificationSubtitle', language)}
          </div>
          <div className="space-y-2">
            <label htmlFor="verify-code" className="block text-sm font-medium text-slate-700">{t('codeField', language)}</label>
            <input
              id="verify-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" onClick={handleVerifyCode} disabled={loading} className="flex-1 rounded-xl bg-blue-600 px-4 py-5 font-semibold text-white hover:bg-blue-700">
              {loading ? t('sendCodeLoading', language) : t('verifyCode', language)}
            </Button>
            <Button type="button" variant="outline" onClick={handleSendCode} disabled={loading} className="flex-1 rounded-xl border-slate-200 bg-white px-4 py-5 font-semibold text-slate-700 hover:bg-slate-50">
              {loading ? t('sendCodeLoading', language) : t('resendCode', language)}
            </Button>
          </div>
        </div>
      )
    }

    if (step === 'password') {
      return (
        <div className="space-y-5">
          {!codeVerified && <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">{t('invalidVerificationCode', language)}</div>}
          <div className="space-y-2">
            <label htmlFor="new-password" className="block text-sm font-medium text-slate-700">{t('newPassword', language)}</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700">{t('confirmNewPassword', language)}</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
              <button type="button" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'} onClick={() => setShowConfirmPassword((visible) => !visible)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="button" onClick={handleResetPassword} disabled={loading} className="w-full rounded-xl bg-blue-600 px-4 py-6 text-base font-semibold text-white shadow-[0_14px_30px_-12px_rgba(37,99,235,0.7)] transition hover:bg-blue-700">
            {loading ? t('sendCodeLoading', language) : t('resetPasswordLabel', language)}
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div>
          <h3 className="text-2xl font-semibold text-slate-900">{t('passwordResetSuccessfully', language)}</h3>
          <p className="mt-2 text-sm text-slate-600">{language === 'fr' ? 'Vous pouvez maintenant vous reconnecter.' : 'You can now continue with login.'}</p>
        </div>
        <Button type="button" onClick={() => router.push('/login')} className="w-full rounded-xl bg-blue-600 px-4 py-6 text-base font-semibold text-white hover:bg-blue-700">
          {t('backToLogin', language)}
        </Button>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-7xl overflow-hidden rounded-[30px] border border-sky-100 bg-white shadow-[0_30px_80px_-30px_rgba(37,99,235,0.35)]">
        <section className="relative hidden w-[46%] overflow-hidden bg-slate-950 lg:flex">
          <div className="absolute inset-0 bg-cover bg-center opacity-90" style={{ backgroundImage: `url(${background.src})` }} />
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
                <h1 className="text-4xl font-semibold leading-tight tracking-[-0.04em] text-white xl:text-5xl">{t('allBusinessUnderControl', language)}</h1>
                <p className="max-w-sm text-base text-blue-50/85">{t('businessDescription', language)}</p>
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
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-900">{currentTitle}</h2>
              <p className="mt-2 text-sm text-slate-500">
                {step === 'email' && t('forgotPasswordSubtitle', language)}
                {step === 'code' && t('verificationSubtitle', language)}
                {step === 'password' && (language === 'fr' ? 'Choisissez un nouveau mot de passe pour sécuriser votre compte.' : 'Choose a new password to secure your account.')}
                {step === 'success' && (language === 'fr' ? 'Votre mot de passe a été réinitialisé avec succès.' : 'Your password has been reset successfully.')}
              </p>
            </div>

            {renderStepContent()}

            <div className="mt-8 text-center text-sm text-slate-500">
              <button type="button" onClick={() => router.push('/login')} className="font-semibold text-blue-600 transition hover:text-blue-700 focus:outline-none focus:underline">
                {t('backToLogin', language)}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
