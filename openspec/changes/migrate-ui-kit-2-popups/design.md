## Context

Issue #5147 migrates legacy `Dial*` ui-kit components to their 2.0 counterparts. ui-kit 0.15.3 ships `Popup` under `components/New/Popup/` and the 2.0 `Button`, `Input`, `TagInput` and `Spinner`. It ships no 2.0 form popup and no input-style popup trigger. The legacy exports remain, so migrated and unmigrated code coexist.

Call sites (source, from the import scan): `DialFormPopup` ~60 files (211 mentions), `DialPopup` 25, `DialInputPopup` 12 (44 mentions, 4 specs). `DialFormPopup` is a thin wrapper (the sections below say how it maps): a `DialPopup` whose footer is a neutral Cancel button and a primary Submit button (`disabled={disableSubmitButton}`), and whose body becomes a 120px loader while `isLoading`. `DialInputPopup` has three trigger modes (tag list for array values, editable text input, read-only button) and portals its `children` (the modal) to `document.body` while `open`.

## Goals / Non-Goals

**Goals:**
- Remove every `DialPopup`, `DialFormPopup` and `DialInputPopup` usage from app source and specs.
- Keep layout and behaviour; land as PR-sized steps with both typecheck gates at zero.

**Non-Goals:**
- Changing the ui-kit, or reshaping the call-site API of `InputPopup`.

## Decisions

### Popup: mostly a rename
| Legacy | 2.0 |
|---|---|
| `dividers` | `headerDivider` |
| `dividerFooter` | `footerDivider` |
| `footer` | `footer`, or `mainButtons` / `additionalButtons` where the footer is only buttons |
| `ReactNode` `header` | `header` + `ariaLabel` |

The 2.0 defaults for both dividers are off. As in the ConfirmationPopup change we accept them everywhere and pass `headerDivider footerDivider` only where `dividers` was set explicitly and the rule carries meaning (decided per site, listed in the PR).

Footers that are a Cancel and an action button move to `mainButtons` so spacing and order match the kit; footers with other content stay a `footer` node.

### FormPopup: inline `Popup` + shared buttons and loader
Alternatives: a local `FormPopup` wrapper keeping the legacy props (smallest diff, but invents a component the kit does not have), or fully inline buttons at every site (~60 files repeat the same array). We inline `Popup` with `mainButtons`, matching the kit, and share only the two parts that repeat verbatim.

`components/Common/FormPopup/`:
- `utils.ts` exports `getFormPopupButtons({ cancelLabel, submitLabel, isSubmitDisabled, submitClassName, onCancel, onSubmit }): ButtonProps[]`: a neutral Cancel and a primary Submit. Callers pass `onClose` as `onCancel` where the legacy popup fell back to it.
- `PopupLoader.tsx` renders the 120px container with the `Spinner`. Its `models.ts` / `constants.ts` hold the props and the height, per `code-standards.md`.

A site becomes:
```tsx
<Popup
  open={isModalOpen}
  header={...}
  onClose={onClose}
  mainButtons={isLoading ? [] : getFormPopupButtons({ cancelLabel, submitLabel, isSubmitDisabled: !isValid, onCancel: onClose, onSubmit })}
>
  {isLoading ? <PopupLoader /> : children}
</Popup>
```
Sites without `isLoading` (the majority) pass the buttons directly and render `children` unchanged. A site that passed `footer` keeps its `footer` node, which wins over `mainButtons` as before. `submitLabel` / `cancelLabel` are passed explicitly at every site today (59 / 56 uses), so the helper has no defaults.

### InputPopup: local wrapper, same props
Alternatives: `Select` with a custom overlay (it is a list picker, not a modal trigger), or `Input` only (loses the tag-list mode). The wrapper keeps the legacy props (`open`, `selectedValue`, `children`, `onOpen`, `disabled`, `inputClassName`, `valueClassName`, `placeholder`, `elementId`, `errorText`, `invalid`, `emptyValueText`, `editable`, `onValueChange`, `collapseTagOverflow`, `iconBefore`) and renders three modes on 2.0 parts:
- string / empty value, read-only: `Input` with `readOnly`, an open-popup `inputButtonProps`, `iconBefore`, `error`, `invalid`, and `onClick` / `Enter` / `Space` calling `onOpen` unless `disabled`.
- `editable`: the same `Input`, not read-only, `onChange` calling `onValueChange`.
- array value: `TagInput` in its read-only form showing the tags, opening on click; `collapseTagOverflow` maps to the kit's overflow collapsing if it has one, otherwise a one-line clamp.
- while `open`, `children` is portalled to `document.body`, as before.

Points to watch (checked in the first task, before the 12 sites move):
- Whether 2.0 `TagInput` can render read-only and click-through to open. If it cannot, the array mode keeps a small local tag row.
- The legacy trigger had the fixed names `open-popup` and `input-popup-field`; specs query those. The wrapper takes its names from `elementId` and the field label instead, and the four specs follow.
- `inputClassName` is used at several sites for width and the legacy error class (`dial-input-error`); both become `containerClassName` and `invalid`.

### Mechanics
Order: `Popup` sites first (pure rename), then the shared form-popup helpers and the `DialFormPopup` sites, then `InputPopup` and its sites. Each step is its own PR-sized commit group. Specs keep asserting by role and accessible name per `testing.md`; any spec that mocks one of the three names by string is updated with its component. Import from `@epam/ai-dial-ui-kit` for `Popup`; import the local helpers and `InputPopup` via `@/components/Common/...`.

## Risks / Trade-offs

- [`Popup` with a `ReactNode` header opens unnamed] → add `ariaLabel` at all such sites; grep for `header={<` at the end.
- [Visual drift: divider defaults, footer row, input trigger] → accepted 2.0 look; list in the PR description.
- [`InputPopup` tag mode has no direct 2.0 equivalent] → check `TagInput` first; fall back to a local tag row. Either way the call sites do not change.
- [Specs query the old fixed names `open-popup` / `input-popup-field`] → update the four `InputPopup` specs with the component.
- [A spec still asserts the old DOM and passes by accident] → grep specs for each legacy name; none may remain.
- [`InputPopup` is local until ui-kit ships its own] → it has a spec and a header comment naming the missing kit component.
- [`mainButtons` repeats at ~60 sites] → `getFormPopupButtons` holds the button shape; a site only supplies labels, disabled state and callbacks.
- [A spec mocking `Popup` renders only `footer`, hiding `mainButtons`] → such mocks render `mainButtons` too (as in the shared mock in `test-setup.tsx`, if one is added).

## Open Questions

None. Resolved in task 3.1: 2.0 `TagInput` has `readOnly` and `collapseTagOverflow` but no click handler, so the array branch overlays a transparent, labelled `button` (`ButtonsI18nKey.Open`) that calls `onOpen`. The 2.0 `Input` has no labelled trigger button either, so the read-only branch opens from the input's own click and Enter / Space, and the editable branch puts a labelled `IconButton` in `iconAfter`.
