import { detectDomain } from '../coverage/detectDomain'
import type { PowerInPresence, PowersContext, ResourceItem, SituationDomain } from '../resources/resourceContract'

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function hasAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term))
}

function power(
  name: string,
  family: PowerInPresence['family'],
  role: string,
  visibility: PowerInPresence['visibility'] = 'visible'
): PowerInPresence {
  return { name, family, role, visibility }
}

function uniquePowers(items: PowerInPresence[]): PowerInPresence[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = `${item.name}:${item.family}`.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function isWarSecurityText(text: string): boolean {
  return hasAny(text, [
    'guerre',
    'militaire',
    'frappe',
    'bombard',
    'missile',
    'cessez',
    'sanction',
    'nucleaire',
    'nucléaire',
    'frontiere',
    'frontière',
    'otan',
    'otage',
    'attaque',
    'riposte',
    'escalade',
    'dissuasion',
    'iran',
    'israel',
    'gaza',
    'ukraine',
    'russie',
    'chine',
    'taiwan',
    'ormuz',
  ])
}

function baseByDomain(domain: SituationDomain, text: string): PowerInPresence[] {
  if (domain === 'geopolitics' && !isWarSecurityText(text)) {
    return [
      power('Dirigeants et partis', 'actor', 'peuvent cadrer le récit, accepter ou contester une règle'),
      power('Institutions', 'institutional', 'donnent une forme légale aux décisions et aux conflits'),
      power('Opinion publique', 'symbolic', 'transforme une inquiétude diffuse en pression politique'),
      power('Médias et récits publics', 'narrative', 'rendent une version de la situation crédible ou suspecte'),
      power('Calendrier politique', 'temporal', 'réduit la marge de choix quand les échéances approchent'),
    ]
  }

  if (domain === 'geopolitics' || domain === 'war') {
    return [
      power('États et dirigeants', 'actor', 'définissent les seuils officiels et le coût politique'),
      power('Forces militaires et sécuritaires', 'material', 'peuvent imposer le rythme ou déplacer le seuil de violence'),
      power('Marchés, énergie et infrastructures', 'financial', 'transforment une crise locale en coût externe'),
      power('Alliances et médiateurs', 'institutional', 'contiennent, légitiment ou échouent à contenir la séquence'),
      power('Récits publics', 'narrative', 'donnent une forme acceptable à la riposte, à la retenue ou à l’escalade'),
    ]
  }

  if (domain === 'startup_vc') {
    return [
      power('Capital', 'financial', 'donne ou retire du temps stratégique'),
      power('Traction', 'material', 'prouve que le marché répond autrement qu’en discours'),
      power('Distribution', 'institutional', 'transforme le produit en accès réel au marché'),
      power('Équipe fondatrice', 'actor', 'porte l’exécution, la crédibilité et les arbitrages difficiles'),
      power('Narratif investisseur', 'narrative', 'rend le risque lisible, finançable ou au contraire suspect'),
    ]
  }

  if (domain === 'personal') {
    return [
      power('Autonomie', 'affective', 'cherche à reprendre de la marge sans forcément pouvoir l’expliquer'),
      power('Regard de l’autre', 'symbolic', 'peut soutenir, exposer, juger ou rendre la perte de face trop coûteuse'),
      power('Attachement', 'affective', 'maintient le lien même quand la situation devient difficile à nommer'),
      power('Corps, fatigue ou désir', 'bodily', 'orientent le comportement avant même les raisons conscientes'),
      power('Honte ou comparaison', 'affective', 'peut bloquer l’action sous une forme silencieuse', 'hidden'),
    ]
  }

  if (domain === 'management' || domain === 'professional' || domain === 'governance') {
    return [
      power('Mandat officiel', 'institutional', 'autorise ou limite ce que chacun peut faire'),
      power('Rôle réel', 'actor', 'porte souvent plus que ce qui est écrit'),
      power('Hiérarchie et arbitrage', 'institutional', 'peuvent trancher, ralentir ou laisser la tension s’installer'),
      power('Reconnaissance', 'symbolic', 'rend visible ou invisible la contribution qui soutient le système'),
      power('Charge collective', 'social', 'use les acteurs quand elle reste mal distribuée', 'hidden'),
    ]
  }

  if (domain === 'economy') {
    return [
      power('Prix', 'financial', 'révèlent le coût réel plus vite que les discours'),
      power('Liquidité et crédit', 'financial', 'donnent ou retirent de la marge d’action'),
      power('Régulation', 'institutional', 'peut stabiliser, contraindre ou déplacer le risque'),
      power('Confiance', 'narrative', 'fait tenir la valeur tant que les acteurs y croient'),
    ]
  }

  if (domain === 'humanitarian') {
    return [
      power('Accès terrain', 'material', 'détermine ce qui peut réellement être protégé'),
      power('Acteurs armés ou autorités locales', 'actor', 'ouvrent, bloquent ou conditionnent l’aide'),
      power('Logistique', 'material', 'transforme l’intention humanitaire en capacité concrète'),
      power('Légitimité institutionnelle', 'institutional', 'protège ou fragilise l’intervention'),
    ]
  }

  const generic = [
    power('Acteurs visibles', 'actor', 'portent les décisions et les gestes observables'),
    power('Contraintes matérielles', 'material', 'limitent ce qui peut être fait maintenant'),
    power('Règles et institutions', 'institutional', 'donnent ou retirent l’autorisation d’agir'),
    power('Récit dominant', 'narrative', 'rend une version de la situation plus acceptable qu’une autre'),
    power('Temps', 'temporal', 'transforme une tension lente en urgence ou en fenêtre d’action'),
  ]

  if (hasAny(text, ['famille', 'enfant', 'parent', 'fils', 'fille', 'ado'])) {
    return [...baseByDomain('personal', text), ...generic]
  }

  return generic
}

function inferExtraPowers(text: string, resources: ResourceItem[]): PowerInPresence[] {
  const items: PowerInPresence[] = []

  if (hasAny(text, ['sport', 'tennis', 'corps', 'fatigue'])) {
    items.push(power('Rapport au corps', 'bodily', 'peut soutenir le désir d’agir ou rendre l’exposition trop coûteuse', 'ambiguous'))
  }

  if (hasAny(text, ['reseau', 'réseau', 'influence', 'media', 'média', 'opinion'])) {
    items.push(power('Opinion et visibilité', 'symbolic', 'peuvent accélérer la reconnaissance ou la perte de face', 'ambiguous'))
  }

  if (hasAny(text, ['urgent', 'retard', 'fenetre', 'fenêtre', 'delai', 'délai'])) {
    items.push(power('Fenêtre temporelle', 'temporal', 'réduit la marge de choix quand elle se referme'))
  }

  if (resources.length > 0) {
    items.push(power('Sources externes', 'institutional', 'apportent des contraintes factuelles et limitent la lecture purement intuitive'))
  }

  return items
}

export function analyzePowersInPresence(
  situation: string,
  resources: ResourceItem[] = []
): PowersContext {
  const text = normalize(situation)
  const domain = detectDomain(situation)
  const all = uniquePowers([...baseByDomain(domain, text), ...inferExtraPowers(text, resources)])
  const hidden = all.filter((item) => item.visibility === 'hidden' || ['affective', 'symbolic', 'narrative', 'bodily'].includes(item.family)).slice(0, 4)
  const blocking = all.filter((item) => ['blocking', 'institutional', 'material'].includes(item.family)).slice(0, 4)
  const tipping = all.filter((item) => ['tipping', 'temporal', 'financial', 'material', 'actor'].includes(item.family)).slice(0, 4)
  const primary = all.slice(0, 6)

  return {
    domain_hint: domain,
    primary,
    hidden,
    blocking,
    tipping,
    synthesis_fr: `Puissances en présence : ${primary.map((item) => `${item.name} (${item.role})`).join('; ')}.`,
    synthesis_en: `Powers in presence: ${primary.map((item) => `${item.name} (${item.role})`).join('; ')}.`,
  }
}

export function powersAxisLine(context: PowersContext): string {
  return context.synthesis_fr
}
