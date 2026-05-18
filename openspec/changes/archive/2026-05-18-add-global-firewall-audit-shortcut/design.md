## Context

The Global Firewall popup (`GlobalWhitelist` modal) is opened from the Images list page header and renders the deployment-manager's domain whitelist via `getDomains` + `onApply`. It uses `DialConfirmationPopup` from `@epam/ai-dial-ui-kit`, which currently shows just Cancel and Apply buttons. There is no current path from this popup to its audit trail — the user must navigate manually to `/activity-audit`, switch the View dropdown from `Config` to `Deployments`, and filter the Resource type column. That manual filter is broken: the column shows a localized label (`"Global Whitelist"`, `"Adapter container"`, etc. — `Resource type column shows localized singular labels` requirement in the `activity-audit-deployments-view` capability) but the AG Grid datasource is server-side, so the user's freetext input is forwarded verbatim to the backend and matched against the raw enum value (`"ImageBuildDomainWhitelist"`). `filterValueGetter` exists on the column definition but only affects client-side filtering and is silently ignored.

Two existing patterns guide this work:
- `audit-tab-return-state` (active capability) uses localStorage with a path-keyed prefix `audit-tab-return:` and a one-shot read-and-clear helper to hand off "open Audit tab on return" state across navigation. This change adds an analogous helper for "open audit list with a preselect".
- `DialConfirmationPopup` accepts a `footer?: ReactNode` prop (inherited from `DialPopupProps`); when provided, the kit replaces its default Cancel/Confirm footer entirely (`dial-ui-kit.es.js:49822` — `footer: C ?? w`). Several other modals in the repo already use this pattern (`ContainerCreate.tsx:157`, `ImportModal.tsx:262`, `FullscreenViewer.tsx:46`).

## Goals / Non-Goals

**Goals:**
- One click in the Global Firewall popup lands the user on `/activity-audit` with the Deployments view selected and the Resource type filter applied to Global Firewall activities.
- Manual freetext input in the Resource type column matches the displayed label (so typing "Global" or "Container" finds matching rows in both Deployments and Config views).
- The preselect mechanism is generic enough to extend with future shortcuts without rewriting (single value contract `'global-firewall'` today, expandable to a string union later).
- Audit row click handling, deep-link URLs, and existing tab-return behavior remain untouched.

**Non-Goals:**
- Generalizing the preselect contract to arbitrary filter shapes — only the named `'global-firewall'` preselect ships; future shortcuts add new named values, not free-form payloads.
- Replacing the Resource type column's freetext filter with a dropdown / set filter — UX stays freetext.
- Persisting the preselect across page refresh — it is one-shot read-and-clear; refresh after landing leaves the user with the filter the grid persisted to its own localStorage (standard AG Grid behavior).
- Changing the Config view's Resource type *display* — only the *filter* matching gets aligned with the existing display.
- Adding similar shortcuts to other modals (Image popups, Container popups, etc.) — out of scope; this proves the pattern.

## Decisions

### Decision 1: Custom `footer` slot, rebuild Cancel/Apply with the kit's `Info` variant components

`DialConfirmationPopup` replaces its default footer when `footer` is set — the kit's source confirms `footer: C ?? w` where `C` is the custom slot and `w` is the default button pair. Rather than asking the UI kit to expose a slot that augments the default, we render the kit's own `Info`-variant components inline with the new "View in Activity Audit" link inside a single `footer` element. This is consistent with how `ContainerCreate.tsx`, `ImportModal.tsx`, and `FolderCreateModal.tsx` already shape their footers.

**Button variants — match the kit's `Info` ConfirmationPopupVariant config (`dial-ui-kit.es.js:49746-49755`):**
- Cancel: `DialNeutralButton` — `{ variant: Neutral, appearance: Outlined }` (the default Cancel rendering the kit uses internally as `rs as DialNeutralButton`).
- Confirm/Apply: `DialPrimaryButton` — `{ variant: Primary, appearance: Solid }`. The kit internally uses `Ei as DialButton` with these props supplied from the variant table; `DialPrimaryButton` is the equivalent pre-styled export and renders identically.
- Link: `DialGhostButton` with `iconAfter={<IconExternalLink/>}` — ghost styling is consistent with other in-line "open in new tab" links in the codebase (`WelcomeView.tsx`, `DocumentationModal.tsx`).

An earlier draft used `DialGhostButton` for Cancel and the generic `DialButton` for Apply, which rendered both with the wrong (flat/ghost) variant. The fix above pulls the correct kit components.

**Alternative considered:** add a `footerPrefix` prop to the UI kit so the link could sit alongside the default buttons. Rejected — cross-package change, out of scope, and the inline footer is six lines of JSX.

**Layout:** `flex flex-row items-center justify-between px-6 py-4` — link on the left, Cancel + Apply on the right inside a `gap-2` row. Disabled / loading semantics of the default buttons are preserved: the Cancel + Apply buttons hide entirely when `isLoading` (matching the kit's default behavior — its `w` footer evaluates to `null` while loading). The link stays visible during loading per spec.

### Decision 1.5: Link navigates same-tab via Next's `useRouter().push`

The link calls `useRouter().push(ApplicationRoute.ActivityAudit)` — Next.js client-side navigation, same tab. The popup closes (`onClose()`) as part of the navigation.

**Why not `window.open(..., '_blank')` (new tab)?** Earlier iterations explored a new-tab open via `window.open`. Reverted because:

- New-tab navigation in Next.js bypasses the client router, costing prefetching and the in-app loading state.
- Same-tab via `router.push` is the established pattern across the codebase for "navigate the user somewhere else in the app".
- The popup is reviewable content — losing it on a same-tab nav is fine; the user explicitly chose to leave.
- Storage handoff is trivial in same-tab: `localStorage` write happens before `router.push`, the audit page reads it on mount. No tab-inheritance edge cases.

**Why not the entity-aware `onOpenInNewTab` util?** Even if we wanted new-tab semantics, that util's `getEntityPath` is purpose-built for entity-prefixed routes — every registered route assumes an entity. There is no existing caller without an entity. Carving out a nil-safe path just for `ActivityAudit` would create an inconsistent contract; the alternative (a dummy `{ activityId: '' }`) lies about intent. The util has one job and isn't a fit here.

**Implementation order:**
1. `saveAuditListPreselect(AuditListPreselect.GlobalFirewall)` — write to `localStorage`.
2. `onClose()` — close the popup.
3. `router.push(ApplicationRoute.ActivityAudit)` — client-side navigate.

The audit page mounts, `ActivityAuditList` calls `readAuditListPreselect()` (pure read — no clearing yet), applies the filter once `gridApi` is ready, and only then calls `clearAuditListPreselect()`.

**Trade-off:** `localStorage` was originally chosen for cross-tab handoff. Now that navigation is same-tab, `sessionStorage` would also work and be marginally more correct (auto-clears on tab close). Keeping `localStorage` for now: it works, it's already in place, and the difference for this single-shot intra-tab handoff is academic. Switching would be churn.

### Decision 2: localStorage key + split read / apply / clear, single literal value

`saveAuditListPreselect('global-firewall')` writes the raw string `'global-firewall'` to `localStorage[KEY]` where `KEY = 'audit-list-preselect'`. The helper module exposes three functions:

- `saveAuditListPreselect(value)` — write (producer side, called from the popup).
- `readAuditListPreselect()` — pure read, no side effects, safe to call repeatedly.
- `clearAuditListPreselect()` — explicit clear (consumer-side, called after the filter is applied).

Why split read and clear rather than combine into `readAndClearAuditListPreselect`:

**StrictMode safety.** React 19 with Next.js dev mode runs every component through a mock mount/unmount/remount cycle. A combined "read-and-clear" called from a `useState` lazy initializer would fire twice on first arrival — the first call clears localStorage, the second call sees nothing and falls back to defaults. The user-visible second mount would then have no preselect.

The split contract avoids this: the lazy initializer calls `readAuditListPreselect()` (idempotent), so both StrictMode mounts read the same value. The discarded first mount unmounts before its gridApi-ready effect fires (ag-grid's onGridReady is asynchronous and never gets a chance to attach gridApi within the StrictMode mock window). The real second mount's effect attaches gridApi, applies the filter, and then calls `clearAuditListPreselect()` exactly once.

In production (no StrictMode), the flow is even simpler: one mount, one read, one effect, one apply, one clear.

**Other reasons for the literal-string single-value contract (over a richer payload):**

1. The audit list owns the *behavior* (which view, which filter). The caller just declares *intent* ("I want the firewall audit"). This keeps the audit list as a single source of truth for what each preselect means — future maintenance is one switch in one file, not a hunt across every caller's payload.
2. A literal-string contract is easier to grep, type, and version. Adding a future preselect is a one-line union extension.

**Alternative considered:** store a structured `{ view: ActivityAuditView, filter: { column, value, operator } }` payload as JSON, like the previous design discussion. Rejected as premature — there's no second caller, and a richer payload pushes filter-construction knowledge into the popup, which is the wrong layering.

**Path keying:** `audit-tab-return-state` keys per-entity-path (`audit-tab-return:<entityPath>`) because the same key could collide across entities. The audit list has exactly one URL (`/activity-audit`), so a single global key is enough. Keep the helper module separate (`audit-list-preselect.ts`) rather than extending `audit-tab-return.ts` — the two solve different problems, and conflating them would obscure their independent lifecycles.

### Decision 3: Apply preselect via `setFilterModel`, not direct injection into `getRows`

AG Grid's server-side infinite-row datasource re-invokes `getRows` whenever `setFilterModel` is called. The preselect could be applied two ways:

| Option | How |
|---|---|
| **A** | Inject the `resourceType` filter directly into the `filters` array inside `getRows` when preselect was true |
| **B** | Call `gridApi.setFilterModel(...)` from a `useEffect` after grid-ready, and let the existing pipeline handle the rest |

**Chosen: B.** It surfaces the filter as a visible, clearable chip in the column header (standard AG Grid UX). AG Grid also persists it to its existing per-view localStorage bucket (`gridColumnsState{activity-audit:deployments}`), so a refresh leaves the user with the filter they had — which is the consistent behavior every other column already has on this grid. Option A would make the filter invisible and unremovable, which violates the user's mental model.

**Trigger point:** the existing effect at `List.tsx:242-246` (`gridApi.setGridOption('datasource', gridDataSource)`) already runs after `gridApi` is ready. Add a sibling effect that fires once on mount when preselect was present, after the view has been set to Deployments (so the storageKey is already `activity-audit:deployments` when AG Grid persists). Use a `useRef` flag to ensure the effect fires exactly once — the preselect is consumed on first read by the helper's `removeItem`, but the React state derived from it persists for the lifetime of the component and we don't want the filter re-applied on every re-render.

### Decision 4: Resource Type filter — single-match expansion to `eq` at the request-serialization boundary

The filter bug exists because `filterValueGetter` is a client-only hook. Fixing it server-side requires translating the user's freetext input into raw enum value(s) whose formatted labels match. Three approaches were considered:

| Option | Where |
|---|---|
| **A** | Build a reverse map of formatted-label → enum values; expand `contains` input into a multi-value `in` filter |
| **B** | Same reverse-map, but only emit an `eq` filter when **exactly one** enum matches; pass through multi-match and no-match cases |
| **C** | A new column-level filter component (AG Grid custom filter) that exposes selectable formatted labels |

**Chosen: B.** The codebase's `FilterDto` schema has no `IN` operator (`FilterOperatorDto` in `src/types/request.ts` enumerates only `eq`/`ne`/`co`/`nc`/`lt`/`gt`/`le`/`ge`), `FilterDto.value` is a single scalar `string | number`, and no existing code sends multiple `FilterDto` entries for the same column — so multi-value filtering is not supported end-to-end without a backend and request-shape change. Rather than block the entire change on that work, single-match expansion is the smallest fix that **unbreaks the hero use case** (the user's example was "GLO" → "Global firewall" → one enum) while gracefully degrading multi-match queries to today's broken passthrough behavior.

**Algorithm (`src/components/ActivityAudit/List/utils.tsx`):**
1. Receive `gridFilter: Record<string, GridFilter>` and an optional `resourceTypeLabelMap: Record<string, ActivityAuditResourceType[]>` (lowercased localized label → matching enum values).
2. For each `[col, filter]` entry, if `col === 'resourceType'` and the AG Grid filter type is `contains`:
   - Lowercase the user's input.
   - Scan map keys for substring matches; collect the union of matched enum values.
   - If exactly one enum matched → emit `{ column: 'resourceType', operator: FilterOperatorDto.EQUALS, value: <enum> }`.
   - If zero or multiple matched → fall through to the original `co:<input>` payload (no-op transform).
3. All other columns and operators pass through unchanged.

**Operator semantics:** AG Grid's text filter exposes types `contains`, `equals`, `startsWith`, etc. We only transform `contains` (the default and the only operator the user is likely to use with localized labels). `equals` already works correctly against raw enum values; other operators are uncommon and pass through.

**Reverse map construction:** there is no enum-to-label table separate from `getFormattedResourceType(value, t)`. We iterate over `Object.values(ActivityAuditResourceType)` and build `Record<lowercased-formatted-label, ActivityAuditResourceType[]>`. Some labels (e.g. `Image`, `Model serving`) map to multiple enum values — by design these end up in the multi-match passthrough path. Use a `useMemo` keyed on `t` at the consumer (`List.tsx`) and pass the map into `getGridFilters` — keeps the utils file pure and locale-aware.

**Known limitation (multi-match):** queries that match multiple enum labels (e.g. typing "container" matches the 4 container deployment enums) fall through to the broken passthrough — the backend runs `LIKE '%container%'` against the raw enum string (e.g. `adapterdeployment`), which contains no substring "container", so the user sees **zero rows**. This is the same UX as the original bug for multi-match inputs. The passthrough is honest about *what was sent* but offers no value to the user.

**Why multi-match isn't fixable on the frontend alone (verified against `ai-dial-admin-backend` + `ai-dial-admin-mcp-manager-backend`):**

- Backend `FilterOperatorDto` is `eq, ne, le, lt, ge, gt, co, nc, isnull, isnotnull` — no `in` or disjunction.
- `FilterDto.value` is a single `String` — no array support.
- The raw column stores the enum string (`@Enumerated(EnumType.STRING)` on `AuditActivityEntity.resourceType`), so substring/equality both work against the raw enum vocabulary, not the localized label vocabulary.
- Multiple `FilterDto` entries on the same column are combined via `Specification.allOf(filters)` — AND, not OR. Sending two `eq` filters narrows to the intersection (impossible) → zero rows.
- `co + nc` combinations (`co:Deployment AND nc:NimDeployment AND nc:InferenceDeployment`) can express the "container" subset but require hand-authored per-label discriminator + exclusion sets — brittle and not generalizable.

**Fix path (out of scope here):** add `in` to `FilterOperatorDto` and `PageEntityMapper.mapFilter` in both backends (~10-line change each), then on the FE emit `{operator:'in', value:<comma-separated enums>}` for the multi-match branch. A set/dropdown column filter UI on the FE is an alternative but still depends on `in` for "user selects 2+ types" to work.

### Decision 5: Filter chip readability after preselect

Setting `filterModel: { resourceType: { type: 'equals', filter: 'ImageBuildDomainWhitelist' } }` shows the raw enum value in the column's filter input box, which reads ugly. Options:

| Option | Effect |
|---|---|
| **A** | Use `type: 'equals'` with raw enum — works correctly, shows raw enum in chip |
| **B** | Use `type: 'contains'` with the localized label substring (e.g., "Global firewall") — chip reads naturally, and Decision 4's reverse-map makes the server-side match work because "Global firewall" is a 1:1 label |

**Chosen: B.** Now that the freetext filter understands localized labels (Decision 4) for single-match cases, the preselect can use the same vocabulary the user would. The chip reads "Global firewall", the user can edit it like any text filter, and the server-side transform expands it to `eq:ImageBuildDomainWhitelist` because exactly one enum matches. This relies on `IMAGE_BUILD_DOMAIN_WHITELIST` remaining the only enum whose formatted label is "Global firewall" — if a future enum gets the same label the preselect would land in the multi-match passthrough path; that's a known and acceptable consequence of Decision 4's scope.

**Implementation note:** the substring to use is the exact output of `getFormattedResourceType(ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST, t)` — read at component scope, used both for the `setFilterModel` call and as a sanity-check default. This avoids hardcoding the localized string.

## Risks / Trade-offs

- **Risk:** the Resource type filter transform also affects the Config view. → **Mitigation:** the transform is additive (no labels match → pass-through), and the Config view already uses the same formatted labels for display, so the new freetext behavior matches the user's existing mental model. The only observable change is filters that previously returned zero rows now return the intended rows. No regression vector.

- **Risk:** the preselect `useEffect` could fire after a user has manually changed the view back to Config, overwriting their choice. → **Mitigation:** consume the preselect during `useState` lazy initializer (one render only), use a `useRef` flag to ensure the `setFilterModel` effect runs exactly once. The user can clear the filter normally after that.

- **Risk:** AG Grid's localStorage persistence (`gridColumnsState{activity-audit:deployments}`) means the filter survives across refresh. A user who arrives via the shortcut, refreshes, and forgets the filter is set will see a partial view. → **Mitigation:** this is consistent with every other column filter on this grid — not a new problem and explicitly out of scope per Non-Goals. The filter chip is visible and clearable in the column header.

- **Risk:** opening `/activity-audit` from another path (without preselect) right after a Global Firewall popup nav, when localStorage already has the key, would consume it. → **Mitigation:** the helper is one-shot read-and-clear; if the user takes a different route to `/activity-audit` they'll consume their own pending preselect, which is what they asked for by clicking the link. No two preselects can coexist.

- **Risk:** new `footer` slot in `GlobalWhitelist` could regress the popup's current visual layout, especially around the loading state. → **Mitigation:** the kit's loading-state body still renders independently of footer (`b()` and `w` are separate in the kit source). The rebuilt buttons honor `isLoading` to hide themselves while loading, matching the default. Component tests cover the rendered footer in both states.

- **Trade-off:** `filterValueGetter` on the Resource type column becomes dead code. We remove it; the column's `valueFormatter` continues to drive display. Marginal cleanup, no behavior change.

- **Trade-off:** reverse-map is rebuilt per `t` change (i18n switch). Negligible — the enum has under 30 values and the map is `useMemo`'d.
