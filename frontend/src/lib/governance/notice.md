# Notice - IAAA+ Situation Card

This notice records the working contract for the current branch.

## Current Safe State

The presentable state is preserved on branch `presentable-sis-freeze`.

The integration branch is `diamond-contract`.

The `diamond-contract` branch contains only governance and passive validation
work after the freeze. It must remain reversible until the owner accepts runtime
integration.

## User Question Authority

For every text written in the chat, ChatGPT/model is the only authority that
interprets:

- the user's question;
- intention;
- domain;
- requested angle;
- follow-up meaning;
- refusal or correction;
- useful additions to the dialogue.

All downstream modules must preserve that interpretation.

## Situation Soumise

`Situation soumise` is the formalized question, not a title and not a category.

It may clean spelling, punctuation, chronology, and clarity. It must preserve
actors, facts, relationships, dates, and intention.

It must not inject:

- glossary explanations;
- country descriptions;
- invented source requirements;
- "site officiel" unless the user really asks about a site;
- topic labels such as "reaction to" or "market" unless the interpreted request
  supports them.

## Header

The header has two lines:

1. Atlas/domain.
2. Subject, with at least three meaningful words.

The header must not repeat the full question and must not contain explanatory
parentheses.

## Axis VI

The visible label is `Incertitudes`.

The function remains `Incertitudes + angles morts`.

Angles morts may and should appear in analysis when they reveal what the
reading could miss.

## Safety Procedure

Before runtime changes:

1. Keep the freeze branch intact.
2. Add passive regression coverage first.
3. Run `npx tsc --noEmit`.
4. Run `npm run build` only with the dev server stopped or after cleaning the
   Next cache if needed.
5. Never commit `.env.local`.

API keys currently present in local environment files should be rotated before
any public push or repository sharing.
