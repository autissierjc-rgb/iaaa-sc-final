# Protocole PDF - Situation Card

Ce document fixe la regle canonique pour les exports PDF de Situation Card.

Le PDF n'est pas un nouveau design.
Le PDF est l'export fidele du modele valide, alimente par les donnees de la
Situation Card.

## Source visuelle de reference

La reference visuelle historique est :

```txt
public/demo/sc-protected-pdf-demo.html
```

Cette reference donne l'esprit du rendu :

- page claire ;
- bordure institutionnelle fine ;
- marque IAAA+ / Situation Card ;
- Astrolabe ou logo visible ;
- metadonnees en haut ;
- titre sobre ;
- Situation soumise ;
- score / etat ;
- sections lisibles ;
- notice de statut en fin de document.

## Regles de travail

1. Ne jamais reinventer la presentation PDF a chaque correction.
2. Toute modification PDF doit partir du modele valide.
3. Une correction PDF doit avoir une intention unique :
   - titre trop grand ;
   - logo ou Astrolabe manquant ;
   - section manquante ;
   - pagination incomplete ;
   - debordement ;
   - libelle public a corriger.
4. Ne pas exposer les concepts internes dans le PDF public.
5. Ne jamais afficher `diamant` dans un export public.
6. Si un bloc deborde, corriger la pagination ou le layout ; ne pas supprimer
   du contenu.
7. Le PDF doit etre complet avant validation.

## Contenu minimum

Un export PDF Situation Card doit contenir :

1. marque / Astrolabe ;
2. titre ;
3. metadonnees ;
4. situation soumise ;
5. score / etat ;
6. Lecture ;
7. Vulnerabilite principale ;
8. Asymetrie ;
9. Trajectoires ;
10. Signal cle ;
11. Approfondir ;
12. Ressources publiques ;
13. Provenance ;
14. notice de statut.

## Methode Codex

Avant tout travail PDF :

1. lire ce protocole ;
2. identifier la correction precise ;
3. modifier le renderer ou le template source, pas un artefact PDF statique ;
4. verifier le build ;
5. generer un PDF d'aperçu depuis le vrai renderer ;
6. ne committer que la brique source validee.
