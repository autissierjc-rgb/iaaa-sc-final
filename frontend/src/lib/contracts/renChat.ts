import type { LanguageCode, TraceMeta } from './common'
import type { TreatmentPlanContract } from './interpretation'
import type { RiskAdviceGuardContract } from './safety'
import type { SecurityAbuseGuardContract } from './security'
import type { UserMaterialSourceType } from './userMaterial'

export type RenChatMode =
  | 'explore'
  | 'clarify'
  | 'challenge'
  | 'ready_for_card'
  | 'guarded'

export type RenSuggestedNextAction =
  | 'continue_chat'
  | 'ask_one_precision'
  | 'click_compass_generate_card'
  | 'attach_material'
  | 'launch_recherche_plus'

export type RenWorkingContext = {
  situation_hint?: string
  pending_questions?: string[]
  post_card_feedback?: {
    message_hash: string
    probable_layers: string[]
    reaction_kind: string
    relance_phase?: 'pre_generate' | 'post_complete' | 'bridge_to_complete'
    influences_next_generation: boolean
  }
  actors: string[]
  constraints: string[]
  hypotheses: string[]
  missing_context: string[]
  material_sources: UserMaterialSourceType[]
  ready_for_card: boolean
}

export type RenChatRequest = {
  message: string
  language?: LanguageCode
  treatment_plan?: TreatmentPlanContract
  working_context?: Partial<RenWorkingContext>
  material_sources?: UserMaterialSourceType[]
}

export type RenChatResponseContract = {
  answer: string
  ren_mode: RenChatMode
  treatment_plan?: TreatmentPlanContract
  useful_context: string[]
  missing_context: string[]
  suggested_next_action: RenSuggestedNextAction
  working_context: RenWorkingContext
  safety: RiskAdviceGuardContract | null
  security: SecurityAbuseGuardContract | null
  trace: TraceMeta
}
