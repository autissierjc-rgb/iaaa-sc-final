import { createHash } from 'crypto'
import type {
  UserReactionEvent,
  UserReactionKind,
  UserReactionLayer,
} from '@/lib/contracts'

export type BuildUserReactionInput = {
  message: string
  generation_event_id?: string
  session_id?: string
  user_id?: string
  allow_private_learning?: boolean
}

const LAYER_TERMS: Array<{
  layer: UserReactionLayer
  terms: string[]
}> = [
  { layer: 'interpretation', terms: ['question', 'header', 'titre', 'situation soumise', 'formalisation', 'intention', 'comprehension'] },
  { layer: 'dialogue', terms: ['clarification', 'relance', 'demander', 'interrogatoire', 'oui', 'confirmation'] },
  { layer: 'theatre', terms: ['hors sol', 'concret', 'acteurs', 'institution', 'procedure', 'situé', 'située', 'theatre'] },
  { layer: 'resources', terms: ['ressource', 'source', 'reuters', 'media', 'url', 'web', 'tavily'] },
  { layer: 'scoring', terms: ['score', 'scoring', 'dominant', 'stable', 'instability', 'radar', 'astrolabe'] },
  { layer: 'writing', terms: ['lecture', 'approfondir', 'diamant', 'style', 'phrase', 'essai', 'audace', 'logico', 'notice'] },
  { layer: 'quality', terms: ['regression', 'bug', 'casse', 'qualite', 'quality'] },
  { layer: 'recherchePlus', terms: ['recherche+', 'enquete', 'preuve', 'verification', 'signal faible', 'resume de source'] },
  { layer: 'UI/mobile', terms: ['bouton', 'mobile', 'portable', 'affichage', 'logo', 'icone', 'page'] },
  { layer: 'share', terms: ['partage', 'facebook', 'whatsapp', 'linkedin', 'reseaux sociaux'] },
  { layer: 'performance', terms: ['lent', 'timeout', 'tourne', 'attente', 'latence', 'temps'] },
]

function hashMessage(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16)
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function classifyLayers(message: string): { layers: UserReactionLayer[]; terms: string[] } {
  const normalized = normalize(message)
  const matched: UserReactionLayer[] = []
  const terms: string[] = []

  for (const candidate of LAYER_TERMS) {
    const found = candidate.terms.filter((term) => normalized.includes(normalize(term)))
    if (found.length > 0) {
      matched.push(candidate.layer)
      terms.push(...found)
    }
  }

  return {
    layers: matched.length > 0 ? Array.from(new Set(matched)).slice(0, 3) : ['writing'],
    terms: Array.from(new Set(terms)).slice(0, 8),
  }
}

function classifyKind(message: string): UserReactionKind {
  const normalized = normalize(message)
  if (/\b(waouh|genial|super|parfait|excellent|beau boulot)\b/.test(normalized)) return 'surprise_positive'
  if (/\b(ok|oui|valide|exactement)\b/.test(normalized)) return 'approval'
  if (/\b(pourquoi|je ne comprends pas|confus|perdu)\b/.test(normalized)) return 'confusion'
  if (/\b(faux|non|corrige|coquille|pas les bons|reprends)\b/.test(normalized)) return 'correction'
  if (/\b(n importe quoi|fatigue|marre|pffff|rien ne bouge|tu me fais peur)\b/.test(normalized)) return 'frustration'
  if (/\b(approfondir|creuser|enquete|preuve|source|recherche)\b/.test(normalized)) return 'request_deeper'
  if (/\b(genere|fait le|go|pousse|commit|branche)\b/.test(normalized)) return 'request_action'
  if (/\b(bug|casse|erreur|ne marche pas|inaccessible|timeout)\b/.test(normalized)) return 'bug_report'
  return 'confusion'
}

function intensity(message: string, kind: UserReactionKind): 1 | 2 | 3 {
  const normalized = normalize(message)
  if (/[!?]{2,}/.test(message) || /\b(peur|marre|fatigue|n importe quoi|rien ne bouge)\b/.test(normalized)) return 3
  if (kind === 'frustration' || kind === 'surprise_positive' || kind === 'bug_report') return 2
  return 1
}

export function buildUserReactionEvent(input: BuildUserReactionInput): UserReactionEvent {
  const message = input.message.trim()
  const layers = classifyLayers(message)
  const kind = classifyKind(message)

  return {
    id: `react_${Date.now()}`,
    created_at: new Date().toISOString(),
    generation_event_id: input.generation_event_id,
    session_id: input.session_id,
    user_id: input.user_id,
    message_hash: hashMessage(message),
    message_chars: message.length,
    probable_layers: layers.layers,
    reaction_kind: kind,
    intensity: intensity(message, kind),
    evidence_terms: layers.terms,
    privacy_mode: input.allow_private_learning ? 'private_learning_snapshot' : 'metadata_only',
  }
}
