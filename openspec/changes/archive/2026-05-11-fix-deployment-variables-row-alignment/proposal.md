## Why

In the deployment container editor's Environment Variables section, the four fields per variable row (Name, Description, Value, Mount type) do not align vertically: the `DialSelectField` used for Mount type sits 6 px higher than the `DialInput` controls because the two ui-kit components use different internal label-to-input spacing (8 px vs 14 px). The per-row `flex flex-row` layout has no way to harmonize this. Issue #3223 reports this as "Variables aren't displayed in one line" — the inputs visibly drift across the row, and at narrower viewports the trash button clips off the right edge.

## What Changes

- Replace the per-row `lg:flex-row` layout in `ContainerVariables` / `Variable` with a **single list-level CSS grid** that owns the columns for the entire variables list at `lg+`.
- Each variable row uses `grid-template-columns: subgrid` and spans the parent grid, so all rows share the exact same column tracks.
- **Labels render once** at the top of the grid (header row) instead of being repeated per-`DialInput` / `DialSelectField` with `index === 0` gating. This removes the alignment dependency on ui-kit internal label spacing.
- The drag-handle grip becomes its own grid cell. The drag/drop wiring uses the same `useDrag` / `useDrop` pattern as `DraggableItem.tsx`, applied inline inside the new `Variable` row — `DraggableItem.tsx` itself is **not** modified.
- The file-upload button moves out of `Value.tsx` (where it is currently `absolute right-0` with a `pr-[50px]` reservation) and becomes its own grid column. The `mt-[23px]` and the `index === 0 ? 'mt-3 lg:mt-6' : ''` alignment hacks are removed.
- Mobile (`< lg`) layout is preserved: each variable stays as a vertical `flex-col` group with the existing collapsible header.

## Capabilities

### New Capabilities
- `container-variables-row-layout`: how the Environment Variables list in deployment containers (applications, MCP, interceptor, adapter) lays out per-variable rows so that fields align vertically and remain usable across viewport widths.

### Modified Capabilities
_None — this change is purely layout. The validation behavior in `env-var-duplicate-validation` and the variable data model are untouched._

## Impact

- **Code**:
  - `apps/ai-dial-admin/src/components/Deployments/Fields/ContainerVariables.tsx` — restructures the list wrapper into a `lg:grid` container, renders the label row once.
  - `apps/ai-dial-admin/src/components/Deployments/Fields/ContainerVariables/Variable.tsx` — restructures children as grid cells via `grid-cols-subgrid col-span-*`; embeds the `useDrag`/`useDrop` hooks (mirrored from `DraggableItem.tsx`) so the grip cell remains the drag source and the row is the drop target.
  - `apps/ai-dial-admin/src/components/Deployments/Fields/ContainerVariables/Value.tsx` — drops the `absolute` + `pr-[50px]` workaround for the file-upload button; the button moves up to `Variable.tsx` as a separate grid cell. `Value` becomes a pure value renderer (text input, password input, or `ValueFile` chip).
  - Co-located tests under `Deployments/Fields/ContainerVariables/tests/` and `Deployments/Fields/tests/` updated to match the new structure (label location, file-upload button location).
- **No API, server-action, or data-model changes.** Variable payloads (`EnvironmentVariable`, `EnvVariableValue`) are untouched.
- **No ui-kit changes.** `DialInput` / `DialSelectField` / `DialNeutralButton` / `DialPasswordInput` continue to be used as-is; the misalignment caused by their internal spacing differences is sidestepped by removing per-cell labels.
- **No changes to `DraggableItem.tsx`.** Its hook pattern is reused inline; the original component remains the canonical wrapper for other lists that wrap a whole row.
- **Affected screens**: the Environment Variables accordion appears under Application Containers, MCP Containers, Interceptor Containers, and Adapter Containers — all four benefit since they consume the same `ContainerVariables` component.

## Non-goals

- Refactoring `DraggableItem.tsx` into a reusable hook. (Possible follow-up if duplication becomes painful.)
- Fixing the underlying ui-kit spacing inconsistency between `DialInput` and `DialSelectField`. (Out of scope for this repo.)
- Changing the variable data model, mount types, or validation behavior.
- Redesigning the mobile (`< lg`) layout. The collapsible-row behavior is preserved.
