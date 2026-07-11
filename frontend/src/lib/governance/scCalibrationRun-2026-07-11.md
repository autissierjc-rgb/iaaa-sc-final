# Campagne de calibrage SC — 2026-07-11

Exécution : `node scripts/sc-benchmark.mjs` — 10 situations canoniques de
`scCalibrationBenchmark.md`, génération complète réelle (`generate_full`,
writer 45 s), notation sur les 5 critères /5 du benchmark.

## Résultats

| Cas | Gate | Domaine (attendu → obtenu) | Sources | Insight | Vuln | Traj | Signal | Utilité | /25 | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| humanitaire-guerre | GENERATE | humanitarian → war | 5 | 4,5 | 5 | 4,5 | 5 | 5 | 24 | PASS |
| management-comex | GENERATE | management → governance | 4 | 4 | 4,5 | 4,5 | 4,5 | 4,5 | 22 | PASS |
| gouvernance-locale | GENERATE | governance → governance | 5 | 5 | 5 | 4,5 | 5 | 5 | 24,5 | PASS |
| business-dependance | GENERATE | startup_vc → startup_vc | 6 | 5 | 4,5 | 4,5 | 5 | 5 | 24 | PASS |
| personnel-familial | GENERATE | personal → personal | 0 (voulu) | 4,5 | 4,5 | 4 | 4,5 | 4,5 | 22 | PASS |
| geopolitique-energie | GENERATE | geopolitics → general | 6 | 1 | 1 | 2 | 2 | 2 | 8 | FAIL |
| societe-institution | GENERATE | governance → war | 2 | 2 | 2 | 2 | 2 | 2 | 10 | FAIL |
| tech-organisation | GENERATE | professional → management | 5 | 5 | 5 | 4,5 | 4,5 | 5 | 24 | PASS |
| politique-collectif | CLARIFY | — | — | — | — | — | — | — | — | BLOQUÉ |
| produit-confiance | CLARIFY | — | — | — | — | — | — | — | — | BLOQUÉ |

Moyenne des cartes notées : 19,8/25. Moyenne des PASS : 23,4/25 (excellent).
Taux de réussite produit : 6/10.

Exemples du niveau atteint quand la chaîne fonctionne :

- business : « la preuve commerciale forte **est aussi** la vulnérabilité » ;
- gouvernance locale : « la commune choisit **quel type de preuve rend la
  promesse irréversible** » ;
- tech : « des acteurs supportent la charge de coordination **sans disposer du
  pouvoir d'arbitrage** » ;
- humanitaire : seuil chiffré (>3 incidents vs capacité d'évacuation).

## Les trois défauts transverses (aucun patch par cas)

### 1. Le repli après échec du writer viole le contrat public — priorité 1

`geopolitique-energie` : writer échoué → la carte publiée vient du repli
abstrait et contient mot pour mot « le passage entre crainte, intention,
capacité réelle et acte vérifiable », formule listée dans
`ABSTRACT_UNDERSTANDING_FALLBACK_PATTERNS` (interdite). `societe-institution` :
domaine mal routé (war) → le repli applique la grammaire guerre à une école
(« commandements militaires concernés » sur une décision disciplinaire).
Chantier : pont V1→V2 — quand le writer échoue, le repli doit être le contrat
local V2 propre du bon domaine, et jamais un texte que les gates interdisent.

### 2. Routage de domaine — 3 erreurs / 8

école → war (grave : contamine la grammaire) ; accord énergétique →
general ; comex → governance (mineur). Couche : interpretation / domain
router ; à calibrer avec le référent, pas par mots-clés.

### 3. DialogueGate sur-bloquant — 2 questions canoniques stoppées

« Un mouvement citoyen grandit trop vite… » et « Une plateforme doit
arbitrer… » ont un objet, une intention et un angle clairs ; le protocole dit
que seule une clarification BLOQUANTE peut arrêter la génération. Couche :
dialogue (calibrage du gate / readiness).

## Observations secondaires

- personnel-familial : statut de preuve mal accroché une fois (« aucune preuve
  datée (statut : établi) ») — l'étiquette porte sur l'absence.
- management-comex : ancres LinkedIn un peu plaquées sur un cas interne.
- Temps : 36–61 s par carte complète (writer 45 s) — chantier Approfondir
  asynchrone inchangé.

## Règle de decision

Une évolution n'est validée que si elle améliore ces trois défauts transverses
sans dégrader les 6 PASS (re-mesure par ce même runner).
