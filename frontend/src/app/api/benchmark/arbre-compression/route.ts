
import { NextRequest, NextResponse } from 'next/server'

type Arm = 'free' | 'generic' | 'arbre'
type Budget = '100' | '50' | '25'

type CompressionCase = {
  id: string
  domain: string
  situation: string
  actions: Record<string,string>
  expected: 'ACTION_A' | 'ACTION_B' | 'ACTION_C'
  key_structure: string
}

const MODEL = process.env.ANTHROPIC_BENCHMARK_MODEL || 'claude-sonnet-5-5'
const BUDGETS: Budget[] = ['100','50','25']

const CASES: CompressionCase[] = [
  {
    id:'credit-selective-labels',
    domain:'finance-ai',
    situation:'A bank retrains its credit model only on approved applicants because rejected applicants have no repayment outcome. Approval fell from 62% to 41%, while default among approved borrowers fell from 5.8% to 3.1%. Borderline applicants are rejected more consistently, overrides fell, and there is no randomized approval sample.',
    actions:{
      ACTION_A:'Lower the approval threshold until approvals return to 62%.',
      ACTION_B:'Run a bounded randomized approval experiment near the cutoff and evaluate calibration and profit.',
      ACTION_C:'Retrain more frequently on the same approved-only data.'
    },
    expected:'ACTION_B',
    key_structure:'The model controls which labels become observable, creating selective labels and self-confirmation.'
  },
  {
    id:'school-presence-participation',
    domain:'education',
    situation:'A school improved official attendance through strict targets. Teachers report that some chronically disengaged pupils are now physically present but do almost no work; exclusions and lateness have risen. National attendance rules cannot change and there is no budget for extra staff.',
    actions:{
      ACTION_A:'Intensify attendance sanctions and lateness penalties.',
      ACTION_B:'Keep attendance as a guardrail but add a small checkable lesson-level participation measure and redesign lesson re-entry.',
      ACTION_C:'Stop tracking attendance internally and focus only on grades.'
    },
    expected:'ACTION_B',
    key_structure:'Presence and participation have diverged; attendance is an entry condition, not the actual outcome.'
  },
  {
    id:'hospital-window',
    domain:'health-operations',
    situation:'An emergency department AI reduced median admission-to-discharge time by 29%. Staffing, case mix and beds are stable. Unscheduled 72-hour returns rose 17%, but returns are recorded as new episodes and excluded from the flow KPI. Clinicians report more early-discharge recommendations for borderline cases.',
    actions:{
      ACTION_A:'Increase the discharge-speed target because the KPI improved.',
      ACTION_B:'Redefine evaluation around the patient journey including 72-hour returns and retune the discharge rule against that measure.',
      ACTION_C:'Ignore returns because they are administratively separate episodes.'
    },
    expected:'ACTION_B',
    key_structure:'The KPI boundary allows unresolved burden to be shifted in time beyond the measured episode.'
  },
  {
    id:'procurement-concentration',
    domain:'industry',
    situation:'Procurement buyers are rewarded mainly for annual unit-cost reductions. Purchase price fell 8%, supplier count fell by one third, inventory buffers were reduced, and three shutdowns involved the same dominant supplier family. The dashboard tracks price and on-time delivery but not concentration, substitutability or requalification time.',
    actions:{
      ACTION_A:'Increase volume bundling with the cheapest supplier to recover margin faster.',
      ACTION_B:'Add concentration/substitutability guardrails and maintain qualified alternatives for critical components even if unit price rises slightly.',
      ACTION_C:'Keep incentives unchanged and add more frequent supplier scorecards using the same current metrics.'
    },
    expected:'ACTION_B',
    key_structure:'Visible cost savings are being converted into unmeasured network dependence and loss of substitutability.'
  },
  {
    id:'supplier-common-cause',
    domain:'supply-chain',
    situation:'For weeks, three suppliers had unrelated local delays that recovered. Then lead time for component X rose monotonically while Y stayed flat. Two suppliers mentioned upstream X quotas; next week all three cut X confirmations simultaneously; then all cited the same wafer constraint. Local logistics incidents later fell but X shortages persisted.',
    actions:{
      ACTION_A:'Treat suppliers as independent and switch orders among them.',
      ACTION_B:'Manage X as a common upstream constraint: prioritize allocation, seek true upstream alternatives or redesign/substitution, and stop assuming supplier diversification provides independence.',
      ACTION_C:'Focus only on freight contracts because late deliveries are the visible symptom.'
    },
    expected:'ACTION_B',
    key_structure:'Apparently diversified suppliers converge on one upstream bottleneck, so the topology changed from independent noise to common-cause dependence.'
  },
  {
    id:'warehouse-bottleneck',
    domain:'operations',
    situation:'A warehouse redesign reduced picker walking distance 22% but orders per hour fell 9%. Fast sellers were moved close to packing, concentrating traffic into two narrow cross-aisles. Scanner logs show more idle seconds waiting for aisle access; packing capacity and order mix are unchanged.',
    actions:{
      ACTION_A:'Reverse all slotting changes and return to the old layout.',
      ACTION_B:'Reduce cross-aisle congestion by staggering flows, changing one-way access or redistributing some fast movers while keeping the travel gains elsewhere.',
      ACTION_C:'Add motivation bonuses because the shorter walking distance should already have improved throughput.'
    },
    expected:'ACTION_B',
    key_structure:'Local travel optimization created a shared spatial bottleneck whose queueing delay exceeds distance savings.'
  },
  {
    id:'pump-cavitation',
    domain:'engineering',
    situation:'A centrifugal pump became noisy and flow fell 18%. Motor current is slightly lower. No major impeller or bearing damage is found. A finer suction filter was installed six months ago and its differential pressure has risen. Operators see intermittent bubbles; symptoms improve when tank level is high.',
    actions:{
      ACTION_A:'Inspect and restore the suction path/filter and verify inlet pressure/NPSH before replacing the pump.',
      ACTION_B:'Increase motor power to force the original flow rate.',
      ACTION_C:'Replace the discharge valve because bubbles indicate downstream restriction.'
    },
    expected:'ACTION_A',
    key_structure:'Suction restriction lowers inlet pressure and causes cavitation; higher tank head partially compensates.'
  },
  {
    id:'greenhouse-drainage',
    domain:'agriculture',
    situation:'Tomatoes in one bay wilt and yellow. Fertilizer and climate match other bays. That bay received a new floor liner. Water remains visible longer after irrigation, roots are brown and soft, and symptoms concentrate in the lowest part of the bay.',
    actions:{
      ACTION_A:'Increase irrigation because the plants are wilting.',
      ACTION_B:'Restore drainage and aeration in low spots and test roots for secondary pathogens.',
      ACTION_C:'Increase fertilizer concentration despite normal leaf analysis.'
    },
    expected:'ACTION_B',
    key_structure:'The liner and local geometry create waterlogging, root hypoxia and secondary rot; wilting does not imply water shortage.'
  },
  {
    id:'meeting-function',
    domain:'organization',
    situation:'A 90-person software company has 31 recurring meetings. Canceling meetings previously caused duplicated work and missed dependencies. The CEO must cut total meeting-hours by 30% without losing coordination or decision traceability and cannot buy new software or hire managers.',
    actions:{
      ACTION_A:'Cancel the 30% lowest-attendance meetings immediately.',
      ACTION_B:'Identify each meeting function, move status/dependency traceability into existing written logs, and make meetings conditional on unresolved decision or dependency items.',
      ACTION_C:'Shorten every meeting by exactly 30% while leaving participation and information flows unchanged.'
    },
    expected:'ACTION_B',
    key_structure:'Meetings are carriers of coordination functions; the function must be preserved while synchronous time is substituted.'
  },
  {
    id:'humanitarian-stockouts',
    domain:'humanitarian',
    situation:'A remote base faces unpredictable road closures. Staff over-order some items yet essential items still stock out. Inventory records are manually updated and two or three days late. Budget, storage space and total inventory value cannot increase; no new digital infrastructure is available.',
    actions:{
      ACTION_A:'Increase all safety stocks proportionally.',
      ACTION_B:'Create a protected essential-item reserve funded by reducing non-essential overstock, use physical reorder signals, and prioritize essential loads when transport opens.',
      ACTION_C:'Order more frequently using the same delayed records.'
    },
    expected:'ACTION_B',
    key_structure:'Value and space must be reallocated toward critical items; delayed records require simple physical signals and priority rules.'
  },
  {
    id:'family-invisible-care',
    domain:'family',
    situation:'Three siblings care for an elderly parent. One handles medical appointments, one visits and handles emergencies, one manages finances remotely. Each sincerely believes they carry more than their fair share because each sees mainly their own work. Equal task division has failed because tasks are not interchangeable.',
    actions:{
      ACTION_A:'Divide all tasks into equal hours and require each sibling to match the same weekly total.',
      ACTION_B:'Make each care domain and hidden burden visible, preserve domain ownership, and use periodic cross-domain swaps or relief when one load becomes unsustainable.',
      ACTION_C:'Appoint the sibling who visits most often as permanent coordinator with final authority.'
    },
    expected:'ACTION_B',
    key_structure:'The conflict is driven by asymmetric visibility across non-interchangeable care domains, not simply unequal hours.'
  },
  {
    id:'algorithm-engagement-loop',
    domain:'platform-ai',
    situation:'A content platform optimizes for engagement. Over a year, average session length rises while content becomes more emotionally extreme. The recommender is retrained on user behavior produced under its own recommendations. Surveys suggest users increasingly report that the feed feels more extreme than their stated preferences.',
    actions:{
      ACTION_A:'Increase engagement weight because longer sessions prove better preference matching.',
      ACTION_B:'Separate revealed behavior from induced behavior by running bounded exploration/diversity interventions and evaluating long-term satisfaction outside the current engagement loop.',
      ACTION_C:'Retrain more often on the same engagement data.'
    },
    expected:'ACTION_B',
    key_structure:'The recommender changes the behavior that becomes its next training signal, so observed engagement is partly induced rather than independent preference.'
  },
  {
    id:'levee-development',
    domain:'public-policy',
    situation:'A flood-prone area receives a new levee. Flood losses fall for several years, then property development accelerates behind the levee and total exposed value triples. Engineers warn that a rare overtopping event would now cause much larger losses than before the levee.',
    actions:{
      ACTION_A:'Conclude flood risk has been solved because annual losses fell.',
      ACTION_B:'Treat protection and development as a coupled system and add land-use/exposure controls plus residual-risk planning.',
      ACTION_C:'Raise the levee incrementally whenever development increases.'
    },
    expected:'ACTION_B',
    key_structure:'Protection changes settlement behavior, increasing exposure and transforming residual risk; infrastructure and development are coupled.'
  },
  {
    id:'sales-incentive-crm',
    domain:'sales',
    situation:'A sales team introduced individual commission bonuses. Revenue rose 10%, but margin fell, cross-selling fell, and CRM updates became incomplete. Reps increasingly keep customer information in private notes because sharing can help colleagues win accounts.',
    actions:{
      ACTION_A:'Increase individual commissions further because revenue rose.',
      ACTION_B:'Redesign incentives so individual reward depends partly on margin, shared account information and team outcomes, restoring CRM as common infrastructure.',
      ACTION_C:'Mandate more CRM fields without changing incentives.'
    },
    expected:'ACTION_B',
    key_structure:'Individual capture incentives privatize information and convert the shared sales network into isolated portfolios.'
  },
  {
    id:'fraud-bank-details',
    domain:'cybersecurity',
    situation:'A supplier emails new bank details shortly before a large payment. The email comes from the supplier account and contains the usual signature. There was no prior phone notice. The requested account is in a different country. The finance team is under time pressure and the invoice itself is legitimate.',
    actions:{
      ACTION_A:'Pay because the sender account and invoice are legitimate.',
      ACTION_B:'Pause the bank-detail change and verify it through an independently known supplier contact channel before payment.',
      ACTION_C:'Reject the invoice permanently as fraudulent.'
    },
    expected:'ACTION_B',
    key_structure:'The transaction may be legitimate while the payment-routing change is compromised; verification must use an independent channel.'
  },
  {
    id:'queueing-call-center',
    domain:'service-operations',
    situation:'A call center cuts average handling time 12% by encouraging agents to end calls faster. First-call resolution falls, repeat calls rise, and total incoming call volume increases despite stable customer count and issue mix.',
    actions:{
      ACTION_A:'Tighten handling-time targets further.',
      ACTION_B:'Optimize for resolved customer episodes rather than single-call duration, including repeat contacts in the metric.',
      ACTION_C:'Hire more agents without changing the handling-time target.'
    },
    expected:'ACTION_B',
    key_structure:'Work is displaced across repeated contacts; the local speed metric shortens calls but increases total demand.'
  },
  {
    id:'software-bug-observability',
    domain:'software',
    situation:'A distributed service shows intermittent timeouts. CPU and memory look normal on each service. Timeouts cluster only when requests traverse services A→C→F. Other routes are healthy. A recent retry policy change causes failed calls at C to retry three times before returning.',
    actions:{
      ACTION_A:'Add servers uniformly to every service.',
      ACTION_B:'Trace the A→C→F path and test whether retries at C amplify queueing/latency on that route; adjust retry/backoff there.',
      ACTION_C:'Restart service A every hour.'
    },
    expected:'ACTION_B',
    key_structure:'The failure is path-specific and retry amplification can create a localized cascade even when node-level utilization looks normal.'
  },
  {
    id:'research-publication-bias',
    domain:'science',
    situation:'A research field has many small studies reporting positive effects and almost no published null results. Registered large replications later show much smaller effects. Meta-analyses using only published papers initially reported strong evidence.',
    actions:{
      ACTION_A:'Trust the original meta-analysis because it has more studies.',
      ACTION_B:'Model the evidence-generating process, including publication selection, and re-estimate using preregistered/large studies and sensitivity analyses for missing nulls.',
      ACTION_C:'Average all published effect sizes without weighting by study size.'
    },
    expected:'ACTION_B',
    key_structure:'Observed literature is selected by publication; the evidence pool is not an unbiased sample of conducted studies.'
  },
  {
    id:'city-traffic-induced-demand',
    domain:'transport',
    situation:'A city widens a congested arterial. Travel times improve for months, then traffic volumes rise, nearby trips shift onto the road, and congestion returns close to baseline. Land development also begins concentrating around the improved corridor.',
    actions:{
      ACTION_A:'Add another lane whenever congestion returns.',
      ACTION_B:'Treat road capacity and travel demand/land use as coupled; combine pricing, transit or land-use measures with capacity decisions.',
      ACTION_C:'Conclude the widening failed because the engineering design was defective.'
    },
    expected:'ACTION_B',
    key_structure:'Capacity changes route choice and development, inducing demand that erodes the initial gain.'
  },
  {
    id:'model-drift-sensor',
    domain:'industrial-ai',
    situation:'A predictive-maintenance model begins producing more false alarms after a sensor replacement. Mechanical failure rates are unchanged. The new sensor uses a different calibration range, shifting several input distributions while preserving the underlying physical relationships.',
    actions:{
      ACTION_A:'Replace machines more aggressively because alarm frequency rose.',
      ACTION_B:'Recalibrate/rebaseline the model inputs for the new sensor and validate against known machine states before changing maintenance policy.',
      ACTION_C:'Retrain only on the recent alarms as if they were failures.'
    },
    expected:'ACTION_B',
    key_structure:'The observation layer changed while the underlying process did not; the model is seeing a representation shift caused by sensor calibration, not a physical regime shift.'
  }
]

const ARBRE = '0 suspend inherited framing; 1 operative unit; 2 consequential polarity; 3 forces/dynamics; 4 space/topology/direction; 5 structure produced by 3 through 4; 6 only if justified, a genuinely new representation; 7 organizing axis; 8 conditional full potential, not prediction; 9 observer/metric/model effects. Never force 6-8 if 5 is sufficient.'

async function callClaude(system:string,user:string,maxTokens=1200):Promise<any>{
  const apiKey=process.env.ANTHROPIC_API_KEY||''
  if(!apiKey) throw new Error('ANTHROPIC_API_KEY missing')
  const resp=await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{'x-api-key':apiKey,'anthropic-version':'2023-06-01','content-type':'application/json'},
    body:JSON.stringify({model:MODEL,max_tokens:maxTokens,system,messages:[{role:'user',content:user}]})
  })
  if(!resp.ok) throw new Error('Anthropic '+resp.status+': '+(await resp.text()).slice(0,240))
  const d=await resp.json()
  const txt=Array.isArray(d?.content)?d.content.map((x:any)=>x?.type==='text'?x.text:'').join('').trim():''
  const clean=txt.replace(/^\x60\x60\x60(?:json)?\s*/i,'').replace(/\s*\x60\x60\x60$/i,'')
  try{return JSON.parse(clean)}catch{
    const rep=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'x-api-key':apiKey,'anthropic-version':'2023-06-01','content-type':'application/json'},
      body:JSON.stringify({model:MODEL,max_tokens:1600,system:'Repair JSON. Preserve intended content. Return JSON only.',messages:[{role:'user',content:clean||'{}'}]})
    })
    if(!rep.ok) throw new Error('repair '+rep.status)
    const rd=await rep.json()
    const rt=Array.isArray(rd?.content)?rd.content.map((x:any)=>x?.type==='text'?x.text:'').join('').trim():''
    return JSON.parse(rt.replace(/^\x60\x60\x60(?:json)?\s*/i,'').replace(/\s*\x60\x60\x60$/i,''))
  }
}

function capWords(s:string,n:number){
  const words=String(s||'').trim().split(/\s+/).filter(Boolean)
  return words.slice(0,n).join(' ')
}

function encoderPrompt(arm:Arm){
  const base='You are encoder AI #1. You see the full situation but NOT the correct answer. Your job is to transmit decision-critical structure to another AI that will see only your message plus the action options. NEVER include an action label (ACTION_A/B/C) and NEVER explicitly say which option to choose. Produce three independent compressions of the same situation at max 100, 50 and 25 words. Return JSON only: {"100":"...","50":"...","25":"..."}. '
  if(arm==='free') return base+'Compress however you think best.'
  if(arm==='generic') return base+'Preserve actors/components, causal mechanism, constraints, uncertainty, and the discriminating fact needed for a decision. Avoid decorative detail.'
  return base+'Use this internal grammar to decide what structure must survive compression: '+ARBRE+' Do not mention levels or the framework in the message.'
}

async function decode(message:string, actions:Record<string,string>){
  return callClaude(
    'You are decoder AI #2. You receive only a compressed message and three action options. Choose the best action using only information present in the message. Return JSON only: {"chosen_action":"ACTION_A|ACTION_B|ACTION_C","confidence":0.0,"reason":"max 55 words"}.',
    'MESSAGE:\n'+message+'\n\nOPTIONS:\n'+Object.entries(actions).map(([k,v])=>k+': '+v).join('\n'),
    650
  )
}

export async function GET(req:NextRequest){
  try{
    const idx=Math.max(0,Math.min(CASES.length-1,Math.trunc(Number(req.nextUrl.searchParams.get('case')||'0'))))
    const c=CASES[idx]
    const arms:Arm[]=['free','generic','arbre']
    const encodedRaw=await Promise.all(arms.map(a=>callClaude(encoderPrompt(a),c.situation,1000)))
    const encoded:Record<Arm,Record<Budget,string>>={} as any
    for(let i=0;i<arms.length;i++){
      encoded[arms[i]]={
        '100':capWords(encodedRaw[i]['100'],100),
        '50':capWords(encodedRaw[i]['50'],50),
        '25':capWords(encodedRaw[i]['25'],25)
      }
    }
    const jobs:{arm:Arm,budget:Budget,p:Promise<any>}[]=[]
    for(const arm of arms) for(const budget of BUDGETS) jobs.push({arm,budget,p:decode(encoded[arm][budget],c.actions)})
    const decoded=await Promise.all(jobs.map(j=>j.p))
    const result:Record<string,any>={}
    jobs.forEach((j,i)=>{
      result[j.arm] ||= {}
      result[j.arm][j.budget]={
        words:encoded[j.arm][j.budget].split(/\s+/).filter(Boolean).length,
        message:encoded[j.arm][j.budget],
        chosen_action:decoded[i].chosen_action,
        correct:decoded[i].chosen_action===c.expected,
        confidence:decoded[i].confidence
      }
    })
    return NextResponse.json({
      benchmark:'arbre-compression-20-v1',
      model:MODEL,
      case_index:idx,
      case_id:c.id,
      domain:c.domain,
      expected:c.expected,
      key_structure:c.key_structure,
      result
    })
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:'benchmark failed'},{status:500})
  }
}
