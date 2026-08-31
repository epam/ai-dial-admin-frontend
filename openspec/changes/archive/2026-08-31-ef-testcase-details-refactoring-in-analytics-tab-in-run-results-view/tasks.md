## 1. Model & Utilities

- [x] 1.1 Add `requestBody?: Record<string, unknown>` and `responseBody?: Record<string, unknown>` to `AnalyticsResult` interface in `apps/ai-dial-admin/src/models/evaluation/run.ts`
- [x] 1.2 Add new i18n keys to `RunsI18nKey` enum in `apps/ai-dial-admin/src/constants/i18n.ts` and `apps/ai-dial-admin/src/locales/en.ts`: `Computed`, `Request`, `Response`, `CopyValue`, `OpenFullscreen`, `MetricInfo`
- [x] 1.3 Create `json-highlight.ts` utility in `apps/ai-dial-admin/src/components/Runs/Details/` with `highlightJson(json: string): string` and `generateLineNumbers(text: string): string` functions
- [x] 1.4 Create `getMetricGroups()` utility function in `apps/ai-dial-admin/src/components/Runs/View/utils.ts` returning `MetricGroup[]` with paired values + infos per group and error detection
- [x] 1.5 Write unit tests for `getMetricGroups()` in `apps/ai-dial-admin/src/components/Runs/View/tests/utils.spec.ts` covering normal groups, failed groups with error fallback, and groups with nested metricInfos

## 2. FullscreenViewer (shared singleton)

- [x] 2.1 Create `FullscreenViewerContext` and `FullscreenViewerProvider` with `useFullscreenViewer()` hook exposing `open(title, content, contentType)` and `close()` — file: `apps/ai-dial-admin/src/components/Runs/Details/FullscreenViewer.tsx`
- [x] 2.2 Implement `FullscreenViewer` component as a React Portal: dimmed backdrop, centered panel (85vw x 80vh), title header, Copy button, close button (X / Escape / backdrop click), line numbers gutter, monospace `<pre>` content with syntax highlighting for JSON type
- [x] 2.3 Integrate `FullscreenViewerProvider` into the Runs view layout (wrap content in provider, render viewer portal)

## 3. Core Components — Foundation

- [x] 3.1 Create `ExecutionStatusBar` component in `apps/ai-dial-admin/src/components/Runs/Details/ExecutionStatusBar.tsx` — horizontal badges for status pill, HTTP code, duration, timestamp; optional Grafana link; accepts extraction or analytics execution data via props
- [x] 3.2 Create `AdaptiveValueRow` component in `apps/ai-dial-admin/src/components/Runs/Details/AdaptiveValueRow.tsx` — single row with key, type-aware value (TypeChip for arrays/objects, 2-line truncation, click-to-expand inline in monospace block), copy-on-hover button using `useNotification()`
- [x] 3.3 Create `AdaptiveValueGrid` component in `apps/ai-dial-admin/src/components/Runs/Details/AdaptiveValueGrid.tsx` — renders section title with divider line and a list of `AdaptiveValueRow` components from `[key, value][]` entries
- [x] 3.4 Create `CodeViewer` component in `apps/ai-dial-admin/src/components/Runs/Details/CodeViewer.tsx` — collapsible block with header (chevron + title + size badge + Copy + Fullscreen buttons), body with line numbers gutter and syntax-highlighted `<pre>` content (max-height 200px); uses `json-highlight.ts` and `useFullscreenViewer()`

## 4. Metric Components

- [x] 4.1 Create `MetricCard` component in `apps/ai-dial-admin/src/components/Runs/Details/MetricCard.tsx` — single card with metric name, large monospace value (3 decimal places), progress bar (0-1 range); error variant with red styling and "—" value
- [x] 4.2 Create `MetricCardsGrid` component in `apps/ai-dial-admin/src/components/Runs/Details/MetricCardsGrid.tsx` — flex-wrap container of `MetricCard` components from a `MetricGroup`; click handler to toggle info panel
- [x] 4.3 Create `MetricInfoPanel` component in `apps/ai-dial-admin/src/components/Runs/Details/MetricInfoPanel.tsx` — expandable panel using `AdaptiveValueGrid` pattern for metricInfos key-value pairs; "Open in fullscreen viewer" button for large values; conditionally rendered based on toggle state

## 5. Panel Rewiring

- [x] 5.1 Refactor `RunResultDetailPanel.tsx` to use `ExecutionStatusBar` (replacing Execution `DetailSection`), `AdaptiveValueGrid` (replacing TestCaseData `DetailSection`), and `CodeViewer` x2 (replacing `DetailRequestAccordion` for request and response); keep JSON toggle to `JsonEditor` unchanged
- [x] 5.2 Refactor `RunMetricDetailPanel.tsx` to use `ExecutionStatusBar`, `AdaptiveValueGrid` for test case data, `MetricCardsGrid` + `MetricInfoPanel` per metric group (using `getMetricGroups()`), and `CodeViewer` x2 for request and response (new); keep JSON toggle to `JsonEditor` unchanged

## 6. Testing

- [x] 6.1 Write component tests for `ExecutionStatusBar` — success/failed states, missing fields, Grafana link presence
- [x] 6.2 Write component tests for `AdaptiveValueGrid` / `AdaptiveValueRow` — short values, truncation, expand/collapse, copy action, type chip rendering
- [x] 6.3 Write component tests for `CodeViewer` — collapsed/expanded states, syntax highlighting output, copy action, fullscreen trigger
- [x] 6.4 Write component tests for `MetricCard` / `MetricCardsGrid` — normal values, null values, error variant, card click toggle
- [x] 6.5 Write component tests for `MetricInfoPanel` — toggle visibility, truncated values, fullscreen button
- [x] 6.6 Write component tests for `FullscreenViewer` — open/close, Escape key, backdrop click, copy action, JSON vs text content types

## 7. Quality Checks

- [x] 7.1 Run `npm run lint` and fix any linting errors
- [x] 7.2 Run `npm run format:write` to apply formatting
- [x] 7.3 Run `npm run test` and ensure all tests pass (existing + new)
- [x] 7.4 Run `npm run build` and verify no build errors
