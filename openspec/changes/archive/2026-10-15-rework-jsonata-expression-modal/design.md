## Context

See proposal.md for motivation. The popup is `JsonAtaInput` (`components/Common/JsonAtaInput/`), rendered
by `JsonAtaCellRenderer` for the "JSON Path" column of the extracted-fields grid. Today it is a
`DialFormPopup` whose body stacks `SchemaTree` over a `DialTextarea` with a floating `Suggestions` list.
Relevant facts, all checked against the code and the installed ui-kit:

- `DialFormPopup` extends `DialPopupProps`, so it accepts `size` and keeps `dividers` on by default.
  `PopupSize.Lg` maps to `max-width: 1200px` (100% on narrow viewports), which is exactly the Figma
  frame. It does not forward `portalId`, so the `portalId="jsonAtaInputModal"` already passed is inert;
  it is left untouched.
- `DialPopup` returns `null` while closed, so everything mounted inside the popup body resets on
  close. State owned by `JsonAtaInput` itself (the draft expression and type) does not, which is why the
  component already resets its draft in `onOpenModal`.
- `JsonataEditor` (Monaco) already provides JSONata highlighting, `$variable` / function / keyword
  completion and a `variables` prop. It sits on `JsonEditorBase`, which fills its parent (`height: 100%`)
  and whose shared `editorOptions` already set `automaticLayout: true`, so the editor re-measures itself
  when the panel next to it collapses.
- `SchemaTree` / `SchemaTreeItem` are used only by `JsonAtaInput`. `SchemaTree` owns the expansion set;
  a click on a row calls `onSelect({ expression: node.path, type: node.type.toUpperCase() })` and toggles
  expansion for nodes with children.
- The tree's `schemaToTreeNodes` already writes array children as `choices[0].message`, so a node path is
  directly usable as a JSONata expression.

## Goals / Non-Goals

**Goals:**
- Match the four Figma frames: split layout, restyled tree rows, collapsible left panel, full-width editor
  when collapsed.
- Keep the `JsonAtaInput` public props and the `onChangeValue(expression, type?)` contract unchanged, so
  `JsonAtaCellRenderer` and `columns.tsx` need no edits.
- Leave the panel fully usable from the keyboard and by assistive tech, per `.claude/rules/a11y.md`.

**Non-Goals:**
- Path completion inside Monaco (the proposal drops the typeahead rather than porting it).
- Changing `JsonataEditor`, `JsonEditorBase`, or the request-body editor in `BodyTab`.
- Persisting collapse or selection state.

## Decisions

**1. Keep `DialFormPopup`, widen it with `size={PopupSize.Lg}`.**
The design frame is 1200px wide with header and footer dividers; `Lg` plus the default `dividers` gives
that with no CSS. Body content is a fixed-height flex row (`h-[512px]`, `px-6 py-4`, `gap-3`) so the
two columns line up with Figma's 480px panels; the 540px body height the textarea layout used goes away.
*Alternative:* migrate to the 2.0 `Popup` (`bodyClassName`, `mainButtons`). Rejected by the user for this
change; the 1.0 form popup already supplies the Cancel/Apply footer and `disableSubmitButton`.

**2. Extract a `ReferenceFieldsPanel` next to `JsonAtaInput`; keep `JsonAtaInput` as the orchestrator.**
`JsonAtaInput` keeps the draft (`expression`, `type`) and the Apply/Cancel logic. The panel component
renders the column: label, bordered tree box with a footer button, or the collapsed rail. It owns
`isCollapsed` (a `useId()` id wires `aria-controls`). Its props are `responseSchema` and `onSelect`,
declared inline as `Props` like the neighbouring components; no `models.ts` or `constants.ts` is needed for it.
*Alternative:* inline everything in `JsonAtaInput` — rejected, the file would grow past the point where the
two panels can be read separately and the panel is independently testable.

**3. The tree stays mounted while collapsed.**
Spec requires the previous expansion state and selected row to come back on expand. `SchemaTree` owns the
expansion set (and, new, the selected path), so unmounting it on collapse would lose both. The tree's
region instead gets `inert` and a `hidden` class while collapsed: out of tab order and the accessibility
tree, per the a11y rule, and the `aria-controls` target keeps existing. The collapsed rail is a sibling
rendered in its place.
*Alternative:* lift expansion and selection into `JsonAtaInput` and unmount the tree. Rejected: it moves
tree-internal state up only to serve the collapse, and the draft-reset path would need to clear it too.

**4. Selection is tree-owned and independent of the editor.**
`SchemaTree` holds `selectedPath` next to `expandedSet`; a row click sets it, typing does not touch it
(the user chose not to sync). Because `DialPopup` unmounts its children on close, both reset on every
opening, and so does `isCollapsed` in the panel; no explicit reset is needed. A component test that closes
and reopens the popup pins this, so a future ui-kit that keeps the body mounted fails loudly instead of
silently persisting collapse state.

**5. Tree rows follow the design with ui-kit pieces and tokens only.**
Row = optional chevron `DialIconButton` (24px, with `aria-expanded` and an accessible name, icon
`aria-hidden`), name, `DialTag` for the type. The chevron toggles expansion alone; the name/tag area
selects and, for nodes with children, also toggles — today's behaviour. Rows use `bg-accent-primary-alpha`
for hover and selected, tokens only. The row's clickable area becomes a `<button>` instead of a
`div onClick`, which gives keyboard operation and a role the specs can query. Rows with children are
exposed through `aria-expanded`.

**6. Right panel = labelled `JsonataEditor` in a bordered, fill-height box.**
The label is the existing `JSONata ${expression}` header text via `DialLabel`; Monaco has no labelable
input, so the label's text is also passed as the editor's `ariaLabel` option. `variables` is forwarded;
options reuse `{ stickyScroll: { enabled: false } }` like `BodyTab`, plus `EDITOR_HINTS_OFF_OPTIONS`
(`JsonAtaInput/constants.ts`) which turns off quick and trigger-character suggestions, word-based
suggestions, accept-on-Enter, tab completion, parameter hints, inline suggestions and hover. The request-body
editor in `BodyTab` is unaffected because the options are passed only from this popup. Monaco's manual
completion shortcut (Ctrl+Space) still reaches the registered provider; it is not suppressed. `onChange` sets the expression and
clears `type`, as the textarea's `onChange` did. The empty-state placeholder text
(`EntityPlaceholdersI18nKey.Expression`) has no Monaco equivalent and is not carried over.

**7. Remove the typeahead outright.**
Delete `Suggestions.tsx`, `getSchemaSuggestions`, `getVariableSuggestions` and `tests/utils.spec.ts`;
`utils.ts` is deleted if empty afterwards. `SuggestionOption` goes with `Suggestions.tsx`. Also removed:
the textarea auto-resize layout effect, `showSuggestions`, `highlightIndex` and the key handler.
`SchemaTreeSelectResult` is currently declared in both `SchemaTree.tsx` and `SchemaTreeItem.tsx`; it moves
to a single `models.ts` while those two files are being touched.

**8. i18n.**
Five keys in `JsonAtaI18nKey` (the existing JSONata group, `en.ts` `JsonAta` section):
`ReferenceFields`, `CollapseReferenceFields`, `ExpandReferenceFields`, plus `ExpandField` / `CollapseField`
(`Expand {name}` / `Collapse {name}`) so each tree chevron has a distinct accessible name. The popup header and the
editor label keep using the existing composed string. `TestSuitesI18nKey.PickFromResponseSchema` is
already unreferenced and is left alone.

## Risks / Trade-offs

- [With suggestions off, Escape in the editor has no completion widget to dismiss and closes the popup, as
  it does anywhere else in it] → Expected; a manual Ctrl+Space list would consume the first Escape.
- [Losing schema-path typeahead is a functional regression for people who typed paths by memory] →
  Accepted by decision; the tree is always visible beside the editor and remains the discovery path.
- [Focus handling: Monaco inside `FloatingFocusManager`'s focus trap] → `fixedOverflowWidgets: true` is
  already set by `JsonEditorBase`, so completion and hover widgets are not clipped by the popup body; to be
  covered by the same browser pass.
- [Selected-row highlight can go stale after the user edits the text by hand] → Intended; the user chose a
  plain "last clicked" highlight over syncing it to the editor.
- [`DialPopup` returning `null` when closed is relied on for state reset] → pinned by a close/reopen
  component test (Decision 4).

## Migration Plan

Frontend-only, no data or API change; ships with the next release. Rollback is a revert of the change.
The archived change `rework-test-suite-method-tab` and the consolidated `test-suite-method-tab` spec need
no edits beyond the delta in this change.
