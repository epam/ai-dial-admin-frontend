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
- Display `metricInfos` data (reason, verbose_logs, error) with appropriate UX for each
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

### 2. Lightweight `CodeViewer` with regex-based highlighting — not Monaco

**Decision**: Build a custom `<pre>`-based code viewer with regex-based JSON syntax highlighting and a separate line-numbers gutter div.

**Rationale**: Monaco Editor is heavy (~2MB) and designed for editing. The code blocks need to:
- Render instantly (no editor initialization)
- Support multiple instances per panel (request + response)
- Be collapsible with max-height constraint
- Integrate with the fullscreen viewer

A lightweight `<pre>` with regex highlighting (`"key":` → key class, `"value"` → string class, numbers, booleans, null) provides sufficient readability for JSON inspection. Monaco remains available via the JSON toggle for users who need search, selection, or word-wrap controls.

**Highlighting approach**: A `highlightJson()` utility function applies regex replacements to produce HTML with `<span>` classes using existing Tailwind theme tokens (`text-accent-secondary` for keys, `text-accent-tertiary` for strings, `text-accent-primary` for numbers, `text-warning` for booleans, `text-secondary` for null).

### 3. `FullscreenViewer` as a React Portal with context hook

**Decision**: Implement `FullscreenViewer` as a React Portal rendered at the app root, controlled via a `useFullscreenViewer()` hook that exposes `open(title, content, type)` and `close()`.

**Rationale**: The fullscreen viewer is a singleton modal that can be triggered from multiple places (CodeViewer expand button, MetricInfoPanel button, AdaptiveValueGrid for huge values). A context-based approach mirrors the existing `AppContext.sidebar` pattern and avoids prop-drilling.

**Provider placement**: Inside `AppContextProvider` or as a sibling provider in the layout. The viewer state is simple (`{isOpen, title, content, contentType}`).

### 4. `AdaptiveValueRow` type detection is runtime-based

**Decision**: Detect value types at render time to decide truncation and chip display.

**Logic**:
- `typeof value === 'string'` and `value.length > 100` → truncate with expand
- `Array.isArray(parsed)` → show `Array·N` chip + truncated first-item preview
- `typeof parsed === 'object'` → show `Object` chip + truncated JSON preview
- Short strings/numbers → render inline, no truncation

The type detection uses `JSON.parse()` in a try-catch on string values to detect stringified arrays/objects (common in test case data).

### 5. `getMetricGroups()` utility separates values from infos

**Decision**: Create a new `getMetricGroups()` function that returns structured `MetricGroup[]` instead of flat `[key, string][]` tuples.

```typescript
interface MetricGroup {
  title: string;
  metrics: Array<{ key: string; value: number | null; isError: boolean }>;
  infos?: Record<string, unknown>;
  hasError: boolean;
  errorMessage?: string;
}
```

**Rationale**: The current `getDetailNestedEntries()` merges values and infos into flat string tuples, which works for `DetailSection` but loses the structure needed for card rendering and expandable info panels. The new function preserves the grouping. `getDetailNestedEntries()` is kept for backward compatibility.

### 6. Component file organization

**Decision**: Place all new components under `apps/ai-dial-admin/src/components/Runs/Details/` alongside existing detail panel files.

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
├── FullscreenViewer.tsx            (new — or in Common/ if reuse expected)
└── json-highlight.ts               (new utility)
```

### 7. Copy-to-clipboard uses existing notification system

**Decision**: Use the existing `useNotification()` hook (from `NotificationProvider`) for copy feedback instead of building a custom toast.

**Rationale**: The app already has a notification system that `CopyButton` uses. Reusing it keeps UX consistent. The notification message follows the existing pattern: `"${label} ${t(BasicI18nKey.CopiedSuccessfully)}"`.

### 8. i18n for new UI strings

**Decision**: Add new i18n keys to `RunsI18nKey` enum for new labels: `Computed`, `Request`, `Response`, `CopyValue`, `OpenFullscreen`, `MetricInfo`, `Error`.

Existing keys already cover: `Execution`, `TestCaseData`, `GrafanaDetails`.

## Risks / Trade-offs

- **Regex highlighting is approximate** — Edge cases in JSON (escaped quotes in strings, unicode) may highlight incorrectly. Mitigation: The JSON toggle with Monaco is always available for precise viewing. Regex handles 95%+ of real-world evaluation JSON correctly.

- **Multiple expand states per panel** — Each `AdaptiveValueRow`, `CodeViewer`, and `MetricInfoPanel` has independent open/close state. With many rows, this could be many `useState` hooks. Mitigation: Use component-local state (not lifted). React handles this efficiently with functional components.

- **FullscreenViewer context adds to provider stack** — One more context provider. Mitigation: Minimal state surface (`isOpen`, `title`, `content`, `type`). Could alternatively use a simple module-level event emitter, but context is more idiomatic in this codebase.

- **`AnalyticsResult` model change could surface unexpected data** — Adding `requestBody`/`responseBody` to the TypeScript interface means existing code that spreads `AnalyticsResult` objects might pass unexpected data. Mitigation: These are optional fields, and the only consumer is `RunMetricDetailPanel` which renders them explicitly.
