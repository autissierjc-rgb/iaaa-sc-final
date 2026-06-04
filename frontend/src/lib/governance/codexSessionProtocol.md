# Codex Session Protocol - Situation Card

Ce protocole doit etre relu au debut de chaque session de travail sur
Situation Card.

## Avant toute action

1. Identifier la branche courante.
2. Afficher `git status --short --branch`.
3. Ne creer aucune nouvelle branche sans demande explicite.
4. Ne pas changer de branche sans validation.
5. Ne jamais toucher a `.env.local`.
6. Ne jamais corriger la V1 par patch si le sujet concerne la V2/refonte.
7. Toute modification doit etre liee a une couche nommee :
   - interpretation ;
   - dialogue ;
   - safety ;
   - security ;
   - resources ;
   - expertisesMetiers ;
   - theatre ;
   - scoring ;
   - writing ;
   - quality ;
   - archive ;
   - share ;
   - UI/mobile ;
   - admin/cockpit.

## Gate operationnel anti-patch

Ce gate s'applique avant toute modification de code, de prompt, de test ou de
document de gouvernance lie a Situation Card.

Codex doit produire explicitement ces quatre lignes avant d'editer :

```txt
Symptome observe :
Couche canonique responsable :
Brique existante verifiee :
Regle generale appliquee :
```

La question de controle obligatoire est :

```txt
Quelle couche canonique produit ce symptome ?
```

Si la reponse propose une correction par nom propre, site, pays, source,
personne, entreprise, domaine d'actualite ou exemple utilisateur, Codex doit
arreter la modification et remonter a la couche canonique.

Une modification est recevable seulement si elle consiste a brancher, renforcer
ou tester une brique deja presente dans `scV2BrickMap.md`, ou si une nouvelle
brique canonique est explicitement demandee et documentee avant le code.

## Gate d'autorite d'interpretation

Le LLM referent est la seule autorite de comprehension publique :

```txt
Le LLM referent comprend.
SC structure.
```

Les fallbacks locaux d'interpretation peuvent :

- classer une demande ;
- proteger ou router ;
- normaliser un affichage ;
- signaler que le referent LLM est indisponible.

Ils ne peuvent pas :

- corriger la question a la place du referent ;
- enrichir la comprehension publique ;
- fabriquer une meilleure `situation_soumise` ;
- transformer une faute, une date, un acronyme ou une formulation confuse en
  intention canonique.

Avant toute modification de :

```txt
src/lib/intent/interpretRequest.ts
src/lib/interpretation/InterpretationService.ts
src/app/api/generate/route.ts
```

Codex doit repondre explicitement :

```txt
Cette modification preserve-t-elle le LLM referent comme autorite
d'interpretation ?
```

Si la reponse n'est pas oui, la modification doit etre arretee. La correction
doit se faire dans le flux referent, la politique de timeout ou le signalement
d'indisponibilite du referent, pas dans un fallback local de comprehension.

## Branches

Branche stable :

```txt
codex/diamond-contract-clean
```

Branche de travail V2 :

```txt
codex/admin-cockpit
```

## Methode

1. Lire les fichiers canoniques :
   - `src/lib/governance/situationCardV2CanonicalBrief.md`
   - `src/lib/governance/scCalibrationBenchmark.md`
   - `src/lib/governance/pdfExportProtocol.md` pour tout travail lie au PDF
2. Avant de modifier, dire quelle couche est concernee.
3. Faire des changements petits et coherents.
4. Lancer `npm run build` apres chaque brique.
5. Committer chaque brique separement avec un message explicite.
6. Ne jamais melanger plusieurs sujets dans un commit.
7. Laisser `.env.local` non suivi.
8. Apres commit, afficher :
   - branche courante ;
   - nombre de commits ahead ;
   - fichiers non suivis ;
   - prochaine etape proposee.

## Regle anti-derive

Si un probleme ressemble a un cas particulier, ne pas produire un patch de cas.

Corriger la couche canonique qui a produit le symptome et ajouter le cas au
benchmark ou aux regressions si necessaire.

## Regle anti-invention

Quand un symptome apparait, Codex ne doit pas inventer une nouvelle regle
locale.

Procedure obligatoire :

1. Identifier la couche canonique responsable.
2. Relire les documents canoniques existants.
3. Verifier si la regle existe deja.
4. Si elle existe, corriger uniquement l'implementation de la couche concernee.
5. Si elle n'existe pas, proposer explicitement une modification du document
   canonique avant de modifier le code.
6. Ne jamais creer une micro-regle ou un patch de cas pour traiter un symptome
   isole.

Question de controle :

```txt
Quelle regle canonique existante cette modification applique-t-elle ?
```

## Regle PDF

Le PDF est un export fidele du modele valide, pas un nouveau design.

Avant toute modification PDF :

1. relire `src/lib/governance/pdfExportProtocol.md` ;
2. identifier la correction precise ;
3. modifier le renderer ou le template source, jamais un PDF statique ;
4. ne pas exposer les concepts internes dans le PDF public ;
5. verifier que le document reste complet et correctement pagine.
