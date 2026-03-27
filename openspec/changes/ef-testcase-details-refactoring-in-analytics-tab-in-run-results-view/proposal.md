## Why

The Run Results detail panels (Extraction Result and Analytics sidebars) display test case execution data in flat key-value grids (`DetailSection`) that cannot handle the variety and volume of real evaluation data. Long text values are broken with `break-all` but users have no way to view the full content. JSON request/response bodies render as plain `<pre>` without syntax highlighting. Metric values appear as flat text without visual weight. `metricInfos` (reason, verbose_logs) are rendered as additional flat rows without distinction. The Analytics panel is also missing `requestBody`/`responseBody` — the BE already returns them in `EvalSummaryDetailResponseDto`, but the FE `AnalyticsResult` TypeScript interface omits these fields.

A working prototype at `sandbox/ui-ux-prototyping-with-admin-styles/prototype.html` demonstrates the "Progressive Depth" design: brief and scannable by default, with click-to-expand for full content and a fullscreen viewer for huge data.

## What Changes

- **New `ExecutionStatusBar` component** — replaces the Execution `DetailSection` with a horizontal strip of status pill, HTTP badge, duration, and timestamp. Includes optional Grafana trace link.
- **New `AdaptiveValueGrid` component** — replaces `DetailSection` for test case data. Supports type-aware rendering (TypeChip badges for arrays/objects), 2-line CSS truncation with click-to-expand inline, and copy-on-hover per value row.
- **New `CodeViewer` component** — lightweight replacement for `DetailRequestAccordion`. Collapsible block with regex-based JSON syntax highlighting, line numbers gutter, file size badge, Copy and Fullscreen action buttons. Uses `<pre>` — not Monaco.
- **New `MetricCardsGrid` / `MetricCard` components** — replaces flat `DetailSection` for metric values. Flex-wrap grid of cards with metric name, large monospace value, and progress bar (0–1 range). Click toggles `MetricInfoPanel`.
- **New `MetricInfoPanel` component** — expandable panel for `metricInfos` data (reason, verbose_logs, confidence). Reuses `AdaptiveValueGrid` truncation/expand pattern. Includes "Open in fullscreen viewer" for huge values.
- **Failed metric error variant** — `MetricCard` error variant with red styling + error message row. Section title in error color.
- **New `FullscreenViewer` component** — modal portal for large JSON or text content. Line numbers, syntax highlighting (JSON) or plain text, Copy button, close via X / Escape / click-outside.
- **`AnalyticsResult` model update** — add `requestBody?` and `responseBody?` fields (BE already returns them).
- **New `getMetricGroups()` utility** — returns `MetricGroup[]` with paired values + infos per group, error detection. Used in `RunMetricDetailPanel` instead of `getDetailNestedEntries()` (old function kept for backward compat).
- **`RunResultDetailPanel` rewiring** — uses ExecutionStatusBar, AdaptiveValueGrid, CodeViewer×2, FullscreenViewer.
- **`RunMetricDetailPanel` rewiring** — uses ExecutionStatusBar, AdaptiveValueGrid, MetricCardsGrid + MetricInfoPanel per group, CodeViewer×2 (new for analytics), FullscreenViewer.

## Capabilities

### New Capabilities
- `progressive-depth-detail-panel`: Core set of components (ExecutionStatusBar, AdaptiveValueGrid, CodeViewer, MetricCardsGrid, MetricCard, MetricInfoPanel, FullscreenViewer) implementing the progressive disclosure pattern for test case evaluation result details.

### Modified Capabilities
<!-- No existing specs are affected — this change introduces new components alongside existing ones. DetailSection, DetailRequestAccordion, and Accordion remain untouched. -->

## Impact

- **Components affected**: `RunResultDetailPanel.tsx`, `RunMetricDetailPanel.tsx` — rewired to use new components.
- **Model affected**: `apps/ai-dial-admin/src/models/evaluation/run.ts` — `AnalyticsResult` interface extended with `requestBody` and `responseBody`.
- **New files**: ~8–10 new component files under `apps/ai-dial-admin/src/components/Runs/Details/` plus a utility update in `apps/ai-dial-admin/src/components/Runs/View/utils.ts`.
- **No API changes**: BE already returns all needed data.
- **No breaking changes**: Existing `DetailSection` and `DetailRequestAccordion` are untouched; other consumers unaffected.
- **Dependencies**: Uses existing project libraries only — Tailwind CSS, @tabler/icons-react, @epam/ai-dial-ui-kit components (DialSwitch, DialCloseButton, DialLinkButton). No new npm packages.
- **Test impact**: New unit tests for `getMetricGroups()` utility and component tests for the key new components. Existing `utils.spec.ts` tests unaffected (old functions preserved).
