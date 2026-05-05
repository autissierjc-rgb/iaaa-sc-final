import { cleanModelText, parseModelJSON } from '../ai/json'
import { LECTURE_PROMPT } from '../prompts/lecture'
import type {
  ArbreACamesAnalysis,
  IntentContext,
  MetierProfileContext,
  PatternContext,
  ResourceItem,
  ScopeContext,
  SituationCard,
} from '../resources/resourceContract'
import { patternGuidance } from '../patterns/detectPatterns'
import { detectScopeContext } from '../scope/scopeContext'
import { buildCausalMatter } from '../text/diamondConcrete'
import { isUnderSituatedText } from '../validation/situatedText'
import { theatreAnchorText } from '../context/concreteTheatre'

type LectureResult = {
  lecture_systeme_fr: string
  lecture_systeme_en: string
}

function stripLeadIn(value: string): string {
  return cleanModelText(value)
    .replace(/^le point fragile (est|se situe dans|tient à|tient a)\s+/i, '')
    .replace(/^the fragile point (is|lies in)\s+/i, '')
    .replace(/^la contradiction centrale (est|tient à|tient a)\s+/i, '')
    .replace(/^the central contradiction (is|lies in)\s+/i, '')
    .trim()
}

function capitalizeFirst(value: string): string {
  if (!value) return value
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}

function siteBrief(resources: ResourceItem[]): ResourceItem | undefined {
  return resources.find((resource) => resource.type === 'site-brief')
}

function lineAfterPrefix(value: string, prefix: string): string {
  const line = value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => item.toLowerCase().startsWith(prefix.toLowerCase()))
  return cleanModelText(line?.slice(prefix.length).replace(/^[:\s]+/, '') ?? '')
}

function siteNameFromBrief(brief: ResourceItem | undefined, fallback: string): string {
  const titleName = cleanModelText(brief?.title.replace(/^Fiche site\s*-\s*/i, '') ?? '')
  if (titleName) return titleName
  try {
    return new URL(brief?.url ?? '').hostname.replace(/^www\./, '') || fallback
  } catch {
    return fallback
  }
}

function frenchSiteProduct(company: string, product: string): string {
  if (/platform that helps you start,\s*grow,\s*and manage your business/i.test(product)) {
    return `${company} se présente comme une plateforme qui aide à créer, développer et gérer une entreprise, avec une promesse de simplicité, d’équité et de transparence.`
  }
  return product
}

function establishedField(value: string): string {
  return /^non [ée]tabli/i.test(value) ? '' : value
}

function sentenceWithPeriod(value: string): string {
  const text = cleanModelText(value).replace(/\s+/g, ' ').trim()
  if (!text) return ''
  return /[.!?]$/.test(text) ? text : `${text}.`
}

function isGlobalQuestion(value: string): boolean {
  return /\b(monde|mondial|mondiale|global|globale|international|internationale|ordre mondial|2026|géopolitique|geopolitique|alliances?|march[eé]s?|p[eé]trole|[eé]nergie)\b/i.test(value)
}

function splitConcreteHints(value: unknown): string[] {
  if (typeof value === 'string') return value.split(/[,;:]/).map((item) => item.trim())
  if (Array.isArray(value)) return value.flatMap(splitConcreteHints)
  return []
}

function cleanAnchorLabel(value: string): string {
  const cleaned = value
    .replace(/\s+selon le cas\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned.includes('/')) return cleaned

  const [first] = cleaned.split('/').map((part) => part.trim()).filter(Boolean)
  return first || cleaned
}

function collectConcreteAnchors({
  situation,
  arbre,
  resources,
  sc,
}: {
  situation: string
  arbre: ArbreACamesAnalysis
  resources: ResourceItem[]
  sc?: SituationCard
}): string[] {
  const candidates = [
    ...splitConcreteHints(sc?.coverage_check?.missingCritical),
    ...splitConcreteHints(sc?.coverage_check?.requiredSignals),
    ...splitConcreteHints(sc?.scope_context?.global_channels),
    ...resources.flatMap((resource) => [resource.title, resource.source, resource.type]),
    situation,
    ...splitConcreteHints(arbre.acteurs),
    ...splitConcreteHints(arbre.forces),
    ...splitConcreteHints(arbre.contraintes),
    ...splitConcreteHints(arbre.incertitudes),
    ...splitConcreteHints(arbre.temps),
  ]

  const seen = new Set<string>()
  const generic = /\b(acteurs?|dirigeants?|institutions?|m[eé]diateurs?|situation|syst[eè]me|risque|canaux|contraintes?|incertitudes?|temporalit[eé]s?|seuils?|effets?|donn[eé]es?|sources?|signaux|marges?|lecture|question|contexte|analyse|global|local|selon le cas|[eé]ventuels?)\b/i

  return candidates
    .map((item) => cleanAnchorLabel(cleanModelText(item)))
    .filter((item) => item.length > 2 && item.length < 90)
    .filter((item) =>
      /[A-ZÀ-Ÿ]{2,}|[A-Z][a-zà-ÿ]+|\d|\//.test(item) ||
      /\b(énergie|pétrole|marché|marchés|sanctions|nucléaire|infrastructure|infrastructures|diplomatie|alliance|alliances)\b/i.test(item)
    )
    .filter((item) => !generic.test(item) || /[A-ZÀ-Ÿ]{2,}|\d|\//.test(item))
    .filter((item) => {
      const key = item.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 5)
}

function globalScaleAnchors(scope: ScopeContext): string[] {
  const channels = scope.global_channels.map((channel) => cleanModelText(channel).toLowerCase())
  const anchors = [
    'grandes puissances',
    channels.some((channel) => /march|économ|energie|énergie|petrole|pétrole/.test(channel)) ? 'marchés de l’énergie' : '',
    channels.some((channel) => /alliance|ordre international|diplomatie/.test(channel)) ? 'alliances et institutions internationales' : '',
    channels.some((channel) => /secur|sécur|militaire|seuil/.test(channel)) ? 'seuils militaires' : '',
    channels.some((channel) => /gouvernance|pouvoir|opinion|recit|récit/.test(channel)) ? 'récits publics et pouvoirs politiques' : '',
  ].filter(Boolean)

  return anchors.length > 2
    ? anchors
    : ['grandes puissances', 'marchés de l’énergie', 'alliances', 'institutions internationales', 'seuils militaires']
}

function compactForCompare(value: string): string {
  return cleanModelText(value).toLowerCase().replace(/\s+/g, ' ').trim()
}

function looksGenericLecture(value: string, situation: string): boolean {
  const text = compactForCompare(value)
  const rawQuestion = compactForCompare(situation)
  const rawQuestionFragment = rawQuestion.slice(0, 60)

  return [
    'la situation ne se réduit pas à l’événement visible',
    'la situation ne se reduit pas a l evenement visible',
    'acteurs et séquences disponibles dans la situation fournie',
    'acteurs et sequences disponibles dans la situation fournie',
    'ce qui tient encore n’est pas forcément ce qui protège le système',
    'ce qui tient encore n est pas forcement ce qui protege le systeme',
    'un acteur qui change de rythme, une décision qui rend le coût visible',
    'contraintes, temporalités et perceptions',
    'distribution des leviers',
    'qui peut agir, bloquer, légitimer',
    'qui peut agir bloquer legitimer',
    'la façade peut encore fonctionner',
    'la facade peut encore fonctionner',
    'ce qui garde encore la face',
  ].some((marker) => text.includes(marker)) ||
    (rawQuestionFragment.length > 30 && text.includes(rawQuestionFragment))
}

function isCausalAttributionContext(intentContext?: IntentContext, sc?: SituationCard): boolean {
  return intentContext?.interpreted_request?.question_type === 'causal_attribution' ||
    intentContext?.dominant_frame === 'causal_attribution' ||
    sc?.intent_context?.interpreted_request?.question_type === 'causal_attribution' ||
    sc?.intent_context?.dominant_frame === 'causal_attribution'
}

function causalAttributionFallbackLecture(
  situation: string,
  arbre: ArbreACamesAnalysis,
  intentContext?: IntentContext,
  sc?: SituationCard
): LectureResult {
  const interpreted = intentContext?.interpreted_request ?? sc?.intent_context?.interpreted_request
  const matter = buildCausalMatter({
    situation,
    arbre,
    sc: {
      ...(sc ?? {}),
      intent_context: intentContext ?? sc?.intent_context,
    } as SituationCard,
  })
  const hypothesis = cleanModelText(interpreted?.primary_hypothesis || interpreted?.user_question || situation)

  return {
    lecture_systeme_fr: cleanModelText(
      `${hypothesis} met en tension ${matter.sourceActor}, ${matter.targetActor} et ${matter.event}. La question centrale est de savoir si ${matter.sourceActor} a seulement influencé le cadre, ou s’il a réellement déplacé la décision de ${matter.targetActor}.\n\n` +
      `${matter.causalChannels[0]}. Mais ${matter.counterChannels[0]}. C’est cette zone qui porte la contradiction : connivence, pression ou intérêt commun ne valent pas encore preuve de causalité.\n\n` +
      `Le point de bascule serait une trace reliant les acteurs à l’arbitrage : ${matter.proofSignals.join(', ')}. Sans ce lien, la lecture reste prudente mais concrète : influence possible, causalité non établie, canaux à enquêter.`
    ),
    lecture_systeme_en: cleanModelText(
      `The question first asks for an answer to a causal hypothesis. The reading must not describe the whole situation before separating what is established, plausible, not established, and missing.\n\n` +
      `The central contradiction is the difference between influence and decision. One actor may push, frame, or pressure, but the other actor's action also depends on self-interest, constraints, institutions, costs, and possible counter-hypotheses.\n\n` +
      `The tipping point would be verifiable evidence linking influence and decision: chronology, private trace, statement, institutional channel, material interest, formal order, or solid testimony. Without that, SC must remain cautious and state what is missing.`
    ),
  }
}

function hasDiamondParagraphs(value: string): boolean {
  const paragraphs = cleanModelText(value)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  return paragraphs.length >= 2 && paragraphs.length <= 3
}

function extractOpenAIText(data: Record<string, unknown>): string {
  if (typeof data.output_text === 'string') return data.output_text

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

async function generateLectureWithOpenAI(context: Record<string, unknown>): Promise<LectureResult> {
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
        model: 'gpt-4.1-mini',
        max_tokens: 900,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: `${LECTURE_PROMPT}\n\nContext:\n${JSON.stringify(context, null, 2)}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI lecture failed: ${response.status}`)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    const parsed = parseModelJSON(typeof content === 'string' ? content : extractOpenAIText(data))
    return {
      lecture_systeme_fr: cleanModelText(parsed.lecture_systeme_fr),
      lecture_systeme_en: cleanModelText(parsed.lecture_systeme_en),
    }
  } finally {
    clearTimeout(timeout)
  }
}

function fallbackLecture(
  situation: string,
  arbre: ArbreACamesAnalysis,
  resources: ResourceItem[],
  sc?: SituationCard,
  patternContext?: PatternContext,
  metierProfile?: MetierProfileContext,
  intentContext?: IntentContext,
  scopeContext?: ScopeContext
): LectureResult {
  const concreteTheatre = sc?.concrete_theatre ?? sc?.coverage_check?.concrete_theatre
  const concreteAnchors = theatreAnchorText(concreteTheatre, 8)
  const degradedMessageFr =
    'La lecture complète ne peut pas être générée pour le moment. La situation peut être reprise avec des faits, acteurs, dates ou sources fournis par l’utilisateur, puis régénérée lorsque le service de génération est disponible.'
  const degradedMessageEn =
    'The full reading cannot be generated right now. The situation can be refined with facts, actors, dates, or sources provided by the user, then regenerated when generation is available.'

  if (sc?.generation_status === 'degraded') {
    return {
      lecture_systeme_fr: cleanModelText(sc.generation_error_public ?? degradedMessageFr),
      lecture_systeme_en: cleanModelText(sc.generation_error_public ? degradedMessageEn : degradedMessageEn),
    }
  }

  if (isCausalAttributionContext(intentContext, sc)) {
    return causalAttributionFallbackLecture(situation, arbre, intentContext, sc)
  }

  if (intentContext?.dominant_frame === 'site_analysis' || intentContext?.dominant_frame === 'startup_investment') {
    const brief = siteBrief(resources)
    const company = siteNameFromBrief(
      brief,
      cleanModelText(intentContext.interpreted_request?.object_of_analysis || 'ce site')
    )
    if (!brief) {
      return {
        lecture_systeme_fr: cleanModelText(
          `${company} est l’objet à vérifier, mais la carte ne dispose pas encore d’une source exploitable pour dire précisément ce que l’entreprise fait. La situation doit donc rester centrée sur la décision demandée : comprendre l’offre avant d’envisager de la rejoindre avec votre startup.\n\n` +
          `La contradiction centrale tient à l’écart entre l’intérêt possible et la preuve disponible. Sans URL officielle, contenu produit, clients, cas d’usage, conditions de collaboration ou signaux externes, SC ne doit pas transformer un nom d’entreprise en analyse de marché.\n\n` +
          `Le point de bascule sera une source contrôlable : site officiel, démonstration, description produit, clients ou partenaires vérifiables, prix, conditions juridiques et sociales, ou retour d’utilisateur. Sans cela, la lecture reste prudente et la bonne relance est de demander la source ou de générer explicitement une carte provisoire.`
        ),
        lecture_systeme_en: cleanModelText(
          `${company} is the object to verify, but the card does not yet have a usable source to state precisely what the company does. The situation must therefore stay centered on the requested decision: understanding the offer before considering joining it with your startup.\n\n` +
          `The central contradiction is the gap between possible interest and available proof. Without an official URL, product content, customers, use cases, collaboration terms, or external signals, SC must not turn a company name into a market analysis.\n\n` +
          `The tipping point is a controllable source: official site, demo, product description, verifiable customers or partners, pricing, legal and social terms, or user feedback. Without that, the reading remains cautious.`
        ),
      }
    }
    const excerpt = brief?.excerpt ?? ''
    const product = establishedField(lineAfterPrefix(excerpt, 'Ce que fait l’entreprise')) ||
      establishedField(lineAfterPrefix(excerpt, 'Ce que le site permet d’établir')) ||
      `${company} doit d’abord être compris par son produit, sa cible, son usage, ses preuves visibles et ses angles morts.`
    const productFr = frenchSiteProduct(company, product)
    const proof = establishedField(lineAfterPrefix(excerpt, 'Preuves ou signaux visibles')) ||
      'Les preuves visibles restent à qualifier : clients, usages répétés, revenus, partenariats, rétention ou décisions d’achat.'
    const market = /march[eé]\s+europ|europe|europ[eé]en/i.test(situation)
      ? 'le marché européen'
      : 'le marché visé'
    const productSentence = sentenceWithPeriod(productFr)
    const proofSentence = sentenceWithPeriod(proof)

    return {
      lecture_systeme_fr: cleanModelText(
        `${productSentence} La première lecture doit donc séparer ce que ${company} affirme faire, la cible visée, l’usage réel et les preuves déjà visibles.\n\n` +
        `La contradiction centrale tient à l’écart entre ce que le site rend lisible et ce que le marché doit encore confirmer. Une page peut clarifier une ambition sans prouver l’adoption ; pour ${market}, il faut aussi vérifier les angles morts décisifs : droit, travail, fiscalité, responsabilité, rôle éventuel de l’État, normes sociales ou infrastructures.\n\n` +
        `Le point de bascule ne sera pas une meilleure formulation du site, mais une preuve observable. ${proofSentence} Si ces signaux deviennent vérifiables et que les angles morts critiques sont levés, l’analyse peut passer d’un avis sur le positionnement à une vraie lecture de potentiel. Sinon, la carte doit rester prudente.`
      ),
      lecture_systeme_en: cleanModelText(
        `${sentenceWithPeriod(product)} The first reading should separate what ${company} claims to do, the target user, the real use case, and the proof already visible.\n\n` +
        `The central contradiction is the gap between what the website makes legible and what the market still has to confirm. A page can clarify an ambition without proving adoption; for ${market}, the key is who needs the product, why now, and what truly differentiates the offer.\n\n` +
        `The tipping point will not be better website wording, but observable proof. ${proofSentence} If those signals become verifiable, the analysis can move from a positioning opinion to a real potential reading. Otherwise, the card must remain cautious.`
      ),
    }
  }

  if (intentContext?.dominant_frame === 'personal_relationship') {
    const familyDevelopment = /\b(fils|fille|enfant|ado|adolescent|adolescente|parent|sport|p[eê]che|carpe|loisir|passion|motivation)\b/i.test(situation)

    if (familyDevelopment) {
      return {
        lecture_systeme_fr: cleanModelText(
          `La situation ne parle pas seulement d’un adolescent qui réagit mal à une déception. Elle fait apparaître plusieurs forces discrètes : désir d’autonomie, regard parental, fatigue possible, passion investie, honte de l’échec et besoin de ne pas perdre la face.\n\n` +
          `La contradiction centrale est délicate : ce qui devait être un moment partagé peut devenir, à quatorze ans, une scène où l’échec paraît exposer l’adolescent. Le retrait ou le reproche ne sont donc pas forcément une accusation stable ; ils peuvent être une manière de reprendre la main, d’éviter la honte, ou de vérifier que le lien tient encore.\n\n` +
          `Le point de bascule sera le moment où la question cessera d’être “qui est responsable ?” pour devenir “comment reconnaître la déception sans enfermer chacun dans son rôle ?”. Le signal utile est sa capacité à revenir au lien, même indirectement, sans devoir justifier toute son émotion.`
        ),
        lecture_systeme_en: cleanModelText(
          `The situation is not only about a teenager reacting badly to disappointment. Several quiet powers are present: a need for autonomy, the parental gaze, possible fatigue, invested passion, shame around failure, and the need not to lose face.\n\n` +
          `The central contradiction is delicate: what was meant to be a shared moment can, at fourteen, become a stage where failure feels exposed. Withdrawal or blame may therefore be less a stable accusation than a way to regain control, avoid shame, or check that the bond still holds.\n\n` +
          `The tipping point comes when the question stops being who is responsible and becomes how to recognize disappointment without trapping either person in a role. The useful signal is his ability to return to the bond, even indirectly, without having to justify every emotion.`
        ),
      }
    }

    return {
      lecture_systeme_fr: cleanModelText(
        `La situation doit rester attachée à la scène relationnelle concrète. ${concreteAnchors ? `Les éléments à garder au centre sont : ${concreteAnchors}. ` : ''}Elle ne demande pas de transformer un signe affectif en preuve immédiate ; elle demande de comprendre ce qu’un message, une distance, une reprise de contact ou une rencontre possible peuvent ouvrir sans surinterpréter.\n\n` +
        `La contradiction centrale tient à l’écart entre le signe et l’intention. Un cœur, une parole douce, une proposition ou une venue peuvent compter réellement, mais ils ne disent pas seuls ce qui va se passer. Le lien se clarifie par la suite des actes : rythme des messages, initiative concrète, disponibilité, manière de nommer ou d’éviter l’ambiguïté.\n\n` +
        `Le point de bascule sera simple et observable : une proposition de rendez-vous, une parole plus explicite, une cohérence entre le ton et les actes, ou au contraire un retrait qui montre que le signe servait surtout à maintenir une chaleur sans ouvrir davantage.`
      ),
      lecture_systeme_en: cleanModelText(
        `The situation must remain tied to the concrete relational scene. It is not about turning an affectionate sign into immediate proof; it is about understanding what a message, distance, renewed contact, or possible meeting may open without over-reading it.\n\n` +
        `The central contradiction lies between sign and intention. A heart, a warm sentence, a proposal, or a visit may matter, but none of them alone says what will happen. The bond clarifies through subsequent acts: message rhythm, concrete initiative, availability, and the way ambiguity is named or avoided.\n\n` +
        `The tipping point will be simple and observable: a meeting proposal, clearer words, coherence between tone and action, or withdrawal showing that the sign mainly preserved warmth without opening more.`
      ),
    }
  }

  if (
    intentContext?.interpreted_request?.intent_type === 'understand' &&
    intentContext.dominant_frame !== 'site_analysis' &&
    intentContext.dominant_frame !== 'startup_investment' &&
    intentContext.dominant_frame !== 'geopolitical_crisis' &&
    intentContext.dominant_frame !== 'personal_relationship' &&
    intentContext.surface_domain !== 'war' &&
    intentContext.surface_domain !== 'personal' &&
    intentContext.interpreted_request.domain !== 'war' &&
    intentContext.interpreted_request.domain !== 'personal' &&
    intentContext.decision_type !== 'analyze_site' &&
    intentContext.decision_type !== 'evaluate_investment'
  ) {
    const object = cleanModelText(intentContext.interpreted_request.object_of_analysis || 'l’objet de la question')
      .replace(/[.;:]+$/g, '')
    const objectSentence = capitalizeFirst(object)
    const tension = cleanModelText(intentContext.interpreted_request.implicit_tension || 'un format visible continue à organiser la confiance, la preuve et la décision')
      .replace(/[.;:]+$/g, '')

    return {
      lecture_systeme_fr: cleanModelText(
        `${objectSentence} ne se réduit pas à une impression générale. ${concreteAnchors ? `Le théâtre réel à garder au centre est : ${concreteAnchors}. ` : ''}La situation se joue dans l’écart entre ce qui est craint, ce qui est possible et ce que des acteurs peuvent réellement transformer en acte, blocage, décision ou changement de rythme.\n\n` +
        `La contradiction centrale tient à ceci : ${tension}. Une perception peut peser avant d’être prouvée, mais elle ne devient structurante que si elle trouve des relais capables de la porter, de la légaliser, de la médiatiser ou de la bloquer.\n\n` +
        `Le point de bascule sera observable : décision, refus, procédure, consigne publique, calendrier modifié, preuve nouvelle ou acteur qui change de registre. À ce moment-là, la situation cesse d’être seulement une crainte et devient un rapport de force.`
      ),
      lecture_systeme_en: cleanModelText(
        `${object} is not just a general concern. The situation lies in the gap between what is feared, what is possible, and what actors can actually turn into action, blockage, decision, or a change of tempo.\n\n` +
        `The central contradiction is this: ${tension}. A perception can carry weight before it is proven, but it becomes structuring only if it finds channels able to carry, legalize, publicize, or block it.\n\n` +
        `The tipping point will be observable: decision, refusal, procedure, public instruction, changed calendar, new proof, or an actor changing register. At that moment, the situation stops being only a fear and becomes a power relation.`
      ),
    }
  }

  if (intentContext?.dominant_frame === 'founder_governance') {
    return {
      lecture_systeme_fr: cleanModelText(
        `La question n’est pas seulement de savoir si une personne brillante peut aider à scaler la startup. Elle porte sur l’entrée d’une ancienne relation dans le cœur de gouvernance : rôle, pouvoir, parts, dette symbolique et capacité à décider ensemble quand la pression montera.\n\n` +
        `La contradiction centrale est nette : ce qui a ouvert la porte au projet peut devenir ce qui le rend difficile à gouverner. Son profil INSEAD ou Polytechnique peut renforcer l’exécution, mais il ne règle pas la question décisive : pouvez-vous transformer une relation passée en pacte d’associés clair, réversible et supportable ?\n\n` +
        `Le point de bascule sera le moment où le désaccord ne portera plus sur l’affectif mais sur une décision concrète : parts, périmètre, recrutement, stratégie ou autorité finale. Avant de dire oui ou non, il faut donc définir les conditions de pouvoir, de sortie et de conflit.`
      ),
      lecture_systeme_en: cleanModelText(
        `The question is not simply whether a brilliant person can help scale the startup. It is about bringing a former relationship into the core of governance: role, power, equity, symbolic debt, and the ability to make decisions together under pressure.\n\n` +
        `The central contradiction is clear: what opened the door to the project may become what makes it hard to govern. Her INSEAD or Polytechnique profile may strengthen execution, but it does not answer the decisive question: can a past relationship become a clear, reversible, and bearable cofounder pact?\n\n` +
        `The tipping point will come when disagreement no longer concerns emotion but a concrete decision: equity, scope, hiring, strategy, or final authority. Before saying yes or no, the conditions of power, exit, and conflict must be defined.`
      ),
    }
  }

  if (metierProfile?.id === 'vc_investisseur' && intentContext?.dominant_frame === 'startup_investment') {
    const object = cleanModelText(
      intentContext?.interpreted_request?.object_of_analysis ||
      sc?.intent_context?.interpreted_request?.object_of_analysis ||
      'ce dossier'
    )
    return {
      lecture_systeme_fr: cleanModelText(
        `La sélection par un VC ne repose pas seulement sur l’idée, mais sur l’écart entre la promesse racontée et la preuve déjà observable. Pour ${object}, la question est de savoir si la proposition répond à une douleur assez nette pour créer un usage répété, une volonté de payer et une recommandation par des métiers à forte valeur.\n\n` +
        `La contradiction centrale tient au passage entre un produit de lecture stratégique et une opportunité investissable. Un VC cherchera la preuve que le cas d’usage n’est pas trop artisanal, que le marché cible est identifiable, que la différenciation est défendable et que l’équipe peut transformer une intuition forte en distribution scalable.\n\n` +
        `Le point de bascule sera concret : premiers utilisateurs qualifiés, usage répété, preuve de willingness to pay, pipeline crédible, ou signal fort venu de consultants, dirigeants, analystes ou investisseurs. Sans ces preuves, le projet reste intéressant ; avec elles, il devient un dossier investissable.`
      ),
      lecture_systeme_en: cleanModelText(
        `VC selection is not only about the idea; it is about the gap between the pitch and observable proof. For ${object}, the question is whether the proposition solves a pain strong enough to create repeated usage, willingness to pay, and recommendation by high-value professional users.\n\n` +
        `The central contradiction is the move from a strategic reading product to an investable opportunity. A VC will look for proof that the use case is not too bespoke, that the target market is identifiable, that differentiation is defensible, and that the team can turn a strong insight into scalable distribution.\n\n` +
        `The tipping point is concrete: qualified early users, repeated usage, willingness to pay, a credible pipeline, or strong signals from consultants, executives, analysts, or investors. Without those proofs, the project is interesting; with them, it becomes investable.`
      ),
    }
  }

  if (
    intentContext?.dominant_frame === 'professional_decision' &&
    /\b(pitch|jury|pairs?|presentation|présentation|anglais|lancement|lancer|entrain|entraine)\b/i.test(situation)
  ) {
    return {
      lecture_systeme_fr: cleanModelText(
        `La situation ne parle pas seulement d’un pitch à préparer. Elle met en jeu plusieurs forces très concrètes : le regard des pairs, l’autorité du jury, l’anglais moyen, le manque de répétition, la proximité du lancement et la nécessité de rendre IAAA immédiatement lisible.\n\n` +
        `La contradiction centrale est simple : le projet peut être fort, mais le moment public évaluera d’abord la clarté, la confiance et la capacité à répondre sous pression. Le risque n’est donc pas de ne pas tout dire ; c’est de vouloir trop dire, trop tard, dans une langue qui ajoute de la charge.\n\n` +
        `Le point de bascule sera le moment où le pitch cessera d’être une explication de projet pour devenir une preuve de leadership. Il faut donc resserrer : une promesse, trois preuves, une demande, puis des réponses courtes aux objections probables.`
      ),
      lecture_systeme_en: cleanModelText(
        `The situation is not only about preparing a pitch. Several concrete forces are at play: peers watching, jury authority, average English, lack of rehearsal, proximity of launch, and the need to make IAAA immediately legible.\n\n` +
        `The central contradiction is simple: the project may be strong, but the public moment will first evaluate clarity, confidence, and the ability to answer under pressure. The risk is not saying too little; it is trying to say too much, too late, in a language that adds load.\n\n` +
        `The tipping point comes when the pitch stops being a project explanation and becomes proof of leadership. The move is to tighten: one promise, three proofs, one ask, then short answers to likely objections.`
      ),
    }
  }

  const main = stripLeadIn(
    cleanModelText(sc?.main_vulnerability_fr) ||
    arbre.main_vulnerability_candidate ||
    'la capacite du systeme a absorber la pression sans perdre sa coherence'
  )
  const contradiction = stripLeadIn(
    cleanModelText(sc?.asymmetry_fr) ||
    arbre.load_bearing_contradiction ||
    'les acteurs gerent l urgence visible pendant que les fragilites structurelles s accumulent'
  )
  const guidance = patternGuidance(patternContext)
  const humanHint = guidance.length > 0
    ? ` Le diagnostic doit rester concret : ${guidance[0]}.`
    : ''
  const scope = scopeContext ?? sc?.scope_context ?? detectScopeContext(situation, arbre)
  const wideGlobal = scope.scope === 'global' || isGlobalQuestion(situation)

  if (wideGlobal) {
    const primary = scope.primary_theatre ?? 'le théâtre principal'
    const secondary = scope.secondary_theatres.length > 1
      ? scope.secondary_theatres.join(', ')
      : 'les acteurs extérieurs et les puissances concernées'
    const channels = scope.global_channels.length > 0
      ? scope.global_channels.join(', ')
      : 'sécurité, énergie, marchés, alliances et diplomatie'
    const macroAnchors = globalScaleAnchors(scope)
    const anchorSentence = ` Une crise devient mondiale lorsqu’elle touche plusieurs circuits à la fois : ${macroAnchors.join(', ')}. Le théâtre initial sert ici de révélateur : il montre un monde qui ne casse pas d’un seul bloc, mais qui absorbe les chocs par compartiments.`

    return {
      lecture_systeme_fr: cleanModelText(
        `La question porte sur l’état du monde. Le théâtre initial n’est pas le centre de gravité ; il sert à voir quels acteurs, marchés, alliances ou récits peuvent encore contenir, financer, légitimer, bloquer ou déplacer le risque.${anchorSentence}\n\n` +
        `La contradiction centrale tient à ceci : chacun cherche à limiter le coût immédiat tout en testant sa marge d’action. Les vrais capteurs ne sont donc pas seulement les déclarations publiques, mais les canaux où un signal change de nature : ${channels}.\n\n` +
        `Le point de bascule sera le moment où la situation cessera d’être lisible comme une crise locale et deviendra un signal systémique : rupture diplomatique, choc de marché, déplacement d’alliance, incident attribué ou pression directe sur une infrastructure critique. Le monde ne rompt pas encore ; il absorbe les chocs par compartiments.`
      ),
      lecture_systeme_en: cleanModelText(
        `The question is not only about ${primary}. It asks what this theatre reveals about a wider balance: ${secondary} do not necessarily read the same crisis through the same thresholds.\n\n` +
        `The central contradiction is that each actor seeks to contain the immediate cost while testing room for power. The real sensors are therefore not only public statements, but the channels through which the crisis can travel: ${channels}.\n\n` +
        `The tipping point will come when the situation stops being contained in its initial theatre and becomes a systemic signal: diplomatic rupture, market shock, alliance shift, attributed incident, or direct pressure on critical infrastructure. The question is no longer only what is happening locally; it is what the crisis forces the rest of the system to reveal.`
      ),
    }
  }

  return {
    lecture_systeme_fr: cleanModelText(
      `La situation ne se réduit pas à l’événement visible. Elle révèle une distribution de leviers : qui peut agir, bloquer, légitimer, user, protéger ou faire basculer. La contradiction porteuse est nette : ${contradiction}.\n\n` +
      `Ce qui garde encore la face n’est pas forcément ce qui protège vraiment. Le point fragile est ${main}. C’est là que la tension cesse d’être seulement une lecture et devient une contrainte réelle.${humanHint}\n\n` +
      `La bascule à surveiller sera concrète : un acteur qui change de rythme, une décision qui rend le coût visible, un refus qui bloque, ou un seuil qui oblige les parties à sortir du flou. À ce moment-là, la situation ne sera plus seulement contenue ; elle changera de logique.`
    ),
    lecture_systeme_en: cleanModelText(
      `The situation is not reducible to the visible event. It is held together by a load-bearing contradiction: ${contradiction}.\n\n` +
      `What still holds is not necessarily what protects the system. The fragile point is ${main}. That is where the tension stops being only a reading and becomes a real constraint.\n\n` +
      `The tipping point to watch will be concrete: an actor changing tempo, a decision making the cost visible, or a threshold forcing the parties out of ambiguity. At that point, the situation will no longer be merely contained; it will change logic.`
    ),
  }
}

export async function generateLecture({
  situation,
  arbre,
  sc,
  resources = [],
  patternContext,
  metierProfile,
  intentContext,
  scopeContext,
}: {
  situation: string
  arbre: ArbreACamesAnalysis
  sc: SituationCard
  resources?: ResourceItem[]
  patternContext?: PatternContext
  metierProfile?: MetierProfileContext
  intentContext?: IntentContext
  scopeContext?: ScopeContext
}): Promise<LectureResult> {
  const fallback = fallbackLecture(situation, arbre, resources, sc, patternContext, metierProfile, intentContext, scopeContext)
  if (
    intentContext?.dominant_frame === 'site_analysis' ||
    intentContext?.dominant_frame === 'startup_investment' ||
    isCausalAttributionContext(intentContext, sc)
  ) {
    return fallback
  }
  const effectiveScope = scopeContext ?? sc?.scope_context ?? detectScopeContext(situation, arbre)
  const wideGlobal = effectiveScope.scope === 'global' || isGlobalQuestion(situation)
  const context = {
    situation,
    arbre,
    sc,
    resources,
    pattern_context: patternContext,
    metier_profile: metierProfile,
    intent_context: intentContext,
    scope_context: scopeContext,
    concrete_theatre: sc.concrete_theatre ?? sc.coverage_check?.concrete_theatre,
    pattern_guidance: patternGuidance(patternContext),
  }

  try {
    const openai = await generateLectureWithOpenAI(context)
    const lecture_systeme_fr = openai.lecture_systeme_fr || fallback.lecture_systeme_fr
    const lecture_systeme_en = openai.lecture_systeme_en || fallback.lecture_systeme_en

    if (
      !hasDiamondParagraphs(lecture_systeme_fr) ||
      looksGenericLecture(lecture_systeme_fr, situation) ||
      (wideGlobal && looksGenericLecture(lecture_systeme_fr, situation))
      || isUnderSituatedText(lecture_systeme_fr, sc.concrete_theatre ?? sc.coverage_check?.concrete_theatre, 2)
    ) {
      return fallback
    }

    return { lecture_systeme_fr, lecture_systeme_en }
  } catch (error) {
    console.warn('generateLecture OpenAI fallback:', error)
    return fallback
  }
}
