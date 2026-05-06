export type CockpitReliability = 'connected' | 'partial' | 'missing'

export interface CockpitSignal {
  id: string
  label: string
  source: string
  reliability: CockpitReliability
  note: string
}

export interface CockpitTrack {
  id: string
  label: string
  signals: CockpitSignal[]
}

export const COCKPIT_TRACKS: CockpitTrack[] = [
  {
    id: 'usage',
    label: 'Usage produit',
    signals: [
      {
        id: 'next-generate',
        label: 'Generations SIS actuelles',
        source: 'frontend/src/app/api/generate/route.ts',
        reliability: 'partial',
        note: 'Le moteur actuel genere bien les cartes, mais il ne persiste pas encore chaque appel dans une table admin.',
      },
      {
        id: 'backend-usage-events',
        label: 'Evenements usage backend',
        source: 'backend usage_events',
        reliability: 'partial',
        note: 'La table existe pour l ancien flux backend; elle ne couvre pas forcement le moteur Next actuel.',
      },
    ],
  },
  {
    id: 'users',
    label: 'Utilisateurs',
    signals: [
      {
        id: 'backend-users',
        label: 'Comptes et statuts',
        source: '/api/admin/users',
        reliability: 'connected',
        note: 'L ancien admin sait deja lister les utilisateurs, tiers, statuts et expirations via le backend.',
      },
      {
        id: 'admin-actions',
        label: 'Actions administrateur',
        source: 'admin_actions',
        reliability: 'connected',
        note: 'Les actions admin backend ont une piste d audit dediee.',
      },
    ],
  },
  {
    id: 'quality',
    label: 'Qualite SC',
    signals: [
      {
        id: 'diamond-regressions',
        label: 'Tests diamant',
        source: 'src/lib/governance',
        reliability: 'partial',
        note: 'Les cas de regression existent, mais ils ne sont pas encore affiches comme indicateurs dans l admin.',
      },
      {
        id: 'calibration-benchmark',
        label: 'Benchmark 10 SC fictives',
        source: 'src/lib/governance/scCalibrationBenchmark.md',
        reliability: 'partial',
        note: 'La grille produit existe maintenant: Insight, Vulnerability, Trajectories, Key Signal et Global Usefulness.',
      },
      {
        id: 'user-feedback',
        label: 'Retours utilisateurs sur cartes',
        source: 'a creer',
        reliability: 'missing',
        note: 'Il manque une collecte structuree: carte jugee utile, hors-sol, mal formalisee, ou incomplete.',
      },
    ],
  },
  {
    id: 'tensions',
    label: 'Scoring et tensions',
    signals: [
      {
        id: 'astrolabe-heuristics',
        label: 'Scores Astrolabe actuels',
        source: 'src/app/api/generate/route.ts',
        reliability: 'partial',
        note: 'Le scoring existe, mais il reste disperse dans des heuristiques comme guerre, crise, attribution causale, site, personnel ou decision.',
      },
      {
        id: 'domain-detection',
        label: 'Detection de domaine',
        source: 'src/lib/coverage/detectDomain.ts',
        reliability: 'partial',
        note: 'Les domaines sont detectes, mais ils ne forment pas encore un referentiel canonique de familles de tension.',
      },
      {
        id: 'canonical-tension-families',
        label: 'Referentiel familles de tension',
        source: 'src/lib/tensions/tensionFamilies.ts',
        reliability: 'missing',
        note: 'A creer plus tard: crise institutionnelle, guerre, lien affectif, startup, management, site, droit, sante, ecole et adolescence.',
      },
    ],
  },
  {
    id: 'resources',
    label: 'Ressources et web',
    signals: [
      {
        id: 'tavily-flow',
        label: 'Recherche et extraction URL',
        source: 'src/lib/resources',
        reliability: 'partial',
        note: 'Le flux ressources existe cote serveur Next; il faut encore tracer succes, echec, sources et latence.',
      },
      {
        id: 'public-sources',
        label: 'Sources publiques affichees',
        source: 'resources attached to SC output',
        reliability: 'partial',
        note: 'Les sources sont attachees aux cartes, mais leur presence doit devenir mesurable dans le cockpit.',
      },
    ],
  },
]

export function reliabilityLabel(value: CockpitReliability): string {
  if (value === 'connected') return 'branche'
  if (value === 'partial') return 'partiel'
  return 'a creer'
}

export function reliabilityClass(value: CockpitReliability): string {
  if (value === 'connected') return 'bg-emerald-950 text-emerald-300 border-emerald-800'
  if (value === 'partial') return 'bg-amber-950 text-amber-300 border-amber-800'
  return 'bg-gray-900 text-gray-400 border-gray-800'
}
