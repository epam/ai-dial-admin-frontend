## Context

See `proposal.md` — Why. The constraints that actually shape the approach:

- **`GET /v1/evaluators` is a name index, not a definition index.** It answers
  `{name, latest_version, created_at}` and nothing else. Every fact worth showing lives in a version
  response, which the listing never carries.
- **A version response does not know the latest version.** `EvaluatorVersionDto.version` is *its own*
  number. `GET /v1/evaluators/{name}/versions/2` cannot tell you whether 2 is the newest.
- **The two `created_at` fields are different facts with the same name.** The summary's dates the name's
  first registration; the version's dates that version. On dev, `conversation-insights` reads 2026-08-17
  in the listing and 2026-08-19 on v4.
- **The member set is type-conditional and enforced imperatively.** `EvaluatorService.requireValidShape`
  rejects a `sql` evaluator that carries `preset`, `model`, `params`, `request_template`, `input_vars`, or
  `response_schema`. Bean validation would not have caught it, and the DTO is `@JsonInclude(NON_NULL)`, so
  a `sql` version simply has no such keys on the wire.
- **Every read is open; only `POST` is `@FullAdminOnly`.** This surface issues no `POST`.
- **The app has no `useSearchParams` call anywhere.** Search-param state is read on the server, in the
  page.
- **Analytics has no shared entity-detail shell.** Tables is bespoke, Queries has no detail page, and the
  rule detail page just shipped as its own composition. This page is the fourth bespoke one, not a
  candidate for the `EntityViewTab` shell.

The requirements themselves are in `specs/analytics/spec.md`; this document covers how, and why not
otherwise.

## Goals / Non-Goals

**Goals**

- Two server-rendered pages that read only, with each of the three server reads on the detail page failing
  independently and visibly.
- Reuse the version-switcher, read-only-code, and grid pieces that already exist rather than growing new
  ones, and leave those pieces where the placement rules say they belong.
- Keep the shape a reviewer expects from the sibling `EnrichmentRules` folder: page fetches, client view
  owns interaction, one component per file, i18n keys in a feature enum.

**Non-Goals (design level, beyond the proposal's scope)**

- No client-side data layer, cache, or resolution hook. `use-rule-resolution` exists because the create
  modal resolves entities as the operator types; nothing on these pages is typed.
- No shared "read-only entity page" abstraction extracted from this and the rule detail page. Two
  instances is not the rule of three.
- No range validation of `?version` against `latest_version` before the read. See Decision 3.

## Decisions

### 1. Both pages read the rules listing on the server; the join is a pure function

`used by` and the detail page's referencing-rules panel are the same join from opposite ends. Both pages
already fetch on the server (spec: "Analytics pages fetch initial data server-side"), so both fetch the
rules listing there and hand the client view a derived value.

- Listing page → a row per evaluator carrying `usedBy: number | null`, where `null` means the rules
  listing failed. The count map itself never crosses the boundary.
- Detail page → the `EnrichmentRuleListItem[]` filtered to this evaluator's name, plus a failure flag.

Both are built by pure helpers under `src/utils/analytics/` (`utils.md`: pure, placed, testable), not
inside the view. The intermediate count is a `Map<string, number>`, not a `Record`: an evaluator name is
only `@NotBlank` on the service, so `constructor`, `toString`, and `__proto__` are all registerable, and a
plain-object accumulator resolves each of them against `Object.prototype` — counting a function, or (for
`__proto__`) silently discarding the entry through the setter. A `Map` is correct for every key, and
keeping it server-side means nothing but arrays, numbers, and nulls crosses the RSC boundary.

`usedBy` is a **required** member whose value may be `null`, not an optional `usedBy?: number`. The
optional form was rejected because an absent optional reads as zero at every call site that forgets to
check, and rendering `0` for "could not find out" is the one wrong answer the spec forbids.

The join keys on the rule's declared `evaluator_name`, not the resolved `evaluator.name`. They hold the
same value today, but the declared one is the reference the operator wrote, which is what "used by" means.

Rejected: a client-side effect. The rules listing is not user-triggered, and fetching it in the browser
would put an empty `used by` column on screen first and fill it in after — the exact ambiguity between
"unused" and "not yet known" that Decision 1 exists to prevent.

### 2. The version is a search param, and the switcher navigates

`/evaluators/{name}?version=N`. A version is a lens on one entity, not a second entity: the breadcrumb
trail stays *Evaluators → {name}*, and the page composition is identical whichever version is addressed.

Selecting a version calls `router.push` with the new URL, which re-runs the server component — the same
navigate-on-change behaviour `ImagesButtonsWrapper` uses for image versions, and the reason this app needs
no `useSearchParams`. The alternative, refetching in place through a server action, would leave the URL
naming a version other than the one on screen, which breaks the shareable link the spec requires.

Rejected: a nested `/evaluators/{name}/versions/{n}` segment. It needs a second breadcrumb entry, a second
page file that renders the same view, and it makes "the latest" a different URL shape from "version 4",
which are the same page.

### 3. `?version` is parsed permissively and range-checked by the service

A `version` that is not a positive integer is ignored and the latest is read. A well-formed one is passed
to `GET /v1/evaluators/{name}/versions/{version}`; if it does not exist the service answers nothing and the
page resolves `notFound()`.

The alternative — read the listing first, compare against `latest_version`, then decide — inverts the fetch
order so that a listing failure could 404 a version the service would have served. Letting the service be
the authority on which versions exist keeps a real page reachable whenever the version read succeeds.

### 4. The detail page issues three reads in three separate `try` blocks

Following `enrichment-rules/[id]/page.tsx`, which does the same thing for the same reason: the three
failures mean different things and must not collapse into one handler.

| Read | On failure |
| --- | --- |
| the addressed version | `notFound()` — there is no page without it |
| the evaluators listing | switcher degrades to the one version; the name's registration timestamp reads unavailable |
| the rules listing | the referencing-rules panel states it could not load |

They are awaited in sequence rather than through `Promise.allSettled`, matching the sibling page. Three
sequential server-side calls to one service is the cost; if it ever shows, `allSettled` is a local change
that does not touch the failure semantics above.

### 5. `CodeViewer`, not `JsonEditorBase`, for the template and the schema

`src/components/Common/CodeViewer/CodeViewer.tsx` already is every clause of the requirement: read-only
Monaco, `wordWrap: 'on'`, height capped at `Math.min(lineCount * 19 + 24, 400)` with its own scroll, a copy
button, a fullscreen viewer, and `JSON.stringify(JSON.parse(content))` with a **verbatim fallback** when the
content is not JSON — which is exactly what an unparseable `request_template` needs.

`JsonEditorBase` is an *editable* editor. Using it would mean supplying a `readOnly` options object, an
outer height container, a copy affordance, and pretty-print-with-fallback — reimplementing `CodeViewer` in
the feature folder.

Two small changes to `CodeViewer`, both additive:

- An opt-in `isInitiallyOpen` prop. The spec requires the request template to be readable on arrival, and
  `CodeViewer` currently mounts collapsed. The prop defaults to today's behaviour, so its four existing
  consumers are untouched; the request template passes `true`, the response schema does not.
- Its toggle carries `aria-expanded` with no `aria-controls`. While in the file, pair it with a `useId`-based
  id on the content region (`a11y.md`: expand/collapse needs both).

### 6. No accordion on the detail page

The rule detail page groups with `Common/Accordion` because it holds ~25 *editable* controls that an
operator has to navigate. This page holds seven read-only blocks, two of which (`CodeViewer`) already carry
their own collapse header. Wrapping those in an accordion gives two chevrons for one thing to open. Blocks
render as plain `<section>`s with headings and an `aria-label`, in the order the spec lists them.

### 7. Layout: ag-grid for the page, CSS grid for the in-page readings

`components.md` §5/§6 split this by kind, not by looks: ag-grid for tabular *data* (sortable, filterable,
editable), CSS grid or flexbox for tabular *layout* such as key–value displays.

- The evaluators **listing** is tabular data → `GridView`, with `navigateEntityUrl` on `onCellClicked`,
  mirroring `EnrichmentRulesView`.
- `params`, `input_vars`, and `output_vars` are static readings of a handful of rows inside a page section →
  CSS grid. Sorting 13 output variables is not a feature anyone wants, and an ag-grid instance inside a
  page section brings sizing problems for nothing. This is why the spec says "two-column reading" rather
  than "grid".

An output variable's expression is rendered monospaced and truncated with `DialEllipsisTooltip`, which is
keyboard-reachable — `a11y.md` rules out a bare `title` attribute for this.

### 8. `VersionsControl` moves to `Common/`

It is already prop-generic (`versions: string[]`, `version`, `setVersion`) and domain-free, and it has
exactly one consumer today (`Assets/Modals/CompareVersions.tsx`). A second consumer in a different feature
is the trigger `components.md` §4 names for pushing a piece down, so it moves to
`src/components/Common/VersionsControl/` and `CompareVersions` updates its import. Its `setVersion(value as
CompareView)` cast is dropped in the move — the parameter is already `string`, and the cast only ties a
generic control to the audit-compare types.

Rejected outright, despite looking like the right neighbourhood: `BaseControls/Version.tsx`,
`Assets/Modals/AddVersionModal.tsx`, and the semver helpers in `utils/deployments/validation.ts`. Those
version images and assets, whose versions are author-supplied semver strings. Evaluator versions are
integers the service assigns; semver validation would reject `4`, and an "add version" affordance would
offer to name a number the service ignores.

### 9. The type badge becomes a feature component, and its i18n keys follow it

`EvaluatorTypeBadge` is typed on `EvaluatorType`, so §4 places it in the feature tree, not `Common/`:
`components/Analytics/Evaluators/EvaluatorTypeBadge.tsx`. `EvaluatorCell` imports it and loses its inline
`TYPE_COLOR` / `TYPE_LABEL` maps.

The two type labels currently live under `AnalyticsEnrichmentRulesI18nKey`. Once the badge is shared by both
consoles, that enum is the wrong owner, so `EvaluatorTypeLlm` and `EvaluatorTypeSql` move into the new
`AnalyticsEvaluatorsI18nKey` alongside the new strings. Four files, no string changes: the rendered "LLM"
and "SQL" stay identical, and `cells.spec.tsx` updates its expected key.

### 10. `EvaluatorPreset` is an enum that nothing branches on

`code-standards.md` calls for an enum over a bare string for a fixed value set, and `preset` has exactly one
service-defined value, `chat_completion`. It is typed `preset?: EvaluatorPreset` and **rendered by value,
never switched on** — so a value the enum does not name still reaches the screen verbatim, as the spec
requires. The enum exists to give change 2's authoring form a single source for the option list; it is not
a runtime guard, and adding a fallback branch keyed on it would be the bug the spec's "renders as reported"
scenario is guarding against.

The same reasoning covers an unrecognised `type`: the per-type branching hides the members `sql` forbids and
otherwise renders what the version carries, so it keys on `type === EvaluatorType.Sql` rather than
enumerating types. A future third type degrades to a full reading instead of a blank page.

## Risks / Trade-offs

- **A fabricated `used by` of 0 would be worse than no column** → the count is `Record | null`; `null`
  renders as unavailable, and no code path substitutes a zero. This is the single most consequential
  behaviour in the change, so it gets its own spec requirement and its own test.
- **Three server reads per detail page view** → all three go to one service on the server, and only one of
  them is on the critical path. Parallelising is a local change if latency shows.
- **Monaco is not mocked globally** — `test-setup.tsx` only patches `queryCommandSupported` for jsdom → any
  spec rendering `CodeViewer` mocks `@monaco-editor/react` locally, as `CodeViewer.spec.tsx` already does.
- **Adding a prop to a shared `CodeViewer`** touches a component with four consumers → the prop is opt-in
  and defaults to current behaviour; the `aria-controls` addition is additive.
- **Two same-named `created_at` fields invite a silent mix-up in code** → they live on two distinct models
  (`EvaluatorSummary` vs `Evaluator`) and behind two distinct i18n keys; neither view ever holds both in one
  variable.
- **An evaluator name can contain characters needing URL encoding** → links are built through a helper that
  encodes, and the page decodes, mirroring `ruleDetailHref` and the rule detail page.
- **Moving the three evaluator server actions crosses three importers** → a missed import is a TypeScript
  error, not a silent regression; `use-rule-resolution.ts`, `EnrichmentRulesView.tsx`, and
  `enrichment-rules/[id]/page.tsx` are the complete set.
- **The registry cannot be cleaned up from here, only measured** → stated on the page (spec: "never mutates
  the evaluator registry and says why") so the absence of a delete action is read as the service's contract
  rather than a missing feature.

## Migration Plan

None. Two new routes, one moved server-action module, one moved shared control, and one shared component
gaining an opt-in prop. No data migration, no API change, no feature flag beyond the existing
`ANALYTICS_ENABLED` that already gates the whole group. Rollback is reverting the commit; nothing persists
state.
