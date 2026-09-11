"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowRight, Building2, Eye, EyeOff, Lock, Mail, Phone, ShieldCheck, Sparkles, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { register } from '@/lib/api/auth'
import { toast } from 'sonner'
import logo from '@/assets/logo.png'
import background from '@/assets/background.png'
import { getStoredLanguage, t } from '@/lib/i18n'

export default function RegisterPage() {
  const router = useRouter()
  const [language, setLanguage] = useState<'fr' | 'en'>(getStoredLanguage())
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    setLanguage(getStoredLanguage())
  }, [router])

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.firstName.trim() || !form.lastName.trim() || !form.companyName.trim()) {
      toast.error('Please fill in your name and company name.')
      return
    }

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters long.')
      return
    }

    setLoading(true)
    try {
      const result = await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        companyName: form.companyName.trim(),
        phone: form.phone.trim() || undefined,
      })

      setSuccessMessage(result.message || 'Your account was created successfully. It is awaiting approval.')
      setRegistered(true)
      toast.success('Registration received. Waiting for approval.')
    } catch (error: any) {
      toast.error(error.message || 'Impossible de créer le compte')
    } finally {
      setLoading(false)
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
                  <div className="font-semibold text-white">{t('createYourCompany', language)}</div>
                  <div className="text-xs text-blue-100/80">{t('configureEnvironment', language)}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex w-full items-center justify-center bg-white p-5 sm:p-8 lg:w-[54%] lg:p-10 xl:p-12">
          <div className="w-full max-w-lg">
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
                {t('registerBadge', language)}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-900">{t('registerTitle', language)}</h2>
              <p className="mt-2 text-sm text-slate-500">{t('registerSubtitle', language)}</p>
            </div>

            {registered ? (
              <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-900">
                <div className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Pending
                </div>
                <h3 className="text-xl font-semibold text-emerald-900">{t('registerBadge', language)}</h3>
                <p>{successMessage}</p>
                <p className="text-emerald-800/80">A validation email was sent to the StockDz administrator. You can access the dashboard once your account is approved.</p>
                <Button type="button" onClick={() => router.push('/login')} className="w-full">Back to login</Button>
              </div>
            ) : (
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">Nom</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input id="firstName" value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} placeholder="Votre nom" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">Prénom</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input id="lastName" value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} placeholder="Votre prénom" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="companyName" className="block text-sm font-medium text-slate-700">Nom de l&apos;entreprise</label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input id="companyName" value={form.companyName} onChange={(e) => handleChange('companyName', e.target.value)} placeholder="Nom de votre entreprise" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">Adresse e-mail</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input id="email" type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="votre@email.com" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" autoComplete="email" />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Téléphone</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input id="phone" type="tel" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="+213 555 123 456" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" autoComplete="tel" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">Mot de passe</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input id="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => handleChange('password', e.target.value)} placeholder="Mot de passe" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-11 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" autoComplete="new-password" />
                    <button type="button" aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} onClick={() => setShowPassword((prev) => !prev)} className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">Confirmer le mot de passe</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)} placeholder="Confirmer" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-11 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" autoComplete="new-password" />
                    <button type="button" aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} onClick={() => setShowConfirmPassword((prev) => !prev)} className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200">
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 px-4 py-6 text-base font-semibold text-white shadow-[0_14px_30px_-12px_rgba(37,99,235,0.7)] transition hover:bg-blue-700 focus-visible:ring-4 focus-visible:ring-blue-200">
                <span className="inline-flex items-center gap-2">
                  {loading ? 'Création...' : 'Créer mon compte'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </span>
              </Button>
            </form>
            )}

            <div className="mt-8 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <button type="button" onClick={() => router.push('/login')} className="font-semibold text-blue-600 transition hover:text-blue-700 focus:outline-none focus:underline">
                Sign in
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

