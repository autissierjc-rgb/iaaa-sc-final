import type { GroundedFact, GroundingContract, ResourceServiceContract, WritingContract } from '../contracts'
import type { SituationCard, SituationDomain } from '../resources/resourceContract'

// Boundary rule:
// These validators do not interpret any user text from the chat.
// ChatGPT/model interpretation is the sole authority for intent, domain, angle,
// follow-up meaning, and the faithful formalization of Situation soumise.
// Validators only report incoherence against that already interpreted contract.

export type DiamondValidationLevel = 'info' | 'warning' | 'error'

export type DiamondValidationIssue = {
  level: DiamondValidationLevel
  code: string
  message: string
  field?: string
}

export type DiamondValidationResult = {
  ok: boolean
  issues: DiamondValidationIssue[]
}

export type DiamondValidationContext = {
  grounding?: GroundingContract
  resources?: ResourceServiceContract
}

const DOMAIN_FORBIDDEN_TERMS: Record<SituationDomain, RegExp[]> = {
  geopolitics: [
    /\btraction\b/i,
    /\bgo[- ]?to[- ]?market\b/i,
    /\bpipeline commercial\b/i,
    /\bdistribution produit\b/i,
    /\benfant int[eé]rieur\b/i,
  ],
  war: [
    /\btraction\b/i,
    /\bgo[- ]?to[- ]?market\b/i,
    /\bpipeline commercial\b/i,
    /\bdistribution produit\b/i,
    /\bblessure relationnelle\b/i,
  ],
  management: [
    /\bdissuasion nucl[eé]aire\b/i,
    /\bd[eé]troit\b/i,
    /\bCGRI\b/i,
    /\bIRGC\b/i,
  ],
  professional: [
    /\bdissuasion nucl[eé]aire\b/i,
    /\bd[eé]troit\b/i,
    /\bCGRI\b/i,
    /\bIRGC\b/i,
  ],
  governance: [
    /\bdissuasion nucl[eé]aire\b/i,
    /\bd[eé]troit\b/i,
    /\benfant int[eé]rieur\b/i,
  ],
  startup_vc: [
    /\bCGRI\b/i,
    /\bIRGC\b/i,
    /\bdissuasion nucl[eé]aire\b/i,
    /\bconflit de loyaut[eé] familial\b/i,
  ],
  economy: [
    /\benfant int[eé]rieur\b/i,
    /\bblessure relationnelle\b/i,
    /\bCGRI\b/i,
  ],
  humanitarian: [
    /\btraction\b/i,
    /\bgo[- ]?to[- ]?market\b/i,
    /\benfant int[eé]rieur\b/i,
  ],
  personal: [
    /\btraction\b/i,
    /\bgo[- ]?to[- ]?market\b/i,
    /\bpipeline commercial\b/i,
    /\bCGRI\b/i,
    /\bIRGC\b/i,
    /\bd[eé]troit d['’ ]?Ormuz\b/i,
    /\binfrastructure critique\b/i,
  ],
  general: [],
}

const GENERIC_PHRASES = [
  /lecture centr[eé]e sur la dynamique interne de la situation/i,
  /syst[eè]me sous contrainte/i,
  /le c[œo]ur concret de la situation se concentre autour de/i,
  /lecture syst[eè]me indisponible pour cette carte/i,
  /structural reading from available signals/i,
  /la situation ne se joue pas seulement dans l[’']?[eé]v[eé]nement visible/i,
  /distribution des leviers r[eé]els/i,
  /qui peut agir, bloquer, l[eé]gitimer, financer, user ou faire basculer/i,
  /la fa[cç]ade peut encore fonctionner/i,
  /quelle force r[eé]elle la soutient/i,
  /ce qui para[iî]t stable d[eé]pend d[’']un levier discret/i,
  /ce que le syst[eè]me ne prot[eè]ge plus pendant qu[’']il g[eè]re l[’']urgence visible/i,
  /ne se tranche pas par une formule g[eé]n[eé]rale/i,
  /la lecture doit partir des acteurs et passages oblig[eé]s/i,
  /acteurs et passages oblig[eé]s d[eé]j[aà] visibles/i,
  /tant que ce point n[’']est pas reli[eé] [aà] une trace v[eé]rifiable/i,
  /elle indique une hypoth[eè]se de travail, pas une conclusion ferm[eé]e/i,
  /c[’']est ce type de trace qui permet de passer d[’']une impression g[eé]n[eé]rale/i,
  /un fait, une d[eé]cision, un document ou un changement de calendrier v[eé]rifiable/i,
  /les r[eè]gles, proc[eé]dures ou contraintes qui peuvent transformer la situation/i,
  /acteurs visibles,\s*contraintes mat[eé]rielles,\s*r[eè]gles et institutions,\s*r[eé]cit dominant/i,
  /le levier r[eé]el qui n[’']est pas encore prot[eé]g[eé] ou clarifi[eé]/i,
  /rythmes,\s*d[eé]lais,\s*fen[eê]tres d[’']action et risque de retard/i,
  /plusieurs options restent ouvertes,\s*mais elles ne prot[eè]gent pas les m[eê]mes risques/i,
  /\bMandat officiel\b/i,
  /\bR[oô]le r[eé]el\b/i,
  /\bHi[eé]rarchie et arbitrage\b/i,
  /\bCharge collective\b/i,
  /\bchoose_action\b/i,
  /qui d[eé]cide, qui porte la charge, qui bloque, qui rend possible/i,
  /la contestation trouve un relais capable de ralentir ou d[eé]l[eé]gitimer la proc[eé]dure/i,
  /fait opposable/i,
]

const FINAL_PUBLIC_MECHANICAL_PATTERNS = [
  /\b[^.?!\n]{2,120}\s+exposent la tension,\s*mais\b/i,
  /\brendent la situation visible,\s*mais\b/i,
  /\bsi elle reste contenue,\s*n[eé]goci[eé]e ou convertie\b/i,
  /\ble point fragile est\s+la vuln[eé]rabilit[eé] centrale est\b/i,
  /\bles faits publics retenus d[eé]placent la lecture\s*:\s*[A-ZÉÈÀÂÎÏÔÛÇ][^.?!\n]{20,}/i,
  /\b(?:de|[aà])\s+les\s+(?:autorit[eé]s|institutions|canaux|march[eé]s|gouvernements|dirigeants|alliances)\b/i,
  /\b(?:si|quand)\s+[A-ZÉÈÀÂÎÏÔÛÇ][^.!?\n]{20,}\?,\s+un\s+signal\b/i,
]

const PUBLIC_SCAFFOLDING_PATTERNS = [
  /pr[eé]cisions?\s*:/i,
  /vous [eé]voquez plusieurs options/i,
  /quelles sont les 2 ou 3 options [aà] comparer/i,
  /dois-je d[’']abord proposer une carte exploratoire/i,
  /r[eé]pondez librement,\s*ou g[eé]n[eé]rez une carte exploratoire/i,
]

const CONCRETE_SIGNAL = /\b[A-ZÉÈÀÂÎÏÔÛÇ][A-Za-zÀ-ÿ'’-]{2,}\b|\b\d{4}\b|\b\d{1,2}\s+(janvier|f[eé]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[eé]cembre)\b|https?:\/\//i

function normalizeForReadiness(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function collectPublicText(value: unknown, parts: string[]): void {
  if (typeof value === 'string') {
    parts.push(value)
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) collectPublicText(item, parts)
    return
  }

  if (value && typeof value === 'object') {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      collectPublicText(nested, parts)
    }
  }
}

function collectCardText(sc: SituationCard): string {
  const record = sc as Record<string, unknown>
  const publicFields = [
    'title_fr',
    'title_en',
    'submitted_situation_fr',
    'submitted_situation_en',
    'insight_fr',
    'insight_en',
    'main_vulnerability_fr',
    'main_vulnerability_en',
    'asymmetry_fr',
    'asymmetry_en',
    'key_signal_fr',
    'key_signal_en',
    'avertissement_fr',
    'lecture_systeme_fr',
    'lecture_systeme_en',
    'approfondir_fr',
    'approfondir_en',
    'constraints_fr',
    'constraints_en',
    'uncertainties_fr',
    'uncertainties_en',
    'trajectories',
    'cap',
    'movements_fr',
    'movements_en',
  ]
  const parts: string[] = []
  for (const field of publicFields) {
    collectPublicText(record[field], parts)
  }
  return parts.join('\n')
}

function issue(level: DiamondValidationLevel, code: string, message: string, field?: string): DiamondValidationIssue {
  return { level, code, message, field }
}

function significantFactTokens(value: string): string[] {
  const genericTokens = new Set([
    'source',
    'sources',
    'public',
    'publique',
    'preuve',
    'preuves',
    'situation',
    'acteurs',
    'decision',
    'officielle',
    'documentee',
    'observable',
    'verifiable',
    'threshold',
    'warning',
    'warnings',
    'official',
  ])

  return Array.from(new Set(normalizeForReadiness(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 6 && !genericTokens.has(token))))
    .slice(0, 10)
}

function copiedSourceTitleInPublicText(
  resources: ResourceServiceContract | undefined,
  publicText: string,
): string | null {
  if (!resources?.public_sources.length) return null

  const normalizedText = normalizeForReadiness(publicText).replace(/[^a-z0-9]+/g, ' ')
  for (const source of resources.public_sources) {
    const tokens = significantFactTokens(source.title)
    if (tokens.length < 3) continue

    const normalizedTitle = normalizeForReadiness(source.title).replace(/[^a-z0-9]+/g, ' ').trim()
    if (normalizedTitle.length >= 28 && normalizedText.includes(normalizedTitle.slice(0, Math.min(80, normalizedTitle.length)))) {
      return source.title
    }

    for (let index = 0; index <= tokens.length - 3; index += 1) {
      const phrase = tokens.slice(index, index + 3).join(' ')
      if (normalizedText.includes(phrase)) return source.title
    }
  }

  return null
}

// Réparation miroir du juge : retire, phrase par phrase, tout passage qui
// recopie un titre de source, en utilisant exactement le même détecteur que le
// contrôle diamant. Retourne null si rien n'a changé. Un champ dont toutes les
// phrases seraient fautives est laissé intact : le contrôle final tranchera.
export function stripCopiedSourceTitleSentences(
  writing: WritingContract,
  resources: ResourceServiceContract | undefined,
): WritingContract | null {
  if (!resources?.public_sources.length) return null

  let changed = false
  const cleanText = (value: unknown): string => {
    const text = typeof value === 'string' ? value : ''
    if (!text.trim()) return text
    if (!copiedSourceTitleInPublicText(resources, text)) return text
    const sentences = text.split(/(?<=[.!?])\s+/)
    const kept = sentences.filter((sentence) => !copiedSourceTitleInPublicText(resources, sentence))
    const next = kept.join(' ').trim()
    if (!next || next === text.trim()) return text
    changed = true
    return next
  }

  const repaired: WritingContract = {
    ...writing,
    situation_card: {
      ...writing.situation_card,
      insight_fr: cleanText(writing.situation_card.insight_fr),
      main_vulnerability_fr: cleanText(writing.situation_card.main_vulnerability_fr),
      asymmetry_fr: cleanText(writing.situation_card.asymmetry_fr),
      key_signal_fr: cleanText(writing.situation_card.key_signal_fr),
    },
    lecture: {
      ...writing.lecture,
      text_fr: cleanText(writing.lecture.text_fr),
    },
    approfondir: {
      ...writing.approfondir,
      analysis_fr: cleanText(writing.approfondir.analysis_fr),
      sections_fr: writing.approfondir.sections_fr.map((section) => ({
        ...section,
        body: cleanText(section.body),
      })),
    },
    trajectories: writing.trajectories.map((trajectory) => ({
      ...trajectory,
      description_fr: cleanText(trajectory.description_fr),
      signal_fr: cleanText(trajectory.signal_fr),
    })),
    diamond_sentences: writing.diamond_sentences.map((sentence) => ({
      ...sentence,
      text_fr: cleanText(sentence.text_fr),
    })),
  }

  if (!changed) return null
  return {
    ...repaired,
    trace: {
      ...repaired.trace,
      notes: [
        ...(repaired.trace.notes ?? []),
        'copied_source_title_stripped_before_display',
      ],
    },
  }
}

// Même réparation au niveau de la carte assemblée : couvre les champs publics
// que collectCardText inspecte (y compris les champs hérités constraints_fr /
// uncertainties_fr) pour que le juge et le réparateur voient le même texte.
const CARD_PUBLIC_STRING_FIELDS = [
  'insight_fr',
  'insight_en',
  'main_vulnerability_fr',
  'main_vulnerability_en',
  'asymmetry_fr',
  'asymmetry_en',
  'key_signal_fr',
  'key_signal_en',
  'avertissement_fr',
  'lecture_systeme_fr',
  'lecture_systeme_en',
  'approfondir_fr',
  'approfondir_en',
  'constraints_fr',
  'constraints_en',
  'uncertainties_fr',
  'uncertainties_en',
  'movements_fr',
  'movements_en',
] as const

export function stripCopiedSourceTitlesFromCard(
  sc: SituationCard,
  resources: ResourceServiceContract | undefined,
): SituationCard | null {
  if (!resources?.public_sources.length) return null

  let changed = false
  const cleanValue = (value: unknown): unknown => {
    if (typeof value === 'string') {
      if (!value.trim() || !copiedSourceTitleInPublicText(resources, value)) return value
      const sentences = value.split(/(?<=[.!?])\s+/)
      const kept = sentences.filter((sentence) => !copiedSourceTitleInPublicText(resources, sentence))
      const next = kept.join(' ').trim()
      if (!next || next === value.trim()) return value
      changed = true
      return next
    }
    if (Array.isArray(value)) {
      return value
        .map((item) => cleanValue(item))
        .filter((item) => {
          if (typeof item !== 'string' || !item.trim()) return true
          if (!copiedSourceTitleInPublicText(resources, item)) return true
          changed = true
          return false
        })
    }
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, cleanValue(item)]),
      )
    }
    return value
  }

  const record = { ...(sc as Record<string, unknown>) }
  for (const field of CARD_PUBLIC_STRING_FIELDS) {
    record[field] = cleanValue(record[field])
  }
  record.trajectories = cleanValue(record.trajectories)
  record.cap = cleanValue(record.cap)

  if (!changed) return null
  return record as SituationCard
}

function factVisibleInPublicText(fact: GroundedFact, normalizedText: string): boolean {
  const tokens = significantFactTokens(fact.label_fr)
  if (tokens.length === 0) return false
  const tokenHits = tokens.filter((token) => normalizedText.includes(token)).length
  if (tokenHits >= Math.min(2, tokens.length)) return true

  for (let index = 0; index <= tokens.length - 2; index += 1) {
    if (normalizedText.includes(`${tokens[index]} ${tokens[index + 1]}`)) return true
  }

  return false
}

function validateGroundedAntiHorsSol(
  sc: SituationCard,
  context?: DiamondValidationContext,
): DiamondValidationIssue[] {
  const issues: DiamondValidationIssue[] = []
  const resources = context?.resources
  const grounding = context?.grounding
  const needsPublicGrounding = Boolean(
    resources?.needs_web ||
    resources?.policy === 'fast_sources_required' ||
    resources?.policy === 'url_extract_required' ||
    resources?.public_sources.length ||
    grounding?.permissions.must_mark_provisional,
  )
  if (!needsPublicGrounding) return issues

  const publicSourceFacts = (grounding?.current_facts ?? [])
    .filter((fact) => fact.source === 'resources')
  const publicText = normalizeForReadiness(collectCardText(sc))

  if (!grounding?.permissions.can_write_current_state || resources?.public_sources.length === 0) {
    issues.push(issue(
      'warning',
      'grounded_anti_hors_sol_current_facts_missing',
      'A current or source-dependent card has no public facts attached; it must stay provisional instead of asking the user for the source.',
      'grounding.current_facts',
    ))
    return issues
  }

  if (publicSourceFacts.length === 0) {
    issues.push(issue(
      'warning',
      'grounded_anti_hors_sol_public_fact_missing',
      'Sources are attached, but no clean public fact is available; public writing must stay qualified and avoid factual certainty.',
      'grounding.current_facts',
    ))
    return issues
  }

  if (!publicSourceFacts.some((fact) => factVisibleInPublicText(fact, publicText))) {
    issues.push(issue(
      'warning',
      'grounded_anti_hors_sol_public_fact_underused',
      'Grounding contains public facts, but the Situation Card output remains abstract instead of using one visible fact.',
      'writing',
    ))
  }

  return issues
}

export function validateDomainCoherence(sc: SituationCard, domain: SituationDomain): DiamondValidationResult {
  const text = collectCardText(sc)
  const issues = (DOMAIN_FORBIDDEN_TERMS[domain] ?? [])
    .filter((pattern) => pattern.test(text))
    .map((pattern) => issue(
      'warning',
      'domain_contamination',
      `Potential vocabulary contamination for domain "${domain}": ${pattern.source}`,
    ))

  return { ok: !issues.some((item) => item.level === 'error'), issues }
}

export function validateAntiHorsSol(
  sc: SituationCard,
  context?: DiamondValidationContext,
): DiamondValidationResult {
  const text = collectCardText(sc)
  const issues: DiamondValidationIssue[] = validateGroundedAntiHorsSol(sc, context)

  for (const pattern of GENERIC_PHRASES) {
    if (pattern.test(text)) {
      issues.push(issue('error', 'generic_phrase', `Generic or fallback phrase detected: ${pattern.source}`))
    }
  }

  for (const pattern of FINAL_PUBLIC_MECHANICAL_PATTERNS) {
    if (pattern.test(text)) {
      issues.push(issue(
        'error',
        'mechanical_public_spine',
        `Final public card still exposes a mechanical spine instead of diamond writing: ${pattern.source}`,
      ))
    }
  }

  const copiedSourceTitle = copiedSourceTitleInPublicText(context?.resources, text)
  if (copiedSourceTitle) {
    issues.push(issue(
      'error',
      'source_title_copied_into_public_card',
      `Final public card copied a source title instead of translating it into a qualified fact: ${copiedSourceTitle}`,
      'writing',
    ))
  }

  for (const pattern of PUBLIC_SCAFFOLDING_PATTERNS) {
    if (pattern.test(text)) {
      issues.push(issue('error', 'public_scaffolding', `Dialogue or UI scaffolding leaked into public card: ${pattern.source}`))
    }
  }

  const hasConcreteSignal = CONCRETE_SIGNAL.test(text)
  if (!hasConcreteSignal) {
    issues.push(issue(
      'warning',
      'missing_concrete_anchor',
      'No obvious concrete anchor detected: actor, named place, date, URL, or proper noun.',
    ))
  }

  const hasBlindSpot =
    /\bangle mort\b|\bangles morts\b|\binvisible\b|\bnon[- ]dit\b|\bimplicite\b|\bce qui manque\b|\babsence(?:\s+\w+){0,3}\s+d[ée]cisive\b|\bpreuve(?:s)?\s+manquante?s?\b|\bcontre[- ]hypoth[eè]se?s?\b|\brenverser la lecture\b|\bchanger la lecture\b/i.test(text)
  if (!hasBlindSpot) {
    issues.push(issue(
      'info',
      'blind_spot_not_explicit',
      'No explicit blind spot wording detected. This may be acceptable, but axis VI should still search missing angles.',
    ))
  }

  return { ok: !issues.some((item) => item.level === 'error'), issues }
}

export function validateScoringCoherence(sc: SituationCard): DiamondValidationResult {
  const state = Number(sc.state_index_final)
  const scores = Array.isArray(sc.astrolabe_scores) ? sc.astrolabe_scores : []
  const dominant = scores.filter((entry) => Number((entry as Record<string, unknown>).display_score) === 3).length
  const moderate = scores.filter((entry) => Number((entry as Record<string, unknown>).display_score) === 2).length
  const issues: DiamondValidationIssue[] = []

  if (Number.isFinite(state) && state < 40 && moderate > 2) {
    issues.push(issue(
      'warning',
      'stable_with_many_moderates',
      'Stable state should not display many moderate astrolabe branches.',
      'astrolabe_scores',
    ))
  }

  if (dominant > 2) {
    issues.push(issue(
      'warning',
      'too_many_dominants',
      'More than two dominant branches weakens astrolabe hierarchy.',
      'astrolabe_scores',
    ))
  }

  if (moderate > 3) {
    issues.push(issue(
      'warning',
      'too_many_moderates',
      'More than three moderate branches can flatten the astrolabe.',
      'astrolabe_scores',
    ))
  }

  return { ok: !issues.some((item) => item.level === 'error'), issues }
}

export function validateDiamondContract(
  sc: SituationCard,
  domain: SituationDomain,
  context?: DiamondValidationContext,
): DiamondValidationResult {
  const results = [
    validateDomainCoherence(sc, domain),
    validateAntiHorsSol(sc, context),
    validateScoringCoherence(sc),
  ]
  const issues = results.flatMap((result) => result.issues)
  return { ok: !issues.some((item) => item.level === 'error'), issues }
}

export function buildDiamondClarificationQuestions(issues: DiamondValidationIssue[]): string[] {
  const codes = new Set(issues.map((item) => item.code))
  const errorCodes = new Set(issues.filter((item) => item.level === 'error').map((item) => item.code))

  if (
    errorCodes.has('mechanical_public_spine') ||
    errorCodes.has('source_title_copied_into_public_card') ||
    errorCodes.has('generic_phrase') ||
    errorCodes.has('public_scaffolding')
  ) {
    return [
      'La carte produite a été bloquée par le contrôle diamant. SC doit régénérer une lecture plus située ; ce n’est pas une précision à demander à l’utilisateur.',
    ]
  }

  if (codes.has('grounded_anti_hors_sol_current_facts_missing')) {
    return [
      'Les sources rapides n’ont pas donné de fait public suffisant. La carte doit rester provisoire et Recherche+ peut servir à vérifier la chronologie.',
    ]
  }

  if (codes.has('grounded_anti_hors_sol_public_fact_missing')) {
    return [
      'Les sources attachées ne donnent pas encore de fait public porteur. La carte doit qualifier son statut et indiquer quelle trace vérifier ensuite.',
    ]
  }

  if (codes.has('public_scaffolding')) {
    return [
      'La carte contient encore du texte de dialogue au lieu d une lecture publique. Quelle trace ou decision doit remplacer cette formulation avant publication ?',
    ]
  }

  if (codes.has('generic_phrase')) {
    return [
      'La redaction produite reste trop generale. Quel fait public, acteur decisionnaire ou seuil date doit servir d ancrage a la carte ?',
    ]
  }

  return [
    'Quel fait verifiable doit empecher la carte de rester generale ?',
  ]
}
