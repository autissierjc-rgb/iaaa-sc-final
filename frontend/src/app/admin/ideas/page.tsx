'use client'

/**
 * IAAA · Admin · Ideas Box
 *
 * Simple capture tool for V2+ roadmap ideas.
 * No backend — persists in localStorage for now.
 * V2: wire to /api/admin/ideas endpoint + DB.
 *
 * Pre-loaded with the strategic vision from the founding GPT thread:
 *   - Cockpit modules (Marketing, Networking, Community, Strategy Lab)
 *   - Plugin architecture
 *   - Collaborative SC (multi-readings)
 *   - App expansion (GoS, SIS Energy, SIS Epidemic)
 */

import { useState, useEffect } from 'react'

interface Idea {
  id:        string
  title:     string
  body:      string
  category:  string
  priority:  'high' | 'medium' | 'low'
  phase:     'V2' | 'V3' | 'later'
  createdAt: string
}

const CATEGORIES = ['Cockpit', 'Apps', 'Modules', 'Plugins', 'Collaborative', 'Marketing', 'Architecture', 'Other']
const PHASES     = ['V2', 'V3', 'later']
const PRIORITIES = ['high', 'medium', 'low']

const SEED_IDEAS: Idea[] = [
  {
    id: 'idea-001',
    title: 'Cockpit — Model router',
    body: 'Switch AI provider per app from admin (Clarity → GPT, SIS → Anthropic, fallback logic, cost ceiling per model). No redeploy needed.',
    category: 'Cockpit',
    priority: 'high',
    phase: 'V2',
    createdAt: '2026-03-20T10:00:00Z',
  },
  {
    id: 'idea-002',
    title: 'Cockpit — Live prompt editor',
    body: 'Edit system prompt, output format, and SC contract rules directly from admin. Hot-reload without redeploy. Per-app prompt versioning.',
    category: 'Cockpit',
    priority: 'high',
    phase: 'V2',
    createdAt: '2026-03-20T10:01:00Z',
  },
  {
    id: 'idea-003',
    title: 'Collaborative SC — Multi-readings',
    body: '"Une situation. Plusieurs lectures." Multiple users add their Intention to the same SC. Each reading visible. No merging, no ranking. Phase 2 of Intention field.',
    category: 'Collaborative',
    priority: 'high',
    phase: 'V2',
    createdAt: '2026-03-20T10:02:00Z',
  },
  {
    id: 'idea-004',
    title: 'Plugin architecture',
    body: 'Core engine calls specialized plugins: fake_news_detector, weak_signal_detector, market_data, sentiment_analysis, network_analysis. Plugin marketplace long term.',
    category: 'Architecture',
    priority: 'medium',
    phase: 'V3',
    createdAt: '2026-03-20T10:03:00Z',
  },
  {
    id: 'idea-005',
    title: 'Cockpit — Marketing Intelligence',
    body: 'Traffic, conversions, funnel analysis, landing page performance. Which situations convert to paid? Which features drive retention?',
    category: 'Marketing',
    priority: 'medium',
    phase: 'V2',
    createdAt: '2026-03-20T10:04:00Z',
  },
  {
    id: 'idea-006',
    title: 'Cockpit — Networking Intelligence',
    body: 'CRM for investors, researchers, partners, prospects. Track exchanges, map indirect connections (INSEAD, Station F, sovereign wealth funds).',
    category: 'Cockpit',
    priority: 'medium',
    phase: 'V2',
    createdAt: '2026-03-20T10:05:00Z',
  },
  {
    id: 'idea-007',
    title: 'Module — Geopolitics',
    body: 'Specialized SC module for geopolitical analysis. Iran cards already seeded in Atlas. Weak signal detection, empire rivalry patterns, chiisme logic.',
    category: 'Modules',
    priority: 'high',
    phase: 'V2',
    createdAt: '2026-03-20T10:06:00Z',
  },
  {
    id: 'idea-008',
    title: 'App — Game of Spirit',
    body: 'Narrative exploration engine. Same SC motor, plugins become characters/faculties/perspectives. Strategic analysis meets narrative exploration.',
    category: 'Apps',
    priority: 'low',
    phase: 'V3',
    createdAt: '2026-03-20T10:07:00Z',
  },
  {
    id: 'idea-009',
    title: 'Cockpit — Strategy Lab',
    body: 'Analyze platform expansion options. "Should we launch SIS Energy?" Motor explores market size, competition, opportunity. Cockpit uses its own SC engine.',
    category: 'Cockpit',
    priority: 'medium',
    phase: 'V3',
    createdAt: '2026-03-20T10:08:00Z',
  },
  {
    id: 'idea-010',
    title: 'Atlas — Temporal layers',
    body: 'Same situation, multiple dates. Day 1 / Day 10 / Day 20 with diverging readings. Iran cards: show dated questions before events happened.',
    category: 'Apps',
    priority: 'high',
    phase: 'V2',
    createdAt: '2026-03-20T10:09:00Z',
  },
  {
    id: 'idea-011',
    title: 'Cockpit — Module manager',
    body: 'Activate/deactivate modules per app. Assign modules to Clarity/SIS/GoS. Define module-specific prompts. Limit access per pricing tier.',
    category: 'Cockpit',
    priority: 'medium',
    phase: 'V2',
    createdAt: '2026-03-20T10:10:00Z',
  },
  {
    id: 'idea-012',
    title: 'Community — Feedback loop',
    body: 'Users vote on SC quality. Flag weak analyses. Suggest improvements. Feed back into prompt refinement. Community as quality signal.',
    category: 'Other',
    priority: 'low',
    phase: 'later',
    createdAt: '2026-03-20T10:11:00Z',
  },
]

const PRIORITY_COLORS: Record<string, string> = {
  high:   '#C8951A',
  medium: '#185FA5',
  low:    '#9A8860',
}

const PHASE_COLORS: Record<string, string> = {
  V2:    'rgba(24,95,165,0.15)',
  V3:    'rgba(200,149,26,0.12)',
  later: 'rgba(154,136,96,0.1)',
}

export default function IdeasBox() {
  const [ideas, setIdeas]         = useState<Idea[]>([])
  const [filter, setFilter]       = useState<string>('all')
  const [phase, setPhase]         = useState<string>('all')
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState({
    title: '', body: '', category: 'Other', priority: 'medium', phase: 'V2',
  })

  useEffect(() => {
    const stored = localStorage.getItem('iaaa_ideas')
    if (stored) {
      setIdeas(JSON.parse(stored))
    } else {
      setIdeas(SEED_IDEAS)
      localStorage.setItem('iaaa_ideas', JSON.stringify(SEED_IDEAS))
    }
  }, [])

  function save(updated: Idea[]) {
    setIdeas(updated)
    localStorage.setItem('iaaa_ideas', JSON.stringify(updated))
  }

  function addIdea() {
    if (!form.title.trim()) return
    const idea: Idea = {
      id:        `idea-${Date.now()}`,
      title:     form.title.trim(),
      body:      form.body.trim(),
      category:  form.category,
      priority:  form.priority as 'high' | 'medium' | 'low',
      phase:     form.phase as 'V2' | 'V3' | 'later',
      createdAt: new Date().toISOString(),
    }
    save([idea, ...ideas])
    setForm({ title: '', body: '', category: 'Other', priority: 'medium', phase: 'V2' })
    setShowForm(false)
  }

  function deleteIdea(id: string) {
    save(ideas.filter(i => i.id !== id))
  }

  const filtered = ideas
    .filter(i => filter === 'all' || i.category === filter)
    .filter(i => phase === 'all' || i.phase === phase)

  return (
    <div style={{ maxWidth: '900px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
            Ideas Box
          </h1>
          <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>
            V2+ roadmap · {ideas.length} ideas · Not persisted to DB yet
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            background:    '#185FA5',
            color:         '#fff',
            border:        'none',
            borderRadius:  '6px',
            padding:       '8px 16px',
            fontSize:      '0.75rem',
            cursor:        'pointer',
            letterSpacing: '0.05em',
          }}
        >
          + Add idea
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{
          background:    '#111827',
          border:        '1px solid #374151',
          borderRadius:  '8px',
          padding:       '18px',
          marginBottom:  '20px',
        }}>
          <input
            placeholder="Title"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            style={{ width: '100%', background: '#1F2937', border: '1px solid #374151', borderRadius: '5px', padding: '8px 12px', color: '#F9FAFB', fontSize: '0.85rem', marginBottom: '10px', outline: 'none' }}
          />
          <textarea
            placeholder="Description (optional)"
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            rows={3}
            style={{ width: '100%', background: '#1F2937', border: '1px solid #374151', borderRadius: '5px', padding: '8px 12px', color: '#F9FAFB', fontSize: '0.82rem', marginBottom: '10px', outline: 'none', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {[
              { key: 'category', options: CATEGORIES },
              { key: 'priority', options: PRIORITIES },
              { key: 'phase',    options: PHASES },
            ].map(({ key, options }) => (
              <select
                key={key}
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ background: '#1F2937', border: '1px solid #374151', borderRadius: '5px', padding: '7px 10px', color: '#D1D5DB', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={addIdea} style={{ background: '#185FA5', color: '#fff', border: 'none', borderRadius: '5px', padding: '7px 16px', fontSize: '0.78rem', cursor: 'pointer' }}>Save</button>
            <button onClick={() => setShowForm(false)} style={{ background: 'transparent', color: '#6B7280', border: '1px solid #374151', borderRadius: '5px', padding: '7px 12px', fontSize: '0.78rem', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
        {['all', ...CATEGORIES].map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            style={{
              background:   filter === c ? '#185FA5' : '#1F2937',
              color:        filter === c ? '#fff' : '#9CA3AF',
              border:       '1px solid #374151',
              borderRadius: '5px',
              padding:      '4px 11px',
              fontSize:     '0.72rem',
              cursor:       'pointer',
              letterSpacing: '0.04em',
            }}
          >
            {c}
          </button>
        ))}
        <div style={{ width: '1px', background: '#374151', margin: '0 4px' }}/>
        {['all', ...PHASES].map(p => (
          <button
            key={p}
            onClick={() => setPhase(p)}
            style={{
              background:   phase === p ? '#C8951A' : '#1F2937',
              color:        phase === p ? '#fff' : '#9CA3AF',
              border:       '1px solid #374151',
              borderRadius: '5px',
              padding:      '4px 11px',
              fontSize:     '0.72rem',
              cursor:       'pointer',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Ideas grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map(idea => (
          <div
            key={idea.id}
            style={{
              background:   PHASE_COLORS[idea.phase] || '#1F2937',
              border:       '1px solid #374151',
              borderLeft:   `3px solid ${PRIORITY_COLORS[idea.priority]}`,
              borderRadius: '7px',
              padding:      '14px 16px',
              position:     'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#F9FAFB' }}>{idea.title}</span>
                  <span style={{ fontSize: '0.65rem', background: '#374151', color: '#9CA3AF', borderRadius: '4px', padding: '1px 7px' }}>{idea.category}</span>
                  <span style={{ fontSize: '0.65rem', color: PRIORITY_COLORS[idea.priority], fontWeight: 500 }}>{idea.priority}</span>
                  <span style={{ fontSize: '0.65rem', color: '#6B7280' }}>{idea.phase}</span>
                </div>
                {idea.body && (
                  <p style={{ fontSize: '0.78rem', color: '#9CA3AF', lineHeight: 1.6, fontWeight: 300 }}>
                    {idea.body}
                  </p>
                )}
              </div>
              <button
                onClick={() => deleteIdea(idea.id)}
                style={{ background: 'none', border: 'none', color: '#4B5563', cursor: 'pointer', fontSize: '14px', padding: '2px', flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p style={{ color: '#4B5563', fontSize: '0.8rem', textAlign: 'center', padding: '32px' }}>No ideas in this filter.</p>
        )}
      </div>
    </div>
  )
}
