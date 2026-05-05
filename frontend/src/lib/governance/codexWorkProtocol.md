# Codex Work Protocol - Anti-Patch Discipline

This protocol is mandatory for Codex work on IAAA+ / Situation Card.

It exists to prevent symptom patches, example-specific fixes, and regressions
after context compression.

## Lock Phrase

Before any code change, Codex must apply this rule:

> I correct the general rule that produces the symptom, not the example.

If the change is about a named example, person, country, company, family case,
site, or event, Codex must stop and locate the canonical layer instead.

## Mandatory Triage

Before editing, identify the level of the defect:

1. Interpretation contract.
2. `Situation soumise` formalization.
3. Header contract.
4. Domain routing.
5. SC / Lectures / Approfondir prompt.
6. Arbre a Cames / axis VI.
7. Fallback.
8. UI rendering.
9. Test or fixture.

No code edit is valid until the level is named.

## Forbidden Fixes

Codex must not add:

- a special rule for Trump, Netanyahu, Macron, Iran, FlexUp, fishing, Cosys, or
  any other example;
- a typo correction whose only purpose is to save one visible case;
- a domain keyword shortcut that can override ChatGPT interpretation;
- a fallback phrase that explains the method instead of the situation;
- a public output that leaks internal fields such as `object interpreted`,
  `tension interpreted`, `understand_situation`, coverage labels, or route names.

Named examples may be used only as regression tests.

## Canonical Layers

If the problem concerns understanding the user, fix only one of these layers:

- ChatGPT interpretation authority.
- `Situation soumise` canonical formalization.
- Header canonical generation.
- Conversation contract propagation.
- Domain-coherent fallback.

Do not repair this class of problem inside a topic-specific branch.

## Dialogue Gate Rule

Clarification has three states only:

1. `READY_TO_GENERATE`: the object, intent and expected angle are already clear.
2. `OPTIONAL_REFINEMENT`: a useful extra precision may improve the card, but the
   user can ignore it and generate directly.
3. `BLOCKING_CLARIFICATION`: a critical object, source, referent or safety
   condition is missing.

Only `BLOCKING_CLARIFICATION` may stop generation.

When ChatGPT interpretation has already identified the object, the intent, the
user role or decision angle, and the expected answer shape, Codex must not add a
new blocking question such as "what decision?", "which actors?", or "which
angle?". Those are already answered by the canonical interpretation.

If a bug resembles a rule already decided, Codex must not create a local patch.
It must find the canonical rule, locate the gate or fallback that ignored it,
fix that layer, and add a regression case.

## Header Rule

The header is not the question and not a summary.

Line 1: Atlas domain.

Line 2: subject, at least three meaningful words. Conjunctions, articles and
prepositions do not count as meaningful words.

The subject must come from the canonical interpretation, not from a model title
or a keyword patch.

## `Situation Soumise` Rule

`Situation soumise` is a faithful formalization of the user's current request
and useful chat context.

It may correct spelling, punctuation, dates and clarity.

It must preserve actors, facts, relations, intention and requested action.

It must not become a title, domain label, source request, category, or inferred
website analysis unless ChatGPT interpretation explicitly supports that.

## Public Text Rule

Public SC, Lectures and Approfondir outputs must not contain:

- method explanations such as "SC must", "the question must remain attached",
  "intent of the question", or "imported frame";
- internal routing or coverage labels;
- sources outside the dedicated resource panel;
- vocabulary from another domain unless introduced by the user.

## Validation Before Completion

Every fix in this area must be checked with at least:

1. One political / institutional example.
2. One professional / organization / governance example.
3. One close-human-link example.
4. One site / product example if the change touches site routing.

Close-human-link includes nuclear family, extended family, friends, tribes,
associations, communities, affective collectives, and any relation organized by
loyalty, debt, recognition, place, exclusion, belonging, or protection.

The check must verify:

- no example-specific rule was added;
- header follows domain + three meaningful words;
- `Situation soumise` is faithful and not a category;
- radar does not leak internal fields;
- SC, Lectures and Approfondir stay in the same domain.

## Git Discipline

Do not commit these changes unless the user explicitly asks.

Do not stage unrelated local files such as `.env.local`, `.next`, archives, or
user backups.
