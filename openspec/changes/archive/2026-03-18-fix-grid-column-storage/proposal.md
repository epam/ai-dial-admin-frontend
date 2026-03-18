# Fix: Unify grid column storage to resolve visibility toggle bug

**Issue:** [#2603](https://github.com/epam/ai-dial-admin-frontend/issues/2603) — Column selection controls broken across Deployments and other entities

**Introduced by:** `d80ac96b` ("save grid column state and filters", PR #2578)

## Problem

Two independent localStorage systems persist column state, and they conflict:

| Storage key prefix | Managed by | Stores |
|---|---|---|
| `COLUMNS_KEY` ("gridColumns") | GridView | `{ field, hide }` per column |
| `GRID_COLUMNS_KEY` ("gridColumnsState") | AgGridWrapper | Full `ColumnState[]` + `FilterModel` (includes `hide`) |

When a user toggles column visibility:
1. GridView writes correct `hide` to `COLUMNS_KEY` and passes updated `columnDefs` to AgGridWrapper
2. AgGridWrapper's `useEffect` fires, reads **stale** `hide` values from `GRID_COLUMNS_KEY`
3. `applyColumnState()` overwrites the correct visibility with stale data

Additionally, replacing `onStateUpdated` with `onColumnResized` means visibility changes are never saved to `GRID_COLUMNS_KEY`, so the two stores permanently diverge.

## Solution

Eliminate `COLUMNS_KEY` storage entirely. Use `GRID_COLUMNS_KEY` as the single source of truth for all column state (visibility, sort, filter, width, order).

- **GridView** reads/writes `hide` from/to `GRID_COLUMNS_KEY` instead of `COLUMNS_KEY`
- **AgGridWrapper** no longer conflicts because storage and `columnDefs` agree on `hide`
- Remove `saveColumnVisibilityToStorage`, `getColumnVisibilityFromStorage`, and `COLUMNS_KEY`

## Files affected

- `apps/ai-dial-admin/src/components/Grid/GridView/GridView.tsx` — switch to unified storage
- `apps/ai-dial-admin/src/components/Grid/AgGridWrapper.tsx` — may need minor adjustments
- `apps/ai-dial-admin/src/components/Grid/utils.ts` — remove old helpers, add unified visibility helpers
- `apps/ai-dial-admin/src/components/Grid/constants.ts` — remove `COLUMNS_KEY`
- `apps/ai-dial-admin/src/components/Grid/utils.spec.ts` — update tests

## Non-goals

- Changing the column panel UI or drag-and-drop behavior
- Migrating existing user localStorage data (stale `COLUMNS_KEY` entries will simply be ignored)
- Changing how sort/filter persistence works (that path is already correct)
- Migrating old `COLUMNS_KEY` data — orphaned entries remain in localStorage but are never read; since the bug already broke visibility toggles, stored preferences are stale anyway and a clean reset is the correct outcome
