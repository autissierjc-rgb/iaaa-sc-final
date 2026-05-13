import type { GeneratedCardSnapshot } from '@/lib/contracts/generationArchive'

type PdfSection = {
  title: string
  body: string
  tone?: 'standard' | 'risk' | 'signal' | 'muted'
}

type PdfOp =
  | { kind: 'text'; text: string; size: number; x: number; y: number; font?: 'regular' | 'bold'; color?: string }
  | { kind: 'rect'; x: number; y: number; w: number; h: number; stroke?: string; fill?: string; width?: number }
  | { kind: 'circle'; x: number; y: number; r: number; stroke?: string; fill?: string; width?: number }
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number; stroke?: string; width?: number }

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

function extractScore(card: Record<string, unknown> | string | undefined): string {
  if (!card || typeof card === 'string') return ''
  const value = card.state_index_final ?? card.state_index ?? card.score
  return typeof value === 'number' || typeof value === 'string' ? String(value) : ''
}

function extractStateLabel(card: Record<string, unknown> | string | undefined, isFr: boolean): string {
  if (!card || typeof card === 'string') return ''
  return text(isFr ? (card.state_label ?? card.state_label_fr) : (card.state_label_en ?? card.state_label))
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

function pdfText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function color(value = '#1A2A3A'): string {
  const normalized = value.replace('#', '')
  const r = parseInt(normalized.slice(0, 2), 16) / 255
  const g = parseInt(normalized.slice(2, 4), 16) / 255
  const b = parseInt(normalized.slice(4, 6), 16) / 255
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`
}

function streamForOps(ops: PdfOp[]): string {
  return ops.map((op) => {
    if (op.kind === 'text') {
      const font = op.font === 'bold' ? 'F2' : 'F1'
      return `BT ${color(op.color)} rg /${font} ${op.size} Tf ${op.x} ${op.y} Td (${pdfText(op.text)}) Tj ET`
    }
    if (op.kind === 'rect') {
      const commands = [
        `${op.width ?? 1} w`,
        op.fill ? `${color(op.fill)} rg` : '',
        op.stroke ? `${color(op.stroke)} RG` : '',
        `${op.x} ${op.y} ${op.w} ${op.h} re`,
        op.fill && op.stroke ? 'B' : op.fill ? 'f' : 'S',
      ]
      return commands.filter(Boolean).join('\n')
    }
    if (op.kind === 'circle') {
      const c = op.r * 0.5522847498
      const commands = [
        `${op.width ?? 1} w`,
        op.fill ? `${color(op.fill)} rg` : '',
        op.stroke ? `${color(op.stroke)} RG` : '',
        `${op.x + op.r} ${op.y} m`,
        `${op.x + op.r} ${op.y + c} ${op.x + c} ${op.y + op.r} ${op.x} ${op.y + op.r} c`,
        `${op.x - c} ${op.y + op.r} ${op.x - op.r} ${op.y + c} ${op.x - op.r} ${op.y} c`,
        `${op.x - op.r} ${op.y - c} ${op.x - c} ${op.y - op.r} ${op.x} ${op.y - op.r} c`,
        `${op.x + c} ${op.y - op.r} ${op.x + op.r} ${op.y - c} ${op.x + op.r} ${op.y} c`,
        'h',
        op.fill && op.stroke ? 'B' : op.fill ? 'f' : 'S',
      ]
      return commands.filter(Boolean).join('\n')
    }
    return `${op.width ?? 1} w\n${color(op.stroke)} RG\n${op.x1} ${op.y1} m ${op.x2} ${op.y2} l S`
  }).join('\n')
}

function makePdf(title: string, sections: PdfSection[], meta: string, options: {
  domain: string
  subject: string
  submitted: string
  score: string
  stateLabel: string
  createdAt: string
  isFr: boolean
}): Buffer {
  const pageWidth = 595
  const pageHeight = 842
  const marginX = 48
  const contentWidth = pageWidth - marginX * 2
  const startY = 760
  const bottomY = 64
  const objects: string[] = ['', '', '', '']
  const pages: string[] = []
  let currentOps: PdfOp[] = []
  let y = startY
  let pageNumber = 0

  function addPageChrome() {
    currentOps.push({ kind: 'rect', x: 0, y: 0, w: pageWidth, h: pageHeight, fill: '#F5F0E8' })
    currentOps.push({ kind: 'rect', x: 40, y: 48, w: 515, h: 746, stroke: '#DAC7A4', fill: '#FFFDF8', width: 1 })
  }

  function flushPage() {
    if (currentOps.length === 0) return
    pageNumber += 1
    currentOps.push({ kind: 'text', text: String(pageNumber), size: 8, x: 526, y: 28, color: '#9AABB8' })
    const stream = streamForOps(currentOps)
    const contentObjectNumber = objects.length + 1
    objects.push(`<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`)
    const pageObjectNumber = objects.length + 1
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`)
    pages.push(`${pageObjectNumber} 0 R`)
    currentOps = []
    y = startY
    addPageChrome()
  }

  function addText(value: string, size = 10, gap = 14, x = marginX, font: 'regular' | 'bold' = 'regular', colorValue = '#1A2A3A') {
    if (y < bottomY) flushPage()
    currentOps.push({ kind: 'text', text: value, size, x, y, font, color: colorValue })
    y -= gap
  }

  function addWrapped(value: string, size = 10, max = 92, colorValue = '#1A2A3A', indent = 0) {
    for (const line of wrapText(value, max)) {
      addText(line, size, line ? size + 4 : 9, marginX + indent, 'regular', colorValue)
    }
  }

  function addBox(section: PdfSection) {
    if (!section.body) return
    const titleColor = section.tone === 'risk' ? '#E06B4A' : section.tone === 'signal' ? '#C8951A' : '#1B3A6B'
    const fill = section.tone === 'risk' ? '#FFF4EF' : section.tone === 'signal' ? '#FFF8E5' : section.tone === 'muted' ? '#F7F5F0' : '#FFFFFF'
    const bodyLines = wrapText(section.body, 86)
    const boxHeight = Math.max(70, 34 + bodyLines.length * 13)
    if (y - boxHeight < bottomY) flushPage()
    currentOps.push({ kind: 'rect', x: marginX - 8, y: y - boxHeight + 12, w: contentWidth + 16, h: boxHeight, stroke: '#E2D8C6', fill, width: 0.8 })
    addText(section.title, 11, 18, marginX, 'bold', titleColor)
    for (const line of bodyLines) {
      addText(line, 9.5, line ? 12.5 : 8, marginX, 'regular', '#1A2A3A')
    }
    y -= 12
  }

  addPageChrome()
  currentOps.push({ kind: 'circle', x: 72, y: 748, r: 21, stroke: '#C8951A', fill: '#0B1730', width: 1 })
  currentOps.push({ kind: 'circle', x: 72, y: 748, r: 13, stroke: '#C8951A', width: 0.5 })
  currentOps.push({ kind: 'circle', x: 72, y: 748, r: 2.6, stroke: '#C8951A', fill: '#F5F3EE', width: 0.6 })
  currentOps.push({ kind: 'line', x1: 58, y1: 748, x2: 86, y2: 748, stroke: '#C8951A', width: 0.7 })
  currentOps.push({ kind: 'line', x1: 72, y1: 734, x2: 72, y2: 762, stroke: '#C8951A', width: 0.7 })
  currentOps.push({ kind: 'line', x1: 62, y1: 738, x2: 82, y2: 758, stroke: '#C8951A', width: 0.5 })
  currentOps.push({ kind: 'line', x1: 82, y1: 738, x2: 62, y2: 758, stroke: '#C8951A', width: 0.5 })
  currentOps.push({ kind: 'text', text: 'IAAA+', size: 14, x: 108, y: 760, font: 'bold', color: '#C8951A' })
  currentOps.push({ kind: 'text', text: 'SITUATION CARD', size: 13, x: 108, y: 744, font: 'bold', color: '#1B3A6B' })
  currentOps.push({ kind: 'text', text: `Snapshot : ${options.createdAt.slice(0, 10)}`, size: 9, x: 390, y: 760, color: '#6F6255' })
  currentOps.push({ kind: 'text', text: `Langue : ${options.isFr ? 'FR' : 'EN'}`, size: 9, x: 390, y: 744, color: '#6F6255' })
  currentOps.push({ kind: 'text', text: meta, size: 9, x: 390, y: 728, color: '#6F6255' })
  wrapLine(options.subject || title, 34).slice(0, 3).forEach((line, index) => {
    currentOps.push({ kind: 'text', text: line, size: 22, x: 48, y: 704 - index * 24, font: 'bold', color: '#10244A' })
  })
  const intro = options.isFr
    ? 'Une lecture structuree pour voir le systeme, le point fragile et les signaux a surveiller.'
    : 'A structured reading to see the system, the fragile point and the signals to watch.'
  currentOps.push({ kind: 'text', text: intro, size: 11, x: 48, y: 628, color: '#6F6255' })
  currentOps.push({ kind: 'line', x1: 48, y1: 600, x2: 547, y2: 600, stroke: '#DAC7A4', width: 1 })
  currentOps.push({ kind: 'text', text: options.isFr ? 'Situation soumise' : 'Submitted situation', size: 11, x: 48, y: 570, font: 'bold', color: '#C8951A' })
  y = 548
  addWrapped(options.submitted, 12, 76, '#1A2A3A')
  y -= 12
  currentOps.push({ kind: 'rect', x: 48, y: y - 62, w: 150, h: 52, stroke: '#E2D8C6', fill: '#FFFFFF' })
  currentOps.push({ kind: 'text', text: options.isFr ? 'Etat' : 'State', size: 9, x: 62, y: y - 28, font: 'bold', color: '#C8951A' })
  currentOps.push({ kind: 'text', text: options.stateLabel || 'N/A', size: 14, x: 62, y: y - 48, font: 'bold', color: '#1B3A6B' })
  currentOps.push({ kind: 'rect', x: 222, y: y - 62, w: 150, h: 52, stroke: '#E2D8C6', fill: '#FFFFFF' })
  currentOps.push({ kind: 'text', text: 'Score', size: 9, x: 236, y: y - 28, font: 'bold', color: '#C8951A' })
  currentOps.push({ kind: 'text', text: options.score ? `${options.score} / 100` : 'N/A', size: 14, x: 236, y: y - 48, font: 'bold', color: '#1B3A6B' })
  currentOps.push({ kind: 'rect', x: 396, y: y - 62, w: 151, h: 52, stroke: '#E2D8C6', fill: '#FFFFFF' })
  currentOps.push({ kind: 'text', text: options.isFr ? 'Genere le' : 'Generated', size: 9, x: 410, y: y - 28, font: 'bold', color: '#C8951A' })
  currentOps.push({ kind: 'text', text: options.createdAt.slice(0, 10), size: 14, x: 410, y: y - 48, font: 'bold', color: '#1B3A6B' })
  y -= 90

  for (const section of sections) {
    addBox(section)
  }

  if (currentOps.length > 0) flushPage()

  objects[0] = `<< /Type /Catalog /Pages 2 0 R >>`
  objects[1] = `<< /Type /Pages /Kids [${pages.join(' ')}] /Count ${pages.length} >>`
  objects[2] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`
  objects[3] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`

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
    { title: isFr ? 'Lecture' : 'Reading', body: lecture || fromCard(card, ['lecture_systeme_fr', 'lecture_systeme_en', 'lecture']) },
    { title: isFr ? 'Vulnerabilite principale' : 'Main vulnerability', body: fromCard(card, ['main_vulnerability_fr', 'main_vulnerability_en', 'main_vulnerability']), tone: 'risk' },
    { title: isFr ? 'Asymetrie' : 'Asymmetry', body: fromCard(card, ['asymmetry_fr', 'asymmetry_en', 'asymmetry']) },
    { title: isFr ? 'Trajectoires' : 'Trajectories', body: fromCard(card, ['trajectories_text_fr', 'trajectories_text_en', 'trajectories_text']) },
    { title: isFr ? 'Signal cle' : 'Key signal', body: fromCard(card, ['key_signal_fr', 'key_signal_en', 'key_signal']), tone: 'signal' },
    { title: isFr ? 'Approfondir' : 'Deep reading', body: approfondir },
    { title: isFr ? 'Ressources publiques' : 'Public sources', body: sources.map(sourceText).filter(Boolean).join('\n'), tone: 'muted' },
    { title: isFr ? 'Provenance' : 'Provenance', body: `${snapshot.card_version} - ${snapshot.created_at} - snapshot ${snapshot.id}`, tone: 'muted' },
    { title: isFr ? 'Statut du document' : 'Document status', body: isFr ? NOTICE_FR : NOTICE_EN, tone: 'muted' },
  ]

  return {
    buffer: makePdf(title, sections, 'Export PDF depuis snapshot', {
      domain: snapshot.header_domain,
      subject: title,
      submitted: snapshot.situation_soumise,
      score: extractScore(card),
      stateLabel: extractStateLabel(card, isFr),
      createdAt: snapshot.created_at,
      isFr,
    }),
    filename: `${safeFilename(title)}-${snapshot.id}.pdf`,
  }
}
