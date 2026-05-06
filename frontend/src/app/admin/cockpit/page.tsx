import {
  COCKPIT_TRACKS,
  reliabilityClass,
  reliabilityLabel,
} from '@/lib/admin/cockpitContract'

const FOUNDATION_STEPS = [
  'Tracer chaque generation Next: date, statut, modele, domaine, ressources, latence et cout estime.',
  'Relier les generations a un utilisateur quand il est connecte, sans bloquer les usages publics.',
  'Mesurer les echecs: URL non extraite, ressources absentes, generation tombee en fallback, carte regeneree.',
  'Afficher les signaux qualite: question reformalisee, theatre concret present, sources disponibles, retours utilisateur.',
]

export default function AdminCockpitPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-white">Cockpit</h1>
        <p className="mt-1 max-w-3xl text-xs leading-5 text-gray-500">
          Etat de branchement du poste de pilotage. Cette page separe ce qui est deja fiable,
          ce qui est partiel, et ce qui doit etre reconstruit autour du moteur SIS actuel.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        {COCKPIT_TRACKS.map((track) => (
          <div key={track.id} className="rounded-lg border border-gray-800 bg-gray-900/60 p-5">
            <h2 className="text-sm font-semibold text-white">{track.label}</h2>
            <div className="mt-4 space-y-3">
              {track.signals.map((signal) => (
                <div key={signal.id} className="rounded border border-gray-800 bg-gray-950 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-gray-100">{signal.label}</div>
                      <div className="mt-1 font-mono text-[11px] text-gray-600">{signal.source}</div>
                    </div>
                    <span className={`shrink-0 rounded border px-2 py-1 text-[11px] ${reliabilityClass(signal.reliability)}`}>
                      {reliabilityLabel(signal.reliability)}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-gray-500">{signal.note}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-gray-800 bg-gray-900/60 p-5">
        <h2 className="text-sm font-semibold text-white">Prochaine fondation technique</h2>
        <ol className="mt-4 space-y-2 text-sm text-gray-400">
          {FOUNDATION_STEPS.map((step, index) => (
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
