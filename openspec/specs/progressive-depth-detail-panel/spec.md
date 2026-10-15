# progressive-depth-detail-panel Specification

## Purpose

Defines the shared progressive-depth viewers used in Run detail screens: the `CodeViewer` block for JSON and text content and the Monaco-based `FullscreenViewer` it opens for large values.

## Requirements

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
