## Why

#5028 introduced a generic `StatusBadge` and used it for the overall Valid/Invalid status of Core entities
only. Every other status in the entity header is still its own thing: runs show a dot + text inside the
Summary tab, test suites show validity in the Properties tab, Applications and Keys show the old
`ValidityStatus` dot, and the Core sync badge is an uppercase caption pill on a separate row. The design
(DIAL Admin Patterns) now defines one pill for all of them, laid out together in a single status row above
the title. This change finishes that migration.

Validity and Core sync are both expected to be removed from the product later, so they must be built as
detachable features on top of a generic badge, not woven into it.

## What Changes

- **Generic `StatusBadge` becomes tone-based.** Variants are named by tone (`success`, `error`, `info`,
  `neutral`), not by domain (`valid`/`invalid`), so removing validity or sync never touches the component.
  It gains a leading indicator (dot, spinner, or none), a trailing slot rendered beside the pill, and keeps
  the optional hint (info icon + tooltip). Visual contract follows Figma nodes 5434-15512 / 5434-15507 /
  5434-15496.
- **Header status row.** `SimpleEntityHeader` / `AssetHeader` render one row above the id holding whichever
  badges apply, with a 20px gap between badges and the row collapsing when empty. Each badge is an
  independent component the header lists on its own line, so deleting a feature is deleting one line plus
  its folder.
- **Runs.** The run detail header shows the run's status pill above the run id (Running / Stopping with
  spinner, Completed, Stopped, Pending, Failed). A failed run's pill carries the run's error message as its
  hint. The Summary tab's duplicate Status field is removed. The Runs list keeps its icon-only status
  column; it reads colour and in-progress state from the same status map as the pill.
- **Test suites.** The suite detail header shows Valid / Invalid from `valid` + `validationWarnings`
  (hint = the warnings). The Properties-tab validity label is removed.
- **Other validity entities.** Applications and Keys (`validityState`) show the same Valid / Invalid pill in
  the header (hint = `validityState.message`). Their Properties-tab label is removed. The existing
  `_metadata.status` entities keep their badge, now through the shared validity component.
- **Core sync badge.** `CoreSyncStatusBadge` is replaced by the generic badge and moves into the status
  row next to validity. Four states per Figma: Sync in progress (info, spinner, diff button), Synced
  (success), Sync Unavailable (neutral, decorative info glyph, **no tooltip**), Out of sync (error, diff
  button). No longer uppercase; in-progress changes from warning to info colour. The diff modal's inner
  badge uses the same mapping.

Non-goals:

- No change to the Runs list status column width, filter, sort or the compare picker.
- No migration of `ValidityStatus` dots in grids, test-case / dataset grids, or the CSV import preview.
- No change to `TableStatusBadge`, `BackfillStatusBadge`, Pipeline badges, container / image
  `StatusIndicator`, or the execution-result pills; they stay on their own maps.
- No new backend fields. No tooltip for Sync Unavailable (today's badge has none).
- `InvalidModelBanner` stays.
- Removing validity or sync is not part of this change; it is only made cheap.

## Capabilities

### New Capabilities
- `status-badge`: the generic badge contract — tone variants, leading indicator, hint, trailing slot,
  header status row layout. Moved out of `entity-overall-status-badge` so it does not depend on validity.
- `entity-sync-status-badge`: the Core sync badge's states, trailing actions, placement beside validity,
  and the diff modal's use of it. No spec existed for it.

### Modified Capabilities
- `entity-overall-status-badge`: validity badge now covers `validityState` (Applications, Keys) and
  `valid` + `validationWarnings` (test suites) as well as `_metadata.status`; validity is shown only in the
  header (Properties-tab labels removed); the generic visual and hint requirements move to `status-badge`.
- `run-status-display`: on a run's detail surface the status is a pill in the header; Failed carries the
  error message as a hint; `CANCELLING` / `CANCELLED` read Stopping / Stopped; list rows keep the
  icon-only presentation.

## Impact

- **Edited:** `Common/StatusBadge/*` (tone variants, leading, trailing), `EntityHeaderControls/HeaderIdBlock.tsx`
  and the two headers, `Common/SyncCoreStatus/*` (badge, entity status, diff modal),
  `Common/RunStatus/*` (shared status map, header pill), `Runs/View/View.tsx`, `Runs/Summary/Header.tsx`,
  `TestSuites/View/{View,TabsContent}.tsx`, `Applications/View/*`, `Keys/View/*`, `utils/entities/overall-status.ts`,
  `constants/i18n.ts`, `locales/en.ts`.
- **New:** an entity-validity badge component with three small source adapters
  (`_metadata`, `validityState`, `valid` + warnings).
- **Removed:** `CoreSyncStatusBadge.tsx`, Properties-tab `ValidityStatusLabel` usages for Applications,
  Keys and Test suites.
- **Shared-component risk:** `StatusBadge` variant rename touches #5028's code and tests only
  (`HeaderIdBlock`, `overall-status`).
- **Existing specs:** `eval-runs-list` is unaffected (the list column stays icon-only).
- **Unverified:** whether the single-run response carries `errorMessage` / `errorDetails` (see design).
