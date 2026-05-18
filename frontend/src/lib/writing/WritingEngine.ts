import type {
  ConcreteTheatreContract,
  ExpertisesMetiersContract,
  InterpretationContract,
  ProbabilityAssessment,
  ResourceServiceContract,
  RiskAdviceGuardContract,
  ScoringContract,
  WritingContract,
} from '../contracts'
import type { HumanCollectivePatternContext } from '../patterns/humanCollective'
import { cleanModelText, parseModelJSON } from '../ai/json'
import { ASSERTION_LABELS_FR, compactSentence, containsForbiddenPublicPhrase, countWords } from './diamondRules'

export type WritingEngineInput = {
  interpretation: InterpretationContract
  safety: RiskAdviceGuardContract
  expertises_metiers: ExpertisesMetiersContract
  theatre: ConcreteTheatreContract
  scoring: ScoringContract
  resources?: ResourceServiceContract
  patterns?: HumanCollectivePatternContext
}

export type WritingEngineMode = 'local_contract' | 'referent_llm'

function joinVisible(items: string[], fallback: string): string {
  return items.length > 0 ? items.slice(0, 4).join(', ') : fallback
}

function normalizeAnchor(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)))
}

function isPublicPlaceholder(item: string): boolean {
  const normalized = normalizeAnchor(item)
  if ([
    'acteurs directs',
    'acteurs visibles',
    'acteurs impliques',
    'personnes impliquees',
    'dirigeant ou candidat nomme',
    'contraintes materielles',
    'regles et institutions',
    'recit dominant',
    'sources externes',
    'general analysis',
    'general_analysis',
    'understand situation',
    'understand_situation',
  ].includes(normalized)) return true

  return /^(acteurs?|institutions?|contraintes?|preuves?|sources?|signal|fait observable|trace verifiable|une trace verifiable|preuve publique)$/i.test(normalized)
}

function publicAnchors(items: string[], fallback: string, max = 4): string {
  const cleaned = unique(items).filter((item) => !isPublicPlaceholder(item))
  return (cleaned.length > 0 ? cleaned : [fallback]).slice(0, max).join(', ')
}

function theatreEvidenceLabels(theatre: ConcreteTheatreContract): string[] {
  return theatre.evidence.map((item) => item.label)
}

function theatreActionAnchors(theatre: ConcreteTheatreContract): string[] {
  return unique([
    ...theatre.visible_actions,
    ...theatre.procedures,
    ...theatre.constraints,
  ]).filter((item) => !isPublicPlaceholder(item))
}

function theatreProofAnchors(
  theatre: ConcreteTheatreContract,
  expertises: ExpertisesMetiersContract,
): string[] {
  return unique([
    ...theatreEvidenceLabels(theatre),
    ...theatre.visible_actions,
    ...theatre.constraints,
    ...expertises.evidence_to_seek,
  ]).filter((item) => !isPublicPlaceholder(item))
}

function theatreFragilityAnchors(
  theatre: ConcreteTheatreContract,
  expertises: ExpertisesMetiersContract,
): string[] {
  return unique([
    ...theatre.unknowns,
    ...theatre.missing_anchors,
    ...expertises.blind_spots_to_test,
  ]).filter((item) => !isPublicPlaceholder(item))
}

function namedAction(items: string[], fallback: string): string {
  return items.length > 0 ? items[0] : fallback
}

function tensionLabel(input: WritingEngineInput): string {
  const haystack = [
    input.interpretation.header_subject,
    input.interpretation.situation_soumise,
    input.interpretation.object_of_analysis,
    input.interpretation.domain,
  ].join(' ').toLowerCase()

  if (haystack.includes('election') || haystack.includes('certification') || haystack.includes('contester')) {
    return 'la contestation elle-meme'
  }

  if (haystack.includes('startup') || haystack.includes('compagnie') || haystack.includes('site') || haystack.includes('url')) {
    return 'la promesse affichee'
  }

  if (haystack.includes('amie') || haystack.includes('fils') || haystack.includes('famille') || haystack.includes('couple')) {
    return 'le signe affectif'
  }

  return 'l hypothese elle-meme'
}

function probabilityFromTheatre(theatre: ConcreteTheatreContract): ProbabilityAssessment {
  const hasEvidence = theatre.evidence.length > 0
  const hasMissing = theatre.missing_anchors.length > 0
  const status = hasEvidence && !hasMissing ? 'probable' : hasEvidence ? 'plausible' : 'hypothesis'

  return {
    claim_fr: hasEvidence
      ? 'La lecture dispose de premiers appuis, mais leur portee doit rester qualifiee.'
      : 'La lecture reste une hypothese de travail tant que les preuves centrales manquent.',
    status,
    probability_label_fr: ASSERTION_LABELS_FR[status],
    confidence: hasEvidence ? 0.62 : 0.42,
    examples: theatre.evidence.slice(0, 3).map((item) => ({
      text_fr: item.label,
      status: item.level === 'established' ? 'established' : 'plausible',
      source_ids: item.source_ids,
    })),
    missing_proof_fr: hasMissing
      ? `Preuve ou ancre manquante : ${theatre.missing_anchors.slice(0, 3).join(', ')}.`
      : undefined,
  }
}

function resourceWarning(resources?: ResourceServiceContract): string | undefined {
  if (!resources?.needs_web) return undefined
  if (resources.public_sources.length > 0) return undefined
  if (resources.policy === 'url_extract_required') {
    return 'Un site ou une URL est present : l analyse doit rester provisoire tant que son contenu, sa promesse et ses preuves visibles n ont pas ete extraits ou verifies.'
  }
  return 'Des sources rapides sont requises pour ce domaine : l analyse doit distinguer ce qui est structurellement lisible de ce qui reste a verifier.'
}

function resourceEvidenceSection(resources?: ResourceServiceContract): { id: string; title: string; body: string } | null {
  if (!resources || resources.public_sources.length === 0) return null

  const sourceLine = resources.public_sources.slice(0, 3).map((source) => {
    const reliability = source.reliability ? `, ${source.reliability}` : ''
    return `${source.title} (${source.source}${reliability})`
  }).join(' ; ')

  return {
    id: 'sources-rapides',
    title: 'Sources rapides',
    body:
      `Sources attachees : ${sourceLine}. Elles cadrent la lecture et reduisent le hors-sol, mais ne remplacent pas Recherche+ : il faut encore verifier la source primaire, la date, la contradiction possible et la preuve decisive.`,
  }
}

function probabilityFromResources(resources?: ResourceServiceContract): ProbabilityAssessment | null {
  if (!resources || resources.public_sources.length === 0) return null

  const proof = resourceProofLabel(resources)
  return {
    claim_fr: 'Les sources rapides donnent un premier appui factuel, mais leur portee doit rester qualifiee tant qu elles ne sont pas confrontees par Recherche+.',
    status: 'plausible',
    probability_label_fr: ASSERTION_LABELS_FR.plausible,
    confidence: resources.public_sources.length >= 2 ? 0.66 : 0.58,
    examples: resources.public_sources.slice(0, 3).map((source) => ({
      text_fr: source.excerpt
        ? `${source.title} : ${source.excerpt}`
        : `${source.title} (${source.source})`,
      status: source.reliability === 'primary' ? 'established' : 'plausible',
      source_ids: [source.id],
    })),
    missing_proof_fr: proof
      ? `Preuve decisive encore a confronter : ${proof}.`
      : 'Preuve decisive encore a confronter par Recherche+.',
  }
}

function resourceEvidenceSentence(resources?: ResourceServiceContract): string | undefined {
  if (!resources || resources.public_sources.length === 0) return undefined

  const sources = resources.public_sources.slice(0, 3).map((source) => {
    const reliability = source.reliability && source.reliability !== 'unknown'
      ? `, ${source.reliability}`
      : ''
    return `${source.title} (${source.source}${reliability})`
  }).join(' ; ')

  return `Les sources rapides attachées (${sources}) cadrent la lecture : elles donnent un premier appui vérifiable, mais ne remplacent pas Recherche+ ni une vérification de contradiction.`
}

function resourceProofLabel(resources?: ResourceServiceContract): string | undefined {
  const source = resources?.public_sources[0]
  if (!source) return undefined

  return source.excerpt
    ? `${source.title} : ${source.excerpt}`
    : `${source.title} (${source.source})`
}

function extractOpenAIText(data: Record<string, unknown>): string {
  const output = Array.isArray(data.output) ? data.output : []
  return output
    .flatMap((item) => {
      if (!item || typeof item !== 'object') return []
      const content = (item as Record<string, unknown>).content
      if (!Array.isArray(content)) return []
      return content.map((block) => {
        if (!block || typeof block !== 'object') return ''
        const record = block as Record<string, unknown>
        if (typeof record.text === 'string') return record.text
        if (typeof record.output_text === 'string') return record.output_text
        return ''
      })
    })
    .join('')
    .trim()
}

function stringField(value: unknown, fallback: string): string {
  const clean = cleanModelText(value)
  return clean || fallback
}

function publicWritingText(writing: WritingContract): string {
  return [
    writing.situation_card.insight_fr,
    writing.situation_card.main_vulnerability_fr,
    writing.situation_card.asymmetry_fr,
    writing.situation_card.key_signal_fr,
    writing.lecture.text_fr,
    writing.approfondir.analysis_fr,
    ...writing.approfondir.sections_fr.map((section) => `${section.title} ${section.body}`),
  ].join(' ')
}

function withTraceNote(writing: WritingContract, note: string): WritingContract {
  return {
    ...writing,
    trace: {
      ...writing.trace,
      notes: [...(writing.trace.notes ?? []), note],
    },
  }
}

function patternWritingContext(patterns?: HumanCollectivePatternContext) {
  if (!patterns || patterns.selected_patterns.length === 0) {
    return {
      selected_lenses: [],
      dumezil_balance: patterns?.dumezil_balance,
      rule: patterns?.trace.rule ?? 'patterns_are_lenses_not_conclusions',
      public_use:
        'Aucune lentille humaine ou collective dominante. Ne pas forcer une grille theorique.',
    }
  }

  return {
    selected_lenses: patterns.selected_patterns.slice(0, 4).map((pattern) => ({
      hypothesis: pattern.hypothesis,
      observable_signal: pattern.observable_signal,
      inquiry_question: pattern.inquiry_question,
      confidence: pattern.confidence,
    })),
    dumezil_balance: patterns.dumezil_balance,
    rule: patterns.trace.rule,
    public_use:
      'Utiliser ces lentilles pour affiner roles, vulnerabilite, asymetrie, signal et phrase diamant. Ne jamais exposer les labels ni les auteurs.',
  }
}

function isBusinessWritingDomain(domain: string) {
  return ['startup_market', 'business_strategy', 'product_platform', 'professional'].includes(domain)
}

function writingGrammar(input: WritingEngineInput) {
  if (input.expertises_metiers.domain_playbook.domain === 'management') {
    return {
      actorsFallback: 'les personnes directement concernees',
      institutionsFallback: 'l organisation interne, la direction ou les ressources humaines',
      actionFallback: 'une clarification de roles, de charge ou de decision',
      evidenceFallback: 'un fait de travail observable',
      tensionNoun: 'la reorganisation elle-meme',
      diamond: (tension: string, institutions: string, action: string) =>
        `Le risque ne tient pas a ${tension} ; il commence quand ${institutions} laissent ${action} sans cadre partage.`,
      insight: (subject: string, tension: string, action: string, institutions: string) =>
        `${subject} ne se comprend pas par les positions affichees seules. Le point decisif est le passage entre ${tension}, ${action} et les marges detenues par ${institutions}.`,
      lectureEntry: (subject: string, institutions: string) =>
        `${subject} se joue comme une epreuve d organisation : la tension devient serieuse quand elle touche ${institutions}.`,
      approfondirEntry:
        'Le fond de la situation tient a la repartition concrete des roles, de la charge, de la decision et des limites acceptables.',
      supportSentence: (actors: string, institutions: string) =>
        `Les acteurs visibles sont ${actors}, mais les points d appui sont ${institutions}.`,
      vulnerability: (blindSpot: string) =>
        `La vulnerabilite centrale est ${blindSpot} : tant que ce point reste implicite, le conflit se deplace au lieu d etre traite.`,
      asymmetry: (actors: string, institutions: string) =>
        `${actors} vivent la tension au quotidien, mais ${institutions} peuvent clarifier, arbitrer ou laisser la charge se concentrer au mauvais endroit.`,
      keySignal: (evidence: string) =>
        `Signal cle : ${evidence} montrant qui decide, qui porte la charge et quelle limite devient visible.`,
    }
  }

  if (isBusinessWritingDomain(input.expertises_metiers.domain_playbook.domain)) {
    return {
      actorsFallback: 'les acteurs economiques concernes',
      institutionsFallback: 'les clients, partenaires, decideurs ou regulateurs concernes',
      actionFallback: 'un engagement verifiable',
      evidenceFallback: 'une preuve d usage, de paiement ou de contrainte contractuelle',
      tensionNoun: 'la promesse affichee',
      diamond: (tension: string, institutions: string, action: string) =>
        `Le risque ne tient pas a ${tension} ; il commence quand ${institutions} transforment ${action} en engagement, dependance ou contrainte mesurable.`,
      insight: (subject: string, tension: string, action: string, institutions: string) =>
        `${subject} ne se juge pas a sa promesse seule. Le point decisif est le passage entre ${tension}, ${action} et les leviers detenus par ${institutions}.`,
      lectureEntry: (subject: string, institutions: string) =>
        `${subject} se joue comme un test de traction et d alignement : une opportunite devient serieuse seulement si elle rencontre ${institutions}.`,
      approfondirEntry:
        'Le fond de la situation tient a la transformation possible d une promesse en usage, revenu, partenariat ou contrainte assumee.',
      supportSentence: (actors: string, institutions: string) =>
        `Les acteurs visibles sont ${actors}, mais les points d appui sont ${institutions}.`,
      vulnerability: (blindSpot: string) =>
        `La vulnerabilite centrale est ${blindSpot} : sans preuve d usage, de role ou de conditions d engagement, l opportunite reste une promesse ; avec elle, elle devient une decision testable.`,
      asymmetry: (actors: string, institutions: string) =>
        `${actors} rendent l opportunite visible, mais ${institutions} decident si elle devient adoption, dependance ou levier reel.`,
      keySignal: (evidence: string) =>
        `Signal cle : ${evidence} reliant offre, utilisateur, decision d achat et consequence observable.`,
    }
  }

  return {
    actorsFallback: 'les acteurs habilites',
    institutionsFallback: 'les institutions concernees',
    actionFallback: 'une procedure verifiable',
    evidenceFallback: 'une preuve publique',
    tensionNoun: undefined,
    diamond: (tension: string, institutions: string, action: string) =>
      `Le risque ne tient pas a ${tension} ; il commence quand ${institutions} donnent une forme procedurale a ${action}.`,
    insight: (subject: string, tension: string, action: string, institutions: string) =>
      `${subject} ne se tranche pas par une declaration seule. Le point decisif est le passage entre ${tension}, ${action} et les leviers detenus par ${institutions}.`,
    lectureEntry: (subject: string, institutions: string) =>
      `${subject} se joue comme un test de passage : une inquietude ou une hypothese devient serieuse seulement si elle rencontre ${institutions}.`,
    approfondirEntry: 'Le fond de la situation tient a la transformation possible d un recit en procedure.',
    supportSentence: (actors: string, institutions: string) =>
      `Les acteurs visibles sont ${actors}, mais les points d appui sont ${institutions}.`,
    vulnerability: (blindSpot: string) =>
      `La vulnerabilite centrale est ${blindSpot} : sans ce relais, la situation reste une crainte ; avec lui, elle peut devenir un acte opposable.`,
    asymmetry: (actors: string, institutions: string) =>
      `${actors} rendent la tension visible, mais ${institutions} peuvent lui donner, ou lui refuser, une forme effective.`,
    keySignal: (evidence: string) =>
      `Signal cle : ${evidence} reliant un acteur habilite, une regle et une consequence observable.`,
  }
}

export function composeDiamondWriting(input: WritingEngineInput): WritingContract {
  const started = Date.now()
  const subject = input.interpretation.object_of_analysis || input.interpretation.situation_soumise
  const title = input.interpretation.header_subject
  const grammar = writingGrammar(input)
  const actors = publicAnchors(input.theatre.actors, grammar.actorsFallback)
  const institutions = publicAnchors(input.theatre.institutions, grammar.institutionsFallback)
  const actionAnchors = theatreActionAnchors(input.theatre)
  const proofAnchors = theatreProofAnchors(input.theatre, input.expertises_metiers)
  const fragilityAnchors = theatreFragilityAnchors(input.theatre, input.expertises_metiers)
  const evidence = publicAnchors(proofAnchors, 'une trace verifiable')
  const blindSpot = publicAnchors(fragilityAnchors, 'le point qui ferait changer la lecture')
  const firstProcedure = namedAction(actionAnchors, grammar.actionFallback)
  const firstEvidence = namedAction(proofAnchors, grammar.evidenceFallback)
  const tension = grammar.tensionNoun ?? tensionLabel(input)
  const probability = probabilityFromResources(input.resources) ?? probabilityFromTheatre(input.theatre)
  const resourcesWarning = resourceWarning(input.resources)
  const resourcesSection = resourceEvidenceSection(input.resources)
  const resourcesSentence = resourceEvidenceSentence(input.resources)
  const diamondText = compactSentence(grammar.diamond(tension, institutions, firstProcedure))

  const publicWarnings = [
    input.safety.required_disclaimer_fr,
    resourcesWarning,
    ...input.scoring.scoring_warnings,
  ].filter((item): item is string => Boolean(item))

  const scInsight = compactSentence(
    grammar.insight(subject, tension, firstProcedure, institutions),
    360,
  )
  const vulnerability = compactSentence(grammar.vulnerability(blindSpot), 320)
  const asymmetry = compactSentence(grammar.asymmetry(actors, institutions))
  const keySignal = compactSentence(grammar.keySignal(firstEvidence))
  const lecture = [
    grammar.lectureEntry(subject, institutions),
    `La scene utile n est donc pas le bruit public, mais la chaine qui relie ${actors}, ${firstProcedure} et ${evidence}.`,
    resourcesSentence,
    vulnerability,
    keySignal,
  ].filter(Boolean).join(' ')
  const approfondirAnalysis = [
    grammar.approfondirEntry,
    grammar.supportSentence(actors, institutions),
    `Ce qu il faut etablir n est pas seulement l intention, mais le lien entre ${firstProcedure}, ${evidence} et ${blindSpot}.`,
    resourcesSentence,
    resourcesWarning ? resourcesWarning : '',
    `La lecture reste donc prudente : ${probability.probability_label_fr.toLowerCase()}, tant que la preuve decisive manque.`,
  ].filter(Boolean).join(' ')

  return {
    substance_form: {
      substance_fr: [
        'structure reelle',
        'vulnerabilite centrale',
        'preuves et seuils',
        'probabilites explicites',
      ],
      form_fr: [
        'essai court',
        'phrases nettes',
        'tension narrative',
        'phrase diamant memorisable',
      ],
      diamond_sentence: {
        text_fr: diamondText,
        role: 'thesis',
        style: 'diamant_tranchant',
        must_be_public: true,
      },
    },
    diamond_sentences: [
      {
        text_fr: diamondText,
        role: 'thesis',
        style: 'diamant_tranchant',
        must_be_public: true,
      },
      {
        text_fr: compactSentence(`Le point fragile est ${blindSpot}.`),
        role: 'vulnerability',
        style: 'diamond',
        must_be_public: true,
      },
    ],
    probability_assessments: [probability],
    situation_card: {
      title_fr: title,
      submitted_situation_fr: input.interpretation.situation_soumise,
      insight_fr: scInsight,
      main_vulnerability_fr: vulnerability,
      asymmetry_fr: asymmetry,
      key_signal_fr: keySignal,
    },
    trajectories: [
      {
        type: 'stabilization',
        title_fr: 'Clarification',
        description_fr: 'La situation se clarifie si un acteur habilite confirme publiquement son role ou ses limites.',
        signal_fr: `Un element verifiable apparait : ${firstEvidence}.`,
      },
      {
        type: 'escalation',
        title_fr: 'Tension accrue',
        description_fr: 'La pression augmente si la contestation trouve un relais capable de ralentir ou delegitimer la procedure.',
        signal_fr: `Le manque critique reste : ${blindSpot}.`,
      },
      {
        type: 'regime_shift',
        title_fr: 'Bascule',
        description_fr: 'La logique change quand une preuve, une regle ou un acteur transforme l hypothese en fait opposable.',
        signal_fr: 'Une decision, un document, une action ou un seuil rend la lecture non reversible.',
      },
    ],
    lecture: {
      text_fr: lecture,
      word_count_fr: countWords(lecture),
    },
    approfondir: {
      analysis_fr: approfondirAnalysis,
      sections_fr: [
        {
          id: 'fond',
          title: 'Fond',
          body: `La question porte sur une transformation : ce qui est dit ou redoute peut-il devenir une action reconnue par ${institutions} ? Les acteurs a suivre sont ${actors}.`,
        },
        {
          id: 'forme',
          title: 'Forme',
          body: diamondText,
        },
        {
          id: 'probabilites',
          title: 'Probabilites',
          body: `${probability.probability_label_fr} : ${probability.claim_fr} La preuve qui ferait changer le statut est ${firstEvidence}.`,
        },
        {
          id: 'angles-morts',
          title: 'Incertitudes / angles morts',
          body: `A verifier : ${blindSpot}. Ces points doivent etre relies a ${evidence}, sans quoi ils restent des hypotheses.`,
        },
        resourcesSection,
      ].filter((section): section is { id: string; title: string; body: string } => Boolean(section)),
    },
    public_warnings: publicWarnings,
    trace: {
      service: 'WritingEngine',
      version: 'v2-foundation',
      duration_ms: Date.now() - started,
      status: 'ok',
      notes: ['Deterministic writing contract; final prose remains LLM-backed later.'],
    },
  }
}

function buildWritingPrompt(input: WritingEngineInput, local: WritingContract): string {
  return [
    'Tu es le moteur de redaction diamant Situation Card V2.',
    '',
    'Applique le contrat canonique existant, sans inventer de nouvelle regle :',
    '- ne pas reinterpreter la demande utilisateur ;',
    '- utiliser uniquement les contrats fournis : interpretation, theatre reel, expertises, scoring ;',
    '- produire un essai court, net, sans notice, sans logico visible, sans jargon interne ;',
    '- separer Situation Card courte, Lecture et Approfondir ;',
    '- nommer la vulnerabilite centrale, le signal observable, les probabilites si la preuve manque ;',
    '- ne jamais transformer une hypothese en certitude.',
    '- ne pas recopier le brouillon local : il sert seulement de garde-fou contractuel, pas de style public.',
    '- pour les situations humaines, collectives et organisationnelles, utiliser les patterns comme lentilles, jamais comme conclusions ;',
    '- utiliser silencieusement la triade fonctionnelle : qui legitime, qui protege/combattre/bloque, qui produit/reproduit/porte la charge ;',
    '- chercher le desalignement critique : ce qui legitime ne protege plus, ce qui protege empeche de produire, ou ce qui produit n est plus reconnu ;',
    '- ne jamais afficher les noms d auteurs, les labels de patterns ou la grille theorique sauf demande explicite de lecture theorique.',
    '- si des public_sources existent, les utiliser comme preuves rapides dans Approfondir, en nommant leur portee et leur limite ;',
    '- ne jamais presenter les sources rapides comme une enquete Recherche+ complete.',
    '',
    'Longueurs indicatives :',
    '- insight_fr : 2 phrases maximum ;',
    '- lecture_fr : 2 paragraphes courts maximum ;',
    '- approfondir_analysis_fr : 4 a 6 phrases ;',
    '- diamond_sentence_fr : diamant tranchant, une phrase courte, dense et partageable qui nomme la contradiction centrale sans prudence molle ni accusation gratuite.',
    '',
    'Retourne uniquement un JSON avec ces cles :',
    '{',
    '  "insight_fr": "",',
    '  "main_vulnerability_fr": "",',
    '  "asymmetry_fr": "",',
    '  "key_signal_fr": "",',
    '  "lecture_fr": "",',
    '  "approfondir_analysis_fr": "",',
    '  "diamond_sentence_fr": "",',
    '  "fond_fr": "",',
    '  "forme_fr": "",',
    '  "probabilites_fr": "",',
    '  "angles_morts_fr": ""',
    '}',
    '',
    'Contrats disponibles :',
    JSON.stringify({
      interpretation: input.interpretation,
      theatre: input.theatre,
      expertises_metiers: input.expertises_metiers,
      resources: input.resources
        ? {
          status: input.resources.status,
          policy: input.resources.policy,
          needs_web: input.resources.needs_web,
          policy_reason_fr: input.resources.policy_reason_fr,
          fallback_searches: input.resources.fallback_searches,
          public_sources_count: input.resources.public_sources.length,
          public_sources: input.resources.public_sources.slice(0, 3).map((source) => ({
            title: source.title,
            source: source.source,
            channel: source.channel,
            reliability: source.reliability,
            excerpt: source.excerpt,
          })),
        }
        : undefined,
      patterns: patternWritingContext(input.patterns),
      scoring: input.scoring,
      required_output_shape: Object.keys(local.situation_card),
      existing_probability_assessment: local.probability_assessments[0],
      forbidden_public_phrases: [
        'objet visible',
        'mecanisme concret',
        'canal concret',
        'general_analysis',
        'understand_situation',
        'la situation est complexe',
        'le manque de communication',
      ],
    }),
  ].join('\n')
}

async function composeWithOpenAI(input: WritingEngineInput, local: WritingContract): Promise<WritingContract> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY missing')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.OPENAI_WRITING_MODEL || 'gpt-4.1-mini',
        max_tokens: 1400,
        temperature: 0.25,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: buildWritingPrompt(input, local),
          },
        ],
      }),
    })

    if (!response.ok) throw new Error(`OpenAI writing failed: ${response.status}`)

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    const parsed = parseModelJSON(typeof content === 'string' ? content : extractOpenAIText(data))
    const diamondText = compactSentence(stringField(parsed.diamond_sentence_fr, local.diamond_sentences[0]?.text_fr ?? ''))
    const lectureText = stringField(parsed.lecture_fr, local.lecture.text_fr)
    const approfondirText = stringField(parsed.approfondir_analysis_fr, local.approfondir.analysis_fr)
    const writing: WritingContract = {
      ...local,
      substance_form: {
        ...local.substance_form,
        diamond_sentence: {
          ...local.substance_form.diamond_sentence,
          text_fr: diamondText,
        },
      },
      diamond_sentences: [
        {
          text_fr: diamondText,
          role: 'thesis',
          style: 'diamant_tranchant',
          must_be_public: true,
        },
        ...local.diamond_sentences.slice(1),
      ],
      situation_card: {
        ...local.situation_card,
        insight_fr: compactSentence(stringField(parsed.insight_fr, local.situation_card.insight_fr), 420),
        main_vulnerability_fr: compactSentence(stringField(parsed.main_vulnerability_fr, local.situation_card.main_vulnerability_fr), 320),
        asymmetry_fr: compactSentence(stringField(parsed.asymmetry_fr, local.situation_card.asymmetry_fr), 260),
        key_signal_fr: compactSentence(stringField(parsed.key_signal_fr, local.situation_card.key_signal_fr), 240),
      },
      lecture: {
        text_fr: lectureText,
        word_count_fr: countWords(lectureText),
      },
      approfondir: {
        analysis_fr: approfondirText,
        sections_fr: [
          { id: 'fond', title: 'Fond', body: stringField(parsed.fond_fr, local.approfondir.sections_fr[0]?.body ?? '') },
          { id: 'forme', title: 'Forme', body: stringField(parsed.forme_fr, diamondText) },
          { id: 'probabilites', title: 'Probabilites', body: stringField(parsed.probabilites_fr, local.approfondir.sections_fr[2]?.body ?? '') },
          { id: 'angles-morts', title: 'Incertitudes / angles morts', body: stringField(parsed.angles_morts_fr, local.approfondir.sections_fr[3]?.body ?? '') },
          ...local.approfondir.sections_fr.filter((section) => section.id === 'sources-rapides'),
        ],
      },
      trace: {
        ...local.trace,
        model: process.env.OPENAI_WRITING_MODEL || 'gpt-4.1-mini',
        notes: ['Referent LLM writing applied to canonical contracts.'],
      },
    }

    const forbidden = containsForbiddenPublicPhrase(publicWritingText(writing))
    if (forbidden.length > 0) {
      throw new Error(`Forbidden public phrase from LLM writing: ${forbidden.join(', ')}`)
    }

    return writing
  } finally {
    clearTimeout(timeout)
  }
}

export async function composeDiamondWritingWithMode(
  input: WritingEngineInput,
  mode: WritingEngineMode = 'local_contract',
): Promise<WritingContract> {
  const started = Date.now()
  const local = composeDiamondWriting(input)

  if (mode !== 'referent_llm') {
    return local
  }

  try {
    const writing = await composeWithOpenAI(input, local)
    return {
      ...writing,
      trace: {
        ...writing.trace,
        duration_ms: Date.now() - started,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown writing error'
    return withTraceNote(local, `Referent LLM writing unavailable; local contract fallback used: ${message}`)
  }
}
