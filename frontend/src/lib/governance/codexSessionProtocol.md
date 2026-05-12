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
