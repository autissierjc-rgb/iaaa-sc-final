'use client'

/**
 * IAAA · CopyLinkButton
 *
 * Copies the public card URL to clipboard.
 * Shows "Link copied" feedback for 2s, then resets.
 *
 * Visibility rule:
 *   - is_public = true  → button visible
 *   - is_public = false → button hidden (private cards must not expose a share action)
 *
 * Usage:
 *   <CopyLinkButton slug="career-crossroads-..." isPublic={true} />
 *
 * No social integrations. No og:image. No export.
 * Bloc 7 V1 = Copy link only.
 */

import { useState } from 'react'

interface CopyLinkButtonProps {
  slug:     string
  isPublic: boolean
  className?: string
}

export default function CopyLinkButton({
  slug,
  isPublic,
  className = '',
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  // Private cards — no share action exposed
  if (!isPublic) return null

  async function handleCopy() {
    if (copied) return

    // NEXT_PUBLIC_APP_URL is the canonical public base URL (e.g. https://iaaa.app)
    // Falls back to window.location.origin for local dev only
    const base = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
    const url  = `${base}/sc/${slug}`

    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Fallback for environments where clipboard API is unavailable
      const el = document.createElement('textarea')
      el.value = url
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }

    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? 'Link copied' : 'Copy public link'}
      className={`text-xs font-sans px-4 py-2 rounded-[1px] transition-all duration-150 focus-ring ${className}`}
      style={{
        color:      copied ? 'var(--bg-base)'              : 'var(--text-muted)',
        background: copied ? 'rgba(196,168,130,0.75)'      : 'transparent',
        border:     `1px solid ${copied ? 'transparent' : 'var(--border-gold-subtle)'}`,
      }}
    >
      {copied ? 'Link copied ✓' : 'Copy link'}
    </button>
  )
}
