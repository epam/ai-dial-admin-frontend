## Why

Issue #5147 moves the admin app from the legacy `Dial*` ui-kit components to the 2.0 generation, one batch at a time. Buttons, Tooltips, Switch, Label, ConfirmationPopup, NoDataContent, Spinner, the small components and the popup family are done. The text and choice controls are what remains of the large batches: `DialInput` (80 files), `DialSelectField` (76), `DialSelect` (35), `DialNumberInput` (28) and `DialDropdown` (15). ui-kit 0.16 ships `Input`, `NumberInput`, `Select` and `Dropdown` under `components/New/`, and no 2.0 `SelectField`.

## What Changes

- `DialInput` → `Input` (80 source files). Props carry over; `labelProps` takes the 2.0 `LabelProps`.
- `DialNumberInput` → `NumberInput` (28 files). Props carry over.
- `DialDropdown` → `Dropdown` (15 files). Props carry over; the 2.0 overlay moves focus into itself on open.
- `DialSelect` → `Select` (35 files). `elementId` becomes `id`; `size` / `variant` collapse into the 2.0 `size` (`ElementSize`). The 19 `SelectVariant.Secondary` sites are matched against `Select` at `ElementSize.Small` or `InlineSelect`, decided per site.
- `DialSelectField` → the 2.0 `Select` with `labelProps` (and `error`, `caption`) declared at each call site. No local `SelectField` wrapper is added: the 2.0 `Select` already carries its own label, caption and error.
- The three `inlineSearch` selects (`HFModelNameField`, `McpServerNameField`, the display-name field in `DeploymentProperties`) move to the same `Select` with `searchable`, without special handling: the typed text is no longer the value, and the search field only appears once the list passes the kit's row threshold. Their remote suggestions therefore stop working when the list starts empty; the registry buttons beside them stay the way to pick a server or model.
- Specs that import, mock or assert on these names move in the same change.
- The capability specs that name these components in a requirement are updated to the new names.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
No behaviour changes; each delta only renames the component a requirement names.
- `analytics/query-builder`: the source selector is a `Select`
- `application-source`: `DialApplication` source editing names `Select`
- `container-source-field-layout`: the image reference field is an `Input`
- `container-variables-row-layout`: the Mount type control is a `Select`; the Value row names `Input`
- `custom-range-picker`: `TimeFilter` is built on `Select` (requirement renamed)
- `image-source`: the source-type and image-type dropdowns are a `Select`
- `mcp-docker-image-source`: the container source field is an `Input`
- `mcp-registry-source`: `McpServerNameField` renders a searchable `Select`
- `save-as-new-image-on-rename`: the version field in the creation popup is an `Input`
- `stopped-container-display`: the modal selector is a `Select`

Not touched here: the `InternalImageField` requirement in `container-source-field-layout` and the container-warning requirement in `inline-source-field-warnings` also still name `DialInput` / `DialSelectField`, but `migrate-ui-kit-2-popups` already modifies those two requirements and is not archived yet. A final task sweeps them once it is.

## Non-goals

- Rebuilding the free-text combobox on `Input` + `Dropdown`. The 2.0 `Select` is never typeable; restoring typed values and remote suggestions is a possible follow-up.
- A local `SelectField` wrapper, or any reshaping of call-site APIs.
- `InputPopup` (already built on the 2.0 `Input`).
- Redesigning the controls. Visual deltas come from the kit.
- Fixing accessibility gaps at migrated sites beyond what the 2.0 component requires of the call site.

## Impact

- ~230 source files and their specs under `apps/ai-dial-admin/src`; `test-setup.tsx` only if it mocks one of these names.
- Visual deltas accepted from the kit: 2.0 field styling, the `Select` option list and selected-row tint, and the compact `Select` replacing the `Secondary` variant. Listed in the PR descriptions.
- Behaviour to check: the 2.0 `Dropdown` takes focus on open, so specs and keyboard flows that opened a `DialDropdown` menu may need adjusting.
- `DialSelectField`'s `label`, `required`, `captionDescription`, `caption`, `containerClassName` and `selectClassName` have no same-named 2.0 prop; the design maps each to `labelProps`, `caption`, `className` or `fieldClassName`. No call site uses the readonly view.
- No server, API, or context changes.
