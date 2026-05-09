# Patterns humains et collectifs

Ce document fige la brique conceptuelle `HumanCollectivePatterns` pour la V2.

Elle ne remplace pas `ExpertisesMetiers`, `ConcreteTheatreBuilder`,
`ScoringEngine` ou `WritingEngine`. Elle leur fournit des lentilles
structurelles pour lire les situations humaines et les organisations humaines
sans tomber dans la psychologie sauvage.

## Principe

```txt
SC lit les situations comme des systemes de roles, interets, recits, desirs,
dettes, pouvoirs, tabous et rapports materiels.

Elle cherche ce que les acteurs disent, ce qu'ils protegent, ce qu'ils imitent,
ce qu'ils transferent comme faute, et ce qu'ils gagnent ou perdent reellement.
```

Deux mouvements doivent rester possibles :

1. Lire les cas individuels comme des micro-organisations : roles, regles
   implicites, loyautes, dettes, ressources rares, pouvoir, seuils de
   reparation.
2. Lire les organisations comme des sujets collectifs : memoire, recit de soi,
   defense, tabou, peur de perdre la face, contradictions entre image et
   fonction reelle.

Regle de prudence :

```txt
Les patterns sont des lentilles, pas des conclusions.
```

Une sortie correcte formule donc :

- une hypothese ;
- un signe observable ;
- une question utile ;
- une preuve ou contre-preuve possible.

Elle ne doit pas affirmer : "c'est un bouc emissaire" ou "l'organisation a peur"
comme verite. Elle doit ecrire : "la situation peut fonctionner comme un
transfert de faute si tel acteur porte seul un echec collectif".

## Socle theorique

Le referentiel ne pretend pas resumer ces auteurs. Il extrait des familles de
patterns utilisables comme grilles structurelles.

- Erving Goffman : face, role public, embarras, scene, reparation.
- Mary Douglas : tabou, norme invisible, purete, danger, institutions qui
  pensent.
- Michel Crozier et Erhard Friedberg : acteur et systeme, zones d'incertitude,
  pouvoir organisationnel.
- Pierre Bourdieu : champ, capital symbolique, rang, legitimite, domination
  douce.
- Marcel Mauss : don, contre-don, dette, obligation, loyaute.
- Boltanski et Thevenot : regimes de justification, mondes moraux, conflit de
  grandeur.
- Edgar Schein : artefacts, valeurs affichees, hypotheses profondes.
- Chris Argyris et Irving Janis : routines defensives, refus d'apprendre,
  groupthink.
- Victor Turner : seuil, passage, liminalite, crise de statut.
- Rene Girard : desir mimetique, rivalite, bouc emissaire, accusation
  unificatrice.
- Karl Marx : rapports materiels, travail, extraction de valeur, ideologie,
  alienation.
- Claude Levi-Strauss : oppositions symboliques, frontieres, recits qui
  reconcilient une contradiction.

## Familles de patterns

### Face / role public

Question : qui risque de perdre la face si la situation est nommee clairement ?

Signal : un acteur prefere se retirer, bloquer ou justifier plutot que
reconnaitre une erreur.

### Tabou / norme invisible

Question : qu'est-ce que le groupe ne peut pas dire sans menacer son propre
ordre ?

Signal : un detail banal declenche une reaction disproportionnee.

### Zone d'incertitude / pouvoir discret

Question : qui detient un levier parce que personne d'autre ne sait faire,
decider ou verifier ?

Signal : un acteur peu visible peut ralentir, bloquer ou rendre possible la
situation.

### Capital symbolique / reconnaissance

Question : quel rang, quelle reputation ou quelle legitimite est en jeu ?

Signal : le conflit porte moins sur l'objet que sur la reconnaissance publique
qu'il donne ou retire.

### Don / dette / loyaute

Question : quelle dette implicite continue d'organiser les gestes ?

Signal : l'argument moral "apres tout ce qui a ete fait" remplace une regle
claire.

### Justification / recit moral

Question : quel monde moral chaque acteur invoque pour rendre sa position
legitime ?

Signal : les acteurs ne s'opposent pas seulement sur les faits, mais sur ce qui
compte comme juste.

### Culture profonde

Question : quelle hypothese non dite gouverne encore les comportements ?

Signal : les valeurs affichees et les gestes recompenses ne racontent pas la
meme organisation.

### Defense collective

Question : quelle verite le groupe evite-t-il d'apprendre ?

Signal : les signaux faibles sont expliques, minimises ou renvoyes a un acteur
isole.

### Seuil / passage

Question : quel ancien role ne contient plus la situation ?

Signal : la crise commence quand un statut, une place ou une promesse doit etre
renegociee.

### Desir mimetique / bouc emissaire

Question : quel objet devient desirable parce qu'un autre le rend desirable ?
Qui porte la faute qui permet au groupe de se reunifier ?

Signal : une rivalite se durcit autour d'un objet secondaire, ou une accusation
redonne provisoirement de l'unite au groupe.

### Rapports materiels / ideologie

Question : qui travaille, qui possede, qui depend, qui capte la valeur, et quel
recit rend cela normal ?

Signal : un discours moral masque une dependance economique ou une extraction
de charge.

### Oppositions symboliques

Question : quelle frontiere organise la situation : ancien/nouveau,
loyaute/autonomie, peuple/elite, terrain/siege, proche/etranger ?

Signal : un acteur brouille une frontiere que le groupe utilisait pour se
stabiliser.

## Role dans l'architecture V2

`HumanCollectivePatterns` intervient apres l'interpretation et le gate de
dialogue, avec `ExpertisesMetiers`.

```txt
InterpretationService
  ->
DialogueGate
  ->
ExpertisesMetiers
  ->
HumanCollectivePatterns
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
```

Utilisation par couche :

- `theatre` : roles, tabous, dettes, oppositions, acteur qui porte la charge.
- `resources` : distingue sources internes, web utile, preuve externe et
  Recherche+.
- `scoring` : augmente la pression si perte de face publique, tabou, defense de
  l'image contre la fonction, dette explosive ou rivalite mimetique.
- `inquiry` : transforme un pattern en question observable et preuve attendue.
- `writing` : nourrit fond, forme, phrase diamant et probabilites sans exposer
  le jargon theorique.

## Regle diamant

```txt
Une organisation bascule quand elle cesse de proteger sa fonction et commence a
proteger son image.
```

Variante relationnelle :

```txt
Un lien bascule quand ce qui devait rester un appui devient une preuve de
honte, de dette ou de domination.
```

