
import { NextRequest, NextResponse } from 'next/server'

type Arm='simple'|'blind7'|'arbre'
type CaseDef={
  id:string
  domain:string
  history:string[]
  final_state:string
  options:Record<string,string>
  correct:string
}

const MODEL=process.env.ANTHROPIC_BENCHMARK_MODEL||'claude-sonnet-5-5'
const WORDS=70

const BLIND7 = `
Use this FIXED transformation schema, discovered independently from other examples:
1 Observables O: directly measured current values.
2 Hidden state H: latent/internal variables needed to distinguish identical observables with different futures.
3 Rates/direction D: signed change and local direction.
4 Thresholds/regime map R: switching boundaries, hysteresis/asymmetry, reversibility.
5 Event log E: compressed ordered path-relevant events that changed H or R.
6 Drivers U: external inputs/controls.
7 Timescales/irreversibility T: decay/drain/recovery horizon and irreversibility.
Compress the history into at most 70 words using only these fields as needed. Preserve only decision-relevant structure. Return plain text only.
`

const ARBRE = `
Use this FIXED transformation grammar:
0 background; 1 distinguished agent/unit; 2 consequential polarity/difference; 3 force/dynamics; 4 direction/topology/context; 5 structure produced when dynamics operate through topology; 6 genuinely new representation of the situation; 7 organizing axis/orientation; 8 full conditional potential of that representation; 9 observation that remembers the path through 0→8 before the reached state becomes the next background 0.
Compress the history into at most 70 words, preserving only decision-relevant transformation structure. Return plain text only.
`

const SIMPLE = `
Compress the history into at most 70 words using only: prior state, changes/deltas, causes, interventions, and current state. Preserve only what is decision-relevant. Return plain text only.
`

const CASES:CaseDef[]=[
{
 id:'relay-hysteresis',
 domain:'control',
 history:[
  't1: room 19.0C, heater ON.',
  't2: room 20.4C, heater still ON.',
  't3: room reaches 21.0C; relay switches heater OFF.',
  't4: room cools to 20.4C; heater remains OFF.',
  't5: no external heat source; relay will switch ON only below 19.8C.'
 ],
 final_state:'NOW: room 20.4C.',
 options:{
  ACTION_A:'Predict immediate heating because 20.4C previously occurred while heater was ON.',
  ACTION_B:'Predict continued cooling until temperature crosses the lower relay threshold.',
  ACTION_C:'Predict temperature remains exactly constant.'
 },
 correct:'ACTION_B'
},
{
 id:'queue-backlog',
 domain:'operations',
 history:[
  't1: arrivals 80/min, service 100/min, queue near zero.',
  't2: a 10-minute burst raises arrivals to 140/min; backlog grows.',
  't3: arrivals return to 80/min but backlog is now 400.',
  't4: service remains 100/min; latency stays high while backlog drains.'
 ],
 final_state:'NOW: arrivals 80/min, service 100/min.',
 options:{
  ACTION_A:'Treat service as normal immediately because arrivals are below capacity.',
  ACTION_B:'Expect elevated latency temporarily while backlog drains.',
  ACTION_C:'Add permanent capacity because the system is necessarily overloaded.'
 },
 correct:'ACTION_B'
},
{
 id:'material-yield',
 domain:'physics',
 history:[
  't1: load rises to 60 units and strain follows elastic relation.',
  't2: unload returns strain nearly to zero.',
  't3: later load crosses yield threshold at 100 units and plastic deformation occurs.',
  't4: load returns to 60 units but residual strain remains.'
 ],
 final_state:'NOW: load is 60 units.',
 options:{
  ACTION_A:'Infer the material is in the same state as the earlier 60-unit condition.',
  ACTION_B:'Infer a changed material state with residual deformation after threshold crossing.',
  ACTION_C:'Infer complete structural failure.'
 },
 correct:'ACTION_B'
},
{
 id:'epidemic-same-count',
 domain:'epidemiology',
 history:[
  't1: cases 100/day and rising; Rt 1.3.',
  't2: cases reach 180/day; intervention starts.',
  't3: Rt falls below 1 to 0.8.',
  't4: cases decline back to 100/day.'
 ],
 final_state:'NOW: cases are 100/day.',
 options:{
  ACTION_A:'Assume renewed growth because 100/day previously preceded an increase.',
  ACTION_B:'Expect continued decline if Rt remains below 1.',
  ACTION_C:'Assume the trajectory is unknowable from the supplied history.'
 },
 correct:'ACTION_B'
},
{
 id:'battery-history',
 domain:'energy',
 history:[
  't1: battery at 3.8V after gentle charge, low internal resistance.',
  't2: repeated high-current cycles heat the cell and increase resistance.',
  't3: after rest, voltage returns to 3.8V but internal resistance remains elevated.',
  't4: under load voltage sags more than before at the same open-circuit voltage.'
 ],
 final_state:'NOW: open-circuit voltage is 3.8V.',
 options:{
  ACTION_A:'Treat available power capability as unchanged from t1.',
  ACTION_B:'Expect worse power delivery because path-dependent resistance increased.',
  ACTION_C:'Assume the battery is fully depleted.'
 },
 correct:'ACTION_B'
},
{
 id:'traffic-policy',
 domain:'transport',
 history:[
  't1: corridor carries 1000 veh/h with moderate congestion.',
  't2: road capacity is expanded; traffic rises over months as new trips appear.',
  't3: congestion returns to the earlier level despite higher capacity and higher traffic.',
  't4: a reversible lane closure would remove some added capacity but demand remains elevated.'
 ],
 final_state:'NOW: congestion level matches t1.',
 options:{
  ACTION_A:'Assume system state is effectively identical to t1.',
  ACTION_B:'Recognize induced demand changed the underlying state; lane removal may now have different effects.',
  ACTION_C:'Assume capacity expansion permanently eliminated congestion risk.'
 },
 correct:'ACTION_B'
},
{
 id:'software-retry',
 domain:'software',
 history:[
  't1: latency 120ms, retries rare.',
  't2: dependency errors trigger client retries.',
  't3: retry traffic amplifies load, causing more timeouts and more retries.',
  't4: base request rate returns to its old level but retry traffic remains elevated for several minutes.'
 ],
 final_state:'NOW: base request rate equals t1.',
 options:{
  ACTION_A:'Assume total load and latency should immediately match t1.',
  ACTION_B:'Treat retry amplification as a lingering internal state and damp retries/backoff.',
  ACTION_C:'Scale down capacity because base demand is normal.'
 },
 correct:'ACTION_B'
},
{
 id:'organization-metric',
 domain:'organization',
 history:[
  't1: meeting time 8h/week; coordination failures low.',
  't2: management cuts meetings to 4h/week to improve productivity.',
  't3: unresolved dependencies rise; staff create ad-hoc chats and extra bilateral calls.',
  't4: formal meeting time remains 4h/week but total coordination effort exceeds the old level.'
 ],
 final_state:'NOW: formal meeting time is 4h/week.',
 options:{
  ACTION_A:'Conclude coordination burden halved.',
  ACTION_B:'Treat coordination work as displaced rather than removed and redesign around dependency resolution.',
  ACTION_C:'Cut formal meetings to zero.'
 },
 correct:'ACTION_B'
},
{
 id:'river-levee',
 domain:'infrastructure',
 history:[
  't1: flood level 5m stays within banks.',
  't2: levee is raised; development expands behind it over years.',
  't3: exposure and asset concentration increase substantially.',
  't4: river again reaches 5m without overtopping.'
 ],
 final_state:'NOW: river level is 5m, same as t1.',
 options:{
  ACTION_A:'Assume risk is lower than t1 because the levee is higher.',
  ACTION_B:'Recognize consequence exposure changed; identical water level no longer implies identical system risk.',
  ACTION_C:'Assume no flood-related risk exists below overtopping.'
 },
 correct:'ACTION_B'
},
{
 id:'market-inventory',
 domain:'market-system',
 history:[
  't1: price 100, inventories normal, no supply shock.',
  't2: supply disruption drives price to 130 and inventories are drawn down.',
  't3: supply resumes and price falls back to 100, but inventories remain unusually low.',
  't4: demand stays normal.'
 ],
 final_state:'NOW: price is 100, same as t1.',
 options:{
  ACTION_A:'Treat market resilience as identical to t1.',
  ACTION_B:'Recognize the same price sits on a lower-inventory state with less buffer against a new shock.',
  ACTION_C:'Infer a new supply disruption is already occurring.'
 },
 correct:'ACTION_B'
}
]

async function callText(system:string,user:string,maxTokens=1300):Promise<string>{
 const key=process.env.ANTHROPIC_API_KEY||''; if(!key) throw new Error('ANTHROPIC_API_KEY missing')
 const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':key,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model:MODEL,max_tokens:maxTokens,system,messages:[{role:'user',content:user}]})})
 if(!r.ok) throw new Error('Anthropic '+r.status+': '+(await r.text()).slice(0,220))
 const d=await r.json(); return Array.isArray(d?.content)?d.content.map((x:any)=>x?.type==='text'?x.text:'').join('').trim():''
}
function cap(s:string,n:number){return String(s||'').trim().split(/\s+/).filter(Boolean).slice(0,n).join(' ')}
async function encode(arm:Arm,c:CaseDef){
 const sys=arm==='simple'?SIMPLE:arm==='blind7'?BLIND7:ARBRE
 return cap(await callText(sys,c.history.join('\n')),WORDS)
}
async function decide(memory:string,c:CaseDef){
 const t=await callText(
  'Choose the best action using ONLY the compressed memory and final state. Return exactly one token: ACTION_A, ACTION_B, or ACTION_C.',
  'MEMORY:\n'+memory+'\n\nFINAL STATE:\n'+c.final_state+'\n\nOPTIONS:\n'+Object.entries(c.options).map(([k,v])=>k+': '+v).join('\n'),
  220
 )
 const m=t.match(/ACTION_[ABC]/)
 return m?m[0]:'INVALID'
}

export async function GET(req:NextRequest){
 try{
  const idx=Math.max(0,Math.min(CASES.length-1,Math.trunc(Number(req.nextUrl.searchParams.get('case')||'0'))))
  const c=CASES[idx]
  const [sm,bm,am]=await Promise.all([encode('simple',c),encode('blind7',c),encode('arbre',c)])
  const [s,b,a]=await Promise.all([decide(sm,c),decide(bm,c),decide(am,c)])
  return NextResponse.json({
   benchmark:'blind-grammar-v1',case_index:idx,case_id:c.id,domain:c.domain,expected:c.correct,
   memories:{simple:sm,blind7:bm,arbre:am},
   result:{
    simple:{chosen:s,correct:s===c.correct},
    blind7:{chosen:b,correct:b===c.correct},
    arbre:{chosen:a,correct:a===c.correct}
   }
  })
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'failed'},{status:500})}
}
