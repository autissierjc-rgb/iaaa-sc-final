import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
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
  | { kind: 'polygon'; points: Array<[number, number]>; stroke?: string; fill?: string; width?: number; opacity?: number }
  | { kind: 'image'; x: number; y: number; w: number; h: number }

type AstrolabePdfScore = {
  branch: string
  name: string
  display_score: number
}

const BRANCH_DESC_FR: Record<string, string> = {
  I: 'Ceux qui agissent, influencent ou bloquent.',
  II: 'Ce que les parties cherchent, défendent ou refusent.',
  III: 'Ce qui pousse, soutient ou accélère la situation.',
  IV: 'Ce qui oppose, fragilise ou met sous pression.',
  V: "Ce qui limite l'action et réduit les marges.",
  VI: "Ce que l’analyse risque de ne pas voir alors que cela peut renverser la lecture.",
  VII: "Les rythmes, délais et fenêtres d'action.",
  VIII: 'Les récits, croyances, réputations et lectures qui orientent les comportements.',
}

const DEFAULT_BRANCH_NAMES_FR: Record<string, string> = {
  I: 'Acteurs',
  II: 'Intérêts',
  III: 'Forces',
  IV: 'Tensions',
  V: 'Contraintes',
  VI: 'Incertitudes',
  VII: 'Temps',
  VIII: 'Perception',
}

const PDF_WINANSI_ESCAPES: Record<string, string> = {
  À: '\\300',
  Â: '\\302',
  Ç: '\\307',
  È: '\\310',
  É: '\\311',
  Ê: '\\312',
  Î: '\\316',
  Ô: '\\324',
  Ù: '\\331',
  à: '\\340',
  â: '\\342',
  ç: '\\347',
  è: '\\350',
  é: '\\351',
  ê: '\\352',
  ë: '\\353',
  î: '\\356',
  ï: '\\357',
  ô: '\\364',
  ù: '\\371',
  û: '\\373',
  ü: '\\374',
  œ: 'oe',
  Œ: 'OE',
  '’': "'",
  '‘': "'",
  '“': '"',
  '”': '"',
  '–': '-',
  '—': '-',
  '…': '...',
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
  'Ce document est une note analytique produite par Situation Card. Il structure une lecture, des hypothèses et des signaux à vérifier. Il ne constitue ni un rapport officiel, ni une preuve, ni un avis professionnel.'

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

function objectText(value: unknown, keys: string[]): string {
  if (!value || typeof value !== 'object') return text(value)
  const item = value as Record<string, unknown>
  for (const key of keys) {
    const found = text(item[key])
    if (found) return found
  }
  return ''
}

function lectureText(value: unknown, isFr: boolean): string {
  return objectText(value, isFr ? ['text_fr', 'lecture_fr', 'text'] : ['text_en', 'lecture_en', 'text_fr', 'text'])
}

function approfondirText(value: unknown, isFr: boolean): string {
  if (typeof value === 'string') return clean(value)
  if (!value || typeof value !== 'object') return ''
  const item = value as Record<string, unknown>
  const analysis = objectText(item, isFr ? ['analysis_fr', 'approfondir_fr', 'text_fr'] : ['analysis_en', 'approfondir_en', 'analysis_fr', 'text_fr'])
  const sections = Array.isArray(item.sections_fr)
    ? item.sections_fr
        .map((section) => {
          if (!section || typeof section !== 'object') return ''
          const typed = section as Record<string, unknown>
          return [text(typed.title), text(typed.body)].filter(Boolean).join('\n')
        })
        .filter(Boolean)
    : []
  return [analysis, ...sections].filter(Boolean).join('\n\n')
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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null
}

function readLogoJpeg(): { data: Buffer; width: number; height: number } | null {
  const candidates = [
    path.join(process.cwd(), 'public', 'pictos', 'LOOGO-IAAA.jpg'),
    path.join(process.cwd(), 'public', 'pictos', 'logo-iaaa.jpg'),
    path.join(process.cwd(), 'public', 'logo-iaaa.jpg'),
  ]
  const logoPath = candidates.find((candidate) => existsSync(candidate))
  if (!logoPath) return null
  const data = readFileSync(logoPath)

  for (let i = 2; i < data.length - 9;) {
    if (data[i] !== 0xff) {
      i += 1
      continue
    }
    const marker = data[i + 1]
    const length = data.readUInt16BE(i + 2)
    if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
      return {
        data,
        height: data.readUInt16BE(i + 5),
        width: data.readUInt16BE(i + 7),
      }
    }
    i += 2 + length
  }

  return { data, width: 1024, height: 1024 }
}

function extractAstrolabeScores(card: Record<string, unknown> | string | undefined): AstrolabePdfScore[] {
  if (!card || typeof card === 'string') return []
  const raw = Array.isArray(card.astrolabe_scores) ? card.astrolabe_scores : []
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const item = entry as Record<string, unknown>
      const branch = text(item.branch ?? item.b)
      const name = text(item.name ?? item.name_fr ?? item.label) || DEFAULT_BRANCH_NAMES_FR[branch] || branch
      const rawScore = Number(item.display_score ?? item.score ?? item.s ?? 0)
      const display_score = Math.max(0, Math.min(3, Number.isFinite(rawScore) ? Math.round(rawScore) : 0))
      return branch ? { branch, name, display_score } : null
    })
    .filter((entry): entry is AstrolabePdfScore => Boolean(entry))
    .slice(0, 8)
}

function extractRadarDetails(card: Record<string, unknown> | string | undefined, isFr: boolean): PdfSection[] {
  if (!card || typeof card === 'string' || !Array.isArray(card.radar_details)) return []
  const sections: PdfSection[] = []
  card.radar_details.forEach((entry) => {
    const item = asRecord(entry)
    if (!item) return
    const title = text(isFr ? (item.dimension_fr ?? item.dimension) : (item.dimension_en ?? item.dimension_fr ?? item.dimension))
    const score = text(item.score)
    const body = text(isFr ? (item.explanation_fr ?? item.note_fr ?? item.explanation) : (item.explanation_en ?? item.explanation_fr ?? item.note_fr ?? item.explanation))
    if (!title && !body) return
    sections.push({
      title: score ? `${title} · ${score}/3` : title,
      body,
      tone: 'muted' as const,
    })
  })
  return sections
}

function extractMovements(card: Record<string, unknown> | string | undefined, isFr: boolean): string {
  if (!card || typeof card === 'string') return ''
  const value = isFr ? card.movements_fr : (card.movements_en ?? card.movements_fr)
  if (Array.isArray(value)) {
    return value.map((item, index) => `${index + 1}. ${text(item)}`).filter(Boolean).join('\n')
  }
  return text(value)
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
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, (char) => PDF_WINANSI_ESCAPES[char] ?? ' ')
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
    if (op.kind === 'polygon') {
      const [first, ...rest] = op.points
      const commands = [
        `${op.width ?? 1} w`,
        op.fill ? `${color(op.fill)} rg` : '',
        op.stroke ? `${color(op.stroke)} RG` : '',
        `${first[0]} ${first[1]} m`,
        ...rest.map(([x, y]) => `${x} ${y} l`),
        'h',
        op.fill && op.stroke ? 'B' : op.fill ? 'f' : 'S',
      ]
      return commands.filter(Boolean).join('\n')
    }
    if (op.kind === 'image') {
      return `q\n${op.w} 0 0 ${op.h} ${op.x} ${op.y} cm\n/Logo Do\nQ`
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
  astrolabeScores: AstrolabePdfScore[]
}): Buffer {
  const pageWidth = 595
  const pageHeight = 842
  const marginX = 48
  const contentWidth = pageWidth - marginX * 2
  const startY = 760
  const bottomY = 64
  const logo = readLogoJpeg()
  const objects: string[] = logo
    ? ['', '', '', '', `<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logo.data.length} >>\nstream\n${logo.data.toString('binary')}\nendstream`]
    : ['', '', '', '']
  const pages: string[] = []
  let currentOps: PdfOp[] = []
  let y = startY
  let pageNumber = 0

  function addPageChrome() {
    currentOps.push({ kind: 'rect', x: 0, y: 0, w: pageWidth, h: pageHeight, fill: '#F5F0E8' })
    currentOps.push({ kind: 'rect', x: 40, y: 48, w: 515, h: 746, stroke: '#DAC7A4', fill: '#FFFDF8', width: 1 })
  }

  function flushPage(prepareNextPage = true) {
    if (currentOps.length === 0) return
    pageNumber += 1
    currentOps.push({ kind: 'text', text: String(pageNumber), size: 8, x: 526, y: 28, color: '#9AABB8' })
    const stream = streamForOps(currentOps)
    const contentObjectNumber = objects.length + 1
    objects.push(`<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`)
    const pageObjectNumber = objects.length + 1
    const xObjectResource = logo ? ' /XObject << /Logo 5 0 R >>' : ''
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >>${xObjectResource} >> /Contents ${contentObjectNumber} 0 R >>`)
    pages.push(`${pageObjectNumber} 0 R`)
    currentOps = []
    y = startY
    if (prepareNextPage) addPageChrome()
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

  function addSection(section: PdfSection) {
    if (!section.body) return
    const titleColor = section.tone === 'risk' ? '#E06B4A' : section.tone === 'signal' ? '#C8951A' : '#B8862D'
    if (y < bottomY + 58) flushPage()
    addText(section.title, 13, 18, marginX, 'bold', titleColor)
    addWrapped(section.body, 10.5, 88, '#1A2A3A')
    y -= 6
  }

  function addForceLines(scores: AstrolabePdfScore[]) {
    if (scores.length === 0) return
    if (y < bottomY + 70) flushPage()
    addText('FORCE LINES', 10, 18, marginX, 'bold', '#B8862D')
    const colors = ['#E0DCD4', '#B8D4F0', '#F0CA70', '#E87C7C']
    scores.forEach((score) => {
      if (y < bottomY + 40) flushPage()
      const barWidth = Math.max(0, Math.min(1, score.display_score / 3)) * 260
      currentOps.push({ kind: 'text', text: score.branch, size: 8.5, x: 60, y, font: 'bold', color: '#6F6255' })
      currentOps.push({ kind: 'text', text: score.name || DEFAULT_BRANCH_NAMES_FR[score.branch] || score.branch, size: 10.5, x: 82, y, font: 'bold', color: '#1B3A6B' })
      currentOps.push({ kind: 'rect', x: 190, y: y - 4, w: 300, h: 5, fill: '#EDEAE4' })
      currentOps.push({ kind: 'rect', x: 190, y: y - 4, w: barWidth, h: 5, fill: colors[score.display_score] ?? colors[0] })
      y -= 14
      addWrapped(BRANCH_DESC_FR[score.branch] || '', 9, 82, '#6F6255', 34)
      y -= 2
    })
  }

  function addLogo() {
    const cx = 70
    const cy = 747
    currentOps.push({ kind: 'circle', x: cx, y: cy, r: 24, stroke: '#C8951A', fill: '#0B1730', width: 1 })
    currentOps.push({ kind: 'circle', x: cx, y: cy, r: 3.6, stroke: '#C8951A', fill: '#F5F3EE', width: 0.6 })
    const rays = [
      [0, 15, 0, 39],
      [0, -15, 0, -39],
      [15, 0, 39, 0],
      [-15, 0, -39, 0],
      [11, 11, 28, 28],
      [-11, 11, -28, 28],
      [11, -11, 28, -28],
      [-11, -11, -28, -28],
    ]
    rays.forEach(([x1, y1, x2, y2]) => {
      currentOps.push({ kind: 'line', x1: cx + x1, y1: cy + y1, x2: cx + x2, y2: cy + y2, stroke: '#F2C94C', width: 3.2 })
      currentOps.push({ kind: 'line', x1: cx + x1, y1: cy + y1, x2: cx + x2, y2: cy + y2, stroke: '#C8951A', width: 1.2 })
    })
  }

  function addCardAstrolabe(scores: AstrolabePdfScore[]) {
    if (scores.length === 0) return
    if (y < 260) flushPage()
    const cx = 298
    const cy = y - 112
    const rings = [26, 50, 74]
    const labelR = 96
    const fills = ['#B8D4F0', '#F0CA70', '#E87C7C']
    const strokes = ['#7AAEDC', '#D4A830', '#C84040']
    const empty = '#E0DCD4'
    const emptyStroke = '#C8C4BC'

    addText('Astrolabe', 13, 18, marginX, 'bold', '#B8862D')
    currentOps.push({ kind: 'circle', x: cx, y: cy, r: 88, stroke: '#C8B880', width: 1.2 })
    Array.from({ length: 32 }).forEach((_, t) => {
      const angle = (t * 360 / 32 - 90) * Math.PI / 180
      const major = t % 4 === 0
      currentOps.push({
        kind: 'line',
        x1: cx + 82 * Math.cos(angle),
        y1: cy + 82 * Math.sin(angle),
        x2: cx + (major ? 76 : 79) * Math.cos(angle),
        y2: cy + (major ? 76 : 79) * Math.sin(angle),
        stroke: '#C8B880',
        width: major ? 1 : 0.5,
      })
    })
    rings.forEach((r) => currentOps.push({ kind: 'circle', x: cx, y: cy, r, stroke: '#DDD8CC', width: 0.6 }))
    scores.forEach((score, index) => {
      const angle = (index * 45 - 90) * Math.PI / 180
      const perp = angle + Math.PI / 2
      currentOps.push({
        kind: 'line',
        x1: cx,
        y1: cy,
        x2: cx + 78 * Math.cos(angle),
        y2: cy + 78 * Math.sin(angle),
        stroke: '#E0DCD4',
        width: 0.8,
      })
      rings.forEach((r, level) => {
        const px = cx + r * Math.cos(angle)
        const py = cy + r * Math.sin(angle)
        const hl = r * 0.28
        const hw = r * 0.12
        const filled = score.display_score >= level + 1
        currentOps.push({
          kind: 'polygon',
          points: [
            [px + hl * Math.cos(angle), py + hl * Math.sin(angle)],
            [px + hw * Math.cos(perp), py + hw * Math.sin(perp)],
            [px - hl * Math.cos(angle), py - hl * Math.sin(angle)],
            [px - hw * Math.cos(perp), py - hw * Math.sin(perp)],
          ],
          fill: filled ? fills[level] : empty,
          stroke: filled ? strokes[level] : emptyStroke,
          width: filled ? 1 : 0.5,
        })
      })
      const lx = cx + labelR * Math.cos(angle)
      const ly = cy + labelR * Math.sin(angle)
      const dotColor = score.display_score === 3 ? '#801050' : score.display_score === 2 ? '#888000' : '#004858'
      currentOps.push({ kind: 'circle', x: lx, y: ly, r: 10, fill: '#F8F3E8', stroke: '#C8B880', width: 0.9 })
      currentOps.push({ kind: 'circle', x: lx, y: ly + 4, r: 2, fill: dotColor })
      currentOps.push({ kind: 'text', text: score.branch, size: 8, x: lx - 4, y: ly - 4, font: 'bold', color: '#6A5A38' })
    })
    currentOps.push({ kind: 'circle', x: cx, y: cy, r: 7, fill: '#D4BC78', stroke: '#A89050', width: 1 })
    currentOps.push({ kind: 'circle', x: cx, y: cy, r: 3, fill: '#8A6830' })
    currentOps.push({ kind: 'polygon', points: [[200, cy - 118], [196, cy - 110], [200, cy - 102], [204, cy - 110]], fill: '#B8D4F0' })
    currentOps.push({ kind: 'text', text: 'Calme', size: 8, x: 210, y: cy - 113, color: '#6F6255' })
    currentOps.push({ kind: 'polygon', points: [[278, cy - 118], [274, cy - 110], [278, cy - 102], [282, cy - 110]], fill: '#F0CA70' })
    currentOps.push({ kind: 'text', text: 'Modéré', size: 8, x: 288, y: cy - 113, color: '#6F6255' })
    currentOps.push({ kind: 'polygon', points: [[366, cy - 118], [362, cy - 110], [366, cy - 102], [370, cy - 110]], fill: '#E87C7C' })
    currentOps.push({ kind: 'text', text: 'Dominant', size: 8, x: 376, y: cy - 113, color: '#6F6255' })
    y = cy - 122
  }

  addPageChrome()
  if (logo) currentOps.push({ kind: 'image', x: 48, y: 722, w: 52, h: 52 })
  else addLogo()
  currentOps.push({ kind: 'text', text: 'IAAA+', size: 14, x: 112, y: 760, font: 'bold', color: '#C8951A' })
  currentOps.push({ kind: 'text', text: 'SITUATION CARD', size: 13, x: 112, y: 744, font: 'bold', color: '#1B3A6B' })
  currentOps.push({ kind: 'text', text: options.domain || 'Situation', size: 14, x: 112, y: 720, font: 'bold', color: '#B8862D' })
  currentOps.push({ kind: 'text', text: `Snapshot : ${options.createdAt.slice(0, 10)}`, size: 9, x: 390, y: 760, color: '#6F6255' })
  currentOps.push({ kind: 'text', text: `Langue : ${options.isFr ? 'FR' : 'EN'}`, size: 9, x: 390, y: 744, color: '#6F6255' })
  currentOps.push({ kind: 'text', text: meta, size: 9, x: 390, y: 728, color: '#6F6255' })
  wrapLine(options.subject || title, 74).slice(0, 3).forEach((line, index) => {
    currentOps.push({ kind: 'text', text: line, size: 14, x: 48, y: 698 - index * 17, font: 'bold', color: '#10244A' })
  })
  currentOps.push({ kind: 'text', text: options.score ? `${options.score} / 100 · ${options.stateLabel || ''}` : options.stateLabel, size: 12, x: 48, y: 620, font: 'bold', color: '#1B3A6B' })
  const intro = options.isFr
    ? 'Une lecture structurée pour voir le système, le point fragile et les signaux à surveiller.'
    : 'A structured reading to see the system, the fragile point and the signals to watch.'
  currentOps.push({ kind: 'text', text: intro, size: 10.5, x: 48, y: 598, color: '#6F6255' })
  currentOps.push({ kind: 'line', x1: 48, y1: 590, x2: 547, y2: 590, stroke: '#DAC7A4', width: 1 })
  currentOps.push({ kind: 'text', text: options.isFr ? 'Situation soumise' : 'Submitted situation', size: 11, x: 48, y: 562, font: 'bold', color: '#C8951A' })
  y = 540
  addWrapped(options.submitted, 12, 76, '#1A2A3A')
  y -= 20
  addCardAstrolabe(options.astrolabeScores)
  addForceLines(options.astrolabeScores)

  for (const section of sections) {
    addSection(section)
  }

  if (currentOps.length > 0) flushPage(false)

  objects[0] = `<< /Type /Catalog /Pages 2 0 R >>`
  objects[1] = `<< /Type /Pages /Kids [${pages.join(' ')}] /Count ${pages.length} >>`
  objects[2] = `<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>`
  objects[3] = `<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold /Encoding /WinAnsiEncoding >>`

  const chunks: string[] = ['%PDF-1.4\n']
  const offsets: number[] = [0]
  let length = Buffer.byteLength(chunks[0], 'binary')
  objects.forEach((object, index) => {
    offsets.push(length)
    const chunk = `${index + 1} 0 obj\n${object}\nendobj\n`
    chunks.push(chunk)
    length += Buffer.byteLength(chunk, 'binary')
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
  return Buffer.from(chunks.join(''), 'binary')
}

export function renderSnapshotPdf(snapshot: GeneratedCardSnapshot): { buffer: Buffer; filename: string } {
  const payload = asPayload(snapshot.payload)
  const card = payload.writing?.situation_card
  const isFr = snapshot.language === 'fr'
  const title = snapshot.header_subject || snapshot.canonical_question || 'Situation Card'
  const lecture = lectureText(payload.writing?.lecture, isFr)
  const approfondir = approfondirText(payload.writing?.approfondir, isFr)
  const sources = payload.resources?.public_sources ?? payload.resources?.resources ?? []
  const astrolabeScores = extractAstrolabeScores(card)
  const radarSections = extractRadarDetails(card, isFr)
  const movements = extractMovements(card, isFr)
  const capRecord = typeof card === 'object' && card && typeof card.cap === 'object' ? card.cap as Record<string, unknown> : {}
  const ancrage = text(isFr ? (capRecord.hook_fr ?? capRecord.hook) : (capRecord.hook_en ?? capRecord.hook_fr ?? capRecord.hook))
  const surveiller = text(isFr ? (capRecord.watch_fr ?? capRecord.watch) : (capRecord.watch_en ?? capRecord.watch_fr ?? capRecord.watch))
  const summary = fromCard(card, ['summary_fr', 'resume_fr', 'résumé_fr', 'summary_en', 'resume'])
  const score = extractScore(card)
  const stateLabel = extractStateLabel(card, isFr)

  const sections: PdfSection[] = [
    { title: isFr ? 'Lecture' : 'Reading', body: lecture || fromCard(card, ['lecture_systeme_fr', 'lecture_systeme_en', 'lecture']) },
    { title: isFr ? 'Vulnérabilité principale' : 'Main vulnerability', body: fromCard(card, ['main_vulnerability_fr', 'main_vulnerability_en', 'main_vulnerability']), tone: 'risk' },
    { title: isFr ? 'Asymétrie' : 'Asymmetry', body: fromCard(card, ['asymmetry_fr', 'asymmetry_en', 'asymmetry']) },
    { title: 'Ancrage', body: ancrage },
    { title: 'Surveiller', body: surveiller, tone: 'signal' },
    { title: isFr ? 'Trajectoires' : 'Trajectories', body: fromCard(card, ['trajectories_text_fr', 'trajectories_text_en', 'trajectories_text']) },
    { title: isFr ? 'Signal clé' : 'Key signal', body: fromCard(card, ['key_signal_fr', 'key_signal_en', 'key_signal']), tone: 'signal' },
    { title: isFr ? 'Radar de pression' : 'Pressure radar', body: score ? `${score} / 100 · ${stateLabel}` : stateLabel, tone: 'muted' },
    ...radarSections,
    { title: 'Mouvements', body: movements },
    { title: 'Traçabilité', body: `${isFr ? 'Généré par IAAA+ SIS' : 'Generated by IAAA+ SIS'} · ${snapshot.created_at.slice(0, 10)}\nVersion ${snapshot.card_version} · Lecture structurelle`, tone: 'muted' },
    { title: isFr ? 'Résumé' : 'Summary', body: summary || lecture },
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
      stateLabel,
      createdAt: snapshot.created_at,
      isFr,
      astrolabeScores,
    }),
    filename: `${safeFilename(title)}-${snapshot.id}.pdf`,
  }
}
