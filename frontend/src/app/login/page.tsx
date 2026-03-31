'use client'
export const dynamic = 'force-dynamic'

/**
 * IAAA Â· /login
 *
 * Bloc 6A. Email / password login.
 * On success: backend sets httpOnly cookies, frontend redirects to dashboard
 * (or the ?from= URL the middleware stored).
 *
 * No JWT decoding in the frontend. Cookie is set by the backend.
 */

import { useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { loginUser } from '@/lib/authApi'

function LoginPageInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const from         = searchParams.get('from') ?? '/dashboard'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (loading) return
    setError(null)
    setLoading(true)

    try {
      await loginUser(email, password)
      router.push(from)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: 'var(--bg-base)' }}>

      <div className="w-full max-w-sm">

        {/* Logo */}
        <Link href="/" className="block text-center mb-10"
          style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem',
            letterSpacing: '0.22em', color: 'var(--text-muted)', fontWeight: 400, textTransform: 'uppercase' }}>
          IAAA
        </Link>

        <div className="rounded-[2px] px-7 py-8"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-gold-subtle)' }}>

          <h1 className="mb-6" style={{ fontFamily: 'var(--font-cormorant)',
            fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 400 }}>
            Sign in
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="label-eyebrow block mb-1.5" htmlFor="email"
                style={{ opacity: 0.5, fontSize: '0.6rem' }}>
                Email
              </label>
              <input id="email" type="email" required autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 text-sm font-sans rounded-[1px] focus-ring"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-gold-subtle)',
                  color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            <div>
              <label className="label-eyebrow block mb-1.5" htmlFor="password"
                style={{ opacity: 0.5, fontSize: '0.6rem' }}>
                Password
              </label>
              <input id="password" type="password" required autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 text-sm font-sans rounded-[1px] focus-ring"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-gold-subtle)',
                  color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            {error && (
              <p className="text-xs font-sans" style={{ color: 'rgba(196,106,106,0.8)' }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="mt-2 py-2.5 text-sm font-sans tracking-[0.06em] uppercase rounded-[1px]
                transition-opacity duration-150 disabled:opacity-40"
              style={{ background: 'var(--gold)', color: 'var(--bg-base)', fontWeight: 500 }}>
              {loading ? 'Signing inâ€¦' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs font-sans" style={{ color: 'var(--text-muted)' }}>
          No account?{' '}
          <Link href="/register" style={{ color: 'var(--gold)' }}>Create one</Link>
        </p>
      </div>
    </div>
  )
}


export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  )
}


