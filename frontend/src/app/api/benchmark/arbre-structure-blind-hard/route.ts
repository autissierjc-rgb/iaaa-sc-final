
import { NextRequest, NextResponse } from 'next/server'
type Arm='generic'|'blind'|'arbre'
type C={id:string;pair:string;history:string[];final_state:string;options:Record<string,string>;correct:string}
const MODEL=process.env.ANTHROPIC_BENCHMARK_MODEL||'claude-sonnet-5-5'
const WORDS=20
const pairs={
battery:{
 final:'NOW: terminal voltage 12.3 V; temperature normal.',
 options:{ACTION_A:'Wait for full relaxation, then verify state-of-charge/capacity.',ACTION_B:'Treat as persistent degradation and replace/derate.',ACTION_C:'Return to normal service now.'}
},
server:{
 final:'NOW: CPU 78%, aggregate requests 13k/s, latency elevated.',
 options:{ACTION_A:'Scale capacity for sustained exogenous demand.',ACTION_B:'Break retry feedback and drain duplicate/backlog work.',ACTION_C:'Make no system change.'}
},
greenhouse:{
 final:'NOW: root-zone moisture 42%; leaves mildly stressed.',
 options:{ACTION_A:'Restore/increase irrigation delivery.',ACTION_B:'Stop/reduce irrigation and restore drainage/aeration.',ACTION_C:'Hold water controls unchanged.'}
},
robot:{
 final:'NOW 10:01:22: corridor A visually empty; B clear. Passage occupies crossing during seconds 6–14 after entry.',
 options:{ACTION_A:'Enter A now.',ACTION_B:'Take B now.',ACTION_C:'Wait 30 seconds then enter A.'}
},
catalyst:{
 final:'NOW: outlet product concentration 4.0 units; reactor temperature normal.',
 options:{ACTION_A:'Regenerate/replace catalyst.',ACTION_B:'Correct and verify upstream feed/blending.',ACTION_C:'Hold process unchanged.'}
}
}
const CASES:C[]=[
{id:'battery-transient',pair:'battery',...pairs.battery,correct:'ACTION_A',history:[
'1 normal capacity 98%, resistance normal.','2 alternator overcharge event pushes voltage high.','3 charger removed; voltage decays quickly.','4 load sag appears large before full rest.','5 capacity logger still estimates normal usable capacity.','6 unrelated cold-start anomaly resolves.','7 voltage returns upward briefly after rest interruption.','8 after resumed rest it decays toward 12.3.','9 resistance measured after relaxation remains normal.','10 no heat/swelling/cell imbalance.','11 coulomb count says charge lower than voltage suggests.','12 12.3 V reached while relaxation is still ongoing.'
]},
{id:'battery-degraded',pair:'battery',...pairs.battery,correct:'ACTION_B',history:[
'1 usable capacity 70%, resistance elevated.','2 no charger anomaly recorded.','3 repeated normal charges end at expected voltage.','4 weekly capacity falls to 68%.','5 resistance stays high after overnight rest.','6 one cold-start anomaly resolves.','7 balancing briefly improves voltage spread.','8 imbalance returns after cycling.','9 repeated long rests settle near 12.3 V.','10 no surface-charge decay pattern after long rest.','11 load tests repeatedly show poor capacity.','12 12.3 V reached in fully relaxed state.'
]},
{id:'server-retry',pair:'server',...pairs.server,correct:'ACTION_B',history:[
'1 baseline 8k/s, CPU45.','2 brief downstream timeout starts client retries.','3 timeout clears; unique users return baseline.','4 retry queue persists; aggregate requests rise.','5 marketing email sends small traffic bump then ends.','6 unique session count remains baseline.','7 suppress retries: CPU falls sharply.','8 re-enable retries: CPU rises.','9 autoscaler adds node; backlog shrinks briefly.','10 remove node; retry amplification returns.','11 edge unique-request logs remain baseline.','12 aggregate now 13k/s, CPU78.'
]},
{id:'server-demand',pair:'server',...pairs.server,correct:'ACTION_A',history:[
'1 baseline 8k/s, CPU45.','2 product launch starts.','3 unique authenticated sessions rise.','4 retry rate stays baseline.','5 one brief downstream timeout clears.','6 disabling retries barely changes total load.','7 edge logs confirm legitimate unique requests rising.','8 autoscaler adds node; latency improves while throughput remains high.','9 marketing campaign ends but organic demand persists.','10 no duplicate-request anomaly found.','11 unique legitimate requests reach 13k/s.','12 aggregate now 13k/s, CPU78.'
]},
{id:'greenhouse-wet',pair:'greenhouse',...pairs.greenhouse,correct:'ACTION_B',history:[
'1 drainage historically fast.','2 sediment partially blocks outlet.','3 irrigation pulse drains slowly.','4 moisture stays high longer; root oxygen falls.','5 sunny day briefly wilts leaves, misleadingly suggesting drought.','6 reducing irrigation improves oxygen slightly.','7 clearing outlet restores drainage and turgor.','8 sediment reblocks outlet.','9 delivered irrigation volume is normal.','10 root oxygen drops again.','11 moisture declines to 42 but remains on slow drainage trajectory.','12 leaves mildly stressed.'
]},
{id:'greenhouse-dry',pair:'greenhouse',...pairs.greenhouse,correct:'ACTION_A',history:[
'1 drainage unobstructed.','2 irrigation filter begins fouling.','3 commanded irrigation unchanged but delivered water falls.','4 moisture trends down; root oxygen stays normal.','5 heavy humidity briefly slows transpiration.','6 measured delivery confirms under-watering.','7 supplemental water restores turgor.','8 filter fouls again.','9 drainage test remains fast.','10 root oxygen remains normal/high.','11 moisture falls to 42 on drying trajectory.','12 leaves mildly stressed.'
]},
{id:'robot-periodic',pair:'robot',...pairs.robot,correct:'ACTION_B',history:[
'1 A fastest by 25s.','2 cart crosses A at 10:00:00 for 8s.','3 unrelated pedestrian crosses once.','4 cart crosses at 10:00:30 for 8s.','5 corridor clears.','6 cart crosses at 10:01:00 for 8s.','7 scheduler explicitly shows 30s cadence continuing five minutes.','8 one cart delayed 1s but cadence resumes.','9 B remains clear.','10 safety requires uninterrupted crossing seconds 6-14 after entry.','11 A is clear at 10:01:22.','12 next scheduled cart 10:01:30.'
]},
{id:'robot-oneoff',pair:'robot',...pairs.robot,correct:'ACTION_A',history:[
'1 A fastest by 25s.','2 one cart manually dispatched at 10:00:00 for 8s.','3 unrelated pedestrian crosses once.','4 no cart at 10:00:30.','5 no cart at 10:01:00.','6 scheduler lists no recurring job.','7 staff confirm dispatch was exceptional.','8 one stale dashboard tile still shows old cart icon.','9 live scheduler clears stale tile.','10 B remains clear.','11 A is clear at 10:01:22.','12 no planned crossing during next minute.'
]},
{id:'catalyst-poison',pair:'catalyst',...pairs.catalyst,correct:'ACTION_A',history:[
'1 baseline conversion 82%.','2 sulfur contamination enters two hours.','3 feed returns normal but conversion stays low.','4 surface assay detects sulfur on active sites.','5 feed concentration briefly dips then is corrected.','6 product remains low after feed correction.','7 higher substrate temporarily raises outlet level but intrinsic activity low.','8 side-sample regeneration restores activity.','9 temperature sensors verified.','10 sulfur remains on installed catalyst.','11 upstream blend now normal.','12 product 4.0.'
]},
{id:'catalyst-feed',pair:'catalyst',...pairs.catalyst,correct:'ACTION_B',history:[
'1 baseline conversion 82%.','2 catalyst assay clean/activity normal.','3 blending valve drifts; feed concentration falls.','4 product falls proportionally; fractional conversion stable.','5 trace sulfur alarm fires falsely then lab disproves contamination.','6 valve correction restores feed and product.','7 valve drifts again.','8 side catalyst test remains normal.','9 temperature sensors verified.','10 feed sample again low.','11 catalyst surface still clean.','12 product 4.0.'
]}
]
const BLIND=`Fixed blind schema: O observables; H hidden state needed to distinguish futures; D signed rates/direction; R thresholds/regime/hysteresis/reversibility; E ordered path events that changed H/R; U external drivers/controls; T relaxation/irreversibility. Infer H from E,T when hidden. Preserve same-O histories when H,D,R differ.`
const ARBRE=`Fixed Arbre: 0 background;1 distinguished unit;2 consequential polarity;3 dynamics;4 direction/topology;5 structure=3 operating through 4;6 genuinely new representation only if required;7 organizing axis;8 conditional full potential;9 observes/remembers the path 0→8 before reached state becomes new 0'. Preserve actual transformation, do not force levels.`
const GENERIC='Keep only the minimum facts needed to choose correctly later. Preserve causal order, interventions, reversals, decisive tests and hidden-state clues. No named framework.'
async function txt(system:string,user:string,max=1500){const key=process.env.ANTHROPIC_API_KEY||'';const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':key,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model:MODEL,max_tokens:max,system,messages:[{role:'user',content:user}]})});if(!r.ok)throw new Error(await r.text());const d=await r.json();return Array.isArray(d.content)?d.content.map((x:any)=>x.type==='text'?x.text:'').join('').trim():''}
const cap=(s:string)=>s.split(/\s+/).filter(Boolean).slice(0,WORDS).join(' ')
async function enc(arm:Arm,c:C){const p=arm==='generic'?GENERIC:arm==='blind'?BLIND:ARBRE;return cap(await txt(p+' Return only memory text, maximum 20 words. No recommendation.','HISTORY:\n'+c.history.join('\n'),1800))}
function parse(t:string){const a=t.indexOf('{'),b=t.lastIndexOf('}');if(a>=0&&b>a)return JSON.parse(t.slice(a,b+1));throw new Error('json')}
async function dec(mem:string,c:C){return parse(await txt('Choose using only memory and current state. JSON only: {"chosen_action":"ACTION_A|ACTION_B|ACTION_C"}.','MEMORY:\n'+mem+'\nCURRENT:\n'+c.final_state+'\nOPTIONS:\n'+Object.entries(c.options).map(([k,v])=>k+': '+v).join('\n'),700))}
export async function GET(req:NextRequest){try{const i=Math.max(0,Math.min(9,Math.trunc(Number(req.nextUrl.searchParams.get('case')||'0'))));const c=CASES[i];const[g,b,a]=await Promise.all([enc('generic',c),enc('blind',c),enc('arbre',c)]);const[s,gd,bd,ad,f]=await Promise.all([dec('[none]',c),dec(g,c),dec(b,c),dec(a,c),dec(c.history.join(' '),c)]);const m=(x:any)=>({chosen:x.chosen_action,correct:x.chosen_action===c.correct});return NextResponse.json({benchmark:'arbre-structure-blind-hard-v1',case_index:i,case_id:c.id,pair:c.pair,expected:c.correct,memories:{generic:g,blind:b,arbre:a},result:{snapshot:m(s),generic:m(gd),blind:m(bd),arbre:m(ad),full:m(f)}})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'fail'},{status:500})}}
