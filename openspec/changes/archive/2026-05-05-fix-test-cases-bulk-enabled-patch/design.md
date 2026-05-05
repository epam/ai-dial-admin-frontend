## Context

The test suite view (`View.tsx`) saves test-case changes in two sequential calls:
1. `updateTestSuite` — PUT on the suite object (with ETag).
2. `updateTestCases` — PUT on an array of full `TestCase` objects.

The second call uses the existing `PATCH /test-cases` batch endpoint, which is capped at 256 items. When a user toggles `enabled` on many rows, the array of dirty test cases easily exceeds 256, causing a 400 error. After that failure the component's `etag` prop is already stale (the suite was updated in step 1), so every subsequent save attempt fails with 412 until the page is refreshed.

The backend has shipped `PATCH /api/v1/test-suites/{id}/test-cases:bulk` which handles up to 10 000 IDs per selector and is designed specifically for homogeneous bulk `enabled` changes.

## Goals / Non-Goals

**Goals:**
- Route `enabled`-only changes through the new bulk PATCH endpoint, removing the 256-item bottleneck.
- Keep non-`enabled` field edits on the existing PUT path (unchanged).
- Fix the ETag stale-state bug so any save failure does not block subsequent attempts.
- Maintain atomicity per change type: `enabled` changes are one transaction on the backend; field edits are another (already the case today).

**Non-Goals:**
- Batching or pagination for the existing PUT endpoint (field edits remain capped at 256, which is acceptable given typical usage).
- Combining both change types into a single atomic request (would require a different backend contract).
- Supporting bulk changes to fields other than `enabled` via the new endpoint (backend whitelist currently restricts bulk ops to `enabled` only).

## Decisions

### 1. Split dirty-row tracking into two refs

| Ref | Tracks | Used for |
|---|---|---|
| `dirtyRowsRef` (existing) | Rows with non-`enabled` field changes | PUT payload |
| `dirtyEnabledRef` (new) | Per-row `enabled` final value for existing (persisted) test cases | Bulk PATCH payload |

**Why not a single ref?** The PUT payload needs full `TestCase` objects; the bulk PATCH payload needs only `{ id, enabled }` grouped by value. Separating tracking at the source makes the save logic straightforward and avoids a diff computation at save time.

**Consistency rule** — the two refs can overlap for a row that has both kinds of change:
- `enabled` changes on a row already in `dirtyRowsRef`: update `enabled` inside the existing `dirtyRowsRef` entry so PUT sends the correct final value. Do NOT add this row to the bulk PATCH payload — PUT already covers it.
- Field changes on a row already in `dirtyEnabledRef`: add to `dirtyRowsRef` with the `enabled` value copied from `dirtyEnabledRef`. The row stays in `dirtyEnabledRef` but is excluded from the bulk PATCH build step.

**New test cases** (in `newTestCases` state, not yet persisted): `enabled` changes on new rows go through the existing `updateData` path unchanged and are sent via PUT.

### 2. Bulk PATCH payload: IDs selector, grouped by value

```
dirtyEnabledRef entries NOT in dirtyRowsRef
  → group by enabled value
  → one bulkOperation per group: { selector: { ids: [...] }, patch: { enabled: <value> } }
```

The `filter: []` ("all rows") selector is not used. The FE only knows which rows the user explicitly changed; assuming "all others" are the inverse would require reading the full server state and is fragile.

**Why not one operation per row (itemOperations)?** `itemOperations` cap is 500, which doesn't solve the 800+ row case. `bulkOperations` with an `ids` selector scale to 10 000 IDs.

### 3. Two sequential HTTP calls from View.tsx (PUT then bulk PATCH)

The save sequence becomes:
1. `updateTestSuite` (PUT, ETag-guarded) — suite properties.
2. `updateTestCases` (PUT) — non-`enabled` field changes, if any.
3. `bulkPatchTestCases` (PATCH :bulk) — `enabled`-only changes, if any.

Steps 2 and 3 are independent (different columns) so their order does not matter, but sequential calls are simpler to reason about and match the existing pattern. Each is only issued if there is data to send.

**Why not a single combined call?** The backend's `PATCH :bulk` endpoint supports `itemOperations` for field edits too, but the FE would need to compute per-field diffs (requiring an `originalDataRef`). That is additional complexity for a scenario (many field edits at once) that is not the reported problem. The split path keeps the change minimal.

### 4. ETag stale-state fix

`router.refresh()` is called on **any** error path inside `onSave`, not only on success. This re-renders the server component, which fetches a fresh ETag and passes it as a prop, unblocking subsequent saves.

## Risks / Trade-offs

- **Two-request non-atomicity**: if PUT (step 2) succeeds but bulk PATCH (step 3) fails, field edits are persisted but `enabled` changes are not. The user will see an error notification. `router.refresh()` is called, so the grid reflects the actual server state; the user can retry. This is the same level of atomicity as today.
- **`dirtyEnabledRef` not reset on discard**: must be cleared in `clearDirtyAndRefresh` alongside `dirtyRowsRef`, otherwise stale `enabled` changes would surface on the next save attempt.
- **New test cases with `enabled` toggle**: if a user creates a test case and immediately toggles `enabled`, the row is in `newTestCases`. `onCellValueChanged` must detect new-case rows and not write to `dirtyEnabledRef`; otherwise the new row would appear in both the PUT (as a new case) and the bulk PATCH (as an `enabled` change), causing a 404 on the bulk op (the id doesn't exist yet on the server).
