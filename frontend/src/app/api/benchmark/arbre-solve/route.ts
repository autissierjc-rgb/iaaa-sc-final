
import { NextRequest, NextResponse } from 'next/server'

type SolveCase = {
  id: string
  title: string
  problem: string
}

type ArmName = 'free' | 'generic' | 'arbre_reverse'

const MODEL = process.env.ANTHROPIC_BENCHMARK_MODEL || 'claude-sonnet-5-5'

const CASES: SolveCase[] = [
  {
    id: 'english-speaking',
    title: 'Learning / speaking inhibition',
    problem: "A 52-year-old French executive has studied English on and off for years. He understands written business English reasonably well but freezes in live conversation, especially with senior people. He repeatedly responds by buying courses, studying vocabulary and grammar, then abandoning them after a few weeks because progress feels invisible. He can spend only 20 minutes per weekday and one 45-minute session on weekends. In 12 weeks he must be able to hold a 15-minute business conversation without switching to French. Design a transformation that maximizes the chance of reaching that outcome without increasing total study time. Do not recommend medication or therapy."
  },
  {
    id: 'meeting-overload',
    title: 'Organization / meeting overload',
    problem: "A 90-person software company has 31 recurring weekly meetings across teams. Employees complain that meetings consume too much time, but previous attempts to cancel meetings caused duplicated work and missed dependencies. The CEO wants to reduce total meeting-hours by at least 30% within six weeks without reducing cross-team coordination or decision traceability. No new software may be purchased and no additional manager may be hired. Design the operating change, including how it would be tested and what would trigger reversal."
  },
  {
    id: 'humanitarian-stockouts',
    title: 'Humanitarian logistics / stockouts',
    problem: "A remote humanitarian base supports several field sites. Deliveries arrive irregularly because roads can close without warning. The annual supply budget cannot increase. Staff respond to uncertainty by over-ordering some items, yet essential items still stock out. Inventory records are updated manually and are often two or three days late. Storage space is fixed. Design a transformation that reduces essential-item stockouts over the next eight weeks without increasing total inventory value or requiring new digital infrastructure."
  },
  {
    id: 'sibling-care-conflict',
    title: 'Family system / invisible care',
    problem: "Three adult siblings share responsibility for an elderly parent living alone. One sibling handles medical appointments, another visits frequently and manages emergencies, and the third manages finances and administrative paperwork remotely. All three sincerely believe they carry more than their fair share because each sees mainly the work they personally perform. Attempts to divide tasks equally have failed because the tasks are not interchangeable. Design a practical transformation that reduces recurring conflict without forcing equal time contributions or appointing one sibling as the boss."
  },
  {
    id: 'drug-resistance-experiment',
    title: 'Biology / resistance mechanism',
    problem: "In a cancer cell-line experiment, a drug initially kills most cells, but a small population survives and within three weeks the culture becomes much less sensitive. Two explanations are plausible: the drug selects a rare pre-existing resistant subpopulation, or exposure induces a reversible resistant state in initially sensitive cells. The lab can afford only one additional 4-week experiment with six culture dishes and standard sequencing at the end; no single-cell sequencing is available. Design the most discriminating experiment possible to separate the two mechanisms."
  },
  {
    id: 'school-absence',
    title: 'Public service / attendance',
    problem: "A secondary school has reduced its official absenteeism rate for two years through strict attendance targets. Teachers report, however, that some chronically disengaged pupils now spend more time physically present but doing almost no work, while exclusions and late arrivals have risen. The school cannot change national attendance rules and has no budget for extra staff. The principal wants a six-week intervention that improves actual participation rather than simply improving the attendance metric. Design the transformation and specify what evidence would show that it worked."
  }
]

const COMMON =
  "Return ONLY valid JSON with exactly these keys:\n" +
  "{\n" +
  "  \"core_reframe\": \"one sentence describing the key change in representation\",\n" +
  "  \"transformation\": \"max 320 words, concrete sequence of changes\",\n" +
  "  \"why_it_should_work\": \"max 140 words, causal mechanism\",\n" +
  "  \"first_48_hours\": [\"up to 4 immediate actions\"],\n" +
  "  \"success_metrics\": [\"up to 4 observable measures\"],\n" +
  "  \"failure_trigger\": \"one condition that should make the plan stop, reverse, or change\",\n" +
  "  \"main_risk\": \"one important unintended consequence\"\n" +
  "}\n" +
  "Respect all constraints. Prefer changes to structure, sequence, information flow, incentives, or environment over generic advice. Do not invent resources."

const FREE_PROMPT =
  "You are an excellent problem solver. Design the best practical transformation you can for the stated objective and constraints. Seek causal leverage rather than a list of tips. Do not use or imitate any named framework.\n" + COMMON

const GENERIC_PROMPT =
  "You are a rigorous systems designer. Diagnose the bottleneck, identify incentives, constraints, information flows, feedback loops, and reversible experiments, then design the smallest structural change likely to achieve the objective. Avoid generic advice and avoid unnecessary complexity.\n" + COMMON

const ARBRE_PROMPT =
  "You are using a transformation grammar called Arbre 0-9 in REVERSE to solve a problem. Use it internally; do not mention the framework or level numbers in the final answer.\n\n" +
  "Start from the desired realized state as 8: define what full useful potential would concretely look like under the stated constraints.\n" +
  "7: identify the governing axis or orientation that must remain true for that state to be coherent.\n" +
  "6: find the NEW REPRESENTATION of the problem that makes the desired state intelligible. It must change what the system is understood to be, not merely rename the goal.\n" +
  "5: derive the STRUCTURE that would embody that representation.\n" +
  "Then decompose 5 into the dynamics and the field that can generate it: 3 = forces/dynamics/incentives/flows; 4 = the physical, temporal, network, institutional, informational, or relational space in which they operate. The design should alter 3, 4, or their coupling so that 5 becomes likely.\n" +
  "2: identify the key polarity/tradeoff that must be managed rather than wished away.\n" +
  "1: identify the actionable unit or agent on which intervention is possible.\n" +
  "0: remove assumptions not required by the problem and keep only the necessary background conditions.\n" +
  "9: inspect whether the metric, observer, designer, or intervention itself could distort the system. Build a check against that distortion.\n\n" +
  "Do not force novelty. If the best solution is simple, keep it simple. The value of the grammar is a better transformation, not philosophical language.\n" + COMMON

async function callClaude(system: string, user: string): Promise<any> {
  const apiKey = process.env.ANTHROPIC_API_KEY || ''
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing')

  async function rawCall(sys: string, usr: string, maxTokens = 3200) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        temperature: 0,
        system: sys,
        messages: [{ role: 'user', content: usr }],
      }),
    })
    if (!response.ok) {
      const body = await response.text()
      throw new Error('Anthropic call failed: ' + response.status + ' ' + body.slice(0, 300))
    }
    const data = await response.json()
    return Array.isArray(data?.content)
      ? data.content.map((x: any) => x?.type === 'text' ? x.text : '').join('').trim()
      : ''
  }

  const text = await rawCall(system, user)
  const clean = text.replace(/^\x60\x60\x60(?:json)?\s*/i, '').replace(/\s*\x60\x60\x60$/i, '')
  try {
    return JSON.parse(clean)
  } catch {
    const repairedText = await rawCall(
      'Repair the following malformed or truncated JSON into valid JSON. Preserve intended content. Return JSON only.',
      clean,
      3200
    )
    const repaired = repairedText.replace(/^\x60\x60\x60(?:json)?\s*/i, '').replace(/\s*\x60\x60\x60$/i, '')
    return JSON.parse(repaired)
  }
}

function permutation(index: number): number[] {
  const perms = [
    [0,1,2], [1,2,0], [2,0,1], [1,0,2], [2,1,0], [0,2,1]
  ]
  return perms[index % perms.length]
}

async function judge(c: SolveCase, outputs: Record<string, any>) {
  const system =
    "You are a blind evaluator of problem-solving proposals. You do not know which method produced A, B, or C. Do not reward jargon, length, or novelty for its own sake. Judge the proposal solely on whether it creates a better transformation under the stated constraints.\n\n" +
    "Score 0-10 on: objective_fit, causal_leverage, feasibility, useful_originality, robustness, testability, simplicity. Penalize hidden resource assumptions, generic advice, metric gaming, and elegant plans that cannot be implemented.\n" +
    "Return ONLY valid JSON. A, B and C must each contain the seven scores plus total = arithmetic mean rounded to one decimal. Also return winner = A|B|C|tie and rationale max 140 words."

  return callClaude(system, JSON.stringify({problem:c.problem, outputs}, null, 2))
}

export async function GET(req: NextRequest) {
  try {
    const requested = Number(req.nextUrl.searchParams.get('case') || '0')
    const index = Number.isFinite(requested) ? Math.max(0, Math.min(CASES.length-1, Math.trunc(requested))) : 0
    const c = CASES[index]
    const user = 'Solve this problem:\n\n' + c.problem

    const [free, generic, arbre] = await Promise.all([
      callClaude(FREE_PROMPT, user),
      callClaude(GENERIC_PROMPT, user),
      callClaude(ARBRE_PROMPT, user),
    ])

    const raw = [free, generic, arbre]
    const armNames: ArmName[] = ['free','generic','arbre_reverse']
    const perm = permutation(index)
    const labels = ['A','B','C']
    const anonymized: Record<string, any> = {}
    const mapping: Record<string, ArmName> = {}

    for (let i=0;i<3;i++) {
      anonymized[labels[i]] = raw[perm[i]]
      mapping[labels[i]] = armNames[perm[i]]
    }

    const judgement = await judge(c, anonymized)

    return NextResponse.json({
      benchmark:'arbre-reverse-solve-pilot-v1',
      model:MODEL,
      case_index:index,
      case_id:c.id,
      title:c.title,
      anonymized_outputs:anonymized,
      blind_judge:judgement,
      revealed_mapping:mapping,
    })
  } catch (error) {
    return NextResponse.json({error:error instanceof Error ? error.message : 'benchmark failed'}, {status:500})
  }
}
