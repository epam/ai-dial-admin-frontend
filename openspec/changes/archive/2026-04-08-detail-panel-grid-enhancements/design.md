## Context

`AdaptiveValueGrid` is a shared section component used in both `RunResultDetailPanel` and `RunMetricDetailPanel` to render key-value data from `testCaseData`. Currently it always renders all entries, the value type is always `string`, and `extractedColumns` is unused in both panels.

Three gaps to close:
1. No way to collapse the section — panels can become long when many entries exist.
2. Array-valued fields (common in `extractedColumns` where regex/JSONPath rules extract multiple matches) are coerced to a comma-joined string via `String(val)`, losing structure.
3. `extractedColumns` is already on the `ResultDto` model but never surfaced in the detail panel UI.

## Goals / Non-Goals

**Goals:**
- `AdaptiveValueGrid` always shows a collapsible title toggle (starts collapsed, no new props).
- `getDetailEntries` returns `[string, string | string[]][]`; array values render as stacked lines in `AdaptiveValueRow`.
- Both detail panels show an "Extracted Columns" `AdaptiveValueGrid` between Test Case Data and Request/Response.

**Non-Goals:**
- Collapsible behaviour is not opt-in/opt-out — no new props on `AdaptiveValueGrid`.
- No changes to `getDetailNestedEntries` (used for legacy metric detail, not rendered via `AdaptiveValueGrid`).
- No changes to the AG Grid column builders (`getInputColumns`, `getExtractedColumns` in `utils.ts`).
- No changes to `AdaptiveValueRow`'s existing JSON expand/collapse logic for single string values.

## Decisions

### D1 — Inline toggle state in `AdaptiveValueGrid`, not `Accordion` wrapper

**Decision**: Add `useState(true)` (isCollapsed) + chevron button directly in `AdaptiveValueGrid` rather than wrapping in the existing `Accordion` component.

**Rationale**: `Accordion` ships with `border border-primary rounded` container styling designed for card-like sections. `AdaptiveValueGrid` is a borderless inline section. Using `Accordion` requires overriding `containerClassName`, `containerPaddingClassName`, and `contentPaddingClassName` to neutralise all its defaults — effectively fighting the component. The inline approach is 5 lines of state and a chevron icon, directly matching the existing `section` layout.

**Alternative considered**: Wrapping with `Accordion border-0` overrides (as `DetailRequestAccordion` does). Rejected because those overrides are fragile and the visual weight of accordion borders doesn't suit data-section headers.

**Icon**: `IconChevronRight` (collapsed) / `IconChevronDown` (expanded) from `@tabler/icons-react`, consistent with the existing `Accordion` component's icon choice.

### D2 — Widen value type to `string | string[]` at every layer

**Decision**: Change the entry tuple type from `[string, string]` to `[string, string | string[]]` in `AdaptiveValueGrid.Props`, and update `AdaptiveValueRow.Props.value` to `string | string[]`.

**Rationale**: Keeping the type as `string` would require either pre-joining arrays (losing information) or passing pre-serialised JSON strings (forcing `AdaptiveValueRow` to re-detect them via `parseValue`, which already handles JSON arrays but presents them as "Array·N" with expand — not the desired stacked-lines UX).

**`getDetailEntries` detection logic**: `Array.isArray(val) && val.every(v => typeof v === 'string')` → return as `string[]`. All other non-string values continue to use `String(val)` (e.g. numbers, booleans, objects).

### D3 — Array items rendered as stacked `<span>` elements, not chips

**Decision**: In `AdaptiveValueRow`, when `value` is `string[]`, render a `<div className="flex flex-col gap-1">` containing one `<span>` per item.

**Rationale**: Items can be arbitrary strings of variable length. Chip/pill rendering wraps unpredictably for longer strings. Stacked lines give each item its own clear row, matching how the rest of the value column renders text.

**`parseValue` is not called** for `string[]` values — no JSON detection needed since the array is already resolved. The copy button in `AdaptiveValueRow` will join items with `\n` for clipboard.

### D4 — Extracted Columns section placement

**Decision**: Render Extracted Columns `AdaptiveValueGrid` immediately after the Test Case Data grid and before `CodeViewer` for Request/Response in both panels.

**Rationale**: `extractedColumns` contains values extracted *from* the response — logically they sit between test case input (Test Case Data) and the raw network exchange (Request/Response). Users inspecting a failed test scan in input→output→raw order.

### D5 — i18n key `RunsI18nKey.ExtractedColumns`

**Decision**: Add `ExtractedColumns = 'Runs.ExtractedColumns'` to `RunsI18nKey` enum and `'Extracted Columns'` to `en.ts`.

**Rationale**: Consistent with existing i18n patterns for all user-visible strings in this component family (`TestCaseData`, `Request`, `Response`, etc.).

## Risks / Trade-offs

- **Collapsed by default is a UX change** for the `TestCaseData` section — users who relied on the section being open will need to click to expand. Since the section is now always collapsible, this is the expected behaviour. Risk is low as it's a detail panel not a primary workflow.
- **Type widening breaks existing `[string, string]` consumers** — the only consumers of `getDetailEntries` are `RunResultDetailPanel` and `RunMetricDetailPanel`, both of which pass the result directly to `AdaptiveValueGrid`. Since `AdaptiveValueGrid.entries` also widens, the change is self-consistent.
- **Tests need updating** — `AdaptiveValueGrid.spec.tsx` tests `entries: [string, string][]` directly and checks that content is visible on render. After the change, content starts collapsed; tests must click to expand before asserting row content.
