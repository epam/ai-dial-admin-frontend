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
The `AdaptiveValueGrid` component SHALL render a list of key-value entries as rows with three columns: key label, value, and a copy button. Values SHALL be type-aware: arrays display an `Array·N` chip, objects display an `Object` chip. Values exceeding 2 lines of text SHALL be truncated with CSS line-clamp and expand inline on click. The expanded view SHALL display in a monospace font block with a max-height of 300px and scroll. Each row SHALL show a copy button on hover that copies the raw value to clipboard.

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
The `CodeViewer` component SHALL render JSON content as a collapsible block with a header bar (title, file size, Copy button, Fullscreen button) and a body area with line numbers gutter and syntax-highlighted `<pre>` content. The body SHALL be collapsed by default. When expanded, the code area SHALL have a max-height of 200px with vertical scroll. JSON syntax highlighting SHALL color keys, strings, numbers, booleans, and null values using existing Tailwind theme tokens. The code viewer SHALL NOT use Monaco Editor.

#### Scenario: Collapsed code viewer
- **WHEN** the CodeViewer renders with a JSON request body of 1.2 KB
- **THEN** it shows a collapsed header with chevron, "Request" title, "1.2 KB" size badge, Copy and Fullscreen buttons

#### Scenario: Expanding code viewer
- **WHEN** the user clicks the CodeViewer header
- **THEN** the body expands showing line numbers on the left and syntax-highlighted formatted JSON on the right, capped at 200px height

#### Scenario: Copy code content
- **WHEN** the user clicks the Copy button on the CodeViewer header
- **THEN** the formatted JSON string is copied to clipboard and a success notification is shown

#### Scenario: Fullscreen code content
- **WHEN** the user clicks the Fullscreen button on the CodeViewer header
- **THEN** the FullscreenViewer modal opens with the same content at full viewport size

#### Scenario: Syntax highlighting
- **WHEN** JSON content contains keys, string values, numeric values, booleans, and null
- **THEN** each type is rendered with a distinct color using the project's Tailwind theme tokens

---

### Requirement: MetricCardsGrid displays metric values as visual cards with progress bars
The `MetricCardsGrid` component SHALL render a flex-wrap grid of `MetricCard` components, one per metric value in a group. Each card SHALL display the metric name, a large monospace numeric value (formatted to 3 decimal places for 0–1 range), and a horizontal progress bar whose fill width corresponds to the value (0% to 100%). Clicking any card in the group SHALL toggle the `MetricInfoPanel` for that group.

#### Scenario: Normal metric values
- **WHEN** metric group "aidial_rag_eval.retrieval" has values {f1: 0.118, mrr: 1, recall: 1, precision: 0.063}
- **THEN** four MetricCards render with values "0.118", "1.000", "1.000", "0.063" and progress bars at 11.8%, 100%, 100%, 6.3% width respectively

#### Scenario: Null metric value (failed individual metric)
- **WHEN** a metric value is null
- **THEN** the card displays "—" as the value and the progress bar is empty (0% width)

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

### Requirement: MetricInfoPanel shows expandable metricInfos details
The `MetricInfoPanel` component SHALL render below the `MetricCardsGrid` when toggled by clicking a metric card. It SHALL display key-value pairs from the group's `metricInfos` data using the `AdaptiveValueGrid` truncation/expand pattern. For large values (verbose_logs, detailed explanations), an "Open in fullscreen viewer" button SHALL appear that opens the content in the `FullscreenViewer`.

#### Scenario: Toggle metric info visibility
- **WHEN** the user clicks any MetricCard in a group that has metricInfos
- **THEN** the MetricInfoPanel expands below the cards showing the info entries

#### Scenario: Collapse metric info
- **WHEN** the user clicks a MetricCard again while the MetricInfoPanel is visible
- **THEN** the MetricInfoPanel collapses and is hidden

#### Scenario: Large metricInfo value with fullscreen
- **WHEN** a metricInfos entry "verbose_logs" contains text exceeding 300px of rendered content
- **THEN** the value is truncated with expand-on-click, and an "Open in fullscreen viewer" button is shown

#### Scenario: No metricInfos available
- **WHEN** a metric group has no metricInfos data
- **THEN** clicking a MetricCard does nothing (no empty panel shown)

---

### Requirement: FullscreenViewer displays large content in a modal overlay
The `FullscreenViewer` SHALL render as a fixed-position modal overlay with a dimmed background. It SHALL display a title, a Copy button, a close button, a line numbers gutter, and the content in monospace font. For JSON content, syntax highlighting SHALL be applied. The viewer SHALL close on clicking the close button, pressing Escape, or clicking the dimmed background outside the panel. The viewer SHALL be a singleton accessible via a `useFullscreenViewer()` hook.

#### Scenario: Open fullscreen viewer from CodeViewer
- **WHEN** the user clicks the Fullscreen button on a CodeViewer
- **THEN** the FullscreenViewer opens with the title (e.g., "Request"), syntax-highlighted JSON content, and line numbers

#### Scenario: Open fullscreen viewer from MetricInfoPanel
- **WHEN** the user clicks "Open in fullscreen viewer" in a MetricInfoPanel
- **THEN** the FullscreenViewer opens with the title (e.g., "verbose_logs — aidial_rag_eval.retrieval") and plain text content with line numbers

#### Scenario: Copy content from fullscreen viewer
- **WHEN** the user clicks Copy in the FullscreenViewer
- **THEN** the full content is copied to clipboard and a success notification is shown

#### Scenario: Close fullscreen viewer via Escape
- **WHEN** the FullscreenViewer is open and the user presses Escape
- **THEN** the viewer closes

#### Scenario: Close fullscreen viewer via backdrop click
- **WHEN** the user clicks the dimmed backdrop area outside the content panel
- **THEN** the viewer closes

---

### Requirement: RunResultDetailPanel uses progressive depth components
The `RunResultDetailPanel` SHALL replace its current `DetailSection` and `DetailRequestAccordion` usage with: `ExecutionStatusBar` for execution metadata, `AdaptiveValueGrid` for test case data entries, and `CodeViewer` for request and response bodies. The JSON toggle to `JsonEditor` (Monaco) SHALL remain unchanged. The panel layout and sidebar integration SHALL remain the same.

#### Scenario: Extraction result panel renders with new components
- **WHEN** the sidebar opens for an ExtractionResult with execution info, test case data, request body, and response body
- **THEN** the panel renders ExecutionStatusBar, AdaptiveValueGrid for test case data, and two CodeViewer blocks for request and response

#### Scenario: JSON toggle still works
- **WHEN** the user toggles JSON Viewer on
- **THEN** the structured view is replaced by the Monaco JsonEditor (existing behavior unchanged)

---

### Requirement: RunMetricDetailPanel uses progressive depth components and shows request/response
The `RunMetricDetailPanel` SHALL replace its current `DetailSection` usage with: `ExecutionStatusBar` for execution metadata, `AdaptiveValueGrid` for test case data, `MetricCardsGrid` + `MetricInfoPanel` for each metric group, and `CodeViewer` for request and response bodies. The `AnalyticsResult` model SHALL be updated to include optional `requestBody` and `responseBody` fields. The JSON toggle to `JsonEditor` SHALL remain unchanged.

#### Scenario: Analytics panel renders request and response
- **WHEN** the sidebar opens for an AnalyticsResult that includes requestBody and responseBody
- **THEN** two CodeViewer blocks for request and response render below the metric sections

#### Scenario: Analytics panel without request/response
- **WHEN** the AnalyticsResult has no requestBody or responseBody
- **THEN** no CodeViewer blocks are rendered (graceful degradation)

#### Scenario: Metric groups render as cards
- **WHEN** the AnalyticsResult has metricValues with 2 groups and metricInfos with details
- **THEN** each group renders as a MetricCardsGrid with cards, and MetricInfoPanel is available on card click

---

### Requirement: getMetricGroups utility structures metric data for card rendering
The `getMetricGroups()` utility function SHALL accept `metricValues` and optional `metricInfos` and return an array of `MetricGroup` objects. Each group SHALL contain the group title, an array of metric key-value pairs (with null detection for failed metrics), the associated metricInfos if present, and error state detection. Error detection SHALL follow the same logic as the existing `getDetailNestedEntries`: if a group has only `{error: null}` in values and metricInfos has an error string, the group is marked as errored with the info error message.

#### Scenario: Normal metric group
- **WHEN** metricValues has `{"aidial_rag_eval.retrieval": {"f1": 0.118, "mrr": 1}}` with no errors
- **THEN** getMetricGroups returns one group with title "aidial_rag_eval.retrieval", 2 metrics with numeric values, hasError=false

#### Scenario: Failed metric group with error in metricInfos
- **WHEN** metricValues has `{"custom_eval": {"score": null, "error": null}}` and metricInfos has `{"custom_eval": {"error": "Connection refused"}}`
- **THEN** getMetricGroups returns one group with hasError=true, errorMessage="Connection refused", and metrics with null values

#### Scenario: Metric group with sub-entry infos
- **WHEN** metricInfos has `{"retrieval": {"f1": {"reason": "Low overlap", "verbose_logs": "..."}}}` for a group
- **THEN** the group's infos field contains the nested object for rendering in MetricInfoPanel
