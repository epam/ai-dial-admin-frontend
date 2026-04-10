## 1. i18n

- [x] 1.1 Add `ExtractedColumns = 'Runs.ExtractedColumns'` to `RunsI18nKey` enum in `apps/ai-dial-admin/src/constants/i18n.ts`
- [x] 1.2 Add `'Runs.ExtractedColumns': 'Extracted Columns'` to `apps/ai-dial-admin/src/locales/en.ts`

## 2. Utility — array-value support in getDetailEntries

- [x] 2.1 Update `getDetailEntries` in `apps/ai-dial-admin/src/components/Runs/View/utils.ts` to return `Array<[string, string | string[]]>`: detect `Array.isArray(val) && val.every(v => typeof v === 'string')` and return as `string[]`; all other values continue with `String(val)`
- [x] 2.2 Update tests in `apps/ai-dial-admin/src/components/Runs/View/tests/utils.spec.ts`: add cases for string-array value, mixed array, and verify existing non-array cases still pass

## 3. AdaptiveValueRow — string-array rendering

- [x] 3.1 Update `AdaptiveValueRow` props in `apps/ai-dial-admin/src/components/Runs/Details/AdaptiveValueRow.tsx`: change `value: string` to `value: string | string[]`
- [x] 3.2 Implement the branch: when `value` is `string[]`, render `<div className="flex flex-col gap-1">` with one `<span>` per item; skip `parseValue` for this case
- [x] 3.3 Update the copy button's `value` prop: join `string[]` with `'\n'` when value is an array

## 4. AdaptiveValueGrid — type widening + collapsible toggle

- [x] 4.1 Update `AdaptiveValueGrid` props in `apps/ai-dial-admin/src/components/Runs/Details/AdaptiveValueGrid.tsx`: change `entries: Array<[string, string]>` to `Array<[string, string | string[]]>`
- [x] 4.2 Add `useState(true)` for `isCollapsed` local state; import `IconChevronRight` and `IconChevronDown` from `@tabler/icons-react`
- [x] 4.3 Replace the title `<div>` with a `<button>` that toggles `isCollapsed` on click, shows the appropriate chevron icon before the title text
- [x] 4.4 Wrap the entries `<div>` with `{!isCollapsed && ...}` so rows only render when expanded

## 5. Tests — AdaptiveValueGrid and AdaptiveValueRow

- [x] 5.1 Update existing `AdaptiveValueGrid` tests in `apps/ai-dial-admin/src/components/Runs/Details/tests/AdaptiveValueGrid.spec.tsx`: the "renders title and entries" test must now click the title button to expand before asserting row content is visible
- [x] 5.2 Add test: grid renders title-only on initial mount (no entry rows visible without expanding)
- [x] 5.3 Add test: clicking title expands entries; clicking again collapses them
- [x] 5.4 Add test: `AdaptiveValueRow` with `string[]` value renders each item as separate visible element
- [x] 5.5 Add test: `AdaptiveValueRow` with `string[]` copies newline-joined string to clipboard

## 6. Detail panels — Extracted Columns section

- [x] 6.1 In `RunResultDetailPanel` (`apps/ai-dial-admin/src/components/Runs/Details/RunResultDetailPanel.tsx`): add `extractedColumnsEntries` memo from `getDetailEntries(result.extractedColumns ?? {})` and render `<AdaptiveValueGrid title={t(RunsI18nKey.ExtractedColumns)} entries={extractedColumnsEntries} />` between the Test Case Data grid and the Request `CodeViewer`
- [x] 6.2 In `RunMetricDetailPanel` (`apps/ai-dial-admin/src/components/Runs/Details/RunMetricDetailPanel.tsx`): add `extractedColumnsEntries` memo from `getDetailEntries(details?.extractedColumns ?? {})` and render `<AdaptiveValueGrid title={t(RunsI18nKey.ExtractedColumns)} entries={extractedColumnsEntries} />` between the Test Case Data grid and the Request `CodeViewer`
- [x] 6.3 Remove the `console.log(testCaseEntries)` debug statement in `RunMetricDetailPanel` (line 42)

## 7. Quality checks

- [x] 7.1 Run `npx vitest run src/components/Runs` from `apps/ai-dial-admin/` — all tests pass
- [x] 7.2 Run `npm run lint` from repo root — no errors
