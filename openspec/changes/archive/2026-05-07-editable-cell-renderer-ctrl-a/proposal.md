## Why

`EditableCellRenderer` renders a native `<input>` element inside an AG Grid cell. When the user clicks into the input and presses Ctrl+A (Windows/Linux) or Cmd+A (macOS), the expected browser behavior — select all text in the input — does not occur.

The root cause: AG Grid attaches a global keyboard listener to the grid container. When Ctrl+A fires, AG Grid's handler runs (used internally for row selection and other grid shortcuts) and `stopPropagation()` or `preventDefault()` is called at the grid level before the native input behavior executes. Because `EditableCellRenderer`'s `<input>` does not explicitly stop these modifier-key events from bubbling to AG Grid, the shortcut is consumed at the grid level.

This makes it impossible to quickly select and copy the full content of an editable cell without manual mouse-dragging, slowing down all workflows that involve inline cell editing (roles, token limits, endpoints, etc.).

## What Changes

- **`EditableCellRenderer.tsx`**: Add `onKeyDown` to the `<input>` element that calls `e.stopPropagation()` when `ctrlKey` or `metaKey` is held. This prevents the event from reaching AG Grid's global handler and allows the browser to execute native text-editing shortcuts (Ctrl+A, Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+Z) as expected.

## Non-goals

- No changes to the readonly case (`isReadonly` renders a `<div>`) — the readonly path has a separate UX consideration and no inline editing is expected
- No changes to other cell renderers
- No changes to `suppressKeyboardEvent` in `AgGridWrapper` — that controls cell-level keyboard navigation, not DOM-level input behavior

## Capabilities

### Fixed Capabilities
- `editable-cell-renderer-ctrl-a`: Ctrl+A / Cmd+A selects all text in `EditableCellRenderer` inputs

## Impact

- **Component**: `Grid/CellRenderers/EditableCellRenderer.tsx` — add `onKeyDown` prop to `<input>`
- **Behavior**: All common text-editing shortcuts (Ctrl+A, Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+Z) work natively inside `EditableCellRenderer` inputs
- **Scope**: `EditableCellRenderer` is used across entity list grids for inline-editable columns (roles, containers, test suites). The fix is backward-compatible — no other behavior changes.
