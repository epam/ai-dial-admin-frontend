## 1. Generic StatusBadge

- [x] 1.1 Replace `StatusBadgeVariant` with `StatusBadgeTone` (`Success`, `Error`, `Info`, `Neutral`) and add `StatusBadgeLeading` (`Dot`, `Spinner`, `None`) in `components/Common/StatusBadge/models.ts`; extend `StatusBadgeProps` with `tone`, `leading?`, `trailing?`; replace `STATUS_BADGE_VARIANTS` with `STATUS_BADGE_TONES` (`backgroundClassName` / `textClassName`: `bg-success`/`text-success`, `bg-error`/`text-error`, `bg-info`/`text-info`, `bg-layer-4`/`text-secondary`) in `constants.ts`; verify `npm run typecheck` flags only the known consumers (`HeaderIdBlock`, `overall-status`)
- [x] 1.2 Update `StatusBadge.tsx`: 12px `aria-hidden` leading slot (6px `bg-[currentColor]` dot, `DialLoader` size 12, or none), hint icon button before an optional `trailing` node rendered outside the pill with `gap-1`; confirm via the ui-kit MCP (`getEntityDetails` on `DialLoader`) that the spinner follows `currentColor`, otherwise colour it through the wrapper; verify against Figma nodes 5434-15512 and 5434-15507

## 2. Header status row

- [x] 2.1 Rework `EntityHeaderControls/HeaderIdBlock.tsx`: drop `metadata` and the sync `children`, take `statusBadges?: ReactNode`, render a `flex flex-col gap-1 min-w-0` column with a `flex items-center gap-5 py-1 empty:hidden` row above `ReadonlyId`; verify with a spec that the row is absent when `statusBadges` renders nothing
- [x] 2.2 Add an optional `statusBadges` prop to `SimpleHeader.tsx` and pass it to `HeaderIdBlock`; render `<EntityValidityBadge>` and `CoreSyncEntityStatus` as two separate elements in it, and the same single validity element in `AssetHeader.tsx`; add the optional `validityState`, `valid` and `validationWarnings` fields to the header `Entity` type (type-only); verify the header specs for "two badges", "one badge" and "no badge"

## 3. Validity badge

- [x] 3.1 Move `formatValidationWarnings` out of `utils/entities/overall-status.ts` into `utils/entities/validation-warnings.ts`, add the `code: message` variant for test-suite warnings, and point `InvalidModelBanner.tsx` at it; verify the banner spec still passes
- [x] 3.2 Add `Common/EntityValidityBadge/get-entity-validity.ts` (`_metadata.status` → `validityState` → `valid` + `validationWarnings`; hint only when invalid and non-empty) and `EntityValidityBadge.tsx` (Valid → success/dot, Invalid → error/dot + hint); delete `utils/entities/overall-status.ts` and its spec; verify util specs cover every source, valid-never-hints, invalid-without-text and unrecognised status
- [x] 3.3 Remove the Properties-tab `ValidityStatusLabel` from `Applications/View/Properties/TabContent.tsx`, `Keys/View/TabsContent.tsx` and `TestSuites/View/TabsContent.tsx`; delete `ValidityStatusLabel.tsx` if `grep` finds no remaining reference; verify the three tab specs no longer expect a Status label and test-case rows keep their `ValidityStatus` indicator

## 4. Core sync badge

- [x] 4.1 Add `Common/SyncCoreStatus/constants.ts` (`CORE_SYNC_BADGES`: `EntitySyncStatus` → label key, tone, leading, trailing per the `entity-sync-status-badge` table; `CoreSyncTrailing`: `Diff`, `InfoGlyph`) and `CoreSyncBadge.tsx` rendering it; update `CoreSyncI18nKey` / `en.ts` ("Sync in progress", "Synced", "Sync Unavailable", "Out of sync") plus an accessible name for the diff button; verify with a `CoreSyncBadge` spec for all four states and a missing status
- [x] 4.2 Rework `CoreSyncEntityStatus` to render `CoreSyncBadge` with `onDiffClick` opening `CoreSyncDiffModal`; keep polling, `resetCounter` refetch and the reserved slot (24px); render `CoreSyncBadge` inside `DiffModal.tsx` without `onDiffClick`; delete `CoreSyncStatusBadge.tsx`; verify no remaining import of it and the new component specs pass

## 5. Runs

- [x] 5.1 Check that the single-run fetch (`getRun` → `server/eval/runs-api.ts`) returns `errorMessage` / `errorDetails`; if it does not, map them in the server layer (frontend only) and verify with an API-layer spec
- [x] 5.2 Add `Common/RunStatus/run-status-presentation.ts` (`RunStatus` → tone + leading per the `run-status-display` table; unknown status → neutral/dot with the raw value) and `RunStatusBadge.tsx` (label from `getStatusLabel`, hint = `errorMessage ?? errorDetails?.message` for `FAILED` only); verify with specs for every status, Failed with and without a message, and an unknown status
- [x] 5.3 Make `RunStatusComponent` take its dot colour and in-progress state from the presentation map and remove `SETTLED_STATUS_DOT_CLASS`; keep the icon-only layout, tooltip and `sr-only` label; verify with a spec asserting list indicator and badge agree on tone and in-progress state for every `RunStatus`
- [x] 5.4 Pass `<RunStatusBadge run={selectedRun} />` as `statusBadges` from `Runs/View/View.tsx` and remove the Status `LabelledText` from `Runs/Summary/Header.tsx`; verify the view spec shows the badge above the id, reflects a status change (e.g. stopping), and the Summary spec has no Status field

## 6. Unit tests

- [x] 6.1 Update `StatusBadge`, `HeaderIdBlock` and header specs for tones, leading indicators, trailing slot, hint-before-trailing, and the status row (gap, collapse, both header types); add the sync component spec (states, diff button name and modal, glyph has no tooltip, no badge without status, hidden when the Admin API is off or the view has no lookup); run each new or changed spec with `npx vitest run <file>` from `apps/ai-dial-admin/`

## 7. Quality checks

- [x] 7.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and the full `npm run test` suite; fix any failures
