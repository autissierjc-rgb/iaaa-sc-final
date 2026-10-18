
import { NextResponse } from 'next/server'
const MODEL=process.env.ANTHROPIC_BENCHMARK_MODEL||'claude-sonnet-5-5'

const TRAIN=[
`CASE A — thermal relay
t1 temp 19.1, heater ON. t2 rises to 20.4, heater remains ON. t3 crosses 21.0, controller switches heater OFF. t4 cools to 20.4, heater remains OFF. Same observed temperature 20.4 occurs with different relay state depending on path.`,
`CASE B — service queue
t1 arrivals 80/min, service 100/min, queue small. t2 short burst to 140/min grows queue. t3 arrivals return to 80 but queue stays large and latency remains high while backlog drains. Same current arrival rate can mean normal service or recovery from overload.`,
`CASE C — material loading
t1 load rises within elastic range and strain returns when unloaded. t2 later load crosses yield threshold. t3 load returns to the earlier value but residual strain remains. Same present load now corresponds to a different material state because the path crossed a threshold.`,
`CASE D — epidemic
t1 cases rise with Rt 1.3. t2 intervention lowers transmission. t3 current case count equals an earlier count, but Rt is now 0.8 and incidence is falling. Same case count has different future implications because the trajectory changed.`
]

async function call(system:string,user:string){
 const key=process.env.ANTHROPIC_API_KEY||''; if(!key) throw new Error('ANTHROPIC_API_KEY missing')
 const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':key,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model:MODEL,max_tokens:1800,system,messages:[{role:'user',content:user}]})})
 if(!r.ok) throw new Error('Anthropic '+r.status+': '+(await r.text()).slice(0,220))
 const d=await r.json(); return Array.isArray(d?.content)?d.content.map((x:any)=>x?.type==='text'?x.text:'').join('').trim():''
}
export async function GET(){
 try{
  const system='You are designing a model-agnostic representation for transformations in dynamical systems. You have NOT been given any existing framework. Infer the smallest reusable schema that would preserve what matters for future inference when current snapshots can be misleading. Do not name or imitate any known framework. Use at most 7 fields. Make each field operational and non-overlapping. Return concise plain text.'
  const out=await call(system,TRAIN.join('\n\n'))
  return NextResponse.json({model:MODEL,schema:out})
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'failed'},{status:500})}
}
