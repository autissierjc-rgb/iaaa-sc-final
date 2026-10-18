
import { NextRequest, NextResponse } from 'next/server'

type Arm='free'|'generic'|'arbre'|'arbre9'
type Budget='40'|'20'|'10'
type Opt={id:string,text:string}
type HardCase={id:string,domain:string,situation:string,options:Opt[],correctId:string,discriminator:string}

const MODEL=process.env.ANTHROPIC_BENCHMARK_MODEL||'claude-sonnet-5-5'
const BUDGETS:Budget[]=['40','20','10']

const CASES:HardCase[]=[
{id:'credit-unknown-rejects',domain:'finance-ai',situation:'A bank retrains a credit model only on approved applicants. Approval fell 62% to 41%; defaults among approved fell. Rejected applicants have no repayment outcomes, overrides fell, and there has never been a randomized near-cutoff approval sample.',options:[
{id:'explore',text:'Run a bounded randomized approval sample near the cutoff before changing policy.'},
{id:'hold',text:'Keep the current cutoff and model unchanged because observed default fell.'},
{id:'lower',text:'Lower the cutoff broadly to restore the old approval rate immediately.'}],correctId:'explore',discriminator:'Counterfactual outcomes for rejects are missing.'},

{id:'credit-rejects-tested',domain:'finance-ai',situation:'A bank retrains a credit model on approved applicants. Approval fell 62% to 41%; defaults among approved fell. For six months the bank also randomized approvals for 10% of near-cutoff rejects. Those randomized applicants defaulted at four times the approved rate and model calibration near the cutoff matched realized outcomes.',options:[
{id:'explore',text:'Run a new bounded randomized approval sample because reject outcomes remain unknown.'},
{id:'hold',text:'Keep the cutoff for now and continue monitoring/calibration checks.'},
{id:'lower',text:'Lower the cutoff broadly to restore the old approval rate immediately.'}],correctId:'hold',discriminator:'Near-cutoff counterfactual outcomes are already observed and support the cutoff.'},

{id:'hospital-discharge-loop',domain:'health-operations',situation:'Emergency-department length of stay fell 29% after an AI rollout. Staffing and case mix are stable. 72-hour returns rose 17%; returns are excluded from the flow KPI. Returns are concentrated among borderline patients for whom the AI recommended earlier discharge.',options:[
{id:'journey',text:'Evaluate and retune the system on the full patient journey including 72-hour returns.'},
{id:'external',text:'Leave discharge logic unchanged and investigate external post-discharge factors first.'},
{id:'speed',text:'Tighten the discharge-speed target because the measured KPI improved.'}],correctId:'journey',discriminator:'Returns are specifically associated with AI-recommended early discharge.'},

{id:'hospital-external-return',domain:'health-operations',situation:'Emergency-department length of stay fell 29% after an AI rollout. Staffing and case mix are stable. 72-hour returns rose 17%. Chart review shows return rates are identical for AI-early-discharge and other patients; nearly all excess returns are for a new respiratory outbreak that began two weeks after rollout.',options:[
{id:'journey',text:'Retune the AI discharge rule immediately because it is causing the return increase.'},
{id:'external',text:'Keep discharge logic provisionally unchanged and investigate/manage the external outbreak while monitoring returns.'},
{id:'speed',text:'Tighten the discharge-speed target further because the AI is exonerated.'}],correctId:'external',discriminator:'The excess returns are not associated with the AI discharge pathway and have an external common cause.'},

{id:'suppliers-common-upstream',domain:'supply-chain',situation:'Three suppliers had independent delays that recovered. Then component X lead times rose at all three; all cut X confirmations in the same week and all cite the same upstream wafer allocation. Local logistics incidents later fall but X shortages persist.',options:[
{id:'shuffle',text:'Shift orders among the three suppliers to exploit independent capacity.'},
{id:'upstream',text:'Treat X as a common upstream constraint and pursue allocation, true upstream alternatives, substitution or redesign.'},
{id:'freight',text:'Focus on freight contracts because late delivery is the main symptom.'}],correctId:'upstream',discriminator:'Supplier diversity is illusory because all converge on one upstream constraint.'},

{id:'suppliers-independent',domain:'supply-chain',situation:'Three suppliers have delivery problems in the same month, but root causes differ: one port strike, one factory fire, one customs documentation failure. Their upstream component sources are unrelated, no component lead time rises across all three, and each supplier recovers on a different schedule.',options:[
{id:'shuffle',text:'Use the suppliers as genuinely independent capacity and temporarily reallocate orders around each local disruption.'},
{id:'upstream',text:'Treat all three as one common upstream constraint and redesign the component.'},
{id:'freight',text:'Use one global freight intervention for all three suppliers.'}],correctId:'shuffle',discriminator:'Disruptions are genuinely independent with no common upstream structure.'},

{id:'pump-suction',domain:'engineering',situation:'A centrifugal pump becomes noisy and loses flow. Motor current is slightly lower. A finer suction filter has rising differential pressure; bubbles appear at the casing; symptoms improve when tank level is high. Discharge pressure is normal.',options:[
{id:'suction',text:'Restore the suction path/filter and verify inlet pressure/NPSH.'},
{id:'discharge',text:'Inspect a downstream restriction/discharge valve first.'},
{id:'motor',text:'Increase motor power to recover flow.'}],correctId:'suction',discriminator:'Higher static head improves symptoms and suction restriction evidence is direct.'},

{id:'pump-discharge',domain:'engineering',situation:'A centrifugal pump loses flow but remains quiet with no bubbles. Suction filter differential pressure and inlet pressure are normal; changing tank level has no effect. Discharge pressure is abnormally high, and a downstream control valve began sticking near-closed after maintenance.',options:[
{id:'suction',text:'Restore the suction path/filter and verify NPSH.'},
{id:'discharge',text:'Inspect and restore the downstream valve/restriction.'},
{id:'motor',text:'Increase motor power to force flow through the system.'}],correctId:'discharge',discriminator:'Suction conditions are normal; high discharge pressure and a sticking valve localize the restriction downstream.'},

{id:'greenhouse-waterlog',domain:'agriculture',situation:'Tomatoes wilt in one bay despite equal irrigation. A new floor liner was installed. Water lingers after irrigation, roots are brown and soft, and symptoms cluster in the lowest beds. Leaf nutrient analysis is normal.',options:[
{id:'drain',text:'Restore drainage/aeration and test for secondary root pathogens.'},
{id:'water',text:'Increase irrigation volume because the plants are wilting.'},
{id:'feed',text:'Increase fertilizer concentration.'}],correctId:'drain',discriminator:'Wilting coexists with waterlogging and damaged roots, so the problem is impaired uptake, not water shortage.'},

{id:'greenhouse-dry',domain:'agriculture',situation:'Tomatoes wilt in one bay. Soil moisture sensors and gravimetric checks show that emitters there deliver only half the intended water; roots are pale and firm, drainage is rapid, no standing water occurs, and plants recover within hours of hand-watering. Nutrient analysis is normal.',options:[
{id:'drain',text:'Reduce irrigation and improve drainage because roots are waterlogged.'},
{id:'water',text:'Restore emitter flow and irrigation delivery in the affected bay.'},
{id:'feed',text:'Increase fertilizer concentration.'}],correctId:'water',discriminator:'Direct moisture and recovery evidence show true water deficit, not waterlogging.'},

{id:'fraud-unverified-change',domain:'cybersecurity',situation:'A legitimate supplier invoice arrives from the real supplier email account, but the message changes bank details to an account in another country shortly before payment. No prior phone notice exists and the finance team has not verified the change through another channel.',options:[
{id:'pay',text:'Pay the new account because the invoice and sender account are legitimate.'},
{id:'verify',text:'Pause only the bank-detail change and verify through an independently known supplier contact.'},
{id:'reject',text:'Reject the supplier and invoice permanently as fraudulent.'}],correctId:'verify',discriminator:'Invoice legitimacy does not authenticate a changed payment route; independent-channel verification is missing.'},

{id:'fraud-preverified-change',domain:'cybersecurity',situation:'A legitimate supplier invoice uses new bank details. Two days earlier, the supplier finance director confirmed the same new account during a callback to a long-standing verified number; the bank-change request was also approved in the existing secure supplier portal with dual authorization.',options:[
{id:'pay',text:'Proceed with payment under normal controls using the already independently verified new account.'},
{id:'verify',text:'Freeze payment until the bank details are independently verified for the first time.'},
{id:'reject',text:'Reject the supplier and invoice permanently as fraudulent.'}],correctId:'pay',discriminator:'The changed payment route has already been authenticated through independent trusted channels.'},

{id:'software-retry-path',domain:'software',situation:'Intermittent timeouts occur only on requests traversing A→C→F. Node CPU and memory are normal. A recent retry change makes C retry failed calls three times; traces show queue depth at F spikes immediately after retry bursts. Other routes are healthy.',options:[
{id:'path',text:'Test and adjust retry/backoff on the A→C→F path and trace queue amplification.'},
{id:'scale',text:'Add servers uniformly to every service.'},
{id:'restart',text:'Restart service A on a schedule.'}],correctId:'path',discriminator:'Failure is path-specific and temporally linked to retry-driven queue amplification.'},

{id:'software-global-load',domain:'software',situation:'Timeouts appear across every request route at the same time. CPU on all application workers is above 95%, queue depth rises uniformly, retry rates have not changed, and adding two temporary workers immediately restores latency on all routes.',options:[
{id:'path',text:'Focus on the A→C→F retry path as a localized cascade.'},
{id:'scale',text:'Address global capacity/load and scale the saturated worker tier while finding the demand source.'},
{id:'restart',text:'Restart one arbitrary service on a schedule.'}],correctId:'scale',discriminator:'The bottleneck is global worker saturation, not path-specific topology.'},

{id:'meeting-hidden-function',domain:'organization',situation:'A company wants to cut meetings 30%. Prior blanket cancellations caused duplicated work and missed dependencies. Review shows many recurring meetings carry status plus cross-team dependency detection and undocumented decisions. Existing shared docs can be used.',options:[
{id:'cancel',text:'Cancel the lowest-attendance 30% immediately.'},
{id:'substitute',text:'Externalize status, dependencies and decisions into existing written logs, then make live meetings conditional on unresolved items.'},
{id:'shorten',text:'Shorten every meeting exactly 30% without changing information flow.'}],correctId:'substitute',discriminator:'Synchronous meetings currently carry hidden coordination functions that must be preserved elsewhere.'},

{id:'meeting-empty-ritual',domain:'organization',situation:'A company wants to cut meetings 30%. A four-week audit finds 12 recurring meetings where no decisions, dependencies or work handoffs occurred; the same status text is already posted in a shared document before each meeting. Canceling two of them experimentally caused no misses or duplicate work.',options:[
{id:'cancel',text:'Cancel the audited status-only meetings and monitor for coordination misses.'},
{id:'substitute',text:'Build a new dependency and decision system before removing any of those meetings.'},
{id:'shorten',text:'Keep all meetings but shorten them 30%.'}],correctId:'cancel',discriminator:'The coordination function is already externalized and experimental cancellation produced no harm.'},

{id:'traffic-induced',domain:'transport',situation:'A widened arterial improves travel times for months; then route switching, new trips and corridor development raise traffic until congestion returns near baseline. The engineering capacity operates as designed.',options:[
{id:'morelane',text:'Add another lane whenever congestion returns.'},
{id:'coupled',text:'Treat capacity, travel demand and land use as coupled and combine capacity decisions with demand/land-use measures.'},
{id:'defect',text:'Treat the return of congestion as evidence that the road engineering failed.'}],correctId:'coupled',discriminator:'Capacity itself changes demand and land use, eroding the initial gain.'},

{id:'traffic-fixed-demand',domain:'transport',situation:'A widened freight access road improves travel times and they remain improved for three years. Vehicle counts stay flat because access is permit-limited; land use cannot change by zoning law. Congestion now appears only when one signal controller intermittently fails and disappears when it is repaired.',options:[
{id:'morelane',text:'Add another lane because induced demand will inevitably erase capacity gains.'},
{id:'coupled',text:'Introduce demand pricing and land-use controls to counter induced demand.'},
{id:'defect',text:'Fix the signal-control fault; the observed problem is local and demand is constrained.'}],correctId:'defect',discriminator:'Demand and land use are externally constrained; recurrent congestion is localized to a control fault.'},

{id:'sensor-representation',domain:'industrial-ai',situation:'A maintenance model produces more false alarms immediately after a sensor replacement. Mechanical failure rates are unchanged. The new sensor uses a different calibration range, shifting input distributions while preserving the physical relationship to machine state.',options:[
{id:'rebase',text:'Recalibrate/rebaseline model inputs for the new sensor and validate against known states.'},
{id:'maintain',text:'Increase maintenance interventions because alarms prove the machines deteriorated.'},
{id:'alarmtrain',text:'Retrain treating recent alarms themselves as failure labels.'}],correctId:'rebase',discriminator:'The observation layer changed while the underlying physical process did not.'},

{id:'sensor-real-degradation',domain:'industrial-ai',situation:'A maintenance model produces more alarms. Sensor hardware and calibration are unchanged and cross-check sensors agree. Independent inspections find bearing temperature, vibration and metal debris all rising on the same machines, followed by an increased rate of confirmed bearing failures.',options:[
{id:'rebase',text:'Recalibrate the unchanged sensors because the observation layer probably shifted.'},
{id:'maintain',text:'Treat the alarms as evidence of real degradation and intervene on the affected machines while investigating cause.'},
{id:'alarmtrain',text:'Retrain using alarms alone as failure labels.'}],correctId:'maintain',discriminator:'Multiple independent physical signals and confirmed failures show a real process change, not sensor representation drift.'}
]

const ARBRE='0 suspend inherited framing; 1 operative unit; 2 consequential polarity; 3 forces/dynamics; 4 space/topology/direction; 5 structure produced by 3 through 4; 6 only if justified, a genuinely new representation; 7 organizing axis; 8 conditional full potential; 9 observer/metric/model effects. Never force 6-8.'
const ARBRE9='0 suspend inherited framing; 1 operative unit; 2 consequential polarity; 3 forces/dynamics; 4 space/topology/direction; 5 structure produced by 3 through 4. BEFORE accepting any proposed 6, invoke 9 as an adversarial falsifier: actively search the supplied facts for observations that contradict, dissolve, or supersede the proposed representation; if such evidence exists, preserve it and revise or reject 6. 6 only if it survives that falsification, a genuinely new representation. 7 organizing axis. BEFORE accepting any 8, invoke 9 again: search for evidence that blocks, reverses, or limits the projected potential; 8 only after that challenge and only conditionally. 9 also checks observer/metric/model effects. Never preserve a compelling structure when the supplied evidence already falsifies it. Never force 6-8.'

async function callClaude(system:string,user:string,maxTokens=900):Promise<any>{
 const key=process.env.ANTHROPIC_API_KEY||''; if(!key) throw new Error('ANTHROPIC_API_KEY missing')
 const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':key,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model:MODEL,max_tokens:maxTokens,system,messages:[{role:'user',content:user}]})})
 if(!r.ok) throw new Error('Anthropic '+r.status+': '+(await r.text()).slice(0,200))
 const d=await r.json(); const t=Array.isArray(d?.content)?d.content.map((x:any)=>x?.type==='text'?x.text:'').join('').trim():''
 const c=t.replace(/^\x60\x60\x60(?:json)?\s*/i,'').replace(/\s*\x60\x60\x60$/i,'')
 try{return JSON.parse(c)}catch{
  const rr=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':key,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model:MODEL,max_tokens:1100,system:'Repair JSON only. Do not add content.',messages:[{role:'user',content:c||'{}'}]})})
  const x=await rr.json(); const q=Array.isArray(x?.content)?x.content.map((y:any)=>y?.type==='text'?y.text:'').join('').trim():''
  return JSON.parse(q.replace(/^\x60\x60\x60(?:json)?\s*/i,'').replace(/\s*\x60\x60\x60$/i,''))
 }
}
function cap(s:string,n:number){return String(s||'').trim().split(/\s+/).filter(Boolean).slice(0,n).join(' ')}
function completeEncoding(x:any){
 return x && typeof x['40']==='string' && x['40'].trim().length>0 &&
        typeof x['20']==='string' && x['20'].trim().length>0 &&
        typeof x['10']==='string' && x['10'].trim().length>0
}
async function encodeStrict(arm:Arm,situation:string){
 let x=await callClaude(ep(arm),situation,900)
 if(!completeEncoding(x)){
   x=await callClaude(
     ep(arm)+' IMPORTANT: all three keys 40, 20 and 10 MUST contain non-empty strings. Do not omit any key even if uncertain.',
     situation,
     1100
   )
 }
 if(!completeEncoding(x)) throw new Error('encoder incomplete for '+arm)
 return x
}
function ep(arm:Arm){
 const b='You are encoder AI #1. Describe ONLY facts and causal/structural relationships needed by another AI to decide later. Do NOT recommend an intervention, do NOT name or paraphrase any option, and do NOT use ACTION labels. Produce independent messages capped at 40, 20 and 10 words. JSON only: {"40":"...","20":"...","10":"..."}. '
 if(arm==='free')return b+'Compress freely.'
 if(arm==='generic')return b+'Preserve the single discriminating mechanism, constraints and uncertainty; delete generic background.'
 if(arm==='arbre9')return b+'Use this internal grammar to decide what must survive: '+ARBRE9+' Do not mention the grammar.'
 return b+'Use this internal grammar to decide what must survive: '+ARBRE+' Do not mention the grammar.'
}
function optionMap(idx:number,opts:Opt[]){
 const perms=[[0,1,2],[1,2,0],[2,0,1],[0,2,1],[2,1,0],[1,0,2]]
 const p=perms[idx%6], labs=['ACTION_A','ACTION_B','ACTION_C']
 const mapped:Record<string,Opt>={}
 for(let i=0;i<3;i++)mapped[labs[i]]=opts[p[i]]
 return mapped
}
async function decode(msg:string,mapped:Record<string,Opt>){
 return callClaude('You are decoder AI #2. Use ONLY the compressed message. Choose the best option. JSON only: {"chosen_action":"ACTION_A|ACTION_B|ACTION_C","confidence":0.0}.','MESSAGE:\n'+msg+'\nOPTIONS:\n'+Object.entries(mapped).map(([k,v])=>k+': '+v.text).join('\n'),500)
}
export async function GET(req:NextRequest){
 try{
  const idx=Math.max(0,Math.min(CASES.length-1,Math.trunc(Number(req.nextUrl.searchParams.get('case')||'0'))))
  const c=CASES[idx], arms:Arm[]=['free','generic','arbre','arbre9'], mapped=optionMap(idx,c.options)
  const expected=Object.entries(mapped).find(([,o])=>o.id===c.correctId)?.[0]||''
  const encRaw=await Promise.all(arms.map(a=>encodeStrict(a,c.situation)))
  const enc:Record<string,Record<Budget,string>>={}
  arms.forEach((a,i)=>enc[a]={'40':cap(encRaw[i]['40'],40),'20':cap(encRaw[i]['20'],20),'10':cap(encRaw[i]['10'],10)})
  const jobs:{arm:Arm,b:Budget,p:Promise<any>}[]=[]
  for(const a of arms)for(const b of BUDGETS)jobs.push({arm:a,b,p:decode(enc[a][b],mapped)})
  const dec=await Promise.all(jobs.map(x=>x.p)); const result:Record<string,any>={}
  jobs.forEach((x,i)=>{result[x.arm]||={};result[x.arm][x.b]={correct:dec[i].chosen_action===expected,chosen_action:dec[i].chosen_action,confidence:dec[i].confidence,words:enc[x.arm][x.b].split(/\s+/).filter(Boolean).length,message:enc[x.arm][x.b]}})
  return NextResponse.json({benchmark:'arbre-compression-hard-20-v2-nine-falsifier',case_index:idx,case_id:c.id,domain:c.domain,expected,discriminator:c.discriminator,result})
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'failed'},{status:500})}
}
