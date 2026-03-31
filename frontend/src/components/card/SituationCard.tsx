'use client'

/**
 * IAAA · SituationCard V1 — final
 *
 * 2-level reading structure:
 *   Level 1 (always visible): Signal · Insight · Title · Main Vulnerability · Trajectories
 *   Level 2 (expandable):     System composition (forces · tensions · constraints · uncertainty)
 *
 * Three cognitive blocks:
 *   SITUATION  — Signal · Insight · Title · Objective · [Level 2 expandable]
 *   RISK       — Main vulnerability · Decision Radar · Index
 *   FUTURE     — Trajectories · Key signal · Reflection · Actions
 *
 * Ephemeral fields (only on /generate): insight, vulnerabilityIndex, vulnerabilityStatus,
 *   vulnerabilityFor, decisionDimensions.
 * Card degrades gracefully on /sc/[slug] where these are absent.
 */

import { useState }    from 'react'
import type { SituationCard } from '@/types/index'
import RadarChart      from './RadarChart'
import { Compass, AlertTriangle, Activity, Navigation, Search } from 'lucide-react'

interface DecisionDimensions {
  reversibility:   string
  systemic_impact: string
  urgency:         string
  uncertainty:     string
}

interface SituationCardProps {
  card: SituationCard

  // Ephemeral — available on /generate only
  insight?:             string
  vulnerabilityIndex?:  number
  vulnerabilityStatus?: string
  vulnerabilityFor?:    string
  decisionDimensions?:  DecisionDimensions

  // Intention — maïeutisée, shown in Cap above Surveiller
  intention?: string | null

  // Slots
  actions?: React.ReactNode
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Divider() {
  return (
    <div style={{ height: '1px', background: 'var(--border-gold-subtle)' }} />
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="label-eyebrow"
      style={{ fontSize: '0.56rem', opacity: 0.4, letterSpacing: '0.14em' }}
    >
      {children}
    </p>
  )
}

function ItemList({
  label,
  items,
  accentColor,
}: {
  label:        string
  items:        string[]
  accentColor?: string
}) {
  if (!items?.length) return null
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <ul className="mt-1.5 flex flex-col gap-1">
        {items.map((item, i) => (
          <li
            key={i}
            className="text-xs leading-relaxed flex items-start gap-1.5"
            style={{ color: 'var(--text-secondary)', fontWeight: 300 }}
          >
            <span style={{ color: accentColor ?? 'var(--gold-dim)', marginTop: '0.1rem', flexShrink: 0 }}>·</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SituationCard({
  card,
  insight,
  vulnerabilityIndex,
  vulnerabilityStatus,
  vulnerabilityFor,
  decisionDimensions,
  actions,
  intention,
}: SituationCardProps) {
  const [level2Open, setLevel2Open] = useState(false)

  const hasRadar = decisionDimensions && vulnerabilityIndex !== undefined && vulnerabilityStatus

  // Key signal: first uncertainty item, fallback to first tension
  const keySignal = card.uncertainty?.[0] ?? card.tensions?.[0] ?? null

  // Parse trajectory label from "Stabilization — ..." format
  function parseTrajectory(t: string): { label: string; text: string } {
    const sep = t.indexOf(' — ')
    if (sep === -1) return { label: '', text: t }
    return { label: t.slice(0, sep), text: t.slice(sep + 3) }
  }

  const TRAJECTORY_COLORS: Record<string, string> = {
    Stabilization:  'rgba(107,158,120,0.8)',
    Escalation:     'rgba(196,130,90,0.8)',
    'Regime Shift': 'rgba(184,92,92,0.8)',
  }

  return (
    <article
      aria-label={`Situation Card: ${card.title}`}
      className="rounded-[2px] overflow-hidden"
      style={{
        background: 'var(--bg-surface)',
        border:     '1px solid var(--border-gold-medium)',
        maxWidth:   '680px',
        margin:     '0 auto',
      }}
    >

      {/* ── Header V2 ────────────────────────────────────────────────────────── */}
      <div
        className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-3"
        style={{
          background:   'linear-gradient(135deg, #1A2E5A 0%, #2A4A88 100%)',
          borderBottom: '1px solid rgba(200,184,128,0.15)',
        }}
      >
        {/* Left — logo + titles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          {/* Animated star logo */}
          <div style={{ flexShrink: 0, animation: 'wheelDrift 26s ease-in-out infinite', transformOrigin: '50% 50%' }}>
            <svg width="40" height="40" viewBox="0 0 48 48">
              <defs><radialGradient id="ngv2" cx="50%" cy="38%" r="62%"><stop offset="0%" stopColor="#2A4A88"/><stop offset="100%" stopColor="#1A2E5A"/></radialGradient></defs>
              <circle cx="24" cy="24" r="22.5" fill="none" stroke="#B8911A" strokeWidth="1.2" strokeDasharray="1.9,1.5"/>
              <circle cx="24" cy="24" r="21.5" fill="url(#ngv2)"/>
              <line x1="24" y1="4.5" x2="24" y2="24" stroke="#E8C84A" strokeWidth="2.8" strokeLinecap="round"/>
              <line x1="40" y1="8" x2="24" y2="24" stroke="#E8C84A" strokeWidth="2.1" strokeLinecap="round"/>
              <line x1="43.5" y1="24" x2="24" y2="24" stroke="#E8C84A" strokeWidth="2.8" strokeLinecap="round"/>
              <line x1="40" y1="40" x2="24" y2="24" stroke="#E8C84A" strokeWidth="2.1" strokeLinecap="round"/>
              <line x1="24" y1="43.5" x2="24" y2="24" stroke="#E8C84A" strokeWidth="2.8" strokeLinecap="round"/>
              <line x1="8" y1="40" x2="24" y2="24" stroke="#E8C84A" strokeWidth="2.1" strokeLinecap="round"/>
              <line x1="4.5" y1="24" x2="24" y2="24" stroke="#E8C84A" strokeWidth="2.8" strokeLinecap="round"/>
              <line x1="8" y1="8" x2="24" y2="24" stroke="#E8C84A" strokeWidth="2.1" strokeLinecap="round"/>
              <circle cx="24" cy="24" r="3.5" fill="#D4A860" stroke="#A87830" strokeWidth="0.8"/>
            </svg>
          </div>
          {/* Text stack */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
            <span style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '0.44rem', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              powered by IAAA+
            </span>
            <span style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: 'clamp(1rem, 3.5vw, 1.25rem)', color: '#E8C84A', letterSpacing: '0.12em', fontWeight: 500, lineHeight: 1.1 }}>
              SITUATION CARD
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
              <span style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '0.52rem', color: 'rgba(232,200,128,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {card.title.split('—')[0]?.trim() || card.title}
              </span>
              {card.title.includes('—') && (
                <>
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem' }}>—</span>
                  <span style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '0.75rem', color: '#fff', letterSpacing: '0.04em', fontWeight: 500 }}>
                    {card.title.split('—')[1]?.trim()}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right — Vigilance badge + status */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0 }}>
          {vulnerabilityIndex !== undefined && (
            <div style={{
              background:   'rgba(200,149,26,0.16)',
              border:       '1.5px solid rgba(200,149,26,0.6)',
              borderRadius: '20px',
              padding:      '5px 12px 5px 9px',
              display:      'flex',
              alignItems:   'center',
              gap:          '7px',
            }}>
              {/* Mini wheel */}
              <svg width="20" height="20" viewBox="0 0 28 28">
                <circle cx="14" cy="14" r="13" fill="none" stroke="#E8C84A" strokeWidth="0.8" strokeDasharray="1.5,1.2"/>
                <circle cx="14" cy="14" r="12" fill="rgba(200,149,26,0.1)"/>
                {[0,-45,-90,45,90,135,180,-135].map((deg, i) => {
                  const r = (deg * Math.PI) / 180
                  const isCard = i % 2 === 0
                  return <line key={i} x1="14" y1="14" x2={14 + 11 * Math.cos(r)} y2={14 + 11 * Math.sin(r)} stroke="#E8C84A" strokeWidth={isCard ? '1.8' : '1.2'} strokeLinecap="round"/>
                })}
                <circle cx="14" cy="14" r="2.5" fill="#D4A860"/>
              </svg>
              <div>
                <div style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '0.7rem', color: '#F5D070', fontWeight: 500, letterSpacing: '0.05em' }}>
                  {vulnerabilityStatus ?? 'Vigilance'}
                </div>
                <div style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '0.55rem', color: 'rgba(245,208,112,0.6)' }}>
                  Index {vulnerabilityIndex}
                </div>
              </div>
            </div>
          )}
          {/* Status dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22C55E', border: '1.5px solid rgba(255,255,255,0.35)' }}/>
            <span style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '0.42rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Publique</span>
          </div>
        </div>
      </div>

      {/* ── BLOCK 1 — SITUATION ─────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 py-5 sm:py-6 flex flex-col gap-5">

        {/* Signal */}
        {card.overview && (
          <div>
            <SectionLabel>Signal</SectionLabel>
            <p
              className="mt-1.5 text-xs leading-relaxed"
              style={{ color: 'var(--text-muted)', fontWeight: 300 }}
            >
              {card.overview.split('.')[0].trim()}.
            </p>
          </div>
        )}

        {/* Insight — ephemeral */}
        {insight && (
          <div
            className="px-4 py-3 rounded-[2px]"
            style={{
              background:  'rgba(196,168,130,0.04)',
              border:      '1px solid var(--border-gold-subtle)',
              borderLeft:  '2px solid rgba(196,168,130,0.5)',
            }}
          >
            <SectionLabel>Insight</SectionLabel>
            <p
              className="mt-1.5"
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontSize:   'clamp(0.95rem, 2.5vw, 1.1rem)',
                color:      'var(--text-primary)',
                fontStyle:  'italic',
                fontWeight: 300,
                lineHeight: 1.55,
              }}
            >
              {insight}
            </p>
          </div>
        )}

        {/* Title + objective — LEVEL 1 */}
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize:   'clamp(1.1rem, 3vw, 1.55rem)',
              color:      'var(--text-primary)',
              fontWeight: 400,
              lineHeight: 1.2,
            }}
          >
            {card.title}
          </h1>
          {card.objective && (
            <p
              className="mt-2 text-sm leading-relaxed"
              style={{ color: 'var(--text-secondary)', fontWeight: 300, fontStyle: 'italic' }}
            >
              {card.objective}
            </p>
          )}
        </div>

        {/* Level 2 toggle — system composition */}
        <div>
          <button
            onClick={() => setLevel2Open((o) => !o)}
            className="flex items-center gap-2 group"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <span
              className="label-eyebrow"
              style={{ fontSize: '0.56rem', opacity: 0.4, transition: 'opacity 0.15s' }}
            >
              System composition
            </span>
            <span
              style={{
                fontSize:   '0.52rem',
                color:      'var(--text-muted)',
                opacity:    0.5,
                transform:  level2Open ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                display:    'inline-block',
              }}
            >
              ▾
            </span>
          </button>

          {level2Open && (
            <div className="mt-3 grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-3">
              <ItemList label="Forces"      items={card.forces} />
              <ItemList label="Tensions"    items={card.tensions}    accentColor="rgba(196,130,106,0.7)" />
              <ItemList label="Constraints" items={card.constraints} />
              <ItemList label="Uncertainty" items={card.uncertainty} accentColor="rgba(106,158,196,0.7)" />
              {card.vulnerabilities?.length > 0 && (
                <div className="sm:col-span-2">
                  <ItemList label="Vulnerabilities" items={card.vulnerabilities} accentColor="rgba(196,106,106,0.7)" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Divider />

      {/* ── BLOCK 2 — RISK ──────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 py-5 sm:py-6 flex flex-col gap-5">

        {/* Main vulnerability — LEVEL 1 */}
        <div
          className="px-4 py-3 rounded-[2px]"
          style={{
            background: 'rgba(196,130,90,0.05)',
            border:     '1px solid rgba(196,130,90,0.15)',
          }}
        >
          <SectionLabel>⚠ Main Vulnerability</SectionLabel>
          <p
            className="mt-1.5"
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize:   'clamp(0.9rem, 2.5vw, 1.05rem)',
              color:      'var(--text-primary)',
              fontWeight: 300,
              fontStyle:  'italic',
              lineHeight: 1.5,
            }}
          >
            {card.main_vulnerability}
          </p>
        </div>

        {/* Decision Radar — ephemeral */}
        {hasRadar && (
          <div className="flex flex-col items-center">
            <SectionLabel>Decision Radar</SectionLabel>
            <div className="mt-4">
              <RadarChart
                dimensions={{
                  systemic_impact: decisionDimensions.systemic_impact as 'low' | 'medium' | 'high',
                  urgency:         decisionDimensions.urgency         as 'low' | 'medium' | 'high',
                  uncertainty:     decisionDimensions.uncertainty     as 'low' | 'medium' | 'high',
                  reversibility:   decisionDimensions.reversibility   as 'low' | 'medium' | 'high',
                }}
                index={vulnerabilityIndex!}
                status={vulnerabilityStatus!}
                vulnerableFor={vulnerabilityFor}
                size={200}
              />
            </div>
          </div>
        )}
      </div>

      <Divider />

      {/* ── BLOCK 3 — FUTURE ────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 py-5 sm:py-6 flex flex-col gap-5">

        {/* Trajectories — LEVEL 1, colored labels */}
        {card.trajectories?.length > 0 && (
          <div>
            <SectionLabel>Trajectories</SectionLabel>
            <div className="mt-2 flex flex-col gap-2.5">
              {card.trajectories.map((t, i) => {
                const { label, text } = parseTrajectory(t)
                const color = TRAJECTORY_COLORS[label] ?? 'var(--gold-dim)'
                return (
                  <div key={i} className="flex items-start gap-2.5">
                    {label ? (
                      <span
                        className="shrink-0 mt-0.5 text-xs"
                        style={{
                          fontSize:      '0.56rem',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color,
                          fontFamily:    'var(--font-dm-sans)',
                          fontWeight:    500,
                          paddingTop:    '0.1rem',
                          minWidth:      '80px',
                        }}
                      >
                        {label}
                      </span>
                    ) : (
                      <span
                        style={{ color: 'var(--gold-dim)', opacity: 0.7, flexShrink: 0 }}
                      >
                        {['A', 'B', 'C'][i] ?? i + 1}
                      </span>
                    )}
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: 'var(--text-secondary)', fontWeight: 300 }}
                    >
                      {text || t}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Intention — maïeutisée, above Surveiller */}
        {intention && (
          <>
            <Divider />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              {/* Cible picto — SVG inline */}
              <svg width="22" height="22" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="44" stroke="#1A2E5A" strokeWidth="7" fill="none"/>
                <circle cx="50" cy="50" r="22" stroke="#1A2E5A" strokeWidth="5" fill="none"/>
                <circle cx="50" cy="50" r="8" fill="#A02848"/>
                <line x1="50" y1="6" x2="50" y2="28" stroke="#1A2E5A" strokeWidth="4" strokeLinecap="round"/>
                <line x1="50" y1="72" x2="50" y2="94" stroke="#1A2E5A" strokeWidth="4" strokeLinecap="round"/>
                <line x1="6" y1="50" x2="28" y2="50" stroke="#1A2E5A" strokeWidth="4" strokeLinecap="round"/>
                <line x1="72" y1="50" x2="94" y2="50" stroke="#1A2E5A" strokeWidth="4" strokeLinecap="round"/>
              </svg>
              <SectionLabel>Intention</SectionLabel>
            </div>
            <p style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize:   '0.82rem',
              color:      'var(--text-primary)',
              fontWeight: 300,
              lineHeight: 1.6,
              fontStyle:  'normal',
            }}>
              {intention}
            </p>
          </>
        )}

        {/* Surveiller — Key signal to watch */}
        {keySignal && (
          <div
            className="px-4 py-3 rounded-[2px]"
            style={{
              background: 'rgba(106,158,196,0.04)',
              border:     '1px solid rgba(106,158,196,0.12)',
            }}
          >
            <SectionLabel>Key signal to watch</SectionLabel>
            <p
              className="mt-1.5 text-xs leading-relaxed"
              style={{ color: 'var(--text-secondary)', fontWeight: 300 }}
            >
              {keySignal}
            </p>
          </div>
        )}

        {/* Reflection */}
        {card.reflection && (
          <div>
            <SectionLabel>Reflection</SectionLabel>
            <p
              className="mt-1.5"
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontSize:   'clamp(0.9rem, 2vw, 1.05rem)',
                color:      'var(--text-secondary)',
                fontStyle:  'italic',
                fontWeight: 300,
                lineHeight: 1.6,
              }}
            >
              {card.reflection}
            </p>
          </div>
        )}

        {/* Actions slot */}
        {actions && (
          <div style={{ borderTop: '1px solid var(--border-gold-subtle)', paddingTop: '1.25rem' }}>
            {actions}
          </div>
        )}
      </div>
    </article>
  )
}
