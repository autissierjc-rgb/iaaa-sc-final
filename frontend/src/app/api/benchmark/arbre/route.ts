
import { NextRequest, NextResponse } from 'next/server'

type BenchCase = {
  id: string
  title: string
  situation: string
  reference_mechanism: string
  should_reach_6_8: boolean
}

type ArmName = 'free' | 'generic' | 'arbre_0_9'

const MODEL = process.env.ANTHROPIC_BENCHMARK_MODEL || 'claude-sonnet-5-5'

const CASES: BenchCase[] = [
  {
    id: 'credit-selective-labels',
    title: 'Credit model / selective labels',
    should_reach_6_8: true,
    situation: "A retail bank has used a machine-learning credit model for four years. Approval rates have fallen from 62% to 41%, while default rates among approved borrowers have fallen from 5.8% to 3.1%. The model is retrained every quarter only on loans that were actually granted, because rejected applicants generate no repayment history. Branch managers report that borderline applicants are now rejected more consistently than before. Marketing says the applicant pool has not materially deteriorated. The risk team considers the falling default rate evidence that the model has become more accurate. Manual overrides have also fallen sharply. The bank has no randomized approval sample and no outcome data for rejected applicants.",
    reference_mechanism: "The approval rule determines which future outcomes become observable. Retraining only on accepted applicants creates selective labels and a feedback loop: the model can become increasingly confident about a population it has itself selected, while apparent lower default does not establish improved calibration for the full applicant population.",
  },
  {
    id: 'hospital-window',
    title: 'Emergency department / measurement window',
    should_reach_6_8: true,
    situation: "A hospital introduced an AI-supported emergency-department flow system. Median time from admission to discharge fell by 29% in six months and the department now regularly meets its target. Staffing levels, disease mix and bed capacity are broadly unchanged. During the same period, unscheduled returns within 72 hours rose by 17%, but those returns are recorded as new episodes and are excluded from the department flow KPI. Clinicians say the system increasingly recommends early discharge for borderline cases. Management believes the shorter stays demonstrate greater operational efficiency. Patient satisfaction at the moment of discharge has slightly improved, while complaints submitted several days later have increased.",
    reference_mechanism: "The optimization pressure acts across a measurement boundary. The system can improve the measured discharge-time KPI by shifting unresolved clinical burden beyond the observation window, where returns are counted as new episodes. Apparent efficiency may therefore be temporal displacement rather than elimination of work or risk.",
  },
  {
    id: 'procurement-concentration',
    title: 'Procurement / hidden dependency',
    should_reach_6_8: true,
    situation: "A manufacturer changed procurement bonuses so that buyers are rewarded primarily for annual unit-cost reductions. In two years average purchase price fell 8%. The approved supplier base fell by roughly one third, inventory buffers were reduced, and buyers increasingly bundle volumes with the cheapest qualified vendors to obtain discounts. Three production stoppages this year involved the same component family, each time because a dominant supplier could not deliver. The procurement dashboard reports price variance, on-time delivery and annual savings but not supplier concentration, substitutability or time needed to qualify an alternative. Executives continue to describe procurement as one of the company strongest-performing functions.",
    reference_mechanism: "The cost-reduction force is structured through the supplier network and progressively concentrates dependence. Visible price savings are partly converted into an unmeasured loss of substitutability and resilience. The performance representation can reinforce the very concentration that creates systemic fragility.",
  },
  {
    id: 'pump-cavitation-control',
    title: 'Pump cavitation / physical control',
    should_reach_6_8: false,
    situation: "A centrifugal pump that has operated reliably for years has become noisy and its flow rate has fallen by 18%. The motor current is slightly lower than usual. The discharge valve position has not changed. A maintenance inspection finds no broken impeller blades and no major bearing damage. The liquid temperature is unchanged. The suction filter was replaced six months ago with a finer mesh and differential pressure across that filter has gradually increased. Operators also observe intermittent bubbles in the pump casing. When the tank level is high the symptoms are less severe.",
    reference_mechanism: "The finer and increasingly restricted suction filter raises suction losses, reducing inlet pressure and causing cavitation. This is a local physical causal mechanism; no higher-order representation shift is required to explain the observations.",
  },
  {
    id: 'greenhouse-drainage-control',
    title: 'Greenhouse roots / physical control',
    should_reach_6_8: false,
    situation: "Tomato plants in one greenhouse bay show wilting, yellow lower leaves and reduced growth. Fertilizer formulation is identical across all bays and leaf analysis does not show a major nutrient deficiency. Air temperature and humidity are similar. The affected bay received a new floor liner before the season. Irrigation volume is the same as elsewhere, but water remains visible longer near several beds after irrigation. Roots sampled from the affected beds are brown and soft, while roots in adjacent bays are white. Disease symptoms are concentrated in the lowest part of the bay.",
    reference_mechanism: "The new liner and local geometry impair drainage, creating waterlogged root zones and secondary root damage or rot. The relevant explanation is the interaction of water flow with physical space; a new representation regime is not needed.",
  },
  {
    id: 'warehouse-bottleneck-control',
    title: 'Warehouse bottleneck / operational control',
    should_reach_6_8: false,
    situation: "A warehouse redesign reduced average walking distance for pickers by 22%, yet completed orders per hour fell by 9%. Picking accuracy is unchanged. The new layout moved the fastest-selling items closer to packing, concentrating many pickers into two narrow cross-aisles. Scanner logs show more idle seconds while workers wait for access to those aisles. Packing capacity and order mix are unchanged. Outside the two cross-aisles, travel times are lower than before. Management suspects workers have become less motivated because the redesign should have made their jobs easier.",
    reference_mechanism: "The redesign reduces individual travel distance but spatially concentrates traffic, creating congestion at two cross-aisles. The force is picker flow, the relevant space is aisle topology, and their interaction creates a bottleneck. The mechanism is structural but does not require a representation shift beyond level 5.",
  },
]

const COMMON_OUTPUT =
  "Return ONLY valid JSON with exactly these keys:\n" +
  "{\n" +
  "  \"analysis\": \"max 260 words\",\n" +
  "  \"key_mechanism\": \"one concise sentence\",\n" +
  "  \"supporting_evidence\": [\"up to 4 concrete clues from the case\"],\n" +
  "  \"alternative_explanations\": [\"up to 3 credible alternatives\"],\n" +
  "  \"falsifier\": \"one observation that would materially weaken your interpretation\",\n" +
  "  \"next_signal\": \"one observable signal or test to check next\",\n" +
  "  \"confidence\": 0.0\n" +
  "}\n" +
  "Do not invent facts. Distinguish observation from inference. If the case does not justify a deep or reflexive interpretation, do not force one."

const FREE_PROMPT =
  "You are a rigorous analyst. Analyze the situation as well as you can. Find the most important underlying mechanism, not merely a summary. Be concise, causal, skeptical, and falsifiable. Do not use or imitate any named analytical framework.\n" +
  COMMON_OUTPUT

const GENERIC_PROMPT =
  "You are a rigorous systems analyst. Before answering, systematically inspect actors or components, incentives or forces, causal chains, spatial and temporal constraints, feedback loops, measurement artifacts, uncertainty, and alternative explanations. Prefer the simplest mechanism that explains the evidence. Do not force higher-order effects where a local causal explanation is sufficient.\n" +
  COMMON_OUTPUT

const ARBRE_PROMPT =
  "You are testing an analytical grammar called Arbre 0-9. Use it as an internal transformation protocol, but do NOT mention level numbers or the framework in the final answer.\n\n" +
  "0: Suspend the initial framing and identify the undifferentiated background from which the problem is being singled out.\n" +
  "1: Identify the unit, agent, object, or phenomenon that has been distinguished.\n" +
  "2: Identify the consequential difference, opposition, or polarity around it. Do not force binary opposition when none exists.\n" +
  "3: Identify the forces and dynamics: what pushes, attracts, blocks, accelerates, erodes, reinforces, or transforms.\n" +
  "4: Identify the direction or space in which those dynamics operate: physical space, state-space, network topology, temporal direction, institutional field, information path, or other relevant geometry.\n" +
  "5: STRUCTURATION. Do not list categories. Ask what structure is actually produced when the dynamics of 3 operate inside the direction or space of 4. Level 5 is the organization produced by 3 through 4.\n" +
  "6: Ask whether 5 genuinely supports a NEW REPRESENTATION of the situation. This must change the model, not merely rephrase it. If it does not, STOP the upward progression and do not invent 6-8.\n" +
  "7: If 6 exists, identify the axis or orientation that organizes that new representation.\n" +
  "8: FULL POTENTIAL. If 6 and 7 are justified, derive what is coherently contained in that representation if it unfolds toward its full potential. This is NOT a prediction and must be conditional. If no real 6 exists, do not produce an 8.\n" +
  "0-prime: If the potential in 8 were substantially realized, ask what new background or regime would then become the starting field for another cycle.\n" +
  "9: WITNESS or META-OBSERVATION. Only when relevant, inspect how the observer, metric, model, reporting rule, institution, or analyst participates in constructing the representation being used. Do not force observer effects into simple physical mechanisms.\n\n" +
  "The objective is not to sound deep. Stop when the evidence stops. Penalize your own over-interpretation.\n" +
  COMMON_OUTPUT

async function callClaude(system: string, user: string): Promise<any> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1200,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error('Anthropic call failed: ' + response.status + ' ' + body.slice(0, 300))
  }

  const data = await response.json()
  const text = Array.isArray(data?.content)
    ? data.content.map((x: any) => x?.type === 'text' ? x.text : '').join('').trim()
    : ''

  const clean = text.replace(/^\x60\x60\x60(?:json)?\s*/i, '').replace(/\s*\x60\x60\x60$/i, '')
  return JSON.parse(clean)
}

function permutation(index: number): number[] {
  const perms = [
    [0, 1, 2],
    [1, 2, 0],
    [2, 0, 1],
    [1, 0, 2],
    [2, 1, 0],
    [0, 2, 1],
  ]
  return perms[index % perms.length]
}

async function judge(caseData: BenchCase, anonymized: Record<string, any>) {
  const system =
    "You are a blind benchmark judge. You do not know which prompting method produced A, B, or C. Do not reward jargon, length, or apparent sophistication. Score content against the case and reference mechanism.\n\n" +
    "For each output score 0-10 on: mechanism_accuracy, structural_discovery, epistemic_discipline, falsifiability, no_overreach, compression.\n" +
    "Return ONLY valid JSON with keys A, B, C, winner, rationale. Each of A/B/C must contain the six dimension scores and a total equal to their arithmetic mean rounded to one decimal. winner must be A, B, C, or tie. rationale max 120 words."

  const user = JSON.stringify({
    case: caseData.situation,
    reference_mechanism: caseData.reference_mechanism,
    expected_depth: caseData.should_reach_6_8
      ? 'A representation shift or higher-order loop is genuinely present.'
      : 'A local or level-5 structural mechanism is sufficient; higher-order depth should be penalized if forced.',
    outputs: anonymized,
  }, null, 2)

  return callClaude(system, user)
}

export async function GET(req: NextRequest) {
  try {
    const requested = Number(req.nextUrl.searchParams.get('case') || '0')
    const index = Number.isFinite(requested)
      ? Math.max(0, Math.min(CASES.length - 1, Math.trunc(requested)))
      : 0
    const c = CASES[index]
    const user = 'Analyze this case:\n\n' + c.situation

    const [free, generic, arbre] = await Promise.all([
      callClaude(FREE_PROMPT, user),
      callClaude(GENERIC_PROMPT, user),
      callClaude(ARBRE_PROMPT, user),
    ])

    const raw = [free, generic, arbre]
    const armNames: ArmName[] = ['free', 'generic', 'arbre_0_9']
    const perm = permutation(index)
    const labels = ['A', 'B', 'C']
    const anonymized: Record<string, any> = {}
    const mapping: Record<string, ArmName> = {}

    for (let i = 0; i < 3; i++) {
      anonymized[labels[i]] = raw[perm[i]]
      mapping[labels[i]] = armNames[perm[i]]
    }

    const judgement = await judge(c, anonymized)

    return NextResponse.json({
      benchmark: 'arbre-0-9-pilot-v1',
      model: MODEL,
      case_index: index,
      case_id: c.id,
      title: c.title,
      should_reach_6_8: c.should_reach_6_8,
      anonymized_outputs: anonymized,
      blind_judge: judgement,
      revealed_mapping: mapping,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'benchmark failed' },
      { status: 500 }
    )
  }
}
