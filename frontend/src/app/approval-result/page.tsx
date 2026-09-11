'use client'

import Image from 'next/image'
import { CheckCircle2, Home, XCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import logo from '@/assets/logo.png'

export default function ApprovalResultPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">Loading...</div>}>
      <ApprovalResult />
    </Suspense>
  )
}

function ApprovalResult() {
  const searchParams = useSearchParams()
  const approved = searchParams.get('decision') === 'approve'
  const email = searchParams.get('email') || 'the user'
  const emailSent = searchParams.get('emailSent') !== 'false'

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_24px_70px_-32px_rgba(15,23,42,0.35)] sm:p-12">
        <div className="mx-auto mb-5 flex items-center justify-center gap-3">
          <Image src={logo} alt="StockDZ" width={44} height={44} className="rounded-xl object-contain" />
          <div className="text-left">
            <div className="text-xl font-bold tracking-tight text-slate-900">StockDZ</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Business OS</div>
          </div>
        </div>

        <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${approved ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
          {approved ? <CheckCircle2 className="h-11 w-11" strokeWidth={2} /> : <XCircle className="h-11 w-11" strokeWidth={2} />}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{approved ? 'Account Approved' : 'Account Rejected'}</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          {approved ? `The account for ${email} has been successfully approved.` : `The account for ${email} has been rejected.`}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {approved
            ? (emailSent ? 'A confirmation email has been sent to the user.' : 'The account was approved, but the confirmation email could not be delivered.')
            : (emailSent ? 'A notification email has been sent to the user.' : 'The account was rejected, but the notification email could not be delivered.')}
        </p>
        <Button type="button" onClick={() => { window.location.href = '/login' }} className="mt-8 w-full rounded-xl bg-blue-600 py-6 text-base font-semibold text-white hover:bg-blue-700">
          <Home className="mr-2 h-4 w-4" />
          {approved ? 'Go to StockDZ Login' : 'Return to StockDZ Login'}
        </Button>
      </section>
    </main>
  )
}
