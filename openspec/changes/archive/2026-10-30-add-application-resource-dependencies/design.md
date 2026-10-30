## Context

Core's `feat/resource-dependencies-v1` branch adds, per application:

- a declaration, `resource_dependencies[]` (Core also accepts the camelCase alias on write), validated
  at write time by `ResourceDependencyValidator`;
- an admin-consent record, one per application, keyed by the application's canonical name in the public
  bucket, read and written only through
  `GET | POST | DELETE /v1/consent/{app}/admin-consent` (all three admin-only, fail-closed).

Facts about Core that drive this design:

- `GET` returns `{ consented, stale?, grantedBy?, grantedAt?, grantedResources?: [{ url, access[] }] }`.
  `consented` means "live right now" — exactly what the request-time gate enforces. `stale` means a
  record exists but no longer matches the declaration. Provenance and `grantedResources` are present
  whenever a record exists, including the stale case.
- `POST` approves the **saved** declaration and answers 400 when it declares nothing.
- The record binds to the declaration's **path and access, in order**. `link_id` and `required` are
  not part of the comparison; reordering rows makes an approval stale.
- At runtime an unconsented or unresolvable dependency is skipped unless it is `required`, in which
  case the call fails.
- Note the field-name asymmetry: dependency targets use `path`, consent entries use `url`.

On the FE, Assets > Applications is already Core-direct. `ExternalServiceConsentApi extends CoreApi`,
`ExternalServiceConsentDialog` (ui-kit `ConfirmationPopup`) and the `grantExternalServiceConsent` /
`withdrawExternalServiceConsent` server actions are the direct precedent. `TabsContent` is shared with
the admin-backend Applications view, so changes there must be conditional on the view.

## Goals / Non-Goals

**Goals**
- Author and persist `resource_dependencies` through the normal header Save / Discard flow.
- Show consent state truthfully and let an admin approve, re-approve and revoke.
- Catch invalid declarations before Save with the same rules Core enforces.

**Non-Goals**
- See the proposal's Non-goals. In addition: no optimistic consent state, no polling.

## Decisions

### D1. Consent calls go Core-direct through a new `AdminConsentApi`

`AdminConsentApi extends CoreApi` in `src/server/core/admin-consent-api.ts` with `getStatus`
(`getAction`-style read returning a typed body), `grant` and `withdraw`. Server actions in
`assets-applications/actions.ts` authenticate with `getUserToken()` and delegate, like the external
service consent actions. The path is built with `encodeCorePath(appPath)` as in
`ExternalServiceConsentApi`.

*Alternative:* route through the admin backend — rejected: the endpoints are Core's, and this surface
already avoids the admin backend.

### D2. Declaration edits live in `selectedApp`; consent actions never touch it

Add / Edit / Duplicate / Remove call `onChangeApplication` with a new `resource_dependencies` array, so
the existing `isChanged`, Save, Discard and JSON-editor paths work unchanged. Approve, Revoke and the
status read are independent Core calls and do not mark the entity changed.

An empty array is written as `undefined` (not `[]`) so the field disappears from the body, matching
Core's `NON_EMPTY` serialisation and avoiding a spurious diff against an app that never had the field.

### D3. Consent status is fetched lazily by the tab and keyed on the saved etag

`ResourceDependencies` mounts a `useAdminConsent(appPath, etag)` hook (kebab-case file in the feature
folder). It fetches on mount and refetches when `etag` changes (a successful Save refreshes the page and
the etag) and after every Approve / Revoke. While loading, the consent block shows a spinner; the grid
renders immediately from `selectedApp`.

Any failure of the status read — 403 (not an admin), 404 (Core without the feature or the app moved),
or a network error — switches the **whole tab** to the no-data component, per the product decision.

*Alternative:* prefetch in `page.tsx` next to the option lists — rejected: it taxes every application
page load for a tab most users never open, and a 403 for non-admins would have to be special-cased
server-side.

### D4. Status is derived, not recomputed

The block derives a single view state from three inputs: `savedCount` (from `originalApp`),
`status` (Core) and `isDirty` (the declaration differs between `originalApp` and `selectedApp`).

| savedCount | Core status | Status label | Buttons |
|---|---|---|---|
| 0 | any | Not approved | none |
| ≥1 | no record (`consented` false, `stale` absent) | Not approved | Approve |
| ≥1 | `consented` | Approved | Revoke |
| ≥1 | `stale` | Not approved | Re-Approve, Revoke |

- `isDirty` never changes the label or which buttons exist; it **disables** Approve / Re-Approve and
  shows the neutral "reflects the saved definition — save to update it" note, because Core approves
  the saved declaration only.
- `stale` shows the red "Declaration changed since last approval — re-approve to restore" note plus the
  **Approved resources** list from `grantedResources`.
- `consented` shows the same Approved resources list without the red note.
- Revoke stays available whenever a record exists. When `savedCount` is 0 but a record exists, no
  buttons are shown and the stale-note rule does not apply; the stale record is harmless (nothing
  resolves) and re-saving a declaration reconciles it.

"Dirty" is computed with the existing `isEqualSkippingUndefined` over the `resource_dependencies`
slice only, so edits to unrelated properties do not disable approval.

*Alternative:* hide the buttons while dirty — rejected: layout jumps while editing, and the user loses
the cue that approval is waiting on a Save.

### D5. Confirmation dialogs reuse `ConfirmationPopup`; their path lists come from the right source

- **Approve / Re-Approve** lists the **saved** declaration (`originalApp.resource_dependencies`), each
  as `path (WRITE, READ)`, because that is what Core will approve.
- **Revoke** lists `status.grantedResources` — what is actually approved — not the current declaration.
  Core's `url` is mapped to the FE's `path` at the API boundary so UI code never sees the asymmetry.
- Revoke copy states the consequence: the application stops acting on users' behalf for these
  resources for every user, immediately, and required dependencies will fail the call.

A shared `ResourceList` presentational piece renders both lists and the Approved resources block.

### D6. Validation mirrors Core in a pure util, applied in the modal and on the grid

`utils/validate-dependency.ts` (pure, with a spec) reproduces `ResourceDependencyValidator`:

- `link_id`: required (trimmed non-empty), unique within the declaration (case-sensitive, excluding
  the row being edited).
- `target.path`: trimmed non-empty; split after dropping one trailing `/`; each segment decoded with a
  safe `decodeURIComponent` (an undecodable segment is kept raw, as Core's `tryDecodePath` does); first
  segment ∈ `files, prompts, conversations, applications, toolsets, skills`; `users` explicitly
  rejected; at least two segments (no bare type root); `{current-user}` allowed only as segment index 1;
  no empty segment, no `*`, no `.` or `..` after the root.
- `access`: non-empty, never `SHARE` (the UI cannot produce it; JSON-edited data is still checked).
- section size ≤ 100.

The modal enables **Add / Save** only when required fields are filled and no rule fails, and shows the
first failing rule under the field. The 100-entry cap disables Add dependency with a tooltip. The
decode step is deliberate: Core canonicalises through a decode, so validating the raw string would let
`%2e%2e` through the FE check only to fail on Save.

A drift risk is accepted knowingly; see Risks.

*Alternative:* only check non-empty and surface Core's 400 on Save — rejected by the product decision;
mirroring gives immediate feedback.

### D7. Access control: Write implies Read

The two checkboxes are controlled. Checking Write also checks Read and disables the Read checkbox while
Write is on; unchecking Write re-enables it. Deselecting both is allowed in the form but invalid: Add
stays disabled with "Select at least one access right" (Core rejects empty access). Locking Read when it
is the only right was rejected — Write-only is then unreachable and the checkbox would never move. Stored `access` is emitted in a fixed order (`READ`,
`WRITE`) so equal declarations serialise equally and the order-sensitive dirty check is stable.

### D8. Duplicate adds a row directly with a unique suffixed Link ID

Duplicate clones the row and sets `link_id` to `<id>_copy`, then `<id>_copy2`, `_copy3`, … until unique,
inserted directly after the source row. No modal. Row order is declaration order and is preserved,
because Core treats reordering as a change requiring re-approval.

### D9. Public-bucket gating and tab composition

`getTabsForAsset(AssetsApplications)` drops `dependenciesTab`; the platform view derives its tabs from it,
so both buckets lose the tab. `AppView` is already the public-bucket-only component (`page.tsx` renders
`PlatformApplicationView` for the platform bucket), so it alone applies `withResourceDependenciesTab`
— which inserts the tab before App Routes, where Dependencies used to sit — next to the existing
conditional MCP `toolsTab` splice. No separate bucket test is needed. The admin-backend Applications view continues to use its own tab builder and keeps
`dependenciesTab`.

`EntityViewTab` gains `ResourceDependencies`; `TabsContent` renders the new component for it when
`view === AssetsApplications`.

### D10. Component layout and grid behaviour

```
ResourceDependencies/
  ResourceDependencies.tsx      tab root: wires hook, selectedApp, dialogs; flex-col h-full
  AdminConsent/AdminConsent.tsx consent block (header, LabelledText facts, notes, buttons)
  AdminConsent/ApprovedResources.tsx
  DependenciesGrid.tsx          header (count + Add) + GridView, flex-1 min-h-0
  DependencyModal.tsx           add / edit
  ConsentDialog.tsx             approve / re-approve / revoke ConfirmationPopup variants
  use-admin-consent.ts
  utils/ (validate-dependency, copy-link-id, access, derive-consent-state)
  models.ts / constants.ts
```

The grid uses `GridView`/`AgGridWrapper` with the standard `ActionCellRenderer` for Edit / Duplicate /
Remove, `BooleanButtonCellRenderer`-style read-only rendering for Required, and `EllipsisTooltip` for
the path. It fills the remaining height (`flex-1 min-h-0`) below the consent block, which has natural
height. Edit / Remove and Add are hidden when the Core status read fails (whole tab is no-data anyway).
The root-level tab has no inline-edit cells, so `isSkipRefresh` is not needed.

The consent block and Required switch description follow a11y rules: a live-region `role="status"` for
the state text so approval changes are announced; icons inside labelled buttons are `aria-hidden`.

## Risks / Trade-offs

- **Validator drift** — Core's grammar can change in a later version → the util is small and
  table-tested against the cases in Core's `ResourceDependencyValidatorTest`; Core stays authoritative
  and its 400 is still surfaced through the normal Save error notification.
- **Core branch not released** — field names (`url` vs `path`) could change before release → the
  mapping is confined to `AdminConsentApi`; a spec-level note records the dependency.
- **Non-admins lose the grid** — a 403 on the status read hides the tab content even for users who may
  edit the application → accepted product decision; revisit if non-admin editors exist.
- **Stale status after external change** — another admin approving or revoking is not seen until the
  next fetch → the actions always refetch; mutation errors show Core's message and refetch.
- **Order sensitivity** — reordering is not offered in the UI, so approval cannot go stale through a
  gesture the user did not intend; JSON-editor reordering still can, and is reported as stale by Core.
- **Declaring then moving an app** — the record is keyed by canonical name; a moved app reads as
  unapproved (fail-closed) → shows as Not approved; no special handling.

## Migration Plan

Single PR, no data migration. Existing applications have no `resource_dependencies`; they show the
empty grid and no consent buttons. Rollback is a plain revert; the stored array is inert to older FE
builds (Core ignores nothing it was sent, and older FE passes unknown fields through unchanged).

## Open Questions

- Final Core field names for consent entries (`url`) — re-verify when Core merges the feature.
