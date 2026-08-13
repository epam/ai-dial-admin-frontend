## Why

The Table detail header collapses two unrelated operations behind one **Add** dropdown: **Add columns** changes the table's *shape* (a `PATCH /v1/tables/{name}/schema`, gated by `modify`), while **Add rows** writes *data* into it (a `POST /v1/tables/{name}/rows`, gated by `write`). They are different permissions, different endpoints, and different mental models — presenting them as two items of one button asks the user to open a menu before they can tell which of the two the page even offers.

More importantly, the header's emphasis is backwards. **A custom table is populated by a client writing to `POST /v1/tables/{name}/rows` on a schedule** — that is the ingestion path the feature exists to serve. The manual JSON editor is a quick hand-check an admin runs once to confirm the schema accepts what they think it accepts. Today the manual path holds the page's only primary button and the programmatic path is not represented in the UI at all, so the page teaches the wrong one as the default.

Nothing in the UI teaches the details that make a real client work, either. `decimal` should travel as a string to keep its digits; `_`-prefixed columns belong to the platform; the grid's **Display name** is a label and not a column identifier; and the API key needs one of *this table's* `write` roles. Today a user learns each of those from a rejected request.

## What Changes

- **Split the header `Add` dropdown into two standalone buttons** — **Add columns** and **Add rows** — each shown independently by its own permission (`canModify`, `canWrite`). The `DialButtonDropdown` disappears from the Table detail header. **BREAKING** for the existing spec requirement "Table detail gates edits by per-table permissions", whose dropdown behavior and header ordering both change.
- **Add a `Connect` header button** on `ACTIVE` tables — the header's **primary** action and its rightmost — opening an Azure-blade-style **Connect panel**: a right-side overlay, titled `Connect to <table>`, holding every programmatic way in and out of this table. **Add rows** and **Add columns** both become neutral buttons, so the page presents the programmatic path as the way a table gets populated and the manual editor as the secondary check that it is.
- The panel is split **by task, not by technology**: two tabs, **Write data** and **Read data**. Writing and reading are usually different people's jobs and carry different authorization — a write needs a role on this table, a read does not — so each tab carries its own authorization statement and its own language examples. Write covers Python and `curl` against `POST /v1/tables/{name}/rows`; Read covers Python and `curl` against `POST /v1/queries/execute-sql` plus a pandas/ADBC Flight SQL client. Flight SQL sits under Read alone, because that endpoint rejects write statements.
- **Snippets are generated from the table's real schema.** Every declared column appears, named exactly as the columns grid names it, carrying a type-appropriate mock literal — a fixed UUID, an ISO-8601 timestamp, a quoted decimal, an `element_type`-shaped array — so a copied script runs unedited against *this* table. An enrichment table's grain key is included as a top-level field. `_`-prefixed columns are omitted. The panel presents **one** column vocabulary and explains no internal second one.
- **The panel states the authentication contract**: how to pass a DIAL API key (`Api-Key` header, sourced from `ADAS_API_KEY` so it never lands in the script), and, on the Write tab, **this table's live `write` roles**, read from `GET /v1/tables/{name}/access`. Those role names are the only ones it renders; the analytics backend's internal application roles are neither readable by this app nor attachable to a key, so the panel refers to administrator access descriptively instead of naming a constant it cannot verify.
- **The Add rows popup states what it is for** — checking a schema by hand — and carries a prominent **Write rows programmatically** action that closes it and opens the Connect panel on the Write tab, so an admin who reached for the editor to do real ingestion is redirected before they paste a thousand rows into a textarea.
- A new reusable **`CodeSnippet`** common component — a scrollable monospace block with a copy button — since the repo's only code surface today is Monaco (`CodeViewer`), which is too heavy to instantiate five times in one panel.
- A new optional **`ANALYTICS_PUBLIC_URL`** environment variable supplies the endpoint the snippets default to; unset, they emit a `<adas-base-url>` placeholder with a replace-this note.

## Capabilities

### New Capabilities

None — the Connect panel is a new surface of the existing Analytics table-detail capability, and per the project's spec organization all Analytics requirements live in the single `analytics` master spec.

### Modified Capabilities

- `analytics`: **"Table detail gates edits by per-table permissions"** replaces the single **Add** dropdown with two independent header buttons, makes **Connect** the header's primary action, and fixes a new header order. **"Table detail row writes"** scopes the popup to hand-checking a schema and adds the programmatic-write action. Three new requirements are added: **"Table detail Connect panel"** (trigger, shape, tabs), **"Connect panel snippets are generated from the table schema"** (what each snippet contains and the type-to-literal mapping), and **"Connect panel states the authentication and role contract"** (API key handling, live `write` roles, degradation when access is unreadable).

## Impact

**Code**

- `src/components/Analytics/Tables/TableDetailView.tsx` — header action cluster (drops `DialButtonDropdown`), new `connectOpen` state and panel mount, new `apiBaseUrl` prop.
- `src/components/Analytics/Tables/ConnectPanel/` *(new)* — `ConnectPanel.tsx`, `ConnectWriteTab.tsx`, `ConnectReadTab.tsx`, `ConnectAuthSection.tsx`, `constants.ts`, `models.ts`.
- `src/components/Analytics/Tables/utils/connect-snippets.ts` *(new)* — pure snippet builders and the type→mock-literal map.
- `src/components/Common/CodeSnippet/CodeSnippet.tsx` *(new)*.
- `src/app/[lang]/tables/[id]/page.tsx` — reads `process.env.ANALYTICS_PUBLIC_URL`, passes it down.
- `src/constants/i18n.ts` (`AnalyticsTablesI18nKey`) and `src/locales/en.ts` (`AnalyticsTables`) — Connect panel strings. `AddColumns` / `AddRows` / `ManageAccess` are reused as-is.

**APIs** — no new backend endpoints. Reuses the existing `getTableAccess` server action; the snippets themselves document `POST /v1/tables/{name}/rows`, `POST /v1/queries/execute-sql`, and the Flight SQL endpoint.

**Configuration** — new optional `ANALYTICS_PUBLIC_URL`. Absent, the feature still works with a placeholder endpoint.

**Dependencies** — none added. `CodeSnippet` is plain markup; Flight SQL guidance is *documentation about* `pyarrow`/ADBC, not a frontend dependency.

**Backend dependencies (blocking)** — the snippets assume two ADAS changes that have not shipped, each the subject of its own proposal in `analytics-data-access-service`:

1. **Row writes keyed by the exposed `name`** rather than the internal `source_name`. Today the two are identical on every table this UI can create, so snippets keyed by `name` happen to work — but only by coincidence, and not for a table ADAS did not name.
2. **ISO-8601 timestamps accepted on insert.** Today `POST /v1/tables/{name}/rows` rejects a `T` separator, while every read surface *returns* that form. Until this lands, a copied snippet fails on its first row.

(1) is a latent correctness issue; (2) is hard-blocking — this change must not ship before it, or the panel hands users a script that cannot run. The fallback if the backend work slips is to emit the space-separated timestamp form and keep that pitfall in the troubleshooting list; it is contained in one util and one tab component.

**Adjacent features** — `CodeSnippet` lands in `Common/` for reuse, but no existing caller is migrated to it in this change. The Flight SQL example assumes that endpoint is served; the panel neither detects nor caveats it.
