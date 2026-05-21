function softenVulgarity(text: string): string {
  return text
    .replace(/\bmerde\b/gi, 'problème')
    .replace(/\bfout(?:re|u|ue|us)?\b/gi, 'faire')
    .replace(/\bcon(?:ne|nes|s)?\b/gi, 'personne difficile')
    .replace(/\bputain\b/gi, '')
}

function normalizeForDedup(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, 'url')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function collapseRepeatedSentences(text: string): string {
  const parts = text
    .split(/(?<=[.?!])\s+/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length <= 1) return text

  const kept: string[] = []
  const seen = new Set<string>()

  for (const part of parts) {
    const key = normalizeForDedup(part)
    if (!key) continue
    if (seen.has(key)) continue
    seen.add(key)
    kept.push(part)
  }

  return kept.join(' ')
}

export function normalizeSubmittedSituation(input: string): string {
  const cleaned = collapseRepeatedSentences(softenVulgarity(input)
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/\bapres\b/gi, 'après')
    .replace(/\bequipe\b/gi, 'équipe')
    .replace(/\breorganisation\b/gi, 'réorganisation')
    .replace(/\bdecision\b/gi, 'décision')
    .replace(/\bconcret\b/gi, 'concret')
    .replace(/\bconcrete\b/gi, 'concrète')
    .replace(/\beconomie\b/gi, 'économie')
    .replace(/\betat\b/gi, 'état')
    .replace(/\betats\b/gi, 'États')
    .replace(/\bselection\b/gi, 'sélection')
    .replace(/selectionn[ée]/gi, 'sélectionné')
    .replace(/\betre\b/gi, 'être')
    .replace(/\bvc\b/g, 'VC')
    .replace(/\bmedecin\b/gi, 'médecin')
    .replace(/\bgeneraliste\b/gi, 'généraliste')
    .replace(/\bgeopolitique\b/gi, 'géopolitique')
    .replace(/\bnucleaire\b/gi, 'nucléaire')
    .replace(/\bTeheran\b/g, 'Téhéran')
    .replace(/\bIsrael\b/g, 'Israël')
    .replace(/\biran\b/gi, 'Iran')
    .replace(/\bquel est la\b/gi, 'quelle est la')
    .replace(/\bquels est\b/gi, 'quels sont')
    .replace(/\bl'([aeiouéèêà])/gi, 'l’$1')
    .replace(/\s*\?/g, ' ?')
    .trim())

  if (!cleaned) return ''
  if (/^https?:\/\//i.test(cleaned)) {
    return cleaned.replace(/^Https?:\/\//, (match) => match.toLowerCase())
  }
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}
