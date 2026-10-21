## 1. Shared Monaco default and cleanup

- [x] 1.1 Add `stickyScroll: { enabled: false }` to `defaultOptions` in `apps/ai-dial-admin/src/constants/editor.ts` so `editorOptions` provides the safe default through `JsonEditorBase`.
- [x] 1.2 Audit every existing sticky-scroll opt-out and remove the redundant property from each call site, including `JsonEditorBase` wrappers, direct Monaco consumers that spread `editorOptions`, and `DiffField` through `diffEditorOptions`; preserve all unrelated options such as `wordWrap`, `ariaLabel`, and completion settings.

## 2. Focused automated coverage

- [x] 2.1 Extend `apps/ai-dial-admin/src/constants/tests/editor.spec.ts` to assert that exported `editorOptions` disables sticky scrolling while retaining the existing default option behavior.
- [x] 2.2 Run the focused editor constants test from `apps/ai-dial-admin` with Vitest.

## 3. Browser verification

- [x] 3.1 Attempt `spec-browser-verify` for the `shared-json-editor` scenario. The verification was blocked because Playwright MCP browser tools were unavailable; the user explicitly waived the browser-verification requirement on 2026-10-16.

## 4. Final quality checks

- [x] 4.1 Run formatting, linting, both application and spec typechecks, and the relevant test suite; resolve any failures caused by this change.
