## Context

Issue #5147 moves the admin app from the kit's legacy `Dial*` components to its 2.0 generation, one component
at a time. This change takes four of five candidates in one PR; `DialTabs` is excluded (Decision 6).

Read from `@epam/ai-dial-ui-kit` 0.15.3:

| Legacy | 2.0 | Difference |
|---|---|---|
| `DialCheckbox` (`id`, `label`, `checked`, `indeterminate`, `ariaLabel`, `onChange(v?, id?)`) | `Checkbox` (`id`, `labelProps`, `isSelected`, `isIndeterminate`, `invalid`, `caption`, native input props, `onChange(v: boolean)`) | renames; props extend `<input>`, not `<label>` |
| `DialRadioGroup` (`radioButtons`, `activeRadioButton`, `elementId`, `fieldTitle`, `labelDescription`, many `*ClassName`) | `RadioGroup` (`items`, `value`, `id`, `labelProps`, `caption`, `error`, `orientation`, 4 class props) | item shape and several prop renames; style props mostly gone |
| `DialNotification` (`variant`, `title`, `message`, `closable`, `children`) | `Notification` (same plus `type`, `action`; renders `children`) | `type` defaults to a toast |
| `DialTag` (`label`, `className`, `selected`, `icon`, `closable`, `onClick`, `onRemove`) | `Tag` (adds `appearance`, `disabled`, `removeLabel`; `<span>`, fixed 32px) / `Badge` (`label`, `variant`, `color`, `icon`) | height and padding are baked in |

## Goals / Non-Goals

**Goals**
- No `DialTag`, `DialNotification`, `DialCheckbox` or `DialRadioGroup` import left under
  `apps/ai-dial-admin/src`.
- Same behaviour and copy; the visual change is the generation's own styling.
- Both typecheck gates and the suite stay green.

**Non-Goals**
- `DialTabs`, `DialTagInput`, any other legacy component, any redesign.

## Decisions

### 1. Checkbox: scripted prop rewrite

```
<DialCheckbox id label checked indeterminate ariaLabel onChange={(v) => …} />
        ↓
<Checkbox id labelProps={{ label }} isSelected isIndeterminate aria-label onChange={(v) => …} />
```

Scripted over the ~24 files; sites with `className`, a non-simple `label` or an `onChange` that reads the second
(`id`) argument are listed by the script and hand-edited. `!!v` guards on `onChange` become plain `v`.
*Alternative:* a repo `Common/Checkbox` wrapper keeping the legacy API. Rejected for the same reason as
`DialSwitch` earlier: it freezes the 1.0 API behind a layer to delete later.

### 2. RadioGroup: one mapper, not 20 hand-edited arrays

Option arrays are typed `RadioButtonWithContent` (`{id, name, content?, caption?}`) in ~10 files. A shared
`toRadioItems(buttons)` next to the model type maps `id → value`, `name → label`, and passes `content` /
`caption` through. Call sites then change only the prop names. `activeRadioButton` → `value`, `elementId` →
`id`, `fieldTitle` → `labelProps={{ label }}`, `labelDescription` → `caption`.
*Alternative:* rewrite each array to `RadioGroupItem` in place. Rejected: ~20 edits for no semantic gain, and
the legacy type would linger. The mapper is deleted once the arrays are rewritten natively, as a follow-up.

Legacy class props (`containerClassName`, `selectedLabelClassName`, …) have no 2.0 equivalent; each call site
that passes one is inspected and either dropped or moved to `className` / `optionsClassName` /
`radioClassName`. `Routes/Properties.tsx` (`containerClassName="w-[150px]"`) is the known case.

### 3. Notification: banners are section messages

2.0 `type` defaults to `Toast`. In-page banners (`ReadOnlyBanner`, `EntityBanner`, `UndeclaredPropertiesBanner`,
`AnalyticsImportNotices`, …) set `type={NotificationType.SectionMessage}`. `children` is still rendered, so the
`EntityBanner` CTA slot is unchanged; moving CTAs to the `action` prop is not adopted here. 2.0 maps variant to
`role` (`alert` / `status`): `ResourceOAuthSection` and `SessionTraceList` get a screen-reader check, and specs
that queried the old element by class move to role.

### 4. Tag vs Badge, decided per site

`Badge` has two looks: `Outlined` (neutral) and `Filled` with a fixed six-colour palette. Hand-styled status chips map to the nearest semantic colour; the `h-4` / `rounded-full` overrides are dropped.

| Site | Becomes |
|---|---|
| `ReadOnlyBadge`, `MetricSectionTabs` (schema read-only), `Assets/Modals/utils` version chips, `TryOutColumns` not-extracted status | `Badge` Outlined |
| `ExternalServiceConsentActions` ("Approved"), `TryOutColumns` extracted status | `Badge` Filled Green |
| `TryOutColumns` failed status | `Badge` Filled Red |
| `TestCaseNameCellRenderer` turn count, `TestCasesList` private, `Outputs` field name (all `accent-tertiary`) | `Badge` Filled Violet |
| `MultiValueAutocomplete`, `MultiSelectTagsRenderer`, `SingleValueAutocomplete`, `SchemaTreeItem`, `RulesValueReadonly`, `CompareRunTag`, attribute and data-type chips | `Tag` |

`TryOutColumns` replaces `badgeClass` in its status map with `badgeVariant` / `badgeColor`. `Tag` keeps `closable` + `onRemove`; `removeLabel` is `${t(ButtonsI18nKey.Remove)} ${label}`, so each remove button keeps a distinct accessible name instead of the kit's English default.

### 5. `MultiSelectTagsRenderer` measures real width

It lays out a hidden clone of every `Tag` to decide how many fit. `Tag` is 32px tall with px-3, so widths and
the `+N` count change. Both the visible and the hidden clones migrate together and its spec asserts the count
from rendered widths, not from the old class names.

### 6. Tabs stays on the legacy component

`DialTabs` is not migrated. 2.0 `TabItem` lacks `invalid` / `warning`, used by `ConfigurationPreview.utils`,
`Publications/View` and `ContainerView`, and lacks the responsive collapse and `desktopTabClassName`
(`ExecutionLog`). Migrating only the plain tab sets would leave two tab looks side by side; it is its own
change once the gap is resolved.

### 7. Specs

Seven requirements across six specs name a legacy component in normative text. Each gets a MODIFIED delta with
the new name; behaviour is unchanged. `application-source` mentions `DialRadioGroup` only in a historical
negative scenario and is left alone.

## Risks / Trade-offs

- **Visual drift in one PR** (box size, banner radius, chip height; 2.0 controls next to remaining 1.0 inputs)
  → accepted and stated in the proposal; layout classes are not removed.
- **Silent prop loss**: `label`, `checked`, `radioButtons`, `activeRadioButton` are not members of the 2.0 props,
  so a missed rename fails typecheck. A final grep confirms none remain.
- **Dropped style props on RadioGroup** → each site inspected (Decision 2).
- **Class-asserting specs break** (`dial-*` vs `dial-kit-*`) → updated to role and accessible name per
  `testing.md`.
- **Review size** (~110 files) → mostly import and prop renames; hand-written parts are the radio mapper, the
  Tag/Badge split and the script-flagged sites.

## Migration Plan

One PR. Order: Notification, Checkbox, then the radio mapper and RadioGroup, then Tag/Badge, then specs and the
full gate (`typecheck`, `typecheck:specs`, lint, format, tests). Rollback is a revert of the commit; the kit
version is unchanged.

## Open Questions

None outstanding.
