export type V2FoundationStatus = 'passive' | 'wired' | 'planned'

export type V2FoundationBrick = {
  id: string
  label: string
  layer: string
  status: V2FoundationStatus
  commit: string
  files: string[]
  note: string
}

export const V2_FOUNDATION_BRICKS: V2FoundationBrick[] = [
  {
    id: 'generation-archive',
    label: 'Archive generations',
    layer: 'archive',
    status: 'passive',
    commit: 'be397f7',
    files: ['src/lib/contracts/generationArchive.ts'],
    note: 'Trace les generations et distingue metadata, snapshot prive, apprentissage lancement et partage public.',
  },
  {
    id: 'interpretation-dialogue',
    label: 'Interpretation + DialogueGate',
    layer: 'interpretation / dialogue',
    status: 'passive',
    commit: 'eab4b82',
    files: ['src/lib/interpretation', 'src/lib/dialogue'],
    note: 'Pose le LLM referent comme source canonique de comprehension et limite les clarifications bloquantes.',
  },
  {
    id: 'scoring',
    label: 'ScoringEngine',
    layer: 'scoring',
    status: 'passive',
    commit: 'da4dc74',
    files: ['src/lib/scoringV2'],
    note: 'Isole la formule canonique branches + radar avec garde-fous et warnings.',
  },
  {
    id: 'resources',
    label: 'ResourceService + SourceRouter',
    layer: 'resources',
    status: 'passive',
    commit: '2662e26',
    files: ['src/lib/resources/ResourceService.ts', 'src/lib/resources/SourceRouter.ts'],
    note: 'Planifie URL, fallback search et routage des sources par domaine sans appel reseau direct.',
  },
  {
    id: 'share',
    label: 'Politique de partage',
    layer: 'share',
    status: 'passive',
    commit: '6e2630e',
    files: ['src/lib/contracts/share.ts'],
    note: 'Separe snapshot stable, visibilite, anonymisation et metadata OpenGraph.',
  },
  {
    id: 'theatre',
    label: 'ConcreteTheatreBuilder',
    layer: 'theatre reel',
    status: 'passive',
    commit: '8865053',
    files: ['src/lib/theatre'],
    note: 'Construit les ancres visibles et signale les manques pour eviter la redaction hors-sol.',
  },
  {
    id: 'writing-contract',
    label: 'Contrat redaction diamant',
    layer: 'writing',
    status: 'passive',
    commit: '71c3a0a',
    files: ['src/lib/contracts/writing.ts'],
    note: 'Ajoute fond, forme, phrase diamant, probabilites et exemples averes/probables/plausibles.',
  },
  {
    id: 'safety',
    label: 'RiskAdviceGuard',
    layer: 'safety',
    status: 'passive',
    commit: 'fd336a8',
    files: ['src/lib/contracts/safety.ts', 'src/lib/safety'],
    note: 'Protege les domaines medicaux, juridiques, financiers, mineurs et high stakes.',
  },
  {
    id: 'expertises-metiers',
    label: 'ExpertisesMetiers',
    layer: 'expertisesMetiers',
    status: 'passive',
    commit: '2d462a4',
    files: ['src/lib/contracts/expertisesMetiers.ts', 'src/lib/expertisesMetiers'],
    note: 'Repertoire de questions expertes: preuves attendues, angles morts, sources, seuils et lentilles metiers.',
  },
  {
    id: 'writing-quality',
    label: 'WritingEngine + QualityGate',
    layer: 'writing / quality',
    status: 'passive',
    commit: '2a83364',
    files: ['src/lib/writing', 'src/lib/quality'],
    note: 'Produit une sortie contractuelle minimale et verifie hors-sol, phrase diamant, probabilites et scoring.',
  },
  {
    id: 'launch-learning',
    label: 'Launch Learning Mode',
    layer: 'archive / admin',
    status: 'passive',
    commit: '6801a4b',
    files: ['src/lib/contracts/generationArchive.ts', 'src/lib/governance'],
    note: 'Autorise un snapshot prive admin au lancement pour apprendre des vraies questions/reponses.',
  },
  {
    id: 'reaction-telemetry',
    label: 'Reaction telemetry',
    layer: 'archive / quality',
    status: 'passive',
    commit: 'pending',
    files: ['src/lib/contracts/generationArchive.ts', 'src/lib/archive/UserReactionTelemetry.ts'],
    note: 'Classe les reactions utilisateur par couche canonique, type de reaction, intensite et termes indicateurs sans stocker le texte brut par defaut.',
  },
  {
    id: 'generate-v2-dry-run',
    label: 'Route generate-v2 dry run',
    layer: 'api / pipeline',
    status: 'wired',
    commit: 'pending',
    files: ['src/app/api/generate-v2/route.ts'],
    note: 'Expose une route V2 separee qui renvoie les contrats interpretation, dialogue, theatre, scoring, enquete et trace pipeline sans remplacer /sis.',
  },
  {
    id: 'codex-session-protocol',
    label: 'Protocole session Codex',
    layer: 'governance / admin-cockpit',
    status: 'wired',
    commit: 'pending',
    files: ['src/lib/governance/codexSessionProtocol.md'],
    note: 'Fixe les regles de branche, status, build, commit, .env.local et anti-patch avant toute session V2.',
  },
]

export function statusLabel(status: V2FoundationStatus): string {
  if (status === 'wired') return 'branche'
  if (status === 'passive') return 'fondation passive'
  return 'prevu'
}

export function statusClass(status: V2FoundationStatus): string {
  if (status === 'wired') return 'border-emerald-800 bg-emerald-950 text-emerald-300'
  if (status === 'passive') return 'border-sky-800 bg-sky-950 text-sky-300'
  return 'border-gray-800 bg-gray-900 text-gray-400'
}
