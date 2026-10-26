## Context

See proposal.md — Why. The legacy `DialSelect` with `inlineSearch` behaved as follows, and that is the parity target: the trigger was a plain `<input>`; every keystroke went to `onInlineQueryChange` (after `trimStart`); focus opened the list filtered by label; a click on an option called `onChange(option.value)` and put `option.label` in the input; closing the list called `onChange(typedText)`; an empty match showed nothing. The three call sites used it differently:

| Site                                | Typing                                     | Pick                   | Close                            |
| ----------------------------------- | ------------------------------------------ | ---------------------- | -------------------------------- |
| `DeploymentProperties` display name | sets `displayName` + validates             | sets `displayName`     | sets it again (idempotent)       |
| `HFModelNameField`                  | debounced HF search only                   | sets `modelName`       | sets `modelName` to the typed id |
| `McpServerNameField`                | records intent + debounced registry search | `name@version` → apply | typed name → freeform validation |

ui-kit 0.16 exports `Input`, `MenuItem`, `MenuItemMark` and `useThemeScope`, but not its overlay class constants. Its own `AutocompleteTagInput` is built from exactly `Input` + `MenuItem` + `@floating-ui/react` (`useFloating` with `offset`/`flip`/`size`, `FloatingPortal`), which is the recipe reused here. `@floating-ui/react` is already a direct app dependency (`Common/FilterEditor/FilterEditorPopover.tsx`).

## Goals / Non-Goals

**Goals:**

- One reusable single-value combobox under `Common/` with `AutocompleteTagInput`'s props and keyboard model.
- Behavioural parity with the table above at all three sites.

**Non-Goals:**

- Server-side search inside the component: consumers own fetching and pass `suggestions`.
- Grouped or nested options (the legacy `children` options): none of the three sites uses them.

## Decisions

### A new `Common/AutocompleteInput`, not an existing autocomplete

`Common/SingleValueAutocomplete` renders the value as a removable tag beside an empty input, uses the 1.0 `dial-input` styling and has no combobox ARIA; making it free-text would change every current consumer (`PricingRateControl`, `ReasoningEffortsInput`). Shared components are used, not bent to one caller, so a new component is added and the existing ones stay. Building on the 2.0 `Dropdown` was rejected: it is an action menu that moves focus into its overlay, while a combobox must keep focus in the input.

### API

`models.ts`:

```ts
export interface AutocompleteInputOption {
  value: string;
  label: string;
  description?: string;
}

export interface AutocompleteInputProps {
  id?: string;
  value: string;
  suggestions: AutocompleteInputOption[];
  maxSuggestions?: number; // default 5
  openOnFocus?: boolean;
  shouldFilterSuggestions?: boolean; // default true
  size?: ElementSize;
  labelProps?: LabelProps;
  placeholder?: string;
  caption?: string;
  error?: string;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  isLoading?: boolean; // spinner in the field + aria-busy
  ariaLabel?: string;
  listLabel?: string; // accessible name of the listbox
  className?: string;
  fieldClassName?: string;
  listClassName?: string;
  onChange: (text: string) => void;
  onSelect?: (option: AutocompleteInputOption) => void;
  onCommit?: (text: string) => void;
}
```

The tag-only props of `AutocompleteTagInput` (`tagListLabel`, `getRemoveTagLabel`, `tagClassName`, `defaultValue`) have no meaning for one value and are left out; the component is controlled only, like every form field in this app. Three callbacks instead of the legacy `onChange` + `onInlineQueryChange` pair, because the sites need to tell the cases apart: typing (`onChange`), a pick (`onSelect`, defaulting to `onChange(option.value)` when absent) and leaving the field (`onCommit`). Display name needs only `onChange`; HF and MCP keep the typed text locally, fetch on `onChange`, and write the model on `onSelect` / `onCommit` — reproducing the legacy "set on close" timing, so HF validation and MCP freeform lookups do not fire per keystroke.

### Behaviour details

- Filtering is a pure util (`utils.ts`, `filterAutocompleteSuggestions`) mirroring the kit's: label, value or description contains the query, case-insensitive, capped by `maxSuggestions`; `openOnFocus` with an empty query is uncapped. `shouldFilterSuggestions={false}` skips the match step (MCP and HF show server results as returned).
- A pick sets an internal "just picked" flag consumed by the next blur, so `onCommit` does not echo the pick. This replaces the echo-guard `McpServerNameField` carries today.
- Typing highlights nothing, unlike the kit's tag input, which highlights the first match. Here the typed text is itself a valid value, so Enter commits it instead of swapping in the first suggestion; a row is picked only after the user arrows to it.
- `McpServerNameField` skips a commit whose text equals the current `serverName`: tabbing through an applied server would otherwise re-resolve it by name alone and could swap its version for whichever one the registry lists first.
- `className` replaces the default `w-full` instead of being appended to it, so a caller's fixed width (`STANDARD_CONTROL_WIDTH`) does not fight `w-full`.
- Enter calls `preventDefault` in every case, so it never submits the surrounding `FormPopup`.
- The list is capped at 344px — the 2.0 `Select` list's cap — or the viewport's remaining height, whichever is smaller. Uncapped, the display-name list of a large stand ran past the popup to the viewport edge.
- `isLoading` puts the kit `Spinner` in the field's `iconAfter` slot and sets `aria-busy`, so loading is visible even before the list has anything to open. HF and MCP set it around their debounced search; both keep a latest-query ref so a slower answer for an earlier query neither replaces the suggestions nor clears the spinner of a later one, and an empty or failed answer clears the list instead of leaving the previous query's rows.
- The registry buttons beside HF and MCP align by `items-start` + `mt-6` (`ContainerSource/constants.ts`): the 2.0 field stacks a 16px label and an 8px gap above the 40px input, so a fixed offset matches the input whether or not an error renders below it. The legacy `self-center mb-1` centred the button on label + input + error and sat off the input.
- Rows call `preventDefault` on `mousedown` so a click does not blur the input before the pick lands.
- State lives in a hook `use-autocomplete-input.ts` (open, highlight, just-picked, filtered list, key handler); the component file is markup and wiring.

### Overlay styling

The list surface repeats the kit's overlay classes (`rounded-xl bg-layer-raised p-1 shadow-md`, `flex flex-col gap-0.5`, 4px gap) and applies `useThemeScope()` so it inherits a host theme scope through the portal. Rows are the kit `MenuItem` with `MenuItemMark.Tint`, so hover, focus and selection come from the kit. If a token class does not resolve under the app's Tailwind build, fall back to the `var(--bg-layer-raised)` form used in `Common/TimeFilter`.

### Tests

The kit's `Input`, `MenuItem` and `Spinner` are real in specs (no mock in `test-setup.tsx`), so `AutocompleteInput` is tested through roles: `combobox`, `listbox`, `option`, and the spinner's named `img`. The three sites' specs render the real `AutocompleteInput` — the `Select` mock the `McpServerNameField` spec used is gone — and assert on typed values, picks, commit on blur, the untouched-blur skip, loading and stale answers. The MCP stale-response cases (#3053) keep their intent and drive the real input with fake timers.

## Risks / Trade-offs

- [The repeated overlay classes drift from the kit's] → They are four token classes; the swap to a kit single-value combobox, when it ships, removes them.
- [Floating UI in jsdom reports zero-size rects] → Specs assert on presence, roles and callbacks, not on position.
- [HF and MCP now own a local text state alongside the model value] → Re-synced from the model value whenever it changes from outside (registry modal, source-type reset), the same way the legacy `customSelectedValue` effect did.
- [`DeploymentProperties` renders on the Properties tab too] → The field keeps its id `displayName`, its label and its validation path, so the tab behaves as before except for accepting free text.

## Migration Plan

Front-end only; ships in one PR. Rollback is a revert of that PR.
