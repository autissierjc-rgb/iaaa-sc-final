# Diamond Contract - Situation Card / IAAA+

Source: `prompt diamant.txt`, provided by the project owner on 2026-05-04.

This document is a product and editorial contract. It is not an active prompt yet.
It must be integrated progressively through small, tested changes.

## Core Doctrine

Situation Card must reveal the real structure of a situation, not replace it with
abstract vocabulary.

SC is not omniscient. It does not fill empty boxes by plausibility. When the
minimum conditions for understanding are missing, it asks the user, uses
available sources, uses the web when necessary, or suspends generation.

The chat is the collaboration workshop: question, generate, regenerate, enquire,
or suspend. It must not become an interrogation.

## Interpretation Authority

This rule is incorruptible:

> ChatGPT is the sole authority for interpreting the user's question, intention,
> domain, and requested angle.

No other layer may reinterpret the user's intent from keywords.

This applies to every text written by the user in the chat: first question,
follow-up, correction, refusal, example, emotional reaction, source, precision,
or regeneration request.

ChatGPT must also be the sole authority for formalizing `Situation soumise`.
It reformulates faithfully from the whole dialogue context without inventing an
angle, source, category, or title in place of the user's request.

Therefore:

- validators do not interpret the question;
- coverage checks do not replace the user's intention;
- Arbre a Cames does not override the interpreted request;
- regression tests do not decide what the user meant;
- keyword detectors may only assist, never govern.
- no downstream module may fabricate `Situation soumise` from a keyword category
  such as "site officiel", "reaction to", "market", or "relationship" without
  the model interpretation explicitly supporting it.

Downstream modules receive the interpreted request and must preserve it. Their
role is to structure, verify, enrich, or signal incoherence. They must never
silently transform a family emotion into a site analysis, a geopolitical question
into a market assessment, or a causal question into a generic crisis overview.

`Situation soumise` is a faithful formalization, not a title and not a category.
It may correct spelling, punctuation, chronology, and clarity. It must preserve
the user's actors, facts, dates, relationships, intention, and useful chat
additions.

If a validator detects a contradiction, it reports it. It does not rewrite the
intent.

## Canonical Pipeline

Target pipeline:

1. Raw input.
2. Domain detection.
3. Coverage check.
4. Enriched Arbre a Cames.
5. Situation Card.
6. Lectures.
7. Approfondir.

Each step must preserve the domain and the user's actual question.

## Domains V1

Minimum domain profiles:

- `geopolitics`
- `war_security`
- `organization`
- `governance`
- `market_business`
- `humanitarian`
- `personal`
- `couple`
- `family`

Once a domain is detected, vocabulary from other domains is forbidden unless the
user input explicitly introduces it.

Examples:

- A geopolitical card must not use startup vocabulary such as traction,
  distribution, client, go-to-market, or pipeline commercial unless the user
  explicitly asks for that angle.
- A family or couple card must not use geopolitical vocabulary such as CGRI,
  sanctions, detroit, state-major, or nuclear deterrence unless the user
  explicitly introduces it.
- A professional or governance card must not drift into family, couple, or
  geopolitical framing without textual support.

## Arbre a Cames V1

Keep the eight axes:

1. Acteurs: who acts, influences, blocks, or carries the charge.
2. Interets: what each party seeks, defends, or refuses.
3. Forces: what pushes, supports, or accelerates the situation.
4. Tensions: what opposes, weakens, or puts under pressure.
5. Contraintes: what limits action and reduces margins.
6. Incertitudes / angles morts: what remains unclear, unstable, unverifiable,
   invisible, or capable of reversing the reading.
7. Temps: rhythms, delays, urgencies, and windows of action.
8. Perception: narratives, beliefs, reputations, and readings that shape
   behavior.

Visible label rule: axis VI may display as `Incertitudes`, while the analytical
function remains `Incertitudes + angles morts`.

Canonical formula:

> Les incertitudes disent ce qui manque a la connaissance. Les angles morts
> disent ce qui manque au regard.

## Axis VI

Axis VI must not only list unknowns. It must identify blind spots capable of
reversing the reading:

- hidden relationships;
- invisible dependencies;
- influence networks;
- unverifiable intentions;
- undeclared thresholds;
- absent actors;
- hidden costs;
- implicit loyalties;
- facts that actors may have an interest in keeping invisible.

In a geopolitical case, this can include long relationships between leaders,
private diplomatic channels, internal factions, military thresholds, economic
constraints, or energy dependencies.

In organizations, this can include informal power, hidden decision makers,
role conflict, reputation pressure, or a charge carried by someone not named in
the org chart.

In couple, family, or personal cases, this can include unspoken expectations,
invisible loyalties, affective debt, fear of abandonment, fear of suffocation,
or a conflict of place hidden behind a practical dispute.

## Anti Hors-Sol Test

Every SC, Lectures, and Approfondir output must pass this test before display:

- Are real actors named?
- Are concrete places, institutions, roles, objects, or mechanisms present?
- Is there an identifiable temporality?
- Is there an observable signal?
- Is there at least one useful blind spot?
- Is there one short, memorable sentence?
- Is the vocabulary coherent with the detected domain?
- Is there any fallback, meta phrase, or generic sentence that could apply to
  any situation?

If the answer is weak, reinforce before displaying.

## Lectures

Lectures is the short form that cuts through.

Rules:

- 120 to 180 words.
- Two to three paragraphs.
- No bullets.
- No sources.
- No jargon.
- No generic phrase.
- No vocabulary from another domain.

It must name:

1. What the situation really is.
2. The central contradiction.
3. What still holds.
4. The tipping point.

## Approfondir

Approfondir is the long form that demonstrates.

Required sections:

1. Ce que la situation est réellement.
2. Ce qui tient le système.
3. Ce qui l'affaiblit.
4. Ce qui pourrait déclencher une escalade.
5. Ce qui pourrait produire une bascule.
6. Ce qu'il faut surveiller maintenant.
7. Sources, only if available.

Each section must reformulate rather than copy, stay domain-coherent, and contain
concrete elements.

## Radar

Radar details must be explanatory, not only numerical.

Each radar explanation must cite a concrete actor, mechanism, place, role,
date, institutional constraint, or observable signal when available.

The `uncertainty` axis must include blind spots where relevant.

## Final Validation

Before returning the card, the system should eventually validate:

- domain coherence;
- no contaminating vocabulary;
- concrete actors and mechanisms;
- useful blind spots;
- no meta/fallback phrases;
- no hollow abstraction;
- no mechanical copy between SC, Lectures, and Approfondir;
- coherent scoring between `state_index_final` and `astrolabe_scores`.

This contract must be implemented progressively:

1. Document only.
2. Silent validators.
3. Lectures and Approfondir refinements.
4. Arbre a Cames and axis VI strengthening.
5. Regression tests on fixed cases.

Companion governance notes:

- `codexWorkProtocol.md`: mandatory anti-patch procedure for Codex changes,
  including header and `Situation soumise` correction discipline.
- `logico.md`: correction discipline and anti-patch logic.
- `notice.md`: operational notice for branch safety, headers, `Situation
  soumise`, and axis VI.
