## Context

See `proposal.md` — Why. The constraints that shape the approach:

- **`TableDetailView.tsx` is already the page's single client component** (~473 lines) holding four modal states (`confirmOpen`, `addOpen`, `writeOpen`, `accessOpen`), the grid column defs, the draft-schema branch, and the source-table fetch for enrichment grain keys. Adding a fifth surface inline would push it past what is reviewable.
- **There is no drawer in `@epam/ai-dial-ui-kit`.** The only true overlay slide-out in this repo is the grid's `ColumnsPanel` (`components/Grid/ColumnsPanel/`), positioned by `GridView.tsx:92-103` as a backdrop plus `absolute right-0 top-0 bottom-0`. `components/Common/SidePanel/SidePanel.tsx` exists but is an **in-flow column**, not an overlay — callers place it beside content.
- **There is no syntax highlighter.** Every code surface in the repo is Monaco (`CodeViewer`, `JsonEditorBase`, `SqlEditor`); `CodeViewer` hardcodes `language="json"` and carries a fullscreen viewer.
- **A column carries two identifiers, and they never diverge in practice.** `POST /v1/tables/{name}/rows` keys rows by `AnalyticsTableColumn.source_name` while every read surface projects `AnalyticsTableColumn.name` — but the column editor fills both from one input (`ColumnRowsEditor.tsx:58`) and a rename sets both, so no table this UI can reach has them apart. `source_name` exists for columns ADAS did not name (a `system` table's), which this UI cannot create.
- **`ADAS_BASE_URL` is not known to the browser.** `DIAL_ANALYTICS_API_URL` is a server-only variable, and in a typical deployment it is an in-cluster address a user's laptop cannot reach anyway.
- **`GET /v1/tables/{name}/access` needs an application role.** A caller with only a per-table provider role gets `403`, so the panel cannot depend on that call succeeding.

## Goals / Non-Goals

**Goals:**

- Make the header's emphasis match how tables are actually populated — programmatically — without removing the manual editor, which remains the fastest way to sanity-check a fresh schema.
- Keep the snippet generation **pure and separately testable** — the type→literal mapping is where the bugs will be, and it should be provable without rendering a panel.
- Keep `TableDetailView` a coordinator: one more boolean and one more mounted child, no snippet logic.
- Make the panel **fully functional when its access request fails**, since documentation that disappears on a `403` is worse than documentation with one paragraph missing.
- Reuse the existing overlay geometry, tab component, and copy button rather than introducing new patterns.

**Non-Goals:**

- Executing snippets from the browser, or a "test connection" affordance.
- Rendering or minting an API key. The panel is instructions; keys come from DIAL.
- Detecting whether the configured public URL is reachable. The Flight SQL endpoint is assumed enabled; the panel neither detects nor caveats it.
- Migrating existing `CodeViewer` callers to the new `CodeSnippet`.
- Syntax highlighting.

## Decisions

### 1. Two standalone neutral buttons — not a dropdown, not a variant that shifts

`DialButtonDropdown` leaves `TableDetailView`'s header. **Add columns** and **Add rows** both render as `DialNeutralButton`, each behind its own permission flag.

Today the header code branches three ways and whichever action is the only one available becomes primary. Dropping that keeps the rule one sentence long and one test per button, and means a given action looks the same to every user — a modify-only user seeing **Add columns** promoted to primary would read it as "the main thing to do here", which it is not.

*Alternative considered:* keep the dropdown and add **Connect** as a third item. Rejected — it doubles down on exactly the conflation the change exists to remove.

*Consequence:* the header can hold five actions. At the observed ~1060px viewport that fits; the cluster keeps its existing `flex` + `gap` wrapping, so a narrow viewport wraps rather than truncates.

### 2. `Connect` is the primary action, status-gated and not permission-gated

**Primary.** A custom table is populated by a client `POST`ing to `/v1/tables/{name}/rows` on a schedule; the JSON editor is an admin confirming once that the schema accepts what they think it accepts. The header should emphasize the first and merely offer the second, so **Connect** takes the primary variant and the rightmost slot — where the header's primary action (**Add**, or **Save** before materialization) already sits, so the change doesn't move the eye to a new place.

This also disposes of a wrinkle Decision 1 would otherwise leave: with both Add buttons neutral, a header could have had no primary at all. Since **Connect** shows on every `ACTIVE` table, there is always exactly one.

**Status-gated, not permission-gated.** Per-table permissions gate *doing*; the panel is *reading about doing*. The user most in need of "a key writing here must carry one of these roles" is the one whose key carries none of them. Status is a different matter: a `PENDING`/`FAILED` table has no ClickHouse table behind it, so every snippet would be a lie — hence `ACTIVE`-only, matching the existing status branch (see the spec's "Table detail column schema management").

*Naming:* **Connect** over "API access" or "Write data" — it covers both directions, and it is the label of the Azure blade this pattern is modelled on, which is the reference the design was reviewed against.

### 3. A new overlay panel component, geometry copied from `ColumnsPanel`

New `components/Analytics/Tables/ConnectPanel/ConnectPanel.tsx`, mounted by `TableDetailView` behind `connectOpen`, returning `null` when closed. Backdrop (`bg-blackout`) plus a right-anchored absolute panel, following `GridView.tsx:92-103`. Width **560px** desktop rather than `ColumnsPanel`'s 397px — code lines need the room, and a snippet that wraps mid-token is not copy-safe — falling back to full width on mobile/tablet.

*Alternatives:* `Common/SidePanel` (in-flow, would reflow the grid — wrong shape); `DialFormPopup` as a centered modal (what everything else on this page uses, but a centered modal is a *decision* surface — you act and it goes away, whereas this is a reference you read while looking at the schema behind it); `DialCollapsibleSidebar` (built for persistent navigation).

*Not generalized into `Common/` yet* — one caller. The second overlay drawer in the codebase is the moment to extract it.

### 4. `CodeSnippet` in `Common/`, plain markup, no Monaco

`components/Common/CodeSnippet/CodeSnippet.tsx`: `{ title?, language?, value }` rendering a `<pre>` with `overflow-x-auto` and the existing `CopyButton` in its corner.

Five to seven code blocks live in this panel. Five Monaco instances in one overlay is a large amount of machinery for read-only, never-edited text, and `CodeViewer` additionally hardcodes `language="json"` and bundles a fullscreen viewer nobody needs here. Horizontal scroll rather than wrapping is deliberate: a wrapped line looks like two statements.

`CopyButton` no-ops unless **both** `valueLabel` and `value` are set (`CopyButton.tsx:24`) — `CodeSnippet` always passes both.

*Alternative:* add a `language` prop to `CodeViewer` and use it. Rejected on weight, and it would change a component seven other places depend on.

### 5. Snippet generation is a pure module

`components/Analytics/Tables/utils/connect-snippets.ts`, taking `(table: AnalyticsTable, baseUrl: string)` and returning a typed `ConnectSnippets` object (shape in an adjacent `models.ts`, per the repo's constants/models split). Two layers:

1. **`buildSampleRow(table)`** → `Record<string, SnippetValue>` — the single source of truth for what goes in a row: `_`-prefixed columns dropped, keys taken from `source_name`, grain key prepended for enrichment tables, values from a `AnalyticsFieldType → literal` map. This mirrors the existing `buildRowsTemplate`/`templateValueFor` (`Tables/utils.ts`) but is deliberately **not** shared with it: the Add rows template wants *empty* placeholders the user overwrites, the snippet wants *plausible* values the user runs unedited. Merging them would force one of the two to compromise.
2. **Serializers** — `toPythonLiteral` and `toJsonLiteral` over that one row, differing only in `True/False/None` vs `true/false/null`. Both `array` element shaping and the `decimal`-as-string rule live in step 1, so neither serializer has to know about column types.
3. **`buildFormatNotes(table)`** — the same type→rule table, rendered as prose instead of as values. It returns one entry per format rule that at least one declared column actually uses, each carrying the names of the columns it applies to, and nothing when the table has no such column.

That third layer is the part worth naming as a decision. The panel could state its rules by type — "decimal columns are quoted", "timestamp columns use ISO-8601" — and that is what the first draft did. Stating them against the column instead ("`score` is quoted", "`recorded_at` is ISO-8601") costs one more function and removes a step the reader was otherwise doing in their head: matching an abstract rule to their own schema. It also makes irrelevant rules disappear, since a rule with no matching column produces no entry — a table of strings and integers shows no format guidance at all, rather than three paragraphs about types it doesn't have.

Both the values and the prose come from one type→rule map, so they cannot disagree: if the map says `decimal` is quoted, the sample row quotes it and the note says so.

### 5a. Snippets key by `source_name` — and say nothing about it

The row endpoint accepts the physical `source_name`, so that is what the snippets emit. The panel does not explain the identifier, contrast it with the exposed name, or mention that two exist.

Both halves matter. Keying by `source_name` matches the shipped contract and the existing Add rows template, so the spec holds one rule rather than two contradictory ones. Saying nothing is correct because the two names are equal on every table this app can produce — the column editor fills both from one input (`ColumnRowsEditor.tsx`), and a rename sets both (`CatalogSchemaWriter.renameColumn`, which also issues the physical `ALTER … RENAME COLUMN`). The distinction exists for columns ADAS did not name, which this UI cannot create. Explaining it would teach a concept the reader cannot act on, and the rendered snippet is byte-identical either way.

If the backend later keys writes by the exposed name, only the builder changes; no panel copy does.

### 5b. Specified against the backend as it ships, not as it should be

An earlier draft specified ISO-8601 timestamps and exposed-name keying, on the strength of backend changes that were drafted but never filed — `analytics-data-access-service/openspec/changes/` holds only `archive/`. That made the change unshippable and left the spec asserting a contract that does not exist.

It is now written against shipped behavior: `source_name` keying, space-separated `YYYY-MM-DD HH:MM:SS.mmm` timestamps on write. The read/write timestamp asymmetry is real and is surfaced to the user as a format note rather than papered over — reads return ISO-8601, writes do not accept it.

The three backend defects worth fixing are recorded in proposal.md. Each would shorten this panel; none gates it.

### 6. `ANALYTICS_PUBLIC_URL` read server-side, passed as a prop

`app/[lang]/tables/[id]/page.tsx` is already an RSC. It reads `process.env.ANALYTICS_PUBLIC_URL` and passes `apiBaseUrl` to `TableDetailView`; empty means "unset" and the snippet falls back to the `<adas-base-url>` placeholder plus a replace-this note.

*Alternative:* add it to `FeatureFlags` alongside `analyticsEnabled` (`layout.tsx:56`). Rejected — `FeatureFlags` is a booleans object consumed app-wide; one page's endpoint string does not belong in it. *Alternative:* surface `DIAL_ANALYTICS_API_URL`. Rejected — it is routinely an in-cluster address, so it would confidently hand the user a URL that cannot resolve from their machine, which is worse than an obvious placeholder.

### 6a. The panel names only role names the backend handed us

`isFullAdmin` (`AppContext.tsx:121`) is the **console's** session role, read from next-auth. The analytics service computes its own application roles from its own provider-role mapping, which this app cannot read. The two probably agree — both descend from the same IdP roles — but nothing enforces it, and each service is configured separately.

For button-gating that inaccuracy is tolerable: the backend enforces regardless, so the worst case is a button that 403s. For a panel that gives *instructions* it is not, and there is a second reason it is not: an application role is not something an operator can attach to a key. What goes on a key is a provider role that the backend's mapping happens to resolve. So "your key needs FULL_ADMIN" is both unverifiable and unactionable.

Hence: the panel renders **only** role names that came back from `GET /v1/tables/{name}/access` — real, grantable provider roles — and refers to administrator-level access descriptively rather than by name.

The related trap is a principal mismatch. `table.permissions` describes *this console session*; the snippets run under *an API key the user supplies*. Answering "can you write to this table?" would answer a question nobody asked, so the panel does not, however tempting it is given the data is already loaded.

The gap this leaves is real and unsolved here: the panel can say which roles a key needs but not which key has them. Closing it means listing `/keys` and intersecting `DialKey.roles` with the table's write list — plausible, since an API key's roles are resolved through Core and matched against the same access list, so the two are the same namespace. Deliberately out of scope; worth doing next, and worth verifying that namespace claim before relying on it.

### 6b. Administrator access is stated, and argued against

Omitting the administrator bypass would be a lie: such a key writes here whatever the access list says, and someone diagnosing an unexpected success needs to know why. But naming it as an option is worse than omitting it, because it is the option people take. An ingest job needs to append rows to one table; an administrator key writes to and drops every table and reads columns marked sensitive, sits long-lived in a CI config, and turns a leak of one job's credential into a leak of the analytics surface.

So the section recommends exactly one thing — a key carrying a role from this table's list, and nothing broader — and mentions administrator access only as a caution naming what else it permits. No step, link, or instruction for obtaining one.

**The empty write list is where this actually bites.** With no write role configured, an administrator key is the *only* thing that works, so the state itself pushes the reader toward the anti-pattern. A neutral "no roles are configured" would leave them there. It is specified as a call to action instead: name the consequence.

**And the read side has no least-privilege story at all** — the backend governs writes only, so a key that can verify its own inserts can query the whole catalog. The panel says so rather than implying a per-table read role exists. Nothing here can fix that; it is a backend capability gap worth tracking separately.

*What would make this better, and would need the backend:* **remove the administrator write bypass**, so a row insert is authorized by the table's `write` list and nothing else. Then the list is the complete answer, this whole subsection collapses, and the caution paragraph is deleted rather than improved — the panel says "give the key one of these roles" and that is simply true. Recorded in proposal.md as an opportunity; nothing here waits on it.

An intermediate option — having the access endpoint return each authorizing role tagged with its scope, so the console could name the administrator roles instead of gesturing at them — was considered and set aside. It solves the wording problem while leaving the underlying one (an ambient capability nobody granted), and it becomes unnecessary the moment the bypass goes.

Note this is a *simplification* dependency, not a blocking one: everything specified here works today and gets shorter later. If the bypass is removed, delete the caution and the administrator clause from the empty-list copy; the rest is unchanged.

### 6c. Accessibility is specified, not left to the component

The panel is a modal overlay, which is where accessibility is usually lost. `.claude/rules/a11y.md` is a config-mandated design input, so the spec carries the four things a dialog owes: a dialog role with modal state and an accessible name matching the title, focus moved in on open, `Tab` confined while open, and focus returned to the **Connect** button on close. The copy action announces its result — `CopyButton` already notifies, but the announcement is specified rather than assumed.

The access request also gets a stated loading state. Previously only its success and failure paths were specified, leaving the in-flight render to whoever built it.

### 7. Access is fetched on open, and failure is silent

`ConnectPanel` calls the existing `getTableAccess` server action in an effect on first open (not on page load — most visits never open the panel), holding `{ loading, roles, failed }`. On failure it sets `failed` and renders the generic rule text with no role names, and **no notification** — this call failing is an expected outcome for a caller without an application role, not an error the user caused.

*Alternative:* pass access down from the RSC page. Rejected — it would make every table-detail page load pay for a call most visits do not need, and would surface the `403` as a page-level concern.

### 8. Two tabs, split by task

Two tabs — **Write data** and **Read data** — with `DialTabs`, matching its use inside `PreviewModal.tsx`. Write is the default, because the write path is why the panel exists.

Tabbing by language was the first instinct and it was wrong. The audiences differ: the person building an ingest job and the analyst pulling data into pandas are usually different people, and so does their authorization — a write needs a role on this table, a read needs none and cannot be scoped to one table at all. Under language tabs those two facts collapsed into one shared paragraph shown to everybody, and Flight SQL sat as a peer of Python despite rejecting every write statement, needing a footnote to say so. Splitting by task gives each reader only the authorization that applies to them, and puts Flight SQL under Read where its read-only nature is the premise rather than an exception.

The cost is that Python and cURL each appear twice, once per tab. That is the right trade: the duplicated part is a snippet, while the part that would otherwise be duplicated-or-shared is the authorization rule, which is exactly what differs.

### 9. The Add rows popup declares itself a hand-check, and the escalation closes it

A one-line purpose statement and the **Write rows programmatically** action sit together at the **top** of the popup body, above the editor and away from the submit controls. Placement is the point: an admin who opened the popup intending real ingestion should be redirected *before* pasting, and the content discarded on escalation is then the untouched template.

The action closes the popup before opening the panel. Two overlays stacked would need a z-index contest and leave an ambiguous `Escape` target.

*Alternative:* keep the popup open behind the panel. Rejected on the stacking and focus-management cost for a case where nothing of value is usually lost.

*Not done:* renaming the button to something like "Insert test rows". The label matches the popup's own submit action and the existing `AnalyticsTablesI18nKey.AddRows` string; the positioning (neutral, next to **Add columns**, beside a primary **Connect**) and the popup's own copy carry the framing without a rename that would ripple through i18n and tests.

## Risks / Trade-offs

- **A copied snippet fails against a real deployment because `ANALYTICS_PUBLIC_URL` is unset or wrong** → unset is the visible, self-describing `<adas-base-url>` placeholder with a note, not a silently wrong URL; every snippet also honours a real `ADAS_BASE_URL` from the environment, so the user can override without editing.
- **The panel assumes API-key auth and the Flight endpoint are enabled.** Both default off in the backend and neither is readable from here.
- **The Flight SQL example assumes the endpoint is served.** A deployment with Flight disabled gives the user a bare connection failure and no hint from the panel. Accepted deliberately: Flight is expected to be on, and the alternative — a caveat on every reader's screen for a case most never hit, since detecting it would need a new backend capability endpoint — costs more than it saves.
- **Snippets drift from the backend's insert contract** (a new column type, a changed timestamp format) → the type→literal map is one table in one pure module with a unit test per type, so drift is a one-line fix, and the map is exhaustive over `AnalyticsFieldType` so a new enum member fails the type check rather than silently emitting nothing.
- **A wide table produces a long snippet** → the panel scrolls and each block scrolls horizontally; no truncation, because a truncated script is a broken script.
- **Five header buttons crowd a narrow viewport** → the cluster wraps. If it proves cramped in review, the fallback is moving **Manage access** and **Delete table** into an overflow menu, which does not disturb this change's core split.
- **`buildSampleRow` and `buildRowsTemplate` are near-duplicates that can drift** → accepted deliberately (Decision 5); they answer different questions. Both are unit-tested against the same column fixtures, so a divergence in the *column selection* rules (the part that genuinely must agree) shows up as a failing test.
