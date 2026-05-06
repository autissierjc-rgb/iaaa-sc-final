import type { MetierLens, SituationDomainV2 } from '../contracts'

export const METIER_LENSES: MetierLens[] = [
  {
    id: 'founder',
    label_fr: 'Fondateur',
    domains: ['startup_market', 'business_strategy', 'product_platform'],
    questions_they_ask: ['qui paie', 'pourquoi maintenant', 'quel risque de dependance'],
    evidence_they_expect: ['usage repete', 'revenu', 'client identifiable'],
    blind_spots_they_watch: ['cout cache', 'contrainte legale', 'distribution'],
    source_preferences: ['company', 'market', 'technical'],
  },
  {
    id: 'lawyer',
    label_fr: 'Juriste',
    domains: ['law_justice', 'startup_market', 'institutional_crisis', 'professional'],
    questions_they_ask: ['quelle regle s applique', 'quel delai compte', 'quel document fait foi'],
    evidence_they_expect: ['texte', 'contrat', 'decision', 'preuve datee'],
    blind_spots_they_watch: ['competence juridictionnelle', 'clause oubliee', 'preuve irrecevable'],
    source_preferences: ['legal', 'official'],
  },
  {
    id: 'doctor',
    label_fr: 'Medecin',
    domains: ['health_body'],
    questions_they_ask: ['depuis quand', 'quelle intensite', 'quel signe d alerte'],
    evidence_they_expect: ['symptome decrit', 'duree', 'antecedents', 'examen'],
    blind_spots_they_watch: ['urgence', 'automedication', 'interaction'],
    source_preferences: ['health_authority', 'research'],
  },
  {
    id: 'parent',
    label_fr: 'Parent',
    domains: ['family', 'school_adolescence', 'education'],
    questions_they_ask: ['quel lien est en jeu', 'quel besoin reste non dit', 'quel geste protege la relation'],
    evidence_they_expect: ['message exact', 'comportement repete', 'rythme', 'contexte'],
    blind_spots_they_watch: ['honte', 'autonomie', 'peur de decevoir', 'projection adulte'],
    source_preferences: ['other'],
  },
  {
    id: 'researcher',
    label_fr: 'Chercheur',
    domains: ['science_research', 'academic_research', 'technology_ai', 'health_body'],
    questions_they_ask: ['quelle methode', 'quelle preuve', 'quel niveau de consensus'],
    evidence_they_expect: ['publication', 'donnees', 'replication', 'revue par les pairs'],
    blind_spots_they_watch: ['biais', 'confusion correlation causalite', 'generalisation excessive'],
    source_preferences: ['research', 'official', 'technical'],
  },
]

export function getMetierLensesForDomain(domain: SituationDomainV2): MetierLens[] {
  return METIER_LENSES.filter((lens) => lens.domains.includes(domain))
}
