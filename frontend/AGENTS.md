# Codex Entry Protocol

This repository is the Situation Card industrial branch. Before any code,
prompt, test, or governance edit, Codex must apply the canonical protocol.

## Mandatory Preflight

Run:

```sh
npm run codex:preflight
```

Then read:

- `src/lib/governance/codexSessionProtocol.md`
- `src/lib/governance/scV2BrickMap.md`

## No Code Before Mapping

Before editing, write this mapping explicitly:

```txt
Symptome observe :
Couche canonique responsable :
Brique existante verifiee :
Action : brancher / renforcer / tester / documenter
Ce que je ne vais pas faire :
```

If the mapping is not explicit, do not code.

## Anti-Patch Rule

Do not create a special-case rule when an existing canonical brick can be
branched, strengthened, tested, or documented.

The control question is:

```txt
Quelle couche canonique produit ce symptome ?
```

Commits must name the canonical layer or contract, not the anecdotal symptom.
