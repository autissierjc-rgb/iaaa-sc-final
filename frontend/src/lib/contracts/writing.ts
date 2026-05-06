import type { TraceMeta } from './common'

export type SituationCardViewContract = {
  title_fr: string
  title_en?: string
  submitted_situation_fr: string
  submitted_situation_en?: string
  insight_fr: string
  insight_en?: string
  main_vulnerability_fr: string
  main_vulnerability_en?: string
  asymmetry_fr: string
  asymmetry_en?: string
  key_signal_fr: string
  key_signal_en?: string
}

export type TrajectoryContract = {
  type: 'stabilization' | 'escalation' | 'regime_shift'
  title_fr: string
  title_en?: string
  description_fr: string
  description_en?: string
  signal_fr: string
  signal_en?: string
}

export type LectureContract = {
  text_fr: string
  text_en?: string
  word_count_fr: number
}

export type ApprofondirContract = {
  analysis_fr: string
  analysis_en?: string
  sections_fr: Array<{
    id: string
    title: string
    body: string
  }>
}

export type WritingContract = {
  situation_card: SituationCardViewContract
  trajectories: TrajectoryContract[]
  lecture: LectureContract
  approfondir: ApprofondirContract
  public_warnings: string[]
  trace: TraceMeta
}
