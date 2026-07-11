// SC calibration benchmark runner.
// Runs the 10 canonical situations from scCalibrationBenchmark.md through the
// real /api/generate route (generate_full) and collects the cards for scoring.
// Usage: node scripts/sc-benchmark.mjs --base-url=http://localhost:3101 [--out=DIR]

import fs from 'node:fs'
import path from 'node:path'

const CASES = [
  {
    id: 'humanitaire-guerre',
    domain_attendu: 'humanitarian',
    input: "Notre ONG doit décider si elle maintient sa mission médicale près de la ligne de front, où les bombardements se rapprochent : que faut-il regarder pour trancher ?",
  },
  {
    id: 'management-comex',
    domain_attendu: 'management',
    input: "Un dirigeant découvre une fracture silencieuse dans son comité exécutif : deux clans se forment autour de la stratégie, comment lire la situation avant le prochain conseil ?",
  },
  {
    id: 'gouvernance-locale',
    domain_attendu: 'governance',
    input: "Une commune hésite à accepter un projet industriel créateur d'emplois mais contesté par une partie des habitants : comment évaluer la situation ?",
  },
  {
    id: 'business-dependance',
    domain_attendu: 'startup_vc',
    input: "Une startup vient de signer son plus gros client, qui représente désormais 60 % de son chiffre d'affaires : comment lire cette dépendance ?",
  },
  {
    id: 'personnel-familial',
    domain_attendu: 'personal',
    input: "Notre famille doit décider du placement de notre père âgé qui perd en autonomie, entre maintien à domicile et établissement : comment aborder la décision ?",
  },
  {
    id: 'geopolitique-energie',
    domain_attendu: 'geopolitics',
    input: "Un pays allié hésite à rompre un accord énergétique devenu politiquement toxique avec son fournisseur historique : quelle est la dynamique ?",
  },
  {
    id: 'societe-institution',
    domain_attendu: 'governance',
    input: "Une école fait face à une polémique publique après une décision disciplinaire contestée : comment la situation peut-elle évoluer ?",
  },
  {
    id: 'tech-organisation',
    domain_attendu: 'professional',
    input: "Une entreprise déploie une IA qui accélère le travail mais désorganise les équipes : comment lire cette transformation ?",
  },
  {
    id: 'politique-collectif',
    domain_attendu: 'governance',
    input: "Un mouvement citoyen grandit très vite et perd sa cohérence interne : que regarder pour comprendre s'il va se structurer ou éclater ?",
  },
  {
    id: 'produit-confiance',
    domain_attendu: 'startup_vc',
    input: "Une plateforme numérique doit arbitrer entre croissance rapide et confiance des utilisateurs après un incident de données : comment évaluer l'arbitrage ?",
  },
]

function argValue(name) {
  const prefix = `--${name}=`
  const found = process.argv.slice(2).find((arg) => arg.startsWith(prefix))
  return found ? found.slice(prefix.length) : undefined
}

const baseUrl = String(argValue('base-url') || 'http://localhost:3101').replace(/\/+$/, '')
const outDir = argValue('out') || 'benchmark-results'
fs.mkdirSync(outDir, { recursive: true })

function sectionsSummary(writing) {
  const sections = writing?.approfondir?.sections_fr ?? []
  return sections.map((section) => ({
    title: section.title,
    words: String(section.body ?? '').split(/\s+/).filter(Boolean).length,
  }))
}

async function runCase(testCase) {
  const started = Date.now()
  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        situation: testCase.input,
        original_situation: testCase.input,
        mode: 'generate_full',
      }),
      signal: AbortSignal.timeout(120000),
    })
    const payload = await response.json()
    const sc = payload.sc ?? {}
    const writing = sc.writing_contract ?? {}
    const notes = (writing.trace?.notes ?? []).filter((note) => /diamond|repair|anchored|provisional/.test(note))
    fs.writeFileSync(path.join(outDir, `${testCase.id}.json`), JSON.stringify(payload, null, 1))
    return {
      id: testCase.id,
      gate: payload.gate,
      duration_s: Math.round((Date.now() - started) / 100) / 10,
      domain: sc.coverage_check?.domain,
      domain_attendu: testCase.domain_attendu,
      sources: Array.isArray(sc.resources) ? sc.resources.length : 0,
      resources_status: sc.resources_status,
      writer: notes.join(' | '),
      lecture_words: String(writing.lecture?.text_fr ?? sc.lecture_systeme_fr ?? '').split(/\s+/).filter(Boolean).length,
      sections: sectionsSummary(writing),
    }
  } catch (error) {
    return {
      id: testCase.id,
      gate: 'ERROR',
      duration_s: Math.round((Date.now() - started) / 100) / 10,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

const summary = []
for (const testCase of CASES) {
  process.stdout.write(`${testCase.id} ... `)
  const result = await runCase(testCase)
  summary.push(result)
  console.log(`${result.gate} ${result.duration_s}s sources=${result.sources ?? '?'} domaine=${result.domain ?? '?'}`)
}

fs.writeFileSync(path.join(outDir, '_summary.json'), JSON.stringify(summary, null, 1))
console.log(`\nRésultats écrits dans ${outDir}/`)
