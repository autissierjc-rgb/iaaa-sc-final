import type { GeneratedCardSnapshot } from '@/lib/contracts/generationArchive'

type PdfSection = {
  title: string
  body: string
}

type SnapshotPayloadProbe = {
  writing?: {
    situation_card?: Record<string, unknown> | string
    lecture?: unknown
    approfondir?: unknown
  }
  resources?: {
    public_sources?: unknown[]
    resources?: unknown[]
  }
}

const NOTICE_FR =
  'Ce document est une note analytique produite par Situation Card. Il structure une lecture, des hypotheses et des signaux a verifier. Il ne constitue ni un rapport officiel, ni une preuve, ni un avis professionnel.'

const NOTICE_EN =
  'This document is an analytical note produced by Situation Card. It structures a reading, hypotheses and signals to verify. It is not an official report, verified evidence or professional advice.'

function asPayload(payload: unknown): SnapshotPayloadProbe {
  if (!payload || typeof payload !== 'object') return {}
  return payload as SnapshotPayloadProbe
}

function text(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join('\n')
  if (!value || typeof value !== 'object') return ''
  return ''
}

function fromCard(card: Record<string, unknown> | string | undefined, keys: string[]): string {
  if (typeof card === 'string') return card.trim()
  if (!card || typeof card !== 'object') return ''
  for (const key of keys) {
    const value = text(card[key])
    if (value) return value
  }
  return ''
}

function sourceText(source: unknown): string {
  if (!source || typeof source !== 'object') return text(source)
  const item = source as Record<string, unknown>
  const title = text(item.title) || text(item.name) || text(item.source) || text(item.url)
  const url = text(item.url)
  const type = text(item.type)
  return [title, type, url].filter(Boolean).join(' - ')
}

function safeFilename(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'situation-card'
}

function clean(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ \u00a0]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function wrapLine(line: string, max = 92): string[] {
  const words = line.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > max && current) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current) lines.push(current)
  return lines.length > 0 ? lines : ['']
}

function wrapText(value: string, max = 92): string[] {
  return clean(value)
    .split('\n')
    .flatMap((line) => line.trim() ? wrapLine(line.trim(), max) : [''])
}

function pdfHex(value: string): string {
  const bytes = [0xfe, 0xff]
  for (const char of value) {
    const code = char.charCodeAt(0)
    bytes.push((code >> 8) & 0xff, code & 0xff)
  }
  return bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase()
}

function streamForLines(lines: Array<{ text: string; size: number; x: number; y: number }>): string {
  return lines
    .map((line) => `BT /F1 ${line.size} Tf ${line.x} ${line.y} Td <${pdfHex(line.text)}> Tj ET`)
    .join('\n')
}

function makePdf(title: string, sections: PdfSection[], meta: string): Buffer {
  const pageWidth = 595
  const pageHeight = 842
  const marginX = 50
  const startY = 790
  const bottomY = 58
  const objects: string[] = []
  const pages: string[] = []
  let currentLines: Array<{ text: string; size: number; x: number; y: number }> = []
  let y = startY

  function flushPage() {
    const stream = streamForLines(currentLines)
    const contentObjectNumber = objects.length + 1
    objects.push(`<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`)
    const pageObjectNumber = objects.length + 1
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`)
    pages.push(`${pageObjectNumber} 0 R`)
    currentLines = []
    y = startY
  }

  function addLine(value: string, size = 10, gap = 14) {
    if (y < bottomY) flushPage()
    currentLines.push({ text: value, size, x: marginX, y })
    y -= gap
  }

  addLine(title, 18, 24)
  addLine(meta, 9, 20)

  for (const section of sections) {
    if (!section.body) continue
    y -= 6
    addLine(section.title.toUpperCase(), 12, 18)
    for (const line of wrapText(section.body)) {
      addLine(line, 10, line ? 13 : 9)
    }
  }

  if (currentLines.length > 0) flushPage()

  objects.unshift(
    `<< /Type /Catalog /Pages 2 0 R >>`,
    `<< /Type /Pages /Kids [${pages.join(' ')}] /Count ${pages.length} >>`,
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`,
  )

  const chunks: string[] = ['%PDF-1.4\n']
  const offsets: number[] = [0]
  let length = Buffer.byteLength(chunks[0], 'utf8')
  objects.forEach((object, index) => {
    offsets.push(length)
    const chunk = `${index + 1} 0 obj\n${object}\nendobj\n`
    chunks.push(chunk)
    length += Buffer.byteLength(chunk, 'utf8')
  })
  const xrefOffset = length
  const xref = [
    `xref`,
    `0 ${objects.length + 1}`,
    `0000000000 65535 f `,
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `),
    `trailer << /Size ${objects.length + 1} /Root 1 0 R >>`,
    `startxref`,
    String(xrefOffset),
    `%%EOF`,
  ].join('\n')
  chunks.push(xref)
  return Buffer.from(chunks.join(''), 'utf8')
}

export function renderSnapshotPdf(snapshot: GeneratedCardSnapshot): { buffer: Buffer; filename: string } {
  const payload = asPayload(snapshot.payload)
  const card = payload.writing?.situation_card
  const isFr = snapshot.language === 'fr'
  const title = snapshot.header_subject || snapshot.canonical_question || 'Situation Card'
  const lecture = text(payload.writing?.lecture)
  const approfondir = text(payload.writing?.approfondir)
  const sources = payload.resources?.public_sources ?? payload.resources?.resources ?? []

  const sections: PdfSection[] = [
    { title: isFr ? 'Situation soumise' : 'Submitted situation', body: snapshot.situation_soumise },
    { title: isFr ? 'Lecture' : 'Reading', body: lecture || fromCard(card, ['lecture_systeme_fr', 'lecture_systeme_en', 'lecture']) },
    { title: isFr ? 'Vulnerabilite principale' : 'Main vulnerability', body: fromCard(card, ['main_vulnerability_fr', 'main_vulnerability_en', 'main_vulnerability']) },
    { title: isFr ? 'Asymetrie' : 'Asymmetry', body: fromCard(card, ['asymmetry_fr', 'asymmetry_en', 'asymmetry']) },
    { title: isFr ? 'Trajectoires' : 'Trajectories', body: fromCard(card, ['trajectories_text_fr', 'trajectories_text_en', 'trajectories_text']) },
    { title: isFr ? 'Signal cle' : 'Key signal', body: fromCard(card, ['key_signal_fr', 'key_signal_en', 'key_signal']) },
    { title: isFr ? 'Approfondir' : 'Deep reading', body: approfondir },
    { title: isFr ? 'Ressources publiques' : 'Public sources', body: sources.map(sourceText).filter(Boolean).join('\n') },
    { title: isFr ? 'Provenance' : 'Provenance', body: `${snapshot.card_version} - ${snapshot.created_at} - snapshot ${snapshot.id}` },
    { title: isFr ? 'Statut du document' : 'Document status', body: isFr ? NOTICE_FR : NOTICE_EN },
  ]

  return {
    buffer: makePdf(title, sections, 'Situation Card - IAAA+'),
    filename: `${safeFilename(title)}-${snapshot.id}.pdf`,
  }
}
