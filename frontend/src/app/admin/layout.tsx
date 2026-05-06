/**
 * IAAA · Admin 1 · Admin layout
 *
 * Shared shell for all /admin/* pages.
 * Server component — fetches /api/auth/me to verify is_admin.
 * Redirects to / if not admin (second line of defense after middleware).
 * Middleware handles unauthenticated. This handles authenticated non-admins.
 */

import { redirect } from 'next/navigation'
import { serverFetch } from '@/lib/serverApi'
import Link from 'next/link'

async function getMe() {
  try {
    const res = await serverFetch('/api/auth/me')
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getMe()

  // Server-side admin guard — middleware blocks unauthenticated,
  // this blocks authenticated non-admins.
  if (!user || !user.is_admin) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Top bar */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold tracking-widest text-gray-400 uppercase">
              IAAA Admin
            </span>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/admin"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/users"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Users
              </Link>
              <Link
                href="/admin/cockpit"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Cockpit
              </Link>
              <Link
                href="/admin/ideas"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Ideas Box
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">{user.email}</span>
            <Link
              href="/dashboard"
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              ← App
            </Link>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
