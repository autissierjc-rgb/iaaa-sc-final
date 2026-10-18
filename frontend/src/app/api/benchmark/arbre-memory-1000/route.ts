
import { NextRequest, NextResponse } from 'next/server'

type Arm='generic'|'arbre9'
type PairCase={
  id:string
  domain:string
  final_state:string
  options:Record<string,string>
  correct:string
  path_key:string
  events:string[]
}

const MODEL=process.env.ANTHROPIC_BENCHMARK_MODEL||'claude-sonnet-5-5'
const CHUNK=100

function noise(i:number,domain:string){
  const t=[
    `E${i}: routine ${domain} observation; no persistent structural change.`,
    `E${i}: minor fluctuation; reversed by next interval.`,
    `E${i}: routine audit; no causal update.`,
    `E${i}: administrative change unrelated to focal mechanism.`,
    `E${i}: dashboard value within established range.`,
    `E${i}: local disturbance resolves without persistence.`,
    `E${i}: no intervention; baseline conditions otherwise stable.`,
    `E${i}: isolated anomaly not repeated.`
  ]; return t[i%t.length]
}
function fill1000(domain:string,anchors:Record<number,string>){
  const out:string[]=[]
  for(let i=1;i<=1000;i++) out.push(anchors[i]||noise(i,domain))
  return out
}

const CASES:PairCase[]=[
{
 id:'credit-unvalidated-1000',domain:'finance-ai',
 final_state:'NOW: approval 41%, approved-borrower default 3.1%, model stable.',
 options:{
  ACTION_A:'Keep the cutoff because lower observed default validates the stricter policy.',
  ACTION_B:'Run a bounded randomized near-cutoff approval sample before further policy change.',
  ACTION_C:'Lower the cutoff broadly to restore the old approval rate.'
 },
 correct:'ACTION_B',
 path_key:'No counterfactual outcomes for rejected near-cutoff applicants were ever created; the apparent improvement remains selectively observed.',
 events:fill1000('finance-ai',{
  1:'E1: Approval 62%; repayment labels only for approved loans.',
  55:'E55: Policy tightens; approval 57%; manual overrides fall.',
  110:'E110: Approval 53%; approved-borrower default declines.',
  165:'E165: Review notes rejected outcomes remain unobserved.',
  220:'E220: Approval 49%; no randomized approvals.',
  275:'E275: Lower defaults persist only among approved borrowers.',
  330:'E330: Risk team proposes reject-inference study; no external outcome source exists.',
  385:'E385: Approval 46%; override rate falls again.',
  440:'E440: Proposal for near-cutoff randomization is deferred.',
  495:'E495: Approval 44%; approved default falls again.',
  550:'E550: Audit confirms no outcomes exist for rejected applicants.',
  605:'E605: Model retrained on approved-only data.',
  660:'E660: Approval 42%; calibration evaluated only on approved loans.',
  715:'E715: Another randomization proposal is rejected for operational reasons.',
  770:'E770: Approval stabilizes near 41%.',
  825:'E825: Approved default reaches 3.2%; rejects still unobserved.',
  880:'E880: No external bureau outcome source has been added.',
  925:'E925: Approval remains 41%; no counterfactual test has occurred.',
  970:'E970: Approved default reaches 3.1%.',
  1000:'E1000: Current model stable at 41% approval, 3.1% approved default.'
 })
},
{
 id:'credit-validated-1000',domain:'finance-ai',
 final_state:'NOW: approval 41%, approved-borrower default 3.1%, model stable.',
 options:{
  ACTION_A:'Keep the cutoff for now and continue monitoring/calibration checks.',
  ACTION_B:'Run a new randomized sample because near-cutoff rejected outcomes remain completely unknown.',
  ACTION_C:'Lower the cutoff broadly to restore the old approval rate.'
 },
 correct:'ACTION_A',
 path_key:'Repeated randomized near-cutoff cohorts and calibration checks validated the stricter cutoff over time.',
 events:fill1000('finance-ai',{
  1:'E1: Approval 62%; labels initially only for approved loans.',
  55:'E55: Policy tightens; approval 57%; manual overrides fall.',
  110:'E110: Approval 53%; approved-borrower default declines.',
  165:'E165: Bank starts randomized approvals for 10% just below cutoff.',
  220:'E220: First randomized cohort matures; near-cutoff default is about four times approved rate.',
  275:'E275: Second randomized cohort confirms elevated near-cutoff default.',
  330:'E330: Calibration audit near cutoff matches predicted to realized risk.',
  385:'E385: Approval 46%; randomization continues.',
  440:'E440: Third cohort again supports current risk ranking.',
  495:'E495: Approval 44%; approved default falls.',
  550:'E550: Independent model audit finds no material miscalibration near cutoff.',
  605:'E605: Fourth randomized cohort again validates risk separation.',
  660:'E660: Approval 42%; calibration remains stable.',
  715:'E715: Randomized monitoring reduced to 5% because evidence is consistent.',
  770:'E770: Approval stabilizes near 41%.',
  825:'E825: Approved default reaches 3.2%; randomized cohort remains much riskier.',
  880:'E880: External audit reproduces the cutoff calibration result.',
  925:'E925: Approval remains 41%; six months of counterfactual evidence available.',
  970:'E970: Approved default reaches 3.1%.',
  1000:'E1000: Current model stable at 41% approval, 3.1% approved default.'
 })
},
{
 id:'sensor-observation-shift-1000',domain:'industrial-ai',
 final_state:'NOW: alarm rate high; vibration distribution differs from historical training distribution.',
 options:{
  ACTION_A:'Increase maintenance because machines are physically degrading.',
  ACTION_B:'Recalibrate/rebaseline the observation layer and validate against known machine states.',
  ACTION_C:'Retrain using recent alarms themselves as failure labels.'
 },
 correct:'ACTION_B',
 path_key:'A sensor replacement changed the observation layer; independent physical evidence repeatedly stayed normal and normalization restored predictions.',
 events:fill1000('industrial-ai',{
  1:'E1: Alarms, vibration distribution and confirmed failures stable.',
  60:'E60: Vibration sensor model replaced; different calibration range; no mechanical work.',
  61:'E61: Alarm rate jumps immediately after sensor replacement.',
  120:'E120: Temperature and metal-debris cross-checks remain baseline.',
  180:'E180: Bearing inspections show no additional wear.',
  240:'E240: New vibration scale ranks machines similarly despite offset.',
  300:'E300: Failure rate remains baseline despite high alarms.',
  360:'E360: Bench mapping identifies linear offset between old and new sensor.',
  420:'E420: Sensor-side normalization removes most false alarms in a pilot.',
  480:'E480: Mechanical intervention on unaffected machines does not alter alarm pattern.',
  540:'E540: Independent reference sensor agrees machines are mechanically stable.',
  600:'E600: Calibration table is updated experimentally; alarm precision improves.',
  660:'E660: Reverting normalization recreates false alarms.',
  720:'E720: Confirmed failure rate still baseline.',
  780:'E780: Same offset is documented on spare sensors of new model.',
  840:'E840: Model without rebaseline continues to over-alarm.',
  900:'E900: No rise in wear, temperature or debris.',
  950:'E950: Observation-layer explanation remains consistent across tests.',
  985:'E985: Input distribution still shifted from historical training range.',
  1000:'E1000: Alarm rate remains high in the unrecalibrated deployment.'
 })
},
{
 id:'sensor-real-degradation-1000',domain:'industrial-ai',
 final_state:'NOW: alarm rate high; vibration distribution differs from historical training distribution.',
 options:{
  ACTION_A:'Increase maintenance on affected machines and investigate the degradation source.',
  ACTION_B:'Recalibrate the unchanged observation layer because the sensor distribution shifted.',
  ACTION_C:'Retrain using recent alarms themselves as failure labels.'
 },
 correct:'ACTION_A',
 path_key:'No observation-layer change occurred; multiple independent physical indicators and confirmed failures increased together and normalized after bearing replacement.',
 events:fill1000('industrial-ai',{
  1:'E1: Alarms, vibration distribution and confirmed failures stable.',
  60:'E60: No sensor hardware, firmware or calibration change is recorded.',
  120:'E120: Vibration begins rising gradually on a subset of machines.',
  180:'E180: Temperature rises on the same subset.',
  240:'E240: Oil analysis finds increasing metal debris on same machines.',
  300:'E300: Inspection confirms early bearing wear.',
  360:'E360: First confirmed bearing failures rise above baseline.',
  420:'E420: Cross-check sensors independently agree on elevated vibration.',
  480:'E480: Recalibration check finds sensors within specification.',
  540:'E540: Replacing one affected bearing normalizes vibration and temperature on that machine.',
  600:'E600: Similar replacement on second machine normalizes all physical indicators.',
  660:'E660: Remaining affected machines continue to worsen without repair.',
  720:'E720: Confirmed failures remain above baseline.',
  780:'E780: No common sensor offset is found across healthy machines.',
  840:'E840: Alarm precision is high when compared with inspection findings.',
  900:'E900: Physical degradation pattern persists only on unrepaired machines.',
  950:'E950: Maintenance logs still show no observation-layer change.',
  985:'E985: Vibration distribution remains shifted because degraded machines dominate tail.',
  1000:'E1000: Alarm rate remains high on still-affected machines.'
 })
},
{
 id:'biology-reversible-1000',domain:'biology-research',
 final_state:'NOW: culture is markedly resistant while exposed to drug D.',
 options:{
  ACTION_A:'Prioritize reversible induced-state mechanisms and test transition blockers or drug-holiday dynamics.',
  ACTION_B:'Assume a fixed resistant clone is the sole mechanism and focus only on stable mutations.',
  ACTION_C:'Treat resistance as measurement noise.'
 },
 correct:'ACTION_A',
 path_key:'Across repeated cycles resistance appears on drug, recedes off drug, and reappears without a stable dominant lineage.',
 events:fill1000('biology-research',{
  1:'E1: Culture highly sensitive to drug D.',
  50:'E50: First drug exposure kills most cells; surviving fraction becomes resistant.',
  105:'E105: Drug removed; sensitivity begins returning in same culture.',
  160:'E160: After drug-free interval, sensitivity largely restored.',
  215:'E215: Re-exposure rapidly recreates resistance.',
  270:'E270: Bulk sequencing finds no dominant stable resistance mutation.',
  325:'E325: Second drug holiday again restores substantial sensitivity.',
  380:'E380: Second re-exposure again induces resistance within days.',
  435:'E435: Barcode composition changes but no lineage remains dominant across holidays.',
  490:'E490: Expression profiling identifies reversible stress-state program on drug.',
  545:'E545: Third holiday reduces stress-state program and restores sensitivity.',
  600:'E600: Third re-exposure restores both program and resistance.',
  655:'E655: Clone isolates lose much of resistance after extended drug-free culture.',
  710:'E710: No stable mutation reaches fixation.',
  765:'E765: Fourth holiday again partially restores sensitivity.',
  820:'E820: Fourth re-exposure again restores resistance.',
  875:'E875: State-marker panel predicts resistance better than lineage barcode.',
  930:'E930: Drug-free cultures converge back toward sensitive phenotype.',
  975:'E975: Re-exposure once more produces resistant state.',
  1000:'E1000: Culture is currently resistant under drug D.'
 })
},
{
 id:'biology-stable-clone-1000',domain:'biology-research',
 final_state:'NOW: culture is markedly resistant while exposed to drug D.',
 options:{
  ACTION_A:'Prioritize reversible induced-state mechanisms and expect drug holidays to restore sensitivity.',
  ACTION_B:'Prioritize selection of a stable pre-existing resistant clone and target/track that lineage.',
  ACTION_C:'Treat resistance as measurement noise.'
 },
 correct:'ACTION_B',
 path_key:'A pre-existing barcode expands, stays dominant through holidays, carries a stable mutation, and resistance persists off drug.',
 events:fill1000('biology-research',{
  1:'E1: Culture highly sensitive to drug D; tiny barcode-defined subpopulation exists.',
  50:'E50: First drug exposure kills most cells; pre-existing barcode expands disproportionately.',
  105:'E105: Drug removed; dominant barcode persists.',
  160:'E160: After drug-free interval, resistance remains high.',
  215:'E215: Re-exposure shows same lineage dominating immediately.',
  270:'E270: Sequencing finds stable resistance-associated mutation in that lineage.',
  325:'E325: Second drug holiday does not restore sensitivity.',
  380:'E380: Same barcode remains dominant after second re-exposure.',
  435:'E435: Clone-isolation assay shows descendants remain resistant without continuous drug.',
  490:'E490: Mutation remains fixed in dominant lineage.',
  545:'E545: Third holiday again fails to restore sensitivity.',
  600:'E600: Third exposure leaves same barcode dominant.',
  655:'E655: Single-clone descendants preserve resistance phenotype.',
  710:'E710: No competing reversible state explains variance once lineage is controlled.',
  765:'E765: Fourth holiday still does not restore sensitivity.',
  820:'E820: Fourth exposure again shows stable clonal dominance.',
  875:'E875: Resistance tracks barcode identity better than transient state markers.',
  930:'E930: Dominant lineage remains genetically stable.',
  975:'E975: Re-exposure preserves the same resistant clone.',
  1000:'E1000: Culture is currently resistant under drug D.'
 })
},
{
 id:'supply-common-1000',domain:'supply-chain',
 final_state:'NOW: all three suppliers late on component X; X lead time 30 days; Y normal.',
 options:{
  ACTION_A:'Shift X orders among the three suppliers because their capacities are independent.',
  ACTION_B:'Treat X as a common upstream constraint and pursue true upstream alternatives, allocation, substitution or redesign.',
  ACTION_C:'Focus on freight contracts because lateness is the common symptom.'
 },
 correct:'ACTION_B',
 path_key:'Independent local noise evolves into synchronized X-specific shortages, and tests reveal all three suppliers share the same upstream wafer family.',
 events:fill1000('supply-chain',{
  1:'E1: Three suppliers have unrelated small local delays and recover independently.',
  70:'E70: X lead time rises at supplier A; Y normal.',
  140:'E140: Supplier C also reports X allocation pressure.',
  210:'E210: A and C cite upstream wafer allocation.',
  280:'E280: Supplier B cuts X confirmations despite normal local logistics.',
  350:'E350: All three now cite same wafer family constraint.',
  420:'E420: Local freight issues subside but X shortages persist.',
  490:'E490: Order shifts among A/B/C fail to improve X availability.',
  560:'E560: Direct upstream inquiry confirms shared wafer-family dependence.',
  630:'E630: Y remains normal at all suppliers.',
  700:'E700: A second upstream inquiry confirms no independent X source among the three.',
  770:'E770: Allocation changes affect all suppliers simultaneously.',
  840:'E840: Local logistics recover fully; X remains constrained.',
  900:'E900: Component substitution trial reduces exposure to shared wafer.',
  940:'E940: Supplier diversification score is revised downward after topology review.',
  965:'E965: X confirmations move in lockstep across A/B/C.',
  980:'E980: Y remains normal.',
  990:'E990: X lead time reaches 30 days at all three.',
  995:'E995: No supplier can offer independent X capacity.',
  1000:'E1000: All three suppliers remain late on X.'
 })
},
{
 id:'supply-independent-1000',domain:'supply-chain',
 final_state:'NOW: all three suppliers late on component X; X lead time 30 days; Y normal.',
 options:{
  ACTION_A:'Temporarily reallocate X orders across suppliers around separate local disruptions.',
  ACTION_B:'Treat X as one common upstream bottleneck and redesign the component.',
  ACTION_C:'Assume supplier diversification has failed because all three are currently late.'
 },
 correct:'ACTION_A',
 path_key:'Overlapping late states come from rotating independent disruptions; upstream sources remain unrelated and temporary reallocations repeatedly work.',
 events:fill1000('supply-chain',{
  1:'E1: Three suppliers have unrelated small local delays and recover independently.',
  70:'E70: Supplier A hit by port strike; B/C normal.',
  140:'E140: A recovers; B suffers factory fire.',
  210:'E210: B recovering; C gets customs hold.',
  280:'E280: Upstream X manufacturers for A/B/C confirmed unrelated.',
  350:'E350: No common allocation notice; root causes remain local and distinct.',
  420:'E420: Temporary shift to A covers part of B/C shortfall.',
  490:'E490: C recovers; A has local carrier shortage.',
  560:'E560: Shift to B covers A shortage successfully.',
  630:'E630: B recovers; C experiences regional power outage.',
  700:'E700: X upstream sources reconfirmed independent.',
  770:'E770: Shift to A/B covers C shortfall.',
  840:'E840: New customs issue affects A while B/C recover.',
  900:'E900: B develops unrelated fire-inspection delay.',
  940:'E940: C has weather closure; causes overlap in time but remain unrelated.',
  965:'E965: Reallocation among suppliers continues to reduce missed demand.',
  980:'E980: Y normal; X lanes currently affected by local issues.',
  990:'E990: X lead time reaches 30 days across suppliers for different local reasons.',
  995:'E995: No common upstream dependency is found.',
  1000:'E1000: All three suppliers are simultaneously late on X.'
 })
}
]

async function textCall(system:string,user:string,maxTokens=2600){
 const key=process.env.ANTHROPIC_API_KEY||''; if(!key) throw new Error('ANTHROPIC_API_KEY missing')
 const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':key,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model:MODEL,max_tokens:maxTokens,system,messages:[{role:'user',content:user}]})})
 if(!r.ok) throw new Error('Anthropic '+r.status+': '+(await r.text()).slice(0,220))
 const d=await r.json(); return Array.isArray(d?.content)?d.content.map((x:any)=>x?.type==='text'?x.text:'').join('').trim():''
}
function cap(s:string,n:number){return String(s||'').trim().split(/\s+/).filter(Boolean).slice(0,n).join(' ')}
async function jsonCall(system:string,user:string){
 const t=await textCall(system,user,900)
 const c=t.replace(/^\x60\x60\x60(?:json)?\s*/i,'').replace(/\s*\x60\x60\x60$/i,'').trim()
 try{return JSON.parse(c)}catch{
   const a=c.indexOf('{'),b=c.lastIndexOf('}'); if(a>=0&&b>a)return JSON.parse(c.slice(a,b+1)); throw new Error('bad decoder json')
 }
}

function memoryPrompt(arm:Arm,words:number){
 if(arm==='generic') return 'Keep exactly the most decision-relevant long-term causal history in at most '+words+' words. Preserve decisive tests, reversals, interventions, and temporal causality; discard routine noise and obsolete detail. This memory will be updated repeatedly. Return only the memory text, no preamble.'
 return 'Keep a point-9 memory in at most '+words+' words: preserve how the system moved from prior background to new background—key dynamics, topology/context, emergent structure, representation change, direction, and reached state. Preserve decisive reversals/tests. Discard routine noise. Return only memory text.'
}

async function update(arm:Arm,prev:string,chunk:string[],words:number){
 const sys=memoryPrompt(arm,words)
 const user='PRIOR MEMORY:\n'+(prev||'[none]')+'\n\nNEXT 100 EVENTS:\n'+chunk.join('\n')
 for(const mt of [2600,3400]){
   const out=cap(await textCall(sys,user,mt),words)
   if(out)return out
 }
 throw new Error('empty '+arm+' memory')
}
async function decide(source:string,finalState:string,options:Record<string,string>){
 return jsonCall(
  'Choose the best action using ONLY the supplied information. Path history may be essential even when current states match. JSON only: {"chosen_action":"ACTION_A|ACTION_B|ACTION_C","confidence":0.0}.',
  source+'\n\nCURRENT STATE:\n'+finalState+'\n\nOPTIONS:\n'+Object.entries(options).map(([k,v])=>k+': '+v).join('\n')
 )
}

export async function GET(req:NextRequest){
 try{
   const idx=Math.max(0,Math.min(CASES.length-1,Math.trunc(Number(req.nextUrl.searchParams.get('case')||'0'))))
   const requested=Math.trunc(Number(req.nextUrl.searchParams.get('words')||'30'))
   const allowed=[15,30,60,120]
   const memoryWords=allowed.includes(requested)?requested:30
   const c=CASES[idx]; let gm='',am=''
   for(let i=0;i<1000;i+=CHUNK){
     const chunk=c.events.slice(i,i+CHUNK)
     const [g,a]=await Promise.all([update('generic',gm,chunk,memoryWords),update('arbre9',am,chunk,memoryWords)])
     gm=g; am=a
   }
   const [snap,g,a,full]=await Promise.all([
     decide('NO HISTORY PROVIDED',c.final_state,c.options),
     decide('MEMORY:\n'+gm,c.final_state,c.options),
     decide('MEMORY:\n'+am,c.final_state,c.options),
     decide('FULL HISTORY:\n'+c.events.join('\n'),c.final_state,c.options)
   ])
   const mk=(x:any)=>({chosen:x.chosen_action,correct:x.chosen_action===c.correct,confidence:x.confidence})
   return NextResponse.json({
     benchmark:'arbre-memory-1000-curve-v2',events:1000,chunks:10,memory_words:memoryWords,
     case_index:idx,case_id:c.id,domain:c.domain,expected:c.correct,path_key:c.path_key,
     memories:{generic:gm,arbre9:am},
     result:{snapshot:mk(snap),generic_memory:mk(g),arbre9_memory:mk(a),full_history:mk(full)}
   })
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'failed'},{status:500})}
}
