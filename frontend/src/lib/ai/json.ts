export function extractTextContent(content: unknown): string {
  if (!Array.isArray(content)) return ''

  return content
    .filter((block) => block && typeof block === 'object' && (block as { type?: string }).type === 'text')
    .map((block) => String((block as { text?: string }).text ?? ''))
    .join('')
    .replace(/```json|```/g, '')
    .trim()
}

export function parseModelJSON(raw: string): Record<string, unknown> {
  const clean = raw.replace(/```json|```/g, '').trim()
  const first = clean.indexOf('{')
  const last = clean.lastIndexOf('}')
  const slice = first !== -1 && last > first ? clean.slice(first, last + 1) : clean

  const attempts = [
    slice,
    slice
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\r?\n/g, ' '),
  ]

  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate)
    } catch {}
  }

  throw new Error('Model returned invalid JSON')
}

export function cleanModelText(value: unknown): string {
  return typeof value === 'string'
    ? value
        .replace(/\r/g, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim()
    : ''
}
