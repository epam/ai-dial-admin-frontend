## ADDED Requirements

### Requirement: ExecutionStatusBar displays execution metadata as horizontal badges
The `ExecutionStatusBar` component SHALL render execution metadata (status, HTTP code, duration, timestamp) as a horizontal row of labeled badges instead of a key-value grid. It SHALL display a colored status pill (`SUCCESS` in green, `FAILED`/`ERROR`/`TIMEOUT` in red), an HTTP status badge (color-coded: 2xx green, 4xx warning, 5xx/other red), a formatted duration value, and a timestamp. An optional Grafana trace link SHALL appear below the status bar when a URL is provided.

#### Scenario: Successful extraction result status bar
- **WHEN** the ExecutionStatusBar receives an ExtractionResult with status SUCCESS, HTTP 200, duration 10500ms, and startedAt timestamp
- **THEN** it renders a green "SUCCESS" pill, "HTTP 200" in green, "Duration 10.5s", "Started {formatted timestamp}", and the Grafana link if grafanaExploreUrl is present

#### Scenario: Failed analytics result status bar
- **WHEN** the ExecutionStatusBar receives an AnalyticsResult with status FAILED, HTTP 500, duration 1200ms, and computedAt timestamp
- **THEN** it renders a red "FAILED" pill, "HTTP 500" in red, "Duration 1.2s", and "Computed {formatted timestamp}"

#### Scenario: Missing optional fields
- **WHEN** execution status or HTTP code is undefined
- **THEN** the corresponding badge displays "—" as the value

---

### Requirement: AdaptiveValueGrid renders key-value pairs with progressive disclosure
The `AdaptiveValueGrid` component SHALL render a list of key-value entries as rows with three columns: key label (fixed width, max 140px), value, and a copy button. Values SHALL be type-aware: arrays display an `Array·N` chip, objects display an `Object` chip. Values exceeding 2 lines of text SHALL be truncated with CSS line-clamp and expand inline on click. The expanded view SHALL display in a monospace font block with a max-height of 300px and scroll. Each row SHALL show a copy button on hover that copies the raw value to clipboard. The fixed key column width ensures values start at a consistent vertical position across all rows.

#### Scenario: Short string value
- **WHEN** a test case data entry has key "answer" and value "nappe formations"
- **THEN** the value renders inline without truncation, and the copy button appears on row hover

#### Scenario: Long string value with truncation
- **WHEN** a test case data entry value exceeds 2 lines of rendered text
- **THEN** the value is truncated with a 2-line CSS line-clamp, and clicking the value expands it inline in a monospace block

#### Scenario: Array value with type chip
- **WHEN** a test case data entry value is a stringified JSON array with 3 items
- **THEN** an "Array·3" type chip is shown before the truncated preview of the first item

#### Scenario: Copy value to clipboard
- **WHEN** the user hovers over a value row and clicks the copy button
- **THEN** the raw value text is copied to clipboard and a success notification is shown

#### Scenario: Collapse expanded value
- **WHEN** the user clicks an expanded value row again
- **THEN** the value collapses back to the truncated 2-line view

---

### Requirement: CodeViewer displays JSON content with syntax highlighting and line numbers
The `CodeViewer` component SHALL render JSON or text content as a collapsible block with a header bar (title, file size, Copy button, Fullscreen button) and a body area with line numbers gutter and syntax-highlighted `<pre>` content. The body SHALL be collapsed by default. When expanded, the code area SHALL have a max-height of 400px with vertical scroll on the wrapper div (so line numbers and code scroll together). JSON syntax highlighting SHALL use regex-based coloring via `highlightJson()` with existing Tailwind theme tokens. The code viewer SHALL NOT use Monaco Editor (Monaco is used only in the FullscreenViewer). The `CodeViewer` is reused for request/response bodies and for individual metricInfos value entries.

#### Scenario: Collapsed code viewer
- **WHEN** the CodeViewer renders with a JSON request body of 1.2 KB
- **THEN** it shows a collapsed header with chevron, "Request" title, "1.2 KB" size badge, Copy and Fullscreen buttons

#### Scenario: Expanding code viewer
- **WHEN** the user clicks the CodeViewer header
- **THEN** the body expands showing line numbers on the left and syntax-highlighted formatted JSON on the right, with a shared scroll container capped at 400px height

#### Scenario: Copy code content
- **WHEN** the user clicks the Copy button on the CodeViewer header
- **THEN** the formatted JSON string is copied to clipboard and a success notification is shown

#### Scenario: Fullscreen code content
- **WHEN** the user clicks the Fullscreen button on the CodeViewer header
- **THEN** the FullscreenViewer modal opens with the same content in Monaco Editor readonly

#### Scenario: Syntax highlighting
- **WHEN** JSON content contains keys, string values, numeric values, booleans, and null
- **THEN** each type is rendered with a distinct color using the project's Tailwind theme tokens

---

### Requirement: MetricCardsGrid displays metric values as visual cards with per-card selection
The `MetricCardsGrid` component SHALL render a flex-wrap grid of `MetricCard` components, one per metric value in a group. Each card SHALL display the metric name, a large monospace numeric value (formatted to 3 decimal places for 0–1 range), and a horizontal progress bar whose fill width corresponds to the value (0% to 100%). Clicking a specific card SHALL select it and show only that metric's `metricInfos` entry in the `MetricInfoPanel` below. The selected card SHALL be visually highlighted with an accent border and alpha background. Clicking the same card again SHALL deselect it and hide the info panel. Cards without associated metricInfos SHALL not be clickable.

#### Scenario: Normal metric values
- **WHEN** metric group "aidial_rag_eval.retrieval" has values {f1: 0.118, mrr: 1, recall: 1, precision: 0.063}
- **THEN** four MetricCards render with values "0.118", "1.000", "1.000", "0.063" and progress bars at 11.8%, 100%, 100%, 6.3% width respectively

#### Scenario: Null metric value (failed individual metric)
- **WHEN** a metric value is null
- **THEN** the card displays "—" as the value and the progress bar is empty (0% width)

#### Scenario: Per-card selection with highlight
- **WHEN** the user clicks the "f1" card in the retrieval group
- **THEN** the "f1" card gets accent border and alpha background, and the MetricInfoPanel shows only f1's metricInfos

#### Scenario: Deselect card
- **WHEN** the user clicks the already-selected "f1" card
- **THEN** the card returns to default styling and the MetricInfoPanel is hidden

---

### Requirement: MetricCard error variant displays failed metrics with error styling
When a metric group has an error (detected via `metricInfos` containing only an `error` key, or all metric values being null with a null error entry), the section title SHALL render in error color, each `MetricCard` SHALL use the error variant styling (error border, error background tint), and the error message from `metricInfos` SHALL display below the cards in error-colored text.

#### Scenario: Failed metric group with connection error
- **WHEN** metric group "aidial_custom_eval.regex" has metricValues `{regex_match: null, error: null}` and metricInfos `{error: "Connection refused..."}`
- **THEN** the section title renders in red, the regex_match card uses error styling with "—" value, and the error message "Connection refused..." renders below in red

#### Scenario: Successful metric group with no errors
- **WHEN** metric group has normal numeric values and no error entries
- **THEN** the section title uses default styling and no error message is displayed

---

### Requirement: MetricInfoPanel shows selected metric's details using CodeViewer blocks
The `MetricInfoPanel` component SHALL render below the `MetricCardsGrid` when a metric card is selected. It SHALL show only the selected metric's `metricInfos` entry (not the entire group's infos). Entries SHALL be grouped by metric key with an uppercase labeled header. Each value (e.g., `highlight`, `json_explanation`) SHALL be rendered as a `CodeViewer` block — same collapsible header, syntax highlighting, line numbers, Copy + Fullscreen buttons as request/response blocks. JSON objects in values SHALL be pretty-printed. The panel SHALL have a max-height of 400px with scroll.

#### Scenario: Select metric card to show info
- **WHEN** the user clicks the "answer_to_ground_truth" card which has metricInfos with `highlight` and `json_explanation` sub-keys
- **THEN** the MetricInfoPanel appears showing the metric key header "ANSWER_TO_GROUND_TRUTH" and two CodeViewer blocks for `highlight` and `json_explanation`

#### Scenario: Deselect metric card
- **WHEN** the user clicks the selected card again
- **THEN** the MetricInfoPanel is hidden

#### Scenario: No metricInfos for selected metric
- **WHEN** a metric card has no associated metricInfos entry
- **THEN** the card is not clickable (no cursor, no selection behavior)

#### Scenario: Fullscreen individual metricInfo value
- **WHEN** the user clicks the Fullscreen button on a `highlight` CodeViewer within MetricInfoPanel
- **THEN** the FullscreenViewer opens with title "groupTitle / metricKey / highlight" and the value content

---

### Requirement: FullscreenViewer displays large content using Monaco Editor readonly
The `FullscreenViewer` SHALL render as a fixed-position modal overlay with a dimmed background. It SHALL display a title, a Copy button, a close button, and the content in a Monaco Editor instance in readonly mode. The Monaco Editor SHALL provide syntax highlighting (auto-detecting JSON vs plaintext), word wrap, code folding, search (`Ctrl+F`), and line numbers. The viewer SHALL close on clicking the close button, pressing Escape, or clicking the dimmed background outside the panel. The viewer SHALL be accessible via a `useFullscreenViewer()` hook, with the `FullscreenViewerProvider` scoped inside each detail panel component (not at the app or view level, because panels render in the sidebar which is outside the main component tree).

#### Scenario: Open fullscreen viewer from CodeViewer
- **WHEN** the user clicks the Fullscreen button on a CodeViewer (request, response, or metricInfo entry)
- **THEN** the FullscreenViewer opens with the title, Monaco Editor with syntax-highlighted content, and Copy button

#### Scenario: Open fullscreen viewer for text content
- **WHEN** the content contains escaped newlines (`\n`) or is plain text
- **THEN** the FullscreenViewer renders the content with newlines properly displayed and auto-detects language as plaintext

#### Scenario: Copy content from fullscreen viewer
- **WHEN** the user clicks Copy in the FullscreenViewer
- **THEN** the full formatted content is copied to clipboard and a success notification is shown

#### Scenario: Close fullscreen viewer via Escape
- **WHEN** the FullscreenViewer is open and the user presses Escape
- **THEN** the viewer closes

#### Scenario: Close fullscreen viewer via backdrop click
- **WHEN** the user clicks the dimmed backdrop area outside the content panel
- **THEN** the viewer closes

---

### Requirement: RunResultDetailPanel uses progressive depth components
The `RunResultDetailPanel` SHALL replace its current `DetailSection` and `DetailRequestAccordion` usage with: `ExecutionStatusBar` for execution metadata, `AdaptiveValueGrid` for test case data entries, and `CodeViewer` for request and response bodies. The JSON toggle to `JsonEditor` (Monaco) SHALL remain unchanged. The panel SHALL wrap its content with `FullscreenViewerProvider`.

#### Scenario: Extraction result panel renders with new components
- **WHEN** the sidebar opens for an ExtractionResult with execution info, test case data, request body, and response body
- **THEN** the panel renders ExecutionStatusBar, AdaptiveValueGrid for test case data, and two CodeViewer blocks for request and response

#### Scenario: JSON toggle still works
- **WHEN** the user toggles JSON Viewer on
- **THEN** the structured view is replaced by the Monaco JsonEditor (existing behavior unchanged)

---

### Requirement: RunMetricDetailPanel uses progressive depth components with per-metric selection and shows request/response
The `RunMetricDetailPanel` SHALL replace its current `DetailSection` usage with: `ExecutionStatusBar` for execution metadata, `AdaptiveValueGrid` for test case data, `MetricCardsGrid` with per-card selection + `MetricInfoPanel` for each metric group, and `CodeViewer` for request and response bodies. The `AnalyticsResult` model SHALL include optional `requestBody` and `responseBody` fields. The JSON toggle to `JsonEditor` SHALL remain unchanged. The panel SHALL wrap its content with `FullscreenViewerProvider`.

#### Scenario: Analytics panel renders request and response
- **WHEN** the sidebar opens for an AnalyticsResult that includes requestBody and responseBody
- **THEN** two CodeViewer blocks for request and response render below the metric sections

#### Scenario: Analytics panel without request/response
- **WHEN** the AnalyticsResult has no requestBody or responseBody
- **THEN** no CodeViewer blocks are rendered (graceful degradation)

#### Scenario: Per-metric selection in analytics panel
- **WHEN** the user clicks a specific metric card in a group
- **THEN** only that metric's metricInfos are shown in the MetricInfoPanel below, rendered as CodeViewer blocks

---

### Requirement: getMetricGroups utility structures metric data for card rendering
The `getMetricGroups()` utility function SHALL accept `metricValues` and optional `metricInfos` and return an array of `MetricGroup` objects. Each group SHALL contain the group title, an array of metric key-value pairs (with null detection for failed metrics), the associated metricInfos if present, and error state detection. A group SHALL be marked as errored (`hasError=true`) if either: (a) the group has only `{error: null}` in values and metricInfos has an error string, OR (b) all metric values in the group are null (defensive catch for partial failures without explicit error key). The error message SHALL be sourced from metricInfos when available.

#### Scenario: Normal metric group
- **WHEN** metricValues has `{"aidial_rag_eval.retrieval": {"f1": 0.118, "mrr": 1}}` with no errors
- **THEN** getMetricGroups returns one group with title "aidial_rag_eval.retrieval", 2 metrics with numeric values, hasError=false

#### Scenario: Failed metric group with error in metricInfos
- **WHEN** metricValues has `{"custom_eval": {"score": null, "error": null}}` and metricInfos has `{"custom_eval": {"error": "Connection refused"}}`
- **THEN** getMetricGroups returns one group with hasError=true, errorMessage="Connection refused", and metrics with null values

#### Scenario: All-null values without explicit error key
- **WHEN** metricValues has `{"group": {"score": null, "confidence": null}}` with no error key and no metricInfos
- **THEN** getMetricGroups returns one group with hasError=true, errorMessage=undefined, and metrics with null values

#### Scenario: Metric group with sub-entry infos
- **WHEN** metricInfos has `{"retrieval": {"f1": {"reason": "Low overlap", "verbose_logs": "..."}}}` for a group
- **THEN** the group's infos field contains the nested object for rendering in MetricInfoPanel
