## 1. Wire model

- [x] 1.1 Add `identity_column?: string` and `version_column?: string` to `AnalyticsTable` in `apps/ai-dial-admin/src/models/analytics/table.ts`
- [x] 1.2 Add the same two fields to `DraftSourceSchemaDto` only — not to `DraftEnrichmentSchemaDto`, since either member is a 422 for an enrichment
- [x] 1.3 Add `identityColumn: string` and `versionColumn: string` to `DraftSchemaForm` in `apps/ai-dial-admin/src/models/analytics/tables-ui.ts`, using `''` for unset as `partitionColumn` does

## 2. Pure helpers in `components/Analytics/Tables/utils.ts`

- [x] 2.1 Add `getIdentityColumnNames(rows: ColumnRow[]): string[]` — de-duplicated trimmed `source_name` of rows that are `!nullable && !sensitive`, mirroring `getTemporalColumnNames`' shape
- [x] 2.2 Add `getVersionColumnNames(rows: ColumnRow[]): string[]` — the same set narrowed to `AnalyticsFieldType.Timestamp`; do not reuse `getTemporalColumnNames`, which also admits `Date`
- [x] 2.3 Add `isScanMetadataColumn(table: AnalyticsTable, column: AnalyticsTableColumn): boolean` comparing `column.source_name` against `table.identity_column` and `table.version_column`
- [x] 2.4 Seed `identityColumn`/`versionColumn` from `table.identity_column`/`table.version_column` in `createDraftSchemaForm`
- [x] 2.5 Leave `isRenameRestricted` unchanged — renaming a scan-metadata column is explicitly allowed

## 3. Draft-schema form state in `components/Analytics/Tables/use-draft-schema-form.ts`

- [x] 3.1 Expose `identityOptions` and `versionOptions` from the new helpers, memoized on `form.columns` like `temporalNames`
- [x] 3.2 Extend the `key === 'columns'` branch of `update()` to clear `identityColumn`/`versionColumn` when the referenced column no longer appears in its own option list
- [x] 3.3 Compute `pairRequired` (either member already stored on the table) and `pairComplete` (both set, or neither set and not required), and fold `pairComplete` into `canMaterialize` for a source
- [x] 3.4 Emit `identity_column`/`version_column` from `buildDto()` only when set and still valid; omit either key otherwise, and never emit them on the enrichment branch

## 4. i18n

- [x] 4.1 Add `IdentityColumn`, `VersionColumn`, `IdentityColumnHint`, `VersionColumnHint`, `ScanPairIncomplete`, and `ScanColumnNotSensitive` to `AnalyticsTablesI18nKey` in `apps/ai-dial-admin/src/constants/i18n.ts`, beside the existing `OrderingKey`/`PartitionColumn` keys
- [x] 4.2 Add the matching English strings to the `AnalyticsTables` block in `apps/ai-dial-admin/src/locales/en.ts`; the hints state the caller's unverifiable promise (version assigned at ingest, monotonic, never backdated; identity unique per row) and that the choice cannot change after materialization

## 5. Draft-schema editor (`components/Analytics/Tables/DraftSchemaEditor.tsx`)

- [x] 5.1 Render Identity column and Version column `DialSelectField`s in the source branch after the partition controls, fed by `identityOptions`/`versionOptions`, each with a `PartitionNone`-style empty option
- [x] 5.2 Compose each label with `DialTooltip` + `IconInfoCircle` following the existing `PartitionColumn` label pattern
- [x] 5.3 Mark both `required` when `pairRequired`, and set `error`/`invalid` on the empty half when exactly one is chosen (as `ColumnRowsEditor.tsx` does for `element_type`)
- [x] 5.4 Confirm the enrichment branch renders neither select

## 6. Table detail view and PATCH guards

- [x] 6.1 In the `isActive` source branch of `components/Analytics/Tables/TableDetailView.tsx`, add a `LabelledText` for each of `identity_column` and `version_column`, rendered only when present, beside the ordering-key/partition entries
- [x] 6.2 Extend the `getDeleteOperation` `hidden` predicate to `isPinnedRow(...) || isScanMetadataColumn(table, column)` so drop is not offered for a pair column
- [x] 6.3 Pass `sensitiveDisabled={isScanMetadataColumn(table, editColumn)}` to `EditColumnPopup`
- [x] 6.4 Add the optional `sensitiveDisabled?: boolean` prop to `components/Analytics/Tables/EditColumnPopup.tsx`, wiring it to `DialSwitch`'s `disabled` with a `caption` naming the reason; leave `buildColumnEditPatch` and every other field untouched

## 7. Unit and component tests

- [x] 7.1 `tests/utils.spec.ts` — the two option helpers (nullable/sensitive/type filtering, de-duplication), `isScanMetadataColumn` matching on `source_name` and not on a diverged exposed `name`, and `createDraftSchemaForm` seeding both values
- [x] 7.2 `tests/use-draft-schema-form.spec.ts` — `canMaterialize` across both-set, neither-set, and exactly-one-set; `pairRequired` forcing both when the table already stores one; invalidation on retype/rename/remove/nullable/sensitive; `buildDto` omitting each unset key and never emitting either for an enrichment
- [x] 7.3 `tests/DraftSchemaEditor.spec.tsx` — both selects render for a source and neither for an enrichment, option lists match the filters, and the empty half shows its error when exactly one is chosen
- [x] 7.4 `tests/TableDetailView.spec.tsx` — summary entries present when declared and absent when not (including the one-declared case and a `_`-prefixed value), delete hidden for a pair column and offered for others, and `sensitiveDisabled` passed through
- [x] 7.5 `tests/EditColumnPopup.spec.tsx` — the Sensitive switch disabled under `sensitiveDisabled` while a name/tag/description change still builds a patch
- [x] 7.6 `src/server/analytics/tests/analytics-data-api.spec.ts` — the two fields survive the table read round-trip and the define-schema payload carries them only when set

## 8. Browser verification

- [x] 8.1 Run the spec-browser-verify flow over the new scan-metadata scenarios in `openspec/changes/analytics-table-scan-metadata/specs/analytics/spec.md`, and resolve every `fail` verdict before treating the change as complete

## 9. Quality checks

- [x] 9.1 `cd apps/ai-dial-admin && npx vitest run src/components/Analytics/Tables src/server/analytics`
- [x] 9.2 `npm run lint` and `npm run format` from the repo root
- [x] 9.3 `npm run test` for the full suite
