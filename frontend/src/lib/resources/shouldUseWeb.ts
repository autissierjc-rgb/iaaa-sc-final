const LIVE_HINTS = [
  /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?/i,
  /\b20\d{2}\b/i,
  /\b\d{1,2}\/\d{1,2}\b/,
  /\b(today|yesterday|tomorrow|latest|current|breaking|ceasefire|election|electoral|midterm|war|summit|shortage|crisis|unrest|protests?|sanctions?|blackouts?)\b/i,
  /\b(aujourd'hui|hier|demain|dernier|recen|actuel|cessez-le-feu|[ée]lections?|[ée]lectoral|mi-mandat|guerre|sommet|p[ée]nurie|crise|manifestations?|sanctions?|inflation|blocus|gr[èe]ves?)\b/i,
  /\bsituation\s+(?:actuelle|int[ée]rieure|politique|[ée]conomique|militaire|sociale)\b/i,
  /\brisque\s+d['’]?[ée]voluer\b|\bcomment\b[^?!.]{0,60}\b[ée]voluer\b|\bo[ùu]\s+en\s+(?:est|sommes|sont)\b/i,
  /\b(iran|ukraine|gaza|russie|chine|usa|etats-unis|israel|palestine)\b/i,
]

const CONSULTED_PAGE_HINTS = [
  /\bque\s+fait\s+(?!on\b|il\b|elle\b|je\b|tu\b|nous\b|vous\b|ils\b|elles\b|le\b|la\b|les\b|un\b|une\b)([a-z0-9-]{3,})\b/i,
  /\bque\s+fait\s+(?:le\s+|la\s+)?(?:site|page|plateforme|application|app|service|outil)\s+(?:de\s+|du\s+|d['’])?[a-z0-9-]{3,}\b/i,
  /\b(?:qu['’]?\s*en\s+penser|que\s+penser\s+de|avis\s+sur|analyse(?:r)?|auditer?|evaluer|évaluer)\b[^?!.]{0,80}\b[A-Z][A-Za-z0-9-]{2,}\b/,
  /\b(?:produit|startup|entreprise|plateforme|application|service|outil|site)\b[^?!.]{0,80}\b(?:qu['’]?\s*en\s+penser|avis|analyse|evaluation|évaluation|int[eé]ressant|pertinent|utile)\b/i,
]

const OFFLINE_HINTS = [
  // Lien proche ou organisation interne : la matière est chez l'utilisateur,
  // pas sur le web public.
  /\b(ma|mon|mes|notre|nos|ta|ton|tes|votre|vos|sa|son|ses|leur|leurs)\s+(femme|mari|copine|copain|compagne|compagnon|fils|fille|enfants?|m[èe]re|p[èe]re|parents?|famille|belle-m[èe]re|beau-p[èe]re|fr[èe]re|s[œo]urs?|amie?s?|couple|[ée]quipe|collaborateurs?|coll[èe]gues?|manager|chef|patron|direction|comit[ée]s?|service|d[ée]partement|association|entreprise|bo[îi]te|soci[ée]t[ée]s?|startup|cabinet|atelier|projet|relation|carri[èe]re|poste|travail|emploi)(?!\p{L})/iu,
  /\b(je|j['’]|nous)\s+(?:me|nous)?\s*(sens|suis|sommes|vis|vivons|h[ée]site|h[ée]sitons|dois|devons|veux|voulons|envisage|envisageons)\b/i,
]

export function shouldUseWeb(situation: string): boolean {
  const text = situation.trim()
  if (text.length < 24) return false
  // Signaux d'actualité ou de site consulté : web, même si la question est personnelle.
  if (LIVE_HINTS.some((pattern) => pattern.test(text))) return true
  if (CONSULTED_PAGE_HINTS.some((pattern) => pattern.test(text))) return true
  // Par défaut, une question publique se vérifie sur le web ; seules les
  // situations personnelles ou internes (la matière est chez l'utilisateur)
  // restent hors ligne.
  return !OFFLINE_HINTS.some((pattern) => pattern.test(text))
}
