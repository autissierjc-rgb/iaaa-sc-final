
import { NextRequest, NextResponse } from 'next/server'

type Arm='generic'|'arbre9'
type LongCase={
  id:string
  domain:string
  variant:'A'|'B'
  final_state:string
  options:Record<string,string>
  correct:string
  path_key:string
  events:string[]
}

const MODEL=process.env.ANTHROPIC_BENCHMARK_MODEL||'claude-sonnet-5-5'
const MEMORY_WORDS=80
const CHUNK=10

function noise(i:number,domain:string){
  const templates=[
    `E${i}: routine audit in ${domain}; no material structural change.`,
    `E${i}: minor local fluctuation recorded; it reverses within one interval.`,
    `E${i}: staffing and budget remain within normal range; no intervention.`,
    `E${i}: dashboard variation remains inside historical bounds.`,
    `E${i}: unrelated administrative update; no causal link to the focal mechanism.`,
    `E${i}: one-off operational disturbance resolves without persistence.`,
  ]
  return templates[i%templates.length]
}
function fill100(domain:string, anchors:Record<number,string>){
  const out:string[]=[]
  for(let i=1;i<=100;i++) out.push(anchors[i]||noise(i,domain))
  return out
}

const CASES:LongCase[]=[
{
 id:'credit-no-counterfactual',domain:'finance-ai',variant:'A',
 final_state:'NOW: approval 41%, approved-borrower default 3.1%, model stable, no operational incident.',
 options:{
  ACTION_A:'Keep the cutoff because the lower observed default validates the stricter policy.',
  ACTION_B:'Run a bounded randomized near-cutoff approval sample before further policy change.',
  ACTION_C:'Lower the cutoff broadly to restore the old approval rate.'
 },
 correct:'ACTION_B',
 path_key:'Across the whole history the model never observed reject outcomes; falling observed defaults remain selectively sampled.',
 events:fill100('finance-ai',{
  1:'E1: Baseline approval 62%; repayment labels exist only for approved loans.',
  8:'E8: Policy is tightened; approval falls to 54%, manual overrides fall.',
  17:'E17: Approval falls to 48%; observed default among approved borrowers declines.',
  26:'E26: Internal review notes rejected applicants still have no repayment outcomes.',
  39:'E39: Approval reaches 43%; no randomized approvals have been run.',
  50:'E50: Quarter closes; approved-borrower default falls again, but only approved borrowers are observed.',
  61:'E61: Risk committee asks whether reject inference is possible; answer: no external outcome source exists.',
  72:'E72: Approval stabilizes at 41%.',
  83:'E83: A proposal for randomized near-cutoff approvals is discussed but not implemented.',
  94:'E94: Six months of stable 41% approval; rejected applicants remain unobserved.',
  100:'E100: Current approved-borrower default is 3.1%; model and cutoff unchanged.'
 })
},
{
 id:'credit-counterfactual-validated',domain:'finance-ai',variant:'B',
 final_state:'NOW: approval 41%, approved-borrower default 3.1%, model stable, no operational incident.',
 options:{
  ACTION_A:'Keep the cutoff for now and continue monitoring/calibration checks.',
  ACTION_B:'Run a new randomized near-cutoff sample because outcomes below the cutoff remain completely unknown.',
  ACTION_C:'Lower the cutoff broadly to restore the old approval rate.'
 },
 correct:'ACTION_A',
 path_key:'An early randomized near-cutoff cohort created counterfactual evidence and later follow-up repeatedly confirmed calibration.',
 events:fill100('finance-ai',{
  1:'E1: Baseline approval 62%; repayment labels initially exist only for approved loans.',
  8:'E8: Policy is tightened; approval falls to 54%, manual overrides fall.',
  17:'E17: Approval falls to 48%; observed default among approved borrowers declines.',
  26:'E26: Bank starts randomized approvals for 10% of applicants just below the cutoff.',
  39:'E39: First randomized cohort matures; near-cutoff randomized borrowers default about four times the approved rate.',
  50:'E50: Second cohort confirms similar excess default below the cutoff.',
  61:'E61: Calibration audit compares predicted and realized risk near the cutoff and finds close agreement.',
  72:'E72: Approval stabilizes at 41%.',
  83:'E83: Third follow-up again supports the same cutoff ranking; no material calibration drift.',
  94:'E94: Six months of counterfactual evidence now exist for the near-cutoff region.',
  100:'E100: Current approved-borrower default is 3.1%; model and cutoff unchanged.'
 })
},
{
 id:'sensor-representation-change',domain:'industrial-ai',variant:'A',
 final_state:'NOW: alarm rate is high and vibration input distribution differs from the historical training distribution.',
 options:{
  ACTION_A:'Increase maintenance because the machines are physically degrading.',
  ACTION_B:'Recalibrate/rebaseline the observation layer and validate against known machine states.',
  ACTION_C:'Retrain using recent alarms themselves as failure labels.'
 },
 correct:'ACTION_B',
 path_key:'The path repeatedly ties the shift to sensor replacement while independent physical indicators and failures stay flat.',
 events:fill100('industrial-ai',{
  1:'E1: Alarm rate, vibration distribution and confirmed failure rate are stable.',
  12:'E12: Sensor model is replaced with a unit using a different calibration range; no mechanical work is done.',
  13:'E13: Alarm rate jumps immediately after sensor replacement.',
  21:'E21: Cross-check temperature and metal-debris measures remain at baseline.',
  35:'E35: Physical inspections show no increase in bearing wear.',
  47:'E47: Vibration values remain shifted in scale but rank machines similarly to before.',
  59:'E59: Confirmed failure rate remains unchanged despite persistent extra alarms.',
  71:'E71: Bench test maps old and new sensor readings and finds a calibration offset.',
  84:'E84: No mechanical intervention changes the alarm pattern; sensor-side normalization does in a small test.',
  96:'E96: Failure rate still baseline; alarm rate still high without rebaseline.',
  100:'E100: Input distribution remains shifted relative to historical training data.'
 })
},
{
 id:'sensor-real-degradation',domain:'industrial-ai',variant:'B',
 final_state:'NOW: alarm rate is high and vibration input distribution differs from the historical training distribution.',
 options:{
  ACTION_A:'Increase maintenance on affected machines and investigate the degradation source.',
  ACTION_B:'Recalibrate the unchanged observation layer because the sensor distribution shifted.',
  ACTION_C:'Retrain using recent alarms themselves as failure labels.'
 },
 correct:'ACTION_A',
 path_key:'No observation-layer change occurred; independent physical signals and confirmed failures rose together over time.',
 events:fill100('industrial-ai',{
  1:'E1: Alarm rate, vibration distribution and confirmed failure rate are stable.',
  12:'E12: No sensor hardware, firmware or calibration change is recorded.',
  20:'E20: Vibration begins a gradual rise on a subset of machines.',
  32:'E32: Temperature begins rising on the same machines.',
  44:'E44: Oil analysis finds increasing metal debris on the same subset.',
  56:'E56: Inspection confirms early bearing wear where vibration is highest.',
  68:'E68: First confirmed bearing failures occur above baseline.',
  80:'E80: Cross-check sensors independently agree on the elevated vibration pattern.',
  91:'E91: Failure rate continues above baseline; no calibration event is found in maintenance logs.',
  97:'E97: Replacing one affected bearing normalizes all three physical signals on that machine.',
  100:'E100: Alarm rate remains high on the still-affected machines.'
 })
},
{
 id:'biology-reversible-state',domain:'biology-research',variant:'A',
 final_state:'NOW: culture is again markedly resistant while exposed to drug D.',
 options:{
  ACTION_A:'Prioritize a reversible induced-state mechanism and test state-transition blockers or drug-holiday dynamics.',
  ACTION_B:'Assume a fixed rare clone is the sole mechanism and focus only on stable resistance mutations.',
  ACTION_C:'Treat resistance as measurement noise.'
 },
 correct:'ACTION_A',
 path_key:'Repeated on-drug/off-drug cycles show resistance appearing, receding, and reappearing without a stable dominant resistant lineage.',
 events:fill100('biology-research',{
  1:'E1: Culture is highly sensitive to drug D.',
  10:'E10: Drug exposure kills most cells; a surviving fraction expands and resistance rises.',
  22:'E22: Drug is removed; sensitivity begins returning in the same culture.',
  31:'E31: After ten drug-free days, sensitivity is largely restored.',
  40:'E40: Re-exposure rapidly recreates the resistant phenotype.',
  52:'E52: Bulk sequencing finds no dominant stable resistance mutation.',
  63:'E63: Second drug holiday again restores substantial sensitivity.',
  74:'E74: Third exposure again induces resistance within days.',
  85:'E85: Barcode frequencies fluctuate but no single lineage remains dominant across holidays.',
  95:'E95: Expression profiling repeatedly shows the same reversible stress-state program on drug.',
  100:'E100: Under drug D the culture is markedly resistant again.'
 })
},
{
 id:'biology-stable-clone',domain:'biology-research',variant:'B',
 final_state:'NOW: culture is again markedly resistant while exposed to drug D.',
 options:{
  ACTION_A:'Prioritize a reversible induced-state mechanism and expect drug holidays to restore sensitivity.',
  ACTION_B:'Prioritize selection of a stable pre-existing resistant clone and target/track that lineage.',
  ACTION_C:'Treat resistance as measurement noise.'
 },
 correct:'ACTION_B',
 path_key:'A pre-existing barcode expands, stays dominant off drug, carries a stable mutation, and resistance persists through holidays.',
 events:fill100('biology-research',{
  1:'E1: Culture is highly sensitive to drug D; a very small barcode-defined subpopulation is present.',
  10:'E10: Drug exposure kills most cells; that pre-existing barcode expands disproportionately.',
  22:'E22: Drug is removed; the dominant barcode persists.',
  31:'E31: After ten drug-free days, resistance remains high.',
  40:'E40: Re-exposure shows the same lineage dominating immediately.',
  52:'E52: Sequencing finds a stable resistance-associated mutation in that lineage.',
  63:'E63: Second drug holiday does not restore sensitivity.',
  74:'E74: The same barcode remains dominant through another exposure cycle.',
  85:'E85: Clone-isolation assay shows descendants retain resistance without continuous drug.',
  95:'E95: The resistance-associated mutation remains fixed in the dominant lineage.',
  100:'E100: Under drug D the culture is markedly resistant again.'
 })
},
{
 id:'supply-common-cause',domain:'supply-chain',variant:'A',
 final_state:'NOW: all three suppliers are late on component X; X lead time is 30 days and component Y is normal.',
 options:{
  ACTION_A:'Shift X orders among the three suppliers because their capacity is independent.',
  ACTION_B:'Treat X as a common upstream constraint and pursue true upstream alternatives, allocation, substitution or redesign.',
  ACTION_C:'Focus on freight contracts because lateness is the common symptom.'
 },
 correct:'ACTION_B',
 path_key:'The history changes from independent incidents to synchronized X-specific failures that converge on one upstream wafer source.',
 events:fill100('supply-chain',{
  1:'E1: Three suppliers have unrelated small local delays and recover independently.',
  15:'E15: Component X lead time rises at supplier A while Y stays normal.',
  24:'E24: Supplier C also reports X-specific allocation pressure.',
  36:'E36: A and C identify upstream wafer allocation as the reason.',
  48:'E48: Supplier B begins cutting X confirmations despite normal local logistics.',
  60:'E60: All three suppliers now cite the same wafer source constraint.',
  71:'E71: Local freight disruptions fall, but X shortages persist at all three.',
  82:'E82: Alternate ordering among A/B/C fails to improve X availability.',
  92:'E92: A direct upstream inquiry confirms shared dependence on one wafer family.',
  97:'E97: Component Y remains normal at all suppliers.',
  100:'E100: X lead time is 30 days at all three suppliers.'
 })
},
{
 id:'supply-independent',domain:'supply-chain',variant:'B',
 final_state:'NOW: all three suppliers are late on component X; X lead time is 30 days and component Y is normal.',
 options:{
  ACTION_A:'Temporarily reallocate X orders across suppliers around the separate local disruptions.',
  ACTION_B:'Treat X as one common upstream bottleneck and redesign the component.',
  ACTION_C:'Assume supplier diversification has failed because all three are currently late.'
 },
 correct:'ACTION_A',
 path_key:'The same final snapshot is reached by overlapping but causally separate disruptions with unrelated upstream sources and asynchronous recovery.',
 events:fill100('supply-chain',{
  1:'E1: Three suppliers have unrelated small local delays and recover independently.',
  15:'E15: Supplier A suffers a port strike; B and C remain normal.',
  24:'E24: A begins recovering; supplier B suffers a factory fire.',
  36:'E36: B remains constrained; supplier C has a customs documentation hold.',
  48:'E48: X sources for A, B and C are confirmed to be from unrelated upstream manufacturers.',
  60:'E60: No common X allocation notice exists; each supplier gives a different local root cause.',
  71:'E71: A recovers while B remains slow and C worsens.',
  82:'E82: Temporary order shifts to A successfully cover part of B/C shortfall.',
  92:'E92: B recovers as A encounters a new local carrier shortage.',
  97:'E97: Component Y remains normal because current disruptions happen to affect X logistics lanes.',
  100:'E100: Overlapping local problems leave all three late on X at this moment.'
 })
}
]

async function callClaudeText(system:string,user:string,maxTokens=1800):Promise<string>{
 const key=process.env.ANTHROPIC_API_KEY||''; if(!key) throw new Error('ANTHROPIC_API_KEY missing')
 const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':key,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model:MODEL,max_tokens:maxTokens,system,messages:[{role:'user',content:user}]})})
 if(!r.ok) throw new Error('Anthropic '+r.status+': '+(await r.text()).slice(0,220))
 const d=await r.json(); return Array.isArray(d?.content)?d.content.map((x:any)=>x?.type==='text'?x.text:'').join('').trim():''
}
async function callClaudeJson(system:string,user:string,maxTokens=800):Promise<any>{
 const t=await callClaudeText(system,user,maxTokens)
 const clean=t.replace(/^\x60\x60\x60(?:json)?\s*/i,'').replace(/\s*\x60\x60\x60$/i,'').trim()
 try{return JSON.parse(clean)}catch{
  const s=clean.indexOf('{'),e=clean.lastIndexOf('}')
  if(s>=0&&e>s)return JSON.parse(clean.slice(s,e+1))
  throw new Error('invalid decoder json')
 }
}
function cap(s:string,n:number){return String(s||'').trim().split(/\s+/).filter(Boolean).slice(0,n).join(' ')}

const GENERIC='Maintain an 80-word rolling memory for a later decision. Compress the supplied history chunk together with prior memory. Preserve temporal order, causal links, interventions, reversals, tests, and facts that discriminate competing explanations. Forget routine noise. Do not recommend an action. Return only memory text.'
const ARBRE9='Maintain an 80-word point-9 memory of how the system travelled from prior background to its current background. Preserve what dynamics changed, in what context/topology, what structure emerged, whether the representation of the situation changed, what direction followed, and what state was reached. Point 9 remembers the transformation before the reached state becomes the next background. Preserve reversals/tests that changed interpretation. Forget routine noise. Do not recommend an action. Return only memory text.'

async function update(arm:Arm,prev:string,chunk:string[]){
 const sys=arm==='generic'?GENERIC:ARBRE9
 let out=cap(await callClaudeText(sys,'PRIOR MEMORY:\n'+(prev||'[none]')+'\n\nNEXT 10 EVENTS:\n'+chunk.join('\n'),1800),MEMORY_WORDS)
 if(!out) out=cap(await callClaudeText(sys+' You MUST return non-empty memory text.','PRIOR MEMORY:\n'+(prev||'[none]')+'\n\nNEXT 10 EVENTS:\n'+chunk.join('\n'),2200),MEMORY_WORDS)
 if(!out) throw new Error('empty '+arm+' memory')
 return out
}
async function decide(memory:string,finalState:string,options:Record<string,string>,fullHistory?:string[]){
 const sys='Choose the best action. Historical path can matter even when final snapshots match. Use only supplied information. JSON only: {"chosen_action":"ACTION_A|ACTION_B|ACTION_C","confidence":0.0}.'
 const hist=fullHistory?'FULL HISTORY:\n'+fullHistory.join('\n'):'MEMORY:\n'+memory
 return callClaudeJson(sys,hist+'\n\nCURRENT STATE:\n'+finalState+'\n\nOPTIONS:\n'+Object.entries(options).map(([k,v])=>k+': '+v).join('\n'),800)
}

export async function GET(req:NextRequest){
 try{
  const idx=Math.max(0,Math.min(CASES.length-1,Math.trunc(Number(req.nextUrl.searchParams.get('case')||'0'))))
  const c=CASES[idx]
  let gm='',am=''
  for(let i=0;i<c.events.length;i+=CHUNK){
    const chunk=c.events.slice(i,i+CHUNK)
    const [g,a]=await Promise.all([update('generic',gm,chunk),update('arbre9',am,chunk)])
    gm=g;am=a
  }
  const [snap,gdec,adec,full]=await Promise.all([
    decide('',c.final_state,c.options),
    decide(gm,c.final_state,c.options),
    decide(am,c.final_state,c.options),
    decide('',c.final_state,c.options,c.events)
  ])
  const mk=(x:any)=>({chosen:x.chosen_action,correct:x.chosen_action===c.correct,confidence:x.confidence})
  return NextResponse.json({
    benchmark:'arbre-long-memory-100-v1',
    events:c.events.length,
    chunks:c.events.length/CHUNK,
    memory_words:MEMORY_WORDS,
    case_index:idx,case_id:c.id,domain:c.domain,variant:c.variant,expected:c.correct,path_key:c.path_key,
    memories:{generic:gm,arbre9:am},
    result:{snapshot:mk(snap),generic_memory:mk(gdec),arbre9_memory:mk(adec),full_history:mk(full)}
  })
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'failed'},{status:500})}
}
