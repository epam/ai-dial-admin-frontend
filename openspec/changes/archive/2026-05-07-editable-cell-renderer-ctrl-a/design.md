## Context

`EditableCellRenderer` renders an `<input>` inside an AG Grid cell. AG Grid attaches global keyboard event listeners to the grid container. When the user types inside the input and presses a Ctrl/Cmd+key combination, the event bubbles from the `<input>` → cell `<div>` → grid container → AG Grid handler. AG Grid processes shortcuts like Ctrl+A (select all rows) before the native input behavior fires.

The fix is scoped entirely to the `<input>` in `EditableCellRenderer`: stop modifier-key events from bubbling out of the input so AG Grid never sees them. This restores all native browser text-editing shortcuts for that input.

## Goals / Non-Goals

**Goals:**
- Ctrl+A / Cmd+A selects all text in the `EditableCellRenderer` input
- Ctrl+C / Ctrl+X / Ctrl+V / Ctrl+Z work as expected inside the input (these would be broken by the same root cause)

**Non-Goals:**
- No change to readonly rendering (`isReadonly` returns `<div>`)
- No change to `suppressKeyboardEvent` in `AgGridWrapper`
- No change to any other cell renderer

## Decision

**Add `onKeyDown` to the `<input>` in `EditableCellRenderer`:**

```typescript
const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.ctrlKey || e.metaKey) {
    e.stopPropagation();
  }
};
```

Attach as `onKeyDown={handleKeyDown}` on the `<input>`.

**Why `stopPropagation` (not `preventDefault`)**:
- `preventDefault` would cancel the browser's native shortcut behavior — the opposite of what we want
- `stopPropagation` keeps the event on the input element and prevents it from bubbling to AG Grid's handler
- The native input behavior (`selectAll`, `copy`, `paste`, etc.) still fires normally

**Why catch all Ctrl/Cmd combinations (not just Ctrl+A)**:
- The same propagation issue affects Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+Z inside the input
- Catching all modifier-key combinations is the correct boundary for an editable input: the input owns all its own keyboard shortcuts

**Why this fix belongs in `EditableCellRenderer` and not `AgGridWrapper`**:
- Modifying `suppressKeyboardEvent` globally would affect AG Grid's row-level Ctrl shortcuts across all grids — a broader, riskier change
- `EditableCellRenderer` is the component that renders the input; the fix belongs at the source

## Component Structure

```
EditableCellRenderer
└── <input
      value={correctValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}   ← NEW
      ...
    />
```

`handleKeyDown` is a named function defined in the component body (not inline in JSX) per project conventions.
