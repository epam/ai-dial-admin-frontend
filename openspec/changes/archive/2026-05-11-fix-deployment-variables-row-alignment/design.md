## Context

The Environment Variables section in deployment-container editors (Application / MCP / Interceptor / Adapter Containers) renders a draggable list of variables. Each variable has four editable fields — Name, Description, Value, Mount type — plus a file-upload affordance and a delete button. Today (`apps/ai-dial-admin/src/components/Deployments/Fields/ContainerVariables.tsx` + `ContainerVariables/Variable.tsx`) each variable renders as a `flex flex-row gap-x-4` row at `lg+`, with labels conditionally rendered only when `index === 0`.

Issue #3223 reports the fields are visibly not on one line. Playwright measurements at 1280×900 confirmed the root cause:

| Cell          | Label Y | Input Y | Label→Input gap | Component         |
|---------------|---------|---------|-----------------|-------------------|
| Variable Name | 601     | 631     | 14 px           | `DialInput`       |
| Description   | 601     | 631     | 14 px           | `DialInput`       |
| Value         | 601     | 631     | 14 px           | `DialInput`       |
| Mount type    | 601     | **625** | **8 px**        | `DialSelectField` |

`DialInput` and `DialSelectField` use different internal vertical spacing between their label and control (14 px vs 8 px). Inside a per-row flex container there is no mechanism to reconcile those — every cell renders its own label, so each cell's input y-coordinate is determined by that cell's component internals. The result is a consistent 6 px drift on the Mount type column. The cells stretch to a uniform 64 px height because flex `align-items: normal` resolves to `stretch`, but that does not affect where each cell positions its own input within its bounds.

Secondary problems noted while inspecting:

- The file-upload button lives inside `Value.tsx` as `position: absolute; right: 0` with the parent reserving 50 px via `pr-[50px]`. To approximately align with the input (skipping label height), it carries `index === 0 && 'mt-[23px]'` — a magic number that drifts from the actual 14 px spacing in `DialInput`.
- The trash button carries an analogous `index === 0 ? 'mt-3 lg:mt-6' : ''` hack.
- At ~1280 px viewport the trash column is clipped because the inner row's fixed minimums (100 + 150 + 350 + 160 + gaps) exceed the available width without overflow handling.
- `DraggableItem` is the canonical drag/drop wrapper. It already separates drag source (the grip icon) from drop target (the wrapper); but its outer `flex items-center` div collapses everything below it into a single grid cell when used inside a `lg:grid` parent.

## Goals / Non-Goals

**Goals:**

- Fields in every variable row align on a single horizontal axis at `lg+`, independent of which ui-kit component renders each control.
- Labels render exactly once for the entire list, removing per-cell `index === 0 ? label : ''` conditionals.
- Remove the magic-number margin hacks (`mt-[23px]`, `mt-3 lg:mt-6`) and the `absolute right-0` + `pr-[50px]` workaround for the file-upload button.
- Preserve drag-and-drop with the grip handle as the drag source. Keep `DraggableItem.tsx` untouched as a canonical pattern.
- Preserve the existing mobile (`< lg`) layout: each variable is a vertical `flex-col` group with a collapsible header.
- The Value cell continues to render a text input, a password input (for secure mounts), or a `ValueFile` chip for file values, without stretching the row.

**Non-Goals:**

- Refactoring `DraggableItem.tsx`. Its drag/drop logic is reused by mirroring (`useDrag`/`useDrop` inline in the new `Variable`), not by editing it.
- Fixing the underlying inconsistency between `DialInput` and `DialSelectField` label-to-input spacing in `@epam/ai-dial-ui-kit`.
- Changes to variable validation, data model, or backend payloads.
- Mobile redesign.

## Decisions

### Decision 1: Single list-level CSS grid (with `subgrid` per row)

**Choice:** `ContainerVariables` renders one `lg:grid` container whose columns are defined once. Every row (the header label row and each variable row) uses `lg:grid lg:grid-cols-subgrid lg:col-span-7` so all rows inherit the same column tracks.

**Columns** (left to right):

```
24px                       drag handle (grip)
minmax(100px, 1fr)         Name
minmax(150px, 1.5fr)       Description
minmax(280px, 3fr)         Value
40px                       file-upload button
minmax(160px, 1.5fr)       Mount type
40px                       trash
```

with `lg:gap-x-4 lg:gap-y-3` on the parent.

**Why:**
- Labels live in a dedicated header row at the top of the grid. Every input below sits in its own grid row track. Input y-positions are now determined by the grid, not by each ui-kit component's internal spacing — fixing the 6 px misalignment at its root.
- One source of truth for column widths across the entire list, so adding a 2nd, 3rd, … nth variable cannot drift.
- Trash and file-upload get their own columns instead of being hacked into the same cell as Value or sitting outside the row.

**Alternatives considered:**
- *Per-row grid (no subgrid).* Each variable would define its own grid columns. Cleaner than today's flex but every row's column widths would be independent — visual alignment would still rely on identical computed widths per row, which is fragile when input content varies. Subgrid removes that fragility.
- *CSS table-layout.* Rejected — the project rule "Avoid HTML `<table>` elements for layout" applies. Grid is the idiomatic replacement.
- *Override ui-kit label spacing via wrapper CSS.* Rejected — fragile, depends on internal markup of `DialInput`/`DialSelectField`, doesn't solve the trash-clipping or the file-button hack.

### Decision 2: Drag handle as a grid cell, hooks mirrored inline

**Choice:** Inside the new `Variable` component, attach `useDrag` to a `ref` on the grip cell (1st grid column) and `useDrop` to a `ref` on the row's outer wrapper. The `useDrag`/`useDrop` configuration is a verbatim copy of lines 17–55 of `DraggableItem.tsx` (same `type: 'column'`, same `find` / `move` behavior, same opacity-while-dragging treatment).

**Why:**
- The user explicitly chose to reuse the `DraggableItem` pattern without refactoring `DraggableItem.tsx`. Inlining the hooks preserves the existing canonical wrapper for other lists that still benefit from "wrap a whole row".
- Lets the grip live as its own grid cell instead of being prepended outside the grid tracks.

**Trade-off:** ~25 lines of hook configuration are duplicated between `DraggableItem.tsx` and the new `Variable`. Acceptable for now; if a third site duplicates the same setup, extract a `useColumnDragDrop(id, findItem, moveItem)` hook (separate change).

**Alternatives considered:**
- *Wrap row in `DraggableItem` with `className="contents"`.* `display: contents` would let the row's children participate as direct grid items of the outer grid. Rejected: assistive-tech support for `display: contents` on interactive containers is uneven, and react-dnd attaches refs to DOM nodes that need a real box.
- *Refactor `DraggableItem` to accept a `handleRef` slot.* Cleaner long-term but explicitly out of scope per the user request.

### Decision 3: Lift the file-upload button out of `Value.tsx`

**Choice:** `Value.tsx` becomes a pure value renderer: it returns either a `DialInput` (or `DialPasswordInput` for secure mount types) or a `ValueFile` chip. The file-upload `DialNeutralButton` (currently rendered at the bottom of `Value.tsx` with `absolute right-0` + `mt-[23px]`) moves up to `Variable.tsx` and lives in its own grid column (column 5). The hidden `<input type="file">` and its `onChange` handler move with it.

**Why:**
- The button is a peer of the Value cell, not a child of it — modeling it that way removes the absolute-positioning workaround, the `pr-[50px]` reservation on the Value wrapper, and the `mt-[23px]` magic number.
- File-upload state belongs alongside the variable as a whole, not deep inside `Value`.

**Trade-off:** `Value` and the file button now share a parent (`Variable`), which means `Variable` owns the file-upload handler. That handler delegates to `onValueChange` exactly as today; no additional state.

### Decision 4: Mobile layout preserved by gating the grid on `lg:`

**Choice:** All grid classes are `lg:`-prefixed. Below `lg`, each variable falls back to the existing `flex-col` + collapsible header. The header label row renders only at `lg+` (hidden via `hidden lg:grid` on the header wrapper).

**Why:**
- The existing mobile experience already works and is collapsible-tested. No reason to redesign.

**Trade-off:** The same row uses two different parent layouts depending on viewport. That's already the case today; the grid simply replaces the desktop branch.

### Decision 5: `align-items: start` on each grid cell

**Choice:** Each variable-row cell uses `lg:items-start` (via the row wrapper) so the file-value chip variant (`ValueFile`, which can be visibly taller than a text input) doesn't stretch the inputs/buttons in the same row.

**Why:**
- Today's `align-items: normal` (resolves to `stretch`) is what makes every cell stretch to 64 px and hides label-y differences while keeping input-y differences. Switching to `start` keeps inputs deterministically at the top of their row track, which is exactly what the grid provides.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| `grid-cols-subgrid` is CSS Grid Level 2; check browser support. | Modern Chrome/Firefox/Safari all ship it (Chrome 117+, Firefox 71+, Safari 16+). The project already requires modern browsers; AG Grid and other features rely on similarly recent CSS. If a fallback is needed for a specific deployment target, fall back to repeating the same column template on each row (Decision 1 alternative). |
| Duplicating the `useDrag`/`useDrop` configuration with `DraggableItem` could drift. | Add a comment in `Variable.tsx` pointing at `DraggableItem.tsx` as the canonical pattern; extract a shared hook if a third call site appears. |
| Tests that locate fields by "label sibling" may break when labels move to the header row. | Update `Variable.spec.tsx` / `ContainerVariables.spec.tsx` to query by placeholder or role; assert one header label row at the list level. |
| `Value.tsx` API surface changes (no longer renders its own file button). | Internal-only component used in exactly one place; safe to change. Spec scenarios cover both text and file variants. |
| Existing `mt-[23px]` / `mt-3 lg:mt-6` removals could regress mobile alignment. | Mobile path doesn't use these for alignment — they're keyed off `lg:` margins. Audit by toggling viewport in Playwright. |

## Migration Plan

This is a pure UI refactor with no data migration, no API impact, and no flag gating.

1. Implement the change behind the existing component file paths; no public component API changes outside `Value.tsx` (internal).
2. Update co-located unit tests in the same PR.
3. Manual QA across all four container types (Application / MCP / Interceptor / Adapter) at viewport widths 1024, 1280, 1440, 1680.
4. Manual QA of: empty variable, text value, secure-content password value, file-mount value, drag-reorder of 2+ variables, validation error indicator, removing a variable.
5. No rollback strategy needed beyond reverting the PR; behavior is contained to one feature area.

## Open Questions

- **Trash column position.** Today the trash is to the right of the row's content. The grid keeps it as the last column. If product later wants it on the leading edge with the grip, that becomes a single-column-order change rather than a refactor — note it but don't change here.
- **`grid-template-columns: subgrid` and Tailwind arbitrary values.** Tailwind 3 doesn't ship `grid-cols-subgrid` as a built-in utility; we'll use the arbitrary `lg:grid-cols-subgrid` or `lg:[grid-template-columns:subgrid]` form. Both are supported by the JIT compiler; pick whichever passes lint cleanly during implementation.