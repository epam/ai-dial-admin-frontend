## Context

Issue #5147 moves the admin app from the kit's legacy `Dial*` components to its 2.0 generation, one component
at a time. The buttons landed first and left `JsonToggle` behind, because it is a `Switch`: it is the only
remaining `isDesignSystem2` (callers: `TableDetailView` ×3, `PipelineDetailFrame`).

Read from `@epam/ai-dial-ui-kit` 0.15.3:

| Legacy | 2.0 | Difference |
|---|---|---|
| `DialSwitch` (`switchId`, `label`, `isOn`, `disabled`, `onChange(bool)`, `caption`) | `Switch` (`id`, `labelProps`, `isOn`, `disabled`, `onChange(bool)`, `caption`, native input props) | `switchId`→`id`, `label`→`labelProps.label` |
| `DialTooltip` | `Tooltip` | `placement` is `TooltipPlacement` (four sides); adds `asChild` |
| `DialEllipsisTooltip` | `EllipsisTooltip` | same props; four-sided `placement` |
| `DialTooltipContainer` / `Content` / `Trigger` | `TooltipContainer` / `Content` / `Trigger` | same shape |

## Goals / Non-Goals

**Goals**
- No `DialSwitch`, `DialTooltip`, `DialEllipsisTooltip` or `DialTooltip{Container,Content,Trigger}` import left
  under `apps/ai-dial-admin/src`, and no `isDesignSystem2` anywhere.
- Same behaviour, labels and DOM structure; the only visual change is the generation's own styling.
- Both typecheck gates and the suite stay green.

**Non-Goals**
- `asChild`, `InteractiveTooltip`, other legacy components, any redesign.

## Decisions

### 1. Switch: mechanical prop rewrite

```
<DialSwitch switchId="x" label={l} isOn={v} disabled={d} onChange={f} caption={c} />
        ↓
<Switch id="x" labelProps={{ label: l }} isOn={v} disabled={d} onChange={f} caption={c} />
```

Scripted over the 44 sites (rename tag, `switchId`→`id`, wrap `label`). A site without `label` (one) gets no
`labelProps`. Any site whose `label` is not a simple expression, or that passes an unexpected prop, is listed by
the script and hand-edited. `JsonToggle` is the model: it already renders this shape under the flag.

*Alternative considered:* a repo `Common/Switch` wrapper keeping the legacy `label` / `switchId` props to make
the sweep a pure rename. Rejected: it preserves the 1.0 API forever and every wrapper is something to delete
later; the rewrite is mechanical anyway.

### 2. Tooltip: plain rename, no `asChild`

The renames are textual and the props are identical, so the same scripted pass (import specifier, opening and
closing tag) does the tooltips, with the same tag-and-import sweep for the `Container` / `Content` / `Trigger`
primitives. The wrapper `<span>` stays, so layout and `triggerClassName` behave as today.

*Alternative considered:* `asChild` where the child is a real control (for example the `<button>` in
`FieldDropdownOption`), so `aria-describedby` lands on the control. Rejected for this change: it needs per-site
judgement across ~90 sites and risks layout shifts (the trigger `<span>` carries `triggerClassName`); it belongs
in a dedicated a11y follow-up.

### 3. Placement: enum, nearest side for aligned values

`TooltipPlacement` has `Top | Right | Bottom | Left`. Plain strings map one-to-one to the enum. The three aligned
values take the nearest side:

| File | Was | Becomes |
|---|---|---|
| `Assets/Resources/ResourceFeatures.tsx` | `bottom-start` | `TooltipPlacement.Bottom` |
| `EntityTabs/Features/Features.tsx` | `bottom-start` | `TooltipPlacement.Bottom` |
| `TestSuites/Common/DynamicConfiguration/AttributeOption.tsx` | `right-start` | `TooltipPlacement.Right` |

A string literal left on a migrated `Tooltip` fails typecheck, so none can slip through. Other `placement`
props in the repo (`DialDropdown`, popovers) are not tooltips and are untouched.

### 4. `JsonToggle` after the flag

`isDesignSystem2` and the `DialSwitch` branch are deleted; `JsonToggle` renders `Switch` with
`id="jsonEditor"`. Callers drop the prop. The opt-in spec's flag tests go; the remaining coverage asserts the
switch by role and name.

### 5. Specs

Four requirements across four capability specs name a legacy component in normative text. Each gets a MODIFIED
delta with the new name; behaviour is unchanged. The `argument-template-editor` boolean scenario's "`DialSwitch`
or checkbox" becomes "`Switch` or checkbox".

## Risks / Trade-offs

- **Visual drift in one PR** (switch size, label placement, bubble style; 2.0 switches next to 1.0 inputs until
  Input migrates) → accepted and stated in the proposal; layout classes are not removed.
- **Silent `label` loss on Switch**: `label` is not a `SwitchProps` member, so a missed `label`→`labelProps`
  rewrite fails typecheck. A final grep confirms no `switchId` remains.
- **Class-asserting specs break** (`dial-*` vs `dial-kit-*`) → updated to query by role and accessible name per
  `testing.md`.
- **Review size** (~107 files) → almost entirely import and tag renames; the hand-written part is `JsonToggle`,
  the three placements and any script-flagged Switch sites.

## Migration Plan

One PR. Order: `JsonToggle` and its callers first, then the codemod, then the hand fixes, then specs and the
full gate (`typecheck`, `typecheck:specs`, lint, format, tests). Rollback is a revert of the single commit; the
kit version is unchanged.

## Open Questions

None outstanding.
