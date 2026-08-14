## Context

See `proposal.md` — Why. Requirements are in `specs/analytics/spec.md`.

Three pieces of existing state shape every decision below.

**The backend is shipped and frozen.** `/v1/saved-queries` on the analytics data-access service, specified
at `../analytics-data-access-service/openspec/specs/saved-queries/spec.md`. The client's job is to adapt.
Four of its properties are load-bearing here: a create must carry a body the service can translate, the
write payload is exactly nine members and rejects anything else with `422`, the list is unpaged and
single-scope, and `generation` is returned but not accepted back so there is no precondition round-trip.

**`QueryBuilder.tsx` is a 601-line orchestrator holding ~17 pieces of state**, and
`QueryBuilderContext` exposes only `{ state, refresh, patch }`. Save/discard has no existing home in it.
Its state type, `QueryBuilderState`, embeds catalog data (`fields`, `functions`) and rows carrying ids
generated from a module counter (`nextId()` in `utils/state.ts`). It is not a persistable shape and not a
comparable one.

**The round trip already exists** and is the pivot the whole change turns on:
`buildQuery(state, timeBound)` in `utils/serialize.ts` and
`parseQuery(query, fields, functions)` in `utils/deserialize.ts`, with `isBuilderRepresentable(query)`
deciding whether a structured body the visual builder can display.

**Analytics does not currently follow the repo's entity pattern.** `tables` and `conversations-trace`
hand-roll `GridView` inline and edit through popups with immediate writes and no dirty state. The
Save/Discard machinery (`SimpleEntityHeader`, `structuredClone` + `isEqualSkippingUndefined`,
`discardKey`) lives in the config and evaluation families. This change brings Analytics toward that
pattern but cannot adopt it wholesale — see D4 and D10.

## Goals / Non-Goals

**Goals:**

- One authoritative capture/restore mapping, unit-testable in isolation, with no React in it.
- Unsaved-change detection that cannot disagree with what is actually persisted.
- `/queries/[id]` layout byte-identical to today's builder page apart from the heading and three toolbar
  actions, so the change is reviewable as an addition rather than a rewrite.
- Reuse of the repo's existing grid, modal, confirmation, notification, and validation infrastructure —
  no new shared abstraction is introduced by this change.

**Non-Goals** (beyond `proposal.md` — Non-goals):

- Extracting a reusable `useDirtyState` hook. The repo deliberately hand-writes dirty tracking per view;
  extracting one here would be a novel shape imposed by a single caller.
- Refactoring `QueryBuilder.tsx` into smaller components. It needs it, but bundling that with a
  behavioral change makes both unreviewable.
- Adding a route-leave guard. The app has none anywhere (no `beforeunload`, no navigation interception);
  introducing one for this entity alone would be inconsistent.

## Decisions

### D1 — Saved-query methods go on `AnalyticsDataApi`, not a second client

Same service, same host, same auth, same error envelope. The spec's existing requirement already frames
`AnalyticsDataApi` as *"a single typed client … for the Analytics data-access service"*, and it already
spans two path families (`/v1/queries`, `/v1/tables`); `/v1/saved-queries` is a third.

*Alternative rejected:* a separate `SavedQueriesApi` registered as its own singleton. Cleaner file size
(the existing class reaches ~23 methods), but it contradicts the single-client requirement, adds a
registration point, and splits one service's surface across two files for no behavioral gain.

**Read/write split:** the two reads use `BaseApi.get` (returning `T | null`, error detail discarded);
create, replace, and delete use `postAction` / `putAction` / `deleteAction`, because their failures are
load-bearing — the caller branches on the machine code (D12). No `If-Match` on the replace: the service
accepts no precondition.

### D2 — Capture and restore are two pure functions, not inline logic

`utils/saved-query.ts` exports `toSavedQueryRequest(input): SavedQueryRequest` and
`toBuilderRestore(input): SavedQueryRestore`. Neither touches React.

This is the highest-risk logic in the change and it has two silent failure modes: a persisted body that
carries a frozen time range (D5), and a restore that re-seeds over stored SQL. Both produce a plausible,
non-crashing result, so neither surfaces without a test that asserts absence. As pure functions they are
cheap to test exhaustively and impossible to test if inlined into a 601-line component.

Per `.claude/rules/utils.md` these are deterministic and side-effect free; the async part (resolving the
target entity's fields) stays in the calling component.

*Alternative rejected:* mapping inline in the page or the builder. Untestable at the granularity the risk
demands.

### D3 — The request type is declared independently of the response type

`SavedQueryRequest` is its own interface, not `Pick<SavedQuery, …>` or `Omit<SavedQuery, …>`. The service
rejects a server-assigned member rather than ignoring it, so a type derived from the response is one
field-addition away from producing `422`s: a new member on `SavedQuery` silently joins the payload.
Declaring the nine accepted members explicitly means a backend addition is a compile-time decision.

Response optionals are declared optional, not nullable — the service omits absent members rather than
emitting `null`, so nothing in the client compares against `null`.

### D4 — Dirty state compares the serialized payload, not the entity

The repo idiom is `structuredClone(original)` plus `isEqualSkippingUndefined(original, selected)`
(`utils/is-equals-entity.ts`), as in `components/Datasets/View/View.tsx`. **It cannot be used here.**
`QueryBuilderState` embeds `fields` and `functions` and carries `qb-N` ids from a module counter, so two
states representing the same query are never deep-equal.

Instead:

```ts
const baseline = useMemo(() => JSON.stringify(toSavedQueryRequest(fromStored(savedQuery))), [savedQuery]);
const isChanged = JSON.stringify(toSavedQueryRequest(liveCapture)) !== baseline;
```

The comparison operand *is* the thing sent, so it cannot drift out of sync with what gets persisted, and
it covers every payload member — body, time intent, result view, chart config — without a per-field diff
to maintain.

Two consequences worth stating because they look like bugs otherwise. First, key order matters to
`JSON.stringify`, so `toSavedQueryRequest` must build its object literal in one fixed order — which it
does, being a single function with one return. Second, the baseline must be derived from the *stored*
query rather than from live state captured at mount; deriving it from a closure that has not re-rendered
after a restore yields a baseline that is already stale, and the page then opens dirty.

*Alternative rejected:* a `hasUnsavedChanges` boolean flipped by each mutating handler. There are dozens
of mutation sites across the builder sections; a missed one fails silently in the worst direction — the
user believes their edit is saved.

### D5 — The save path serializes with no time bound

`buildQuery(state, timeBound)` folds the toolbar range into `filter` as `ge`/`le` predicates on the
detected timestamp field. That is correct for Run, the JSON view, and Copy — the spec requires it — and
wrong for a persisted body, because it freezes the query to its authoring date. The save path calls
`buildQuery(state, null)` and the range travels as `time` intent: a preset as its relative token, a custom
range as an absolute pair, ordered if inverted.

The service validates the *shape* of `time` but cannot detect the mistake, because a body with a frozen
range is a perfectly valid query. Nothing else catches it either — it reproduces only by reopening the
query on a later day. Hence the explicit absence assertion in the test list (`tasks.md`).

### D6 — Result view and chart config become controlled, with a one-shot keep flag

`ResultArea` currently owns `view` and `chartConfig` and resets `chartConfig` on every new `result`. Both
are members of the write payload, so they must be visible to the capture. They lift to the orchestrator
and `ResultArea` takes `view` / `onChangeView` / `chartConfig` / `onChangeChartConfig`.

The reset-on-new-result effect stays, guarded by a one-shot ref: a restored chart configuration must
survive the page's *first* run, or opening a saved chart and pressing Run silently discards its axes.
After that first run the ordinary reset resumes, because a different result usually means different
columns.

*Alternative rejected:* reaching into `ResultArea` through a ref or a callback registration to read its
state at save time. It inverts the data flow to avoid a four-prop change.

### D7 — The list page composes `ListView` directly

Neither shared wrapper fits. `EvaluationListView`'s contract is
`getData(page, size, sorts, filters)` against an infinite row model, and the service offers none of
those. `BaseEntityList` carries config-entity behavior this entity does not have — duplicate and move
modals, `ENTITIES_COLUMNS` appending its own action set, name-as-identity assumptions.

`ListView` (`components/ListView/ListView.tsx`) takes `data`, `columnDefs`, `storageKey`, `getHref`, and a
header `children` slot, and wraps `GridView` → `AgGridWrapper` with the empty state, the columns panel,
and localStorage column persistence already handled. That is every piece of the shared grid stack this
entity needs, and per §5 and §11 of the component rules the grid stays ag-grid rather than a hand-built
list.

**Both scopes are fetched and merged** in the server component, so one grid shows everything visible with
`scope` as a filterable column. The service lists one scope per call and `common` is readable by any
application role, so both calls succeed for an ordinary caller. The alternative — a scope tab or
segmented control — mirrors the backend more literally but splits one entity into two lists and puts the
grid's own filtering out of a job.

Row click, new-tab handling, and the actions column reuse `onCellClicked`, `getUrnForEntity`,
`ACTION_COLUMN`, and the `getOpenInNewTabOperation` / `getEditOperation` / `getDeleteOperation`
factories unchanged. Delete goes through the shared `DeleteConfirmationModal`, which requires entries in
`deleteEntityMap` and a `getEntityPath` arm — without them the modal's title is blank and the delete key
is wrong.

### D8 — Which editor a query opens in is derived, never stored

`sql` set means SQL; otherwise `isBuilderRepresentable(query)` decides Builder versus JSON. A stored
`editor` field would be a second source of truth able to contradict the body it describes — and the
service does not offer one, deliberately. The same derivation feeds the grid's Editor column and the
`[id]` page's initial view, so the two cannot disagree.

### D9 — Create sends a minimal executable body against a defaulted source

The service refuses a body it cannot translate, so there is no metadata-only create. The modal collects
name, description, and tag; the create sends `buildQuery(initialStateFor(defaultSource), null)` — row
mode, no projection — plus `result_view: table`, and omits `scope`, which the service resolves to
personal (`SavedQueryService.scopeOf`).

The trade-off is explicit and accepted: a user whose intended source is not the first entity sees the
wrong `Source` in the grid until they change it on the detail page, which is typically their first edit
anyway. Showing a pre-filled source dropdown was considered and declined in favour of the shorter modal.

### D10 — Save / Discard / Edit go in the toolbar's existing actions slot

`QueryBuilderToolbar` already accepts `children`, rendered right-aligned before Run (today: `CopyButton`).
The three new controls go there, so the page layout does not change — which is the requirement.

`SimpleEntityHeader` is **not** used. It brings a `ReadonlyId` row, a tab strip, a JSON-editor toggle, and
a Delete button, and stacking it above a toolbar that already carries the source selector and time filter
would give the page two header bands and two JSON affordances (the rail already has a JSON view). What is
reused is the layer below it: `ChangedEntityButtons` for the Discard/Save pair, which brings the standard
`DiscardModal` confirmation, and `useSaveValidationContext` for the modals' field validation.

**Two discards coexist and must stay behaviourally distinct.** `Modals/DiscardQueryPopup.tsx` guards
switching out of a written view and resets the builder to `createInitialState`; the new one reverts to the
stored query. Separate components and separate call sites — conflating them would make "discard" mean
"delete what I am looking at" in one of the two paths.

They do, however, **share the generic confirmation copy**: the new discard reuses `ChangedEntityButtons`,
whose `DiscardModal` takes no copy props, and "Discard changes?" describes reverting to the last saved
version accurately. Custom wording would have meant hand-rolling the confirmation and losing that reuse,
which is the wrong trade for a difference the user does not need explained.

The `<h1>` in `QueryBuilder.tsx` currently renders `t(MenuI18nKey.QueryBuilder)`; it takes a required
`name` prop instead.

### D11 — One Properties component serves the create modal, the edit modal, and nothing else

`components/Analytics/Queries/Properties/QueryProperties.tsx` holds name, description, tag, and — when
`useAppContext().isFullAdmin` — scope. Both modals render it inside `DialFormPopup`, following
`components/Datasets/Modals/Create/CreateDataset.tsx`. This is the repo's rule (§4: domain logic in the
feature component) and it is why the two modals cannot drift apart.

Name validation reuses `DisplayNameControl` and `SaveValidationContext` rather than the inline
`canSubmit` boolean `CreateTablePopup` uses — that is the Analytics-local deviation this change is
moving away from. The service does not constrain the name beyond non-blank-after-trim (it is plain
`TEXT`, explicitly unbounded), so the client applies only the standard required-field rule.

### D12 — Failures branch on the machine error code, not the status

`utils/saved-query-error.ts` reads the machine code off `ServerActionResponse.errorHeader`, mapping it to
a guidance key and a decision about whether to show the service's own message. Body refusals (validation,
a rejected literal, a bad request) show it — it names the offending part of the query. Identity and
visibility refusals do not.

The resolver must guard against `BaseApi.getError()` having substituted a generic string for a missing
header, and must fall back to the status only for the two cases where the status is itself the signal.
`404` is treated as gone: notify, clear, return to the list — the service reports an invisible row as
absent rather than forbidden, and the client must not narrow that.

### D13 — Retiring `/query-builder` is a move, not a delete

`app/[lang]/query-builder/actions.ts` holds the seven existing query actions and is imported by
`QueryBuilder.tsx`, `Ai/AiPanel.tsx`, and two specs' `vi.mock` calls. It relocates to
`app/[lang]/queries/actions.ts` alongside the five new ones; all four importers are repointed. The route
folder keeps a redirect-only `page.tsx` so existing links and bookmarks resolve to `/queries`.

The relocation and the redirect are mechanical but wide, which is why they land in their own step
(`tasks.md`) rather than riding along with the new grid.

### D14 — The unmerged saved-queries branch is not reused

`origin/feat/add-saved-queries-to-query-builder` implements the same capability as two dialogs and had
already solved D2, D3, D4, D5, D6, and D12. Its UI half is incompatible with this change — its own design
rejected a grid and made deep links a non-goal — and the decision taken is to start from `development`
rather than salvage the non-UI half.

Recorded here because it is a deliberate cost: the round-trip mapping and its edge cases are rewritten.
The edge cases that branch's tests covered are enumerated as required cases in `tasks.md` so the rewrite
does not lose them by omission.

### D15 — Permission gating mirrors the service's rule, and gates rather than fails

`common` writes require `FULL_ADMIN`. Save, Edit, and Delete on a common query are unavailable to a
non-administrator rather than offered and allowed to `403`. Source of truth is
`useAppContext().isFullAdmin`, which already collapses the auth-disabled case into full admin — so no new
role plumbing. The scope field is likewise administrator-only, which means promoting a personal query to
common is create-then-edit; acceptable for this revision.

### D16 — Accessibility specifics

Per `.claude/rules/a11y.md`: the Editor and Scope grid columns carry real `headerName`s; the actions
column's control carries an `aria-label`, not just a header. Icons inside already-labeled controls are
`aria-hidden`. The unsaved-changes indication is not colour-only — Save and Discard appearing is itself
the programmatic signal, and the save result is announced through the existing notification container
rather than a second live region. Save's disabled state when nothing changed is a real `disabled`
attribute, so it is announced. Long names in the grid truncate through `DialEllipsisTooltip`, never
`break-all`.

### D17 — The assistant is told the selected source and its columns, as a system message

`AiPanel` sent only the conversation, so the assistant had no idea which entity was selected or what
columns existed and invented both. `utils/ai-context.ts` builds a system message naming the selected
source and listing each field's name, type, and the display name/description the schema defines.

Three properties of how it is attached matter:

- **Built per request, not stored in the transcript.** `messages` stays the visible conversation; the
  schema message is prepended only in the call. So it never renders as a turn, and switching source
  mid-conversation means the *next* request carries the new schema rather than a stale one.
- **Schema only — names, types, and labels.** No row data. Column names are catalog facts the analytics
  service treats as visible; values read out of the store are exactly what it refuses to let cross into
  metadata, and the same line is held here.
- **The source is a preference, not a constraint.** The wording is "prefer it unless the request clearly
  names another source", because running a generated query still re-hydrates the builder onto whatever
  entity that query targets. Forbidding a switch would have removed working behavior.

Sensitive columns are marked, so the assistant can avoid proposing a literal comparison the service
would refuse to store — a query that runs but can never be saved.

*Alternative rejected:* appending the schema to the user's own message. It would show up in the
transcript as words the user did not type, and it would be re-sent verbatim inside every later turn.

*Alternative rejected:* sending every entity's schema so the model picks the source itself. A much
larger prompt, and it makes the toolbar's source selection advisory rather than meaningful.

### D18 — `SqlEditor` reads the source from context rather than props

Every other builder section already reads `entityName`, `fields`, and `functions` from
`QueryBuilderContext`; `SqlEditor` alone took all three as props, duplicating what context held. It now
reads them from context, which leaves one source of truth for which entity is in play — the point of
the context in the first place. Its Monaco completion provider still reads through a ref, because the
provider is registered once per editor and would otherwise close over the first schema it saw.

## Risks / Trade-offs

**A persisted body silently carries a frozen time range (D5)** → the single highest-consequence failure
here: it reproduces only on a later day and looks correct until then. Mitigated by an explicit
absence assertion in the mapping spec, and by keeping the save path a distinct call site from Run rather
than a shared helper with a flag.

**The baseline is captured from stale state and the page opens dirty (D4)** → mitigated by deriving the
baseline from the stored query in a `useMemo` keyed on it, never from live state after a restore, and by a
test asserting a freshly loaded query reports no unsaved changes.

**Last-write-wins loses a concurrent edit** → accepted by contract; the service takes no precondition.
`generation` is available for display. A conflict UI would be inventing a protocol the backend does not
have.

**Two full-list fetches on `/queries`** → the list is unpaged and bounded only by row count multiplied by
the per-row body cap, so a large deployment makes this page heavy. Accepted for this revision; the
backend spec is explicit that bounding, when needed, will come as paging rather than field projection, at
which point this page moves to the infinite row model.

**Removing the unsaved builder removes the only escape hatch for an unsavable query** → a query the
service refuses (a literal bound to a `sensitive` column, say) can no longer be run at all. Stated as a
consequence in `proposal.md` — Non-goals, and surfaced to the user through D12's guidance rather than
left as a dead end.

**`QueryBuilder.tsx` grows further** → it gains save/discard wiring on top of 601 lines and ~17 state
values. Contained by keeping the mapping pure (D2) and the CRUD in the page, but the component is now
overdue for extraction. Flagged, not fixed here.

**The schema message grows the prompt with the column count** → a wide entity sends a long system
message on every turn. Bounded by the entity's own column count, and cheaper than the alternative of
the model guessing and the user re-prompting. If it becomes a problem the fix is to summarise the
schema, not to drop it.

**The retirement touches shared registration maps and menu tests** → a missed entry fails quietly
(blank delete title, absent breadcrumbs). Mitigated by enumerating every registration point in
`tasks.md` rather than leaving it to discovery.

## Migration Plan

No data migration; the backend is already deployed and its tables exist. No new environment variables —
the feature rides `ANALYTICS_ENABLED` and the existing `isAnalyticsForbidden()` page guard, so a
deployment with Analytics disabled is unaffected.

Shipped as four sequential PRs (see `tasks.md`), each independently mergeable and each leaving the app
working: persistence layer with no UI, then the pure mapping with no UI, then `/queries` while
`/query-builder` still exists, then `/queries/[id]` and the retirement. Only the last step is
user-visible as a removal.

**Rollback:** reverting the last PR restores `/query-builder` and its menu entry; saved queries created in
the meantime remain in the metadata database, unreferenced but intact, and become visible again when the
change is re-applied. Nothing is destroyed by a rollback.
