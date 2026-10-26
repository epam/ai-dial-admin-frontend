## Why

`migrate-ui-kit-2-inputs-and-selects` moved the three typeable `DialSelectField inlineSearch` fields to the 2.0 `Select`, which is never typeable. The display name of a new model, application or toolset can now only be picked from existing names (Issue #5223), and the HuggingFace model name and MCP server name fields lost their typed suggestions: a list that starts empty never shows the search field. That change recorded the loss as accepted and named a free-text combobox as the follow-up; ui-kit 2.0 still ships no single-value one (`AutocompleteTagInput` holds a tag list), so the admin app builds its own.

## What Changes

- New `Common/AutocompleteInput`: a single-value 2.0 combobox. The field is a 2.0 `Input` whose text is the value; a floating list of 2.0 `MenuItem` rows suggests matches while typing. It carries every `AutocompleteTagInput` prop that applies to one value (`suggestions`, `maxSuggestions`, `openOnFocus`, `size`, `labelProps`, `placeholder`, `caption`, `error`, `invalid`, `disabled`, `readOnly`, `ariaLabel`, class-name hooks) and the same ARIA combobox keyboard model, plus what the three fields need: typed text reported on every edit, a pick that reports the option, a commit of the typed text when the field is left, and a switch to show server-side results unfiltered.
- `DeploymentProperties` display name → `AutocompleteInput`: any name can be typed; existing names stay as suggestions.
- `HFModelNameField` → `AutocompleteInput`: any model id can be typed; HuggingFace search results appear as suggestions after three characters again.
- `McpServerNameField` → `AutocompleteInput`: any server name can be typed and is validated against the registry when the field is left; registry search results appear as suggestions again.
- Specs and docs that name the `Select` at these three sites move in the same change.

## Capabilities

### New Capabilities

- `autocomplete-input`: the `Common/AutocompleteInput` contract — free-text value, suggestion list, keyboard and ARIA model, commit on leave.
- `free-text-suggestion-fields`: the three fields that accept typed values with suggestions — the deployment display name, the HuggingFace model name and the MCP server name.

### Modified Capabilities

- `mcp-registry-source`: the MCP Server Name Field requirement renders `AutocompleteInput` instead of a searchable `Select`; registry results are shown unfiltered as suggestions, and a typed name is validated when committed. Both the autocomplete and the Freeform Validation lookup ask for a full registry page (`MCP_REGISTRY_PAGE_SIZE`) instead of 5 / 10: the backend filters page by page with a fixed page budget, so a page of 5 left container searches with almost no suggestions.

## Non-goals

- Replacing `Common/SingleValueAutocomplete` or `Common/MultiValueAutocomplete`, or touching their consumers.
- Contributing a single-value mode to ui-kit. When the kit ships one, `AutocompleteInput` is swapped for it in a follow-up.
- Changing the validation rules or debounce timings of the three fields, or the fetch limits of the display-name and HuggingFace fields. The MCP registry limits do change (see Modified Capabilities).
- Converting any other `Select` to free text.

## Impact

- New: `apps/ai-dial-admin/src/components/Common/AutocompleteInput/` (component, `models.ts`, tests).
- Edited: `components/EntityMainProperties/Properties/DeploymentProperties.tsx`, `components/Deployments/Fields/ContainerSource/HFModelNameField.tsx`, `components/Deployments/Fields/ContainerSource/McpServerNameField.tsx` and their specs.
- Shared surface: `DeploymentProperties` backs the create popup and the Properties tab of Models, Applications and Toolsets; `McpServerNameField` is used by both containers and images.
- `@floating-ui/react` is already a direct dependency. ui-kit does not export its overlay class constants, so the list surface repeats the kit's token classes.
- No server, API or context changes.
