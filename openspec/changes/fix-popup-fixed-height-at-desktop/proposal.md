## Why

Two issues from the 10-22 ui-kit / file-manager bump share this change.

**#5197**: modals that should keep a fixed height size themselves to their content instead. Add Metric
jumps from a short spinner box to a tall one and shrinks again in JSON mode, and the Run value viewer
opens squashed to its header and Copy button.

The 2.0 `Popup` base classes include `md:h-auto`. A caller's unprefixed `h-[800px]` / `h-[80vh]` loses to
it from 768px up, because `tailwind-merge` only dedupes classes of the same variant. The legacy
`DialPopup` had no such rule, so the bug arrived with the Popup migration (#5168, 2026-10-22) at every
site that passes a fixed height, not only the three in the issue.

**#5200**: the row three-dot menu is missing in every file-manager list (AI Gateway, Artifacts, Governance) and in the Select document modal. The file manager `0.4.0-dev.12` hides the row menu with `opacity-0 pointer-events-none group-hover/grid-row:opacity-100 group-hover/grid-row:pointer-events-auto`. The app emits its utilities `!important` (`tailwind.css`), so `.opacity-0` always wins and the hover variant, which the app never generated, cannot reveal the button. The menu is in the DOM, just invisible.

## What Changes

- **#5200:** add the file-manager package to the Tailwind `@source` list (as the kit already is), so its variant utilities are emitted `!important` too and sort after the base ones.

- Prefix the height class with `md:` at every `Popup` call site that passes an unprefixed `h-*`
  (`md:h-[800px]`, `md:h-[80vh]`, …). `tailwind-merge` then replaces the kit's `md:h-auto`, so the height
  holds at desktop widths. Below 768px the kit's full-screen layout is unchanged.
- Review `min-h-*` sites (`EditRequestWizard`, `RulesCompare`, `RulesStructure`): a minimum height with an
  `auto` height does not give `h-full` children a definite height, so prefix or convert only where a body
  depends on it.
- Leave `max-h-*` sites (`CreateApplication`, `CreateKeyModal`) as they are; they do not conflict with
  `md:h-auto`.
- Add a guard so the pattern cannot return: a spec that scans `Popup` `className` props for an unprefixed
  `h-*`.
- Fix `AddMetricModal`'s composite class (`h-[800px] w-[1200px] max-w-[calc(100vw-2rem)]`) so only the
  height is prefixed.

Sites (27 with `h-*`, 3 with `min-h-*`, found by scanning `<Popup … className>`):
ActivityAudit `Modals/Details`; Analytics `ResultValueDialog`; `AddDependenciesModal`; `CreateAsset`;
`SelectCatalogSchemaModal`; `FileSelectInput`; Deployments `ContainerChangeImage`, `HuggingfaceRegistry`,
`ImageAddContainer`, `McpRegistryModal`; `ImportModal`; `AddEntitiesGrid`; ExportConfig `AddEntitiesModal`
and `PreviewModal`; `GlobalFirewallCompareModal`; Runs `SelectCompareRunModal`, `FullscreenDiffViewer`,
`FullscreenValueViewer`; SourceField `SelectAdapterModal`, `SelectAppRunnersModal`,
`SelectContainerModal`, `SelectRunnerModal`; TestSuites `DocumentationModal`, `AddMetricModal`,
`AddTestCase`; `ManageToolsModal`. `min-h-*`: `EditRequestWizard`, `RulesCompare`, `RulesStructure`.

The scan reads one-line `className` attributes on a literal `<Popup>`. Heights set through
`classNames(...)`, a variable, or a wrapper component's own `className` prop (e.g. `InputPopup`) are
checked by hand in the first task.

## Capabilities

### New Capabilities
- `grid-row-actions-reveal`: file-manager row menus show on row hover.
- `popup-fixed-height`: a `Popup` given a fixed height keeps it at desktop widths regardless of its
  content, and the guard that enforces the `md:` prefix.

### Modified Capabilities
<!-- None: no existing spec describes modal sizing. -->

## Non-goals

- Changing the ui-kit. Making a caller's `className` height win over `md:h-auto` is a kit decision; raise
  it upstream separately.
- Redesigning modal sizes, or the mobile (<768px) full-screen layout.
- A repo-wide CSS override of `.dial-popup` height; it would hide the kit's contract.
- Non-`Popup` overlays (`SideDrawer`, `BottomSheet`, `ConfirmationPopup`).
- Dropping `important` from the utilities import (tailwind-v4-migration D3 follow-up); this change only widens `@source`.
- Keyboard reveal of the row menu (`focus-within`); the library offers hover only.

## Impact

- #5200: `scss/tailwind.css` only. The generated stylesheet grows by ~4 KB: every utility the library uses is now emitted `!important`, which can shift the library's own styling; check file-manager lists and the destination (Move to / Select document) popups.
- About 30 components under `apps/ai-dial-admin/src/components/`; class-name only, no API, state or i18n
  change.
- Shared surface: `Common/FileSelectInput` and `EntityView/AddEntitiesGrid` are used by several features.
- Specs that assert the old `h-[…]` class (if any) change with their component.
- Browser-observable acceptance criteria exist (stable modal height); whether to add an automated
  browser-verification task is to be confirmed when the tasks are written.
