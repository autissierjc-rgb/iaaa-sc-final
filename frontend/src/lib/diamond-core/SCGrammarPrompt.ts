import type { WritingContract } from '../contracts'
import type { DiamondDossier } from './DiamondDossier'

export type SCGrammarPromptMessage = {
  role: 'system' | 'user'
  content: string
}

export type SCGrammarPrompt = {
  model_role: 'llm_diamond_writer'
  response_contract: 'WritingContract'
  messages: SCGrammarPromptMessage[]
  required_json_shape: Record<keyof WritingContract, unknown>
  quality_targets_fr: string[]
}

function compact(value: string, max = 900): string {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function list(items: string[] | undefined, max = 8): string[] {
  return (items ?? [])
    .map((item) => compact(item, 260))
    .filter(Boolean)
    .slice(0, max)
}

function section(title: string, body: unknown): string {
  return `## ${title}\n${typeof body === 'string' ? body : JSON.stringify(body, null, 2)}`
}

function byFreshness<T extends { published_at?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const dateA = a.published_at ? Date.parse(a.published_at) : NaN
    const dateB = b.published_at ? Date.parse(b.published_at) : NaN
    if (Number.isNaN(dateA) && Number.isNaN(dateB)) return 0
    if (Number.isNaN(dateA)) return 1
    if (Number.isNaN(dateB)) return -1
    return dateB - dateA
  })
}

function resourceSummary(dossier: DiamondDossier) {
  const regimeSignals = byFreshness(dossier.resonance.source_signals)

  return {
    context_frame: dossier.resonance.context_frame,
    role: dossier.resources.user_material.role,
    role_reason_fr: dossier.resources.user_material.reason_fr,
    requested_urls: dossier.resources.requested_urls,
    status: dossier.resources.plan.status,
    policy: dossier.resources.plan.policy,
    policy_reason_fr: dossier.resources.plan.policy_reason_fr,
    target_audience_families: dossier.resources.target_audience_families.map((family) => ({
      id: family.id,
      label_fr: family.label_fr,
      offer_hint_fr: family.offer_hint_fr,
      audience_fr: family.audience_fr,
      source_terms_fr: list(family.source_terms_fr, 5),
    })),
    extracted_options: (dossier.resources.plan.extracted_options ?? []).slice(0, 10).map((option) => ({
      id: option.id,
      label_fr: option.label_fr,
      kind: option.kind,
      status: option.status,
      source_type: option.source_type,
      source_title: option.source_title,
      evidence_fr: list(option.evidence_fr, 4),
    })),
    public_evidence: byFreshness(dossier.resonance.qualified_evidence).map((evidence) => ({
      status: evidence.status,
      public_label_fr: evidence.public_label_fr,
      public_signal_fr: evidence.public_signal_fr,
      source_id: evidence.source_id,
      can_drive_probability: evidence.can_drive_probability,
      published_at: evidence.published_at,
    })),
    regime_signals: regimeSignals.map((signal) => ({
      signal_fr: signal.signal_fr,
      public_signal_fr: signal.public_signal_fr,
      source_name: signal.source_name,
      discriminant_terms: signal.discriminant_terms,
      published_at: signal.published_at,
    })),
    functional_needs: dossier.resources.plan.functional_needs.map((need) => ({
      family: need.family,
      question_fr: need.question_fr,
      expected_evidence_fr: need.expected_evidence_fr,
      priority: need.priority,
    })),
  }
}

function theatreSummary(dossier: DiamondDossier) {
  return {
    actors: list(dossier.theatre.actors),
    institutions: list(dossier.theatre.institutions),
    dates: list(dossier.theatre.dates),
    procedures: list(dossier.theatre.procedures),
    visible_actions: list(dossier.theatre.visible_actions),
    constraints: list(dossier.theatre.constraints),
    unknowns: list(dossier.theatre.unknowns),
    missing_anchors: list(dossier.theatre.missing_anchors),
    evidence: dossier.theatre.evidence.slice(0, 8),
  }
}

function inquirySummary(dossier: DiamondDossier) {
  return dossier.inquiry.blind_spots.slice(0, 8).map((item) => ({
    blind_spot: item.blind_spot,
    level: item.level,
    evidence_level: item.evidence_level,
    why_it_matters: item.why_it_matters,
    where_to_look: list(item.where_to_look, 5),
    who_can_confirm: list(item.who_can_confirm, 5),
    observable_signal: item.observable_signal,
    decisive_evidence: item.decisive_evidence,
    counter_hypothesis: item.counter_hypothesis,
  }))
}

function scoringSummary(dossier: DiamondDossier) {
  return {
    state_index_final: dossier.scoring.state_index_final,
    state_label: dossier.scoring.state_label,
    astrolabe: dossier.scoring.astrolabe.map((branch) => ({
      branch: branch.branch,
      name_fr: branch.name_fr,
      score: branch.score,
      is_primary: branch.is_primary,
      rationale_fr: branch.rationale_fr,
    })),
    radar: dossier.scoring.radar,
    warnings: dossier.scoring.scoring_warnings,
  }
}

function responseShape(spineOnly = false): SCGrammarPrompt['required_json_shape'] {
  if (spineOnly) {
    // Colonne vertébrale : la plume écrit tout le texte public, y compris
    // les six rubriques Approfondir mais COURTES (une à deux phrases situées
    // chacune). substance_form et probability_assessments restent hors du
    // budget synchrone. Le remplissage local n'est plus qu'un ultime secours.
    const shape = {
      ...fullResponseShape(),
    } as Record<string, unknown>
    delete shape.substance_form
    delete shape.probability_assessments
    return shape as SCGrammarPrompt['required_json_shape']
  }
  return fullResponseShape()
}

function fullResponseShape(): SCGrammarPrompt['required_json_shape'] {
  return {
    substance_form: {
      substance_fr: ['string'],
      form_fr: ['string'],
      diamond_sentence: { text_fr: 'string', role: 'thesis', style: 'diamant_tranchant', must_be_public: true },
    },
    diamond_sentences: [
      { text_fr: 'string', role: 'thesis | vulnerability | tipping_point | key_signal', style: 'diamant_tranchant', must_be_public: true },
    ],
    probability_assessments: [
      {
        claim_fr: 'string',
        status: 'established | probable | plausible | hypothesis | unknown',
        probability_label_fr: 'string',
        confidence: 0.5,
        examples: [{ text_fr: 'string', status: 'established | plausible | hypothesis', source_ids: ['string'] }],
        missing_proof_fr: 'string',
      },
    ],
    situation_card: {
      title_fr: 'string',
      submitted_situation_fr: 'string',
      insight_fr: 'string',
      main_vulnerability_fr: 'string',
      asymmetry_fr: 'string',
      key_signal_fr: 'string',
    },
    trajectories: [
      { type: 'stabilization | escalation | regime_shift', title_fr: 'string', description_fr: 'string', signal_fr: 'string' },
    ],
    lecture: { text_fr: 'string', word_count_fr: 0 },
    approfondir: {
      analysis_fr: 'string',
      sections_fr: [
        { id: 'situation-reelle', title: 'Ce que la situation est réellement', body: 'string' },
        { id: 'systeme-tient', title: 'Ce qui tient le système', body: 'string' },
        { id: 'systeme-affaiblit', title: 'Ce qui l’affaiblit', body: 'string' },
        { id: 'escalade', title: 'Ce qui pourrait déclencher une escalade', body: 'string' },
        { id: 'bascule', title: 'Ce qui pourrait produire une bascule', body: 'string' },
        { id: 'surveiller', title: 'Ce qu’il faut surveiller maintenant', body: 'string' },
      ],
    },
    public_warnings: ['string'],
    trace: { service: 'LLMDiamondWriter', version: 'v1', duration_ms: 0, status: 'ok | partial', notes: ['string'] },
  }
}

function qualityTargets(dossier: DiamondDossier): string[] {
  const hasExtractedOptions = (dossier.resources.plan.extracted_options ?? []).length >= 2
  const hasRegimeSignals = dossier.resonance.source_signals.length >= 2
  const hasPublicEvidence = dossier.resonance.qualified_evidence.some((evidence) => evidence.can_drive_probability)
  return [
    'Insight: faire voir la structure cachee, pas seulement reformuler la question.',
    'Main Vulnerability: nommer le point de rupture precis, testable et non banal.',
    'Trajectories: produire stabilisation, escalade et changement de regime comme trois logiques distinctes.',
    'Key Signal: donner un signal concret que l utilisateur peut surveiller.',
    'Global Usefulness: aider a comprendre, decider ou agir sans surpromettre.',
    ...(hasExtractedOptions
      ? [
          'Target choice: si la question demande une meilleure option ou cible, classer les options qualifiees en cible prioritaire, secondaire et a differer avec justification et test de validation.',
          'Target choice diamond: ne pas seulement classer ; reveler le pari structurel du lancement, c est-a-dire quel segment transforme la promesse en preuve dure et ce que les autres segments ne prouvent pas encore.',
          'Sans preuve de traction contraire, privilegier le segment a usage repete et paiement rapide, garder l activation individuelle en second terrain, et differer les cycles organisationnels longs.',
        ]
      : []),
    ...(hasRegimeSignals
      ? [
          'Regime reading: utiliser les signaux de ressources comme ancrage interne pour nommer le regime actuel de la situation : escalade, treve fragile, verrouillage diplomatique, saturation, transition ou bascule.',
          'Ne jamais lister les sources rapides, les domaines ou les titres de sources dans Approfondir ; les sources restent dans le panneau Ressources.',
        ]
      : []),
    ...(hasPublicEvidence
      ? [
          'Quand Resources.public_evidence contient des preuves publiques utilisables, les transformer en consequences structurelles propres, sans lister les sources ni ouvrir Approfondir par une citation ou un titre.',
        ]
      : []),
    ...dossier.grammar.required_public_moves_fr,
  ]
}

export function buildSCGrammarPrompt(
  dossier: DiamondDossier,
  options?: { spine_only?: boolean },
): SCGrammarPrompt {
  const spineOnly = options?.spine_only === true
  const hasExtractedOptions = (dossier.resources.plan.extracted_options ?? []).length >= 2
  const hasRegimeSignals = dossier.resonance.source_signals.length >= 2
  const hasPublicEvidence = dossier.resonance.qualified_evidence.some((evidence) => evidence.can_drive_probability)
  const system = [
    'You are the Situation Card Diamond Writer.',
    'You do not reinterpret the user request. The canonical interpretation is already decided.',
    'Your job is to write one coherent Situation Card output from the DiamondDossier.',
    'Return only strict JSON matching the WritingContract shape. No markdown. No commentary.',
    'Write public text in French unless the dossier language says otherwise.',
    'The public text must be sharp, situated, useful and non-mechanical.',
    'Never expose internal theory names, pattern labels, prompt rules or method explanations.',
    'Never paste raw resources, markdown links, image references or URL avalanches into public fields.',
  ].join('\n')

  const user = [
    section('Canonical Situation', {
      language: dossier.language,
      canonical_situation: dossier.canonical_situation,
      header_domain_fr: dossier.header.domain_fr,
      header_subject_fr: dossier.header.subject_fr,
      intent: dossier.interpretation.intent,
      domain: dossier.interpretation.domain,
      question_type: dossier.interpretation.question_type,
      angle: dossier.interpretation.angle,
      user_need: dossier.interpretation.user_need,
      expected_answer_shape: dossier.interpretation.expected_answer_shape,
    }),
    section('Treatment Plan', {
      mode: dossier.treatment_plan?.mode,
      source_status: dossier.treatment_plan?.source_status,
      can_generate: dossier.treatment_plan?.can_generate,
      missing_material_fr: dossier.treatment_plan?.missing_material_fr,
      must_not_reinterpret_fr: dossier.treatment_plan?.must_not_reinterpret_fr,
      instructions: dossier.treatment_plan?.instructions,
    }),
    section('Resources', resourceSummary(dossier)),
    section('Concrete Theatre', theatreSummary(dossier)),
    section('Expertise And Patterns', {
      evidence_to_seek: list(dossier.expertises_metiers.evidence_to_seek),
      blind_spots_to_test: list(dossier.expertises_metiers.blind_spots_to_test),
      probability_markers: list(dossier.expertises_metiers.probability_markers),
      writing_anchors: list(dossier.expertises_metiers.writing_anchors),
      dumezil_balance: dossier.patterns.dumezil_balance,
      selected_patterns_are_internal_lenses: dossier.patterns.selected_patterns.map((pattern) => ({
        hypothesis: pattern.hypothesis,
        observable_signal: pattern.observable_signal,
        inquiry_question: pattern.inquiry_question,
      })),
    }),
    section('Blind Spots And Inquiry', inquirySummary(dossier)),
    section('Scoring', scoringSummary(dossier)),
    section('Required Writing Grammar', {
      required_public_moves_fr: dossier.grammar.required_public_moves_fr,
      forbidden_drifts_fr: dossier.grammar.forbidden_drifts_fr,
      calibration_questions_fr: dossier.grammar.calibration_questions_fr,
      quality_targets_fr: qualityTargets(dossier),
    }),
    section('Output JSON Shape', responseShape(spineOnly)),
    section('Output Rules', [
      ...(spineOnly
        ? [
            'SPINE MODE: write ALL public text yourself, including the six approfondir.sections_fr, but keep every section to ONE tight sentence (max ~25 words). Never leave a section to a template.',
            'SPINE MODE: each approfondir section must add a NEW concrete angle drawn from the dossier (a named actor, a dated fact, a threshold, a cost), never restate the same formula. Forbidden across sections: repeating "le passage entre tension visible", "qui porte le coût / qui garde la marge", "statut de preuve : plausible", or any source domain name.',
            'SPINE MODE: the proof status appears once, inside a fact sentence in lecture.text_fr, with the proof that would change it — never as a standalone label in the sections.',
          ]
        : []),
      'situation_card.submitted_situation_fr must equal the canonical situation or its polished faithful French form.',
      'situation_card.insight_fr must contain the core reading, not a disclaimer.',
      'situation_card.insight_fr must open a diamond reading: a central contradiction carried by actors, constraints and proof, not an administrative summary.',
      'Never open with generic scaffolding such as "La situation ne se réduit pas...", "distribution de leviers", "ce qui garde encore la face" or "un acteur qui change de rythme".',
      'Never open insight_fr or lecture.text_fr with journalistic scaffolding: "la situation actuelle est marquée par", "est à un point critique", "les tensions sont fortes/vives/croissantes", "un signal clé à surveiller est", "sera crucial pour déterminer".',
      'A diamond sentence must name the contradiction directly: actor + mechanism/threshold + proof/status. No abstract preamble.',
      'ESSAY REGISTER (canonical): the card is a short essay, not an analysis report. Sharp sentences, narrative tension, no notices, no visible method. Any sentence that explains the METHOD instead of illuminating the SITUATION is forbidden: "ce point est testable en observant...", "la lecture utile consiste à distinguer...", "statut de la lecture : ...", "ce diagnostic s\'appuie sur...". The proof status is stated once, inside a sentence that carries a fact — never as a label.',
      'main_vulnerability_fr is the PUNCHLINE of the card: one cutting sentence, about 30 words maximum, naming what has become impossible to ignore. Register: "Le groupe ne défend plus une décision ; il défend le droit de ne pas voir qu\'elle échoue." It cuts the FORM, never beyond the proof. The observable test and the enumerations belong to key_signal_fr and Approfondir, never inside the punchline.',
      'No parenthetical inventories in card fields ("(tankers, corridors, stocks régionaux)"): pick the single concrete detail that cuts deepest; enumerations go to Approfondir.',
      'situation_card.main_vulnerability_fr must be specific, structural and testable.',
      'situation_card.asymmetry_fr must name the asymmetry of power, proof, role, timing or adoption.',
      'situation_card.key_signal_fr must name the observable signal that would change the regime of the situation.',
      'Every public card must make the user see the system, feel the fragile point, and know what to watch.',
      'Silent ternary grid: use dumezil_balance and the functional needs to ask who legitimizes (right, rule, authorized narrative), who protects or fights (defends, blocks, absorbs the shock), and who produces or carries the load (works, finances, maintains, transmits). Never name the grid or its authors publicly.',
      'The critical misalignment is diamond material: when what legitimizes no longer protects, when what protects prevents producing, or when what produces is no longer recognized by what legitimizes, the vulnerability should name that misalignment in plain situated words.',
      'The grid vocabulary itself is FORBIDDEN in public text: never write "légitimation", "légitimer", "capacité de production/reproduction", "fonction protectrice" or any analytical label. Translate into the words of the situation: who decides, who orders, who pays, who transports, who represses, who obeys. If an analytical noun can be replaced by a named actor doing a concrete verb, it must be.',
      'Proof-status markers are facts stated once, not scaffolding: give each status (etabli, probable, plausible) inside the sentence that carries the fact, at most once per section, never as a repeated parenthetical formula like "(statut : X ; preuve qui la changerait : Y)". Vary the phrasing; the card must read as analysis, not as a filled form.',
      'When the dossier attributes the pressure to a deliberate action of a named external actor (strikes, sanctions, blockade, lawsuit, campaign), the card must read the situation as the strategic dilemma of the pressured actor: name its real options (absorb, negotiate, concede, escalate), the cost of each, and which exits are closing. A situation caused by an adversary is never only an internal management problem, and at least one trajectory must name the escalation or concession path that the sources make plausible.',
      'Name the real theatre: the named persons, institutions and dated events present in the dossier (actors, regime signals, public evidence) must appear in the public text. A card about a public situation that names no person, no institution and no dated fact is a contract violation.',
      'All public text is French. Translate English role phrases and institution names into their French public forms (e.g. Premier ministre israélien, Gardiens de la révolution) and use the French spelling of proper names (Netanyahou, Téhéran). Never leave an English phrase inside a French sentence.',
      'The date in the canonical situation is the reference point. Anchor the regime diagnosis on the MOST RECENT dated facts in the dossier (published_at); older events are background context and must never lead the reading. If a fact is months older than the question date, say so explicitly instead of presenting it as the current state.',
      'The primary theatre is where the most recent facts put the named actors of the question, not the most detailed source.',
      'Give at least one dated fact from the dossier as an example, with its proof status (etabli, probable or plausible) stated in the same sentence.',
      'Never assign etabli or probable to a fact that the dossier evidence does not carry. When the dossier has no public evidence, world facts from your own knowledge are at most hypotheses to verify, and the card must say plainly that no source could be attached.',
      'The proof status of the reading (etabli/probable/plausible/hypothese) must appear explicitly in the section "Ce que la situation est réellement", with the proof that would change it.',
      ...(hasRegimeSignals
        ? [
            'Resources.regime_signals are mandatory anchors, not optional background.',
            'For a dated/current geopolitical, market, crisis or public event question with regime_signals, lecture.text_fr must begin from the concrete regime diagnosis, not from method or source availability. Never echo instruction labels ("Regime diagnosis :", "Status :") in the public text: open directly with the French sentence.',
            'Do not write a generic institutional reading if regime_signals exist. Compress their consequences into the regime diagnosis without citing source domains or titles.',
            'situation_card.insight_fr must include at least one resource-derived consequence, not a source label.',
          ]
        : []),
      ...(hasPublicEvidence
        ? [
            'Resources.public_evidence with can_drive_probability=true is mandatory factual grounding, not a citation list.',
            'Do not merely say that sources exist. In public writing, state the direct consequence for regime/probability, without listing source domains, titles, URLs or media labels.',
            'Never paste raw titles, markdown headings, media boilerplate or URL text as evidence.',
          ]
        : []),
      ...(hasExtractedOptions
        ? [
            'When the user asks for best target/options and Resources.extracted_options has at least two options, you must rank them explicitly: cible prioritaire probable, cible secondaire, cible a differer.',
            'A compact ranking must appear in situation_card.insight_fr or lecture.text_fr, with the priority reason and one observable validation test.',
            'If the options are individual use, professional use and organizational/governance use, and no direct traction proof contradicts it, prefer professional repeated-use first, individual activation/language second, organizational/governance third because sales and integration cycles are longer.',
            'For target choice, situation_card.insight_fr and the first paragraph of lecture.text_fr must reveal the deeper wager: not biggest audience, but the first public that turns the promise into repeated behavior, workflow, payment or integration.',
            'For target choice, situation_card.main_vulnerability_fr must name the launch sequence risk, not a generic risk of choosing too broadly.',
          ]
        : []),
      'trajectories must include exactly one stabilization, one escalation and one regime_shift.',
      'lecture.text_fr must be exactly 2 short paragraphs: first the concrete regime diagnosis anchored in the public facts, then what would make the reading tip and what to watch. One thin paragraph is a contract violation.',
      'lecture.text_fr must not carry the full trajectory spine or the detailed probability demonstration when approfondir.sections_fr carries them.',
      'approfondir.sections_fr must keep the public structural spine: what the situation is, what holds, what weakens, what could escalate, what could shift, and what to watch.',
      'Each approfondir section body must demonstrate, not assert: 2 to 4 compact sentences linking a public fact, the mechanism it reveals and the observable signal that would change the reading. One-sentence section bodies are a contract violation.',
      'approfondir.analysis_fr must be 3 to 5 sentences that develop the central contradiction beyond the lecture summary.',
      'Use established/probable/plausible/hypothesis/unknown as proof status inside the reasoning and probability_assessments, never as public section titles.',
      'Do not create public sections titled "Ce qui est etabli", "Ce qui est probable", "Ce qui est plausible", "Ce qui est hypothetique" or "Ce qui est inconnu".',
      'approfondir.sections_fr must explain what holds, weakens, escalates, shifts and what to watch without starting a section body by repeating its title.',
      'probability_assessments must separate established/probable/plausible/hypothesis/unknown and name the proof that would change the status.',
      'The probability status must shape Approfondir trajectories and watch signals; do not append it as a defensive final disclaimer.',
      'trace.service must be LLMDiamondWriter and trace.status must be ok or partial.',
    ]),
  ].join('\n\n')

  return {
    model_role: 'llm_diamond_writer',
    response_contract: 'WritingContract',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    required_json_shape: responseShape(),
    quality_targets_fr: qualityTargets(dossier),
  }
}
