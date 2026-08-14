## 1. Snippet generation (pure)

- [x] 1.1 Add `ConnectSnippets`, `ConnectTab`, and `SnippetValue` to `src/components/Analytics/Tables/ConnectPanel/models.ts`, and the `ANALYTICS_FIELD_TYPE_SAMPLE` map plus `ADAS_BASE_URL_PLACEHOLDER` to an adjacent `constants.ts` (`ConnectTab` as an enum, per the repo's enums-over-unions standard).
- [x] 1.2 Implement `buildSampleRow(table)` in `src/components/Analytics/Tables/ConnectPanel/connect-snippets.ts` — keys from `source_name`, `_`-prefixed columns dropped, grain key prepended for enrichment tables, values from the type map (quoted `decimal`, space-separated `timestamp`, `element_type`-shaped `array`, values for nullable columns too).
- [x] 1.3 Implement `toPythonLiteral` and `toJsonLiteral` over a sample row in the same module.
- [x] 1.4 Implement `buildFormatNotes(table)` — one entry per value-format rule (timestamp representation including the read/write asymmetry, decimal quoting, array element shape) that at least one declared column uses, each carrying the names of the columns it applies to; empty when no column carries a rule. Non-per-column limits are not its concern.
- [x] 1.5 Implement the snippet builders — `buildPythonWriteSnippet`, `buildPythonReadSnippet`, `buildFlightSqlSnippet`, `buildCurlWriteSnippet`, `buildCurlReadSnippet` — each taking `(table, baseUrl)`; read snippets carry an explicit `LIMIT` no greater than the REST maximum, write snippets use the sample row; all read the endpoint from `ADAS_BASE_URL` defaulting to `baseUrl` or the placeholder, and the API key from `ADAS_API_KEY`.
- [x] 1.6 Unit-test `connect-snippets.ts` in `src/components/Analytics/Tables/tests/connect-snippets.spec.ts`: one case per `AnalyticsFieldType`, keying by `source_name` (including a fixture where it differs from `name`), `_`-prefixed omission, the enrichment grain key, an empty-columns table, placeholder-vs-configured base URL, and `buildFormatNotes` naming columns rather than types, collapsing two columns of one type into one entry, and returning empty when no column carries a rule.

## 2. Reusable code block

- [x] 2.1 Create `src/components/Common/CodeSnippet/CodeSnippet.tsx` — `{ title?, value, className? }`, a `<pre>` with `overflow-x-auto` and `CopyButton` (passing both `valueLabel` and `value`, which `CopyButton` requires to act).
- [x] 2.2 Test it in `src/components/Common/CodeSnippet/CodeSnippet.spec.tsx`: renders its value verbatim and copies that exact text.

## 3. Connect panel

- [x] 3.1 Create `src/components/Analytics/Tables/ConnectPanel/ConnectPanel.tsx` — `null` when closed; backdrop plus right-anchored overlay following `GridView`'s columns-panel geometry (560px desktop, full width below the tablet breakpoint); header `Connect to <name>` with a close control; `Escape` and backdrop close.
- [x] 3.2 Make the panel an accessible modal dialog: dialog role and modal state, accessible name matching the title, focus moved into the panel on open, `Tab` confined while open, focus returned to the **Connect** button on close. Follow `.claude/rules/a11y.md`.
- [x] 3.3 Add the `DialTabs` header with `Write data` / `Read data`, defaulting to `Write data`, and render the shared API-key block above the tabs rather than inside either.
- [x] 3.4 Create `ConnectAuthBlock.tsx` — the shared `ADAS_API_KEY` guidance and env-var snippet, noting every surface takes the same `Api-Key` key and that the Flight driver sends it as a gRPC call header. Render no application-role constant and no statement about the current session's own permissions.
- [x] 3.5 Create `ConnectWriteTab.tsx` — the `write` role names loaded via the existing `getTableAccess` action on first open (loading state while in flight; on failure omit the list, no notification), the administrator-access caution with its scoped-role preference, the empty-list consequence, then the Python and cURL snippets, then the generated format notes and the two rejections as troubleshooting below them. Attribute role granting to a full administrator rather than pointing at a control that may not render.
- [x] 3.6 Create `ConnectReadTab.tsx` — read access is not scoped per table, the per-surface row limits (REST default 100 and rejection above 1 000; Flight clamps an oversized limit and fails without a partial page, its cap deployment-configured), then the Python, cURL and Flight SQL snippets with the Flight pip prerequisite and read-only note.
- [x] 3.7 Show the "replace `<adas-base-url>`" note when no base URL is configured.

## 4. Table detail header and wiring

- [x] 4.1 In `src/app/[lang]/tables/[id]/page.tsx`, read `process.env.ANALYTICS_PUBLIC_URL` and `process.env.ANALYTICS_FLIGHT_SQL_PUBLIC_URL` and pass them to `TableDetailView` as `apiBaseUrl` and `flightUri`, empty when unset.
- [x] 4.2 In `TableDetailView.tsx`, replace the `DialButtonDropdown` branch and the `addColumnsAction`/`addRowsAction` item declarations with two standalone `DialNeutralButton`s — **Add columns** (`canModify`) and **Add rows** (`canWrite`) — keeping the existing `onSubmitAddColumns` / `buildRowsTemplate` handlers.
- [x] 4.3 Add the **Connect** header button as a `DialPrimaryButton` in the last header slot (`ACTIVE` only, no permission gate), plus `connectOpen` state and the `ConnectPanel` mount.
- [x] 4.4 Add the purpose line and the **Write rows programmatically** action at the top of the Add rows popup body, above the editor; the action closes the popup and opens the panel on the **Write data** tab.
- [x] 4.5 Add the new `AnalyticsTablesI18nKey` members and their `AnalyticsTables` strings in `src/locales/en.ts`, reusing `AddColumns`, `AddRows`, and `ManageAccess` unchanged.

## 5. Tests

- [x] 5.1 Extend `src/components/Analytics/Tables/tests/TableDetailView.spec.tsx` for the header: both Add buttons present with both permissions, each alone with one permission, neither with none and no dropdown in their place, both neutral in every combination with **Connect** the sole primary, the documented action order, **Connect** present on an `ACTIVE` table including a permissionless and a system one, and absent on `PENDING`/`FAILED` where **Save** shows instead. Drop the now-unused `DialButtonDropdown` mock.
- [x] 5.2 Add `src/components/Analytics/Tables/tests/ConnectPanel.spec.tsx`: opens on the **Write data** tab from both entry points, tab switching, each tab carrying only its own authorization statement, Flight SQL under Read only, close via control / `Escape` / backdrop with focus returned to **Connect**, role names from a mocked `getTableAccess`, the loading state, the empty-list wording, the silent no-notification fallback when the call rejects, and that neither `FULL_ADMIN` nor `READ_ONLY_ADMIN` appears in the rendered panel for any fixture.
- [x] 5.3 Cover the Add rows popup's framing and escalation: the purpose line renders above the editor, and **Write rows programmatically** closes the popup and opens the panel on **Write data**.

## 6. Browser verification

- [ ] 6.1 Run the `spec-browser-verify` skill for this change against the local stack (auth disabled) — it builds a `VerificationRequest` from the scenarios above and spawns the `spec-verification-gate` sub-agent to check them via the Playwright MCP. Resolve every `fail` verdict before the change is complete.

## 7. Quality checks

- [x] 7.1 Run `npm run lint`, `npm run format`, and `npm run test`, and fix everything they report.
