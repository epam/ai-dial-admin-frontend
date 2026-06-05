---
# One canonical file, three consumers — each reads its own scoping key and ignores the others:
#   Claude Code (.claude/rules/components.md)                                  -> `paths`
#   Cursor      (.cursor/rules/components.mdc symlinks here)                   -> `globs` / `alwaysApply` / `description`
#   Copilot     (.github/instructions/components.instructions.md symlinks here) -> `applyTo`
# Keep all three glob sets in sync. Editing the body updates every tool at once (the others are symlinks).
# Scopes to component-shaped files only (.tsx in components/context, hooks). Cross-cutting TS standards
# live in code-standards.md (always on); pure helpers in utils.md; tests in testing.md.
description: Component & UI authoring standards — design principles, design-system reuse, styling, state, a11y, i18n, grid. Use when editing component, context, or hook files.
paths:
  - "**/components/**/*.tsx"
  - "**/context/**/*.ts"
  - "**/context/**/*.tsx"
  - "**/hooks/**/*.ts"
  - "**/hooks/**/*.tsx"
  - "**/use-*.ts"
  - "**/use-*.tsx"
globs: "**/components/**/*.tsx, **/context/**/*.ts, **/context/**/*.tsx, **/hooks/**/*.ts, **/hooks/**/*.tsx, **/use-*.ts, **/use-*.tsx"
applyTo: "**/components/**/*.tsx, **/context/**/*.ts, **/context/**/*.tsx, **/hooks/**/*.ts, **/hooks/**/*.tsx, **/use-*.ts, **/use-*.tsx"
alwaysApply: false
---

# Component & UI authoring standards

Guidance for writing React components, contexts/providers, and hooks in this repo. Cross-cutting
TypeScript standards (import alias, enums, type placement, `constants.ts`/`models.ts` split) live in
`.claude/rules/code-standards.md` (always on) and are **not** repeated here. Pure helpers →
`.claude/rules/utils.md`. Tests → `.claude/rules/testing.md`.

## §1 Scope

Applies when creating or editing:

- `**/components/**/*.tsx` — feature and Common components.
- `**/context/**/*.{ts,tsx}` — React contexts and providers.
- `**/hooks/**/*.{ts,tsx}` and any `use-*.{ts,tsx}` — custom hooks, including feature-local hooks
  colocated with their component (e.g. `components/Runs/View/use-detail-mode.tsx`).

## §2 Guiding principle

Apply these rules with **common sense**. The goal is code that is readable, maintainable, and
scalable — not dogmatic rule-following. Favor the simplest readable solution; lean on established
React patterns and general principles (DRY, single responsibility, composition), but don't
over-engineer for a single use.

## §3 Component design principles

- **One component per file.** A file exports one component plus its local `Props` and small private
  helpers. Need another component → new file.
- **Name by what it is.** File name = component name, PascalCase; the name says what it renders or does
  (`EntityDeleteModal`, not `Modal2` or `Wrapper`).
- **Reasonable size; split by feature and reusability.** When a component grows large or juggles
  unrelated concerns, break it into smaller sub-components. Lift generic, domain-free pieces toward
  `Common/`.
- **Keep the component simple; logic lives elsewhere.** The body is mostly markup + wiring. Move real
  logic into custom hooks (stateful/shared logic) or utils (pure functions — see `utils.md`). No heavy
  branching or computation inline in JSX.
- **Use React's strengths:**
  - Compose components instead of duplicating markup.
  - Keep state minimal and intentional — **derive** values from props/existing state instead of adding
    new state; don't let state grow without reason.
  - Memoize with `useCallback`/`useMemo` where it helps referential stability or avoids costly
    re-renders — not everywhere.
  - Put shared or stateful logic in custom `use-*` hooks rather than copy-pasting it.
  - Use stable list `key`s (entity id, not array index); prefer controlled inputs (`value` + `onChange`);
    let React own the DOM — no manual DOM manipulation for UI state.
- **Readable over clever.** Prefer a clear multi-line solution to a dense, hard-to-read one-liner.
- **Don't repeat yourself.** Reuse existing components/utils before writing new ones; extract a shared
  piece when the same markup/logic recurs (rule of three).

## §4 Where code goes (Common vs feature)

- `src/components/Common/**` — **presentational, reusable, domain-free** building blocks (CopyButton,
  Accordion, ExpandableText, Multiselect…). No business logic, no domain models, no server actions or
  domain contexts. **Check here first** before building any UI pattern.
- `src/components/<Entity>/**` — **feature** components: compose Common + ui-kit, hold business logic,
  wire to contexts/server actions, follow the entity `View` / `TabsContent` / `List` pattern.
- When a piece of UI is generic and domain-free, push it down into `Common/`; keep domain logic up in the
  feature component.
- React contexts, providers, and their hooks live in `src/context/` — not co-located with components.
- Name hook files in kebab-case (`use-detail-mode.tsx`); the exported function stays camelCase
  (`useDetailMode`).

## §5 Reuse the design system first

Prefer existing building blocks over custom HTML/components:

- Reuse from `@epam/ai-dial-ui-kit` and `src/components/Common/` before creating anything new.
- **Forms & interactive:** `DialSearch` (search), `DialCheckbox` (checkboxes), `DialTabs` (tabs),
  `DialIconButton`/`DialGhostIconButton` (icon buttons), `DialPopup` (modal overlays).
- **Buttons:** use ui-kit button components; don't hand-roll buttons unless truly necessary.
- **Typography:** use ui-kit Typography font classes; avoid custom font styling.
- **Tabular data:** use ag-grid (`GridView` → `AgGridWrapper`) — never build tables with CSS grid/flex.
- **Common behaviors:** reuse existing deps — `re-resizable` (resizable panels), `react-dnd`
  (drag & drop). Don't reimplement these.
- Follow existing patterns in `src/components/` when structuring a new feature.

## §6 Styling

- Use Tailwind theme tokens / CSS variables — never hardcode colors.
- Use `classNames()` (classnames package) for conditional classes — not template-literal concatenation.
- Icons: `@tabler/icons-react` only — no unicode glyphs, no inline SVG.
- **Tabular data vs. tabular layout:** use ag-grid for tabular *data* (sortable/filterable/editable rows
  — §5, §11); use CSS grid or flexbox for tabular *layout* (static row/column arrangements such as
  key–value displays). Never use an HTML `<table>` for layout.

## §7 Structure & naming

- Name the props interface `Props` — not `ComponentNameProps`.
- Keep JSX clean: extract handlers, computed values, and complex prop expressions into named variables in
  the component body.
- Name handlers with an `on` prefix (`onClick`, `onSubmit`, `onOpenFullScreen`).
- Default-export the component (one component per file); use named exports for everything else in the
  file (helpers, types, constants).

## §8 State & performance

- Prefer `useState`; reserve `useReducer` for genuinely complex state with multiple interdependent fields.
- Memoize expensive computations and callbacks (`useMemo`/`useCallback`) where render cost or referential
  stability matters — don't memoize indiscriminately.

## §9 Accessibility & long content

- Aim for **WCAG AA**: at minimum, give interactive elements proper roles/labels and aria attributes,
  and ensure keyboard operability.
- Never truncate with `break-all` (or similar) without a way to reach the full value.
- Use `DialEllipsisTooltip` from ui-kit when truncating long text so the full content stays accessible.

## §10 i18n

- All user-facing strings go through next-international — no hardcoded display text.
- Before adding a key to a feature i18n enum (e.g. `RunsI18nKey`), check shared sections
  (`BasicI18nKey`, `ButtonsI18nKey`, `EntitiesI18nKey`) and reuse common labels (Close, Search,
  Select All).

## §11 AG Grid

- **Boolean toggles:** use `BooleanButtonCellRenderer` (`Grid/CellRenderers/`) — not
  `agCheckboxCellRenderer`.
- Use ag-grid for all tabular data (see §5).
- **`isSkipRefresh` pattern:** when a parent component owns grid data and inline edits should **not**
  trigger a full grid refresh, pass `isSkipRefresh?: boolean` as a prop and guard
  `gridApi.updateGridOptions({ rowData })` with `if (!isSkipRefresh)`. The parent passes
  `isSkipRefresh=true` when flushing batched inline edits, so the grid keeps focus. Reference:
  `src/components/TestSuites/TestCaseSchema/SchemaManager.tsx`.

## §12 Exemplars

- Common building blocks: `src/components/Common/CopyButton`, `src/components/Common/Accordion`.
- Entity pattern: a `<Entity>/View/View.tsx` + `TabsContent` + `List/`.
- Grid `isSkipRefresh`: `src/components/TestSuites/TestCaseSchema/SchemaManager.tsx`.
