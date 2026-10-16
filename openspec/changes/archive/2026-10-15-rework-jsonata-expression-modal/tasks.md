## 1. Strings, models and constants

- [x] 1.1 Add `ReferenceFields`, `CollapseReferenceFields`, `ExpandReferenceFields`, `ExpandField` and `CollapseField` (the last two take `{name}` for the tree chevrons' accessible name) to `JsonAtaI18nKey` in `apps/ai-dial-admin/src/constants/i18n.ts` and their English strings to the `JsonAta` section of `src/locales/en.ts`; verify `npm run typecheck` passes and the keys resolve (no missing-key error in the i18n type).
- [x] 1.2 Move the `SchemaTreeSelectResult` interface, currently declared in both `components/Common/SchemaGrid/SchemaTree.tsx` and `SchemaTreeItem.tsx`, into the existing `components/Common/SchemaGrid/models.ts` and import it in both files; verify `npm run typecheck` passes with a single declaration left.

## 2. Reference fields tree

- [x] 2.1 Restyle `components/Common/SchemaGrid/SchemaTreeItem.tsx` to the design: chevron `DialIconButton` only for nodes with children (`aria-expanded`, accessible name, icon `aria-hidden`), the name/tag area as a `<button>` that selects the node (and still toggles expansion when it has children), `DialTag` type on the right, indented children, hover and selected highlight via `bg-accent-primary-alpha` tokens; verify the existing tree behaviour is preserved in `SchemaTreeItem` specs written in task 5.
- [x] 2.2 Add `selectedPath` state to `components/Common/SchemaGrid/SchemaTree.tsx`, set on every row click and passed down to rows; typing in the editor must not touch it; verify a row stays highlighted after the click and only the last clicked row is highlighted.

## 3. Collapsible panel

- [x] 3.1 Create `components/Common/JsonAtaInput/ReferenceFieldsPanel.tsx` (props `responseSchema` and `onSelect`, declared inline like the neighbouring components): a "Reference fields" label, a bordered box holding `SchemaTree` and a 48px footer with the `«` icon button, and, when collapsed, a 40px rail with the rotated label and the `»` button. Own `isCollapsed` with `useId()` for `aria-controls`; keep the tree mounted when collapsed and give its region `inert` plus the `hidden` class; give both buttons their i18n `aria-label`, `aria-expanded`, and `aria-hidden` icons. Verify through the panel spec in task 5 that collapsing hides the tree from role queries and expanding restores its previous expansion state.

## 4. Rework JsonAtaInput

- [x] 4.1 Rework `components/Common/JsonAtaInput/JsonAtaInput.tsx`: pass `size={PopupSize.Lg}` to `DialFormPopup`; render a fixed-height flex row (`px-6 py-4`, `gap-3`) with `ReferenceFieldsPanel` on the left and, on the right, a `DialLabel` plus a bordered fill-height box hosting `JsonataEditor` (`value`, `variables`, `options` = `stickyScroll` off, `EDITOR_HINTS_OFF_OPTIONS` from a new `JsonAtaInput/constants.ts`, and `ariaLabel`); the editor's `onChange` sets the expression and clears `type`; keep `onChangeValue`, Apply disabled while empty, and Cancel/close discarding the draft unchanged. Verify `npm run typecheck` passes and `JsonAtaCellRenderer` and `columns.tsx` compile without edits.
- [x] 4.2 Delete `components/Common/JsonAtaInput/Suggestions.tsx`, the suggestion helpers in `components/Common/JsonAtaInput/utils.ts` (delete the file if nothing is left), `components/Common/JsonAtaInput/tests/utils.spec.ts`, and the now-unused textarea state in `JsonAtaInput.tsx` (auto-resize effect, `showSuggestions`, `highlightIndex`, key handler); verify `grep` finds no remaining reference to `Suggestions`, `getSchemaSuggestions` or `getVariableSuggestions`, and `npm run lint` is clean.
- [x] 4.3 Check `docs/` and the consolidated specs for mentions of the textarea or typeahead in this popup and update any that describe it; verify `grep -ri "typeahead\|suggestion" docs openspec/specs/test-suite-method-tab` shows none left that refer to this popup.

## 5. Tests

- [x] 5.1 Add `components/Common/SchemaGrid/tests/SchemaTree.spec.tsx` covering: rows and type tags render, chevron toggles children without changing selection, a name click calls `onSelect` with the node path and upper-cased type and toggles expansion for nodes with children, only the last clicked row is highlighted, array children use the `[0]` path, and the empty-schema state shows `TestSuites.NoSchemaProperties`; verify `npx vitest run src/components/Common/SchemaGrid/tests/SchemaTree.spec.tsx` passes (run from `apps/ai-dial-admin/`).
- [x] 5.2 Add `components/Common/JsonAtaInput/tests/ReferenceFieldsPanel.spec.tsx` covering: starts expanded, collapse swaps the tree for the rail and shows the expand button, tree is not reachable by role while collapsed, expanding restores the previous expansion and selection, both buttons expose `aria-expanded` and a name; verify `npx vitest run` on that file passes.
- [x] 5.3 Add `components/Common/JsonAtaInput/tests/JsonAtaInput.spec.tsx` covering: opening shows the saved expression in the editor, picking a node replaces the text and Apply sends `(path, TYPE)`, typing then Apply sends the text without a type, Apply disabled while empty, Cancel and close discard the draft and the next opening shows the saved expression, collapse state and selection reset after close and reopen, and no textarea or suggestion list is rendered; verify `npx vitest run` on that file passes and `npm run typecheck:specs` stays at zero.

## 6. Final quality checks

- [x] 6.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and the full `npm run test`; verify all exit zero and fix any failure they report.
