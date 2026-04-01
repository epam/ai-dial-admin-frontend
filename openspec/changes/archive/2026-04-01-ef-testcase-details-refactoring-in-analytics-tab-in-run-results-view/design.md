## Context

The Run Results view has two sidebar detail panels — `RunResultDetailPanel` (Extraction Result tab) and `RunMetricDetailPanel` (Analytics tab). Both render inside the app's sidebar system via `AppContext.showSidebar()` at 750px width. They currently use:

- `DetailSection`: CSS Grid (`auto 1fr`) key-value display with `break-all` values. No truncation, no copy, no type hints.
- `DetailRequestAccordion`: Wraps `Accordion` component with a plain `<pre>` tag for JSON. No syntax highlighting, no line numbers.
- `JsonEditor` (Monaco): Full JSON toggle view — this stays unchanged.

The `AnalyticsResult` TypeScript interface omits `requestBody` and `responseBody` even though the BE's `EvalSummaryDetailResponseDto` returns them via the `GET /analytics/eval-summaries/{id}` endpoint.

A working prototype at `sandbox/ui-ux-prototyping-with-admin-styles/prototype.html` demonstrates all proposed interactions.

## Goals / Non-Goals

**Goals:**
- Replace `DetailSection` usage in detail panels with purpose-built components that support progressive disclosure (scan → inspect → deep-dive)
- Add request/response display to the Analytics detail panel
- Display `metricInfos` data (reason, verbose_logs, highlight, json_explanation, error) with per-metric selection UX
- Provide fullscreen viewing for large JSON/text content
- Keep existing `DetailSection` and `DetailRequestAccordion` untouched for other consumers

**Non-Goals:**
- Changing AG Grid table columns or row rendering
- Modifying the sidebar system (`AppContext`, `Sidebar` component)
- Replacing Monaco `JsonEditor` for the JSON toggle view
- Backend API changes
- Adding search/filter within the detail panel content

## Decisions

### 1. New components alongside existing — not extending `DetailSection`

**Decision**: Create new components (`ExecutionStatusBar`, `AdaptiveValueGrid`, `CodeViewer`, `MetricCardsGrid`, `MetricInfoPanel`, `FullscreenViewer`) rather than adding props to `DetailSection`.

**Rationale**: `DetailSection` is a simple grid renderer with no interaction patterns. The new components need expand/collapse state, hover-reveal copy buttons, type detection logic, and fullscreen integration. Bolting these onto `DetailSection` would violate single-responsibility and risk breaking other consumers.

**Alternatives considered**: Extending `DetailSection` with `truncatable`, `copyable`, `expandable` props — rejected because the interaction model is fundamentally different (click-to-expand rows, not just display).

### 2. Two-tier rendering: lightweight CodeViewer inline, Monaco in fullscreen

**Decision**: Use a custom `<pre>`-based `CodeViewer` for inline collapsible blocks (request, response, metricInfo entries), and Monaco Editor readonly for the `FullscreenViewer` modal.

**Rationale**: Inline blocks need to render instantly, support multiple instances per panel, and be collapsible with a max-height constraint. A lightweight `<pre>` with regex-based JSON syntax highlighting (`highlightJson()`) handles this well. However, the fullscreen viewer displays large content where Monaco's features — proper syntax highlighting, word wrap, folding, `Ctrl+F` search, correct `\n` handling — provide significantly better UX. The `json-highlight.ts` utility handles inline highlighting with `<span>` classes using existing Tailwind theme tokens.

**Alternatives considered**: Monaco everywhere (too heavy for inline blocks with 4+ instances), custom `<pre>` everywhere (failed to handle `\n` and large text properly in fullscreen).

### 3. `FullscreenViewer` provider scoped inside each detail panel

**Decision**: Wrap `FullscreenViewerProvider` inside `RunResultDetailPanel` and `RunMetricDetailPanel`, not at the app or view level.

**Rationale**: The detail panels render inside the `Sidebar` component, which is a sibling of the main content area at the app layout level (rendered via `AppContext.showSidebar()`). The provider in `RunView` was outside the sidebar's React tree, causing `useFullscreenViewer must be used within FullscreenViewerProvider` errors. Scoping the provider inside each panel ensures it wraps all components that need it regardless of where the panel is rendered.

**Alternatives considered**: Provider in `RunView` (crashed — sidebar renders outside that tree), provider at app layout level (too broad, pollutes the global provider stack for a feature-specific concern).

### 4. `AdaptiveValueRow` type detection and fixed key column

**Decision**: Detect value types at render time via `JSON.parse()` try-catch, and use a fixed key column width of `minmax(70px, 140px)`.

**Logic**:
- `typeof value === 'string'` and `value.length > 100` → truncate with expand
- `Array.isArray(parsed)` → show `Array·N` chip + truncated first-item preview
- `typeof parsed === 'object'` → show `Object` chip + truncated JSON preview
- Short strings/numbers → render inline, no truncation

The fixed key column (140px max) ensures values start at a consistent vertical line across all rows. Keys longer than 140px wrap instead of pushing values rightward.

**Alternatives considered**: `auto` key column (caused values to start at different positions — looked messy in real data).

### 5. Per-metric card selection for metricInfos

**Decision**: Clicking a specific `MetricCard` shows only that metric's `metricInfos` entry. The selected card gets an accent highlight (`border-accent-primary bg-accent-primary-alpha`). Clicking it again deselects.

**State**: `selectedMetric: { group: string; key: string } | null` in `RunMetricDetailPanel`, passed down as `selectedMetricKey` to `MetricCardsGrid` and used to filter `group.infos[selectedMetric.key]` for `MetricInfoPanel`.

**Rationale**: The original group-level expand showed all metrics' infos at once (e.g., 3 metrics × 2 fields = 6 entries), pushing request/response code viewers off-screen. Per-metric selection keeps the info panel small, request/response visible, and makes it clear which metric's details are shown.

**Alternatives considered**: Group-level toggle (too much content at once, hid request/response), multi-select (more complex, single selection covers the main use case).

### 6. MetricInfoPanel reuses CodeViewer for each value

**Decision**: Each metricInfos entry (e.g., `highlight`, `json_explanation`) renders as a `CodeViewer` block inside `MetricInfoPanel`, giving it the same look as request/response blocks — collapsible header, syntax highlighting, line numbers, Copy + Fullscreen buttons.

**Rationale**: MetricInfos values are often JSON objects or large text. Using the same `CodeViewer` component provides visual consistency with request/response, and each value gets its own Fullscreen button for independent deep-dive.

**Alternatives considered**: Custom `<pre>` blocks (looked different from request/response — user flagged inconsistency), `AdaptiveValueGrid` rows (poor for structured JSON content).

### 7. CodeViewer scrolling: shared container at 400px

**Decision**: The `CodeViewer` body uses `max-h-[400px] overflow-auto` on the wrapper div (not the `<pre>`), so line numbers and code scroll together.

**Rationale**: Original design had `max-h-[200px]` on only the `<pre>`, causing line numbers to render at full height while code was clipped — they got out of sync. 200px was also too small for a 750px sidebar. Moving the constraint to the wrapper and increasing to 400px fixed both issues.

### 8. Component file organization

**Decision**: All new components under `apps/ai-dial-admin/src/components/Runs/Details/` alongside existing detail panel files.

```
Runs/Details/
├── RunResultDetailPanel.tsx        (modified)
├── RunMetricDetailPanel.tsx        (modified)
├── DetailSection.tsx               (unchanged)
├── DetailRequestAccordion.tsx      (unchanged — deprecated in favor of CodeViewer)
├── ExecutionStatusBar.tsx          (new)
├── AdaptiveValueGrid.tsx           (new)
├── AdaptiveValueRow.tsx            (new)
├── CodeViewer.tsx                  (new)
├── MetricCardsGrid.tsx             (new)
├── MetricCard.tsx                  (new)
├── MetricInfoPanel.tsx             (new)
├── FullscreenViewer.tsx            (new)
├── json-highlight.ts               (new utility)
└── tests/
    ├── ExecutionStatusBar.spec.tsx  (new)
    ├── AdaptiveValueGrid.spec.tsx   (new)
    ├── CodeViewer.spec.tsx          (new)
    ├── MetricCard.spec.tsx          (new)
    ├── MetricInfoPanel.spec.tsx     (new)
    └── FullscreenViewer.spec.tsx    (new)
```

### 9. Copy-to-clipboard uses existing notification system

**Decision**: Use the existing `useNotification()` hook (from `NotificationProvider`) for copy feedback instead of building a custom toast.

**Rationale**: The app already has a notification system that `CopyButton` uses. Reusing it keeps UX consistent. The notification message follows the existing pattern: `"${label} ${t(BasicI18nKey.CopiedSuccessfully)}"`.

### 10. i18n for new UI strings

**Decision**: Add new i18n keys to `RunsI18nKey` enum: `Computed`, `Request`, `Response`, `CopyValue`, `OpenFullscreen`, `MetricInfo`.

Existing keys already cover: `Execution`, `TestCaseData`, `GrafanaDetails`.

## Risks / Trade-offs

- **Regex highlighting is approximate** — Edge cases in JSON (escaped quotes in strings, unicode) may highlight incorrectly in inline CodeViewer blocks. Mitigation: The fullscreen viewer uses Monaco for precise highlighting, and the JSON toggle is always available.

- **Monaco in fullscreen adds bundle weight** — Monaco is already loaded for the JSON toggle, so the incremental cost is minimal (just a new `<Editor>` instance on demand).

- **Multiple expand states per panel** — Each `AdaptiveValueRow`, `CodeViewer`, and metric card selection has independent state. Mitigation: Component-local state, React handles efficiently.

- **FullscreenViewer provider per panel** — Two providers exist (one per panel type) rather than a singleton. Mitigation: Only one panel is open at a time in the sidebar, so only one provider is active.

- **`AnalyticsResult` model change could surface unexpected data** — Adding `requestBody`/`responseBody` to the TypeScript interface means existing code that spreads `AnalyticsResult` objects might pass unexpected data. Mitigation: These are optional fields, and the only consumer is `RunMetricDetailPanel` which renders them explicitly.
