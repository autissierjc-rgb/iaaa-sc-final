import Link from 'next/link'
import GenerateV2Tester from './GenerateV2Tester'
import ReactionV2Tester from './ReactionV2Tester'
import ResourcePolicyMatrix from './ResourcePolicyMatrix'
import {
  V2_FOUNDATION_BRICKS,
  statusLabel,
} from '@/lib/admin/v2CockpitContract'
import {
  SITUATION_CARD_V2_PIPELINE,
  pipelineTotals,
} from '@/lib/pipeline/V2PipelineBlueprint'
import {
  buildPipelineRunTrace,
  summarizePipelineRun,
} from '@/lib/pipeline/PipelineTelemetry'
import { buildCalibrationEvidence } from '@/lib/quality/CalibrationEvidence'
import { buildUserReactionEvent } from '@/lib/archive'

const NEXT_STEPS = [
  'Brancher une route V2 separee, sans toucher a /sis.',
  'Afficher une generation contractuelle de test dans ce cockpit.',
  'Ajouter Launch Learning Snapshot en base, avec suppression et mode sensible.',
  'Tester le benchmark canonique avant tout remplacement public.',
]

function statusColor(status: string) {
  if (status === 'wired') return '#1D9E75'
  if (status === 'passive') return '#378ADD'
  return '#8B8174'
}

export default function SisSystemV2Page() {
  const passive = V2_FOUNDATION_BRICKS.filter((brick) => brick.status === 'passive').length
  const wired = V2_FOUNDATION_BRICKS.filter((brick) => brick.status === 'wired').length
  const pipeline = pipelineTotals(SITUATION_CARD_V2_PIPELINE)
  const sampleTrace = buildPipelineRunTrace({
    id: 'v2-sample-trace',
    route: '/api/generate-v2',
    blueprint: SITUATION_CARD_V2_PIPELINE,
    created_at: '2026-05-07T00:00:00.000Z',
    measurements: SITUATION_CARD_V2_PIPELINE.stages.map((stage) => ({
      stage_id: stage.id,
      duration_ms: Math.round(stage.latency_budget_ms * 0.42),
      outcome: 'ok',
    })),
  })
  const sampleSummary = summarizePipelineRun(sampleTrace)
  const sampleCalibration = buildCalibrationEvidence({
    insight:
      'La V2 ne cherche pas un meilleur prompt, mais une chaine de contrats qui rend visible la comprehension, le theatre reel, le scoring et la qualite.',
    main_vulnerability:
      'La fragilite centrale serait de brancher la generation publique avant que chaque couche puisse prouver ce qu elle consomme et ce qu elle produit.',
    trajectories: [
      'Fondations passives',
      'Branchement route V2 separee',
      'Remplacement public apres benchmark',
    ],
    key_signal:
      'Le signal decisif sera une carte test qui passe le benchmark sans hors-sol, sans header faible et sans clarification inutile.',
    global_usefulness:
      'Cette page aide a piloter la refonte en montrant les contrats poses, leur ordre, leur mesure et les criteres qui diront si une SC est utile.',
    concrete_anchor_count: 4,
    has_diamond_sentence: true,
    has_observable_signal: true,
  })
  const sampleReactions = [
    "Le header ne formalise pas la question.",
    "Waouh, le diamant tranchant touche juste.",
    "Les ressources sont trop pauvres pour ce sujet.",
    "Pourquoi le scoring met 49 alors que la crise est forte ?",
  ].map((message) => buildUserReactionEvent({ message }))
  const reactionLayerCounts = sampleReactions.reduce<Record<string, number>>((acc, reaction) => {
    for (const layer of reaction.probable_layers) acc[layer] = (acc[layer] ?? 0) + 1
    return acc
  }, {})

  return (
    <main style={{ minHeight: '100vh', background: '#F5F0E8', color: '#1A2E5A', padding: '28px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <Link href="/sis-system?lang=fr" style={{ color: '#9A8860', fontSize: 12, textDecoration: 'none' }}>
            ← SIS system
          </Link>
          <Link href="/sis" style={{ color: '#9A8860', fontSize: 12, textDecoration: 'none' }}>
            /sis
          </Link>
        </nav>

        <section style={{ marginBottom: 26 }}>
          <p style={{ color: '#C8951A', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 8 }}>
            Situation Card V2
          </p>
          <h1 style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: 'clamp(2.4rem, 5vw, 4.2rem)', lineHeight: 1, margin: 0 }}>
            Fondations visibles
          </h1>
          <p style={{ maxWidth: 760, color: '#6F6255', lineHeight: 1.7, fontSize: 14, marginTop: 14 }}>
            Cette page montre les briques V2 deja commitees. Elles existent dans le code,
            mais ne remplacent pas encore le flux public de <span style={{ fontFamily: 'monospace' }}>/sis</span>.
          </p>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { value: V2_FOUNDATION_BRICKS.length, label: 'briques V2 commitees', color: '#1A2E5A' },
            { value: passive, label: 'fondations passives', color: '#378ADD' },
            { value: wired, label: 'briques branchees au public', color: '#1D9E75' },
            { value: pipeline.stage_count, label: 'etapes pipeline', color: '#C8951A' },
          ].map((item) => (
            <div key={item.label} style={{ background: '#fff', border: '1px solid #E1D6C2', borderRadius: 8, padding: 18 }}>
              <div style={{ color: item.color, fontSize: 30, fontWeight: 700 }}>{item.value}</div>
              <div style={{ color: '#8B8174', fontSize: 12, marginTop: 4 }}>{item.label}</div>
            </div>
          ))}
        </section>

        <section style={{ background: '#fff', border: '1px solid #E1D6C2', borderRadius: 8, padding: 18, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ maxWidth: 760 }}>
              <h2 style={{ margin: 0, fontSize: 15 }}>Pipeline contractuel</h2>
              <p style={{ color: '#6F6255', lineHeight: 1.65, fontSize: 13, margin: '10px 0 0' }}>
                {SITUATION_CARD_V2_PIPELINE.principle}
              </p>
            </div>
            <div style={{ color: '#8B8174', fontSize: 12, lineHeight: 1.8 }}>
              <div><strong style={{ color: '#1A2E5A' }}>{pipeline.total_latency_budget_ms} ms</strong> budget cumule</div>
              <div><strong style={{ color: '#1A2E5A' }}>{pipeline.blocking_stages}</strong> etapes bloquantes</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12, marginTop: 16 }}>
            {SITUATION_CARD_V2_PIPELINE.stages.map((stage) => (
              <article key={stage.id} style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 14, background: '#FCFAF6' }}>
                <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 11 }}>
                  {String(stage.order).padStart(2, '0')} · {stage.owner_layer}
                </p>
                <h3 style={{ margin: '6px 0 0', fontSize: 14 }}>{stage.label}</h3>
                <p style={{ color: '#6F6255', lineHeight: 1.55, fontSize: 12, margin: '8px 0 0' }}>{stage.purpose}</p>
                <p style={{ color: '#8B8174', fontSize: 11, margin: '10px 0 0' }}>
                  Budget {stage.latency_budget_ms} ms · {stage.blocks_generation ? 'bloquant' : 'non bloquant'}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ background: '#fff', border: '1px solid #E1D6C2', borderRadius: 8, padding: 18, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ maxWidth: 760 }}>
              <h2 style={{ margin: 0, fontSize: 15 }}>Reaction telemetry</h2>
              <p style={{ color: '#6F6255', lineHeight: 1.65, fontSize: 13, margin: '10px 0 0' }}>
                Fondation passive : classer les reactions du chat par couche canonique, type, intensite et termes
                indicateurs, sans conserver le texte brut par defaut.
              </p>
            </div>
            <div style={{ color: '#8B8174', fontSize: 12, lineHeight: 1.8 }}>
              <div><strong style={{ color: '#1A2E5A' }}>{sampleReactions.length}</strong> exemples</div>
              <div><strong style={{ color: '#1A2E5A' }}>{Object.keys(reactionLayerCounts).length}</strong> couches touchees</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10, marginTop: 16 }}>
            {sampleReactions.map((reaction) => (
              <div key={reaction.id} style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 12, background: '#FCFAF6' }}>
                <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 10 }}>
                  {reaction.reaction_kind} · intensite {reaction.intensity}
                </p>
                <p style={{ margin: '7px 0 0', color: '#1A2E5A', fontSize: 12 }}>
                  couches : {reaction.probable_layers.join(', ')}
                </p>
                <p style={{ margin: '7px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>
                  termes : {reaction.evidence_terms.length > 0 ? reaction.evidence_terms.join(', ') : 'aucun terme direct'}
                </p>
                <p style={{ margin: '7px 0 0', color: '#8B8174', fontFamily: 'monospace', fontSize: 10 }}>
                  hash {reaction.message_hash} · {reaction.message_chars} chars
                </p>
              </div>
            ))}
          </div>
        </section>

        <ReactionV2Tester />

        <ResourcePolicyMatrix />

        <section style={{ background: '#fff', border: '1px solid #E1D6C2', borderRadius: 8, padding: 18, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ maxWidth: 760 }}>
              <h2 style={{ margin: 0, fontSize: 15 }}>Mesure des generations</h2>
              <p style={{ color: '#6F6255', lineHeight: 1.65, fontSize: 13, margin: '10px 0 0' }}>
                La V2 separe ce qui est conserve de ce qui est mesure. Toutes les generations peuvent produire une trace
                technique de pipeline, mais toutes les cartes n ont pas vocation a etre conservees.
              </p>
            </div>
            <div style={{ color: '#8B8174', fontSize: 12, lineHeight: 1.8 }}>
              <div><strong style={{ color: '#1A2E5A' }}>{sampleTrace.total_duration_ms} ms</strong> exemple trace</div>
              <div><strong style={{ color: '#1A2E5A' }}>{sampleSummary.over_budget}</strong> etape hors budget</div>
              <div><strong style={{ color: '#1A2E5A' }}>{sampleSummary.failed}</strong> echec bloquant</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 16 }}>
            {sampleTrace.steps.map((step) => (
              <div key={step.stage_id} style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 12, background: '#FCFAF6' }}>
                <p style={{ margin: 0, color: '#1A2E5A', fontFamily: 'monospace', fontSize: 11 }}>{step.stage_id}</p>
                <p style={{ margin: '7px 0 0', color: step.over_budget ? '#B23A3A' : '#1D9E75', fontSize: 12 }}>
                  {step.duration_ms} / {step.budget_ms} ms · {step.outcome}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ background: '#fff', border: '1px solid #E1D6C2', borderRadius: 8, padding: 18, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ maxWidth: 760 }}>
              <h2 style={{ margin: 0, fontSize: 15 }}>Exemple de calibration diamant</h2>
              <p style={{ color: '#6F6255', lineHeight: 1.65, fontSize: 13, margin: '10px 0 0' }}>
                Bloc statique de reference. Il montre la grille historique, mais ne note pas encore la generation testee :
                le vrai score sera branche lorsque WritingEngine produira SC, Lecture et Approfondir.
              </p>
            </div>
            <div style={{ color: '#8B8174', fontSize: 12, lineHeight: 1.8 }}>
              <div><strong style={{ color: '#1A2E5A' }}>{sampleCalibration.total} / 25</strong> exemple statique</div>
              <div><strong style={{ color: '#1A2E5A' }}>{sampleCalibration.average}</strong> moyenne</div>
              <div><strong style={{ color: '#1A2E5A' }}>{sampleCalibration.verdict}</strong> verdict</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, marginTop: 16 }}>
            {sampleCalibration.criteria.map((criterion) => (
              <div key={criterion.id} style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 12, background: '#FCFAF6' }}>
                <p style={{ margin: 0, color: '#1A2E5A', fontSize: 13, fontWeight: 700 }}>{criterion.label}</p>
                <p style={{ margin: '7px 0 0', color: '#C8951A', fontSize: 18, fontWeight: 700 }}>{criterion.score} / 5</p>
                <p style={{ margin: '6px 0 0', color: '#8B8174', fontSize: 11, lineHeight: 1.45 }}>{criterion.evidence}</p>
              </div>
            ))}
          </div>
        </section>

        <GenerateV2Tester />

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
          {V2_FOUNDATION_BRICKS.map((brick) => (
            <article key={brick.id} style={{ background: '#fff', border: '1px solid #E1D6C2', borderRadius: 8, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 15 }}>{brick.label}</h2>
                  <p style={{ margin: '5px 0 0', color: '#9A8860', fontFamily: 'monospace', fontSize: 11 }}>{brick.layer}</p>
                </div>
                <span style={{ color: statusColor(brick.status), border: `1px solid ${statusColor(brick.status)}`, borderRadius: 999, padding: '4px 8px', fontSize: 11 }}>
                  {statusLabel(brick.status)}
                </span>
              </div>
              <p style={{ color: '#6F6255', lineHeight: 1.65, fontSize: 13, marginTop: 14 }}>{brick.note}</p>
              <div style={{ borderTop: '1px solid #F0EBE0', marginTop: 14, paddingTop: 12 }}>
                <p style={{ margin: 0, color: '#8B8174', fontSize: 11 }}>Commit <span style={{ fontFamily: 'monospace', color: '#1A2E5A' }}>{brick.commit}</span></p>
                <ul style={{ margin: '8px 0 0', paddingLeft: 16 }}>
                  {brick.files.map((file) => (
                    <li key={file} style={{ color: '#8B8174', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.7 }}>{file}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </section>

        <section style={{ background: '#fff', border: '1px solid #E1D6C2', borderRadius: 8, padding: 18, marginTop: 16 }}>
          <h2 style={{ margin: 0, fontSize: 15 }}>Prochain branchement prudent</h2>
          <ol style={{ color: '#6F6255', lineHeight: 1.8, fontSize: 13 }}>
            {NEXT_STEPS.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </section>
      </div>
    </main>
  )
}
