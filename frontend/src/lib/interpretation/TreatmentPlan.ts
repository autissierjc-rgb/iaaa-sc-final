import type { InterpretedRequest } from '../resources/resourceContract'
import type { SituationDomainV2, TreatmentPlanContract, TreatmentInstruction } from '../contracts'

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function hasExplicitMaterialUrl(value: string): boolean {
  return /\b(?:https?:\/\/|www\.)[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?/i.test(value) ||
    /\b[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]+)\b/i.test(value)
}

function pointsToExternalMaterial(text: string): boolean {
  const normalized = normalize(text)
  return /\b(site|page|document|dossier|source|url|lien|plug|presentation)\b/.test(normalized)
}

function pointsToMissingMaterialAnswer(text: string): boolean {
  const normalized = normalize(text)
  const materialTarget = /\b(site|page|document|doc|pdf|fichier|dossier|source|url|lien|plug|presentation|drive|notion|serveur)\b/
  const pointer =
    /\b(c est|elles|ils|tout|les options|les infos|les details|la matiere|la source)\b.*\b(sur|dans|via)\b/.test(normalized) ||
    /\b(sur|dans|via)\b.*\b(le|la|les|mon|ma|mes|ce|cette)\b/.test(normalized) ||
    /\b(voir|regarde|consulte)\b/.test(normalized)

  return pointer && materialTarget.test(normalized)
}

function asksTargetChoice(text: string, interpreted: InterpretedRequest): boolean {
  const normalized = normalize([
    text,
    interpreted.object_of_analysis,
    interpreted.user_question,
    interpreted.expected_answer_shape,
  ].filter(Boolean).join(' '))

  return /\b(cible|client|clients|utilisateur|utilisateurs|communaute|segment|audience|persona|icp)\b/.test(normalized) &&
    /\b(choisir|prioriser|premier|premiere|lancement|lancer|developper|developpement|strategie|strategique|option|options)\b/.test(normalized)
}

function asksUnspecifiedOptions(text: string): boolean {
  const normalized = normalize(text)
  const asksOptions =
    /\b(option|options|scenario|scenarios|strategie|strategies|choix|arbitrage|plan)\b/.test(normalized) &&
    /\b(plusieurs|differentes|comparer|tenir compte|arbitrer|entre)\b/.test(normalized)
  if (!asksOptions) return false

  return !(
    /\b(option|scenario|strategie)\s*(?:1|2|3|a|b|c)\b/i.test(text) ||
    /\b(soit|ou bien|premiere option|deuxieme option|troisieme option)\b/i.test(text) ||
    /(?:\n|;|•|-)\s*(?:option|scenario|strategie)?\s*[A-C1-3][).:-]/i.test(text)
  )
}

function baseInstructions(): TreatmentInstruction[] {
  return [
    {
      layer: 'dialogue',
      instruction_fr: 'Respecter l intention canonique et ne demander une precision que si elle change vraiment la carte.',
    },
    {
      layer: 'resources',
      instruction_fr: 'Traiter les URL, documents et plugs comme matiere ou preuve, jamais comme remplacement silencieux de la question.',
    },
    {
      layer: 'writing',
      instruction_fr: 'Rediger depuis la Situation soumise canonique, le theatre reel et les preuves disponibles.',
    },
    {
      layer: 'quality',
      instruction_fr: 'Bloquer ou marquer partiel si la sortie devient generale, hors-sol ou contraire a l intention.',
    },
  ]
}

export function buildTreatmentPlan({
  rawInput,
  interpreted,
  domain,
}: {
  rawInput: string
  interpreted: InterpretedRequest
  domain: SituationDomainV2
}): TreatmentPlanContract {
  const hasMaterial = hasExplicitMaterialUrl(rawInput)
  const sourcePointer = pointsToExternalMaterial(rawInput)
  const missingMaterialAnswer = pointsToMissingMaterialAnswer(rawInput)
  const targetChoice = asksTargetChoice(rawInput, interpreted)
  const optionsMissing = asksUnspecifiedOptions(rawInput)
  const instructions = baseInstructions()

  if (interpreted.needs_clarification && interpreted.confidence < 0.45) {
    return {
      mode: 'collaborative_clarification',
      source_status: sourcePointer && !hasMaterial ? 'missing' : 'not_needed',
      can_generate: false,
      can_generate_exploratory: true,
      missing_material_fr: interpreted.confirmation_hypothesis
        ? [interpreted.confirmation_hypothesis]
        : ['precision sur l objet ou la decision attendue'],
      must_not_reinterpret_fr: [
        'ne pas remplacer une demande ambigue par une analyse generique',
      ],
      instructions,
      public_clarification_fr:
        interpreted.confirmation_hypothesis || 'Quelle precision changerait vraiment la lecture de cette situation ?',
      trace_notes: ['treatment_plan=collaborative_clarification', `domain=${domain}`],
    }
  }

  if (missingMaterialAnswer && !hasMaterial) {
    return {
      mode: 'resource_first',
      source_status: 'missing',
      can_generate: false,
      can_generate_exploratory: true,
      missing_material_fr: ['URL, document, extrait ou plug autorise'],
      must_not_reinterpret_fr: [
        'ne pas transformer une reference a une matiere absente en carte definitive',
        'ne pas conclure depuis un document, un site ou un plug non fourni',
      ],
      instructions: [
        ...instructions,
        {
          layer: 'dialogue',
          instruction_fr: 'Demander la matiere indiquee ou proposer une carte exploratoire explicitement provisoire.',
        },
      ],
      public_clarification_fr:
        'Je comprends que la matiere existe. Donnez l URL exacte, collez l extrait utile, ajoutez le document ou utilisez Plug ; sinon je peux produire une carte exploratoire clairement provisoire.',
      trace_notes: ['treatment_plan=resource_first', 'missing_material_answer', `domain=${domain}`],
    }
  }

  if ((targetChoice || interpreted.question_type === 'site_analysis') && sourcePointer && !hasMaterial) {
    return {
      mode: 'resource_first',
      source_status: 'missing',
      can_generate: false,
      can_generate_exploratory: true,
      missing_material_fr: ['URL, document ou plug autorise', 'matiere produit ou source exploitable'],
      must_not_reinterpret_fr: [
        'ne pas inventer la matiere indiquee par l utilisateur',
        'ne pas transformer une source absente en conclusion',
      ],
      instructions: [
        ...instructions,
        {
          layer: 'resources',
          instruction_fr: 'Demander la source manquante ou accepter une carte exploratoire explicitement provisoire.',
        },
      ],
      public_clarification_fr:
        'Donnez-moi l URL, un document ou un plug autorise ; sinon je peux produire une carte exploratoire clairement provisoire.',
      trace_notes: ['treatment_plan=resource_first', 'source_status=missing', `domain=${domain}`],
    }
  }

  if (targetChoice && !hasMaterial) {
    return {
      mode: 'resource_first',
      source_status: 'missing',
      can_generate: false,
      can_generate_exploratory: true,
      missing_material_fr: ['matiere produit', 'segments envisages', 'critere de priorite'],
      must_not_reinterpret_fr: [
        'ne pas remplacer le choix de cible par une analyse generale de marche',
      ],
      instructions,
      public_clarification_fr:
        'Pour choisir une cible, il manque la matiere produit ou les segments a comparer.',
      trace_notes: ['treatment_plan=resource_first', 'target_choice_without_material', `domain=${domain}`],
    }
  }

  if (optionsMissing && !hasMaterial) {
    return {
      mode: 'collaborative_clarification',
      source_status: 'not_needed',
      can_generate: false,
      can_generate_exploratory: true,
      missing_material_fr: ['options a comparer', 'critere de decision'],
      must_not_reinterpret_fr: [
        'ne pas inventer les options strategiques a la place de l utilisateur',
      ],
      instructions,
      public_clarification_fr:
        'Quelles sont les options a comparer, ou dois-je produire une carte exploratoire pour les faire emerger ?',
      trace_notes: ['treatment_plan=collaborative_clarification', 'options_missing', `domain=${domain}`],
    }
  }

  return {
    mode: hasMaterial ? 'direct_sc' : 'direct_sc',
    source_status: hasMaterial ? 'provided' : 'not_needed',
    can_generate: true,
    can_generate_exploratory: true,
    missing_material_fr: [],
    must_not_reinterpret_fr: [
      'ne pas remplacer la Situation soumise canonique par un domaine, une source ou un fallback local',
    ],
    instructions,
    trace_notes: [
      'treatment_plan=direct_sc',
      hasMaterial ? 'source_status=provided' : 'source_status=not_needed',
      `domain=${domain}`,
    ],
  }
}
