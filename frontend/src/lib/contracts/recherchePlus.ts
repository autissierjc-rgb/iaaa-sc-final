import type { TraceMeta } from './common'
import type { SourceChannel } from './resources'

export type RecherchePlusChannel =
  | SourceChannel
  | 'x_public'
  | 'reddit_public'
  | 'facebook_public'
  | 'linkedin_public'
  | 'forum_public'
  | 'github_public'

export type RecherchePlusSignalStatus =
  | 'lead'
  | 'weak_signal'
  | 'solid_source'
  | 'contradiction'
  | 'not_accessible'

export type RecherchePlusTarget = {
  blind_spot: string
  question: string
  expected_evidence: string
  allowed_channels: RecherchePlusChannel[]
  excluded_channels: RecherchePlusChannel[]
  safety_note?: string
}

export type RecherchePlusFinding = {
  target_blind_spot: string
  status: RecherchePlusSignalStatus
  channel: RecherchePlusChannel
  source_title: string
  source_url?: string
  retrieved_at: string
  what_it_suggests: string
  what_it_does_not_prove: string
  next_verification_step: string
}

export type RecherchePlusContract = {
  mode: 'not_started' | 'prepared' | 'running' | 'completed' | 'failed'
  introduction_fr: string
  targets: RecherchePlusTarget[]
  findings: RecherchePlusFinding[]
  public_disclaimer_fr: string
  trace: TraceMeta
}
