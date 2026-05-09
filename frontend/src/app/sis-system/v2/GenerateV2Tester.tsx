'use client'

import { useMemo, useState } from 'react'
import { inquiryLevelLabel, publicInquiryQuestion } from './inquiryDisplay'

type GenerateV2Response = {
  ok?: boolean
  mode?: string
  total_duration_ms?: number
  dialogue?: {
    status?: string
    can_generate?: boolean
    question?: string
  }
  interpretation?: {
    domain?: string
    header_domain?: string
    header_subject?: string
    situation_soumise?: string
    confidence?: number
  }
  scoring?: {
    state_index_final?: number
    state_label?: string
  }
  resources?: {
    status?: string
    functional_needs?: Array<{
      family: string
      label_fr: string
      question_fr: string
      channels: string[]
      suggested_queries: string[]
      expected_evidence_fr: string[]
      priority: string
    }>
    resources?: unknown[]
    public_sources?: unknown[]
    needs_web?: boolean
  }
  patterns?: {
    selected_patterns?: Array<{
      id: string
      label_fr: string
      confidence: number
      hypothesis: string
      observable_signal: string
      inquiry_question: string
    }>
    dumezil_balance?: {
      legitimize?: number
      protect_fight?: number
      produce_reproduce?: number
    }
    trace?: {
      rule?: string
      matched_patterns?: number
      total_patterns?: number
    }
  }
  triad_astrolabe?: Array<{
    function_id: string
    label_fr: string
    active: boolean
    suggested_branches: string[]
    rationale_fr: string
  }>
  theatre?: {
    actors?: string[]
    institutions?: string[]
    procedures?: string[]
    unknowns?: string[]
  }
  inquiry?: {
    blind_spots?: Array<{
      blind_spot: string
      level: string
      decisive_evidence: string
      observable_signal?: string
    }>
  }
  quality?: {
    ok?: boolean
    requires_section_regeneration?: boolean
    sections_to_regenerate?: string[]
    issues?: Array<{
      level: string
      code: string
      message: string
      field?: string
    }>
  }
  generation_archive?: {
    event?: {
      privacy_mode?: string
      raw_input_hash?: string
      input_chars?: number
      resources_count?: number
      generation_status?: string
      latency_ms?: number
      domain?: string
      intent?: string
    }
    archive_decision?: {
      store_event?: boolean
      store_snapshot?: boolean
      privacy_mode?: string
      reason?: string
    }
  }
  writing?: {
    situation_card?: {
      title_fr?: string
      insight_fr?: string
      main_vulnerability_fr?: string
      asymmetry_fr?: string
      key_signal_fr?: string
    }
    trajectories?: Array<{
      type: string
      title_fr: string
      description_fr: string
      signal_fr: string
    }>
    lecture?: {
      text_fr?: string
      word_count_fr?: number
    }
    approfondir?: {
      analysis_fr?: string
      sections_fr?: Array<{
        id: string
        title: string
        body: string
      }>
    }
    diamond_sentences?: Array<{
      text_fr: string
      role: string
    }>
    probability_assessments?: Array<{
      probability_label_fr?: string
      claim_fr?: string
      confidence?: number
    }>
  }
  pipeline_trace?: {
    total_duration_ms?: number
    blocking_failure?: boolean
    steps?: Array<{
      stage_id: string
      outcome: string
      duration_ms: number
      budget_ms: number
      over_budget: boolean
      warnings?: string[]
      error_kind?: string
    }>
  }
  error?: string
  message?: string
}

const EXAMPLES = [
  'Trump peut-il contester les resultats des elections de mi-mandat ?',
  "Que fait la compagnie FlexUp et qu'en penser pour eventuellement la rejoindre avec ma startup ?",
  "Mon fils de 14 ans est passionne par la peche a la carpe, comment reagir apres son retrait dans la voiture ?",
]

const GENERATE_V2_TIMEOUT_MS = 60000
const SLOW_REQUEST_NOTICE_MS = 12000

function panelStyle(): React.CSSProperties {
  return {
    background: '#fff',
    border: '1px solid #E1D6C2',
    borderRadius: 8,
    padding: 18,
    marginBottom: 16,
  }
}

function miniCardStyle(): React.CSSProperties {
  return {
    border: '1px solid #F0EBE0',
    borderRadius: 8,
    padding: 12,
    background: '#FCFAF6',
  }
}

function outcomeColor(outcome?: string) {
  if (outcome === 'failed') return '#B23A3A'
  if (outcome === 'warning') return '#A66B00'
  if (outcome === 'skipped') return '#8B8174'
  return '#1D9E75'
}

function layerLabel(stageId: string) {
  const labels: Record<string, string> = {
    interpretation: 'interpretation',
    'dialogue-gate': 'dialogue',
    'risk-advice': 'safety',
    'expertises-metiers': 'expertisesMetiers',
    resources: 'resources',
    patterns: 'patterns',
    theatre: 'theatre',
    'blind-spots': 'inquiry',
    scoring: 'scoring',
    writing: 'writing',
    quality: 'quality',
  }

  return labels[stageId] ?? stageId
}

export default function GenerateV2Tester() {
  const [input, setInput] = useState(EXAMPLES[0])
  const [interpretationMode, setInterpretationMode] = useState<'local_contract' | 'referent_llm'>('local_contract')
  const [writingMode, setWritingMode] = useState<'local_contract' | 'referent_llm'>('local_contract')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<GenerateV2Response | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>('Pret.')
  const [evidenceSearchRequested, setEvidenceSearchRequested] = useState(false)

  const firstBlindSpots = useMemo(
    () => response?.inquiry?.blind_spots?.slice(0, 3) ?? [],
    [response],
  )

  async function runTest() {
    setLoading(true)
    setError(null)
    setResponse(null)
    setEvidenceSearchRequested(false)
    setStatusMessage('Appel de /api/generate-v2 en cours...')
    const controller = new AbortController()
    const slowNotice = window.setTimeout(() => {
      setStatusMessage('Appel toujours en cours : attente du LLM referent ou du serveur local...')
    }, SLOW_REQUEST_NOTICE_MS)
    const timeout = window.setTimeout(() => controller.abort(), GENERATE_V2_TIMEOUT_MS)

    try {
      const result = await fetch('/api/generate-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          interpretation_mode: interpretationMode,
          writing_mode: writingMode,
        }),
        signal: controller.signal,
      })
      const payload = await result.json()
      setResponse(payload)
      if (!result.ok) {
        setError(payload?.message ?? payload?.error ?? 'Erreur generate-v2')
        setStatusMessage('Erreur recue.')
      } else {
        setStatusMessage('Reponse recue.')
      }
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') {
        setError('Timeout generate-v2 : la route n a pas repondu en moins de 60 secondes.')
        setStatusMessage('Timeout.')
      } else {
        setError(caught instanceof Error ? caught.message : 'Erreur inconnue')
        setStatusMessage('Erreur reseau ou JSON.')
      }
    } finally {
      window.clearTimeout(slowNotice)
      window.clearTimeout(timeout)
      setLoading(false)
    }
  }

  return (
    <section style={panelStyle()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 760 }}>
          <h2 style={{ margin: 0, fontSize: 15 }}>Banc d essai generate-v2</h2>
          <p style={{ color: '#6F6255', lineHeight: 1.65, fontSize: 13, margin: '10px 0 0' }}>
            Teste la route V2 separee. Elle retourne les contrats, pas encore une Situation Card finale.
          </p>
        </div>
        <button
          type="button"
          data-testid="generate-v2-test-button"
          onClick={runTest}
          disabled={loading || input.trim().length === 0}
          style={{
            border: '1px solid #C8951A',
            color: '#1A2E5A',
            background: loading ? '#F0EBE0' : '#F8EFD8',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            height: 40,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Test en cours' : 'Tester generate-v2'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginTop: 14 }}>
        <div>
          <p style={{ margin: '0 0 6px', color: '#8B8174', fontFamily: 'monospace', fontSize: 10 }}>
            interpretation
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              ['local_contract', 'Contrat local rapide'],
              ['referent_llm', 'LLM referent'],
            ].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setInterpretationMode(mode as 'local_contract' | 'referent_llm')}
                disabled={loading}
                style={{
                  border: `1px solid ${interpretationMode === mode ? '#C8951A' : '#E1D6C2'}`,
                  color: interpretationMode === mode ? '#1A2E5A' : '#8B8174',
                  background: interpretationMode === mode ? '#F8EFD8' : '#fff',
                  borderRadius: 999,
                  padding: '7px 10px',
                  fontSize: 11,
                  cursor: loading ? 'wait' : 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p style={{ margin: '0 0 6px', color: '#8B8174', fontFamily: 'monospace', fontSize: 10 }}>
            redaction
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              ['local_contract', 'Locale rapide'],
              ['referent_llm', 'LLM diamant'],
            ].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setWritingMode(mode as 'local_contract' | 'referent_llm')}
                disabled={loading}
                style={{
                  border: `1px solid ${writingMode === mode ? '#C8951A' : '#E1D6C2'}`,
                  color: writingMode === mode ? '#1A2E5A' : '#8B8174',
                  background: writingMode === mode ? '#F8EFD8' : '#fff',
                  borderRadius: 999,
                  padding: '7px 10px',
                  fontSize: 11,
                  cursor: loading ? 'wait' : 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <textarea
        data-testid="generate-v2-input"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        rows={3}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          marginTop: 14,
          border: '1px solid #E1D6C2',
          borderRadius: 8,
          padding: 12,
          color: '#1A2E5A',
          background: '#FCFAF6',
          fontSize: 13,
          lineHeight: 1.5,
          resize: 'vertical',
        }}
      />

      <p data-testid="generate-v2-status" style={{ color: '#8B8174', fontSize: 12, margin: '8px 0 0' }}>
        {statusMessage}
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setInput(example)}
            style={{
              border: '1px solid #E1D6C2',
              color: '#6F6255',
              background: '#fff',
              borderRadius: 999,
              padding: '6px 9px',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            exemple
          </button>
        ))}
      </div>

      {error && (
        <p style={{ color: '#B23A3A', fontSize: 13, marginTop: 12 }}>
          {error}
        </p>
      )}

      {response?.ok && (
        <div style={{ marginTop: 16, ...panelStyle() }}>
          <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>apercu public v2</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ ...miniCardStyle(), borderColor: '#D8C79B' }}>
                <p style={{ margin: 0, color: '#8B8174', fontSize: 11 }}>
                  {response.interpretation?.header_domain}
                </p>
                <h3 style={{ margin: '5px 0 0', color: '#1A2E5A', fontSize: 18, lineHeight: 1.25 }}>
                  {response.writing?.situation_card?.title_fr ?? response.interpretation?.header_subject}
                </h3>
                <p style={{ margin: '10px 0 0', color: '#1A2E5A', fontSize: 13, lineHeight: 1.6 }}>
                  {response.writing?.situation_card?.insight_fr}
                </p>
                {response.writing?.diamond_sentences?.[0]?.text_fr && (
                  <p style={{ margin: '12px 0 0', color: '#C8951A', fontSize: 14, lineHeight: 1.45, fontStyle: 'italic' }}>
                    {response.writing.diamond_sentences[0].text_fr}
                  </p>
                )}
              </div>

              <div style={{ ...miniCardStyle(), marginTop: 12 }}>
                <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>lecture</p>
                <p style={{ margin: '8px 0 0', color: '#1A2E5A', fontSize: 13, lineHeight: 1.65 }}>
                  {response.writing?.lecture?.text_fr}
                </p>
              </div>

              <div style={{ ...miniCardStyle(), marginTop: 12 }}>
                <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>approfondir enrichi</p>
                <p style={{ margin: '8px 0 0', color: '#1A2E5A', fontSize: 13, lineHeight: 1.65 }}>
                  {response.writing?.approfondir?.analysis_fr}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 12 }}>
                  {response.writing?.approfondir?.sections_fr?.map((section) => (
                    <div key={section.id} style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 10, background: '#fff' }}>
                      <h4 style={{ margin: 0, color: '#1A2E5A', fontSize: 12 }}>{section.title}</h4>
                      <p style={{ margin: '6px 0 0', color: '#6F6255', fontSize: 11, lineHeight: 1.5 }}>{section.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside style={{ minWidth: 0 }}>
              <div style={miniCardStyle()}>
                <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>vulnerabilite</p>
                <p style={{ margin: '8px 0 0', color: '#1A2E5A', fontSize: 12, lineHeight: 1.55 }}>
                  {response.writing?.situation_card?.main_vulnerability_fr}
                </p>
              </div>

              <div style={{ ...miniCardStyle(), marginTop: 10 }}>
                <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>asymetrie</p>
                <p style={{ margin: '8px 0 0', color: '#1A2E5A', fontSize: 12, lineHeight: 1.55 }}>
                  {response.writing?.situation_card?.asymmetry_fr}
                </p>
              </div>

              <div style={{ ...miniCardStyle(), marginTop: 10 }}>
                <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>signal cle</p>
                <p style={{ margin: '8px 0 0', color: '#1A2E5A', fontSize: 12, lineHeight: 1.55 }}>
                  {response.writing?.situation_card?.key_signal_fr}
                </p>
              </div>

              <div style={{ ...miniCardStyle(), marginTop: 10 }}>
                <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>trajectoires</p>
                {response.writing?.trajectories?.map((trajectory) => (
                  <div key={trajectory.type} style={{ marginTop: 10 }}>
                    <h4 style={{ margin: 0, color: '#1A2E5A', fontSize: 12 }}>{trajectory.title_fr}</h4>
                    <p style={{ margin: '4px 0 0', color: '#6F6255', fontSize: 11, lineHeight: 1.45 }}>
                      {trajectory.description_fr}
                    </p>
                    <p style={{ margin: '4px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
                      {trajectory.signal_fr}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{ ...miniCardStyle(), marginTop: 10 }}>
                <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>ressources</p>
                <p style={{ margin: '8px 0 0', color: '#1A2E5A', fontSize: 12, lineHeight: 1.55 }}>
                  Statut : {response.resources?.status ?? 'non renseigne'} · sources publiques : {response.resources?.public_sources?.length ?? response.resources?.resources?.length ?? 0}
                </p>
                {response.resources?.functional_needs && response.resources.functional_needs.length > 0 && (
                  <p style={{ margin: '8px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
                    Triade : {response.resources.functional_needs.map((need) => `${need.label_fr} (${need.priority})`).join(' · ')}
                  </p>
                )}
              </div>
            </aside>
          </div>
        </div>
      )}

      {response?.ok && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10, marginTop: 16 }}>
          <div style={miniCardStyle()}>
            <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>interpretation</p>
            <h3 style={{ margin: '6px 0 0', fontSize: 13 }}>{response.interpretation?.header_domain}</h3>
            <p style={{ margin: '6px 0 0', color: '#1A2E5A', fontSize: 12 }}>{response.interpretation?.header_subject}</p>
            <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11 }}>{response.interpretation?.domain}</p>
          </div>

          <div style={miniCardStyle()}>
            <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>dialogue</p>
            <h3 style={{ margin: '6px 0 0', fontSize: 13 }}>{response.dialogue?.status}</h3>
            <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11 }}>
              can generate: {response.dialogue?.can_generate ? 'oui' : 'non'}
            </p>
          </div>

          <div style={miniCardStyle()}>
            <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>scoring</p>
            <h3 style={{ margin: '6px 0 0', fontSize: 13 }}>{response.scoring?.state_index_final} / 100</h3>
            <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11 }}>{response.scoring?.state_label}</p>
          </div>

          <div style={miniCardStyle()}>
            <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>pipeline</p>
            <h3 style={{ margin: '6px 0 0', fontSize: 13 }}>{response.pipeline_trace?.total_duration_ms} ms</h3>
            <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11 }}>
              blocking failure: {response.pipeline_trace?.blocking_failure ? 'oui' : 'non'}
            </p>
          </div>

          <div style={miniCardStyle()}>
            <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>quality</p>
            <h3 style={{ margin: '6px 0 0', fontSize: 13 }}>{response.quality?.ok ? 'ok' : 'a verifier'}</h3>
            <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11 }}>
              issues: {response.quality?.issues?.length ?? 0}
            </p>
          </div>

          <div style={miniCardStyle()}>
            <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>theatre</p>
            <h3 style={{ margin: '6px 0 0', fontSize: 13 }}>
              {(response.theatre?.actors?.length ?? 0) + (response.theatre?.institutions?.length ?? 0)} ancres
            </h3>
            <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11 }}>
              inconnus: {response.theatre?.unknowns?.length ?? 0}
            </p>
          </div>

          <div style={miniCardStyle()}>
            <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>resources</p>
            <h3 style={{ margin: '6px 0 0', fontSize: 13 }}>{response.resources?.status ?? 'non renseigne'}</h3>
            <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11 }}>
              sources: {response.resources?.public_sources?.length ?? response.resources?.resources?.length ?? 0}
            </p>
          </div>

          <div style={miniCardStyle()}>
            <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>patterns</p>
            <h3 style={{ margin: '6px 0 0', fontSize: 13 }}>
              {response.patterns?.selected_patterns?.length ?? 0} lentille(s)
            </h3>
            <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11 }}>
              {response.patterns?.trace?.rule === 'patterns_are_lenses_not_conclusions'
                ? 'lentilles, pas conclusions'
                : 'non renseigne'}
            </p>
          </div>

          <div style={miniCardStyle()}>
            <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>archive</p>
            <h3 style={{ margin: '6px 0 0', fontSize: 13 }}>
              {response.generation_archive?.archive_decision?.privacy_mode ?? 'non renseigne'}
            </h3>
            <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11 }}>
              snapshot: {response.generation_archive?.archive_decision?.store_snapshot ? 'oui' : 'non'}
            </p>
          </div>
        </div>
      )}

      {response?.ok && (
        <div style={{ marginTop: 14, ...miniCardStyle() }}>
          <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>situation soumise</p>
          <p style={{ margin: '8px 0 0', color: '#1A2E5A', fontSize: 13, lineHeight: 1.55 }}>
            {response.interpretation?.situation_soumise}
          </p>
        </div>
      )}

      {response?.quality?.issues && response.quality.issues.length > 0 && (
        <div style={{ marginTop: 14, ...miniCardStyle() }}>
          <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>quality gate</p>
          {response.quality.sections_to_regenerate && response.quality.sections_to_regenerate.length > 0 && (
            <p style={{ margin: '8px 0 0', color: '#1A2E5A', fontSize: 12, lineHeight: 1.5 }}>
              Couche a reprendre : {response.quality.sections_to_regenerate.join(', ')}
            </p>
          )}
          <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: '#6F6255', fontSize: 12, lineHeight: 1.6 }}>
            {response.quality.issues.slice(0, 4).map((item) => (
              <li key={`${item.code}-${item.field ?? 'contract'}`}>
                <strong style={{ color: item.level === 'error' ? '#B23A3A' : '#1A2E5A' }}>{item.code}</strong>
                {' '}· {item.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {response?.patterns && (
        <div style={{ marginTop: 14, ...miniCardStyle() }}>
          <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>
            patterns humains et collectifs
          </p>
          <p style={{ margin: '8px 0 0', color: '#6F6255', fontSize: 12, lineHeight: 1.55 }}>
            Diagnostic interne seulement : les patterns sont des lentilles, pas des conclusions publiques.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 10 }}>
            {[
              ['legitimer', response.patterns.dumezil_balance?.legitimize ?? 0],
              ['proteger / combattre', response.patterns.dumezil_balance?.protect_fight ?? 0],
              ['produire / reproduire', response.patterns.dumezil_balance?.produce_reproduce ?? 0],
            ].map(([label, value]) => (
              <div key={label} style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 10, background: '#fff' }}>
                <p style={{ margin: 0, color: '#8B8174', fontFamily: 'monospace', fontSize: 10 }}>{label}</p>
                <p style={{ margin: '5px 0 0', color: '#1A2E5A', fontSize: 14, fontWeight: 700 }}>{value}</p>
              </div>
            ))}
          </div>
          {response.patterns.selected_patterns && response.patterns.selected_patterns.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 10 }}>
              {response.patterns.selected_patterns.map((pattern) => (
                <div key={pattern.id} style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 10, background: '#fff' }}>
                  <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 10 }}>
                    confiance {Math.round(pattern.confidence * 100)}%
                  </p>
                  <h3 style={{ margin: '6px 0 0', color: '#1A2E5A', fontSize: 13 }}>{pattern.label_fr}</h3>
                  <p style={{ margin: '6px 0 0', color: '#6F6255', fontSize: 11, lineHeight: 1.45 }}>
                    {pattern.hypothesis}
                  </p>
                  <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
                    Signal : {pattern.observable_signal}
                  </p>
                </div>
              ))}
            </div>
          )}
          {response.triad_astrolabe && response.triad_astrolabe.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 10 }}>
              {response.triad_astrolabe.map((item) => (
                <div
                  key={item.function_id}
                  style={{
                    border: `1px solid ${item.active ? '#D8C79B' : '#F0EBE0'}`,
                    borderRadius: 8,
                    padding: 10,
                    background: item.active ? '#FCFAF6' : '#fff',
                  }}
                >
                  <p style={{ margin: 0, color: item.active ? '#C8951A' : '#8B8174', fontFamily: 'monospace', fontSize: 10 }}>
                    astrolabe · {item.active ? 'actif' : 'veille'}
                  </p>
                  <h3 style={{ margin: '6px 0 0', color: '#1A2E5A', fontSize: 13 }}>{item.label_fr}</h3>
                  <p style={{ margin: '6px 0 0', color: '#1A2E5A', fontSize: 12 }}>
                    Branches : {item.suggested_branches.join(', ')}
                  </p>
                  <p style={{ margin: '6px 0 0', color: '#6F6255', fontSize: 11, lineHeight: 1.45 }}>
                    {item.rationale_fr}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {response?.resources?.functional_needs && response.resources.functional_needs.length > 0 && (
        <div style={{ marginTop: 14, ...miniCardStyle() }}>
          <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>
            ressources · triade de preuves
          </p>
          <p style={{ margin: '8px 0 0', color: '#6F6255', fontSize: 12, lineHeight: 1.55 }}>
            Plan de recherche passif : quelles preuves chercher pour legitimer, proteger / contester, produire / maintenir.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginTop: 10 }}>
            {response.resources.functional_needs.map((need) => (
              <div key={need.family} style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 10, background: '#fff' }}>
                <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 10 }}>
                  priorite {need.priority}
                </p>
                <h3 style={{ margin: '6px 0 0', color: '#1A2E5A', fontSize: 13 }}>{need.label_fr}</h3>
                <p style={{ margin: '6px 0 0', color: '#6F6255', fontSize: 11, lineHeight: 1.45 }}>
                  {need.question_fr}
                </p>
                <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
                  Canaux : {need.channels.join(', ')}
                </p>
                <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
                  Preuves : {need.expected_evidence_fr.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {response?.pipeline_trace?.steps && response.pipeline_trace.steps.length > 0 && (
        <div style={{ marginTop: 14, ...miniCardStyle() }}>
          <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>diagnostic par couche</p>
          <p style={{ margin: '8px 0 0', color: '#6F6255', fontSize: 12, lineHeight: 1.55 }}>
            Ce tableau sert a eviter les patchs de cas : chaque symptome est rattache a la couche canonique qui le produit.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 10 }}>
            {response.pipeline_trace.steps.map((step) => (
              <div key={step.stage_id} style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 12, background: '#fff' }}>
                <p style={{ margin: 0, color: '#1A2E5A', fontFamily: 'monospace', fontSize: 11 }}>
                  {layerLabel(step.stage_id)}
                </p>
                <p style={{ margin: '6px 0 0', color: outcomeColor(step.outcome), fontSize: 12, fontWeight: 700 }}>
                  {step.outcome} · {step.duration_ms}/{step.budget_ms} ms
                </p>
                {step.over_budget && (
                  <p style={{ margin: '6px 0 0', color: '#B23A3A', fontSize: 11 }}>
                    Hors budget de latence.
                  </p>
                )}
                {step.warnings && step.warnings.length > 0 && (
                  <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
                    {step.warnings[0]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {response?.writing?.situation_card && (
        <div style={{ marginTop: 14, ...miniCardStyle() }}>
          <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>writing contract</p>
          <h3 style={{ margin: '8px 0 0', color: '#1A2E5A', fontSize: 14 }}>
            {response.writing.situation_card.title_fr}
          </h3>
          <p style={{ margin: '8px 0 0', color: '#6F6255', fontSize: 12, lineHeight: 1.55 }}>
            {response.writing.situation_card.insight_fr}
          </p>
          <p style={{ margin: '10px 0 0', color: '#1A2E5A', fontSize: 12, lineHeight: 1.55 }}>
            <strong>Vulnerabilite :</strong> {response.writing.situation_card.main_vulnerability_fr}
          </p>
          <p style={{ margin: '8px 0 0', color: '#1A2E5A', fontSize: 12, lineHeight: 1.55 }}>
            <strong>Signal :</strong> {response.writing.situation_card.key_signal_fr}
          </p>
          {response.writing.diamond_sentences?.[0]?.text_fr && (
            <p style={{ margin: '10px 0 0', color: '#C8951A', fontSize: 13, lineHeight: 1.45, fontStyle: 'italic' }}>
              {response.writing.diamond_sentences[0].text_fr}
            </p>
          )}
        </div>
      )}

      {response?.writing?.lecture?.text_fr && (
        <div style={{ marginTop: 14, ...miniCardStyle() }}>
          <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>lecture minimale</p>
          <p style={{ margin: '8px 0 0', color: '#6F6255', fontSize: 12, lineHeight: 1.6 }}>
            {response.writing.lecture.text_fr}
          </p>
          <p style={{ margin: '8px 0 0', color: '#8B8174', fontSize: 11 }}>
            {response.writing.lecture.word_count_fr ?? 0} mots
          </p>
        </div>
      )}

      {response?.generation_archive?.event && (
        <div style={{ marginTop: 14, ...miniCardStyle() }}>
          <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>generation event</p>
          <p style={{ margin: '8px 0 0', color: '#6F6255', fontSize: 12, lineHeight: 1.55 }}>
            Trace mesurable sans contenu brut : hash input, taille, domaine, intention, ressources, qualite et latence.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginTop: 10 }}>
            {[
              ['mode', response.generation_archive.event.privacy_mode],
              ['hash', response.generation_archive.event.raw_input_hash],
              ['input', `${response.generation_archive.event.input_chars ?? 0} chars`],
              ['sources', String(response.generation_archive.event.resources_count ?? 0)],
              ['status', response.generation_archive.event.generation_status],
              ['latence', `${response.generation_archive.event.latency_ms ?? 0} ms`],
            ].map(([label, value]) => (
              <div key={label} style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 10, background: '#fff' }}>
                <p style={{ margin: 0, color: '#8B8174', fontFamily: 'monospace', fontSize: 10 }}>{label}</p>
                <p style={{ margin: '5px 0 0', color: '#1A2E5A', fontSize: 12 }}>{value}</p>
              </div>
            ))}
          </div>
          {response.generation_archive.archive_decision?.reason && (
            <p style={{ margin: '10px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
              {response.generation_archive.archive_decision.reason}
            </p>
          )}
        </div>
      )}

      {firstBlindSpots.length > 0 && (
        <>
          <div style={{ marginTop: 14, ...miniCardStyle() }}>
            <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>
              angles morts integres a la reponse
            </p>
            <p style={{ margin: '8px 0 0', color: '#6F6255', fontSize: 12, lineHeight: 1.55 }}>
              Ces pistes ne sont pas une enquete externe. Elles sont la matiere que SC doit integrer dans Lecture
              et Approfondir : ce qui manque, ce qui ferait changer la conclusion, et quelle preuve chercher.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 10 }}>
            {firstBlindSpots.map((blindSpot) => (
              <div key={blindSpot.blind_spot} style={miniCardStyle()}>
                <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>
                  contrat admin · {inquiryLevelLabel(blindSpot.level)}
                </p>
                <h3 style={{ margin: '6px 0 0', fontSize: 13 }}>{blindSpot.blind_spot}</h3>
                <p style={{ margin: '8px 0 0', color: '#1A2E5A', fontSize: 12, lineHeight: 1.45 }}>
                  {publicInquiryQuestion(blindSpot.blind_spot)}
                </p>
                <p style={{ margin: '8px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
                  Preuve attendue : {blindSpot.decisive_evidence}
                </p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              data-testid="generate-v2-evidence-search-button"
              onClick={() => setEvidenceSearchRequested(true)}
              style={{
                border: '1px solid #C8951A',
                color: '#1A2E5A',
                background: evidenceSearchRequested ? '#F8EFD8' : '#fff',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Chercher les preuves
            </button>
            <span style={{ marginLeft: 10, color: '#8B8174', fontSize: 12 }}>
              {evidenceSearchRequested
                ? 'Recherche probatoire non branchee : prochaine brique EvidenceSearch.'
                : 'future enquete web / sources, non branchee dans ce banc d essai'}
            </span>
          </div>
        </>
      )}
    </section>
  )
}
