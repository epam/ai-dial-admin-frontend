## Context

See proposal.md for motivation and scope; the capabilities are `status-badge`, `entity-sync-status-badge`,
`entity-overall-status-badge` (modified) and `run-status-display` (modified).

Current state that shapes the approach:

- `Common/StatusBadge` (from #5028) has variants named `Valid` / `Invalid`, a 6px dot, an optional hint, no
  spinner and no trailing slot. Its only consumer is `EntityHeaderControls/HeaderIdBlock`, which takes
  `_metadata` and a `children` slot used for the sync badge.
- `SimpleEntityHeader` hard-wires the sync slot (`CoreSyncEntityStatus`, gated on `adminApiEnabled` and
  `getCoreSyncStatusUrl`); `AssetHeader` has no sync. Runs and test suites already pass through
  `SimpleEntityHeader` but carry no `_metadata`, so they show no badge today.
- Validity lives in three shapes: `_metadata.status` + `validationWarnings` (Core entities),
  `validityState {valid, message}` (Applications, Keys), and `TestSuite.valid` + `validationWarnings
  {code, message, ...}`.
- Run status is rendered by `Common/RunStatus/RunStatus.tsx` (own dot map, `DialLoader` for transitional
  statuses) in the Summary tab and, icon-only, in the Runs grid.
- `CoreSyncStatusBadge` is a separate uppercase pill with its own map; the diff modal reuses it.
- Figma gives the whole set in one pill system: 12px leading slot (dot or spinner, or none for sync),
  `px-2 py-0.5`, 120px radius, dial-tiny-semi-text text; trailing 24px icon buttons for hint and diff; a status row
  with 20px between badges, 4px above the title.

## Goals / Non-Goals

**Goals:**
- One generic badge that knows no status, plus thin adapters per feature.
- Validity and sync each removable by deleting one folder and one JSX line per header, with no edit to the
  generic badge, the header row, or each other.
- Runs, test suites, Applications and Keys get a header badge with no new backend fields.

**Non-Goals:**
- Restyling grid cells beyond what the run list's shared status map implies.
- A shared "status registry". Each feature owns its map; only the badge is shared.

## Decisions

### 1. Tone-based variants, not domain variants
`StatusBadgeVariant { Valid, Invalid }` becomes `StatusBadgeTone { Success, Error, Info, Neutral }` in one
lookup `STATUS_BADGE_TONES` giving `{ backgroundClassName, textClassName }` (`bg-success`/`text-success`,
`bg-error`/`text-error`, `bg-info`/`text-info`, `bg-layer-4`/`text-secondary`; all four tokens exist in
`tailwind.config.js`). Props become `{ tone, label, leading?, hint?, trailing?, className? }`.

*Why:* with domain variants, deleting validity means editing the generic component, and the same
success/error colours would be redeclared per feature. *Alternative — keep `Valid`/`Invalid` and add
`Running`, `Synced`, …:* rejected; that makes `StatusBadge` the registry of every status and the one file
every removal touches. The rename touches #5028's `HeaderIdBlock`, `overall-status` and their specs only.

Two separate class strings (not one `pillClassName`) because the Runs list needs the text colour alone
for its icon-only dot (decision 5).

### 2. Leading indicator and trailing slot on the badge
`leading?: StatusBadgeLeading { Dot, Spinner, None }` (default `Dot`): a 12px `aria-hidden` slot holding
either a `size-[6px] rounded-full bg-[currentColor]` dot or `DialLoader` (12px, as `RunStatus` uses now).
`trailing?: ReactNode` renders outside the pill with `gap-1`; the hint icon button (24px square, 16px
`IconInfoCircle`, as today) renders before it. The badge never inspects `trailing`, so the diff button's
behaviour and the Sync Unavailable glyph stay in the sync feature.

*Alternative — a `trailing: 'info' | 'action'` enum:* rejected; it leaks sync's two shapes into the badge.
*Open point:* the spinner's colour on a tinted pill (Figma's "Only for Bg/Layer-1" variant) — confirm
`DialLoader` follows `currentColor` via the ui-kit MCP (`getEntityDetails`) before use; otherwise colour it
through the wrapper.

### 3. Header status row owned by the header, badges owned by their features
`HeaderIdBlock` drops `metadata` and the sync `children`. It takes `statusBadges?: ReactNode` and renders
`flex flex-col gap-1 min-w-0` → a row `flex items-center gap-5 py-1 empty:hidden` → `ReadonlyId`.
`empty:hidden` collapses the row (padding included) when every badge component returns `null`, which
keeps "no status ⇒ unchanged layout" without the header knowing which badges exist.

Each header lists its badges as separate elements:

```
SimpleEntityHeader:  <EntityValidityBadge entity={props.entity} />   // feature: validity
                     {hasCoreSyncStatus && <CoreSyncEntityStatus …/>} // feature: sync
                     {statusBadges}                                    // caller-supplied (runs)
AssetHeader:         <EntityValidityBadge entity={props.entity} />
```

The `statusBadges` prop (on `SimpleEntityHeader`, passed through) is how Runs puts its pill in without the
header learning about runs. The sync badge reserves its slot (24px) while loading, as it does today with
`h-[20px]`, so the row is non-empty exactly when sync applies.

*Alternative — each view passes all badges:* rejected; ~25 views would each wire validity and sync, and a
removal would touch all of them. *Alternative — header takes `validity` and `sync` props:* rejected; it
moves the coupling from JSX lines to the props type.

### 4. Validity: one component, three source adapters
New `Common/EntityValidityBadge/`: `EntityValidityBadge` (component), `get-entity-validity.ts` and tests.
`getEntityValidity(entity)` returns `{ isValid: boolean; hint?: string } | null`, checking in order
`_metadata.status`, `validityState`, `valid` (+ top-level `validationWarnings`). Hint text per source is
specified in `entity-overall-status-badge`; the formatter is a small shared function — `field: message`
for Core, `code: message` for test suites — in one new `utils/entities/validation-warnings.ts`, which
`InvalidModelBanner` also imports (so the banner does not depend on a module that is deleted with the
badge). `utils/entities/overall-status.ts` is folded into the folder above and removed.

The header's `Entity` type gains optional `validityState`, `valid` and `validationWarnings`; this is the
only place the header knows validity exists, and it is type-only.

Properties-tab `ValidityStatusLabel` usages are removed from Applications (`Properties/TabContent.tsx`),
Keys (`View/TabsContent.tsx`) and Test suites (`View/TabsContent.tsx`); the component is deleted if no
reference remains. `ValidityStatus` (the dot) stays for grid cells and test-case rows.

### 5. Runs: one status map feeds the pill and the list dot
`Common/RunStatus/` gains `run-status-presentation.ts`: `Record<RunStatus, { tone, leading }>` per the
`run-status-display` table (Pending → neutral/dot as an assumption — it is not in Figma — and unknown
statuses → neutral/dot showing the raw value, preserving the existing "legible" requirement).
`getStatusLabel` stays the single label source, so the filter, cell and pill cannot drift.

- `RunStatusBadge` (new) builds `StatusBadge` props from a `Run`: label, tone, leading, and hint =
  `run.errorMessage ?? run.errorDetails?.message` for `FAILED` only.
- `RunStatusComponent` (list, `isLabelHidden`) keeps its icon-only layout, 65px column and tooltip, but
  takes its dot colour from the map's tone (`bg-[currentColor]` + the tone's `textClassName`) and its
  in-progress state from `leading === Spinner`. This replaces `SETTLED_STATUS_DOT_CLASS`.
- `Runs/View/View.tsx` passes `statusBadges={<RunStatusBadge run={selectedRun} />}`;
  `Runs/Summary/Header.tsx` loses its Status `LabelledText`.

*Risk to check first:* `Run.errorMessage` / `errorDetails` exist on the model and `errorMessage` is mapped
for list rows, but it is unverified that the single-run fetch (`getRun` → `server/eval/runs-api.ts`)
returns them. If it does not, the Failed pill ships without an icon until it does; mapping is a frontend
change only, no new backend field.

### 6. Sync: config table + component on the generic badge
`Common/SyncCoreStatus/`: `CoreSyncStatusBadge.tsx` is deleted. `constants.ts` holds `CORE_SYNC_BADGES`,
a `Record<EntitySyncStatus, { labelKey, tone, leading, trailing? }>` (`CoreSyncTrailing`: `Diff`,
`InfoGlyph`) per the `entity-sync-status-badge` table, and `CoreSyncBadge.tsx` renders `StatusBadge` from
it, building `trailing` as the diff button (existing `Difference` icon in a 24px `DialIconButton`, now with
an `aria-label`, calling `onDiffClick`) or a 14px `aria-hidden` `IconInfoCircle` with no tooltip.
`CoreSyncEntityStatus` passes `onDiffClick` to open the same `CoreSyncDiffModal`; the modal renders
`CoreSyncBadge` without it, so it shows no diff button. Polling, `resetCounter` refetch and the reserved
slot are unchanged.

Labels: "Sync in progress", "Synced", "Sync Unavailable" (Figma casing; was "Sync unavailable"), "Out of
sync"; the uppercase class goes away. The in-progress tone changes warning → info per Figma.

### 7. What detaching each feature costs
| To remove | Delete | Edit |
|---|---|---|
| Validity | `Common/EntityValidityBadge/`, `Common/ValidityStatus/ValidityStatusLabel.tsx` if unused, `Valid`/`Invalid` i18n keys | one JSX line in `SimpleHeader`, one in `AssetHeader`, the type-only fields on the header `Entity` |
| Sync | `Common/SyncCoreStatus/`, `getCoreSyncStatusUrl`, `getCoreSyncStatus` action, `CoreSync` i18n | the sync line and the `hasCoreSyncStatus` constant in `SimpleHeader` |

Neither removal touches `StatusBadge`, `HeaderIdBlock`, `RunStatusBadge`, or the other feature. A header
spec rendering with no validity and no sync (the "No badge" scenario) guards that independence.

## Risks / Trade-offs

- **[Run list and pill drift]** → one tone/leading map and one label source; a test asserts the list dot
  and badge agree for every `RunStatus`.
- **[Row collapse relies on `empty:hidden`]** → relies on badge components returning `null` rather than an
  empty wrapper; the header spec covers "no badge ⇒ no row", and sync's reserved slot is the one deliberate
  exception.
- **[Run header gains a pill but the Summary tab loses its Status field]** → Summary no longer shows status
  if someone opens it without the header in view; judged fine because the header is always visible above
  the tabs. Reversible by restoring one `LabelledText`.
- **[Sync Unavailable glyph with no tooltip is non-informative]** → it follows Figma and today's behaviour
  of showing no hint; it is `aria-hidden`, so the label carries the meaning. Dropping it is a one-line
  change in the mapper.
- **[Failed hint may be empty in practice]** → see decision 5; ships safe (no icon) either way.
- **[Dot looks different]** → 6px dot centred in a 12px slot approximates Figma's `point` icon; compare
  against Figma node 5412:245765 during implementation.
- **[Blast radius on #5028 code]** → the tone rename edits `HeaderIdBlock`, `overall-status` and their
  tests; nothing else imports the old names.

## Open Questions

- Pending's styling (neutral + dot, same as Stopped) is inferred; confirm with design after the first
  render, no spec change needed unless the tone changes.
