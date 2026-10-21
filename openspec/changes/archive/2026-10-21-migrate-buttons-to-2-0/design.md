## Context

Issue #5147 moves the admin app from the kit's legacy `Dial*` components to its 2.0 generation, one
component at a time. Buttons come first. Today `ChangedEntityButtons` and `CopyButton` hold both
generations behind `isDesignSystem2`, and about 230 other files use the legacy wrappers directly
(`DialNeutralButton` 171, `DialPrimaryButton` 140, `DialGhostButton` 102, `DialIconButton` 46,
`DialGhostIconButton` 41, `DialRemoveButton` 38, `DialDangerButton` 24, `DialLinkButton` 22,
`DialCloseButton` 13, `DialButton` 5, `DialPrimaryIconButton` 3).

Read from `@epam/ai-dial-ui-kit` 0.15.3, the 2.0 `Button` / `IconButton` take the same props as the legacy ones
(`variant`, `appearance`, `size`, `label`, `iconBefore`, `iconAfter`, `tooltipProps`) except that `hideTitleOnMobile`
is gone (the repo never passes it) and `tooltipProps` wraps the 2.0 `Tooltip`.

## Goals / Non-Goals

**Goals**
- No legacy button import left under `apps/ai-dial-admin/src`, and no `isDesignSystem2` on a button component.
- Each button keeps the variant and appearance it renders today; the only intended visual change is the
  generation's own height and colours, plus Discard staying solid (below).
- Both typecheck gates and the suite stay green.

**Non-Goals**
- `JsonToggle` / `Switch` and every other legacy component; `DialRadioButton`; any button redesign.

## Decisions

### 1. Map by rendered appearance, not by name

The wrappers do not default to the same appearance in the two generations:

| Wrapper | Legacy default | 2.0 default |
|---|---|---|
| Primary | Primary · Solid | Primary · Solid |
| Neutral | Neutral · **Outlined** | Neutral · **Solid** |
| Danger | Danger · **Outlined** | Danger · **Solid** |
| Ghost | Primary · Ghost | Primary · Ghost |
| Link | Primary · Link | Primary · Link |

So the mapping is:

```
DialPrimaryButton       → PrimaryButton
DialNeutralButton       → OutlinedButton                          (Neutral · Outlined)
DialDangerButton        → DangerButton appearance=Outlined
DialGhostButton         → GhostButton
DialLinkButton          → LinkButton
DialButton              → Button                                  (props carry over)
DialIconButton          → IconButton
DialGhostIconButton     → GhostIconButton
DialPrimaryIconButton   → PrimaryIconButton
DialCloseButton         → CloseButton (kit, direct)               Common/CloseButton deleted
DialRemoveButton        → Common/RemoveButton (new)
```

*Alternative considered:* rename blindly to `NeutralButton` / `DangerButton`. Rejected — it turns about 230
outlined buttons solid. `OutlinedButton` is exactly Neutral · Outlined, so Neutral needs no extra prop;
Danger has no such alias, so it carries `appearance` explicitly.

*Alternative considered:* adopt solid as the new look everywhere. Rejected as a redesign, which is a non-goal.

### 2. Which repo wrappers survive

The question was whether the repo's own button wrappers can go in favour of the kit's components directly.
Each was checked for what it adds beyond the kit button:

| Wrapper | Adds | Verdict |
|---|---|---|
| `Common/CloseButton` (4 importers) | only `aria-label={t(Close)}`; no caller passes `size` | **Delete.** Callers use the kit `CloseButton` with `ariaLabel={t(ButtonsI18nKey.Close)}`; the kit's default is a hardcoded English "Close", which the i18n rule forbids |
| `Common/CopyButton` (29) | clipboard write, localised toast, labelled vs icon-only | **Keep**: behaviour, not styling |
| `ChangedEntityButtons` (16) | discard confirmation modal, save-validation wiring | **Keep**: behaviour |
| `ResetFiltersButton`, `TryOutButton`, `AddEntitiesButton`, `AddDependenciesButton`, `FileButton`, `InterfaceDefaultsButton`, `InterfaceFeaturesButton` | grid-filter wiring, sidebar and modal state, file reading | **Keep**: feature components that merely contain a button |
| `DialRemoveButton` → `Common/RemoveButton` (38 call sites) | the kit has no 2.0 equivalent | **New wrapper**, below |

`Common/RemoveButton` is `src/components/Common/RemoveButton/RemoveButton.tsx`: an `IconButton` with
`ButtonVariant.Danger`, `ButtonAppearance.Outlined`, `icon={<IconTrashX … aria-hidden />}` and a default
`aria-label={t(ButtonsI18nKey.Delete)}` placed before the caller's spread (`components.md` §3). All 38 sites are
icon-only, and several today carry no accessible name at all, so the wrapper is what makes the named default
free.

*Alternative considered:* inline `IconButton` Danger · Outlined at each of the 38 sites. Rejected: the icon, its
size, `aria-hidden`, the variant pair and the label would repeat 38 times, and a site that forgets the
`aria-label` ships an unnamed button, which the kit's `IconButton` warns about but does not prevent. This is
the one wrapper that earns its place.

### 3. `CopyButton` after the flag

`isDesignSystem2` and the 1.0 labelled branch are deleted. The labelled button is the 2.0 `Button` (Neutral ·
Outlined, `IconCopy` before), named by its visible label, and now passes `size` through (the current 2.0 branch
dropped it, so `PreviewStatement`'s `ElementSize.Small` was silently ignored and will now take effect). The
icon-only branch becomes the 2.0 `IconButton` keeping `aria-label` `copy <valueLabel>`, since it has no visible
text. Only the labelled button loses the `copy <value>` name: its label is already visible and a name that
differs from it fails label-in-name (WCAG 2.5.3).

### 4. The change bar keeps the Tables / Pipelines look

The 2.0 branch of `ChangedEntityButtons` (the one `TableDetailView` and `PipelineDetailFrame` opt into) draws
Discard as `Button` Neutral with the default **Solid** appearance, and Save as Primary Solid. That is the
agreed target, so removing the flag keeps that branch verbatim and every other entity page's Discard goes
from outlined to solid. It is the one place that does **not** use `OutlinedButton`, deliberately, so the
codemod must not touch it.

### 5. Mechanical sweep via a codemod, reviewed by diff

The renames are textual and the props are identical, so a scripted pass (import specifier + JSX tag + closing
tag, one mapping table) does the ~230 files, followed by `prettier` so import lines sort the way
lint-staged expects. The hand-edited remainder is small and enumerable:

- `Common/RemoveButton` (new), the 4 `Common/CloseButton` importers (the wrapper is deleted), `ChangedEntityButtons`, `CopyButton` and its callers.
- `DialDangerButton` sites, which need the extra `appearance` prop and a `ButtonAppearance` import.
- `tooltipProps.placement` on migrated buttons (the only 2.0 API break): `TooltipPlacement` has four sides, so
  an aligned value like `top-start` is replaced by its side. Only 5 files use `tooltipProps` at all.
- Specs asserting legacy classes or names.

The script lives in the scratchpad and is not committed.

### 6. Specs

Eleven requirements across eleven capability specs name a legacy button in normative text ("SHALL be rendered
as a `DialNeutralButton`"). Each gets a MODIFIED delta with the new component name; behaviour is unchanged.
Archiving folds them into the consolidated specs.

## Risks / Trade-offs

- **Visual drift in one PR** (heights, colours; 2.0 buttons beside 1.0 inputs until Input migrates) →
  accepted and stated in the proposal; no layout class on a button is removed, so spacing is unchanged.
- **Wrong appearance on Neutral / Danger** is the one silent failure of a rename → decision 1, plus a final grep
  that no `NeutralButton` / bare `DangerButton` remains outside `ChangedEntityButtons`.
- **Class-asserting specs break** (legacy `dial-*` class names vs `dial-kit-*`) → they are updated to assert
  role and accessible name, per `testing.md`; the opt-in spec's flag tests are removed with the flag.
- **Review size** (~234 files) → the diff is almost entirely import and tag renames; the hand-written part is
  listed in decision 5 so a reviewer knows where to look.
- **`tooltipProps` placement** values that do not exist in `TooltipPlacement` fail typecheck rather than runtime,
  so they cannot slip through.

## Migration Plan

One PR. Order inside it: new `RemoveButton` and the shared components first, then the codemod, then the hand
fixes, then specs and the full gate (`typecheck`, `typecheck:specs`, lint, format, tests). Rollback is a
revert of the single commit; nothing outside the app depends on it and the kit version is unchanged.

## Open Questions

None outstanding.
