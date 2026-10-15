## Why

The "JSONata Expression" popup opened from the "JSON Path" column of the test suite Method tab stacks a
schema tree above a plain textarea with a floating typeahead. The new design (Figma "DIAL Admin
Evaluation — Test Suites") replaces it with a split view: a collapsible "Reference fields" tree on the
left and a code editor on the right, so the tree stays visible while the expression is edited and the
expression gets real editor affordances (line numbers, syntax highlighting).

## What Changes

- Rework the popup body into two columns: a "Reference fields" panel (bordered box with the schema tree
  and a footer holding a collapse button) and a "JSONata Expression" panel hosting the existing Monaco
  `JsonataEditor` with its automatic hints turned off, still fed the column's `variables`.
- The popup widens to the ui-kit's large size (1200px max width) and keeps header and footer dividers.
- The Reference fields panel collapses to a 40px rail (rotated "Reference fields" label, expand button
  at the bottom); the editor then takes the full width. The panel starts expanded each time the popup
  opens and its state is not persisted.
- Restyle the tree rows to the design: chevron button only for nodes with children, name, bordered type
  tag on the right, indented children, hover and selected highlight. The last clicked node stays
  highlighted; the highlight does not follow what is typed in the editor.
- Tree click behaviour is unchanged: it replaces the expression with the node's path, sets the column's
  data type from the node, and toggles expansion when the node has children. Typing in the editor
  clears the pending type. Apply stays disabled while the expression is empty; Cancel discards the draft.
- **BREAKING (UI only)**: the textarea and its schema-path / `$variable` typeahead are removed. Path
  discovery moves to the tree, and the editor's own hints (completion, parameter hints, hover) are turned
  off in this popup.
  `Suggestions.tsx`, `getSchemaSuggestions` and `getVariableSuggestions` are deleted with their tests.

## Non-goals

- No schema-path completion inside Monaco.
- No syncing of the tree selection or expansion to the editor text.
- No migration of the popup from `DialFormPopup` to the 2.0 `Popup`.
- No change to the grid cell that opens the popup, to the column data model, or to the request-body
  `JsonataEditor` usage in `BodyTab`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `test-suite-method-tab`: adds requirements for the split-view JSONata Expression popup opened from the
  extracted-fields grid's JSON Path cell (layout, reference-fields tree, collapse behaviour, apply and
  cancel semantics, removal of the textarea typeahead).

## Impact

- `apps/ai-dial-admin/src/components/Common/JsonAtaInput/` — `JsonAtaInput.tsx` reworked; `Suggestions.tsx`
  and the suggestion helpers in `utils.ts` removed (`utils.ts` goes away if nothing else remains); its
  `tests/utils.spec.ts` removed; a new component spec added.
- `apps/ai-dial-admin/src/components/Common/SchemaGrid/` — `SchemaTree.tsx` and `SchemaTreeItem.tsx`
  restyled and given a selected-node state; they are used only by `JsonAtaInput`.
- `apps/ai-dial-admin/src/components/Common/JsonataEditor/` — reused as is; no API change expected.
- `apps/ai-dial-admin/src/constants/i18n.ts` and `src/locales/en.ts` — new keys for the panel labels and
  the collapse and expand buttons.
- `openspec/specs/test-suite-method-tab/spec.md` — updated through the delta in this change.
- Shared-component risk: `JsonEditorBase` and `JsonataEditor` are also used by the request body editor;
  they are consumed unchanged. Monaco's suggest widget inside a modal popup (Escape handling) needs
  explicit coverage.
