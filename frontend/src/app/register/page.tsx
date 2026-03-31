'use client'

/**
 * IAAA · /register
 *
 * Bloc 6A. Email / password registration.
 * No email verification. Direct access after register.
 * On success: backend sets cookies, redirect to dashboard.
 */

import { useState, FormEvent } from 'react'
import { useRouter }           from 'next/navigation'
import Link                    from 'next/link'
import { registerUser }        from '@/lib/authApi'

export default function RegisterPage() {
  const router = useRouter()

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
      await registerUser(email, password)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: 'var(--bg-base)' }}>

      <div className="w-full max-w-sm">

        <Link href="/" className="block text-center mb-10"
          style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem',
            letterSpacing: '0.22em', color: 'var(--text-muted)', fontWeight: 400, textTransform: 'uppercase' }}>
          IAAA
        </Link>

        <div className="rounded-[2px] px-7 py-8"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-gold-subtle)' }}>

          <h1 className="mb-2" style={{ fontFamily: 'var(--font-cormorant)',
            fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 400 }}>
            Create account
          </h1>
          <p className="mb-6 text-xs font-sans" style={{ color: 'var(--text-muted)', fontWeight: 300 }}>
            5 free Situation Cards per month.
          </p>

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
                <span className="ml-2 normal-case" style={{ opacity: 0.5, letterSpacing: 0 }}>
                  min 8 characters
                </span>
              </label>
              <input id="password" type="password" required minLength={8} autoComplete="new-password"
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
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-[0.65rem] font-sans leading-relaxed"
          style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
          By creating an account you accept the Terms of Service.
        </p>

        <p className="mt-4 text-center text-xs font-sans" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--gold)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
