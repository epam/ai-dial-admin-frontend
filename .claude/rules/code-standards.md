---
# One canonical file, three consumers — each always-on, each reads its own key and ignores the others:
#   Claude Code (.claude/rules/code-standards.md)                              -> no `paths` key => loads every session
#   Cursor      (.cursor/rules/code-standards.mdc is copied from here)         -> `alwaysApply: true`
#   Copilot     (.github/instructions/code-standards.instructions.md, likewise)    -> `applyTo: "**"`
# Edit only here — pre-commit regenerates the copies. Keep this file SHORT — it is
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
- Use `interface` for object shapes and `type` for unions, intersections, and aliases. **Why:** one
  consistent signal of what a name is, so a reader knows the shape before opening the file.
- Prefix booleans — variables, props, and fields — with `is` / `has` / `can` / `should` / `will`
  (`isLoading`, `hasChanges`, `canPublish`). **Why:** a bare noun reads as an object or a value at
  the call site, so `if (error)` and `if (hasError)` look equally plausible until you check the type.

## Enums over string-literal unions

- Use TypeScript `enum`s for fixed string-value sets (modes, statuses, view types) — not string-literal
  union types. **Why:** a single runtime-usable source of values, consistent across the codebase.
  (Discriminated unions for object shapes are fine — this rule is about value sets, not type modeling.)

## Control flow & expressions

- **No nested ternaries.** One level is fine; a ternary inside a ternary becomes an early return, a
  lookup object, or an extracted function. **Why:** nesting hides which condition produced a value,
  and it is the single most common source of misread branches in review.
- Use `async`/`await` with `try`/`catch`, not `.then()`/`.catch()` chains. **Why:** one error-handling
  shape across the codebase; mixed styles make it unclear whether a rejection is handled.
- `== null` to cover both `null` and `undefined` — not `=== null || === undefined`. Use `===`
  everywhere else. **Why:** this is the one case where loose equality says exactly what is meant.
- `void` only for a deliberately un-awaited promise (fire-and-forget). **Why:** it marks the omission
  as intentional, so a missing `await` stays visible as a bug rather than looking like a choice.

## File organization

- In feature directories, keep `constants.ts` (const values) separate from `models.ts`
  (types/interfaces). Don't mix const values with type definitions in the same file.

## Comments

Match the comment density of the code around you. A file that explains its tricky parts wants the
same from your addition; a dense, self-evident file does not want new prose. There is no global quota
either way — the question is whether a reader of *this* file would be better off.

Two failure modes are worth self-checking, because both look like diligence:

1. **The same fact restated at every call site** instead of once at its source of truth (a type, a DTO,
   a single API method). State it where the decision is actually made and let readers follow the type.

   ```ts
   // Good — stated once, where the absence is decided
   // Deliberately has no `price`: pricing is owned by the catalog service and fetched separately.
   export interface Widget {
     id: string;
     name: string;
   }
   ```

   Repeating that note in `createWidget` and again in `WidgetCard` gives you three copies to keep in
   sync and no new information.

2. **Narrating what a type already names.** A prop typed `ReturnType<typeof useCartState>` already
   says where its data comes from; prose repeating that adds a second thing to maintain.

Both rot as soon as the surrounding code moves, which is what makes them worse than no comment rather
than merely redundant.
