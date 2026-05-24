# Anemos, Navigation et fragments de situation

Ce document cadre un nouveau chantier produit sans creer une route parallele.
Il nomme la promesse apparue dans la discussion :

```txt
Quand une situation est eparpillee, Situation Card rassemble les fragments et
les remet en carte.
```

## 1. Idee centrale

Une situation reelle n'arrive presque jamais sous forme de brief propre.

Elle arrive comme un fil eparpille :

- messages ;
- notes ;
- liens ;
- documents ;
- captures recopiees ;
- extraits ;
- options mal nommees ;
- contraintes non formulees ;
- souvenirs de reunion ;
- intuitions ;
- hesitations.

Le produit ne doit donc pas demander a l'utilisateur de deja savoir formuler sa
situation. Il doit accepter le fourre-tout, puis reconstruire l'ordre utile.

Formule courte :

```txt
Deposez les fragments. SC retrouve la situation.
```

## 2. Role d'Anemos

Anemos n'est pas le chatbot SC actuel.

Anemos est l'ambassadeur du site, le CCO :

```txt
Chief Context Officer
Chief Conversation Officer
```

Son role public :

- accueillir ;
- expliquer ;
- orienter ;
- traduire les usages ;
- aider a choisir le bon mode ;
- rassurer l'utilisateur sur le fait qu'un fil desordonne est acceptable.

Anemos ne remplace pas Situation Card.

Regle :

```txt
Anemos oriente.
REN prepare.
Situation Card cristallise.
Recherche+ verifie.
Navigation explorera.
```

## 3. Place UI initiale

Le premier geste produit peut rester simple.

Anemos peut remplacer le bouton `?` du bloc gauche.

Objectif :

- ne pas creer une deuxieme application ;
- ne pas concurrencer le chat SC ;
- rendre l'aide plus incarnee ;
- expliquer quoi deposer et pourquoi.

Texte public possible :

```txt
Vous pouvez deposer ici les fragments de votre situation : messages, notes,
liens, documents, options, contradictions. Meme si c'est desordonne, je vous
aide a les transformer en Situation Card.
```

## 4. Navigation

Navigation est le futur mode libre.

Il ne doit pas etre confondu avec Anemos.

Navigation permettra de traverser :

- web ;
- documents ;
- conversations ;
- plugs prives ;
- MCP specialises ;
- outils metier ;
- sources officielles ;
- bases internes autorisees.

Navigation ne doit pas devenir un moteur qui conclut a la place de SC.

Regle :

```txt
Navigation explore.
SC decide de la forme partageable.
```

Avant Navigation native, le MVP est manuel :

```txt
L'utilisateur copie-colle son fil de navigation dans le chat.
Anemos lui dit que le desordre est acceptable.
SC transforme le fil en carte.
```

## 5. Couche technique : fragments canoniques

Le produit ne doit pas brancher chaque format directement sur WritingEngine.

Tous les formats doivent passer par une couche commune :

```txt
formats multiples -> fragments canoniques -> Situation Card
```

Les briques existantes concernees sont :

- `UserMaterial` ;
- `ResourceRole` ;
- `ResourceService` ;
- `SourceRouter` ;
- `REN Chat Orchestrator` ;
- `InterpretationService` ;
- `TreatmentPlanContract` ;
- `WritingEngine` ;
- `QualityGate`.

La bonne evolution n'est donc pas une nouvelle usine. C'est le renforcement du
passage entre matiere utilisateur, ressources et interpretation.

## 6. Contrat cible de fragment

Contrat indicatif :

```ts
type SituationFragment = {
  id: string
  source_kind:
    | 'manual_text'
    | 'chat_thread'
    | 'url'
    | 'pdf'
    | 'docx'
    | 'image'
    | 'spreadsheet'
    | 'plugin'
    | 'mcp'
    | 'private_connector'
  origin_label?: string
  role:
    | 'object_of_analysis'
    | 'context_for_question'
    | 'evidence_source'
    | 'private_material'
  content_text: string
  metadata?: Record<string, unknown>
  extraction_status: 'raw' | 'parsed' | 'summarized' | 'verified'
  confidence: 'low' | 'medium' | 'high'
  privacy: 'public' | 'private' | 'sensitive'
}
```

Ce contrat n'est pas encore une implementation obligatoire. Il sert a aligner
les prochaines briques.

## 7. Extraction utile

Chaque fragment doit pouvoir alimenter les objets suivants :

- acteurs ;
- options ;
- contraintes ;
- tensions ;
- preuves ;
- signaux ;
- inconnues ;
- temporalites ;
- decisions possibles ;
- prochaines verifications.

Le moteur doit conserver la separation :

```txt
Ce qui est donne par l'utilisateur.
Ce qui est extrait par SC.
Ce qui est infere par le LLM referent.
Ce qui reste a verifier.
```

## 8. Configurations metier

Anemos doit pouvoir presenter le meme geste dans plusieurs langues metier.

Exemples :

- architecte reseau : dependances, souverainete, latence, securite,
  reversibilite ;
- juriste : obligations, risques, clauses, responsabilites, preuves ;
- fondatrice : cible, traction, preuve d'usage, distribution, timing ;
- institution : gouvernance, legitimite, risques, seuils, responsabilite ;
- equipe produit : usage, friction, priorites, metriques, arbitrages.

La grammaire SC reste commune. Anemos adapte la scene.

## 9. Test produit

Le test n'est pas de savoir si l'utilisateur comprend la methode SC.

Le test est :

```txt
Une personne peut-elle coller un fil desordonne et recevoir une carte qui la
soulage, l'oriente et lui donne une prochaine decision ?
```

Signal de reussite :

```txt
Oui, c'est ca.
Je n'avais pas vu ca comme ca.
Je sais quoi faire maintenant.
```

## 10. Garde-fous

Ce chantier ne doit pas produire :

- une deuxieme generation concurrente du chat SC ;
- une nouvelle route qui contourne `UserMaterial` ;
- une extraction qui transforme la ressource en objet principal par erreur ;
- un Anemos qui promet Recherche+ sans consentement ;
- un stockage automatique des fragments sensibles ;
- un mode Navigation qui conclut sans SC.

Regle anti-derive :

```txt
Anemos absorbe le desordre.
Les contrats gardent la trace.
SC produit la forme.
Recherche+ cherche les preuves.
```

## 11. Prochaine brique logique

Premiere brique possible :

```txt
Anemos remplace le bouton ? du bloc gauche.
```

Couche :

```txt
dialogue / UI-mobile
```

Objectif limite :

- ouvrir un panneau d'aide incarne ;
- expliquer que l'utilisateur peut deposer des fragments ;
- orienter vers chat SC, Telecharger, Plug, Recherche+ ou futur Navigation ;
- ne pas modifier la generation.

Deuxieme brique possible :

```txt
Fragment readiness
```

Couche :

```txt
resources / interpretation / quality
```

Objectif limite :

- reconnaitre un fil brut comme matiere exploitable ;
- eviter les clarifications inutiles quand un ensemble de fragments contient
  deja options, acteurs ou contraintes ;
- signaler seulement ce qui manque vraiment.
