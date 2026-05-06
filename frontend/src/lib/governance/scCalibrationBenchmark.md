# SC Calibration Benchmark

Objectif : verifier qu'une Situation Card produit un vrai effet de lecture,
pas seulement une synthese propre.

Ce benchmark est un referentiel produit. Il ne modifie pas directement le
moteur de generation. Il sert a evaluer les sorties SC, Lectures et
Approfondir avant de valider une evolution d'architecture.

La reference d'interpretation du benchmark est le LLM referent du projet :
ChatGPT / GPT aujourd'hui, ou un autre LLM demain si le projet change de
modele. La regle importante est l'autorite unique d'interpretation, pas le nom
du fournisseur.

## Deux scorings a ne pas confondre

Le calibrage historique separait deux mesures :

1. scoring qualite des SC, sur 25 points ;
2. scoring d'etat de la situation, sur 100 points.

Le premier mesure l'utilite et la justesse de la carte. Le second mesure la
pression structurelle de la situation.

Note historique : au moment du calibrage original, l'axe VI etait encore pense
comme `Incertitude`. La notion d'`angle mort` est venue ensuite et enrichit la
fonction de VI. Les tests doivent donc distinguer :

- calibrage original : incertitude = ce qui manque a la connaissance ;
- doctrine actuelle : incertitudes + angles morts = ce qui manque a la
  connaissance et ce qui manque au regard.

L'Astrolabe public actuel est conserve. Les angles morts enrichissent VI ; ils
ne remplacent pas les huit branches publiques actuelles.

## 1. Scoring qualite des SC

Chaque carte est notee sur 5 criteres, chacun de 1 a 5.

```txt
Insight              /5
Main Vulnerability   /5
Trajectories         /5
Key Signal to Watch  /5
Global Usefulness    /5
```

Total maximum : 25.
Moyenne maximum : 5.

## Seuils qualite

```txt
Average >= 4.0    PASS
Average >= 3.5    REVIEW
Average < 3.5     FAIL / REWRITE
```

## Criteres

### Insight

La carte fait-elle voir quelque chose de plus profond que la demande initiale ?

Score haut si :

- elle fait apparaitre la structure cachee ;
- elle ne resume pas seulement les faits ;
- elle produit un effet de reconnaissance : "oui, c'est ca".

### Main Vulnerability

La vulnerabilite principale est-elle precise, structurelle et non banale ?

Score haut si :

- elle est precise ;
- elle est testable ;
- elle nomme le point de rupture ;
- elle evite les generalites comme "manque de communication", "incertitude",
  "tension" ou "situation fragile".

### Trajectories

Les trois trajectoires sont-elles distinctes et plausibles ?

Score haut si :

- Stabilization, Escalation et Regime Shift ne sont pas trois intensites du
  meme scenario ;
- chaque trajectoire a une logique propre ;
- chaque signal associe est observable.

### Key Signal to Watch

Le signal cle dit-il quoi observer ensuite ?

Score haut si :

- il est concret ;
- il est observable ;
- il est surveillable ;
- il ne se contente pas d'une abstraction.

### Global Usefulness

La carte aide-t-elle vraiment a comprendre, decider ou agir ?

Score haut si :

- on voit mieux la situation apres lecture ;
- on sait quoi surveiller ;
- on comprend le risque central ;
- la carte est partageable et utile.

## Questions qualitatives

```txt
1. Je vois mieux le systeme ?
2. La vulnerabilite centrale semble juste ?
3. Je sais quoi surveiller ?
```

Reponses possibles :

```txt
Oui / Moyen / Non
```

Formule courte :

```txt
Voir le systeme - sentir le point fragile - savoir quoi regarder.
```

## 2. Scoring d'etat de la Situation Card

Le scoring d'etat est separe du scoring qualite.

Il produit `state_index_final` sur 100 points et un label d'etat.

Bareme canonique historique :

```txt
0-44      Routine / Stable          green
45-59     Tension                   gold / yellow
60-74     Instability               orange
75-100    Regime Shift              red
```

Approche validee :

```ts
computeState(branches, radar)
```

Fallback possible si `computeState` est indisponible :

```ts
state_index = weightedMix(impact, urgency, uncertainty, reversibility)
```

Mais la version de reference reste :

```txt
branches + radar -> state_index_final + state_label
```

## Radar de decision

Le radar utilise 4 axes :

```txt
Impact         gravite ou portee des consequences
Urgency        pression temporelle
Uncertainty    niveau d'inconnu reel
Reversibility  facilite ou difficulte a revenir en arriere
```

Ces axes alimentent :

```txt
state_index_final
state_label
key_signal_to_watch
```

## Dix situations fictives de calibrage

Le benchmark doit couvrir des domaines differents pour verifier que le moteur
ne fonctionne pas seulement sur la geopolitique.

### 1. Humanitaire / guerre

Une ONG doit decider si elle maintient une mission pres d'une ligne de front.

But du test : risque operationnel et temporalite courte.

### 2. Management

Un dirigeant decouvre une fracture silencieuse dans son comite executif.

But du test : tensions internes et vulnerabilite cachee.

### 3. Gouvernance locale

Une commune hesite a accepter un projet industriel createur d'emplois mais
conteste.

But du test : conflits d'interets publics.

### 4. Business / strategie

Une startup gagne un gros client mais devient dependante de lui.

But du test : dependance asymetrique.

### 5. Personnel / familial

Une famille doit decider du placement d'un parent age.

But du test : delicatesse humaine sans psychologie molle.

### 6. Geopolitique / energie

Un pays allie hesite a rompre un accord energetique devenu politiquement
toxique.

But du test : contraintes croisees.

### 7. Societe / institution

Une ecole fait face a une polemique apres une decision disciplinaire.

But du test : perception, legitimite et reputation.

### 8. Tech / organisation

Une entreprise adopte une IA qui accelere le travail mais desorganise les
equipes.

But du test : transformation systemique.

### 9. Politique / collectif

Un mouvement citoyen grandit trop vite et perd sa coherence interne.

But du test : passage de l'elan a la structure.

### 10. Produit / gouvernance

Une plateforme numerique doit choisir entre croissance rapide et confiance
utilisateur.

But du test : arbitrage scalable et responsabilite.

## Format tableur conseille

```txt
A: ID
B: Domaine
C: Situation fictive
D: Insight /5
E: Vulnerability /5
F: Trajectories /5
G: Key Signal /5
H: Global Usefulness /5
I: Je vois mieux le systeme
J: La vulnerabilite semble juste
K: Je sais quoi surveiller
L: Notes
M: Pass / Review / Fail
N: Main issue
O: Total
P: Average
```

Formules :

```excel
O2=SUM(D2:H2)
P2=AVERAGE(D2:H2)
M2=IF(P2>=4,"PASS",IF(P2>=3.5,"REVIEW","FAIL"))
```

## Regle diamant

Le centre du calibrage est la Main Vulnerability.

Elle doit nommer :

- une dependance critique ;
- une asymetrie structurelle ;
- un acteur porteur cache ;
- un mecanisme fragile ;
- un retard dangereux ;
- une contradiction de role ;
- une rupture de reconnaissance ;
- un contrat implicite viole ;
- une frontiere qui s'efface ;
- un effondrement de sens.

Mauvais :

```txt
La situation est fragile.
Le manque de communication cree un risque.
L'incertitude complique la decision.
```

Bon :

```txt
La situation depend d'un acteur qui porte la charge sans disposer de l'autorite
necessaire pour la stabiliser.
```

ou :

```txt
Le systeme tient par une promesse implicite que les parties continuent
d'utiliser publiquement tout en cessant d'y croire operationnellement.
```

## Lecture, Approfondir et enquete

Le benchmark doit verifier la structure cible suivante :

```txt
Situation Card
  - Lecture
  - Approfondir
      - Analyse enrichie
      - Incertitudes / angles morts
      - Ressources
      - Lancer l'enquete
```

Approfondir est la page enrichie unique.

L'enquete n'est pas une page separee et ne doit pas ralentir l'ouverture
d'Approfondir. Elle est une action optionnelle, declenchee depuis les angles
morts, pour chercher des preuves, signaux, sources ou contre-hypotheses.

Critere de qualite :

```txt
Approfondir montre les angles morts.
L'enquete cherche a les verifier.
```

Le benchmark doit donc penaliser deux erreurs :

- un Approfondir qui cache ou dilue les angles morts ;
- une enquete qui alourdit l'experience initiale au lieu de rester optionnelle.

## Regle d'usage

Avant une evolution majeure du moteur SC, tester ce set et noter les sorties.

Une evolution n'est pas validee si elle ameliore un cas visible mais degrade
l'effet de lecture global, la vulnerabilite centrale, les trajectoires ou le
signal cle sur plusieurs familles.

Ambition produit :

```txt
Situation Card ne remplace pas l'expertise.
Elle organise la rencontre entre les expertises.
```
