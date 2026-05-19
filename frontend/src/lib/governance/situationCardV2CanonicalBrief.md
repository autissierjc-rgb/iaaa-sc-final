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
3. une protection security / anti-abus avant les operations couteuses ;
4. une famille de tension / domaine / metier ;
5. des ressources rapides adaptees ;
6. un theatre reel concret ;
7. un scoring coherent ;
8. une preparation des incertitudes et angles morts integree a la reponse ;
9. une redaction diamant ;
10. un Quality Gate silencieux ;
11. un benchmark de calibration ;
12. une enquete probatoire externe uniquement si l'utilisateur la lance.

## 3. Regle majeure d'interpretation

Le LLM referent est l'autorite unique pour :

- l'intention utilisateur ;
- la comprehension reelle de la demande ;
- la reformulation de `Situation soumise` ;
- le domaine ;
- l'angle d'analyse ;
- le besoin ou non de clarification.
- les instructions de traitement a appliquer par SC.

Aujourd'hui ce referent peut etre ChatGPT / GPT. Demain il peut etre un autre
LLM si le projet change de modele. La regle ne depend pas d'une marque ; elle
depend du principe d'autorite unique d'interpretation.

Aucune couche aval ne doit reinterpreter la demande.

Les detecteurs, coverage checks, validateurs, familles, scoring, ressources,
Arbre a Cames, WritingEngine et QualityGate ne peuvent que structurer,
verifier, enrichir ou signaler une incoherence.

Ils ne remplacent jamais silencieusement l'intention canonique.

Le contrat d'interpretation peut produire un `TreatmentPlanContract`.
Ce plan ne repond pas a l'utilisateur. Il dit comment SC doit traiter la
demande :

- generer directement ;
- demander une precision ;
- demander une source ou un plug ;
- produire une carte exploratoire ;
- proteger la demande avant generation ;
- interdire a une couche aval de remplacer l'objet de la question.

Regle :

```txt
Le LLM referent comprend et donne l'ordre de traitement.
SC structure et produit la Situation Card.
```

## 4. Architecture cible

```txt
User Input
  ->
InterpretationService
  ->
TreatmentPlanContract
  ->
DialogueGate
  ->
RiskAdviceGuard
  ->
SecurityAbuseGuard
  ->
ExpertisesMetiers / Domain Router
  ->
ResourceService
  ->
ConcreteTheatreBuilder
  ->
ScoringEngine
  ->
BlindSpotPreparation
  ->
WritingEngine
  ->
QualityGate
  ->
Situation Card / Lectures / Approfondir / Ressources
  ->
EvidenceSearch / Enquete probatoire a la demande
  ->
Admin Cockpit / Telemetry / Benchmark
```

Chaque etape doit produire un contrat type, testable et loggable.

Aucun service ne doit modifier silencieusement le contrat produit par un autre
service.

Aucune couche ne doit inventer une regle locale pour corriger un symptome.
Si un comportement manque, il doit etre rattache a une regle canonique
existante ou faire l'objet d'une modification explicite du brief canonique
avant toute modification du code.

## 3a. Langues et snapshots multilingues

La V2 doit etre multilingue par contrat, pas par traduction opportuniste de
l'interface.

Regle canonique :

```txt
Une carte partagee existe dans une langue de snapshot.
Changer de langue signifie lire ou creer un snapshot dans cette langue.
Le PDF exporte la langue du snapshot.
Le bouton Partager respecte la langue du snapshot.
```

Le LLM referent reste l'autorite pour l'interpretation et la comprehension.
La traduction peut etre confiee a un autre modele specialise ou moins couteux :

- Gemma ;
- Kimi ;
- NVIDIA NIM ;
- modele local ;
- autre fournisseur.

Le fournisseur ne doit jamais etre code en dur dans la logique produit.
Il doit passer par un `LanguageService`.

`LanguageService` doit garantir :

- detection de la langue d'entree ;
- choix de la langue de sortie ;
- traduction des champs de snapshot ;
- preservation du sens ;
- preservation des mentions de prudence ;
- preservation de la provenance ;
- absence de melange de langues ;
- conservation des termes produit : Situation Card, IAAA+, Astrolabe,
  Recherche+.

Langues cibles initiales :

```txt
fr, en, es, de, it, pt
```

Les boutons de langue de la home, de SIS et des cartes partagees doivent
eventuellement pointer vers des routes localisees (`/fr`, `/en`, `/es`, etc.),
mais la regle la plus importante reste celle du snapshot : une carte envoyee
dans une langue doit etre stable dans cette langue.

La home peut aussi exposer des routes de marche. Exemple :

```txt
/us = porte d'entree marche Etats-Unis, servie en anglais.
```

Ces routes de marche ne doivent pas creer une langue nouvelle dans le moteur.
Elles peuvent adapter l'acquisition, le SEO, les exemples et les offres, mais
le contrat linguistique reste rattache a une langue de snapshot (`en` pour
`/us` tant qu'aucune variante regionale n'est creee).

## 3b. Chat REN et bloc gauche

Le bloc gauche n'est pas un formulaire de generation automatique. C'est un
atelier REN.

Regle UI canonique :

```txt
Le chat explore.
La fleche envoie le message.
Enter envoie le message.
La boussole genere la carte.
Le bouton ? explique tous les boutons du bloc.
```

Le chat peut aider l'utilisateur a clarifier, challenger REN, coller une URL,
ajouter un extrait ou preparer une Situation Card. Il ne doit pas generer une
SC complete a chaque message.

La generation SC ne commence qu'apres action explicite sur la boussole :

```txt
Boussole = Generer la carte.
```

Le chat peut inviter a cliquer sur la boussole lorsque la situation devient
suffisamment structuree, mais il ne clique jamais a la place de l'utilisateur.

Regle produit :

```txt
REN peut preparer la carte.
Seule la boussole la cristallise.
```

Separation des routes :

```txt
/api/ren-chat       = discuter, explorer, challenger REN.
/api/generate-v2    = generer la Situation Card.
/api/recherche-plus = enquete externe.
/api/share-v2       = partager, snapshot, PDF.
```

Le LLM formule, REN oriente, la boussole cristallise. Le fournisseur LLM peut
changer, mais la reponse chat doit passer par un contrat REN.

Contrat cible :

```ts
{
  answer: string
  ren_mode: 'explore' | 'clarify' | 'challenge' | 'ready_for_card' | 'guarded'
  useful_context: string[]
  missing_context: string[]
  suggested_next_action: 'continue_chat' | 'ask_one_precision' | 'click_compass_generate_card' | 'attach_material' | 'launch_recherche_plus'
  working_context: object
}
```

## 3c. Matiere utilisateur, telechargement et plug

Texte, URL, document, image, tableur ou plug ne sont pas des produits
differents. Ce sont des portes d'entree vers une meme matiere de situation.

Contrat cible :

```txt
UserMaterial
```

Role de ressource :

```ts
type ResourceRole =
  | 'object_of_analysis'
  | 'context_for_question'
  | 'evidence_source'
  | 'private_material'
```

Regle canonique :

```txt
Une URL, un document ou un plug doit etre lu selon son role dans la demande.
La ressource peut etre analysee sans devenir l'objet principal.
```

Exemples :

- `object_of_analysis` : "analyse ce site", "que fait cette entreprise",
  "que penser de FlexUp" ;
- `context_for_question` : "pour ma startup situationcard.com", "dans mon
  projet", "avec notre site" ;
- `evidence_source` : "selon cet article", "a partir de cette source",
  "voici un rapport" ;
- `private_material` : Drive, SharePoint, Notion, API metier, dossier ou
  serveur prive.

Regle de branchement :

```txt
ResourceService exploite la ressource.
InterpretationService conserve l'intention principale.
QualityGate signale une derive si la ressource remplace la question.
```

Le champ de chat reste toujours actif pour :

- ecrire une question ;
- coller une URL ;
- coller un extrait ;
- ajouter du contexte.

Le header du bloc gauche expose seulement les actions complementaires :

```txt
Telecharger
Plug
?
```

`Telecharger` ouvre le selecteur de fichiers de l'utilisateur et ajoute une
matiere a traiter sous contrat : PDF, DOCX, image, texte ou tableur.

`Plug` n'est pas un upload. C'est une connexion a une source autorisee sans
deplacer inutilement les documents.

Regle :

```txt
Telecharger = le fichier entre dans SC sous controle.
Plug = SC consulte une source autorisee sans forcement posseder le fichier.
```

Un plug prive peut pointer vers :

- lien prive / URL autorisee ;
- dossier entreprise ;
- Drive, SharePoint, Notion ou autre connecteur ;
- API metier ;
- agent local ;
- serveur prive.

Contrat plug cible :

```ts
{
  connector_type: 'private_url' | 'drive' | 'sharepoint' | 'notion' | 'api' | 'local_agent' | 'enterprise_server'
  access_mode: 'read_metadata' | 'read_excerpt' | 'read_full' | 'query_only'
  extraction_location: 'sc_server' | 'user_server' | 'local_device' | 'enterprise_connector'
  retention_choice: 'discard_after_processing' | 'keep_private' | 'keep_with_private_card'
  raw_document_leaves_user_environment: boolean
}
```

Promesse produit :

```txt
Les documents peuvent rester dans votre environnement.
Situation Card ne recoit que les extraits, metadonnees ou resultats autorises.
```

Note importante :

```txt
La preparation des angles morts fait partie de la reponse.
Elle nourrit SC, Lecture et Approfondir.

Le bouton d'enquete ne sert pas a preparer l'enquete.
Il sert uniquement a chercher des preuves externes : web, sources officielles,
documents, bases metier ou signaux sociaux selon le domaine.
```

## 4a. Modes de generation

La V2 ne doit pas exposer au produit public des interrupteurs techniques du
type `interpretation_mode` ou `writing_mode`.

Elle doit exposer des modes produit :

- `public_fast` : LLM referent rapide pour l'interpretation, sortie JSON
  stricte, timeout controle, fallback local seulement en cas d'echec technique,
  ecriture contractuelle rapide, ressources rapides si necessaires, Recherche+
  separee ;
- `diamond_llm` : LLM referent pour interpretation et redaction diamant,
  reserve a IAAA+ ou au cockpit car plus lent ;
- `research_plus` : enquete externe separee, non bloquante ;
- `admin_benchmark` : mode cockpit pour tester les couches et benchmarks sans
  consommer obligatoirement le LLM referent.

Regle :

```txt
Le produit choisit un mode metier.
La route traduit ce mode en choix techniques internes.
```

Les overrides techniques `interpretation_mode` et `writing_mode` sont reserves
au mode `admin_benchmark`. Ils servent a tester les couches dans le cockpit.
Ils ne doivent pas modifier les modes produit `public_fast`, `diamond_llm` ou
`research_plus`.

## 4b. Recherche+

`Recherche+` est l'enquete probatoire externe lancee a la demande.

Elle ne remplace pas SC, Lecture ou Approfondir. Elle ne doit pas introduire de
signaux faibles non verifies dans la reponse principale.

Role :

- transformer les angles morts en requetes de preuve ;
- chercher des pistes sur web, sources officielles, documents, bases metier et
  signaux sociaux publics lorsque c'est legalement accessible ;
- classer les resultats comme piste, signal faible, source solide,
  contradiction ou source inaccessible ;
- expliquer ce que chaque signal suggere ;
- expliquer ce qu'il ne prouve pas ;
- proposer l'etape de verification suivante.

Introduction obligatoire :

```txt
Recherche+ cherche des pistes et signaux faibles. Ces elements ne sont pas des
conclusions. Ils servent a orienter une verification ulterieure.
```

Canaux possibles selon domaine et acces :

- web public ;
- sources officielles ;
- agences et medias locaux ;
- bases metier ;
- documents publics ;
- Reddit public, forums specialises, GitHub public, LinkedIn public ;
- X ou Facebook uniquement si l'acces legal/API existe et si le domaine le
  justifie.

Regle de separation :

```txt
SC / Lecture / Approfondir = reponse structurelle.
Recherche+ = pistes externes separees, non conclusives.
```

Regle produit :

```txt
SIS repond vite.
Recherche+ creuse loin.
```

SIS standard doit rester rapide et partageable :

- Situation Card ;
- Lecture ;
- Approfondir ;
- ressources simples ;
- preparation des incertitudes et angles morts dans la reponse.

Ressources rapides :

- certaines situations peuvent etre traitees sans web obligatoire :
  situations personnelles, couple, famille, relation humaine, management interne
  ou question conceptuelle sans fait externe a verifier ;
- d'autres doivent activer des ressources rapides pour nourrir Lecture et
  Approfondir : geopolitique actuelle, guerre, crise institutionnelle,
  entreprise, compagnie, startup, marche, clients, revenus, pricing,
  partenariat, droit, sante, finance, science, technologie, energie,
  cybersecurite, URL fournie ou demande explicite de sources ;
- ces ressources rapides ne sont pas Recherche+ : elles servent a eviter une
  lecture hors-sol sur des faits verifiables ;
- elles ne doivent pas bloquer la SC courte. Si elles manquent, le contrat doit
  le signaler clairement par `partial` et `needs_web`, puis produire une
  lecture prudente.

Recherche+ appartient a IAAA+ / option avancee :

- enquete structuree sur sources ;
- resumes probatoires de sources ;
- valeur probatoire ;
- limites de preuve ;
- contradictions ;
- signaux faibles ;
- prochaine verification ;
- connecteurs web, sources officielles, bases metier et reseaux publics si
  l'acces legal/API le permet.

Recherche+ ne doit jamais bloquer la generation SIS. Elle peut etre lente,
payante, limitee ou asynchrone sans degrader la SC rapide.

Formule produit :

```txt
Situation Card montre ce qu'il faut comprendre.
Recherche+ cherche ce qu'il faut verifier.
```

## 4b alpha. Bouton Partager unifie

Le partage ne doit pas etre disperse entre plusieurs boutons concurrents.

Regle canonique :

```txt
ShareButton = point unique de diffusion.
PDF = canal de partage depuis snapshot.
Chaque page SC / Lecture / Approfondir / Ressources expose ShareButton.
ShareButton ne relance jamais la generation.
```

Le menu `Partager` doit pouvoir contenir :

- copier le lien ;
- telecharger le PDF ;
- envoyer par canal autorise ;
- choisir ou respecter la langue du snapshot ;
- regler la visibilite si l'utilisateur y a droit ;
- appliquer anonymisation ou restriction si necessaire.

Le bouton `Telecharger PDF` ne doit donc pas devenir un bouton isole sur chaque
surface. Il est une action du menu `Partager`.

Le partage public, le lien, le PDF et les langues doivent tous pointer vers un
snapshot valide. Si la langue demandee n'existe pas encore en snapshot, le
produit doit creer un nouveau snapshot dans cette langue avant partage.

## 4b bis. Buzz readiness / anti-incendie

La V2 doit etre preparee au meilleur cas : une Situation Card partagee peut
faire le buzz.

Regle canonique :

```txt
Lire = CDN.
Generer = quota.
Enqueter = file d'attente ou option separee.
Partager = snapshot.
Surveiller = CTO Watch.
```

Une carte publique consultee ne doit jamais relancer :

- le LLM ;
- Tavily ;
- le scoring ;
- Recherche+ ;
- une regeneration de Lecture ou Approfondir.

Le partage public doit produire ou pointer vers un snapshot immuable :

```txt
card_id
language
snapshot_payload
visibility
created_at
source_generation_id
cache_policy
```

Le chemin de lecture :

```txt
/{locale}/sc/{card_id}
```

doit lire le snapshot et etre cacheable par CDN.

Le chemin de generation doit etre protege par :

- rate limit IP ;
- quota invite ;
- quota compte ;
- limite de taille input ;
- cout estime ;
- fallback public_fast ;
- blocage ou ralentissement si abus.

Recherche+ ne doit jamais se lancer sur une simple consultation. Elle peut etre
asynchrone, payante ou limitee par quota.

CTO Watch doit alerter si un seuil critique est atteint :

- `public_fast_p95_ms` trop haut ;
- erreurs provider ;
- cout horaire estime ;
- fallback trop frequent ;
- sources obligatoires absentes ;
- generation error rate ;
- faible cache hit rate sur cartes partagees.

## 4b quater. Security & Abuse Guard

La securite V2 ne protege pas seulement les donnees. Elle protege aussi le
moteur contre les attaques, l'abus, le scraping, les injections, les couts
forces, les exports dangereux et les pics de trafic.

`safety` et `security` ne doivent pas etre confondus :

- `safety` protege les utilisateurs contre des sorties dangereuses dans les
  domaines sensibles ;
- `privacy` protege la conservation, la visibilite et l'exploitation des
  donnees ;
- `security` protege l'application, les routes, les fichiers, les snapshots,
  les couts et les fournisseurs contre l'abus ou l'attaque.

Module cible :

```txt
src/lib/security/SecurityAbuseGuard.ts
```

Contrat cible :

```ts
{
  risk_level: 'normal' | 'watch' | 'throttle' | 'block'
  signals: string[]
  allowed_actions: string[]
  blocked_actions: string[]
  required_controls: string[]
  cto_watch_required: boolean
}
```

Risques a couvrir :

- spam de generation sur `/api/generate`, `/api/generate-v2`, `/api/sources`,
  Recherche+ et PDF ;
- DDoS ou trafic massif ;
- prompt injection dans texte, URL, PDF, document ou source ;
- XSS dans questions, titres, sources, cartes partagees et PDF ;
- fichiers trop lourds, mauvais MIME, contenus binaires ou documents hostiles ;
- scraping d'Atlas, cartes publiques et snapshots ;
- couts forces par generation, Recherche+ ou providers IA ;
- confusion public/private/admin ;
- partage massif de contenus trompeurs, abusifs ou diffamatoires.

Controles requis :

- rate limit par IP, utilisateur et endpoint ;
- quotas invite, compte gratuit et compte payant ;
- limites de taille input, URL, fichiers, images et PDF ;
- validation MIME cote serveur ;
- sanitation HTML avant rendu public, partage ou PDF ;
- separation stricte des snapshots publics, prives et admin ;
- logs metadata-only par defaut ;
- detection prompt injection et payloads suspects ;
- degradation controlee si provider coute trop ou echoue ;
- CAPTCHA, challenge ou ralentissement en cas d'abus ;
- Vercel Firewall / WAF / Attack Challenge Mode ;
- alertes CTO Watch sur seuils critiques.

Regle :

```txt
Lire = cacheable.
Generer = quota.
Importer = valider.
Partager = sanitizer.
Enqueter = limiter.
Surveiller = alerter.
```

## 4b ter. Export PDF

Une Situation Card doit pouvoir exister en PDF.

Le PDF est un mode de partage, pas une nouvelle generation.

Regle canonique :

```txt
PDF = export du snapshot.
PDF ne relance pas le LLM.
PDF ne relance pas Tavily.
PDF conserve la langue choisie.
PDF conserve les sources publiques attachees.
PDF est une note analytique, pas un rapport officiel.
La mention de non-autorite se place en fin de document, pas en accueil.
```

Le PDF doit etre produit depuis un snapshot valide et immuable :

```txt
source_snapshot_id
language
layout
situation_card
lecture
approfondir
public_sources
caveats
generated_at
provenance
non_authority_notice
notice_placement=end_matter
evidence_level
```

Layouts possibles :

- `situation_card` : format court partageable ;
- `lecture` : lecture seule ;
- `approfondir` : version enrichie ;
- `complete` : SC + Lecture + Approfondir + ressources publiques.

La version PDF doit respecter la meme langue que la carte partagee. Si
l'utilisateur veut envoyer la carte dans une autre langue, le produit doit
creer ou pointer vers un snapshot dans cette langue, puis exporter ce snapshot.

Le PDF doit inclure :

- titre / header ;
- Situation soumise ;
- score et etat ;
- Lecture ;
- Approfondir si disponible ;
- sources publiques utiles ;
- date de generation ;
- identifiant du snapshot source ;
- niveau de preuve : structurel, sourcé partiellement, sourcé, ou enquête
  externe séparée ;
- mention visible : "note analytique, non rapport officiel" ;
- placement de cette mention en fin de document, pour proteger sans durcir
  l'accueil ;
- provenance : Situation Card / IAAA+, date, langue, version ;
- mention de prudence si le domaine est medical, juridique, financier ou autre
  high stakes ;
- mention claire si les sources rapides etaient partielles ou absentes.

Le PDF ne doit pas contenir :

- donnees admin ;
- trace brute du LLM ;
- `raw_tavily_response` ;
- donnees personnelles non necessaires ;
- signaux Recherche+ non verifies, sauf dans un PDF Recherche+ separe et
  clairement marque comme piste.

Le PDF ne doit jamais se presenter comme :

- rapport officiel ;
- avis juridique ;
- conseil medical ;
- conseil financier ;
- decision administrative ;
- preuve verifiee ;
- recommandation d'action obligatoire.

Si le PDF peut circuler aupres d'une autorite, il doit etre encore plus clair :

```txt
Ce document est une note analytique produite par Situation Card.
Il structure une lecture, des hypotheses et des signaux a verifier.
Il ne constitue ni un rapport officiel, ni une preuve, ni un avis professionnel.
Toute decision doit etre fondee sur les sources primaires, les procedures
applicables et les autorites competentes.
```

Regle radar :

```txt
Recherche+ ne cherche pas seulement des informations.
Elle cherche les desalignements entre ce qui legitime, ce qui protege ou
combat, et ce qui produit reellement.
```

Les resultats de Recherche+ doivent etre classes comme :

- piste ;
- signal faible ;
- contradiction ;
- source solide ;
- absence suspecte ;
- source inaccessible ;
- verification suivante.

Radar de legitimation :

- ecarts entre discours officiel, droit, promesse, reputation et justification
  publique ;
- question : qui affirme la legitimite, et quelle trace la fragilise ?

Radar protection / conflit :

- blocages, attaques, tensions, litiges, sanctions, contre-discours, securite,
  mobilisation et signaux sociaux ;
- question : qui resiste, bloque, attaque ou protege, et par quel canal faible
  cela devient visible ?

Radar production / reproduction :

- usage reel, clients, couts caches, charge portee, dependances, offres
  d'emploi, maintenance, financement, infrastructures ;
- question : qui porte reellement le systeme, et quel signe montre que cette
  charge devient instable ?

## 4b. RiskAdviceGuard

La V2 doit proteger les domaines reglementes ou a fort enjeu.

Module cible :

```txt
src/lib/safety/RiskAdviceGuard.ts
```

Principe :

```txt
SC ne donne pas une decision professionnelle prescriptive.
SC produit une carte de situation, des questions, des risques, des options a
verifier, et renvoie vers les professionnels competents quand l'enjeu est
reglemente ou vital.
```

Domaines sensibles :

- medical / sante ;
- juridique ;
- financier / investissement / credit ;
- assurance ;
- emploi / RH ;
- education et acces ;
- logement ;
- aides publiques ;
- droits fondamentaux ;
- mineurs ;
- securite / violence.

Contrat cible :

```ts
{
  domain_risk: 'normal' | 'regulated' | 'high_stakes' | 'blocked'
  advice_mode: 'analysis_only' | 'professional_referral' | 'emergency_referral' | 'refuse'
  allowed_outputs: string[]
  forbidden_outputs: string[]
  required_disclaimer?: string
  human_review_required: boolean
}
```

Regles :

- sante : pas de diagnostic ni traitement personnalise ;
- droit : pas d'avis juridique personnalise ;
- finance : pas de conseil d'investissement personnalise ;
- emploi, education, aides publiques et droits fondamentaux : prudence renforcee
  car la carte peut toucher a des decisions reglementees ou discriminatoires ;
- urgence ou danger : orienter vers aide urgente ou professionnel qualifie ;
- rester utile : structurer les faits, les questions, les sources, les preuves et
  les seuils, sans franchir la ligne du conseil prescriptif.

## 4c. Patterns humains et collectifs

La V2 doit pouvoir lire les situations humaines et les organisations humaines
avec une meme profondeur structurelle, sans psychologie sauvage.

Document canonique :

```txt
src/lib/governance/humanCollectivePatterns.md
```

Principe :

```txt
SC lit les situations comme des systemes de roles, interets, recits, desirs,
dettes, pouvoirs, tabous et rapports materiels.

Les patterns sont des lentilles, pas des conclusions.
```

Deux mouvements sont autorises :

- individu vers organisation : un cas personnel peut etre lu comme une
  micro-organisation faite de roles, loyautes, dettes, regles implicites,
  ressources rares, pouvoirs et seuils de reparation ;
- organisation vers individu : une entreprise, un Etat, une equipe ou une
  institution peut etre lue comme un sujet collectif qui protege une image,
  repete des defenses, evite certains tabous et peut sacrifier sa fonction a son
  recit.

Socle theorique indicatif :

- Goffman : face, role public, reparation ;
- Douglas : tabou et norme invisible ;
- Crozier-Friedberg : pouvoir discret et zones d'incertitude ;
- Bourdieu : capital symbolique et reconnaissance ;
- Mauss : don, dette et loyaute ;
- Boltanski-Thevenot : justification et recits moraux ;
- Schein : culture profonde ;
- Argyris / Janis : routines defensives et groupthink ;
- Turner : seuils, passages et crises de statut ;
- Girard : desir mimetique, rivalite, bouc emissaire ;
- Marx : rapports materiels, travail, valeur et ideologie ;
- Levi-Strauss : oppositions symboliques et frontieres.

Role dans le pipeline :

- `theatre` : identifier roles reels, tabous, dettes, oppositions et acteurs qui
  portent la charge ;
- `resources` : distinguer sources internes, besoin web, preuve externe et
  Recherche+ ;
- `scoring` : augmenter la pression si perte de face publique, tabou, defense
  de l'image contre la fonction, dette explosive ou rivalite mimetique ;
- `inquiry` : transformer le pattern en question observable et preuve attendue ;
- `writing` : nourrir fond, forme, phrase diamant et probabilites sans exposer
  le jargon theorique.

Regle diamant :

```txt
Une organisation bascule quand elle cesse de proteger sa fonction et commence a
proteger son image.
```

## 4c bis. ResourceService comme triade de preuves

Les ressources ne doivent pas etre une simple liste de liens "sur le sujet".
Elles doivent chercher des preuves fonctionnelles selon la triade :

```txt
Quelles sources montrent qui legitime, qui bloque ou protege, et qui produit ou
porte reellement la charge ?
```

Trois paniers de ressources :

### Ressources de legitimation

Ce qui dit le droit, le sens, la regle, la parole officielle, la certification,
la reputation ou la justification publique.

Exemples : textes officiels, communiques, declarations publiques, decisions de
justice, chartes, rapports institutionnels, presse de reference, reputation
publique.

### Ressources de protection / conflit

Ce qui montre les rapports de force, blocages, risques, controverses,
oppositions ou contre-discours.

Exemples : contentieux, sanctions, conflits publics, syndicats, oppositions,
incidents, forums specialises, signaux sociaux, OSINT public selon domaine.

### Ressources de production / reproduction

Ce qui montre le reel materiel : usage, clients, revenus, travail,
infrastructure, financement, dependances, couts caches ou capacite a durer.

Exemples : clients, revenus, offres d'emploi, pricing, chaine
d'approvisionnement, financement, dependances, equipes, publications
scientifiques, donnees de terrain.

Regle :

```txt
Le web ne doit pas chercher plus large par defaut.
Il doit chercher mieux : 1 a 3 canaux par fonction selon domaine, urgence,
latence et besoin de preuve.
```

## 4d. Archive de generation

La V2 doit distinguer les cartes sauvegardees par l'utilisateur et les
generations produites par le moteur.

Chaque generation doit produire au minimum un `GenerationEvent` :

- date ;
- surface generee : SC, Lecture, Approfondir, Ressources ou Enquete ;
- langue ;
- domaine ;
- famille de tension ;
- intention ;
- statut DialogueGate ;
- statut ressources ;
- statut QualityGate ;
- latence ;
- erreurs eventuelles ;
- hash ou taille de l'input, sans exposer le texte brut par defaut.

Le contenu complet de la carte ne doit etre conserve que dans un
`GeneratedCardSnapshot` si la politique de confidentialite l'autorise.

Modes de confidentialite :

```txt
metadata_only      journaliser l'evenement sans contenu de carte
snapshot_allowed   conserver un snapshot de carte
snapshot_private   conserver un snapshot prive, non public
private_learning_snapshot conserver question et reponse en prive admin pour
                  apprendre pendant le lancement
do_not_store        ne rien conserver hors reponse immediate
```

Regles :

- ne jamais exposer les inputs bruts sensibles dans le cockpit ;
- ne jamais stocker une carte privee comme ressource publique ;
- separer `GenerationEvent` de `GeneratedCardSnapshot` ;
- permettre a l'admin de mesurer activite, qualite, erreurs et latence sans
  transformer SC en outil de surveillance ;
- garder les cartes sauvegardees par l'utilisateur dans un flux distinct.

### Reaction telemetry

La V2 doit aussi mesurer les reactions utilisateur apres une generation.

Objectif :

```txt
Comprendre ce qui fait reagir, ou, et pourquoi.
```

Une reaction utilisateur doit etre rattachee, quand c'est possible, a une ou
plusieurs couches canoniques :

- interpretation ;
- dialogue ;
- resources ;
- theatre ;
- scoring ;
- writing ;
- quality ;
- recherchePlus ;
- UI/mobile ;
- share ;
- performance ;
- safety.

Elle doit aussi qualifier le type de reaction :

- confusion ;
- correction ;
- approval ;
- frustration ;
- surprise_positive ;
- request_deeper ;
- request_action ;
- bug_report.

Regle de confidentialite :

```txt
Par defaut, stocker metadata seulement : hash du message, taille, couches
probables, type de reaction, intensite et termes indicateurs.
Le texte brut ne peut etre conserve qu'en private_learning_snapshot.
```

Utilite cockpit :

```txt
Sur 100 reactions, combien concernent la formalisation, le hors-sol, les
ressources, le scoring, le diamant tranchant, Recherche+ ou l'interface ?
```

Capture V2 :

- `/api/reactions-v2` transforme une reaction de chat en `UserReactionEvent` ;
- la route ne persiste rien tant que la couche archive n'a pas de stockage valide ;
- le mode par defaut reste `metadata_only` ;
- le texte brut ne doit pas etre retourne ni conserve hors mode
  `private_learning_snapshot` explicitement autorise.

Mode lancement :

```txt
Launch Learning Mode
```

Pendant les premiers temps, SC peut conserver la question utilisateur et la
reponse generee en `private_learning_snapshot` afin de comprendre les vraies
demandes, les sorties ratees et les calibrages necessaires.

Conditions :

- stockage prive admin uniquement ;
- jamais public automatiquement ;
- suppression possible ;
- marquage clair dans la politique de confidentialite ;
- sujets sensibles ou high stakes : metadata_only ou snapshot fortement protege
  selon `RiskAdviceGuard` ;
- partage public seulement apres action explicite de l'utilisateur.

## 4ter. Partage public des SC

Le partage reseaux sociaux est distinct de la recherche de signaux sociaux.

Une SC ne peut etre partagee que si elle existe comme snapshot stable et qu'une
politique de partage l'autorise.

Contrats cibles :

```txt
SharePolicyContract
ShareMetadataContract
SharedSituationCardContract
```

Ordre propre :

1. `GeneratedCardSnapshot` ;
2. `SharePolicy` ;
3. page publique ou restreinte `/sc/[slug]` ;
4. metadata OpenGraph : titre, description, image, langue ;
5. boutons : copier lien, email, LinkedIn, X, WhatsApp, Facebook.

Regles :

- une SC personnelle ou sensible n'est jamais partageable brute par defaut ;
- proposer une version anonymisee si le sujet est personnel, familial, sante,
  travail sensible ou relationnel ;
- distinguer `private`, `restricted`, `public`, `anonymized_public` ;
- ne pas confondre "public" avec "indexable partout" ;
- les boutons de partage ne doivent apparaitre que si `SharePolicy` autorise le
  partage ;
- le partage doit utiliser un titre court, un resume propre et une image OG
  stable, pas le texte brut de la carte.

## 5. Modules cibles

Organisation recommandee :

```txt
src/lib/contracts/
src/lib/archive/
src/lib/interpretation/
src/lib/dialogue/
src/lib/security/
src/lib/expertisesMetiers/
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

## 9. ExpertisesMetiers Router

Modules cibles :

```txt
src/lib/expertisesMetiers/ExpertisesMetiersRouter.ts
src/lib/expertisesMetiers/domainPlaybooks.ts
src/lib/expertisesMetiers/metierLenses.ts
```

Note de vocabulaire :

Ne pas appeler cette base "Atlas" afin de ne pas la confondre avec l'Astrolabe
public de SC.

`ExpertisesMetiers` n'est pas une encyclopedie. C'est un repertoire des
questions expertes :

```txt
quoi chercher, quelles preuves attendre, quels angles morts tester,
quelles sources consulter, quels seuils surveiller.
```

Chaque expertise domaine ou metier doit fournir :

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

Une expertise metier n'est pas une etiquette. Elle doit guider :

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
- le service serveur peut utiliser Tavily ou un autre extract/search provider,
  mais les cles restent toujours cote serveur ;
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

Note de migration :

Dans la V1, `src/lib/scoring.ts` existe deja et contient la formule historique
validee. Tant que la V1 reste active, la fondation V2 peut vivre dans
`src/lib/scoringV2/` pour eviter tout conflit de chemin. Le basculement final
pourra renommer ou fusionner proprement lorsque la V1 sera retiree.

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

Triade et Astrolabe :

La triade fonctionnelle ne cree pas une neuvieme branche. Elle explique la
fonction sociale des forces visibles et aide a comprendre pourquoi une branche
devient forte ou dominante.

```txt
L'Astrolabe montre les lignes de force visibles.
La triade explique ce que ces forces font dans le systeme.
```

Effets attendus :

- `I Acteurs` : distinguer l'acteur qui legitime, celui qui protege / combat /
  bloque, et celui qui produit ou porte la charge ;
- `II Interets` : separer interet de legitimite, interet de protection et
  interet de production / reproduction ;
- `III Forces` : nommer les forces de legitimation, de defense / conflit et de
  production / reproduction ;
- `IV Tensions` : detecter les desalignements entre les trois fonctions ;
- `V Contraintes` : separer contraintes normatives, conflictuelles et
  materielles ;
- `VI Incertitudes` : demander ce qui manque sur la legitimite, le blocage ou la
  production reelle ;
- `VII Temps` : distinguer rythme institutionnel, seuil conflictuel et usure
  productive ;
- `VIII Perception` : distinguer le recit qui legitime, le recit qui designe le
  danger et le recit qui rend la charge acceptable.

Regles de scoring :

- domination de protection / conflit : peut renforcer `IV Tensions`,
  `V Contraintes` et `VII Temps` ;
- production non reconnue : peut renforcer `III Forces`, `V Contraintes` et
  `VI Incertitudes` ;
- legitimite fissuree : peut renforcer `I Acteurs`, `II Interets` et
  `VIII Perception` ;
- desalignement des trois fonctions : peut renforcer la pression globale, mais
  doit rester verifie par le theatre reel et le radar.

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

### Diamant tranchant

La phrase diamant canonique doit etre un `diamant tranchant`.

Elle ne doit pas etre prudente au point de devenir molle. Elle doit nommer la
contradiction centrale avec nettete, sans sensationnalisme et sans depasser les
preuves disponibles.

Elle tranche la forme, pas la preuve :

- elle condense la tension ;
- elle nomme ce que le systeme tente de proteger ;
- elle montre ce qui devient impossible a ignorer ;
- elle transforme la prudence en precision, pas en hesitation.

Exemples de ton :

```txt
Le groupe ne defend plus une decision ; il defend le droit de ne pas voir
qu'elle echoue.

L'organisation appelle prudence ce qui est devenu une strategie d'evitement.

La vulnerabilite n'est plus l'erreur ; c'est l'interdiction implicite de la
reconnaitre.
```

Garde-fou :

```txt
Diamant tranchant ne veut pas dire accusation gratuite.
Il dit plus clairement ce que le theatre reel permet deja de soutenir.
```

La redaction diamant tient toujours deux plans :

Fond :

- structure reelle ;
- vulnerabilite centrale ;
- acteurs, seuils et preuves ;
- contradiction ;
- angle mort qui peut renverser la lecture.

Forme :

- style d'essai court ;
- phrases nettes ;
- tension narrative ;
- pas de jargon interne ;
- pas de notice ;
- pas de logico visible ;
- une phrase diamant memorisable.

Chaque SC doit produire au moins une phrase diamant :

```txt
Une phrase courte, dense, partageable, qui condense le fond sans trahir la
complexite.
```

Contrat cible :

```ts
type DiamondSentence = {
  text_fr: string
  role: 'thesis' | 'vulnerability' | 'tipping_point' | 'key_signal'
  must_be_public: boolean
}
```

La redaction doit aussi enoncer les probabilites quand la situation l'exige.

Elle doit distinguer :

```txt
etabli       preuve ou source solide
probable     faisceau d'indices fort
plausible    hypothese raisonnable mais non tranchee
hypothese    piste a tester
inconnu      element absent ou non verifiable
```

Regle :

- ne pas transformer une probabilite en certitude ;
- ne pas cacher une probabilite derriere une prudence molle ;
- donner si possible un exemple avere ou probable ;
- dire quelle preuve ferait changer le statut ;
- separer exemples averes, exemples probables et exemples simplement
  plausibles.

Contrat cible :

```ts
type ProbabilityAssessment = {
  claim_fr: string
  status: 'established' | 'probable' | 'plausible' | 'hypothesis' | 'unknown'
  probability_label_fr: string
  confidence: number
  examples: ExampleEvidence[]
  missing_proof_fr?: string
}
```

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

- nombre de generations ;
- statut archive : metadata only, snapshot, private ou do not store ;
- taux de snapshots conserves ;
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
2. Creer `GenerationEvent` et `GeneratedCardSnapshot`, sans forcer encore la
   persistence.
3. Implementer `InterpretationService` + `DialogueGate`.
4. Implementer `ScoringEngine` depuis la formule canonique.
5. Implementer `ResourceService` + `SourceRouter`.
6. Implementer `ConcreteTheatreBuilder`.
7. Implementer `WritingEngine` + `QualityGate`.
8. Implementer `BlindSpotEngine`.
9. Brancher progressivement a l'API `generate`.
10. Ajouter cockpit admin et benchmark visible.

## 21. Regle anti-patch V2

Tout changement doit nommer le niveau corrige :

1. interpretation ;
2. dialogue gate ;
3. safety ;
4. security ;
5. ressources ;
6. theatre reel ;
7. domaine / tension / metier ;
8. scoring ;
9. redaction ;
10. enquete angles morts ;
11. quality gate ;
12. UI / rendu.

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
