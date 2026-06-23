## Context

`applicationPropertiesTemp: ApplicationPropertiesTemp[]` is an intermediate array form of the `applicationProperties: Record<string, unknown>` field on `DialApplication` and `DialApplicationResource`. It was introduced so the table view could carry UI-only metadata (type, required, isFromScheme) alongside the values without touching the backend schema.

The problem: this temp field leaks into domain model interfaces and every save path must explicitly convert it back and delete it. The table component is also currently driven by this array stored on the entity — meaning the entity acts as a state bag for UI concerns.

Current save path (×3 locations):
```
applicationPropertiesTemp[]  →  convertDefaultsToRecord()  →  applicationProperties Record  →  server
```

## Goals / Non-Goals

**Goals:**
- Remove `applicationPropertiesTemp` from domain model interfaces entirely.
- Simplify all save paths to use `applicationProperties` directly (no conversion needed).
- Move row ordering and pending-row state into `TableView` as local component state.
- Keep type/required/isFromScheme as derived display concerns, never persisted on the entity.
- Add blur-based key editing with inline duplicate/empty-key validation.
- Introduce `EditableOnBlurCellRenderer` for key cells.

**Non-Goals:**
- Changing `defaultsTemp` / `responsesDefaultsTemp` (same pattern, separate change).
- Any changes to the Form view (SchemaUiRenderer) or UI view (FrameRenderer).
- Backend API changes.

## Decisions

### D1 — Row ordering owned by `TableView` via `orderedUserKeys: string[]`

**Decision:** `TableView` initialises `orderedUserKeys` from `Object.keys(applicationProperties)` filtered to exclude scheme keys, on mount. All mutations update this array in-place (splice for remove, replace for rename, push for add). Schema-derived rows always render first (from `schemeProperties` prop), then user keys in `orderedUserKeys` order.

**Alternatives considered:**
- *Own in `ParametersTab`*: ParametersTab would need a separate `onKeyRename` callback and more state. Keeping ordering in `TableView` keeps ParametersTab's concern as "entity change propagation only".
- *Derive from insertion order of `Record`*: V8 preserves string-key insertion order in practice, but it is not spec'd and would be fragile. Explicit array is safer.

**Reset on discard:** `ParametersTab` passes `discardKey` as the React `key` on `<TableView>`. A key change remounts `TableView`, resetting `orderedUserKeys` and pending state for free.

### D2 — Type is derived from value, never stored

**Decision:** For user-added rows, type is inferred at render time via `inferTypeFromValue`:
- `null | undefined` → `"object"`
- `typeof === "boolean"` → `"boolean"`
- `typeof === "number"` → `"number"`
- `typeof === "object"` (non-null) → `"object"`
- everything else → `"string"`

When the user changes the Type selector, `getValueByType(newType)` resets the value in `applicationProperties`, so the inferred type naturally follows.

Schema-derived rows get their type from `schemeProperties` (already known from `convertJsonSchema`).

**Alternative considered:** Store a separate `localTypeOverrides: Record<string, string>` map in `TableView`. Rejected — it introduces a second source of truth. Value-driven type is consistent and requires no extra state.

### D3 — Pending new row represented as empty string in `orderedUserKeys`

**Decision:** Clicking Add pushes `""` to `orderedUserKeys`. The display row derived from key `""` renders an empty editable key cell. If `orderedUserKeys` already contains `""`, the Add signal is ignored. On key blur with a valid non-duplicate value, `""` is replaced in-place; the value is written to `applicationProperties[newKey]`.

**Alternative considered:** Separate `pendingNewRow: boolean` state. Rejected — it's redundant information. `orderedUserKeys.includes("")` already encodes the same fact without extra state.

### D4 — `EditableOnBlurCellRenderer` for key cells

**Decision:** A new cell renderer modelled on `EditableCellRenderer` but firing only on blur, not on every keystroke. It holds a local `draftValue` state to display typed characters. On blur it calls a `validate: (value: string) => string | null` prop; if non-null the error string is shown inline and the callback is not fired. This keeps validation logic in the caller (`TableView`) rather than in the renderer.

**Sync rule:** `draftValue` is synced from the `value` prop only when the cell is **not** focused, preventing external re-renders from clobbering in-progress edits.

**Alternative considered:** Patching `EditableCellRenderer` with an `onBlur` mode flag. Rejected — the two behaviours diverge enough (no onChange propagation, focus-guarded sync, inline error display) that a separate component is cleaner.

### D5 — `onValidityChange` callback replaces `ValidationContext` dispatch inside `TableView`

**Decision:** `TableView` calls `onValidityChange(isValid: boolean)` whenever the validity of the rows changes (empty key, duplicate key). `ParametersTab` dispatches to `ValidationContext` in response. `TableView` must not import or depend on `ValidationContext` directly.

**Rationale:** Keeps `TableView` a pure presentational+local-state component with no context dependencies.

### D6 — `ApplicationPropertyRow` replaces `ApplicationPropertiesTemp` as a local type

**Decision:** The type is moved from `src/models/dial/application.ts` into `src/components/Applications/ParametersTab/models.ts`. It is renamed `ApplicationPropertyRow` to signal it is a UI display type, not a domain model. All imports within `ParametersTab/` and `ParametersTab/utils.ts` update to use the local path.

## Risks / Trade-offs

- **`orderedUserKeys` diverges from `applicationProperties` on external reset** → Mitigated by `key={discardKey}` on `TableView`; remount guarantees a fresh derivation from the current prop values.
- **Type inference loses granularity for `null`/`undefined` values** → Mapping to `"object"` is a reasonable default; the user can change the type selector after adding the row. This matches the previous behaviour where `convertAppPropertiesToArray` used `typeof value` for non-scheme properties.
- **Three save-path test files need updating** → Low risk; the change is a deletion of a conditional branch, making the tests simpler.
- **`isFromScheme` implicit in the split between `schemeProperties` and `orderedUserKeys`** → No longer a field on the row itself for user-added rows. The `getAppPropertiesColumns` key column already checks `params.data.isFromScheme` to decide whether to render `EditableOnBlurCellRenderer`. This must be preserved via the `isFromScheme: true` flag on scheme rows.
