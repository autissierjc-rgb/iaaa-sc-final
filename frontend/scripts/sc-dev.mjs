#!/usr/bin/env node
// Outil de développement local : une seule commande stable pour les deux
// gestes répétés du chantier — reconstruire/relancer le serveur local, et
// sonder une question en inspectant la carte produite.
//
//   node scripts/sc-dev.mjs restart
//   node scripts/sc-dev.mjs probe "ma question" [public_fast|generate_full]
//
// Motivation : les chaînes de commandes composées ne correspondent à aucun
// motif d'autorisation et redemandent une permission à chaque fois.

import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const PORT = process.env.PORT || '3101'
const BASE = `http://localhost:${PORT}`
const ROOT = process.cwd()

function loadEnvLocal() {
  const file = path.join(ROOT, '.env.local')
  if (!fs.existsSync(file)) return {}
  const env = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match) env[match[1]] = match[2].trim().replace(/^"|"$/g, '')
  }
  return env
}

async function isUp() {
  try {
    const response = await fetch(BASE, { signal: AbortSignal.timeout(3000) })
    return response.ok || response.status < 500
  } catch {
    return false
  }
}

async function waitUntilUp(attempts = 40) {
  for (let i = 0; i < attempts; i += 1) {
    if (await isUp()) return true
    await new Promise((resolve) => setTimeout(resolve, 3000))
  }
  return false
}

function killPort() {
  spawnSync('powershell', [
    '-NoProfile', '-Command',
    `Get-NetTCPConnection -LocalPort ${PORT} -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -Confirm:$false }`,
  ], { stdio: 'ignore' })
}

function copyStaticAssets() {
  // Next.js en mode standalone ne copie ni .next/static ni public : sans eux
  // la page s'affiche mais rien n'est interactif.
  const from = path.join(ROOT, '.next', 'static')
  const to = path.join(ROOT, '.next', 'standalone', '.next', 'static')
  if (fs.existsSync(from)) fs.cpSync(from, to, { recursive: true, force: true })
  const publicFrom = path.join(ROOT, 'public')
  const publicTo = path.join(ROOT, '.next', 'standalone', 'public')
  if (fs.existsSync(publicFrom)) fs.cpSync(publicFrom, publicTo, { recursive: true, force: true })
}

async function restart({ build = true } = {}) {
  killPort()
  if (build) {
    console.log('build…')
    const result = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true })
    if (result.status !== 0) process.exit(result.status ?? 1)
  }
  copyStaticAssets()
  const child = spawn('node', ['.next/standalone/server.js'], {
    cwd: ROOT,
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, ...loadEnvLocal(), PORT },
  })
  child.unref()
  const up = await waitUntilUp()
  console.log(up ? `serveur prêt sur ${BASE} (pid ${child.pid})` : 'serveur indisponible')
  if (!up) process.exit(1)
}

const TEMPLATE_MARKERS = [
  /lecture utile consiste/i,
  /passage entre tension visible/i,
  /cesse d.être seulement comment/i,
  /statut reste .{0,12}plausible/i,
]

const PUBLIC_FIELDS = [
  'insight_fr', 'main_vulnerability_fr', 'asymmetry_fr', 'key_signal_fr',
  'lecture_systeme_fr', 'approfondir_fr', 'constraints_fr', 'uncertainties_fr',
  'movements_fr', 'trajectories', 'cap',
]

async function probe(question, mode = 'generate_full') {
  const started = Date.now()
  const response = await fetch(`${BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ situation: question, original_situation: question, mode }),
    signal: AbortSignal.timeout(240000),
  })
  const payload = await response.json()
  const seconds = ((Date.now() - started) / 1000).toFixed(1)
  const sc = payload.sc ?? {}
  const writer = sc.diamond_architect_writer ?? {}

  console.log(`durée ${seconds}s | gate ${payload.gate} | plume ${writer.status ?? 'n/a'}`)
  const sources = Array.isArray(sc.resources) ? sc.resources : []
  console.log(`sources ${sources.length}`)
  for (const source of sources) {
    const when = source.date ? String(source.date).slice(0, 16) : 'sans date'
    console.log(`   ${when} | ${source.source} | ${String(source.title ?? '').slice(0, 62)}`)
  }

  const leaks = []
  for (const field of PUBLIC_FIELDS) {
    const text = JSON.stringify(sc[field] ?? '')
    if (TEMPLATE_MARKERS.some((marker) => marker.test(text))) leaks.push(field)
  }
  console.log(`gabarit dans le texte public : ${leaks.length === 0 ? 'aucun' : leaks.join(', ')}`)
  console.log(`approfondir_fr : ${String(sc.approfondir_fr ?? '').length} caractères`)

  const out = path.join(ROOT, 'benchmark-results', 'sc-dev-probe.json')
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, JSON.stringify(payload, null, 1))
  console.log(`carte complète écrite dans ${path.relative(ROOT, out)}`)
}

const [command, ...args] = process.argv.slice(2)
if (command === 'restart') {
  await restart({ build: !args.includes('--no-build') })
} else if (command === 'probe') {
  await probe(args[0] ?? 'Comment la situation évolue-t-elle ?', args[1])
} else {
  console.log('usage: node scripts/sc-dev.mjs restart [--no-build] | probe "question" [mode]')
  process.exit(1)
}
