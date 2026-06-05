---
# One canonical file, three consumers — each always-on, each reads its own key and ignores the others:
#   Claude Code (.claude/rules/code-standards.md)                              -> no `paths` key => loads every session
#   Cursor      (.cursor/rules/code-standards.mdc symlinks here)               -> `alwaysApply: true`
#   Copilot     (.github/instructions/code-standards.instructions.md symlinks here) -> `applyTo: "**"`
# Editing the body updates every tool at once (the others are symlinks). Keep this file SHORT — it is
# always in context, so it only holds cross-cutting standards that are not specific to components or utils.
description: Cross-cutting TypeScript standards for this repo — import alias, enums, type placement, file organization. Always applies.
applyTo: "**"
alwaysApply: true
---

# Code standards (all TypeScript)

Always-on standards, loaded **every session** (not path-scoped), so they apply to all `.ts`/`.tsx` work
in this repo regardless of what you're editing. Area-specific guidance lives in path-scoped rules and is
**not** repeated here:

- Component / UI / context / hook authoring → `.claude/rules/components.md`
- Utility / pure-function authoring → `.claude/rules/utils.md`
- Test authoring → `.claude/rules/testing.md`

## Imports

- Always import via the `@/` alias (resolves from `apps/ai-dial-admin/`). Never use relative paths that
  climb out of the current directory (`../../`). **Why:** refactor-safe, location-independent imports;
  `@/` is the project-wide convention.

## Types & interfaces

- Put types and interfaces in dedicated model files — `src/models/` for domain types, an adjacent
  `models.ts` for component- or feature-local types. **Do not** declare inline anonymous object types
  inside interface properties. **Why:** types stay discoverable and reusable; signatures stay readable.

## Enums over string-literal unions

- Use TypeScript `enum`s for fixed string-value sets (modes, statuses, view types) — not string-literal
  union types. **Why:** a single runtime-usable source of values, consistent across the codebase.
  (Discriminated unions for object shapes are fine — this rule is about value sets, not type modeling.)

## File organization

- In feature directories, keep `constants.ts` (const values) separate from `models.ts`
  (types/interfaces). Don't mix const values with type definitions in the same file.
