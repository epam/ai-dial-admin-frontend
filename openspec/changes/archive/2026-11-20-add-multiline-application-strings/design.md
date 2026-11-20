## Context

The Parameters Table derives schema and user rows from application properties. `getAppPropertiesColumns` currently selects `EditableCellRenderer` for both string and number values; the string input is a native single-line input. `TableView.onChangeParam` updates the parent property map and uses `isSkipRefreshRef` so editing does not reset grid focus. The existing renderer also updates the grid cell via `setValue`. The same tab supports asset application `application_properties` and entity `applicationProperties` through its existing save paths.

This change needs an explicit decision about multiline inline editing, modal draft ownership, and grid synchronization; a design is therefore useful.

## Goals / Non-Goals

**Goals:**
- Edit arbitrary single-line strings inline and multiline strings in a popup without silently losing line breaks or whitespace.
- Preserve current permissions, required-field indication, type selection, row identity, and application-level Save/Discard behavior.
- Reuse existing UI primitives and keep a domain-free input separate from the AG Grid adapter.

**Non-Goals:**
- Parse, validate, or auto-format YAML or introduce a new language-specific dependency.
- Modify Form, JSON, iframe, non-string parameter editors, or backend contracts.
- Guarantee CRLF versus LF identity after editing in browser text controls.

## Decisions

### Use a textarea with staged popup edits

Compose a generic raw-string editor from the existing `Common/InputPopup` and a ui-kit `Popup` and textarea, using `JsonAtaInput` for its draft-on-open, Apply and Cancel pattern. The textarea is labeled and fills the available height in a bounded, scrollable modal area, leaving the header and footer accessible. Apply sends the raw draft to the caller, and Cancel, Escape, and close discard it. Opening then applying without modifying the content retains the original string, including its line-ending representation. Application Save remains the persistence action; popup Apply creates no success or error notification.

Unlike `JsonEditorInput`, do not parse or serialize the value. A textarea is simpler than Monaco for arbitrary strings and doesn't introduce language-specific behavior. Monaco plaintext could be considered later for editor features; YAML highlighting is not already registered in `Common/MonacoEditor/monaco-entry.ts` and is not required to preserve formatting.

### Use a safe inline preview for multiline content

For a single-line value, allow inline input and immediately propagate changes, as today. If the original value contains CR or LF, keep the complete value in state and render a non-editable inline preview with the expand control; edits take place in the popup. Do not derive the saved value from the sanitized single-line DOM input or a truncated preview. When Apply produces a single-line value, inline editing becomes available again. Existing `InputPopup` is a starting point, but its editable native input and disabled-state behavior must be evaluated for these distinct preview and permission states; any shared API change must preserve other consumers.

Alternatives: keeping a native text input editable for multiline values can strip line breaks; using a one-line-high textarea permits edits to hidden content. Both are less predictable than the chosen preview.

### Adapt to the table without changing other types

Add a string-specific cell renderer comparable to `JsonEditorCellRenderer`, select it only for non-empty-key string rows in `ParametersTab/utils.ts`, and continue using the existing renderers for other types and pending empty-key rows. Reuse `TableView.onChangeParam` and preserve the grid's `setValue`/local-value behavior as well as the parent's skip-refresh mechanism. Coordinate popup Apply with AG Grid virtualization and updated props so switching rows or scrolling does not restore stale content. A key is still committed on blur before its value becomes editable.

Use a unique popup portal identity per renderer, localized labels for the input, popup, and expand button, keyboard-operable controls, correct focus return, and the existing required/error styling. Match existing table read-only behavior: do not expose edits for a read-only administrator. Avoid adding duplicate AG Grid tooltips for content already covered by the input's accessible overflow mechanism.

## Risks / Trade-offs

- [A text input can sanitize newline characters] → Never use its displayed preview as the source of the value; tests exercise pre-existing multiline content and subsequent edits.
- [Textarea APIs normalize line endings] → Preserve the original untouched string on no-op Apply; specify LF/CRLF identity after an edit as out of scope and test retained logical line breaks and whitespace.
- [Grid refresh, row recycling, or modal closure can lose drafts or target another row] → Synchronize committed values via both grid and parent paths, isolate popup drafts, use unique portal IDs, and test multiple rows and reopen/scroll behavior.
- [Shared input changes can affect evaluation or other consumers] → Prefer composition and backwards-compatible props; cover any changed shared behavior.
- [Read-only preview conceals full text] → Make the full value accessible through the popup when editing is permitted, with accessible labels and keyboard access.

## Migration Plan

No data or backend migration is needed. Deploy the frontend; rollback restores the prior input UI while leaving stored string values untouched.

## Open Questions

None for the agreed scope.
