# Logico - Situation Card

This note defines the logical discipline around Situation Card work. It is a
governance note, not an active runtime prompt.

## Purpose

Logico protects the system from local fixes that solve one example while
damaging the general architecture.

Every correction must answer one question:

> Is this a general contract problem, or only a bad generation example?

If it is only one example, do not add a topic-specific patch.

If it is general, express it as:

1. a product rule;
2. a passive regression case;
3. a small implementation only when the rule is already clear.

## Non-Negotiable Logic

ChatGPT/model interpretation remains the first authority. Downstream code can
only preserve, structure, verify, enrich, or report incoherence.

The system must never let a keyword override the interpreted situation.

Examples of forbidden logical drift:

- `site` in a family sentence does not create a site analysis.
- a geopolitical name does not create a generic crisis overview.
- a country name does not require an explanatory parenthesis.
- a proper name does not require a glossary.
- `Incertitudes` as visible label does not erase the analytical value of
  angles morts.

## Correction Sequence

When a regression appears:

1. Name the regression in plain language.
2. Identify whether it belongs to interpretation, display, scoring, sources,
   lectures, approfondir, or UI.
3. Add or tighten a passive regression case.
4. Run type checks.
5. Only then edit runtime behavior if the passive case shows a real gap.

No broad rewrite should happen before the regression is named.

## Scoring Discipline

The final Situation Card is the scoring authority.

`state_index_final` and `astrolabe_scores` must tell the same story.

Stable scores should not display a flattened astrolabe with many moderate axes.
High-pressure situations may have dominant axes, but hierarchy must remain
readable.

## Notice Discipline

Any public notice or internal explanation must describe the real alliance:

SC does not pretend to know everything. It collaborates with the user, available
sources, and web research when needed. When the minimum knowledge is missing, it
asks, investigates, or suspends instead of inventing.
