## 1. Tabs: shared pieces and model swap

- [x] 1.1 Grep the 17 `DialTabs` sites for `view`, `screenThreshold` and the dropdown class props (none expected), and for tabs that set both `invalid` and `warning`; record any hit in `design.md`
- [x] 1.2 Add two `TabsI18nKey` entries and `en.ts` strings for the error / warning `statusLabel`, plus a shared tab-list `ariaLabel`; add `getTabStatusLabel(status, t)` to `utils/tabs/utils.ts`
- [x] 1.3 Replace `TabModel` with `TabItem` in the ~35 files that import it; map `invalid` / `warning` to `status` + `statusLabel` in `ContainerView`, `McpToolSchema`, `Publications/View` and `ConfigurationPreview.utils` (`Error` wins when both were set)
- [x] 1.4 Add a spec for `getTabStatusLabel`; update the specs of the four status sites to assert `status` and `statusLabel`

## 2. DialTabs → Tabs

- [x] 2.1 Replace `DialTabs` with `Tabs` in the 17 source files (`activeTab` → `activeTabId`, `onClick` → `onTabChange`, `desktopTabClassName` → `tabClassName`); keep `orientation` at `ExecutionLog` and `EntityAudit`; keep `TryOutRequestTabs` converting its numeric index with `String` / `Number`
- [x] 2.2 Pass `ariaLabel` (`TabsI18nKey.ListLabel`) at every `Tabs` with no `sectionLabel`
- [x] 2.3 Update `ConfigurationPreview.spec`, `AddMetricModal.spec`, `CreateTestSuite.spec`, `Target.spec`, `RequestTemplate.spec` and `TryOutRequestTabs.spec` (imports, mocks, queries by `tab` role); run both typecheck gates

## 3. FileUploadField

- [x] 3.1 Check that `FileDropzone` can host the filled-area drop target; if not, add a local drop handler in the filled state; record the answer in `design.md`
- [x] 3.2 Add `Common/FileUploadField/` `utils.ts` with the format, count, size and total-size checks (case-insensitive accept, `/` accepts any file), pinned against the `acceptTypes` strings the 7 call sites pass
- [x] 3.3 Add `FileUploadField.tsx`, `models.ts` and `constants.ts`: label, empty `FileDropzone`, filled rows, remove, Add / Delete all, invalid marking and a live-region error
- [x] 3.4 Add specs for `utils` (each limit, order, unset limits) and `FileUploadField` (empty and filled states, remove, Add append and single-file replace, Delete all, invalid file, error clears on a valid selection, alert region)

## 4. Upload call sites

- [x] 4.1 Replace `DialLoadFileAreaField` with `FileUploadField` in `ImportFileType`, `ImportConfig/Files` and `ApplicationFileManager` (7 usages); keep the props, and drop the commented-out props at `ApplicationFileManager`
- [x] 4.2 Replace `DialLoadFileArea` with `FileDropzone` in `TestCases/Import/ImportFile`; leave `DialSteps` as is
- [x] 4.3 Update `ApplicationFileManager.spec` and any spec that imports, mocks or asserts on the legacy names; run both typecheck gates

## 5. Close out

- [x] 5.1 Grep `apps/ai-dial-admin` for `DialTabs`, `TabModel`, `DialLoadFileArea` and `DialLoadFileAreaField`; none may remain in source, specs or `test-setup.tsx`
- [x] 5.2 Drop `DialTabs` from the `scss/tooltip.scss` legacy-component comment if no legacy user is left; update `docs/` and any `.claude/rules` text that names the legacy components, if present
- [x] 5.3 Run all code quality checks (lint, format, both typechecks, tests) as the final gate

<!-- No browser-verification task: declined when asked. The tab-status, upload-row and validation-error scenarios are covered by the component specs above. -->
