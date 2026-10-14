## Context

Core serves a read-only `status` (`valid` | `invalid`) and, for admins, `validationWarnings` on platform
entities. `splitValidityFields` (`server/core/asset-metadata.ts`) already moves both into
`_metadata` for every merge function, typed as `CoreResourceEntityMetadata.status` /
`validationWarnings`. Only `InvalidModelBanner` consumes them today.

Header id rendering is duplicated: `SimpleEntityHeader` wraps `CoreSyncEntityStatus` + `ReadonlyId` in a
`flex flex-col gap-0.5` column; `AssetHeader` (and `SkillHeader`) render a bare `ReadonlyId`. Every
`Assets/Platform/*` view uses `SimpleEntityHeader`; public applications, public toolsets and prompts use
`AssetHeader` and carry no `_metadata.status` (Core's `ConfigResourceController` is the only emitter,
and it does not serve public-bucket resources).

The sync badge (`CoreSyncStatusBadge`) and `TableStatusBadge` are two near-identical pills with hard-wired
status maps. Run statuses (completed / failed / running / stopped) are planned to reuse a pill like this.

## Goals / Non-Goals

**Goals:**
- One generic, variant-driven `StatusBadge` that the overall status uses now and run statuses can adopt
  by adding variant entries.
- Show overall status in the header of every entity that has `_metadata.status`, with the invalid
  reasons reachable on hover and keyboard focus.
- Reuse one warnings-to-text util for the badge hint and `InvalidModelBanner`.

**Non-Goals:**
- Touching `CoreSyncStatusBadge`, `TableStatusBadge`, BE `validityState` / `ValidityStatus`.
- Implementing run variants, or migrating Runs.
- Any Core change; public applications/toolsets stay badge-less.

## Decisions

### 1. Generic `StatusBadge` + variant lookup in `Common/StatusBadge/`
Props: `variant`, `label`, optional `hint`, optional `className`. A `STATUS_BADGE_VARIANTS` constant maps
each `StatusBadgeVariant` enum member to `{ pillClassName }`:

| Variant | Pill |
|---|---|
| `Valid` | `bg-success text-success` |
| `Invalid` | `bg-error text-error` |

Layout: `inline-flex items-center gap-1 px-2 py-0.5 rounded-[120px]`; dot `size-[6px] mx-1 rounded-full
shrink-0 bg-[currentColor]` with `aria-hidden`. The info icon renders iff `hint` is truthy, so "invalid ⇒ icon" is not
baked into the component — the mapper decides (user requirement: no hint, no icon).

*Why a lookup over props like `color`/`showIcon`:* a future `running` variant needs a different leading
element (animated icon), not just colours. The lookup entry is where that will live (an optional
`leading` slot), added when the first such variant lands rather than speculatively now.

*Alternative — extend `CoreSyncStatusBadge`:* rejected; it is uppercase, caption-sized, and carries
sync-specific text maps, and the request is to leave it alone.

### 2. Dot colour inherits the text token
The dot is `bg-[currentColor]`, so it always matches the variant's `text-success` / `text-error` — no hex, no
extra token, and it follows any theme override of those tokens. This replaced the first cut
(`bg-accent-secondary` / `bg-red-400`, the lighter #37BABC / #F76464): the text tokens are darker but
match the label. The dots are decorative (the label carries the meaning), so their contrast is not
load-bearing.

### 3. Hint via `DialTooltip` on a focusable trigger
The info icon is wrapped in a `<button type="button">` with `aria-label` (new i18n key) around a
`IconInfoCircle size={16} aria-hidden`, inside `DialTooltip`. A bare SVG with `onClick` (as in
`ValidityStatus`) is not keyboard reachable; the a11y rule requires a focus counterpart to hover.
Verify during implementation that `DialTooltip` opens on focus; if not, check `getEntityDetails` on the
ui-kit MCP for the supported trigger prop before wrapping manually.

### 4. Status mapping as a pure util
`getOverallStatusBadgeProps(metadata?: CoreResourceEntityMetadata): StatusBadgeProps | null` in
`utils/` (co-located test): `valid` → `{ variant: Valid, label }`; `invalid` → `{ variant: Invalid, label,
hint? }`; anything else → `null`. Labels are i18n'd, so the util takes the translated labels (or `t`)
as arguments to stay pure.

The warnings-to-text logic currently inline in `InvalidModelBanner` (`field: message` filtered, joined
`; `) moves to a shared `formatValidationWarnings(warnings)` util; both the banner and the mapper call
it. The banner keeps its own sentence around the result.

### 5. Shared header id block
New `EntityHeaderControls/HeaderIdBlock` renders `[OverallStatusBadge] [ReadonlyId]` in a
`flex flex-col gap-2 min-w-0` column, taking `id`, `metadata?`, and `children` for the existing sync slot
(`SimpleEntityHeader` passes `CoreSyncEntityStatus` there). Both headers use it, so the badge exists once.
`SimpleEntityHeader` currently uses `gap-0.5` for sync-over-id; the block moves that column to `gap-2` for
the overall badge only — the sync badge never appears with the overall badge, so its spacing is
unchanged by keeping `gap-0.5` when `children` is the sync status. (Resolve in implementation by
styling the overall-badge wrapper `mb-1.5` over `gap-0.5`, or by passing the gap per slot; the spec
requirement is only the visible 8px between badge and id.)

*Alternative — add the badge inline in each header:* rejected; four headers already duplicate id
rendering and this change should not add a fifth copy of the pattern. `SkillHeader` and
`ContainersHeader` are not migrated (no `_metadata.status` there today) but can adopt the block later.

### 6. No layout placeholder
The sync badge reserves `h-[20px]` invisibly to avoid shift while it loads asynchronously. The overall
status is read synchronously from the already-fetched entity, so there is nothing to load: render
`null` when absent.

## Risks / Trade-offs

- **[Public apps/toolsets never show a badge]** → Expected until Core serves `status` for them; stated in
  the proposal's non-goals so it is not mistaken for a bug.
- **[Non-admin users see Invalid with no reason]** → Core omits `validationWarnings` for them; the icon is
  hidden by the hint rule rather than showing an empty tooltip.
- **[`gap-2` vs the sync column's `gap-0.5`]** → Handled in decision 5; covered by a header spec asserting
  the badge precedes the id and sync still renders unchanged.
- **[Unrecognised future `status` value]** → Renders nothing, by spec; no crash path.
- **[`InvalidModelBanner` and the badge both show on an invalid model]** → Intentional: the banner
  explains "not served", the badge is the at-a-glance state shared by all entities. Duplicated reasons
  come from one util, so they cannot drift.

## Open Questions

- Whether `DialTooltip` (ui-kit 0.15.3) opens on keyboard focus — verify at implementation; fallback in
  decision 3.
