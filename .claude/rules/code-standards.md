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

## Comments

- Default to no comments — code should be self-descriptive through naming and structure. Add one only
  for an explicit, non-default decision: something a competent engineer, reading only the surrounding
  code, could still get wrong or accidentally revert. Never add a comment that restates what a type
  signature, function name, or the code itself already shows.
- **Two failures to self-check before committing a comment:** (1) the same fact re-explained at every
  call site instead of once at its source of truth (a type/DTO definition, a single API method) — state
  it there and let readers follow the type instead of repeating it; (2) narrating a relationship a
  prop/hook type already names (e.g. a prop typed `ReturnType<typeof someHook>` already says where its
  data comes from — don't also say so in prose).
- **Why:** a comment restating obvious or already-documented behavior rots the moment the code around it
  changes, adds review noise, and gives you a second thing to keep in sync for no offsetting benefit.

  ```ts
  // BAD — failure #1: restated at every call site instead of once at the source of truth
  // (in models.ts) A widget has no `price` — pricing moved to the catalog service.
  export interface Widget { id: string; name: string }

  // (in create-widget.ts, again) Widgets don't carry price — that's the catalog service's job.
  export function createWidget(name: string): Widget { ... }

  // (in WidgetCard.tsx, again) No price shown here since Widget never carries one.
  const WidgetCard: FC<{ widget: Widget }> = ({ widget }) => ...

  // GOOD — state it once, where the absence is actually decided
  // Deliberately has no `price` — pricing is owned by the catalog service, fetched separately.
  export interface Widget { id: string; name: string }
  // Everywhere else: `Widget` is self-descriptive; no comment needed.
  ```

  ```ts
  // BAD — failure #2: narrates what the prop type already says
  interface Props {
    cart: ReturnType<typeof useCartState>;
  }
  // The cart state (items, totals, add/remove) lives in useCartState; this component just renders it.
  const CartSummary: FC<Props> = ({ cart }) => ...

  // GOOD — the type already says where `cart` comes from; nothing to add
  interface Props {
    cart: ReturnType<typeof useCartState>;
  }
  const CartSummary: FC<Props> = ({ cart }) => ...
  ```
