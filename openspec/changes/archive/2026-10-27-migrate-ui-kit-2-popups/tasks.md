## 1. Popup → Popup

- [x] 1.1 Replace `DialPopup` with `Popup` in the 25 source files; map `dividers` / `dividerFooter` to `headerDivider` / `footerDivider` where the rule carries meaning and drop them elsewhere
- [x] 1.2 Add `ariaLabel` to every `Popup` whose `header` is a `ReactNode`; move Cancel / action-only footers to `mainButtons`
- [x] 1.3 Update `FullscreenViewer.spec`, `AddMetricModal.spec` and `CreateTestSuite.spec` (imports, mocks, queries); run both typecheck gates

## 2. DialFormPopup → Popup with mainButtons

- [x] 2.1 Add `Common/FormPopup/` with `getFormPopupButtons` (`utils.ts`) and `PopupLoader` (`PopupLoader.tsx`, `models.ts`, `constants.ts`)
- [x] 2.2 Add specs: `getFormPopupButtons` (labels, primary variant, disabled, `submitClassName`, callbacks) and `PopupLoader` (renders the spinner)
- [x] 2.3 Replace `DialFormPopup` with `Popup` + `mainButtons` in the ~60 source files; wrap in `isLoading ? [] : …` and `PopupLoader` where `isLoading` was passed; `dividers` → `headerDivider footerDivider` at the 8 explicit sites
- [x] 2.4 Update every spec that imports, mocks or asserts on `DialFormPopup`; mocks of `Popup` render `mainButtons`; run both typecheck gates

## 3. InputPopup wrapper and call sites

- [x] 3.1 Check whether the 2.0 `TagInput` renders read-only and opens on click; record the answer in `design.md` and pick the array-mode implementation
- [x] 3.2 Add `Common/InputPopup/` (`InputPopup.tsx`, `models.ts`, `constants.ts`) with the read-only, editable and tag-list modes and the portalled `children`
- [x] 3.3 Add `InputPopup.spec.tsx`: opens on click and keyboard, no-op when disabled, editable `onValueChange`, tag list, `emptyValueText`, error and `iconBefore`, children portalled only while `open`
- [x] 3.4 Replace `DialInputPopup` with `InputPopup` in the 12 source files; map `inputClassName` to `containerClassName` / `invalid`
- [x] 3.5 Update the four specs that query the old `open-popup` / `input-popup-field` names or mock `DialInputPopup`; run both typecheck gates

## 4. Close out

- [x] 4.1 Grep `apps/ai-dial-admin` for `DialPopup`, `DialFormPopup` and `DialInputPopup`; none may remain in source, specs or `test-setup.tsx`
- [x] 4.2 Update `docs/` and any `.claude/rules` text that names the legacy popups, if present
