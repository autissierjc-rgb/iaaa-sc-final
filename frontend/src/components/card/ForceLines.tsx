'use client'

import { TXT2, TXT3 } from '@/lib/constants'
import type { Lang } from '@/lib/constants'

const BRANCH_DESC_FR: Record<string, string> = {
  I:    'Ceux qui agissent, influencent ou bloquent.',
  II:   'Ce que les parties cherchent, défendent ou refusent.',
  III:  'Ce qui pousse, soutient ou accélère la situation.',
  IV:   'Ce qui oppose, fragilise ou met sous pression.',
  V:    "Ce qui limite l'action et réduit les marges.",
  VI:   'Ce que l’analyse risque de ne pas voir alors que cela peut renverser la lecture.',
  VII:  "Les rythmes, délais et fenêtres d'action.",
  VIII: 'Les récits, croyances, réputations et lectures qui orientent les comportements.',
}
const BRANCH_DESC_EN: Record<string, string> = {
  I:    'Those who act, influence or block.',
  II:   'What each party seeks, defends or refuses.',
  III:  'What pushes, sustains or accelerates the situation.',
  IV:   'What opposes, weakens or puts under pressure.',
  V:    'What limits action and reduces room to manoeuvre.',
  VI:   'What the analysis may miss even though it could reverse the reading.',
  VII:  'The rhythms, deadlines and windows for action.',
  VIII: 'The narratives, beliefs, reputations and readings that shape behaviour.',
}

const COLORS = ['#E0DCD4', '#B8D4F0', '#F0CA70', '#E87C7C']

interface Score {
  display_score: number
  name: string
  name_en: string
  branch: string
}

export default function ForceLines({ scores, lang }: { scores: Score[]; lang: Lang }) {
  return (
    <div style={{ width: '100%' }}>
      {scores.map((s, i) => {
        const desc = lang === 'FR' ? BRANCH_DESC_FR[s.branch] : BRANCH_DESC_EN[s.branch]
        const name = s.branch === 'VI'
          ? (lang === 'FR' ? 'Incertitudes' : 'Uncertainties')
          : (lang === 'FR' ? s.name : s.name_en)
        return (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 9, color: TXT3, fontStyle: 'italic', width: 22, textAlign: 'right', flexShrink: 0 }}>
                {s.branch}
              </span>
              <span style={{ fontSize: 10, color: TXT2, width: 72, flexShrink: 0, fontWeight: 500 }}>
                {name}
              </span>
              <div style={{ flex: 1, height: 5, background: '#EDEAE4', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  width: `${(s.display_score / 3) * 100}%`,
                  height: '100%',
                  background: COLORS[s.display_score] ?? COLORS[0],
                  borderRadius: 3,
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
            {desc && (
              <div style={{ paddingLeft: 30, fontSize: 9, color: TXT3, fontStyle: 'italic', lineHeight: 1.4 }}>
                {desc}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
