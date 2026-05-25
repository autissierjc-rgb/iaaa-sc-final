import type { WritingContract } from '../contracts'
import { buildResourceRegimeSignals } from '../resources/regimeSignals'
import type { DiamondDossier } from './DiamondDossier'

export type SCGrammarPromptMessage = {
  role: 'system' | 'user'
  content: string
}

export type SCGrammarPrompt = {
  model_role: 'llm_diamond_writer'
  response_contract: 'WritingContract'
  messages: SCGrammarPromptMessage[]
  required_json_shape: Record<keyof WritingContract, string>
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

function resourceSummary(dossier: DiamondDossier) {
  const regimeSignals = buildResourceRegimeSignals(dossier.resources.plan, 4)

  return {
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
    public_evidence: dossier.resources.public_evidence.map((evidence) => ({
      status: evidence.status,
      public_label_fr: evidence.public_label_fr,
      source_id: evidence.source_id,
      reason: evidence.reason,
      can_be_public: evidence.can_be_public,
      can_drive_probability: evidence.can_drive_probability,
    })),
    regime_signals: regimeSignals.map((signal) => ({
      signal_fr: signal.signal_fr,
      source_title: signal.source_title,
      source_name: signal.source_name,
      reliability: signal.reliability,
      discriminant_terms: signal.discriminant_terms,
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

function responseShape(): SCGrammarPrompt['required_json_shape'] {
  return {
    substance_form: 'SubstanceFormContract',
    diamond_sentences: 'DiamondSentence[]',
    probability_assessments: 'ProbabilityAssessment[]',
    situation_card: 'SituationCardViewContract',
    trajectories: 'TrajectoryContract[]',
    lecture: 'LectureContract',
    approfondir: 'ApprofondirContract',
    public_warnings: 'string[]',
    trace: 'TraceMeta',
  }
}

function qualityTargets(dossier: DiamondDossier): string[] {
  const hasExtractedOptions = (dossier.resources.plan.extracted_options ?? []).length >= 2
  const hasRegimeSignals = buildResourceRegimeSignals(dossier.resources.plan, 2).length >= 2
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
          'Sources rapides: quand Resources.regime_signals contient des signaux, lecture.text_fr doit ouvrir sur au moins deux faits ou signaux sourcables avant la lecture structurelle.',
          'Regime reading: utiliser les signaux de ressources pour nommer le regime actuel de la situation : escalade, treve fragile, verrouillage diplomatique, saturation, transition ou bascule.',
        ]
      : []),
    ...dossier.grammar.required_public_moves_fr,
  ]
}

export function buildSCGrammarPrompt(dossier: DiamondDossier): SCGrammarPrompt {
  const hasExtractedOptions = (dossier.resources.plan.extracted_options ?? []).length >= 2
  const hasRegimeSignals = buildResourceRegimeSignals(dossier.resources.plan, 2).length >= 2
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
    section('Output JSON Shape', responseShape()),
    section('Output Rules', [
      'situation_card.submitted_situation_fr must equal the canonical situation or its polished faithful French form.',
      'situation_card.insight_fr must contain the core reading, not a disclaimer.',
      'situation_card.main_vulnerability_fr must be specific, structural and testable.',
      'situation_card.asymmetry_fr must name the asymmetry of power, proof, role, timing or adoption.',
      'situation_card.key_signal_fr must say what to watch next.',
      ...(hasRegimeSignals
        ? [
            'Resources.regime_signals are mandatory anchors, not optional background.',
            'For a dated/current geopolitical, market, crisis or public event question with regime_signals, lecture.text_fr must begin from at least two concrete source-derived signals, then infer the structural regime.',
            'Do not write a generic institutional reading if regime_signals exist. Name the factual signals first, then compress them into the regime diagnosis.',
            'situation_card.insight_fr must include at least one resource-derived regime signal or its direct consequence.',
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
      'lecture.text_fr must be a short summary: 2 short paragraphs maximum, not a mini-Approfondir.',
      'lecture.text_fr must not carry the full trajectory spine or the detailed probability demonstration when approfondir.sections_fr carries them.',
      'approfondir.sections_fr must be the long form that demonstrates: what is established, what is probable, what remains plausible, what is only a hypothesis, and what is unknown.',
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
