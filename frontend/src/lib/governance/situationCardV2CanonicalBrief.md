# Situation Card V2 - Canonical Rebuild Brief

Ce document est la reference canonique pour la refonte V2 de Situation Card /
SIS.

Il ne demande pas un patch de la V1. Il definit la base de travail pour une
architecture solide, modulaire, rapide, scalable et calibrable.

Phrase cle :

```txt
La V2 ne doit pas etre un meilleur prompt.
Elle doit etre une architecture de contrats ou chaque couche produit un objet
verifiable avant la couche suivante.
```

## 1. Contexte

La V1 a permis de decouvrir le produit par l'usage, mais elle a accumule des
regles dans plusieurs endroits : prompts, routes API, detecteurs, validateurs,
fallbacks, composants et documents de gouvernance.

Les problemes recurrents observes :

- mauvaise comprehension de la demande ;
- header faible ou approximatif ;
- `Situation soumise` non reformalisee ou transformee en categorie ;
- clarification inutile ou interrogatoire ;
- URL non exploitee ;
- ressources pauvres ou mal routees ;
- scoring incoherent ;
- Astrolabe trop plat ou mal hierarchise ;
- redaction hors-sol ;
- vocabulaire d'un domaine importe dans un autre ;
- Main Vulnerability trop generique ;
- angles morts listes mais non enqueteables ;
- temps de generation trop longs ;
- patchs disperses et regressions apres changements locaux ;
- absence de benchmark stable dans le flux de validation.

## 2. Principe fondateur

Une Situation Card ne doit jamais etre generee directement depuis la question
brute.

Elle doit etre generee depuis :

1. une interpretation canonique de l'intention ;
2. un dialogue gate clair ;
3. un theatre reel concret ;
4. une famille de tension / domaine / metier ;
5. des ressources adaptees ;
6. un scoring coherent ;
7. une redaction diamant ;
8. un moteur d'enquete des angles morts ;
9. un Quality Gate silencieux ;
10. un benchmark de calibration.

## 3. Regle majeure d'interpretation

Le LLM referent est l'autorite unique pour :

- l'intention utilisateur ;
- la comprehension reelle de la demande ;
- la reformulation de `Situation soumise` ;
- le domaine ;
- l'angle d'analyse ;
- le besoin ou non de clarification.

Aujourd'hui ce referent peut etre ChatGPT / GPT. Demain il peut etre un autre
LLM si le projet change de modele. La regle ne depend pas d'une marque ; elle
depend du principe d'autorite unique d'interpretation.

Aucune couche aval ne doit reinterpreter la demande.

Les detecteurs, coverage checks, validateurs, familles, scoring, ressources,
Arbre a Cames, WritingEngine et QualityGate ne peuvent que structurer,
verifier, enrichir ou signaler une incoherence.

Ils ne remplacent jamais silencieusement l'intention canonique.

## 4. Architecture cible

```txt
User Input
  ->
InterpretationService
  ->
DialogueGate
  ->
ResourceService
  ->
ConcreteTheatreBuilder
  ->
Domain / Tension / Metier Router
  ->
ScoringEngine
  ->
WritingEngine
  ->
BlindSpot / Inquiry Engine
  ->
QualityGate
  ->
Situation Card / Lectures / Approfondir / Ressources
  ->
Admin Cockpit / Telemetry / Benchmark
```

Chaque etape doit produire un contrat type, testable et loggable.

Aucun service ne doit modifier silencieusement le contrat produit par un autre
service.

## 5. Modules cibles

Organisation recommandee :

```txt
src/lib/contracts/
src/lib/interpretation/
src/lib/dialogue/
src/lib/domain/
src/lib/tensions/
src/lib/metiers/
src/lib/resources/
src/lib/theatre/
src/lib/scoring/
src/lib/inquiry/
src/lib/writing/
src/lib/quality/
src/lib/governance/
src/app/api/generate/
src/app/api/lecture/
src/app/api/approfondir/
src/app/api/resources/
src/app/api/inquiry/
src/app/admin/cockpit/
```

Contraintes :

- ne pas mettre les prompts dans les routes ;
- ne pas mettre le scoring dans les composants ;
- ne pas melanger logique metier et JSX ;
- ne pas relancer toute la generation pour corriger une section ;
- ne pas creer une architecture lente.

## 6. InterpretationService

Module cible :

```txt
src/lib/interpretation/InterpretationService.ts
```

Sortie canonique :

```ts
{
  raw_input: string
  intent: string
  domain: string
  question_type: string
  situation_soumise: string
  header_domain: string
  header_subject: string
  angle: string
  user_need: string
  needs_clarification: boolean
  clarification_question?: string
  confidence: number
}
```

Regles :

- `situation_soumise` = reformulation fidele de la demande utilisateur ;
- `header_domain` = domaine Atlas lisible ;
- `header_subject` = sujet en trois mots significatifs minimum ;
- ne jamais reduire une URL a "site officiel" ;
- ne jamais confondre objet, institution, entreprise, personne, evenement ou
  crise ;
- si une URL est donnee, l'interpretation doit integrer l'URL et la demande ;
- si l'intention est claire mais incomplete, ne pas bloquer : passer en
  `OPTIONAL_REFINEMENT`.

## 7. DialogueGate

Module cible :

```txt
src/lib/dialogue/DialogueGate.ts
```

Trois etats seulement :

```txt
READY_TO_GENERATE
OPTIONAL_REFINEMENT
BLOCKING_CLARIFICATION
```

Regles :

- le chat est un atelier de collaboration, pas un interrogatoire ;
- une seule question prioritaire a la fois ;
- si la carte peut etre utilement generee, generer ;
- la clarification ne bloque que si l'objet, le referent, la source ou une
  condition de securite manque vraiment ;
- si GPT peut proposer une hypothese intelligente, il demande confirmation
  plutot qu'une question aveugle.

## 8. Astrolabe conserve

La V2 conserve l'Astrolabe public actuel :

1. Acteurs ;
2. Interets ;
3. Forces ;
4. Tensions ;
5. Contraintes ;
6. Incertitudes ;
7. Temps ;
8. Perception.

La notion d'angle mort enrichit l'axe VI. Elle ne remplace pas l'Astrolabe
public.

Note historique :

- calibrage original : VI = Incertitude, ce qui manque a la connaissance ;
- doctrine actuelle : VI = Incertitudes + angles morts, ce qui manque a la
  connaissance et ce qui manque au regard.

Cette evolution peut modifier le scoring : VI peut devenir plus structurant
qu'avant, mais doit rester justifie par le theatre reel.

## 9. Domain / Tension / Metier Router

Modules cibles :

```txt
src/lib/domain/domainAtlas.ts
src/lib/tensions/tensionFamilies.ts
src/lib/metiers/metierAtlas.ts
```

Chaque famille doit fournir :

```ts
{
  id: string
  label_fr: string
  label_en: string
  typical_actors: string[]
  typical_institutions: string[]
  typical_constraints: string[]
  expected_evidence: string[]
  typical_blind_spots: string[]
  source_channels: string[]
  tipping_points: string[]
  scoring_profile: object
}
```

Familles minimales :

- geopolitique ;
- guerre / securite ;
- crise institutionnelle / elections ;
- humanitaire ;
- startup / marche ;
- entreprise / management ;
- professionnel / carriere ;
- droit / justice ;
- famille ;
- couple ;
- ecole / adolescence ;
- sante / corps ;
- sciences / recherche ;
- technologie / IA ;
- climat / energie ;
- finance / macroeconomie ;
- culture / medias ;
- religion / spiritualite ;
- territoire / urbanisme ;
- sport / performance ;
- communaute / association ;
- produit / plateforme ;
- gouvernance publique ;
- ONG / terrain ;
- supply chain ;
- cybersecurite ;
- education ;
- recherche academique.

Base metiers a prevoir :

```txt
chercheur, medecin, avocat, DRH, maire, professeur, investisseur, fondateur,
journaliste, diplomate, militaire, parent, coach, ingenieur, artiste,
consultant, syndicaliste, juge, fonctionnaire, ONG terrain, analyste, DSI,
product manager, entrepreneur social
```

Une famille n'est pas une etiquette. Elle doit guider :

- les acteurs a chercher ;
- les preuves attendues ;
- les sources a consulter ;
- le scoring ;
- les angles morts ;
- la redaction.

## 10. ResourceService / SourceRouter

Modules cibles :

```txt
src/lib/resources/ResourceService.ts
src/lib/resources/SourceRouter.ts
```

Regles :

- si URL presente : detectUrl -> extract -> site brief ;
- si extraction echoue : search sur domaine / fallback ;
- les sources doivent etre adaptees au domaine ;
- les ressources ne doivent pas ralentir la SC courte ;
- les sources profondes peuvent enrichir Lectures, Approfondir ou Enquete.

Canaux possibles :

- geopolitique : agences, medias locaux, declarations officielles, think tanks,
  institutions ;
- guerre / securite : medias locaux, OSINT public, ministeres, cartes reconnues,
  communiques officiels ;
- startup / marche : site officiel, LinkedIn, Crunchbase si disponible, Product
  Hunt, GitHub, jobs, pricing, docs, mentions legales ;
- sciences : PubMed, arXiv, Nature, Science, institutions, rapports
  scientifiques, universites ;
- droit : textes officiels, jurisprudence, autorites de regulation, doctrine ;
- opinion / societe : reseaux sociaux publics, Reddit, X, LinkedIn, forums
  specialises, presse locale ;
- entreprise : LinkedIn, Glassdoor, presse business, registres, offres
  d'emploi, rapports ;
- sante : sources medicales officielles, OMS, HAS, autorites sanitaires,
  publications scientifiques.

Le web ne doit pas etre plus large par defaut. Il doit etre mieux route.

## 11. ConcreteTheatreBuilder

Module cible :

```txt
src/lib/theatre/ConcreteTheatreBuilder.ts
```

Sortie :

```ts
{
  actors: string[]
  institutions: string[]
  dates: string[]
  places: string[]
  procedures: string[]
  visible_actions: string[]
  constraints: string[]
  evidence: string[]
  unknowns: string[]
}
```

Regles :

- les sections publiques doivent contenir des elements du theatre reel ;
- interdire les textes hors-sol comme "objet visible", "mecanisme concret",
  "canal concret" ou "le systeme tient par..." sans acteur ni preuve ;
- si le theatre reel est pauvre, le moteur doit le signaler ou generer une carte
  prudente.

## 12. ScoringEngine

Modules cibles :

```txt
src/lib/scoring/ScoringEngine.ts
src/lib/scoring/astrolabeScoring.ts
src/lib/scoring/radarScoring.ts
src/lib/scoring/stateLabels.ts
```

Origine canonique retrouvee :

```txt
state = astrolabe_base x 0.65 + radar_pressure x 0.35
```

```txt
astrolabe_base =
primary_branch_score x 0.35
+
average_other_branches x 0.65
```

```txt
radar_pressure =
impact x 0.30
+
urgency x 0.25
+
uncertainty x 0.25
+
irreversibility x 0.20
```

Le scoring ne doit pas etre lexical.

Il doit combiner :

- interpretation canonique ;
- domaine ;
- famille de tension ;
- theatre reel ;
- radar ;
- branches Astrolabe ;
- seuils de coherence.

Garde-fous :

- si `state_index_final > 70`, au moins une branche doit etre dominante ;
- trop de branches dominantes ecrase la hierarchie ;
- par defaut max 2 dominants ;
- exception controlee : 3 dominants seulement si le benchmark valide une
  situation reellement multi-centres ;
- tension forte seulement si conflit explicite entre acteurs nommes et impact
  structurel.

Labels d'etat historiques a calibrer par benchmark :

```txt
0-44      Routine / Stable
45-59     Tension
60-74     Instability
75-100    Regime Shift
```

Ces labels ne doivent pas etre figes sans validation sur le benchmark.

## 13. BlindSpot / Inquiry Engine

Module cible :

```txt
src/lib/inquiry/BlindSpotEngine.ts
```

Principe :

```txt
Un angle mort n'est pas une reponse cachee.
C'est une piste d'enquete avec une preuve attendue.
```

Pour chaque angle mort :

```ts
{
  blind_spot: string
  why_it_matters: string
  where_to_look: string[]
  who_can_confirm: string[]
  observable_signal: string
  decisive_evidence: string
  counter_hypothesis: string
}
```

Trois niveaux :

1. declaratif : ce qu'on peut demander a l'utilisateur ;
2. documentaire : ce qu'on peut chercher par sources ;
3. structurel : ce qu'on ne peut pas prouver directement, mais qu'on peut
   encadrer par hypothese, indice, contre-hypothese et preuve attendue.

Ne jamais inventer l'angle mort.

## 14. WritingEngine - redaction diamant

Modules cibles :

```txt
src/lib/writing/WritingEngine.ts
src/lib/writing/diamondRules.ts
```

SC, Lectures et Approfondir doivent demontrer par le theatre reel :

- acteurs ;
- institutions ;
- dates ;
- gestes ;
- procedures ;
- seuils ;
- preuves ;
- contraintes.

Interdits publics :

- "objet visible" ;
- "mecanisme" sans exemple ;
- "canal concret" ;
- "la situation est complexe" ;
- "le manque de communication" ;
- "l'incertitude complique la decision" ;
- "il faut surveiller l'evolution" ;
- toute phrase meta qui explique la methode au lieu d'eclairer la situation.

La redaction doit produire un effet diamant :

- voir le systeme ;
- identifier la vulnerabilite centrale ;
- comprendre la bascule possible ;
- savoir quoi observer.

La Main Vulnerability est le centre du diamant.

Elle doit nommer une fragilite structurelle precise :

- dependance critique ;
- asymetrie structurelle ;
- acteur porteur cache ;
- mecanisme fragile ;
- retard dangereux ;
- contradiction de role ;
- rupture de reconnaissance ;
- contrat implicite viole ;
- frontiere qui s'efface ;
- effondrement de sens.

## 15. Outputs

La V2 doit produire :

1. Situation Card courte, lisible en 3 a 10 secondes ;
2. Lecture, lecture diamant courte et claire ;
3. Approfondir, page enrichie unique ;
4. Ressources, sources separees et classees dans Approfondir ;
5. Enquete, action optionnelle a l'interieur d'Approfondir pour verifier les
   angles morts.

Structure cible :

```txt
Situation Card
  - Lecture
  - Approfondir
      - Analyse enrichie
      - Incertitudes / angles morts
      - Ressources
      - Lancer l'enquete
```

Regle de timing :

Approfondir ne doit pas attendre l'enquete pour s'afficher.

Approfondir montre les angles morts. L'enquete cherche a les verifier.

L'enquete peut etre plus longue, plus specialisee et asynchrone. Elle ne doit
pas alourdir la generation de la SC, de Lecture ou de l'Approfondir initial.

## 16. Performance

Objectif : enrichir sans ralentir.

Cibles :

```txt
0-2 sec    interpretation, header, Situation soumise, domaine, gate
2-5 sec    SC courte, scoring initial, radar, vulnerabilite principale
5-10 sec   Lectures diamant
async      Approfondir enrichi, ressources profondes, reseaux sociaux, enquete
```

Regles :

- la SC ne doit pas attendre toutes les sources ;
- Lectures peut utiliser les sources rapides ;
- Approfondir peut avoir deux modes : rapide / enrichi ;
- les ressources profondes doivent etre cachees ou prechargees ;
- les reseaux sociaux ne sont actives que si le domaine ou l'utilisateur le
  justifie ;
- le scoring doit etre deterministe d'abord, LLM seulement pour arbitrage
  complexe.

## 17. QualityGate

Module cible :

```txt
src/lib/quality/QualityGate.ts
```

Controles silencieux :

- domaine coherent ;
- `Situation soumise` fidele ;
- header non generique ;
- acteurs concrets presents ;
- pas de vocabulaire contaminant ;
- pas de meta-commentaire ;
- Main Vulnerability precise ;
- trajectoires distinctes ;
- Key Signal observable ;
- scoring coherent ;
- ressources separees ;
- VI traite comme incertitudes + angles morts ;
- pas de hors-sol.

Si une section echoue :

- regenerer seulement la section ;
- ne pas relancer tout le moteur.

## 18. Benchmark canonique

Document associe :

```txt
src/lib/governance/scCalibrationBenchmark.md
```

Chaque SC est evaluee sur :

1. Insight ;
2. Main Vulnerability ;
3. Trajectories ;
4. Key Signal to Watch ;
5. Global Usefulness.

Questions qualitatives :

- Est-ce que je vois mieux le systeme ?
- Est-ce que la vulnerabilite centrale semble juste ?
- Est-ce que je sais quoi surveiller ?

Le benchmark separe scoring qualite sur 25 points et scoring d'etat sur 100
points.

## 19. Admin Cockpit

Le cockpit admin doit exposer :

- confidence d'interpretation ;
- domaine detecte ;
- famille de tension ;
- scoring breakdown ;
- radar values ;
- branch scores ;
- resultats QualityGate ;
- reference benchmark ;
- latence par service ;
- statut ressources ;
- angles morts generes ;
- regeneration count.

Ces details ne sont pas affiches a l'utilisateur final sauf mode admin.

## 20. Livrables par paliers

Ne pas tout brancher d'un coup.

1. Creer les contrats et documents canoniques.
2. Implementer `InterpretationService` + `DialogueGate`.
3. Implementer `ScoringEngine` depuis la formule canonique.
4. Implementer `ResourceService` + `SourceRouter`.
5. Implementer `ConcreteTheatreBuilder`.
6. Implementer `WritingEngine` + `QualityGate`.
7. Implementer `BlindSpotEngine`.
8. Brancher progressivement a l'API `generate`.
9. Ajouter cockpit admin et benchmark visible.

## 21. Regle anti-patch V2

Tout changement doit nommer le niveau corrige :

1. interpretation ;
2. dialogue gate ;
3. ressources ;
4. theatre reel ;
5. domaine / tension / metier ;
6. scoring ;
7. redaction ;
8. enquete angles morts ;
9. quality gate ;
10. UI / rendu.

Si le probleme ressemble a un cas particulier, ne pas corriger le cas. Corriger
la couche canonique qui a produit le symptome et ajouter le cas au benchmark ou
aux regressions.

## 22. Ambition produit

Situation Card ne doit pas devenir une machine qui pretend tout savoir.

La V2 doit devenir une architecture qui organise la rencontre entre :

- le LLM referent ;
- les sources ;
- le web ;
- les metiers ;
- les domaines ;
- les angles morts ;
- l'intelligence situee de l'utilisateur.

Formule directrice :

```txt
Situation Card ne remplace pas l'expertise.
Elle organise la rencontre entre les expertises.
```
