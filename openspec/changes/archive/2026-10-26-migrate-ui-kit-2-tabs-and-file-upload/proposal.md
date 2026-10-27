## Why

Issue #5147 moves the admin app from the legacy `Dial*` ui-kit components to the 2.0 generation, one batch at a time. Buttons, Tooltips, Switch, Label, ConfirmationPopup, NoDataContent, Spinner, inputs/selects and the popup family are done. `DialTabs` and `DialLoadFileArea` / `DialLoadFileAreaField` are the next two with a 2.0 counterpart: `Tabs` and `FileDropzone` under `components/New/`. They go in one change because both are call-site sweeps over the same legacy surface, but they differ in kind. `Tabs` is a near-1:1 swap; `FileDropzone` is only the empty drop area, so the filled state, limits and actions have to stay local.

## What Changes

- `DialTabs` → `Tabs` (~17 source files, ~7 specs). Props rename: `activeTab` → `activeTabId`, `onClick` → `onTabChange`, `desktopTabClassName` → `tabClassName`. `orientation` carries over.
- `TabModel` (legacy, `label: ReactNode`, `invalid` / `warning` booleans) → `TabItem` (`label: string`, `status: TabStatus.Error | Warning`, `count`). The ~93 non-spec references move to `TabItem`, and the four sites that set `invalid` / `warning` — `ContainerView`, `McpToolSchema`, `Publications/View`, `ConfigurationPreview.utils` — map to `status`.
- `DialLoadFileAreaField` / `DialLoadFileArea` → a new local `FileUploadField` in `components/Common/FileUploadField/`, built on the 2.0 `FileDropzone`. It keeps the legacy prop contract (files list, remove, Add / Delete all, `maxFilesCount`, `maxFileSize`, `maxMultiFilesSize`, `isInvalid`, `dynamicIcon`, `iconBeforeInput`, per-limit error texts) for its 4 `Field` call sites, so they change by import only.
- `TestCases/Import/ImportFile` uses the empty-state-only area with no limits, so it takes `FileDropzone` directly.
- Specs that import, mock or assert on these names move in the same change.
- The capability spec that names `DialTabs` is updated to the new name.

## Capabilities

### New Capabilities
- `file-upload-field`: the local file upload field — empty drop area, filled file list with per-file remove, Add / Delete all actions, count and size limits with their error texts, per-file invalid marking.

### Modified Capabilities
- `deployment-import-preview-validation-errors`: the validation banner sits between `Tabs` and the grid, and the per-tab error indicator is `TabItem.status` (`TabStatus.Error`, with a translated `statusLabel`) instead of `TabModel.invalid`. The admin-path requirement drops its `TabModel.invalid` wording.

## Non-goals

- Upstreaming a 2.0 filled-state upload field to ui-kit. `FileUploadField` is written so a later swap is one file.
- `DialSteps` (in `ImportFile`) — no 2.0 counterpart; it stays legacy.
- Rebuilding the responsive collapse-to-dropdown that `DialTabs` has on narrow screens and on overflow. The 2.0 `Tabs` renders a plain row; the loss is accepted as a kit delta. Nothing in the app uses `TabView.Inline`.
- Redesigning the tab bars or upload screens. Visual deltas come from the kit.
- Fixing accessibility gaps at migrated sites beyond what the 2.0 component requires of the call site.

## Impact

- ~17 source files for `Tabs`, ~35 files that import `TabModel`, 5 file-upload call sites, and ~10 specs under `apps/ai-dial-admin/src`; `test-setup.tsx` only if it mocks one of these names.
- New shared code with specs: `Common/FileUploadField`.
- Behaviour change to flag: on narrow screens and with many tabs, entity-view header tabs no longer collapse into a dropdown. The row simply overflows or wraps as the kit lays it out.
- Accessibility: `Tabs` gives roving focus and arrow-key navigation; `status` is added to the tab's accessible name and needs a translated `statusLabel`. The tab list should get an `ariaLabel` at sites with no `sectionLabel`.
- `scss/tooltip.scss` names `DialTabs` among the legacy components that still portal the 1.0 tooltip bubble; its comment is updated if no legacy user remains.
- No server, API, or context changes.
