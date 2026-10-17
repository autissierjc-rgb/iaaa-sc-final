
import { NextRequest, NextResponse } from 'next/server'

type Arm = 'free' | 'generic' | 'arbre'
type CaseKind = 'flux' | 'agent' | 'protocol'

type FrontierCase = {
  id: string
  kind: CaseKind
  title: string
  input: string
  expected?: string
  reference: string
}

const MODEL = process.env.ANTHROPIC_BENCHMARK_MODEL || 'claude-sonnet-5-5'

const CASES: FrontierCase[] = [
  {
    id:'flux-supplier-regime',
    kind:'flux',
    title:'Flux / supplier network regime shift',
    input:[
      'W1: late deliveries 4%, supplier A normal, B normal, C normal; spot freight +1%.',
      'W2: late deliveries 7%, one storm delay at B; spot freight +6%.',
      'W3: late deliveries 5%, A normal, B recovers, C normal; spot freight +2%.',
      'W4: late deliveries 8%, customs delay at C; spot freight +7%.',
      'W5: late deliveries 6%, A normal, B normal, C normal; spot freight +3%.',
      'W6: late deliveries 9%, labor action at one port; spot freight +9%.',
      'W7: late deliveries 6%, port recovers; component X lead time 12d; Y 10d.',
      'W8: late deliveries 7%, X 13d, Y 10d; A/B/C still asynchronous.',
      'W9: late deliveries 8%, X 14d, Y 11d; two buyers report small X allocations.',
      'W10: late deliveries 10%, X 17d, Y 11d; A and C both mention upstream X quota.',
      'W11: late deliveries 16%, X 24d, Y 11d; A/B/C all cut X confirmations in same week; spot freight +18%.',
      'W12: late deliveries 23%, X 31d, Y 12d; all three suppliers cite the same upstream wafer constraint; expedite spend doubles.',
      'W13: late deliveries 27%, X 35d, Y 12d; production lines using X begin synchronized stoppages.',
      'W14: late deliveries 25%, X 34d, Y 12d; local logistics incidents fall but X shortages persist.'
    ].join('\n'),
    expected:'W10-W11',
    reference:'The system changes from independent logistics noise to a common upstream component-X constraint propagating synchronously through multiple suppliers. The useful regime-shift window is W10-W11, becoming undeniable by W12.'
  },
  {
    id:'flux-no-shift',
    kind:'flux',
    title:'Flux / noisy process without regime shift',
    input:[
      'D1 defect 2.1%, line speed 100, humidity 44%.',
      'D2 defect 2.8%, speed 100, humidity 61%.',
      'D3 defect 2.0%, speed 99, humidity 47%.',
      'D4 defect 3.0%, speed 101, humidity 64%.',
      'D5 defect 2.2%, speed 100, humidity 46%.',
      'D6 defect 2.7%, speed 100, humidity 59%.',
      'D7 defect 2.1%, speed 99, humidity 45%.',
      'D8 defect 2.9%, speed 101, humidity 62%.',
      'D9 defect 2.3%, speed 100, humidity 48%.',
      'D10 defect 2.8%, speed 100, humidity 60%.',
      'D11 defect 2.1%, speed 100, humidity 45%.',
      'D12 defect 2.9%, speed 100, humidity 63%.'
    ].join('\n'),
    expected:'NO_SHIFT',
    reference:'There is no regime shift. Defect variation repeatedly tracks humidity oscillation while line speed remains stable; the same relationship persists throughout.'
  },
  {
    id:'agent-dynamic-corridor',
    kind:'agent',
    title:'Agent / map becomes a flow field',
    input:'A mobile hospital robot must deliver a tray from West to East in under 90 seconds. Its static map says corridor A is shortest (45 s) and corridor B takes 78 s. New observations: every 30 s a coordinated gurney convoy enters corridor A from East, occupies its full width for 22 s, and staff rules require the robot to yield and back out if already inside. The next convoy is due in 8 s. Corridor B is empty and stable. Available actions now: ACTION_A enter corridor A immediately; ACTION_B wait 24 s then use A; ACTION_C take corridor B immediately. Choose one action and explain the model update that justifies it.',
    expected:'ACTION_C',
    reference:'The static shortest-path representation is no longer adequate: corridor A is a periodic directional flow field with a right-of-way constraint. Entering now risks forced retreat; waiting then A would exceed or nearly consume the deadline. B is the robust action.'
  },
  {
    id:'agent-unchanged-model',
    kind:'agent',
    title:'Agent / no need to rebuild representation',
    input:'A warehouse robot must reach station Z. Route A takes 42 s, route B takes 65 s. A proximity sensor reports a cardboard box partly protruding 15 cm into route A, while the lane remains 110 cm wide and the robot needs 70 cm clearance. The box is stationary, no humans or vehicles are moving nearby, and route A has remained clear enough for three consecutive scans. Available actions: ACTION_A use route A at reduced speed around the box; ACTION_B stop and request a new map; ACTION_C take route B. Choose one action and state whether a new representation of the environment is required.',
    expected:'ACTION_A',
    reference:'No regime/model change is required. This is a local obstacle within the existing geometric representation; route A remains feasible with sufficient clearance.'
  },
  {
    id:'protocol-credit',
    kind:'protocol',
    title:'Protocol / transmit selective-labels situation',
    input:'A bank credit model is retrained quarterly only on approved applicants because rejected applicants have no repayment outcome. Approval fell from 62% to 41%; default among approved borrowers fell from 5.8% to 3.1%. Borderline applicants are rejected more consistently, manual overrides fell, and there is no randomized approval sample. A second AI must choose one intervention from: ACTION_A lower the approval threshold until approvals return to 62%; ACTION_B run a bounded randomized approval experiment near the cutoff and evaluate calibration/profit; ACTION_C retrain more frequently on the same approved-only data. The first AI may transmit at most 120 words to the second.',
    expected:'ACTION_B',
    reference:'The crucial transmitted structure is that the model controls which labels become observable, creating selective labels/self-confirmation. A bounded exploration sample is needed to recover counterfactual information.'
  },
  {
    id:'protocol-school',
    kind:'protocol',
    title:'Protocol / transmit attendance-vs-participation situation',
    input:'A school has improved official attendance for two years through strict targets. Teachers report that some chronically disengaged pupils are physically present but do almost no work; exclusions and lateness have risen. National attendance rules cannot change and there is no budget for new staff. A second AI must choose: ACTION_A intensify attendance sanctions; ACTION_B keep attendance as a guardrail but add a small checkable lesson-level participation measure and redesign re-entry into lessons; ACTION_C stop tracking attendance internally. The first AI may transmit at most 120 words to the second.',
    expected:'ACTION_B',
    reference:'The key representation is that attendance is an entry condition, not the actual outcome. Presence and participation have diverged; the intervention must measure and shape working participation without abandoning the mandated attendance metric.'
  }
]

const ARBRE_CORE =
  '0 suspend the inherited framing; 1 identify the operative unit; 2 identify the consequential polarity; 3 identify forces/dynamics; 4 identify the space/topology/direction in which they operate; 5 derive the structure produced by 3 through 4; 6 only if justified, form a genuinely new representation; 7 identify its organizing axis; 8 derive its conditional full potential, not a prediction; 9 inspect observer/metric/model effects. Never force 6-8 when 5 is sufficient.'

async function callClaude(system:string, user:string, maxTokens=1800):Promise<any>{
  const apiKey = process.env.ANTHROPIC_API_KEY || ''
  if(!apiKey) throw new Error('ANTHROPIC_API_KEY missing')
  const resp = await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{'x-api-key':apiKey,'anthropic-version':'2023-06-01','content-type':'application/json'},
    body:JSON.stringify({model:MODEL,max_tokens:maxTokens,system,messages:[{role:'user',content:user}]})
  })
  if(!resp.ok) throw new Error('Anthropic call failed '+resp.status+': '+(await resp.text()).slice(0,300))
  const data=await resp.json()
  const txt=Array.isArray(data?.content)?data.content.map((x:any)=>x?.type==='text'?x.text:'').join('').trim():''
  const clean=txt.replace(/^\x60\x60\x60(?:json)?\s*/i,'').replace(/\s*\x60\x60\x60$/i,'')
  try{return JSON.parse(clean)}catch{
    const repair=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'x-api-key':apiKey,'anthropic-version':'2023-06-01','content-type':'application/json'},
      body:JSON.stringify({model:MODEL,max_tokens:2200,system:'Repair malformed/truncated JSON. Preserve intended content. Return JSON only.',messages:[{role:'user',content:clean || '{"error":"empty"}'}]})
    })
    if(!repair.ok) throw new Error('repair failed '+repair.status)
    const rd=await repair.json()
    const rt=Array.isArray(rd?.content)?rd.content.map((x:any)=>x?.type==='text'?x.text:'').join('').trim():''
    return JSON.parse(rt.replace(/^\x60\x60\x60(?:json)?\s*/i,'').replace(/\s*\x60\x60\x60$/i,''))
  }
}

function prompts(kind:CaseKind){
  if(kind==='flux') return {
    free:'Detect whether the data show a genuine regime change rather than noise. Return JSON only: {"change":true,"window":"Wn-Wm or NO_SHIFT","mechanism":"...","evidence":["..."],"confidence":0.0}.',
    generic:'Analyze temporal persistence, co-movement, causal commonality, and whether the generating process changed. Avoid calling ordinary variation a regime shift. Return JSON only: {"change":true,"window":"Wn-Wm or NO_SHIFT","mechanism":"...","evidence":["..."],"confidence":0.0}.',
    arbre:'Use this internal grammar: '+ARBRE_CORE+' Focus on whether dynamics structured through their topology produce a new system representation. Return JSON only: {"change":true,"window":"Wn-Wm or NO_SHIFT","mechanism":"...","evidence":["..."],"confidence":0.0}.'
  }
  if(kind==='agent') return {
    free:'Choose the best action under the stated objective and constraints. Update the world model only if the observations require it. Return JSON only: {"chosen_action":"ACTION_X","model_update":"...","reason":"...","failure_condition":"..."}.',
    generic:'Reason as a robust autonomous-agent planner: check geometry, timing, dynamics, rules, uncertainty, and deadline; prefer the simplest adequate world model. Return JSON only: {"chosen_action":"ACTION_X","model_update":"...","reason":"...","failure_condition":"..."}.',
    arbre:'Use this internal grammar: '+ARBRE_CORE+' Decide whether level 5 is enough or whether a new representation at 6 is required before acting. Return JSON only: {"chosen_action":"ACTION_X","model_update":"...","reason":"...","failure_condition":"..."}.'
  }
  return {
    free:'You are encoder AI #1. Compress the situation for a second AI that must choose the correct action. Preserve only decision-critical structure, maximum 120 words. Return JSON only: {"message":"..."}.',
    generic:'You are encoder AI #1. Compress the situation into actors/components, causal mechanism, constraints, uncertainty, and decision-relevant test, maximum 120 words. Return JSON only: {"message":"..."}.',
    arbre:'You are encoder AI #1. Use this internal grammar: '+ARBRE_CORE+' Transmit the minimum structure needed for another AI to reconstruct the situation and choose correctly, maximum 120 words. Do not mention level numbers. Return JSON only: {"message":"..."}.'
  }
}

async function decodeProtocol(message:string, input:string){
  const actions=input.match(/ACTION_[ABC][^;.]*/g)?.join('; ') || 'ACTION_A; ACTION_B; ACTION_C'
  return callClaude(
    'You are decoder AI #2. You receive ONLY a compressed message from another AI plus the allowed action labels. Choose the best action. Do not assume facts absent from the message. Return JSON only: {"chosen_action":"ACTION_X","reason":"max 90 words","confidence":0.0}.',
    'MESSAGE:\n'+message+'\n\nALLOWED:\n'+actions,
    900
  )
}

function perm(i:number){return [[0,1,2],[1,2,0],[2,0,1],[1,0,2],[2,1,0],[0,2,1]][i%6]}

async function judge(c:FrontierCase, outputs:Record<string,any>){
  return callClaude(
    'Blindly judge A/B/C. Do not reward jargon. Score 0-10 on correctness, structural_fidelity, parsimony, robustness, and usefulness. Use the reference as ground truth. Return JSON only with A/B/C each containing those five scores plus total arithmetic mean, winner A|B|C|tie, rationale max 100 words.',
    JSON.stringify({input:c.input,reference:c.reference,expected:c.expected,outputs},null,2),
    1400
  )
}

export async function GET(req:NextRequest){
  try{
    const idx=Math.max(0,Math.min(CASES.length-1,Math.trunc(Number(req.nextUrl.searchParams.get('case')||'0'))))
    const c=CASES[idx]
    const p=prompts(c.kind)
    const [a,b,d]=await Promise.all([
      callClaude(p.free,c.input),
      callClaude(p.generic,c.input),
      callClaude(p.arbre,c.input)
    ])
    let raw=[a,b,d]
    if(c.kind==='protocol'){
      raw=await Promise.all(raw.map(x=>decodeProtocol(String(x.message||''),c.input)))
    }
    const names:Arm[]=['free','generic','arbre']
    const order=perm(idx), labels=['A','B','C']
    const anonymized:Record<string,any>={}, mapping:Record<string,Arm>={}
    for(let i=0;i<3;i++){anonymized[labels[i]]=raw[order[i]];mapping[labels[i]]=names[order[i]]}
    const j=await judge(c,anonymized)
    const objective:Record<string,any>={}
    if(c.expected){
      for(const label of labels){
        const arm=mapping[label]
        const out=anonymized[label]
        if(c.kind==='flux'){
          const w=String(out.window||'').toUpperCase()
          objective[arm]={exact_or_acceptable:c.expected==='NO_SHIFT'?w.includes('NO_SHIFT'):w.includes('W10')||w.includes('W11')}
        } else {
          objective[arm]={correct_action:String(out.chosen_action||'')===c.expected}
        }
      }
    }
    return NextResponse.json({benchmark:'arbre-frontiers-v1',model:MODEL,case_index:idx,case_id:c.id,kind:c.kind,title:c.title,objective,blind_judge:j,revealed_mapping:mapping,outputs:anonymized})
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:'benchmark failed'},{status:500})
  }
}
