## 1. EditableCellRenderer — onKeyDown handler

- [x] 1.1 Add `handleKeyDown` to `apps/ai-dial-admin/src/components/Grid/CellRenderers/EditableCellRenderer.tsx`:
  ```typescript
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.stopPropagation();
    }
  };
  ```
- [x] 1.2 Attach `onKeyDown={handleKeyDown}` to the `<input>` element

## 2. Unit Tests

- [x] 2.1 Update `apps/ai-dial-admin/src/components/Grid/CellRenderers/tests/EditableCellRenderer.spec.tsx`:
  - Test: pressing Ctrl+A fires `stopPropagation` (create a mock event and verify `stopPropagation` was called)
  - Test: pressing Cmd+A (metaKey) fires `stopPropagation`
  - Test: pressing a plain key (e.g., 'a' without modifier) does NOT call `stopPropagation`

## 3. Quality Checks

- [x] 3.1 Run `npm run lint` from repo root and fix any issues
- [x] 3.2 Run `npm run format:write` from repo root
- [x] 3.3 Run `npm run test` from `apps/ai-dial-admin/` and ensure all tests pass
