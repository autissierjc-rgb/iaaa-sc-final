
import { NextRequest, NextResponse } from 'next/server'

type Arm='snapshot'|'generic_memory'|'arbre9_memory'
type SeqCase={
  id:string
  domain:string
  history:string[]
  final_state:string
  options:Record<string,string>
  correct:string
  path_key:string
}

const MODEL=process.env.ANTHROPIC_BENCHMARK_MODEL||'claude-sonnet-5-5'
const MEMORY_WORDS=80

const CASES:SeqCase[]=[
{
 id:'credit-path-unknown',
 domain:'finance-ai',
 history:[
  'T1: Credit model approves 62% of applicants. Training labels come only from approved loans; rejected applicants have no repayment outcomes.',
  'T2: Policy becomes stricter. Approval falls to 50%; overrides decrease; observed default among approved borrowers falls.',
  'T3: Approval falls to 41%. No randomized approvals or other reject-outcome study has been run.',
  'T4: Six months later approval remains 41%, approved-borrower default is 3.1%, and rejected applicants still have no observed repayment outcomes.'
 ],
 final_state:'NOW: approval 41%, approved-borrower default 3.1%, model stable, no operational incident.',
 options:{
  ACTION_A:'Keep the cutoff for now because the lower default rate validates it.',
  ACTION_B:'Run a bounded randomized approval sample near the cutoff before changing the policy further.',
  ACTION_C:'Lower the cutoff broadly until approval returns to 62%.'
 },
 correct:'ACTION_B',
 path_key:'The path never produced counterfactual outcomes for rejects, so the apparent improvement remains selectively observed.'
},
{
 id:'credit-path-tested',
 domain:'finance-ai',
 history:[
  'T1: Credit model approves 62% of applicants. Training labels initially come only from approved loans.',
  'T2: Policy becomes stricter. Approval falls to 50%; overrides decrease; observed default among approved borrowers falls.',
  'T3: The bank begins randomized approvals for 10% of applicants just below the cutoff and tracks them for six months.',
  'T4: Approval settles at 41%. Randomized near-cutoff applicants default at four times the approved rate, and calibration near the cutoff matches realized outcomes.'
 ],
 final_state:'NOW: approval 41%, approved-borrower default 3.1%, model stable, no operational incident.',
 options:{
  ACTION_A:'Keep the cutoff for now and continue monitoring/calibration checks.',
  ACTION_B:'Run a new randomized approval sample because outcomes below the cutoff are still completely unknown.',
  ACTION_C:'Lower the cutoff broadly until approval returns to 62%.'
 },
 correct:'ACTION_A',
 path_key:'The path contains an explicit counterfactual test that supports the current cutoff.'
},
{
 id:'corridor-periodic',
 domain:'robotics',
 history:[
  'T1: Hospital robot route A is normally 45 s; route B is 78 s.',
  'T2: At 09:00 a gurney convoy enters A from the east, fills the width for 22 s, then clears.',
  'T3: At 09:00:30 the same pattern repeats; staff require the robot to yield and back out if inside A.',
  'T4: At 09:01:00 the pattern repeats again. The corridor is empty immediately after each convoy.'
 ],
 final_state:'NOW 09:01:22: corridor A is empty and visually clear; corridor B is empty. Delivery deadline is 70 s from now.',
 options:{
  ACTION_A:'Enter corridor A immediately.',
  ACTION_B:'Take corridor B immediately.',
  ACTION_C:'Wait 25 s, then enter corridor A.'
 },
 correct:'ACTION_B',
 path_key:'The empty corridor is part of a 30-second periodic flow; another convoy is imminent, so the current snapshot is misleading.'
},
{
 id:'corridor-oneoff',
 domain:'robotics',
 history:[
  'T1: Hospital robot route A is normally 45 s; route B is 78 s.',
  'T2: At 09:00 a single gurney transfer blocks A for 22 s after an emergency call.',
  'T3: Staff report no scheduled convoy pattern and no further transfers; A remains clear for the next 60 s.',
  'T4: Multiple scans show no moving obstacles and no repeating blockage.'
 ],
 final_state:'NOW 09:01:22: corridor A is empty and visually clear; corridor B is empty. Delivery deadline is 70 s from now.',
 options:{
  ACTION_A:'Enter corridor A immediately.',
  ACTION_B:'Take corridor B immediately.',
  ACTION_C:'Wait 25 s, then enter corridor A.'
 },
 correct:'ACTION_A',
 path_key:'The prior blockage was a one-off event; the path does not imply recurring flow, so the static route model remains adequate.'
},
{
 id:'sensor-calibration-path',
 domain:'industrial-ai',
 history:[
  'T1: Predictive-maintenance alarm rate and confirmed failure rate are stable.',
  'T2: A vibration sensor model is replaced with a new unit using a different calibration range; no mechanical work is done.',
  'T3: Alarm rate jumps immediately after replacement. Cross-check inspection finds no rise in temperature, debris, or physical damage.',
  'T4: Alarm rate stays elevated while confirmed bearing failures remain at baseline.'
 ],
 final_state:'NOW: alarm rate is high and the vibration input distribution differs from the historical training distribution.',
 options:{
  ACTION_A:'Increase maintenance interventions because the machines are degrading.',
  ACTION_B:'Recalibrate/rebaseline the observation layer and validate the model against known machine states.',
  ACTION_C:'Retrain using recent alarms themselves as failure labels.'
 },
 correct:'ACTION_B',
 path_key:'The representation changed abruptly at sensor replacement while the physical process stayed stable.'
},
{
 id:'sensor-degradation-path',
 domain:'industrial-ai',
 history:[
  'T1: Predictive-maintenance alarm rate and confirmed failure rate are stable.',
  'T2: No sensor hardware or calibration changes occur. Vibration begins rising gradually on a subset of machines.',
  'T3: Independent temperature and metal-debris measures rise on the same machines; inspections find early bearing wear.',
  'T4: Alarm rate becomes high and confirmed bearing failures increase above baseline.'
 ],
 final_state:'NOW: alarm rate is high and the vibration input distribution differs from the historical training distribution.',
 options:{
  ACTION_A:'Increase maintenance on the affected machines and investigate the degradation source.',
  ACTION_B:'Recalibrate the unchanged sensors because the observation layer shifted.',
  ACTION_C:'Ignore the alarms because distribution shift makes them uninterpretable.'
 },
 correct:'ACTION_A',
 path_key:'Multiple independent signals and confirmed failures show a real process change, not an observation-layer change.'
},
{
 id:'supplier-common-path',
 domain:'supply-chain',
 history:[
  'T1: Three suppliers show unrelated minor delays and recover independently.',
  'T2: Component X lead time begins rising at suppliers A and C while component Y stays stable.',
  'T3: A and C cite upstream X allocation; one week later supplier B also cuts X confirmations.',
  'T4: All three now cite the same wafer source constraint; local freight incidents subside but X shortages persist.'
 ],
 final_state:'NOW: all three suppliers are late on X, X lead time is 30 days, Y is normal.',
 options:{
  ACTION_A:'Shift X orders among the three suppliers because their capacity is independent.',
  ACTION_B:'Treat X as a common upstream constraint and pursue true upstream alternatives, allocation, substitution, or redesign.',
  ACTION_C:'Focus on freight contracts because supplier lateness is the common symptom.'
 },
 correct:'ACTION_B',
 path_key:'The path converges from independent noise to common upstream dependence.'
},
{
 id:'supplier-independent-path',
 domain:'supply-chain',
 history:[
  'T1: Three suppliers show unrelated minor delays and recover independently.',
  'T2: Supplier A is hit by a port strike; B and C remain normal.',
  'T3: After A recovers, B has a factory fire; C remains normal. X and Y lead times at unaffected suppliers stay stable.',
  'T4: After B recovers, C has a customs documentation hold. Upstream sources are unrelated and there is no common component constraint.'
 ],
 final_state:'NOW: all three suppliers are late on X, X lead time is 30 days, Y is normal.',
 options:{
  ACTION_A:'Temporarily reallocate X orders across suppliers around the separate local disruptions.',
  ACTION_B:'Treat X as one common upstream bottleneck and redesign the component.',
  ACTION_C:'Assume supplier diversification has failed because all three are currently late.'
 },
 correct:'ACTION_A',
 path_key:'The same-looking final state was reached through independent rotating disruptions, not common-cause convergence.'
},
{
 id:'biology-induced-path',
 domain:'biology-research',
 history:[
  'T1: Cancer cell culture is highly sensitive to drug D.',
  'T2: After drug exposure, a small surviving population expands and culture sensitivity falls.',
  'T3: Drug is removed for 10 days; sensitivity substantially returns without replacing the culture.',
  'T4: Re-exposure rapidly recreates the resistant phenotype; end-point bulk sequencing finds no dominant new resistance mutation.'
 ],
 final_state:'NOW: under drug D the culture is again markedly resistant.',
 options:{
  ACTION_A:'Prioritize experiments on a reversible induced state and test state-transition blockers or drug-holiday dynamics.',
  ACTION_B:'Assume a fixed rare genetic clone is the sole mechanism and focus only on clone-specific mutations.',
  ACTION_C:'Treat the resistance as measurement noise because current cells are resistant.'
 },
 correct:'ACTION_A',
 path_key:'Resistance disappears off-drug and reappears on re-exposure, supporting a reversible induced state.'
},
{
 id:'biology-selected-path',
 domain:'biology-research',
 history:[
  'T1: Cancer cell culture is highly sensitive to drug D, with a very small pre-existing barcode-defined subpopulation.',
  'T2: After drug exposure, that barcode expands while most other barcodes disappear; culture sensitivity falls.',
  'T3: Drug is removed for 10 days; resistance remains stable.',
  'T4: Re-exposure shows the same dominant barcode; sequencing finds a stable resistance-associated mutation in that lineage.'
 ],
 final_state:'NOW: under drug D the culture is again markedly resistant.',
 options:{
  ACTION_A:'Prioritize a reversible induced-state model and expect sensitivity to recover off-drug.',
  ACTION_B:'Prioritize selection of a stable pre-existing resistant clone and target/track that lineage.',
  ACTION_C:'Treat the resistance as measurement noise because current cells are resistant.'
 },
 correct:'ACTION_B',
 path_key:'Stable lineage persistence off-drug plus barcode and mutation evidence support clonal selection.'
},
{
 id:'callcenter-metric-path',
 domain:'service-operations',
 history:[
  'T1: Customer count and issue mix are stable; first-call resolution is stable.',
  'T2: Management introduces a strict average-handling-time target.',
  'T3: Handling time falls 12%; first-call resolution falls and repeat contacts rise.',
  'T4: Total incoming call volume rises despite unchanged customer count and issue mix.'
 ],
 final_state:'NOW: call volume is high, average handling time is low, staffing is unchanged.',
 options:{
  ACTION_A:'Optimize resolved customer episodes including repeat calls rather than single-call duration.',
  ACTION_B:'Tighten handling-time targets further because calls are shorter.',
  ACTION_C:'Attribute the higher volume to customer growth.'
 },
 correct:'ACTION_A',
 path_key:'The path shows local speed optimization displacing work into repeat contacts.'
},
{
 id:'callcenter-demand-path',
 domain:'service-operations',
 history:[
  'T1: Average handling time and first-call resolution are stable.',
  'T2: A major product launch doubles the active customer base over six weeks; issue mix is unchanged.',
  'T3: Handling time falls modestly after agents gain experience; first-call resolution remains stable.',
  'T4: Total incoming call volume rises roughly in proportion to the larger customer base; repeat-contact rate remains stable.'
 ],
 final_state:'NOW: call volume is high, average handling time is low, staffing is unchanged.',
 options:{
  ACTION_A:'Redesign the metric around repeat contacts because shorter calls are creating demand.',
  ACTION_B:'Address capacity for the larger customer base while retaining the current resolution controls.',
  ACTION_C:'Tighten handling-time targets further as the sole response.'
 },
 correct:'ACTION_B',
 path_key:'The high-volume state was produced by customer-base growth, not displaced unresolved work.'
}
]

function parseOneJson(raw:string):any{
 const clean=String(raw||'').replace(/^\x60\x60\x60(?:json)?\s*/i,'').replace(/\s*\x60\x60\x60$/i,'').trim()
 try{return JSON.parse(clean)}catch{}
 let start=clean.indexOf('{')
 if(start<0) throw new Error('No JSON object found')
 let depth=0,inString=false,escape=false
 for(let i=start;i<clean.length;i++){
   const ch=clean[i]
   if(inString){
     if(escape){escape=false;continue}
     if(ch==='\\\\'){escape=true;continue}
     if(ch==='"')inString=false
     continue
   }
   if(ch==='"'){inString=true;continue}
   if(ch==='{')depth++
   if(ch==='}'){depth--;if(depth===0)return JSON.parse(clean.slice(start,i+1))}
 }
 throw new Error('Incomplete JSON object')
}

async function callClaude(system:string,user:string,maxTokens=1000):Promise<any>{
 const key=process.env.ANTHROPIC_API_KEY||''; if(!key) throw new Error('ANTHROPIC_API_KEY missing')
 const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':key,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model:MODEL,max_tokens:maxTokens,system,messages:[{role:'user',content:user}]})})
 if(!r.ok) throw new Error('Anthropic '+r.status+': '+(await r.text()).slice(0,240))
 const d=await r.json(); const t=Array.isArray(d?.content)?d.content.map((x:any)=>x?.type==='text'?x.text:'').join('').trim():''
 try{return parseOneJson(t)}catch{
  const rr=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':key,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model:MODEL,max_tokens:1200,system:'Return exactly ONE valid JSON object and nothing else. Repair malformed JSON while preserving content.',messages:[{role:'user',content:t||'{}'}]})})
  const x=await rr.json(); const q=Array.isArray(x?.content)?x.content.map((y:any)=>y?.type==='text'?y.text:'').join('').trim():''
  return parseOneJson(q)
 }
}
function cap(s:string,n:number){return String(s||'').trim().split(/\s+/).filter(Boolean).slice(0,n).join(' ')}
async function callClaudeText(system:string,user:string,maxTokens=650):Promise<string>{
 const key=process.env.ANTHROPIC_API_KEY||''; if(!key) throw new Error('ANTHROPIC_API_KEY missing')
 const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':key,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model:MODEL,max_tokens:maxTokens,system,messages:[{role:'user',content:user}]})})
 if(!r.ok) throw new Error('Anthropic '+r.status+': '+(await r.text()).slice(0,240))
 const d=await r.json()
 return Array.isArray(d?.content)?d.content.map((x:any)=>x?.type==='text'?x.text:'').join('').trim():''
}

const GENERIC_UPDATER='Maintain a rolling memory of the HISTORY for a later decision. Preserve temporal order, causal links, interventions, reversals, tests, and facts that distinguish competing explanations. Do not recommend an action. Keep at most 80 words. Return ONLY the memory text, no JSON and no preamble.'

const ARBRE9_UPDATER='You are point 9: the observer-memory after a completed transformation path. Do not redo or critique the path. Remember how the system arrived from its prior background to its present state before that present becomes the next background 0. Preserve the decisive sequence: what changed, the relevant force/dynamic, the field or direction through which it acted, the structure that formed, and any change of representation/orientation that followed. Preserve reversals and tests. Never rewrite history as if the latest state had always existed. Do not recommend an action. At most 80 words. Return ONLY the memory text, no preamble.'

async function updateMemory(kind:'generic'|'arbre9',previous:string,obs:string){
 const sys=kind==='generic'?GENERIC_UPDATER:ARBRE9_UPDATER
 const user='PREVIOUS MEMORY:\n'+(previous||'[none]')+'\n\nNEW OBSERVATION:\n'+obs
 let mem=cap(await callClaudeText(sys,user,3000),MEMORY_WORDS)
 if(!mem) mem=cap(await callClaudeText(sys+' You MUST return a non-empty memory.',user,4000),MEMORY_WORDS)
 if(!mem) throw new Error('empty '+kind+' memory')
 return mem
}
async function decide(memory:string,finalState:string,options:Record<string,string>){
 const sys='Choose the best next action using ONLY the supplied current state and memory. Historical path can matter even when current snapshots match. Return JSON only: {"chosen_action":"ACTION_A|ACTION_B|ACTION_C","confidence":0.0,"reason":"max 60 words"}.'
 const user='MEMORY:\n'+(memory||'[no history retained]')+'\n\nCURRENT STATE:\n'+finalState+'\n\nOPTIONS:\n'+Object.entries(options).map(([k,v])=>k+': '+v).join('\n')
 let x=await callClaude(sys,user,650)
 if(!['ACTION_A','ACTION_B','ACTION_C'].includes(String(x?.chosen_action||''))){
   x=await callClaude(sys+' IMPORTANT: chosen_action is mandatory and must be exactly one of ACTION_A, ACTION_B, ACTION_C.',user,750)
 }
 if(!['ACTION_A','ACTION_B','ACTION_C'].includes(String(x?.chosen_action||''))) throw new Error('decoder omitted action')
 return x
}

export async function GET(req:NextRequest){
 try{
  const idx=Math.max(0,Math.min(CASES.length-1,Math.trunc(Number(req.nextUrl.searchParams.get('case')||'0'))))
  const c=CASES[idx]
  let gm='',am=''
  for(const obs of c.history){
    const [g,a]=await Promise.all([updateMemory('generic',gm,obs),updateMemory('arbre9',am,obs)])
    gm=g; am=a
  }
  const [s,g,a]=await Promise.all([
    decide('',c.final_state,c.options),
    decide(gm,c.final_state,c.options),
    decide(am,c.final_state,c.options)
  ])
  return NextResponse.json({
    benchmark:'arbre-cycle-memory-v1',
    model:MODEL,
    case_index:idx,
    case_id:c.id,
    domain:c.domain,
    expected:c.correct,
    path_key:c.path_key,
    memories:{generic:gm,arbre9:am},
    result:{
      snapshot:{chosen:s.chosen_action,correct:s.chosen_action===c.correct,confidence:s.confidence},
      generic_memory:{chosen:g.chosen_action,correct:g.chosen_action===c.correct,confidence:g.confidence},
      arbre9_memory:{chosen:a.chosen_action,correct:a.chosen_action===c.correct,confidence:a.confidence}
    }
  })
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'failed'},{status:500})}
}
