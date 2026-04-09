# IAAA+ · Situation Card — PROJET_MASTER.md
**Source de vérité canonique. Lire avant toute modification.**
**SIREN 920 042 439 · La Rochelle · JCA directeur publication**

---

## 1. STACK & DÉPLOIEMENT

```
Frontend  : Next.js 14 · Vercel (auto-deploy sur git push master)
Repo      : github.com/autissierjc-rgb/iaaa-sc-final (privé)
Local     : C:\Users\autis\iaaa-sc\iaaa-sc-final-local\frontend
Fichiers  : C:\Users\autis\ (HomeClient_N.tsx, api_generate_route.ts, JSON)
DNS       : situationcard.com → Vercel
```

**Règles de travail :**
- Fichiers dans `C:\Users\autis\` — jamais dans Downloads
- Une modification à la fois via PowerShell ou Ctrl+H dans VS Code
- `npm run build` avant tout `git push`
- Jamais télécharger depuis Claude outputs — utiliser PowerShell directement

---

## 2. FICHIERS CLÉS

```
src/app/api/generate/route.ts         → Gate + Moteur SC (NE PAS RÉGÉNÉRER)
src/components/home/HomeClient.tsx    → Home + SC Panel (modifier par str_replace)
src/app/page.tsx                      → import HomeClient, ne pas toucher
public/pictos/                        → tous les pictos (voir §6)
public/data/                          → JSON démo : ong-rdc.json, sequestration-v2.json, iran-j19.json
```

---

## 3. ARCHITECTURE GATE (route.ts)

**4 modes — détection TypeScript pure (zéro LLM) :**
```
BLOCK   → "confirme que j'ai raison", biais explicite
GENERATE → upload, marqueurs org, marqueurs analyse, défaut
CLARIFY  → contexte personnel sans éléments structurants
FLASH    → status_markers + pas de contexte perso/org
```

**Ordre de priorité :** BLOCK > GENERATE (org/analyse) > STATUS (flash) > PERSONAL (clarify) > GENERATE

**Flux UI :**
- FLASH → réponse 2 lignes dans le chat gauche + bouton "Situation Card complète"
- GENERATE → SC dans le bloc droit
- CLARIFY → questions dans le chat gauche, boussole inactive
- BLOCK → message rouge, boussole inactive

---

## 4. CALIBRAGE SC (FIGÉ — ne pas modifier sans validation terrain)

### Formule index
```
astrolabe_base = (sum(raw_scores) / 24) × 100
radar_pressure = (Impact-1)/2×0.30 + (Urgence-1)/2×0.25 + (Incertitude-1)/2×0.25 + (Réversibilité-1)/2×0.20
state_index_raw = astrolabe_base × 0.65 + (radar_pressure × 100) × 0.35
Ajustement : -5 à +5 max, jamais silencieux
state_index_final = clamp(state_index_raw + adjustment, 0, 100)
```

### États
```
0–39   → Stable        / Clear
40–54  → Contrôlable   / Navigable
55–69  → Vigilance     / Watch
70–89  → Critique      / Critical
90–100 → Hors contrôle / Loss of Control
```

### Règles de scoring astrolabe (strictes)
```
TENSIONS=3    : conflit explicite entre acteurs NOMMÉS + impact structurel. Friction seule → max 2
INTERESTS=3   : incentives divergents nommés ("X veut A, Y veut B"). Enjeu seul → max 2
UNCERTAINTY=3 : systémique, imprévisible même pour observateur informé. Décisionnel → max 2
SPACE=3       : contraintes géographiques driver principal
TIME=3        : deadline irréversible contrainte centrale
RÈGLE GLOBALE : max 3 branches à score 3 sur l'ensemble de l'astrolabe
PRIMAIRES     : max 1 (2 si vraiment égales, jamais 3)
```

### Labels
```
0 = Absent · 1 = Faible · 2 = Modéré · 3 = Dominant
```

### Cohérences obligatoires
```
Si Hors contrôle → index ≥ 90 ET au moins 2 dimensions radar à 3
Si index > 70 ET aucune branche à 3 → incohérence, revoir
```

---

## 5. STRUCTURE SC — 3 ONGLETS (FIGÉE)

### Onglet SITUATION
```
1. SITUATION SOUMISE (italique Cormorant)
2. ASTROLABE (losanges bleu/ambre/corail)
3. FORCE LINES (barres horizontales même largeur astrolabe)
4. --- séparateur ---
5. READING (insight)
6. MAIN VULNERABILITY
7. ASYMÉTRIE
```

### Onglet CAP
```
1. ANCHOR (hook) + picto cap.png
2. WATCH + picto jumelle.jpg
3. TRAJECTOIRES + picto boussole.png
   → Stabilisation (vert #1D9E75) / Escalade (rouge #E06B4A) / Rupture (bleu #378ADD)
4. KEY SIGNAL
```

### Onglet ANALYSE
```
1. DECISION RADAR + picto radar.png
   → Index grand + chips Impact/Urgency/Uncertainty/Reversibility
2. AVERTISSEMENT
3. MOUVEMENTS RECOMMANDÉS (numérotés)
4. SYNTHÈSE
5. TRACABILITÉ + picto Tracabilité.png (date + auteur + version)
```

### Boutons bas SC
```
FR/EN switcher | Partager (navy) | Lectures (cartes.jpeg) | Collaboration (Tracabilité.png)
```

---

## 6. PICTOS — MAPPING DÉFINITIF

```
public/pictos/LOOGO IAAA+.jpg     → Logo header (toutes pages, lien vers home)
public/pictos/cap.png             → Onglet Cap / ANCHOR
public/pictos/jumelle.jpg         → WATCH
public/pictos/boussole.png        → TRAJECTOIRES
public/pictos/radar.png           → DECISION RADAR
public/pictos/vulnerabilite_nobg.png → Vulnérabilité (décoratif)
public/pictos/cartes.jpeg         → Bouton Lectures
public/pictos/Tracabilité.png     → Bouton Collaboration + section Tracabilité
public/pictos/horloge.jpg         → Sous-barre Historique
public/pictos/Enregistrer_nobg.jpg → Sous-barre Enregistrées
public/pictos/sphere atlas.svg    → Décoration ATLAS
```

---

## 7. DESIGN SYSTEM (FIGÉ)

### Palette
```
NAVY    : #1B3A6B  (CTA important, header SC, bouton Partager)
GOLD    : #B89A6A  (labels sections, légende astrolabe)
GOLD_L  : #CCA364  (accents, centre astrolabe)
BG      : #F5F3EE  (fond général)
BG_P    : #FAFAF7  (fond bloc gauche)
BG_PR   : #F7F5F0  (fond bloc droit)
TXT     : #1a2a3a
TXT2    : #5a6a7a
TXT3    : #9aabb8
BDR     : rgba(26,42,58,0.1)
BDR_G   : rgba(184,154,106,0.25)
```

### Couleurs états & trajectoires
```
Stable/Stabilisation  : bleu   #378ADD / bg #E6F1FB
Vigilance/Escalade    : jaune  #EAB308 / bg #FEF9C3  (pas de vert)
Critique/Rupture      : rouge  #E24B4A / bg #FCEBEB
Hors contrôle         : rouge foncé #9B1515
```

### Astrolabe — spec figée
```
3 losanges par branche, du centre vers l'extérieur :
  Losange 1 (score ≥ 1) → bleu pastel  #B8D4F0 / stroke #7AAEDC  → "Faible"
  Losange 2 (score ≥ 2) → ambre pastel #F0CA70 / stroke #D4A830  → "Modéré"
  Losange 3 (score = 3) → corail       #E87C7C / stroke #C84040  → "Dominant"
  Inactif              → parchemin    #E0DCD4 / stroke #C8C4BC
Anneau laiton extérieur, 32 graduations, chiffres romains cerclés
LABEL_R = 125
```

### Typographie
```
Cinzel      : labels, sections, headers (letterSpacing: '.1em')
Cormorant Garamond : titres SC, insight, italiques (fontSize 14+)
DM Sans     : body, textarea, interface
```

### Règles design
```
Sobre, premium, évidente, sans effets gadgets
1 seconde pour comprendre / 3 secondes pour s'engager / 10 secondes pour être convaincu
Blue (#1B3A6B) UNIQUEMENT pour CTAs importants (Partager)
Restreint/Public : transparent, border #dde3e8, quasi-invisibles
Phrase signature : "Que se passe-t-il vraiment ?" (Cormorant italic gold)
Tagline : "Voir la structure pour pouvoir décider"
```

---

## 8. BILINGUE FR/EN

**Toujours en anglais dans les deux langues :**
```
"POWERED BY IAAA+" · "SITUATION CARD"
```

**Toujours traduits :**
- Tous les boutons, labels, onglets, messages
- Les champs SC : title_en, insight_en, vulnerability_en, etc.
- Switcher FR/EN dans les boutons bas de la SC

---

## 9. RÈGLES DE CONTENU SC

```
- SC = instrument de clarté, PAS outil de décision
- JCA dans les mentions légales (pas nom complet)
- Pas d'em-dash (—) dans les SC
- Acronymes expliqués à la première occurrence
- Noms propres avec fonction à la première occurrence
- Sources inline interdites dans le corps des SC
- Arbre à cames : jamais nommé publiquement
```

---

## 10. COMPOSANTS PRÉVUS (PAS ENCORE CRÉÉS)

```
src/components/card/SituationCardPanel.tsx  → extraire de HomeClient.tsx (V2)
src/components/card/AstrolabeRadial.tsx     → extraire de HomeClient.tsx (V2)
Anemos chatbot                              → après staging complet
Pages /about /legal /contact               → en français, JCA
6 cartes Iran supplémentaires              → dans public/data/
```

---

## 11. ATLAS — FICHES DÉMO

```
public/data/ong-rdc.json          → ONG RDC, Contrôlable 54, validé terrain Maël
public/data/sequestration-v2.json → Séquestration, Critique 85
public/data/iran-j19.json         → Iran Jour 19, Hors contrôle 91
```

**6 cartes Iran manquantes à créer :** Ormuz, Décideurs, Troupes au sol, etc.

---

## 12. NORME SC GÉOPOLITIQUE ACTIVE

```
Bandeau live si situation en cours
Chronologie faits bruts avec dates et citations directes
Fiches décideurs : comportement révélé vs discours
  → Ce qu'ils disent / Ce que leurs actes révèlent / Signal à surveiller
Valable pour : Clarity, SIS, IAAA+
```

---

*Dernière mise à jour : 9 avril 2026*
*Ne pas modifier ce fichier sans validation de JCA*
