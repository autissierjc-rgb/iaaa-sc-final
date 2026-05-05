import type {
  ArbreACamesAnalysis,
  ScopeContext,
  SituationScope,
} from '../resources/resourceContract'

function has(text: string, pattern: RegExp): boolean {
  return pattern.test(text)
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.filter(Boolean)))
}

function detectPrimaryTheatre(text: string): string | undefined {
  const theatres: Array<[RegExp, string]> = [
    [/\b(iran|iranien|t[eé]h[eé]ran)\b/i, 'Iran'],
    [/\b(isra[eë]l|tel-aviv)\b/i, 'Israël'],
    [/\b(ukraine|kyiv|kiev)\b/i, 'Ukraine'],
    [/\b(russie|moscou)\b/i, 'Russie'],
    [/\b(chine|p[eé]kin|taiwan)\b/i, 'Chine / Taïwan'],
    [/\b(gaza|palestin|hamas)\b/i, 'Gaza'],
    [/\b(sahel|mali|niger|burkina)\b/i, 'Sahel'],
    [/\b(europe|union europ[eé]enne|ue)\b/i, 'Europe'],
    [/\b(vc|venture capital|investisseur|startup|start-up)\b/i, 'startup / investissement'],
  ]

  return theatres.find(([pattern]) => pattern.test(text))?.[1]
}

function detectSecondaryTheatres(text: string): string[] {
  const theatres: Array<[RegExp, string]> = [
    [/\bwashington|[eé]tats-unis|usa|trump\b/i, 'Washington / États-Unis'],
    [/\bt[eé]h[eé]ran|khamenei|guide supr[eê]me\b/i, 'Téhéran'],
    [/\bisra[eë]l|tel-aviv\b/i, 'Israël'],
    [/\boman|mascate\b/i, 'Oman'],
    [/\bd[eé]troit d[’']ormuz|ormuz\b/i, 'détroit d’Ormuz'],
    [/\bp[eé]kin|chine\b/i, 'Pékin / Chine'],
    [/\bmoscou|russie\b/i, 'Moscou / Russie'],
    [/\beurope|union europ[eé]enne|ue\b/i, 'Europe'],
    [/\bgolfe|arabie saoudite|qatar|[eé]mirats\b/i, 'Golfe'],
  ]

  return unique(theatres.filter(([pattern]) => pattern.test(text)).map(([, label]) => label))
}

function detectChannels(text: string): string[] {
  const channels: Array<[RegExp, string]> = [
    [/\bp[eé]trole|gaz|[eé]nergie|ormuz|march[eé]s?\b/i, 'énergie et marchés'],
    [/\bnucl[eé]aire|missile|frappe|guerre|militaire|cgr[iı]|proxy|proxies\b/i, 'sécurité et seuils militaires'],
    [/\bsanction|commerce|inflation|supply|cha[iî]ne|prix\b/i, 'économie et sanctions'],
    [/\bdiplomatie|cessez-le-feu|accord|n[eé]gociation|oman|m[eé]diateur\b/i, 'diplomatie et médiation'],
    [/\balliance|otan|europe|chine|russie|golfe|ordre mondial\b/i, 'alliances et ordre international'],
    [/\bvc|venture capital|investisseur startup|investissement startup|startup|start-up|traction|revenu|r[eé]tention|cac|moat|icp\b/i, 'marché, traction et distribution'],
    [/\bgouvernance|cofondateur|cofondatrice|parts|vesting|pouvoir|associ[eé]\b/i, 'gouvernance et pouvoir'],
  ]

  return unique(channels.filter(([pattern]) => pattern.test(text)).map(([, label]) => label))
}

export function detectScopeContext(
  input: string,
  arbre?: Partial<ArbreACamesAnalysis>
): ScopeContext {
  const inputText = input.toLowerCase()
  const axisText = [
    ...(arbre?.acteurs ?? []),
    ...(arbre?.interets ?? []),
    ...(arbre?.forces ?? []),
    ...(arbre?.tensions ?? []),
    ...(arbre?.contraintes ?? []),
    ...(arbre?.incertitudes ?? []),
    ...(arbre?.temps ?? []),
    ...(arbre?.perceptions ?? []),
  ].join(' ')
  const text = `${input} ${axisText}`.toLowerCase()

  let scope: SituationScope = 'local'
  if (has(inputText, /\b(monde|mondial|mondiale|global|globale|international|internationale|ordre mondial|2026)\b/i)) {
    scope = 'global'
  } else if (has(inputText, /\b(guerre|cessez-le-feu|frappe|militaire|d[eé]troit|nucl[eé]aire|iran|ukraine|gaza|isra[eë]l)\b/i)) {
    scope = 'regional'
  } else if (has(text, /\b(ex|couple|relation|famille|ami|affectif|personnel)\b/i)) {
    scope = 'personal'
  } else if (has(text, /\b([eé]quipe|manager|organisation|gouvernance|direction|comit[eé]|r[ôo]le|mandat)\b/i)) {
    scope = 'organizational'
  } else if (has(text, /\b(vc|venture capital|investisseur|startup|start-up|march[eé]|traction|revenu|icp)\b/i)) {
    scope = 'market'
  } else if (has(text, /\b(monde|mondial|mondiale|global|globale|international|internationale|ordre mondial|2026)\b/i)) {
    scope = 'global'
  } else if (has(text, /\b(r[eé]gion|r[eé]gional|moyen-orient|golfe|sahel|europe|asie|fronti[eè]re|d[eé]troit)\b/i)) {
    scope = 'regional'
  }

  const primary = detectPrimaryTheatre(text)
  const channels = detectChannels(text).filter((channel) => {
    if (
      channel === 'marché, traction et distribution' &&
      !has(inputText, /\b(vc|venture capital|investisseur|startup|start-up|traction|revenu|r[eé]tention|cac|moat|icp|go[- ]?to[- ]?market|march[eé])\b/i)
    ) {
      return false
    }
    return true
  })
  const requestedFrame =
    scope === 'global'
      ? 'Lire le théâtre principal comme révélateur de dynamiques systémiques plus larges.'
      : scope === 'market'
        ? 'Lire la situation par la preuve de marché, l’usage répété et la décision économique.'
        : scope === 'personal'
          ? 'Lire la situation par le lien, la limite, la dette implicite et la décision à rendre explicite.'
          : scope === 'organizational'
            ? 'Lire la situation par les rôles, le pouvoir, la charge et les droits de décision.'
            : 'Lire la situation à l’échelle explicitement demandée par l’utilisateur.'

  return {
    scope,
    requested_frame: requestedFrame,
    primary_theatre: primary,
    secondary_theatres: detectSecondaryTheatres(text),
    global_channels: channels.length > 0 ? channels : ['acteurs', 'contraintes', 'temporalités', 'signaux observables'],
    signals: [
      scope,
      ...(primary ? [primary] : []),
      ...channels,
    ],
  }
}
