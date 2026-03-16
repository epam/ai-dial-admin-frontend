## Why

When opening an existing interceptor configured with "Interceptor Template" source type and clicking the template field, the `SelectRunnerModal` shows "No Templates" despite data being available. This blocks users from changing the interceptor template selection in the interceptor view.

## What Changes

- Fix `SelectRunnerModal.tsx` to pass `runners` as `rowData` to `GridView` instead of only setting data via `onGridReady`. Currently, `GridView` evaluates `isEmptyData` based on `rowData` being `null`/empty, which causes it to render `DialNoDataContent` ("No Templates") and skip the AG Grid entirely — so `onGridReady` never fires and data never loads.

## Capabilities

### New Capabilities

_None — this is a bug fix restoring expected behavior._

### Modified Capabilities

_None — no spec-level requirement changes, only a rendering fix in SelectRunnerModal._

## Non-goals

- Changing the `GridView` component's empty-data logic
- Modifying interceptor template API or data model
- Changing the `Templates` component's fetch logic

## Impact

- **Code**: `SelectRunnerModal.tsx` — change how `runners` data is passed to `GridView`
- **User-facing**: Interceptor template selection dialog will correctly display available templates
- **Risk**: Very low — aligning with how all other `GridView` usages pass data
