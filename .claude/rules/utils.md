---
# One canonical file, three consumers — each reads its own scoping key and ignores the others:
#   Claude Code (.claude/rules/utils.md)                                  -> `paths`
#   Cursor      (.cursor/rules/utils.mdc symlinks here)                   -> `globs` / `alwaysApply` / `description`
#   Copilot     (.github/instructions/utils.instructions.md symlinks here) -> `applyTo`
# Keep all three glob sets in sync. Editing the body updates every tool at once (the others are symlinks).
description: Utility / pure-function authoring standards — purity, placement, determinism. Use when editing files under a utils/ directory.
paths:
  - "**/utils/**/*.ts"
  - "**/utils/**/*.tsx"
globs: "**/utils/**/*.ts, **/utils/**/*.tsx"
applyTo: "**/utils/**/*.ts, **/utils/**/*.tsx"
alwaysApply: false
---

# Utility / pure-function authoring standards

Guidance for writing helpers under any `utils/` directory. Cross-cutting TypeScript standards (import
alias, enums, type placement, `constants.ts`/`models.ts` split) live in `.claude/rules/code-standards.md`
(always on) and are **not** repeated here. Util **tests** are covered by `.claude/rules/testing.md`.

## §1 Scope

Applies when creating or editing files under a `utils/` directory:

- `src/utils/**` — cross-cutting helpers shared across the app.
- `<feature>/utils/**` — helpers specific to one feature/component.

## §2 Rules

- **Pure functions only.** No React hooks, no JSX. If logic needs hooks or JSX it belongs in a component
  or a custom hook — not here.
- **Placement.** Put cross-cutting helpers in `src/utils/`; put logic specific to one feature in that
  feature's `<feature>/utils/`. Extract a helper out of a component the moment it stops needing
  hooks/JSX.
- **No hidden side effects or I/O.** A util maps inputs to outputs — don't fetch, read globals, or mutate
  shared state inside one.
- **Deterministic.** Same input → same output. For time/date-dependent logic, take the value as a
  parameter (or rely on fake timers in tests — see `testing.md`) rather than reading the clock directly.
- **One job, named exports.** Keep each function small and single-purpose; prefer named exports and avoid
  default exports so helpers are easy to find, test, and tree-shake.

## §3 Tests

Every util needs unit tests — follow `.claude/rules/testing.md` (util section: positive cases,
negative/edge cases, missing-param fallbacks; chase branch coverage since utils are cheap and
deterministic). Exemplars: `src/utils/tests/schema.spec.ts`, `src/utils/tests/keys.spec.ts`.
