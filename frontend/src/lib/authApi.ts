/**
 * IAAA · Bloc 6A · Auth API client
 *
 * Thin wrappers around /api/auth/* backend routes.
 * All calls are relative — Nginx proxies /api/* in all environments.
 * Credentials mode "include" is required for httpOnly cookie exchange.
 *
 * Returns typed responses or throws with a user-readable message.
 */

export interface UserData {
  id:       string
  email:    string
  tier:     string
  is_admin: boolean
  // email_verified excluded: not implemented in V1
}

async function apiCall<T>(url: string, options: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',   // required for httpOnly cookie exchange
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `Request failed (${res.status})`)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function registerUser(email: string, password: string): Promise<UserData> {
  return apiCall<UserData>('/api/auth/register', {
    method: 'POST',
    body:   JSON.stringify({ email, password }),
  })
}

export async function loginUser(email: string, password: string): Promise<UserData> {
  return apiCall<UserData>('/api/auth/login', {
    method: 'POST',
    body:   JSON.stringify({ email, password }),
  })
}

export async function logoutUser(): Promise<void> {
  return apiCall<void>('/api/auth/logout', { method: 'POST' })
}

export async function refreshToken(): Promise<void> {
  return apiCall<void>('/api/auth/refresh', { method: 'POST' })
}

export async function getMe(): Promise<UserData> {
  return apiCall<UserData>('/api/auth/me', { method: 'GET' })
}
