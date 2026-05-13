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
- Astrolabe ou logo visible, avec l'asset public `public/logo-iaaa.jpg` si disponible ;
- domaine visible sous la marque, au format `Atlas · {domaine}` ;
- metadonnees en haut ;
- titre sobre ;
- Situation soumise ;
- onglets publics `Cap` et `Analyse` ;
- indice de controle / etat ;
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

1. marque / Astrolabe, avec l'asset public `public/logo-iaaa.jpg` si disponible ;
2. domaine Atlas ;
3. titre ;
4. metadonnees ;
5. situation soumise ;
6. onglets publics `Cap` et `Analyse` ;
7. indice de controle / etat ;
8. Lecture ;
9. Vulnerabilite principale ;
10. Asymetrie ;
11. Trajectoires ;
12. Signal cle ;
13. Approfondir ;
14. Ressources publiques ;
15. Provenance ;
16. notice de statut.

## Methode Codex

Avant tout travail PDF :

1. lire ce protocole ;
2. identifier la correction precise ;
3. modifier le renderer ou le template source, pas un artefact PDF statique ;
4. verifier le build ;
5. generer un PDF d'aperçu depuis le vrai renderer ;
6. ne committer que la brique source validee.
