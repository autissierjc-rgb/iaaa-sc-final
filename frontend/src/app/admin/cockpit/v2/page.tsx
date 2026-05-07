import {
  V2_FOUNDATION_BRICKS,
  statusClass,
  statusLabel,
} from '@/lib/admin/v2CockpitContract'

const NEXT_STEPS = [
  'Brancher une route V2 separee, sans toucher a /sis.',
  'Afficher une generation contractuelle de test dans le cockpit.',
  'Ajouter Launch Learning Snapshot en base, avec suppression et mode sensible.',
  'Tester le benchmark canonique avant tout remplacement public.',
]

export default function V2CockpitPage() {
  const passive = V2_FOUNDATION_BRICKS.filter((brick) => brick.status === 'passive').length
  const wired = V2_FOUNDATION_BRICKS.filter((brick) => brick.status === 'wired').length

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-sky-400">Situation Card V2</p>
        <h1 className="mt-2 text-xl font-semibold text-white">Fondations visibles</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
          Cette page montre les briques V2 deja commitees. Elles existent dans le code,
          mais ne remplacent pas encore le flux public de <span className="font-mono text-gray-300">/sis</span>.
        </p>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4">
          <div className="text-2xl font-semibold text-white">{V2_FOUNDATION_BRICKS.length}</div>
          <div className="mt-1 text-xs text-gray-500">briques V2 commitees</div>
        </div>
        <div className="rounded-lg border border-sky-900 bg-sky-950/40 p-4">
          <div className="text-2xl font-semibold text-sky-200">{passive}</div>
          <div className="mt-1 text-xs text-sky-500">fondations passives</div>
        </div>
        <div className="rounded-lg border border-emerald-900 bg-emerald-950/30 p-4">
          <div className="text-2xl font-semibold text-emerald-200">{wired}</div>
          <div className="mt-1 text-xs text-emerald-500">briques branchees au flux public</div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {V2_FOUNDATION_BRICKS.map((brick) => (
          <article key={brick.id} className="rounded-lg border border-gray-800 bg-gray-900/60 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-white">{brick.label}</h2>
                <div className="mt-1 font-mono text-[11px] text-gray-600">{brick.layer}</div>
              </div>
              <span className={`shrink-0 rounded border px-2 py-1 text-[11px] ${statusClass(brick.status)}`}>
                {statusLabel(brick.status)}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-gray-400">{brick.note}</p>
            <div className="mt-4 rounded border border-gray-800 bg-gray-950 p-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-gray-600">Commit</div>
              <div className="mt-1 font-mono text-xs text-gray-300">{brick.commit}</div>
              <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-gray-600">Fichiers</div>
              <ul className="mt-2 space-y-1">
                {brick.files.map((file) => (
                  <li key={file} className="font-mono text-[11px] text-gray-500">{file}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-gray-800 bg-gray-900/60 p-5">
        <h2 className="text-sm font-semibold text-white">Prochain branchement prudent</h2>
        <ol className="mt-4 space-y-3 text-sm text-gray-400">
          {NEXT_STEPS.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="font-mono text-xs text-gray-600">{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
