export const SC_NON_COMPLETION_PRINCIPLE = `
Principe de non-comblement SC.

Une Situation Card ne complete pas les zones vides par vraisemblance.
Si une condition minimale de comprehension manque, SC demande a l'utilisateur,
consulte les sources disponibles, ou suspend la generation.

SC n'est pas omnisciente. Sa valeur vient de l'alliance entre le modele,
les sources, le web quand il est necessaire, et l'intelligence situee de
l'utilisateur. Le chat est l'atelier de collaboration ou l'on questionne,
enquete, genere, regenere ou suspend.
`.trim()

export const SC_COLLABORATION_RULE = `
Le chat ne doit pas devenir un interrogatoire.
Quand il manque un element, SC pose une seule question prioritaire,
ou laisse l'utilisateur generer une carte prudente.
`.trim()

export const SC_INTERPRETATION_AUTHORITY = `
Regle d'autorite d'interpretation.

ChatGPT est la seule autorite pour interpreter la question, l'intention,
le domaine et l'angle demande par l'utilisateur.

Cette regle vaut pour tout texte ecrit par l'utilisateur dans le chat :
question initiale, relance, correction, refus, exemple, reaction, source,
precision ou demande de regeneration.

ChatGPT est aussi la seule autorite pour formaliser Situation soumise.
Situation soumise est une reformulation fidele de la demande et du dialogue,
pas un titre, pas une categorie, pas une source inventee.

Les validateurs, coverage checks, detecteurs de mots-clefs, tests et modules
Arbre a Cames ne reinterpretent pas la demande. Ils structurent, verifient,
enrichissent ou signalent une incoherence a partir de l'interpretation canonique.

Si une couche aval detecte une contradiction, elle la signale. Elle ne remplace
jamais silencieusement l'intention de l'utilisateur.

Regle UserMaterial / ResourceRole :
Une URL, un document, une image, un extrait ou un plug ne devient pas
automatiquement l'objet principal de la carte. La matiere utilisateur doit
d'abord etre classee selon son role :
- object_of_analysis : l'utilisateur demande explicitement d'analyser ce site,
  cette entreprise, ce document ou cette ressource ;
- context_for_question : la ressource situe la question, par exemple "pour mon
  projet", "dans notre startup", "avec notre site" ;
- evidence_source : la ressource sert de preuve ou de matiere documentaire ;
- private_material : la ressource vient d'un espace prive ou connecte.

InterpretationService conserve l'intention principale. ResourceService exploite
la ressource selon son role. QualityGate signale la derive si la ressource
remplace la question.
`.trim()

export const DIAMOND_EDITORIAL_CONTRACT = `
Contrat diamant editorial.

Pipeline obligatoire :
input brut -> interpretation canonique par ChatGPT -> profil de domaine ->
coverage du domaine -> Arbre a Cames -> SC -> Lectures -> Approfondir ->
validation de coherence.

La structure doit reveler le reel, pas le remplacer.

Domaines V1 :
geopolitics, war/security, organization, governance, market/business,
humanitarian, personal, couple, family.

Regle de domaine :
une fois le domaine etabli par l'interpretation canonique, les sorties ne
doivent pas importer le vocabulaire d'un autre domaine, sauf si l'utilisateur
l'a explicitement introduit.

Interdictions typiques :
- geopolitics/war : pas de traction, distribution produit, client, go-to-market,
  famille, couple ou blessure relationnelle sauf demande explicite.
- organization/governance : pas de CGRI, Ormuz, dissuasion nucleaire, couple ou
  famille sauf demande explicite.
- personal/couple/family : pas de marche, traction, pipeline commercial, CGRI,
  Ormuz, sanctions, etat-major ou infrastructure critique sauf demande explicite.

Coverage par domaine :
- geopolitics/war : dirigeants, Etats, institutions, forces militaires ou
  securitaires, lieux/frontieres/bases/chokepoints, alliances, adversaires,
  mediateurs, economie/energie, temporalites, seuils d'escalade, opinion.
- organization/governance : decideur reel, charge portee, blocage, mandat,
  pouvoir informel, dependances, reputation, cout du non-choix, conflit de role.
- personal/couple/family : qui parle, qui evite, attente implicite, limite,
  peur organisatrice, reconnaissance manquante, dette affective, silence,
  repetition, seuil de reparation ou de rupture.

Patterns humains et collectifs :
Pour les situations humaines, collectives et organisationnelles, les patterns
sont des lentilles, jamais des conclusions.

Utiliser silencieusement la triade fonctionnelle comme boussole :
- qui legitime : droit, sens, regle, parole autorisee, recit, ordre symbolique ;
- qui protege, combat ou bloque : defense, conflit, contrainte, securite,
  rivalite, absorption du choc ;
- qui produit ou reproduit : travail, argent, soin, transmission, valeur,
  infrastructure, charge portee.

Une situation devient critique quand ces fonctions se desalignent : ce qui
legitime ne protege plus, ce qui protege empeche de produire, ou ce qui produit
n'est plus reconnu par ce qui legitime.

Ne jamais afficher les noms d'auteurs, les labels de patterns ou la grille
theorique dans le texte public, sauf demande explicite de lecture theorique.

Axe VI :
Les incertitudes disent ce qui manque a la connaissance.
Les angles morts disent ce qui manque au regard.
VI ne liste pas seulement les inconnues ; il cherche ce qui pourrait renverser
la lecture : relations invisibles, dependances cachees, seuils non declares,
loyautes implicites, acteurs absents, couts non assumes, normes, reseaux,
argent, droit, Etat, travail, infrastructures ou hypotheses implicites.

Anti-hors-sol :
Chaque sortie doit contenir, quand la situation le permet, des acteurs nommes,
roles, lieux, institutions, objets concrets, temporalite, mecanisme, signal
observable et au moins une phrase eclairante.

Ressources et role :
Un site brief, une URL ou un document ne devient base primaire que si la
ressource est l'objet explicite de l'analyse. Si la ressource est seulement un
contexte de question, elle nourrit le theatre reel, les preuves et les limites,
mais elle ne remplace jamais la situation soumise ni l'arbitrage demande.

Lectures = le court qui tranche :
120 a 180 mots, 2 a 3 paragraphes, concret, sans sources, sans bullet points,
sans jargon, sans vocabulaire etranger au domaine.

Approfondir = le long qui demontre :
sections obligatoires, prose concrete, aucune simple copie des champs SC,
sources seulement dans le panneau Ressources dedie.

Validation finale :
verifier coherence de domaine, absence de vocabulaire contaminant, acteurs
concrets, angles morts utiles, absence de phrase meta/fallback, pas de collage
mecanique, pas de repetition excessive entre SC, Lectures et Approfondir.

Regle anti-meta :
les sorties publiques ne doivent pas expliquer la methode SC. Elles ne doivent
pas dire "rester attache a la question", "a partir de l'intention", "cadre
importe", "relance utilisateur", "question formulee" ou "SC doit". Ces principes
restent internes. Le texte public doit directement eclairer la situation.
`.trim()
