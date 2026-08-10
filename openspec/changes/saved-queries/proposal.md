## Why

A Query Builder state that took real effort to author — the right source, a filter tree, a sort, a
limit, a chart — survives exactly as long as the tab does. There is no way to name it, come back to it
next Monday, or hand it to a colleague, so the same query gets rebuilt from memory every time and the
definitions a team standardises on live in Confluence pages and Slack messages rather than in the tool.

The Analytics data-access service (ADAS) has shipped a `saved-queries` capability that fixes the storage
half of this: a named, tagged, scoped object holding authored intent, validated on write so it is always
executable exactly as stored. Nothing in the admin frontend consumes it. This change builds that client.

## What Changes

- **A saved-queries client layer.** `SavedQueriesApi` under `src/server/analytics/` covering the five
  shipped endpoints (`GET` list, `POST`, `GET` one, `PUT`, `DELETE` under `/v1/saved-queries`), reached
  through server actions in `app/[lang]/query-builder/actions.ts` following the existing token-injection
  pattern. Domain types in `src/models/analytics/saved-query.ts`.
- **Bidirectional payload mapping**, as pure utils with unit tests: builder state + toolbar time filter +
  result view/chart → a nine-field request body, and a stored saved query → builder state + toolbar +
  result view/chart. Two invariants carry the weight — the `query` is built **without** the toolbar time
  bound (`buildQuery(state, null)`), which travels separately as `time` intent; and catalog data
  (`fields`, `functions`) and the editor mode are never persisted, only re-derived on load.
- **A library dialog** (~800×540 modal, list left / preview right) with My queries / Common tabs, search,
  tag grouping, a derived editor chip (SQL / Builder / JSON), preview-then-open as two separate acts, and
  a footer that becomes the discard confirmation when there are unsaved changes rather than stacking a
  second popup on the existing `DiscardQueryPopup`.
- **A save dialog** with name, description, single-select tag, a scope selector gated by `isFullAdmin`,
  a captured-state summary, a save-the-time-period checkbox, and — only when the Chart view is open — an
  open-as-a-chart block carrying the current `ChartConfig`.
- **Toolbar and identity surfaces**: a `Saved queries` button with a count badge and a `Save` button
  beside the existing Copy and Run, a `⋯` menu for Save as new / Rename / Delete, `Ctrl/⌘ S` to save, a
  loaded-query chip beside the page heading, and an unsaved-changes bar (Revert / Save as new / Save)
  that appears only once a *loaded* query diverges.
- **Distinct handling for each documented failure**: `400 bad_request`, `422 sensitive_literal_not_allowed`,
  `422 validation_error`, `403 forbidden`, `404 not_found`, and `500 principal_unavailable` each get their
  own message and their own next step, branched on the ADAS `ErrorView` machine code.
- **Result view and chart config move up.** `ResultArea` currently owns `view` and `chartConfig` in local
  state; they become controlled from `QueryBuilder`, which is the only component that can capture them
  into a save and push them back on a load.
- **A single unavailable-field state.** A loaded query naming a column the caller cannot resolve loads
  anyway, marks the casualties in place with one wording — *"`x` isn't a field in `<source>`"* — and
  disables Run until they are gone. Identical whether the column was dropped or is restricted; a fork in
  the wording would leak which columns exist.

## Capabilities

### New Capabilities

None as a separate spec folder. Analytics requirements are consolidated into the single master spec
`openspec/specs/analytics/spec.md` by project convention, so the saved-query behaviour is added there as
new requirements rather than a `specs/saved-queries/` capability of its own.

### Modified Capabilities

- `analytics`: gains the saved-query requirements — the library and save dialogs, the toolbar and identity
  surfaces, the dirty-state model, the state ⇄ payload mapping (including time intent and chart
  round-trip), the scope and permission rules read off `isFullAdmin`, the per-code failure states, and the
  unavailable-field state on load. Three existing requirements also change shape.
  - *Query Builder toolbar* — composition grows Saved queries, Save, and the `⋯` overflow beside Copy and
    Run, and the page heading grows a loaded-query chip and an unsaved-changes bar.
  - *Result table and chart views* — the Table ⇄ Chart selection and the `ChartConfig` become controlled
    by the Query Builder rather than owned by the results area, so both can be captured and restored. The
    reset-on-new-result behaviour is preserved except where a load has just supplied a config.
  - *Time range is part of the structured query* — unchanged for running and copying, but gains the
    saved-query carve-out: the body persisted for a saved query is built without the time bound, and a
    relative period is stored as intent and never resolved into instants.

## Impact

- **New code**: `src/server/analytics/saved-queries-api.ts`; `src/models/analytics/saved-query.ts`;
  `src/components/Analytics/QueryBuilder/SavedQueries/**` (library dialog, save dialog, toolbar controls,
  identity chip, unsaved-changes bar); mapping utils under
  `src/components/Analytics/QueryBuilder/utils/`; i18n keys on `QueryBuilderI18nKey` and `src/locales/en.ts`.
- **Modified code**: `QueryBuilder.tsx` (the orchestrator — loaded-query identity, dirty tracking,
  save/load wiring, lifted result view state), `ResultArea.tsx` (controlled props), `QueryBuilderToolbar.tsx`
  (new actions), `app/[lang]/query-builder/actions.ts` (five new server actions).
- **Backend**: none. ADAS `/v1/saved-queries` is shipped and treated as frozen; this change adapts to it.
- **Auth**: no new role plumbing. `isFullAdmin` on `AppContext` already exists and already treats
  auth-off as full admin; scope gating reads it directly.
- **Existing behaviour**: unchanged for anyone who never opens the library. The lifted result-view state
  is a refactor with no user-visible change on its own.

## Non-goals

- **Parameters, in any form** — not in the payload, not in the UI, not as a fallback for a save blocked by
  `sensitive_literal_not_allowed`. A `params` field is a `422`, and so is a parameter expression inside
  `query`. A query that must name one person is run ad hoc, not saved.
- **Concurrency control.** `generation` is returned and bumped on every write but the API will not accept
  it back, so two admins editing one `common` query is silent last-write-wins. Accepted for this
  revision, deliberately: no pre-write re-read, no conflict prompt. Revisit with `If-Match` if it bites.
- **Deep links.** No `?savedQuery=sq_…` param — neither written on open nor honoured on load, and no
  "Copy link" in the `⋯` menu. Saved queries are reachable only through the library dialog. Additive
  later without disturbing anything built here.
- **Client-side re-sorting, paging, or filtering of the list** beyond the tag-grouping and search UI. The
  server returns full objects, most recently updated first; that order is the order shown.
- **A fetch-on-select flow.** The list response is byte-for-byte what the single `GET` returns, bodies
  included — so no per-id cache, no second request on selection, and no loading state in the preview.
- **Deferred to later work**: role-scoped sharing between personal and common, promote-from-personal, run
  history, a last-run stamp, pin-to-dashboard, scheduling, and a lint on free-text names and descriptions.
