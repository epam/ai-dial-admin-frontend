## Why

`ApplicationPropertiesTemp` is an intermediate array representation of `applicationProperties` (a `Record<string, unknown>`) that exists solely to carry UI-only metadata (type, required, isFromScheme) through the entity model and save pipeline. It pollutes the domain model, requires explicit conversion on every save path, and forces the table component to mirror the entity state. Removing it simplifies the data flow, eliminates save-path boilerplate, and makes the component own what it should: display ordering and pending-row state.

## What Changes

- **Remove `applicationPropertiesTemp` field** from `DialApplication` and `DialApplicationResource` model interfaces.
- **Remove temp→record conversion** from all three save paths: `applications/actions.ts`, `assets-applications/actions.ts`, and `Publications/View/utils.ts`.
- **`ParametersTab`** passes `applicationProperties: Record<string, unknown>` and `schemeProperties: ApplicationPropertyRow[]` directly to `TableView` instead of a merged temp array.
- **`TableView`** owns row ordering (`orderedUserKeys: string[]`) and pending-new-row state internally; derives its display rows on render; calls back with an updated `Record<string, unknown>` on every mutation.
- **New `EditableOnBlurCellRenderer`** — a grid cell renderer that fires only on blur, with a `validate` prop for inline key validation (duplicate/empty detection).
- **`ApplicationPropertiesTemp` type** removed from the entity model; replaced by a local `ApplicationPropertyRow` interface in the ParametersTab feature directory.
- **Add-row guard**: `TableView` ignores `onAdd` when an empty-key row already exists (empty string present in `orderedUserKeys`); save is blocked via `ValidationContext` while any key is empty or duplicated.
- **Key rename on blur**: renaming a user-added key replaces it in-place in `orderedUserKeys` and updates `applicationProperties` atomically.

## Non-goals

- `defaultsTemp` / `responsesDefaultsTemp` — same pattern, out of scope for this change.
- Form view (SchemaUiRenderer) and UI view (FrameRenderer) within ParametersTab — unchanged.
- Any backend API changes.

## Capabilities

### New Capabilities

- `app-properties-table-editing`: Direct key-value editing of `applicationProperties` in the table view — row ordering, pending-row management, blur-based key editing with inline duplicate/empty validation, and type inference from value.

### Modified Capabilities

<!-- No existing spec-level behavior is changing (this is an internal refactor with the same user-visible semantics). -->

## Impact

- `src/models/dial/application.ts` — field removal
- `src/models/dial/application-resource.ts` — field removal
- `src/app/[lang]/applications/actions.ts` — drop temp conversion
- `src/app/[lang]/assets-applications/actions.ts` — drop temp conversion
- `src/components/Publications/View/utils.ts` — drop temp conversion
- `src/components/Applications/ParametersTab/ParametersTab.tsx` — state simplification
- `src/components/Applications/ParametersTab/TableView.tsx` — new internal state, updated props
- `src/components/Applications/ParametersTab/utils.ts` — new `inferTypeFromValue`, updated column defs
- `src/components/Grid/CellRenderers/EditableOnBlurCellRenderer.tsx` — new file
- Test files: `applications/actions.spec.ts`, `assets-applications/actions.spec.ts`, `Publications/View/tests/utils.spec.ts`, `ParametersTab/tests/`
