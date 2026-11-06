## Context

The undeclared-properties banner is outside the catalog editor's scrollable form and interpolates every name into one message. Its contents can consume the available height. The shared schema grid provides a widget selector but no clear option; its existing metadata change path already deletes a cleared widget and removes an empty metadata object.

## Goals / Non-Goals

**Goals:** Contain long banner messages without losing information; provide a localized clear option for optional widgets while preserving sibling metadata and the empty display after clearing.

**Non-Goals:** Redesign unrelated notifications or selectors, truncate data, change the separate validation-error list, or infer a downstream renderer's default widget.

## Decisions

### Bound the message rather than truncate it

In `UndeclaredPropertiesBanner`, use a block-level message with a maximum height and vertical overflow, following the `max-h-40 overflow-y-auto` pattern in `components/Notification/Notification.tsx`. Wrap long unbroken names without making the full message unreachable. Keep the remove control outside the scrolling message and preserve warning, error and read-only behavior. Ensure the scroll region can be operated by keyboard and has an appropriate accessible name when focusable.

A character limit or ellipsis would hide identifiers the existing capability requires users to see. Applying a bound to the entire editor instead could leave the form inaccessible.

### Clear at the widget column boundary

Add a localized none choice to the widget column in `Common/SchemaGrid/columns.tsx`, reusing `BasicI18nKey.None` where suitable. Translate its UI-only selection to the existing empty-value handler before metadata is updated. An absent widget must display the empty placeholder, not the option label. `SelectCellRenderer` supplies an empty string to the single-select when its local value is absent, keeping the selection controlled so a widget clears on the first attempt. This shared fallback also applies to its other single-select consumers; the none option itself remains limited to the widget column.

`SchemaGrid` already removes `dial:widget` for an empty value and drops `dial:meta` only when it has no remaining keys. Reuse that path and the existing schema serialization. The [Core catalog meta-schema](https://github.com/epam/ai-dial-core/blob/bf830d8a6a2087cfd00c9364a93cf7efde60c362/config/src/main/resources/catalog-schemas/schema.json) lists `dial:widget` as an optional string with eight allowed values; neither an empty string nor a null or a UI sentinel is legal as the stored value.

## Risks / Trade-offs

- A CSS max height alone does not guarantee keyboard-accessible scrolling or prevent layout shrinkage → design the scroll region for keyboard access and test the rendered structure; browser geometry is not established by jsdom.
- A clear option could accidentally persist the sentinel or remove other metadata → test the column callback through schema reconstruction, including both last-key and sibling-key cases and save/reopen.
- The selector lives in shared infrastructure → keep the option limited to the widget column and retain tests for the other columns.
- The user declined a dedicated automated browser-verification task → component tests cover the code and accessible structure, but real browser layout and keyboard scrolling remain unverified by that task.
