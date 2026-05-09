import type { AstrolabeBranchCode } from '../contracts'
import type { DumezilFunction } from '../patterns/humanCollective'

export type TriadBalance = Record<DumezilFunction, number>

export type TriadAstrolabeInfluence = {
  function_id: DumezilFunction
  label_fr: string
  active: boolean
  suggested_branches: AstrolabeBranchCode[]
  rationale_fr: string
}

const EMPTY_BALANCE: TriadBalance = {
  legitimize: 0,
  protect_fight: 0,
  produce_reproduce: 0,
}

export function normalizeTriadBalance(balance?: Partial<TriadBalance>): TriadBalance {
  return {
    legitimize: balance?.legitimize ?? 0,
    protect_fight: balance?.protect_fight ?? 0,
    produce_reproduce: balance?.produce_reproduce ?? 0,
  }
}

export function triadAstrolabeInfluence(balance?: Partial<TriadBalance>): TriadAstrolabeInfluence[] {
  const normalized = normalizeTriadBalance(balance ?? EMPTY_BALANCE)
  const activeThreshold = 1

  return [
    {
      function_id: 'legitimize',
      label_fr: 'Legitimer',
      active: normalized.legitimize >= activeThreshold,
      suggested_branches: ['I', 'II', 'VIII'],
      rationale_fr:
        'La legitimite fissuree eclaire les acteurs autorises, les interets de reputation et les recits publics.',
    },
    {
      function_id: 'protect_fight',
      label_fr: 'Proteger / combattre',
      active: normalized.protect_fight >= activeThreshold,
      suggested_branches: ['IV', 'V', 'VII'],
      rationale_fr:
        'La protection ou le conflit eclaire les tensions, contraintes, urgences et seuils de reponse.',
    },
    {
      function_id: 'produce_reproduce',
      label_fr: 'Produire / reproduire',
      active: normalized.produce_reproduce >= activeThreshold,
      suggested_branches: ['III', 'V', 'VI'],
      rationale_fr:
        'La production non reconnue eclaire les forces reelles, contraintes materielles et angles morts de charge.',
    },
  ]
}

