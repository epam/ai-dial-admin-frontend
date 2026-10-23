## Context

Issue #5147 migrates legacy `Dial*` ui-kit components to their 2.0 counterparts. ui-kit 0.16.0-dev.36 ships `Input`, `NumberInput`, `Select`, `Dropdown` and `InlineSelect` under `components/New/`. It ships no 2.0 `SelectField`. The legacy exports remain, so migrated and unmigrated code coexist.

Call sites (source, from the import scan): `DialInput` 80 files, `DialSelectField` 76, `DialSelect` 35, `DialNumberInput` 28, `DialDropdown` 15. `DialSelectField` is a thin wrapper: a `DialFormItem` (label, description, error, container class) around a `DialSelect` (`invalid` set from `error`, `elementId` from `id`) with a readonly view no call site uses.

## Goals / Non-Goals

**Goals:**
- Remove every `DialInput`, `DialNumberInput`, `DialDropdown`, `DialSelect` and `DialSelectField` usage from app source and specs.
- Keep layout and behaviour; land as PR-sized task groups with both typecheck gates at zero.

**Non-Goals:**
- Restoring free-text entry and remote suggestions for the three former `inlineSearch` selects.
- A local `SelectField` wrapper, changing the ui-kit, or reshaping call-site APIs.

## Decisions

### Input, NumberInput, Dropdown: renames
`Input` keeps the `DialInput` props, `NumberInput` the `DialNumberInput` props, and `Dropdown` the `DialDropdown` props (the flat `items`, `onItemClick`, `menuHeader`, `menuFooter` shape). `labelProps` takes the 2.0 `LabelProps`, which is the 2.0 `Label` already used across the app. Order: Dropdown, NumberInput, Input, so the smaller batches validate the approach first.

`NumberInput` types `onChange` as `(value?: number | string)`; call sites that cast the legacy value keep their handlers and only the import changes.

### Select: rename plus size
| Legacy `DialSelect` | 2.0 `Select` |
|---|---|
| `elementId` | `id` |
| `size={SelectSize.Sm}` + `variant={SelectVariant.Secondary}` | `size={ElementSize.Small}`, or `InlineSelect` where the control sits in a toolbar without a field box |
| `size` default (`Md`) | default (`ElementSize.Standard`) |
| `inlineSearch` | `searchable` |
| `onInlineQueryChange` | `onSearchQueryChange` |
| `className`, `listClassName` | same; the field box takes `fieldClassName` |

The 19 `Secondary` sites are decided one by one against the 2.0 look: `Select` at `ElementSize.Small` is the default; `InlineSelect` only where the control is a borderless trigger and its option shape (`DropdownItem`) fits without a mapper. The choice per site is listed in the PR. `Select` needs an accessible name: a site without visible label text passes `ariaLabel`.

### SelectField: inline Select with labelProps
Alternatives: a local `SelectField` wrapper keeping the legacy props (smallest diff, but invents a component the kit does not have, and the 2.0 `Select` already renders label, caption and error), or `Label` + `Select` composed by hand at every site (the same shape as before, without the kit's `htmlFor` and error wiring). We inline `Select` with `labelProps`, matching how `Input` call sites already look.

| Legacy `DialSelectField` | 2.0 `Select` |
|---|---|
| `id` | `id` (also the `labelProps.htmlFor` link is wired by the field) |
| `label`, `required`, `captionDescription` | `labelProps={{ label, required, caption: captionDescription }}` |
| `caption` (description under the field) | `caption` |
| `error` | `error` + `invalid` |
| `containerClassName` | `className` |
| `selectClassName` | `fieldClassName` |
| `defaultEmptyText`, `readonly`, `childrenClassName` | no use in the app, dropped |

A site becomes:
```tsx
<Select
  id="sourceType"
  className="w-[220px]"
  labelProps={{ label: t(EntitiesI18nKey.SourceType) }}
  value={image.source.$type}
  options={sourcesList}
  onChange={onSourceTypeChange}
  disabled={isReadOnlyAdmin}
/>
```
A site that spreads a local `required` flag keeps passing it through `labelProps.required`, so the visual asterisk and the visually hidden text stay together.

### inlineSearch sites: plain Select
The three typeable selects become a `Select` with `searchable` and `onSearchQueryChange`, with no further handling. Consequences accepted: the typed text is not the value (the display-name field stops accepting a name outside the list), and the kit renders the search field only above a row threshold, so a list that starts empty and fills from the query (`HFModelNameField`, `McpServerNameField`) no longer gets typed suggestions; the registry buttons remain. The `Select` also reports an empty query when its list closes, so `McpServerNameField` ignores empty queries, otherwise a pick would mark its own registry lookup stale. Its stale-response specs stand in a `Select` mock exposing the query and pick callbacks.

### Mechanics
Order: Dropdown, NumberInput, Input, Select, SelectField. Each is its own task group and PR-sized commit group. Specs keep asserting by role and accessible name per `testing.md`; `Select` exposes a `combobox` whose popup is an option list, and specs that clicked the legacy trigger or options adapt to those roles. Any spec that mocks one of the five names by string is updated with its component. Import from `@epam/ai-dial-ui-kit`; no new shared code.

## Risks / Trade-offs

- [`Dropdown` takes focus into the overlay on open, `DialDropdown` did not] → run the specs of the 15 sites; fix queries and keyboard flows that assumed focus stayed on the trigger.
- [`Select` without a visible label is unnamed] → add `ariaLabel` at every such site; grep for `<Select` without `labelProps` or `ariaLabel` at the end.
- [`Secondary` variant has no 2.0 equivalent] → per-site choice of `ElementSize.Small` or `InlineSelect`, listed in the PR; accepted 2.0 look.
- [Field box height and spacing differ (`Input`, `NumberInput`, `Select` share the 2.0 field)] → accepted; flagged for grid and row layouts that pinned heights, such as the `container-variables-row-layout` y-alignment spec.
- [A spec still asserts the old DOM and passes by accident] → grep specs for each legacy name; none may remain except the three `inlineSearch` files.
- [Typed suggestions and free-text names are lost at the three former `inlineSearch` sites] → accepted; recorded in the proposal.

## Open Questions

None.
