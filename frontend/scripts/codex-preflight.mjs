import fs from 'node:fs'
import path from 'node:path'

const requiredFiles = [
  'AGENTS.md',
  'src/lib/governance/codexSessionProtocol.md',
  'src/lib/governance/scV2BrickMap.md',
]

const missing = requiredFiles.filter((file) => !fs.existsSync(path.resolve(file)))

if (missing.length > 0) {
  console.error('Codex preflight failed. Missing required protocol file(s):')
  for (const file of missing) console.error(`- ${file}`)
  process.exit(1)
}

console.log(`
Codex preflight OK.

Before coding, answer explicitly:

Symptome observe :
Couche canonique responsable :
Brique existante verifiee :
Action : brancher / renforcer / tester / documenter
Ce que je ne vais pas faire :

Rules:
- No special-case patch before canonical mapping.
- Branch, strengthen, test, or document an existing brick first.
- Keep commits scoped to one canonical layer.
`)
