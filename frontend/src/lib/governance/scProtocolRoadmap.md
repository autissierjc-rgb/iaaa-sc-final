# Roadmap protocole SC

Ce document programme les chantiers ouverts autour de la nouvelle lecture :

```txt
Situation Card n'est pas seulement une application.
C'est un protocole de structuration des situations complexes.
```

Objectif : ordonner les chantiers sans repartir dans une reconstruction totale.

Regle :

```txt
Ne pas refaire SC.
Requalifier, brancher et tester les briques existantes.
```

## 1. Positionnement global

La promesse publique reste simple :

```txt
Quand une situation est eparpillee, deposez les fragments.
Situation Card les remet en carte.
```

Le positionnement produit devient :

```txt
Un protocole pour transformer le chaos d'une situation en carte partageable.
```

Le positionnement interne devient :

```txt
Une architecture industrielle de structuration, compression et calibration de
situations complexes.
```

## 2. Architecture de reference

```txt
Anemos
  -> accueille, oriente, traduit

Navigation
  -> rassemble les fragments et traverse les sources

UserMaterial / ResourceService
  -> normalise les formats

InterpretationService / TreatmentPlanContract
  -> conserve l'intention canonique

ResonanceTrace / Resonance Engine
  -> diagnostique le regime de structuration

WritingEngine / QualityGate
  -> cristallise en Situation Card

Recherche+
  -> verifie les preuves et signaux externes

Archive / Admin Cockpit
  -> trace, calibre, benchmarke
```

## 3. Chantiers programmes

### Chantier A - Anemos comme aide incarnee

Couche :

```txt
dialogue / UI-mobile
```

But :

- remplacer progressivement le `?` du bloc gauche par Anemos ;
- expliquer les boutons et le geste de depot des fragments ;
- orienter vers chat SC, Telecharger, Plug, Recherche+ ou Navigation future ;
- ne pas concurrencer le chat SC.

Livrable initial :

```txt
Panneau Anemos contextuel, sans changement de generation.
```

Critere de reussite :

```txt
L'utilisateur comprend qu'il peut coller un fil desordonne.
```

### Chantier B - Fragments canoniques

Couche :

```txt
resources / interpretation / quality
```

But :

- absorber texte, URL, documents, images, plugs et futurs MCP ;
- transformer chaque entree en fragment canonique ;
- distinguer ce qui est donne, extrait, infere et a verifier ;
- eviter les clarifications inutiles quand le fil contient deja des options,
  acteurs ou contraintes.

Livrable initial :

```txt
Contrat SituationFragment et readiness sur fils bruts.
```

Critere de reussite :

```txt
Un fil copier-colle devient une matiere exploitable sans demande defensive.
```

### Chantier C - ResonanceTrace avant Resonance Engine

Couche :

```txt
interpretation / theatre / scoring / inquiry / writing / quality
```

But :

- rendre explicite le moteur de structuration deja implicite ;
- ne pas creer un moteur parallele ;
- produire une trace interne lisible par le cockpit et les tests.

Livrable initial :

```ts
type ResonanceTrace = {
  dominant_regime: string
  missing_structure: string
  structural_overload: string
  tension_pattern: string
  structural_vulnerability: string
  transition_risk: string
  trajectory_bias: string
  compression_score: number
  coherence_score: number
  warnings: string[]
}
```

Critere de reussite :

```txt
Les sorties existantes peuvent etre relues comme diagnostic de regime sans
changer l'UX ni le JSON public.
```

### Chantier D - Resonance Engine minimal

Couche :

```txt
scoring / inquiry / writing
```

But :

- agreguer les sorties existantes ;
- detecter structure manquante, surcharge, coherence, risque de bascule ;
- alimenter vulnerability, trajectoires, contraintes, incertitudes et
  Approfondir.

Livrable initial :

```txt
Module interne qui agrège l'existant et produit ResonanceTrace.
```

Critere de reussite :

```txt
Moins de resume, plus de diagnostic.
```

### Chantier E - Benchmarks de regime

Couche :

```txt
quality / admin-cockpit
```

But :

- tester les regimes de structuration sur des cas varies ;
- verifier qu'une carte voit le systeme, le point fragile et le signal cle ;
- eviter qu'une amelioration visible degrade d'autres familles.

Cas initiaux :

- conflit d'equipe ;
- reorganisation ;
- guerre regionale ;
- marche petrole ;
- startup hypercroissance ;
- SOC cyber ;
- crise ONG ;
- decision personnelle ;
- COMEX paralyse ;
- exces de process ;
- surcharge strategique ;
- polarisation sociale ;
- crise reputationnelle ;
- levee de fonds ;
- pivot produit.

Livrable initial :

```txt
Dataset de calibration RE / SC, visible admin seulement.
```

Critere de reussite :

```txt
Chaque evolution ameliore le diagnostic sans casser l'effet diamant.
```

### Chantier F - Navigation native

Couche :

```txt
resources / dialogue / security / archive
```

But :

- passer du copier-coller manuel a la navigation assistee ;
- interroger web, documents, plugs et MCP specialises ;
- conserver consentement, privacy et trace de provenance.

Livrable initial :

```txt
Navigation reste nommee mais non implementee tant que les fragments canoniques
ne sont pas solides.
```

Critere de reussite :

```txt
SC sait deja traiter un fil importe avant de naviguer elle-meme.
```

### Chantier G - Licence institutionnelle

Couche :

```txt
strategy / governance
```

Statut :

```txt
Nommer maintenant, traiter plus tard.
```

Hypothese :

```txt
Resonance Engine peut devenir une brique licenciable pour institutions,
industries, cabinets et environnements souverains.
```

Ne pas traiter maintenant :

- pricing ;
- packaging ;
- hebergement dedie ;
- contrat commercial ;
- API externe ;
- certification.

Garder seulement le nom :

```txt
Licence institutionnelle Resonance Engine
```

## 4. Ordre recommande

```txt
1. Pousser les notes de gouvernance deja creees.
2. Implementer Anemos aide incarnee a la place du ?.
3. Ajouter le contrat SituationFragment.
4. Ajouter ResonanceTrace sans changer la generation.
5. Brancher ResonanceTrace au cockpit / traces internes.
6. Utiliser ResonanceTrace pour renforcer WritingEngine et QualityGate.
7. Ajouter benchmark regimes.
8. Revenir a Navigation native.
9. Revenir a la licence institutionnelle.
```

## 5. Ce qu'il ne faut pas faire

- creer un deuxieme generateur ;
- exposer les niveaux internes au front ;
- exposer l'Arbre a Cames ;
- remplacer Anemos par le chat SC ;
- remplacer SC par Navigation ;
- brancher MCP avant d'avoir un contrat fragment solide ;
- transformer la licence en chantier produit maintenant ;
- patcher `/api/generate` pour simuler RE.

## 6. Formule de gouvernance

```txt
Anemos rend l'entree humaine.
Navigation rend les sources traversables.
Les fragments rendent le chaos traitable.
Le Resonance Engine rend la structure mesurable.
Situation Card rend la situation partageable.
Recherche+ rend la preuve verifiable.
```

