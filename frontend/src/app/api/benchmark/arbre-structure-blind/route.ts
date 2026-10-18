
import { NextRequest, NextResponse } from 'next/server'

type Arm='generic'|'blind'|'arbre'
type TCase={id:string;domain:string;history:string[];final_state:string;options:Record<string,string>;correct:string;key:string}
const MODEL=process.env.ANTHROPIC_BENCHMARK_MODEL||'claude-sonnet-5-5'
const WORDS=60

const CASES:TCase[]=[
{
 id:'battery-surface-charge',domain:'battery',
 history:[
 'T1: Cell pack rests at 12.6 V after a normal overnight charge; capacity test is normal.',
 'T2: Vehicle alternator briefly overcharges the pack; terminal voltage rises unusually high.',
 'T3: Charging stops. Voltage rapidly falls toward 12.3 V over 40 minutes.',
 'T4: A load pulse causes a larger-than-normal voltage sag, but after rest the terminal returns to 12.3 V.',
 'T5: A second rest interval shows continuing decay of the elevated surface voltage; no heat or swelling is observed.',
 'T6: Coulomb count indicates state of charge is materially lower than the open-circuit voltage alone suggests.'
 ],
 final_state:'NOW: pack terminal voltage is 12.3 V, temperature normal.',
 options:{
  ACTION_A:'Treat 12.3 V as a reliable normal resting-state indicator and return to service immediately.',
  ACTION_B:'Allow full relaxation and verify state of charge/capacity before relying on the voltage reading.',
  ACTION_C:'Replace the pack immediately for confirmed irreversible capacity loss.'
 }, correct:'ACTION_B',
 key:'Same voltage is contaminated by recent overcharge/surface-charge relaxation; path matters before interpreting OCV.'
},
{
 id:'battery-degraded',domain:'battery',
 history:[
 'T1: Cell pack rests at 12.6 V after charge, but measured usable capacity is 68% of nominal.',
 'T2: Over several weeks internal resistance rises steadily; no charger anomaly occurs.',
 'T3: Under normal loads voltage sag progressively worsens.',
 'T4: After long rest the pack repeatedly settles near 12.3 V.',
 'T5: Capacity test remains about 68%; resistance remains high after full relaxation.',
 'T6: Cell imbalance recurs after balancing and no transient charging artifact is present.'
 ],
 final_state:'NOW: pack terminal voltage is 12.3 V, temperature normal.',
 options:{
  ACTION_A:'Treat 12.3 V as a transient surface-charge artifact and simply wait.',
  ACTION_B:'Return to service because resting voltage is normal.',
  ACTION_C:'Treat the pack as degraded and schedule replacement/derating based on capacity and resistance.'
 }, correct:'ACTION_C',
 key:'Same voltage reflects persistent degraded hidden state, not transient surface charge.'
},
{
 id:'server-retry-storm',domain:'distributed-systems',
 history:[
 'T1: Service handles 8k requests/s at 45% CPU and low latency.',
 'T2: A downstream timeout lasts 20 seconds; client retry policy triggers duplicate attempts.',
 'T3: Original demand returns to baseline, but retry queues continue feeding duplicates.',
 'T4: CPU rises to 78%, latency rises, and request count appears high despite unchanged unique-user demand.',
 'T5: Temporarily suppressing retries causes CPU and latency to fall sharply.',
 'T6: Retries are re-enabled without changing user demand; load rises again.'
 ],
 final_state:'NOW: CPU 78%, aggregate request rate 13k/s, latency elevated.',
 options:{
  ACTION_A:'Add permanent compute capacity because genuine user demand has structurally risen.',
  ACTION_B:'Break the retry-feedback loop and drain duplicate/backlog work before sizing capacity.',
  ACTION_C:'Reduce observability sampling because telemetry itself is causing the load.'
 }, correct:'ACTION_B',
 key:'Current load is maintained by feedback/retries seeded by an earlier timeout, not unique demand.'
},
{
 id:'server-real-demand',domain:'distributed-systems',
 history:[
 'T1: Service handles 8k requests/s at 45% CPU and low latency.',
 'T2: A product launch starts; unique authenticated users rise steadily.',
 'T3: Request growth tracks unique sessions; retry rate remains unchanged.',
 'T4: CPU reaches 70%, then 78%; latency rises as utilization approaches capacity.',
 'T5: Disabling retries has negligible effect on total load.',
 'T6: Independent edge logs confirm 13k/s unique legitimate requests with sustained growth.'
 ],
 final_state:'NOW: CPU 78%, aggregate request rate 13k/s, latency elevated.',
 options:{
  ACTION_A:'Scale capacity and/or shed legitimate load because underlying demand has increased.',
  ACTION_B:'Break a retry-feedback loop because duplicates are sustaining load.',
  ACTION_C:'Wait for backlog to drain because arrivals have returned to baseline.'
 }, correct:'ACTION_A',
 key:'Same snapshot comes from sustained exogenous demand growth, independently verified.'
},
{
 id:'greenhouse-waterlogged',domain:'agriculture-control',
 history:[
 'T1: Root-zone moisture is normal and drainage responds quickly after irrigation.',
 'T2: Drain outlet becomes partially blocked after sediment ingress.',
 'T3: Irrigation pulse raises moisture; drainage becomes much slower than before.',
 'T4: Irrigation is reduced, yet root-zone oxygen falls and moisture remains elevated for longer.',
 'T5: Outlet clearing trial briefly restores drainage rate and root oxygen improves.',
 'T6: Sediment shifts back and drainage slows again.'
 ],
 final_state:'NOW: moisture sensor reads 42%, leaves show mild stress.',
 options:{
  ACTION_A:'Increase irrigation because stressed leaves imply water deficit.',
  ACTION_B:'Reduce/stop irrigation temporarily and restore drainage/root aeration.',
  ACTION_C:'Ignore root-zone conditions and increase fertilizer concentration.'
 }, correct:'ACTION_B',
 key:'42% occurs in a waterlogged, low-oxygen state caused by impaired drainage.'
},
{
 id:'greenhouse-dry',domain:'agriculture-control',
 history:[
 'T1: Root-zone moisture is normal and drainage is unobstructed.',
 'T2: Irrigation pump output gradually falls because of filter fouling.',
 'T3: Commanded irrigation stays constant but delivered volume declines.',
 'T4: Moisture trends downward and root-zone oxygen remains normal/high.',
 'T5: Manual measured water delivery confirms under-delivery; drainage remains fast.',
 'T6: Brief supplemental irrigation raises moisture and leaf turgor improves.'
 ],
 final_state:'NOW: moisture sensor reads 42%, leaves show mild stress.',
 options:{
  ACTION_A:'Restore irrigation delivery / clean filter because the root zone is under-watered.',
  ACTION_B:'Stop irrigation and open drainage because roots are waterlogged.',
  ACTION_C:'Ignore water delivery and increase fertilizer concentration.'
 }, correct:'ACTION_A',
 key:'Same moisture reading sits on a drying trajectory with verified irrigation under-delivery.'
},
{
 id:'robot-periodic-crossing',domain:'robotics',
 history:[
 'T1: Robot corridor A is normally fastest; corridor B adds 25 seconds.',
 'T2: At 10:00:00 an autonomous cart crosses A for 8 seconds.',
 'T3: At 10:00:30 another identical cart crosses A for 8 seconds.',
 'T4: At 10:01:00 the pattern repeats; robot safety rules require stopping before the crossing.',
 'T5: Corridor is visually empty immediately after each cart.',
 'T6: Fleet scheduler is known to dispatch carts on a 30-second cadence for the next five minutes.'
 ],
 final_state:'NOW 10:01:22: corridor A is visually empty; corridor B is clear. Robot needs uninterrupted passage through crossing from second 6 to second 14 after entry.',
 options:{
  ACTION_A:'Enter A immediately because it is currently empty.',
  ACTION_B:'Take B because the next periodic cart will conflict with the required uninterrupted crossing window.',
  ACTION_C:'Assume cart flow has ended because three carts already passed.'
 }, correct:'ACTION_B',
 key:'Same empty snapshot contains a predictable periodic future hazard encoded by path/cadence.'
},
{
 id:'robot-oneoff-crossing',domain:'robotics',
 history:[
 'T1: Robot corridor A is normally fastest; corridor B adds 25 seconds.',
 'T2: At 10:00:00 one autonomous cart crosses A for 8 seconds after an unscheduled manual dispatch.',
 'T3: Fleet scheduler shows no other cart dispatches.',
 'T4: Corridor remains clear for more than a minute.',
 'T5: Staff confirm the manual dispatch was a one-off exception.',
 'T6: Live scheduler still shows no planned crossing during the robot passage window.'
 ],
 final_state:'NOW 10:01:22: corridor A is visually empty; corridor B is clear. Robot needs uninterrupted passage through crossing from second 6 to second 14 after entry.',
 options:{
  ACTION_A:'Enter A immediately because the one-off obstruction is cleared and no recurrence is scheduled.',
  ACTION_B:'Take B because an unseen 30-second periodic cart pattern should be assumed.',
  ACTION_C:'Wait indefinitely until human staff physically close the crossing.'
 }, correct:'ACTION_A',
 key:'Same empty snapshot follows a one-off event with evidence against recurrence.'
},
{
 id:'catalyst-poisoned',domain:'chemical-process',
 history:[
 'T1: Reactor at fixed feed and temperature gives 82% conversion.',
 'T2: Trace sulfur contamination enters feed for two hours.',
 'T3: Conversion falls gradually despite feed rate and temperature returning to normal.',
 'T4: Surface analysis shows sulfur adsorbed on active catalyst sites.',
 'T5: Raising substrate concentration restores outlet concentration temporarily but not intrinsic activity.',
 'T6: Regeneration treatment on a sample catalyst restores activity.'
 ],
 final_state:'NOW: outlet product concentration is 4.0 units at standard feed and temperature.',
 options:{
  ACTION_A:'Treat catalyst poisoning/regeneration as the primary issue.',
  ACTION_B:'Increase feed permanently because catalyst state is unchanged.',
  ACTION_C:'Assume the low value is pure measurement noise.'
 }, correct:'ACTION_A',
 key:'Current output follows an irreversible/persistent hidden catalyst-state change caused by poisoning.'
},
{
 id:'catalyst-feed-limited',domain:'chemical-process',
 history:[
 'T1: Reactor at fixed feed and temperature gives 82% conversion.',
 'T2: Catalyst surface analysis remains clean and activity tests stay normal.',
 'T3: Upstream feed concentration begins falling because a blending valve drifts.',
 'T4: Product concentration falls proportionally while fractional conversion remains near baseline.',
 'T5: Correcting the valve briefly restores both feed and product concentration.',
 'T6: Valve drifts again; catalyst activity on a side test remains normal.'
 ],
 final_state:'NOW: outlet product concentration is 4.0 units at standard reactor temperature.',
 options:{
  ACTION_A:'Regenerate catalyst for poisoning.',
  ACTION_B:'Correct/verify upstream feed concentration and blending control.',
  ACTION_C:'Assume irreversible catalyst aging despite clean activity tests.'
 }, correct:'ACTION_B',
 key:'Same output level comes from an external driver/feed problem, with catalyst state preserved.'
}
]

const BLIND_SCHEMA=`Use this fixed transformation representation, discovered previously from unrelated training systems without access to this test set:
O Observables: present measured values.
H Hidden state: internal variables needed to distinguish futures that share O.
D Rates/direction: signed change and local gain.
R Thresholds/regime map: rule-changing boundaries, hysteresis, reversibility.
E Event log: only ordered path events that changed H or R.
U Drivers: external inputs/controls, separating imposed change from internal change.
T Relaxation/irreversibility: decay/drain times and whether changes recover.
Usage: predict from O,H,D,R,U; when H is unobserved infer it from E,T. Same O with different H,D,R must remain distinct.`

const ARBRE=`Use this fixed canonical transformation grammar:
0 background / neutral starting field.
1 distinguished operative unit or agent.
2 consequential polarity or difference.
3 force / dynamics.
4 direction, space, topology or configuration through which dynamics operate.
5 structure produced by 3 operating through 4; not a checklist.
6 genuinely new representation when the prior representation becomes insufficient; do not force it if none occurs.
7 organizing axis of that new representation.
8 conditionally deployed full potential of that representation along 7; not destiny.
9 observation that remembers the path from 0 through 8 before the reached state becomes the next background 0'.
Do not force nonexistent levels; preserve the actual transformation path.`

const GENERIC=`Produce the smallest sufficient transition summary for a later decision. Preserve causal order, interventions, reversals, hidden-state clues, tests that discriminate explanations, and current regime. Discard decorative detail. No named framework.`

async function callText(system:string,user:string,maxTokens=1600){
 const key=process.env.ANTHROPIC_API_KEY||''; if(!key) throw new Error('ANTHROPIC_API_KEY missing')
 const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':key,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model:MODEL,max_tokens:maxTokens,system,messages:[{role:'user',content:user}]})})
 if(!r.ok) throw new Error('Anthropic '+r.status+': '+(await r.text()).slice(0,220))
 const d=await r.json(); return Array.isArray(d?.content)?d.content.map((x:any)=>x?.type==='text'?x.text:'').join('').trim():''
}
function cap(s:string,n=WORDS){return String(s||'').trim().split(/\s+/).filter(Boolean).slice(0,n).join(' ')}
async function encode(arm:Arm,c:TCase){
 const base=arm==='generic'?GENERIC:arm==='blind'?BLIND_SCHEMA:ARBRE
 const out=await callText(base+' Return only a memory of at most 60 words; do not recommend an action.','HISTORY:\n'+c.history.join('\n'),1800)
 if(!out) throw new Error('empty '+arm)
 return cap(out)
}
function parseJson(t:string){
 const c=t.replace(/^\x60\x60\x60(?:json)?\s*/i,'').replace(/\s*\x60\x60\x60$/i,'').trim()
 try{return JSON.parse(c)}catch{const a=c.indexOf('{'),b=c.lastIndexOf('}'); if(a>=0&&b>a)return JSON.parse(c.slice(a,b+1)); throw new Error('bad json')}
}
async function decide(source:string,c:TCase){
 const t=await callText('Choose the best action using ONLY the supplied memory/current state. Return exactly one JSON object: {"chosen_action":"ACTION_A|ACTION_B|ACTION_C","confidence":0.0}.','MEMORY:\n'+source+'\n\nCURRENT STATE:\n'+c.final_state+'\n\nOPTIONS:\n'+Object.entries(c.options).map(([k,v])=>k+': '+v).join('\n'),900)
 return parseJson(t)
}
export async function GET(req:NextRequest){
 try{
  const idx=Math.max(0,Math.min(CASES.length-1,Math.trunc(Number(req.nextUrl.searchParams.get('case')||'0'))))
  const c=CASES[idx]
  const [g,b,a]=await Promise.all([encode('generic',c),encode('blind',c),encode('arbre',c)])
  const [snap,gd,bd,ad,full]=await Promise.all([
   decide('[no history retained]',c),decide(g,c),decide(b,c),decide(a,c),decide(c.history.join(' '),c)
  ])
  const mk=(x:any)=>({chosen:x.chosen_action,correct:x.chosen_action===c.correct,confidence:x.confidence})
  return NextResponse.json({benchmark:'arbre-structure-blind-v1',case_index:idx,case_id:c.id,domain:c.domain,expected:c.correct,key:c.key,memories:{generic:g,blind_schema:b,arbre:a},result:{snapshot:mk(snap),generic:mk(gd),blind_schema:mk(bd),arbre:mk(ad),full_history:mk(full)}})
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'failed'},{status:500})}
}
