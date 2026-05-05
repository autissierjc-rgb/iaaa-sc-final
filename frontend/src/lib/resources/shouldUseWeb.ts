const LIVE_HINTS = [
  /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?/i,
  /\b20\d{2}\b/i,
  /\b(today|yesterday|tomorrow|latest|current|breaking|ceasefire|election|electoral|midterm|war|summit)\b/i,
  /\b(aujourd'hui|hier|demain|dernier|recen|actuel|cessez-le-feu|[ée]lections?|[ée]lectoral|mi-mandat|guerre|sommet)\b/i,
  /\b(iran|ukraine|gaza|russie|chine|usa|etats-unis|israel|palestine)\b/i,
]

const CONSULTED_PAGE_HINTS = [
  /\bque\s+fait\s+(?!on\b|il\b|elle\b|je\b|tu\b|nous\b|vous\b|ils\b|elles\b|le\b|la\b|les\b|un\b|une\b)([a-z0-9-]{3,})\b/i,
  /\bque\s+fait\s+(?:le\s+|la\s+)?(?:site|page|plateforme|application|app|service|outil)\s+(?:de\s+|du\s+|d['’])?[a-z0-9-]{3,}\b/i,
  /\b(?:qu['’]?\s*en\s+penser|que\s+penser\s+de|avis\s+sur|analyse(?:r)?|auditer?|evaluer|évaluer)\b[^?!.]{0,80}\b[A-Z][A-Za-z0-9-]{2,}\b/,
  /\b(?:produit|startup|entreprise|plateforme|application|service|outil|site)\b[^?!.]{0,80}\b(?:qu['’]?\s*en\s+penser|avis|analyse|evaluation|évaluation|int[eé]ressant|pertinent|utile)\b/i,
]

export function shouldUseWeb(situation: string): boolean {
  const text = situation.trim()
  if (text.length < 24) return false
  return LIVE_HINTS.some((pattern) => pattern.test(text)) ||
    CONSULTED_PAGE_HINTS.some((pattern) => pattern.test(text))
}
