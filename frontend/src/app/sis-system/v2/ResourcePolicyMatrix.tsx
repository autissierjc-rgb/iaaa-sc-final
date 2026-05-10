import { runResourcePolicyBenchmark } from '@/lib/resources/ResourcePolicyBenchmark'

function policyColor(policy: string) {
  if (policy === 'internal_context_ok') return '#1D9E75'
  if (policy === 'url_extract_required') return '#B23A3A'
  return '#A66B00'
}

export default async function ResourcePolicyMatrix() {
  const rows = await runResourcePolicyBenchmark()
  const passed = rows.filter((row) => row.passed).length

  return (
    <section style={{ background: '#fff', border: '1px solid #E1D6C2', borderRadius: 8, padding: 18, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 760 }}>
          <h2 style={{ margin: 0, fontSize: 15 }}>Politique ressources rapides</h2>
          <p style={{ color: '#6F6255', lineHeight: 1.65, fontSize: 13, margin: '10px 0 0' }}>
            Diagnostic contractuel : quelles situations peuvent rester sur contexte interne, lesquelles demandent des
            sources rapides, et quand une URL impose extraction ou recherche de domaine.
          </p>
        </div>
        <div style={{ color: '#8B8174', fontSize: 12, lineHeight: 1.8 }}>
          <div><strong style={{ color: '#1A2E5A' }}>{rows.length}</strong> cas test</div>
          <div><strong style={{ color: '#1A2E5A' }}>{rows.filter((row) => row.needs_web).length}</strong> avec web requis</div>
          <div><strong style={{ color: passed === rows.length ? '#1D9E75' : '#B23A3A' }}>{passed}/{rows.length}</strong> contrats OK</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginTop: 16 }}>
        {rows.map((row) => (
          <article key={row.id} style={{ border: '1px solid #F0EBE0', borderRadius: 8, padding: 12, background: '#FCFAF6' }}>
            <p style={{ margin: 0, color: '#C8951A', fontFamily: 'monospace', fontSize: 10 }}>
              {row.label} · {row.domain}
            </p>
            <h3 style={{ margin: '7px 0 0', color: '#1A2E5A', fontSize: 13, lineHeight: 1.35 }}>
              {row.subject}
            </h3>
            <p style={{ margin: '8px 0 0', color: policyColor(row.policy), fontFamily: 'monospace', fontSize: 11 }}>
              {row.policy} · {row.status}
            </p>
            <p style={{ margin: '6px 0 0', color: row.passed ? '#1D9E75' : '#B23A3A', fontFamily: 'monospace', fontSize: 10 }}>
              attendu : {row.expected_policy} · {row.passed ? 'PASS' : 'REVIEW'}
            </p>
            <p style={{ margin: '8px 0 0', color: '#6F6255', fontSize: 11, lineHeight: 1.5 }}>
              {row.reason}
            </p>
            {row.fallback_searches.length > 0 && (
              <p style={{ margin: '8px 0 0', color: '#8B8174', fontSize: 10, lineHeight: 1.45 }}>
                Recherche rapide : {row.fallback_searches.slice(0, 2).join(' · ')}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
