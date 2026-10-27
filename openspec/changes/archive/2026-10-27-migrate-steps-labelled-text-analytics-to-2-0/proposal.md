## Why

Issue #5147 moves the admin app from the legacy `Dial*` ui-kit components to the 2.0 generation, one batch at a time. ui-kit `0.16.0-dev.49` removed `DialSteps` and `DialAnalyticsCard` / `Bar` / `BarGroup` / `Histogram` outright, so the app stops compiling against it until they are replaced. `DialLabelledText` is still exported, but it is the next component in the sequence and has a 2.0 counterpart, so it goes in the same change.

## What Changes

- `DialAnalyticsCard`, `DialAnalyticsBarGroup` and `DialAnalyticsHistogram` → `AnalyticsCard`, `AnalyticsBarGroup` and `AnalyticsHistogram` in the Run Summary and Run Compare sections (6 source files plus `Compare/Summary/models.ts`, whose `CompareCardItems` is derived from the card's props). Props carry over.
- `DialSteps` → `Steps` in the 8 wizard modals. Each site passes a translated `ariaLabel` and `statusLabels`, because the 2.0 defaults are English (`Completed` / `Error`).
- `DialLabelledText` → `LabelledText` in the shared `Common/LabelledText` wrapper and the ~12 direct call sites.
- The 9 specs that mock or assert on these names move in the same change.
- The four capability specs that name `DialLabelledText`, `DialSteps` or `DialAnalyticsCard` in a requirement are updated to the new names.
- The `tooltip.scss` comment stops naming `DialLabelledText` and `DialAnalytics*` as sources of the 1.0 tooltip bubble. The shim stays while `DialInput`, `DialSelect` and `DialDropdown` remain.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
No behaviour changes; each delta only renames the component a requirement names.
- `change-image-button`: the label comes from a `LabelledText`
- `container-source-field-layout`: the source type header is a `LabelledText`
- `deployment-import-preview-validation-errors`: the import wizard is a `Steps`
- `mcp-registry-source`: the server details sidebar rows are `LabelledText`
- `run-summary-cost-cards`: the loading state names `AnalyticsCard.isLoading`

## Non-goals

- Migrating other legacy `Dial*` components (`DialInput`, `DialSelect`, `DialDropdown`, `DialLoader`).
- Removing the `tooltip.scss` shim; the three legacy components above still need it.
- Redesigning the wizards, run summary or detail panels. Visual deltas come from the kit.
- Changing the wizards' step-gating logic. The 2.0 `Steps` lets a user enter a step only when every earlier step is `StepStatus.VALID`; going back is always allowed.

## Impact

- ~30 source files and 9 spec files under `apps/ai-dial-admin/src`; `test-setup.tsx` only if it mocks one of these names.
- Visual deltas accepted from the kit: `LabelledText` caption is the kit's `Label`, its tooltip appears only while the text is clipped, and `AnalyticsBarGroup` is built on the 2.0 `Accordion`.
- Sites that depend on kit internals need a check: the `max-w-none` override in `PipelineRuntime` (the 200px cap on `LabelledText`), the `[data-histogram-y-axis]` selector in both `DistributionSection`s, `barClassName` hover styling, and the `MetricGroupTitle` truncation workaround.
- Accessibility: the stepper list gains a name and announced step statuses.
- No server, API, or context changes.
