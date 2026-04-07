import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import fs from 'fs'
import path from 'path'


export const revalidate = 60

interface PageProps {
  params: { slug: string }
}

const DEMO_SLUGS = ['ong-rdc', 'sequestration-v2', 'iran-j19']

async function getCard(slug: string) {
  // 1. Essaie d'abord les JSON locaux (démo)
  if (DEMO_SLUGS.includes(slug)) {
    try {
      const filePath = path.join(process.cwd(), 'src', 'data', `${slug}.json`)
      const raw = fs.readFileSync(filePath, 'utf-8')
      const data = JSON.parse(raw)
      return {
        slug,
        is_public: true,
        title: data.title,
        category: data.category,
        state_label: data.state_label,
        state_index_final: data.state_index_final,
        insight: data.insight,
        vulnerability: data.vulnerability,
        signal: data.signal,
        asymmetry: data.asymmetry,
        astrolabe_scores: data.astrolabe_scores,
        trajectories: data.trajectories,
        cap_summary: data.cap_summary,
        radar_scores: data.radar_scores,
        certified: true,
        certified_by: slug === 'iran-j19' ? 'JCA · IAAA+' : 'Maël · Chef de base ONG Congo',
        date: slug === 'iran-j19' ? '22 mars 2026' : slug === 'sequestration-v2' ? '19 mars 2026' : '18 mars 2026',
      }
    } catch {
      return null
    }
  }

  // 2. Sinon essaie le backend FastAPI
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
    const res = await fetch(`${apiUrl}/api/cards/${slug}`, { next: { revalidate: 60 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const card = await getCard(params.slug)
  if (!card) return { title: 'Carte introuvable · Situation Card' }
  return {
    title: `${card.title} · Situation Card`,
    description: card.insight ?? card.vulnerability ?? '',
  }
}

const NAVY = '#1B3A6B'
const GOLD = '#B89A6A'
const GOLD_L = '#CCA364'
const BG = '#F5F3EE'
const BG_P = '#FAFAF7'
const TXT = '#1a2a3a'
const TXT2 = '#5a6a7a'
const TXT3 = '#9aabb8'
const BDR = 'rgba(26,42,58,0.1)'
const BDR_G = 'rgba(184,154,106,0.25)'

function StateColor(label: string) {
  const map: Record<string, string> = {
    'Contrôlable': '#3B82F6',
    'Vigilance': '#EAB308',
    'Critique': '#E24B4A',
    'Hors contrôle': '#9B1515',
    'Stable': '#378ADD',
  }
  return map[label] ?? '#9aabb8'
}

function ScoreBar({ score }: { score: number }) {
  const colors = ['#E0DCD4', '#B8D4F0', '#F0CA70', '#E87C7C']
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ width: 16, height: 7, borderRadius: 2, background: score >= i ? colors[i] : '#E0DCD4' }}/>
      ))}
    </div>
  )
}

export default async function SituationCardPage({ params }: PageProps) {
  const card = await getCard(params.slug)
  if (!card) notFound()

  const stateColor = StateColor(card.state_label)

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'DM Sans', sans-serif", color: TXT }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=DM+Sans:wght@300;400;500&family=Cinzel:wght@400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>

      {/* NAV */}
      <nav style={{ background: BG, borderBottom: `1px solid ${BDR}`, padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 500, color: NAVY }}>Situation Card</div>
          <div style={{ fontSize: 9, color: TXT3 }}>powered by IAAA+</div>
        </Link>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link href="/library" style={{ fontSize: 12, color: TXT2, textDecoration: 'none' }}>← ATLAS</Link>
          <Link href="/" style={{ fontSize: 12, color: TXT2, textDecoration: 'none' }}>Analyser</Link>
        </div>
      </nav>

      {/* SC HEADER */}
      <div style={{ background: `linear-gradient(to right, ${NAVY}, #2A4A80)`, padding: '20px 32px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ flex: 1 }}>
              {card.certified && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(184,154,106,0.15)', border: `1px solid rgba(184,154,106,0.3)`, borderRadius: 20, padding: '2px 10px', marginBottom: 10 }}>
                  <span style={{ fontSize: 9, color: GOLD_L, fontFamily: "'Cinzel', serif", letterSpacing: '0.06em' }}>★ SC CERTIFIED</span>
                </div>
              )}
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.16em', marginBottom: 6 }}>
                SITUATION CARD · {card.category?.toUpperCase()}
              </div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 22, color: '#fff', lineHeight: 1.3, marginBottom: 6 }}>{card.title}</h1>
              {card.certified_by && (
                <div style={{ fontSize: 10, color: 'rgba(184,154,106,0.7)' }}>{card.certified_by} · {card.date}</div>
              )}
            </div>
            <div style={{ flexShrink: 0, textAlign: 'center', background: 'rgba(255,255,255,0.08)', border: `1px solid rgba(184,154,106,0.3)`, borderRadius: 10, padding: '10px 16px' }}>
              <div style={{ fontSize: 32, fontWeight: 600, color: '#E8D080', fontFamily: "'Cinzel', serif", lineHeight: 1 }}>{card.state_index_final}</div>
              <div style={{ fontSize: 9, color: 'rgba(232,208,128,0.6)', marginTop: 3, letterSpacing: '0.08em' }}>INDEX</div>
              <div style={{ fontSize: 11, color: '#E8D080', marginTop: 4, fontWeight: 600 }}>{card.state_label}</div>
            </div>
          </div>
        </div>
      </div>

      {/* CORPS */}
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '28px 32px 60px' }}>

        {/* LECTURE */}
        {card.insight && (
          <div style={{ background: `rgba(184,154,106,0.07)`, border: `1px solid ${BDR_G}`, borderRadius: 8, padding: '16px 18px', marginBottom: 20 }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: GOLD, letterSpacing: '0.12em', marginBottom: 8 }}>LECTURE</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 16, color: TXT, lineHeight: 1.7 }}>{card.insight}</div>
          </div>
        )}

        {/* ASTROLABE + RADAR */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

          {/* Astrolabe */}
          {card.astrolabe_scores && (
            <div style={{ background: BG_P, border: `1px solid ${BDR}`, borderRadius: 8, padding: '14px 16px' }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: GOLD, letterSpacing: '0.12em', marginBottom: 12 }}>ASTROLABE</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {card.astrolabe_scores.map((a: any) => (
                  <div key={a.branch} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 9, color: TXT3, fontStyle: 'italic', minWidth: 24 }}>{a.branch}</span>
                    <span style={{ fontSize: 11, color: TXT2, flex: 1 }}>{a.name}</span>
                    <ScoreBar score={a.display_score}/>
                    <span style={{ fontSize: 9, color: TXT3, minWidth: 52 }}>{a.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Radar */}
          {card.radar_scores && (
            <div style={{ background: BG_P, border: `1px solid ${BDR}`, borderRadius: 8, padding: '14px 16px' }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: GOLD, letterSpacing: '0.12em', marginBottom: 12 }}>RADAR DE PRESSION</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {card.radar_scores.map((r: any) => (
                  <div key={r.dimension}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: TXT2 }}>{r.dimension}</span>
                      <span style={{ fontSize: 10, color: GOLD, fontWeight: 500 }}>{r.score}/3</span>
                    </div>
                    <div style={{ height: 4, background: BDR, borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${(r.score / 3) * 100}%`, background: GOLD_L, borderRadius: 2, transition: 'width .3s' }}/>
                    </div>
                    {r.note && <div style={{ fontSize: 10, color: TXT3, marginTop: 3, lineHeight: 1.5 }}>{r.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* VULNERABILITE */}
        {card.vulnerability && (
          <div style={{ background: 'rgba(224,107,74,0.06)', border: '1px solid rgba(224,107,74,0.2)', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: '#E06B4A', letterSpacing: '0.12em', marginBottom: 6 }}>VULNÉRABILITÉ</div>
            <div style={{ fontSize: 13, color: TXT, fontWeight: 500 }}>{card.vulnerability}</div>
          </div>
        )}

        {/* ASYMMETRIE */}
        {card.asymmetry && (
          <div style={{ background: BG_P, border: `1px solid ${BDR}`, borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: GOLD, letterSpacing: '0.12em', marginBottom: 6 }}>ASYMÉTRIE</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14, color: TXT, lineHeight: 1.6 }}>{card.asymmetry}</div>
          </div>
        )}

        {/* CAP */}
        {card.cap_summary && (
          <div style={{ background: BG_P, border: `1px solid ${BDR_G}`, borderRadius: 8, padding: '16px', marginBottom: 16 }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: GOLD, letterSpacing: '0.12em', marginBottom: 10 }}>CAP</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 16, color: NAVY, marginBottom: 10, lineHeight: 1.4 }}>{card.cap_summary.hook}</div>
            {card.cap_summary.insight && <div style={{ fontSize: 12, color: TXT2, lineHeight: 1.6, marginBottom: 8 }}>{card.cap_summary.insight}</div>}
            {card.cap_summary.watch && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 6, padding: '8px 12px' }}>
                <span style={{ fontSize: 9, color: '#A16207', fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', marginTop: 1 }}>WATCH</span>
                <span style={{ fontSize: 12, color: TXT, lineHeight: 1.5 }}>{card.cap_summary.watch}</span>
              </div>
            )}
          </div>
        )}

        {/* TRAJECTOIRES */}
        {card.trajectories && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: GOLD, letterSpacing: '0.12em', marginBottom: 12 }}>TRAJECTOIRES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {card.trajectories.map((t: any, i: number) => {
                const colors: Record<string, string> = { 'Stabilisation': '#1D9E75', 'Escalation': '#E06B4A', 'Solution tiers': '#378ADD' }
                const c = colors[t.type] ?? '#9aabb8'
                return (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: BG_P, border: `1px solid ${BDR}`, borderRadius: 8, borderLeft: `3px solid ${c}` }}>
                    <div style={{ flexShrink: 0, paddingTop: 2 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: c, fontFamily: "'Cinzel', serif", letterSpacing: '0.04em', marginBottom: 4 }}>{t.type} — {t.title}</div>
                      <div style={{ fontSize: 12, color: TXT2, lineHeight: 1.6, marginBottom: t.probability ? 6 : 0 }}>{t.description}</div>
                      {t.probability && <div style={{ fontSize: 10, color: TXT3, fontStyle: 'italic' }}>{t.probability}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* SIGNAL */}
        {card.signal && (
          <div style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: 8, padding: '14px 16px', marginBottom: 20 }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: '#A16207', letterSpacing: '0.12em', marginBottom: 6 }}>SIGNAL CLÉ</div>
            <div style={{ fontSize: 13, color: TXT, lineHeight: 1.6 }}>{card.signal}</div>
          </div>
        )}

        {/* PARTAGER */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', paddingTop: 10 }}>
          <Link href="/library" style={{ padding: '8px 20px', border: `1px solid ${BDR}`, borderRadius: 8, fontSize: 12, color: TXT2, textDecoration: 'none' }}>← ATLAS</Link>
          <button style={{ padding: '8px 20px', background: NAVY, border: 'none', borderRadius: 8, fontSize: 12, color: '#fff', cursor: 'pointer' }}>Partager</button>
          <Link href="/" style={{ padding: '8px 20px', background: GOLD, border: 'none', borderRadius: 8, fontSize: 12, color: '#fff', textDecoration: 'none' }}>Analyser ma situation →</Link>
        </div>

      </main>
    </div>
  )
}

