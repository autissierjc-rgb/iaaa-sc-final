# SC V2 Brick Map

Ce document sert de carte d'arborescence des briques Situation Card V2.

Objectif : eviter les patchs de cas, les doublons et les corrections qui
ignorent une brique deja presente.

Regle d'usage :

```txt
Avant de modifier une sortie SC, identifier la couche canonique responsable,
puis verifier si une brique existe deja.
```

Si une brique existe, il faut la brancher, la renforcer ou la tester. Il ne
faut pas creer une nouvelle regle parallele.

## 1. Pipeline canonique

```txt
User Input
  ->
InterpretationService
  ->
DialogueGate / SituationReadinessGate
  ->
RiskAdviceGuard
  ->
SecurityAbuseGuard
  ->
ExpertisesMetiers / Domain Router
  ->
ResourceService / FastResourceRunner / SourceRouter
  ->
HumanCollectivePatterns
  ->
ConcreteTheatreBuilder
  ->
ScoringEngine / Astrolabe / Radar
  ->
BlindSpotPreparation / Inquiry
  ->
WritingEngine
  ->
QualityGate / DiamondValidation
  ->
Situation Card / Lecture / Approfondir / Ressources
  ->
Recherche+ a la demande
  ->
Share / Snapshot / PDF / Language
  ->
Archive / Telemetry / CTO Watch / Admin Cockpit
```

## 2. Arborescence fonctionnelle

```txt
src/lib/
  interpretation/
    InterpretationService
    modelIntentInterpreter
    dialogueCanonicalizer

  dialogue/
    DialogueGate

  input/
    situationReadinessGate

  safety/
    RiskAdviceGuard

  security/
    SecurityAbuseGuard

  expertisesMetiers/
    ExpertisesMetiersRouter
    domainPlaybooks
    metierLenses

  resources/
    ResourceService
    SourceRouter
    FastResourceRunner
    fetchResources
    shouldUseWeb
    siteUnderstanding
    ResourceRole via UserMaterial

  patterns/
    HumanCollectivePatterns
    detectPatterns

  theatre/
    ConcreteTheatreBuilder

  scoringV2/
    ScoringEngine
    astrolabeScoring
    radarScoring
    stateLabels

  inquiry/
    BlindSpotEngine

  writing/
    WritingEngine
    diamondRules

  quality/
    QualityGate
    ContractQualityGate

  governance/
    situationCardV2CanonicalBrief.md
    scCalibrationBenchmark.md
    diamondValidation.ts
    scV2BrickMap.md

  archive/
    GenerationEventBuilder
    UserReactionTelemetry
    CtoWatch

  share/
    share contracts
    PdfSnapshotRenderer
    PdfExportPlanner

src/app/api/
  generate/
    route publique V1/V2 progressive
  generate-v2/
    route cockpit dry-run V2
  ren-chat/
    chat REN, sans generation SC automatique
  sources/
    sources rapides
  recherche-plus/
    enquete externe separee
  pdf-v2/
    export depuis snapshot
  share-v2/
    snapshot et partage
  language-v2/
    snapshot langue
  reactions-v2/
    reaction utilisateur -> couche probable
  cto-watch/
    veille technique

src/components/home/
  HomeClient
    bloc gauche : chat REN + boussole
    bloc droit : SC, lecture, partage, PDF

src/app/sis-system/v2/
  cockpit V2
  testers : generate, REN, reactions, PDF, share, language, CTO
```

## 3. Inventaire des briques V2

| Brique | Couche | Statut | Fichiers | Role |
| --- | --- | --- | --- | --- |
| Archive generations | archive | passive | `src/lib/contracts/generationArchive.ts` | Trace metadata, snapshot prive, apprentissage lancement et partage public. |
| Interpretation + DialogueGate | interpretation / dialogue | passive | `src/lib/interpretation`, `src/lib/dialogue` | Autorite unique de comprehension et clarifications limitees. |
| SituationReadinessGate | dialogue / quality / UI-mobile | branche public | `src/lib/input/situationReadinessGate.ts`, `src/components/home/HomeClient.tsx`, `src/app/api/generate/route.ts` | Decide si une information manquante doit etre demandee avant generation et expose une generation prudente/exploratoire sans transformer la question de clarification en situation publique. |
| ScoringEngine | scoring | passive | `src/lib/scoringV2` | Formule canonique branches + radar. |
| ResourceService + SourceRouter | resources | passive | `src/lib/resources/ResourceService.ts`, `src/lib/resources/SourceRouter.ts` | Route URL, fallback search et sources par domaine. |
| FastResourceRunner / fetchResources / siteUnderstanding | resources | branche public | `src/lib/resources`, `src/app/api/generate/route.ts` | Sources rapides et fiche site heuristique en public fast pour eviter le hors-sol sans bloquer Recherche+ ni appeler un LLM supplementaire. |
| Share policy | share | passive | `src/lib/contracts/share.ts` | Snapshot stable, visibilite, anonymisation, OpenGraph. |
| ConcreteTheatreBuilder | theatre | branche public | `src/lib/theatre`, `src/app/api/generate/route.ts` | Acteurs, institutions, dates, procedures, preuves, absences ; source unique du theatre public, adaptee ensuite au format legacy. |
| Writing contract | writing | passive | `src/lib/contracts/writing.ts` | Fond, forme, probabilites, phrase diamant, exemples. |
| WritingEngine + QualityGate | writing / quality | branche public | `src/lib/writing`, `src/lib/quality`, `src/app/api/generate/route.ts` | Sortie contractuelle et verification hors-sol appliquees avant sortie publique. |
| DiamondValidation | quality / writing | branche public partiel | `src/lib/governance/diamondValidation.ts`, `src/app/api/generate/route.ts` | Detecte les phrases generiques et doit orienter vers clarification ou regeneration ciblee. |
| RiskAdviceGuard | safety | passive | `src/lib/contracts/safety.ts`, `src/lib/safety` | Domaines medicaux, juridiques, financiers, mineurs, high stakes. |
| SecurityAbuseGuard | security | passive | `src/lib/contracts/security.ts`, `src/lib/security` | Abus, injection, scraping, couts forces, fichiers hostiles, pics de trafic. |
| UserMaterial + ResourceRole + Plug prive | security / archive / resources / interpretation | branche public | `src/lib/contracts/userMaterial.ts`, `src/lib/intent/dialogueCanonicalizer.ts`, `src/app/api/generate/route.ts`, `src/components/home/HomeClient.tsx` | Unifie texte, fichiers, URL, image, plug comme matiere utilisateur et distingue objet d'analyse, contexte, preuve et materiau prive sans laisser le contexte remplacer la question publique. |
| ExpertisesMetiers | expertisesMetiers | passive | `src/lib/contracts/expertisesMetiers.ts`, `src/lib/expertisesMetiers` | Questions expertes, preuves attendues, sources et seuils. |
| HumanCollectivePatterns | patterns / scoring | branche V2 | `src/lib/patterns`, `src/lib/governance/humanCollectivePatterns.md` | Lentilles humaines et triade legitimer / proteger / produire. |
| BlindSpotEngine | inquiry | branche V2 | `src/lib/inquiry/BlindSpotEngine.ts` | Angles morts comme pistes avec preuves attendues. |
| Recherche+ | resources / inquiry | branche cockpit | `src/app/api/recherche-plus`, `GenerateV2Tester` | Enquete externe separee, pistes et signaux faibles non conclusifs. |
| REN Chat Orchestrator | dialogue / interpretation | branche public | `src/lib/ren`, `src/app/api/ren-chat/route.ts` | Chat explore, boussole cristallise. |
| Home REN bridge | dialogue / UI/mobile | branche public | `src/components/home/HomeClient.tsx` | Fleche = chat, boussole = generation SC. |
| Generate V2 dry-run | api / pipeline | branche cockpit | `src/app/api/generate-v2/route.ts` | Pipeline mesurable sans remplacer `/sis`. |
| Reaction telemetry | archive / quality | branche cockpit | `src/lib/archive/UserReactionTelemetry.ts`, `src/app/api/reactions-v2/route.ts` | Reactions utilisateur classees par couche probable. |
| Launch Learning Mode | archive / admin | passive | `src/lib/contracts/generationArchive.ts`, `src/lib/governance` | Snapshot prive admin, supprimable, distinct du partage public. |
| Language snapshots | language / share | branche cockpit | `src/app/api/language-v2` | Une carte partagee existe dans une langue de snapshot. |
| PDF export | share / PDF | branche cockpit | `src/lib/share/PdfSnapshotRenderer.ts`, `src/app/api/pdf-v2` | PDF depuis snapshot, sans regeneration sauvage. |
| CTO Watch | admin / performance | branche cockpit | `src/lib/archive/CtoWatch.ts`, `src/app/api/cto-watch` | Veille seuils critiques : latence, cout, fallback, erreurs. |
| Codex session protocol | governance / admin-cockpit | branche | `src/lib/governance/codexSessionProtocol.md` | Regles de branche, build, commit, anti-patch. |

## 4. Mapping symptome -> brique a verifier

| Symptôme observe | Couche canonique | Brique existante a verifier |
| --- | --- | --- |
| La boussole tourne sans fin | UI/mobile / performance | `HomeClient`, timeout UI, route `/api/generate`, CTO Watch |
| La SC fast en 3s disparait | performance / writing | modes `public_fast`, `WritingEngine`, `generate-v2`, `situationCardV2CanonicalBrief.md` section Performance |
| La carte sort en logico / notice | writing / quality | `WritingEngine`, `QualityGate`, `DiamondValidation`, benchmark |
| Une information manque mais la carte conclut | dialogue / quality | `SituationReadinessGate`, `DialogueGate`, `inputQualityGate` |
| Clarification trop bloquante | dialogue | `DialogueGate`, `SituationReadinessGate`, contrat REN |
| Question URL ou entreprise hors-sol | resources / theatre / expertisesMetiers | `ResourceService`, `FastResourceRunner`, `siteUnderstanding`, `ConcreteTheatreBuilder`, `ExpertisesMetiers` |
| URL ou domaine utilisateur remplace la question | interpretation / resources / quality | `UserMaterial ResourceRole`, `InterpretationService`, `ResourceService`, `siteUnderstanding`, `QualityGate` |
| Ressources non cherchees alors que nécessaires | resources | `shouldUseWeb`, `SourceRouter`, `FastResourceRunner` |
| Ressources longues bloquent SIS | performance / resources | `public_fast`, budgets sources rapides, Recherche+ separee |
| Approfondir confond ressource et conclusion | resources / inquiry / writing | `Recherche+`, `BlindSpotEngine`, `WritingEngine` |
| Astrolabe plat ou incoherent | scoring | `ScoringEngine`, `astrolabeScoring`, `radarScoring`, benchmark |
| Mauvais domaine Atlas | interpretation / expertisesMetiers | `InterpretationService`, `ExpertisesMetiersRouter`, header contract |
| Phrase diamant molle | writing | `WritingEngine`, `diamondRules`, `diamondValidation`, benchmark |
| PDF incomplet ou regenere | share / PDF | `PdfSnapshotRenderer`, `PdfExportPlanner`, `share` contract |
| Langues melangees | language / share | `LanguageService cible`, `language-v2`, snapshot langue |
| Donnees ou documents trop exposes | security / privacy / archive | `UserMaterial`, `SecurityAbuseGuard`, `generationArchive`, privacy policy |
| Attaque, scraping, cout force | security / CTO | `SecurityAbuseGuard`, rate limits, CTO Watch, Vercel Firewall |
| Reaction utilisateur non exploitee | archive / quality | `UserReactionTelemetry`, `reactions-v2`, cockpit |

## 5. Briques deja presentes pour la vitesse

La vitesse n'est pas une nouvelle brique. Elle existe deja dans le brief
canonique et doit etre branchee proprement.

Contrat cible :

```txt
0-2 sec    interpretation, header, Situation soumise, domaine, gate
2-5 sec    SC courte, scoring initial, radar, vulnerabilite principale
5-10 sec   Lectures diamant
async      Approfondir enrichi, ressources profondes, reseaux sociaux, enquete
```

Briques concernees :

- `public_fast` dans `situationCardV2CanonicalBrief.md` ;
- `GenerateV2Tester` et ses modes produit ;
- `WritingEngine` en mode `local_contract` ;
- `ResourceService` / `FastResourceRunner` avec budgets courts ;
- `Recherche+` separee ;
- `CTO Watch` avec seuil `public_fast_p95_ms`.

Implication :

```txt
Si la SC complete prend 18 secondes, ce n'est pas forcement un echec.
Mais la SC courte doit deja apparaitre avant.
```

## 6. Briques deja presentes pour la collaboration

La collaboration n'est pas un ajout a inventer. Elle existe dans :

- `DialogueGate` ;
- `SituationReadinessGate` ;
- `REN Chat Orchestrator` ;
- `inputQualityGate` ;
- `SC_COLLABORATION_RULE` dans `scDoctrine` ;
- le brief canonique : le chat explore, la boussole cristallise.

Regle :

```txt
Une information manquante n'est pas une erreur.
C'est une question a poser a l'utilisateur.
```

Exemples :

- options strategiques non nommees ;
- referent ambigu ;
- URL officielle absente ;
- preuve decisive non disponible ;
- decision attendue non explicitee ;
- acteur ou contrainte centrale manquante.

## 7. Zones de branchement encore fragiles

Ces points ne demandent pas de nouvelles briques. Ils demandent un branchement
plus net entre briques existantes.

| Zone | Risque | Brique a brancher |
| --- | --- | --- |
| `/api/generate` public | route hybride V1/V2, risque de bypass des contrats V2 | `public_fast`, `SituationReadinessGate`, `QualityGate`, `WritingEngine` |
| SC fast vs complete | la complete peut bloquer la courte | separation `SC courte -> lecture -> approfondir async` |
| Fallback local | peut produire logico si non valide | `DiamondValidation`, `QualityGate`, regeneration sectionnelle ou clarification |
| Ressources rapides | peuvent rallonger la SC | budgets courts + statut partial + Recherche+ separee |
| PDF | risque de diverger de la carte | snapshot immuable + export sans regeneration |
| Multilingue | risque de melange de langues | snapshot langue + LanguageService |

## 8. Regle de decision avant toute modification

Avant toute correction :

```txt
1. Quel symptome observe-t-on ?
2. Quelle couche canonique le produit ?
3. Quelle brique existe deja ?
4. Est-elle passive, branchee ou mal branchee ?
5. Faut-il brancher, renforcer, tester ou documenter ?
6. Le changement respecte-t-il public_fast / Recherche+ separee / snapshot ?
```

Si la reponse a la question 3 est "aucune", alors seulement on peut proposer
une nouvelle brique canonique.
