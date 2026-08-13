## 0. Backend prerequisite

- [ ] 0.1 Confirm the two ADAS changes have shipped to the environment this targets — row writes keyed by the exposed `name`, and ISO-8601 timestamps accepted on insert (see proposal, "Backend dependencies"). If the timestamp change has not landed, stop and take the documented fallback (space-separated literal in the type map, timestamp pitfall back in the troubleshooting list) rather than shipping snippets that fail on their first row.

## 1. Snippet generation (pure)

- [ ] 1.1 Add `ConnectSnippets`, `ConnectTab`, and `SnippetValue` to `src/components/Analytics/Tables/ConnectPanel/models.ts`, and the `ANALYTICS_FIELD_TYPE_SAMPLE` map plus `ADAS_BASE_URL_PLACEHOLDER` to an adjacent `constants.ts` (`ConnectTab` as an enum, per the repo's enums-over-unions standard).
- [ ] 1.2 Implement `buildSampleRow(table)` in `src/components/Analytics/Tables/utils/connect-snippets.ts` — keys from `name`, `_`-prefixed columns dropped, grain key prepended for enrichment tables, values from the type map (quoted `decimal`, space-separated `timestamp`, `element_type`-shaped `array`, values for nullable columns too).
- [ ] 1.3 Implement `toPythonLiteral` and `toJsonLiteral` over a sample row in the same module.
- [ ] 1.4a Implement `buildFormatNotes(table)` in the same module — returns one entry per value-format rule (timestamp/date representation, decimal quoting, array element shape) that at least one declared column uses, each carrying the names of the columns it applies to; returns empty when the table has no such column. Non-per-column limits are not its concern.
- [ ] 1.4 Implement the snippet builders — `buildPythonWriteSnippet`, `buildPythonReadSnippet`, `buildFlightSqlSnippet`, `buildCurlWriteSnippet`, `buildCurlReadSnippet` — each taking `(table, baseUrl)`; read snippets project **exposed** names with an explicit `LIMIT`, write snippets use the sample row; all read the endpoint from `ADAS_BASE_URL` defaulting to `baseUrl` or the placeholder, and the API key from `ADAS_API_KEY`.
- [ ] 1.5 Unit-test `connect-snippets.ts` in `src/components/Analytics/Tables/tests/connect-snippets.spec.ts`: one case per `AnalyticsFieldType`, `buildFormatNotes` naming columns rather than types, collapsing two columns of one type into a single entry, and returning empty for a table with no format-carrying column, every snippet naming columns by `name` (including a fixture where `name` and `source_name` differ), `_`-prefixed omission, the enrichment grain key, an empty-columns table, and placeholder-vs-configured base URL.

## 2. Reusable code block

- [ ] 2.1 Create `src/components/Common/CodeSnippet/CodeSnippet.tsx` — `{ title?, value, className? }`, a `<pre>` with `overflow-x-auto` and `CopyButton` (passing both `valueLabel` and `value`, which `CopyButton` requires to act).
- [ ] 2.2 Test it in `src/components/Common/CodeSnippet/tests/CodeSnippet.spec.tsx`: renders its value verbatim and copies that exact text.

## 3. Connect panel

- [ ] 3.1 Create `src/components/Analytics/Tables/ConnectPanel/ConnectPanel.tsx` — `null` when closed; backdrop plus right-anchored overlay following `GridView.tsx:92-103` (560px desktop, full width on mobile); header `Connect to <name>` with a close control; `Escape` and backdrop close.
- [ ] 3.2 Add the `DialTabs` header with `Write data` / `Read data`, defaulting to `Write data`, and render the shared API-key block above the tabs rather than inside each.
- [ ] 3.3 Create `ConnectAuthSection.tsx` — the shared `ADAS_API_KEY` guidance and env-var block, rendered once above the tabs. Render no application-role constant and no statement about the current session's own permissions.
- [ ] 3.3a In the Write tab, load access via the existing `getTableAccess` action on first open and render the `write` role names as the roles a key must carry; add the one-line note that a key with administrator access can write too but a scoped role is the better choice; on failure omit the list with no notification. When the list is empty, state that only a key with administrator access can write to this table.
- [ ] 3.3b In the Read tab, state that reading is not scoped per table — any key with analytics access can query it, and no per-table read-only role exists.
- [ ] 3.4 Add the **Manage access** shortcut to the auth section, shown only when the viewer can manage roles; it closes the panel and opens the existing access surface.
- [ ] 3.5 Create `ConnectWriteTab.tsx` (who-can-write roles, Python snippet, cURL snippet, then the generated per-column format notes, then the rejections as troubleshooting *below* them) and `ConnectReadTab.tsx` (read access is not per-table, Python snippet, cURL snippet, Flight SQL with its pip prerequisite, its call-header note, and the read-only note), each rendering through `CodeSnippet`.
- [ ] 3.6 Show the "replace `<adas-base-url>`" note when no base URL is configured.

## 4. Table detail header and wiring

- [ ] 4.1 In `src/app/[lang]/tables/[id]/page.tsx`, read `process.env.ANALYTICS_PUBLIC_URL` and pass it to `TableDetailView` as `apiBaseUrl`.
- [ ] 4.2 In `TableDetailView.tsx`, replace the `DialButtonDropdown` branch (lines 333-344) and the `addColumnsAction`/`addRowsAction` item declarations (lines 244-256) with two standalone `DialNeutralButton`s — **Add columns** (`canModify`) and **Add rows** (`canWrite`) — keeping the existing `onSubmitAddColumns` / `buildRowsTemplate` handlers.
- [ ] 4.3 Add the **Connect** header button as a `DialPrimaryButton` in the last header slot (`ACTIVE` only, no permission gate), plus `connectOpen` state and the `ConnectPanel` mount.
- [ ] 4.4 Add the purpose line and the **Write rows programmatically** action at the top of the Add rows popup body, above the editor; the action closes the popup and opens the panel on the Write tab.
- [ ] 4.5 Add the new `AnalyticsTablesI18nKey` members and their `AnalyticsTables` strings in `src/locales/en.ts`, reusing `AddColumns`, `AddRows`, and `ManageAccess` unchanged.

## 5. Tests

- [ ] 5.1 Extend `src/components/Analytics/Tables/tests/TableDetailView.spec.tsx` for the header: both Add buttons present with both permissions, each alone with one permission, neither with none and no dropdown in their place, both neutral in every combination with **Connect** the sole primary, the documented action order, **Connect** present on an `ACTIVE` table including a permissionless and a system one, and absent on `PENDING`/`FAILED`. Drop the now-unused `DialButtonDropdown` mock (`TableDetailView.spec.tsx:23-39`).
- [ ] 5.2 Add `src/components/Analytics/Tables/tests/ConnectPanel.spec.tsx`: opens on the Write tab, tab switching, each tab carrying only its own authorization statement, Flight SQL present under Read only, close via control / `Escape` / backdrop, role names rendered from a mocked `getTableAccess`, the empty-list wording, the silent no-notification fallback when the call rejects, that no application-role constant appears in the rendered panel for any permission fixture, and that the empty-list case renders the call to action rather than a neutral statement.
- [ ] 5.3 Cover the Add rows popup's framing and escalation: the purpose line renders above the editor, and activating **Write rows programmatically** closes the popup and opens the panel on the Write tab.

## 6. Browser verification

- [ ] 6.1 Run the `spec-browser-verify` skill for this change against the local stack (auth disabled) — it builds a `VerificationRequest` from the scenarios above and spawns the `spec-verification-gate` sub-agent to check them via the Playwright MCP. Resolve every `fail` verdict before the change is complete.

## 7. Quality checks

- [ ] 7.1 Run `npm run lint`, `npm run format`, and `npm run test`, and fix everything they report.
