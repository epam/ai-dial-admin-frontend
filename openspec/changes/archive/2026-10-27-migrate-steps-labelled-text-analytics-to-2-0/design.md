## Context

Issue #5147 migrates legacy `Dial*` ui-kit components to their 2.0 counterparts. ui-kit `0.16.0-dev.49` removed `DialSteps` and the four `DialAnalytics*` components; `DialLabelledText` is still exported. The 2.0 versions are `Steps`, `AnalyticsCard`, `AnalyticsBar`, `AnalyticsBarGroup`, `AnalyticsHistogram` and `LabelledText`, all under `components/New/`. The kit's guide is `migration-guides/0.16.0/legacy-analytics-and-steps-removal.md`.

Call sites: `DialSteps` in 8 wizard modals, `DialAnalytics*` in the Run Summary and Run Compare sections (6 files plus `Compare/Summary/models.ts`), `DialLabelledText` in the `Common/LabelledText` wrapper and ~12 direct sites. Nine specs mock the legacy names.

## Goals / Non-Goals

**Goals:**
- Remove every `DialSteps`, `DialAnalytics*` and `DialLabelledText` usage from app source and specs.
- Keep layout and behaviour; land as three PR-sized steps with both typecheck gates at zero.

**Non-Goals:**
- Changing the kit, or the wizards' step-gating logic.
- Removing the `tooltip.scss` shim.

## Decisions

### Analytics: rename only
Props are identical, and `AnalyticsCardVariant`, `AnalyticsBarColorStop` and `AnalyticsCardCompareItem` keep their names. `CompareCardItems` in `Compare/Summary/models.ts` is derived from `ComponentProps<typeof …>`, so it follows the rename.

Three sites lean on kit internals and are re-read rather than assumed:
- `[&_[data-histogram-y-axis]]:min-w-4` in both `DistributionSection`s. If the 2.0 histogram no longer carries `data-histogram-y-axis`, the override is dropped rather than rewritten.
- `barClassName="hover:… rounded-xs px-1"` on `AnalyticsBarGroup`. The admin passes `nonCollapsible`, so the 2.0 Accordion's `inert` collapsed content does not apply.
- `MetricGroupTitle` renders its own `Tooltip` because the legacy `titleTooltip` truncated the name. It stays: the 2.0 `titleTooltip` is still described as a header-title tooltip, and replacing a working workaround is outside a rename.

### Steps: rename plus translated names
`Steps` takes the same `Step[]`, `currentStep` and `onChangeStep`. It adds `ariaLabel` (the list's accessible name) and `statusLabels` (announced after a step's name; defaults are English `Completed` / `Error`).

Alternatives: leave both unset (smallest diff, but an unnamed list and untranslated announcements), or a local `WizardSteps` wrapper (one place for the labels, but a component the kit does not have). We pass both props at each of the 8 sites: `ariaLabel` is the wizard's own title key, which every site already has for its `Popup` header, and `statusLabels` is a shared constant-keyed pair in `Common/` so the two translated strings are not repeated eight times.

The kit's gating (enter a step only if every earlier step is `StepStatus.VALID`, going back always allowed) is accepted as is. Wizards drive forward movement through their own Next button, which sets `currentStep` directly, so the gate only affects clicks on the stepper.

### LabelledText: wrapper first, then direct sites
`Common/LabelledText` wraps the kit component and adds the copy button; it switches to `LabelledText` and keeps its props, so every site that goes through it needs no change. The direct sites change the import and tag name. The `tooltip` prop widens from `string` to `ReactNode`, which needs no change at call sites.

`PipelineRuntime` passes `max-w-none` to undo the 200px cap. The 2.0 component documents the same cap on its value, so the override is kept and checked against where `className` lands.

### Cleanup
The `tooltip.scss` comment drops `DialLabelledText` and `DialAnalytics*` from its list of 1.0-tooltip sources. The shim stays for `DialInput`, `DialSelect` and `DialDropdown`.

## Risks / Trade-offs

- [`Steps` gating differs from the legacy stepper for a wizard whose earlier steps have no status, e.g. `ImportFile`'s `zipStatus`] → Forward movement goes through each wizard's Next button, so only stepper clicks are affected; accepted.
- [`LabelledText` tooltip now shows only when the value is clipped] → Accepted as the kit's behaviour; sites passing an explicit `tooltip` still get it while clipped.
- [A kit-internal selector or class stops matching] → The three sites above are re-read against the 2.0 source during the task, not left to a visual pass.
