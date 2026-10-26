## Context

Issue #5147 migrates legacy `Dial*` ui-kit components to their 2.0 counterparts. The installed kit (0.16.0-dev) ships `Tabs` and `FileDropzone` under `components/New/`. The legacy exports remain, so migrated and unmigrated code coexist.

`DialTabs` has ~17 source call sites. Its tab model, `TabModel`, is imported in ~35 files; the `tabs` arrays are built in `utils/tabs/utils.ts`, the entity `View`s and a few feature utils. All labels seen are strings from `t()`.

`DialLoadFileAreaField` has 4 call sites over 3 files (`ImportFileType` ×3, `ImportConfig/Files` ×3, `ApplicationFileManager` ×1 — 7 usages), plus `DialLoadFileArea` bare in `TestCases/Import/ImportFile`. `FileDropzone` is a dashed drop area with `accept`, `multiple`, `onChange`, `onReject`, `errorText` and `labelProps`. It has no filled state, no actions and no limits.

## Goals / Non-Goals

**Goals:**
- Remove every `DialTabs`, `TabModel`, `DialLoadFileArea` and `DialLoadFileAreaField` usage from app source and specs.
- Keep upload behaviour: formats, count and size limits, error texts, invalid-file marking, Add / Delete all.
- Land as PR-sized steps with both typecheck gates at zero.

**Non-Goals:**
- Changing the ui-kit, or reshaping the call-site API of `FileUploadField`.
- Rebuilding the responsive tab dropdown or `TabView.Inline` (see the proposal).

## Decisions

### Tabs: rename plus a model swap
| Legacy | 2.0 |
|---|---|
| `activeTab` / `onClick` | `activeTabId` / `onTabChange` |
| `desktopTabClassName` | `tabClassName` |
| `className` | `className` (root; lands on the `tablist` when there is no `sectionLabel`) |
| `invalid: true` / `warning: true` | `status: TabStatus.Error` / `TabStatus.Warning` |
| `TabModel` | `TabItem` |
| small-screen / dropdown class props, `screenThreshold`, `view` | removed |

Alternative: a local `TabModel` that maps to `TabItem` at the `Tabs` boundary, so the ~35 model-building files never change. Rejected: it keeps a second tab type alive, and `invalid` / `warning` can both be true on the legacy model while `status` is one value. Moving the type is mechanical and makes the model truthful. Where a site set both, `Error` wins.

`statusLabel` is the translated accessible suffix for `status`. A shared helper `getTabStatusLabel(status, t)` in `utils/tabs/` returns it from two new `TabsI18nKey` entries, and the sites that set a status pass it through; the kit's English default is not used. Sites whose `tabs` arrays are built from shared state (`ContainerView`, `Publications/View`, `McpToolSchema`, `ConfigurationPreview.utils`) set `status` and `statusLabel` together where the status is assigned.

`ariaLabel` is passed at every `Tabs` that has no heading, with a short existing or new `TabsI18nKey` string; the entity-view header tabs share one. `HeaderTabs` and `TryOutRequestTabs` are the two components that other sites reach through, so most call sites need no direct change.

`TryOutRequestTabs` passes a numeric `selectedIndex`; it keeps converting to and from `String(index)` around `activeTabId` / `onTabChange`.

### File upload: local `FileUploadField` on `FileDropzone`
Alternatives: wait for a 2.0 filled-state field in the kit (leaves these screens on legacy components indefinitely); or inline `FileDropzone` plus a file list at each of the 7 usages (repeats ~60 lines of limit logic, and the three `ImportConfig/Files` blocks would each drift). We take a wrapper that keeps the legacy prop contract, so the call sites change by import and by renamed texts only.

`components/Common/FileUploadField/`:
- `FileUploadField.tsx` renders a `Label` (`fieldTitle`, plus `: <count>` when `multiple`, as legacy) and one of two states.
  - Empty: `FileDropzone` with `label` = first line, `description` = "or Browse", `accept`, `multiple`, `errorText` and `onReject` for format errors. `FileDropzone` filters drops by `accept` itself and calls `onReject` first, then `onChange` with the rest, in one tick; a ref set in `onReject` makes the field reject a mixed drop whole, as legacy did.
  - Filled: a bordered list, each row with `iconBeforeInput` / `dynamicIcon(name)`, the name in `EllipsisTooltip`, an error mark when `isInvalid(file)` and the shared `RemoveButton`. Above it, Delete all (`NeutralButton`) and Add (`GhostButton`, hidden at the limit) plus `additionalActionButtons`, all only for `multiple` fields. Add opens a hidden picker; the list is also a drop target. The drop shortcut is pointer-only, so Add is the keyboard path.
  - A single `role="alert"` region carries the current error text for assistive tech in both states.
- `utils.ts` holds the pure checks: `getAccept` (`/` means no restriction), `validateFiles` (format → size → count, using the kit's exported `matchesAccept`) and `isTotalSizeExceeded`. Sizes are in MB, as legacy.
- `models.ts` / `constants.ts` hold the props, the `FileUploadError` enum and the MB constant.

Differences from the legacy field, all deliberate:
- Legacy matched `acceptTypes` by substring of the file's MIME type; `matchesAccept` matches by extension or exact / wildcard MIME, case-insensitive. Every `acceptTypes` string at the call sites is covered by a util spec case. A file with an empty MIME type and no matching extension is now rejected.
- The total-size error is a standing condition of the list, shown while the sum is over the limit, not a gate on a selection.
- On an empty single-file field, several dropped files take the first one instead of raising the count error: `FileDropzone` truncates before the field sees them. The count error still applies when adding to a filled list.
- Errors from the Add picker are now shown; the legacy field dropped such a selection silently.
- The remove button is named `<Delete>: <file name>`; the legacy one was unnamed.

`ImportFile` (bare, empty-only, single file, no limits) uses `FileDropzone` directly, with `accept` and a format error from `onReject` (`ImportI18nKey.FileErrorType`). `.csv` is added to its accept list, since the kit also filters drops and a Windows CSV is not always typed `text/csv`; the legacy bare area filtered the picker only. `ApplicationFileManager` keeps its `files={separateFiles}` and `multiple={false}`: because the upload happens on `onChange`, its list is always empty after the call, so the field behaves as a plain dropzone with a label there.

### Mechanics
Order: `Tabs` shared pieces (`getTabStatusLabel`, i18n keys) and the model swap with its sites, then `FileUploadField` with its spec, then the 5 upload sites. Specs keep asserting by role and accessible name per `testing.md`; a spec that mocks `DialTabs` or a `DialLoadFile*` name by string is updated with its component. Import `Tabs`, `TabItem`, `TabStatus` and `FileDropzone` from `@epam/ai-dial-ui-kit`; import the local field via `@/components/Common/...`. The `scss/tooltip.scss` comment drops `DialTabs` from its list if no legacy user is left.

### Findings while applying the tabs tasks
- No `DialTabs` site passes `view`, `screenThreshold` or the dropdown class props, and no tab set both `invalid` and `warning`.
- Status is set in more places than the four named in the proposal: `propertiesTab`, `rolesTab` and `firewallTab` in `utils/tabs/utils.ts` (warning) and `getAnalyticsImportTabs` (error). `getTabStatusProps(t, status)` sets `status` and `statusLabel` together and clears both when `status` is absent, so a spread over an existing tab removes a stale status.
- `ExecutionLog` was the one tab set with a `ReactNode` label (pod name plus a restart count). `TabItem.label` is a string, so the label becomes `Pod 1 · Restarts: 3`; the width cap `desktopTabClassName` set is dropped.
- `ariaLabel` is passed at each `Tabs` call site from the shared `TabsI18nKey.ListLabel` rather than routed through `HeaderTabs`, because the sites are not all header tabs. `HeaderTabs` was renamed from `Tabs` inside its file to stop clashing with the kit's `Tabs`.
- A tab with a status now has the status text in its accessible name, so specs that looked for the old warning icon query the tab by name with the status label instead.

## Risks / Trade-offs

- [Narrow-screen header tabs no longer collapse] → accepted kit delta, recorded in the proposal; the row scrolls or wraps as the kit lays it out.
- [`TabModel` → `TabItem` touches ~35 files] → a mechanical type swap; `typecheck` and `typecheck:specs` at zero prove completeness, and grep finds no `TabModel` at the end.
- [A tab set both `invalid` and `warning`] → `Error` wins; the grep for sites setting both is the first tab task.
- [`FileUploadField` re-implements the legacy filled state] → covered by a dedicated spec; the header comment names the missing kit component.
- [`accept` semantics differ between `FileDropzone` and the legacy check, notably for `"/"` and mixed-case MIME types] → validated in `utils` against the real call-site strings, not only through the kit.
- [Specs query legacy DOM names] → grep specs for each legacy name; none may remain.
- [Tab `statusLabel` omitted at a site, leaving the kit's English default] → set at the point where `status` is assigned, and a spec at each of the four sites asserts the translated key.

## Open Questions

- Whether `FileDropzone` exposes enough to host the filled-state drop target, or the filled list needs its own drag handler (checked in the first file-upload task, before the 5 sites move).
- Whether any site passes `view`, `screenThreshold` or the dropdown class props — the proposal found none, and the first tab task confirms it by grep.
