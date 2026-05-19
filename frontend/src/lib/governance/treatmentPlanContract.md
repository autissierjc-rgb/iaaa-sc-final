# Treatment Plan Contract

Couche canonique : interpretation / dialogue.

Objectif : transformer l'autorite du LLM referent en instructions de
traitement verifiables avant que Situation Card ne produise la carte.

## Principe

Le LLM referent ne doit pas seulement reformuler la question ou poser une
precision. Il doit produire un plan de traitement court :

```txt
Utilisateur
  ->
InterpretationService
  ->
TreatmentPlanContract
  ->
DialogueGate / Resources / Theatre / Writing / Quality
```

SC applique ensuite ce plan. Les couches aval peuvent verifier, enrichir,
mesurer ou refuser ; elles ne doivent pas reinterpreter silencieusement
l'intention.

## Ce que le contrat doit dire

- mode de traitement : direct, exploratoire, clarification, source d'abord,
  securite d'abord ;
- statut de la matiere : non necessaire, manquante, fournie, insuffisante,
  plug prive requis ;
- generation possible ou non ;
- generation exploratoire possible ou non ;
- matiere manquante a demander ;
- cadres a ne pas reintroduire ;
- instructions par couche canonique.

## Exemple

```txt
Question utilisateur :
Situationcard.com : quelle cible utilisateur choisir en premier ?

TreatmentPlanContract :
- mode : resource_first
- source_status : missing
- can_generate : false
- can_generate_exploratory : true
- missing_material_fr : URL du site, options visibles, public vise
- must_not_reinterpret_fr :
  - ne pas analyser Situation Card comme une entreprise externe si la demande
    porte sur l'arbitrage de lancement du fondateur
  - ne pas transformer "cible utilisateur" en analyse generale de startup
- instructions :
  - dialogue : demander l'URL ou proposer une carte exploratoire
  - resources : utiliser le site comme matiere, pas comme nouvelle question
  - writing : comparer les cibles par preuve d'usage observable
  - quality : bloquer les formules generiques si aucune matiere n'est fournie
```

## Effet attendu

Cette brique reduit les patchs de cas en deplacant l'autorite de traitement au
bon endroit : l'interpretation.

Les gates aval deviennent des controles de coherence du plan, pas des
interpreteurs concurrents.

## Statut

Passive.

Le type TypeScript existe dans `src/lib/contracts/interpretation.ts`.
Le branchement public doit ensuite etre fait dans :

- `src/lib/interpretation/InterpretationService.ts` ;
- `src/lib/intent/modelIntentInterpreter.ts` ;
- `src/lib/dialogue/DialogueGate.ts` ;
- `src/lib/input/situationReadinessGate.ts` ;
- puis seulement `src/app/api/generate/route.ts`.
