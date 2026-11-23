## Why

Application parameter strings are currently edited in a single-line field, making multiline content difficult to enter and risking the loss of line breaks during inline editing. Users need to edit arbitrary text, including YAML-like content, without changing its formatting or interpreting it as structured data.

## What Changes

- Add a string-specific table value control with inline editing for single-line values and an expandable multiline editor whose textarea fills the available popup body height.
- Display multiline values as a read-only inline preview; edit the full value in the popup. Popup changes are staged until Apply and discarded on Cancel or close.
- Preserve the string's content and formatting through the existing application draft and save flow, without YAML parsing or validation.
- Reuse existing popup and input patterns such as `InputPopup` and `JsonAtaInput`, while retaining the table's existing type, permission, and validation behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-properties-table-editing`: Provide inline and popup editing for string values while preserving multiline content and existing application save semantics.

## Impact

- Application Parameters table column selection and a string-specific cell renderer; reusable input/popup UI may be shared under `Common`.
- Existing application and asset application property maps and save paths remain the source of truth; no backend API or data-model change is expected. Existing Form, JSON, and custom UI views are unchanged.
- Shared input changes, if needed, must preserve existing consumers such as evaluation file selection. No new editor dependency is planned.

## Non-goals

- YAML syntax validation, parsing, automatic formatting, or restricting strings to YAML.
- Changing editing for number, boolean, object, or parameter keys; changing Form or custom UI views.
- Guaranteeing byte-for-byte preservation of original CRLF versus LF line endings across edited text; ordinary line breaks and whitespace must be retained.
