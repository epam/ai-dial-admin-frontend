## 1. Common/AutocompleteInput

- [x] 1.1 Add `apps/ai-dial-admin/src/components/Common/AutocompleteInput/models.ts` with `AutocompleteInputOption` and `AutocompleteInputProps` as in design.md
- [x] 1.2 Add `Common/AutocompleteInput/utils.ts` with the pure `filterAutocompleteSuggestions(suggestions, query, maxSuggestions, shouldFilter)`
- [x] 1.3 Add `Common/AutocompleteInput/use-autocomplete-input.ts`: open state, highlight, just-picked flag, filtered list, key handler (arrows with wrap, Enter pick-or-commit with `preventDefault`, Escape), focus/blur handlers
- [x] 1.4 Add `Common/AutocompleteInput/AutocompleteInput.tsx`: 2.0 `Input` as `combobox` with `aria-autocomplete`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `aria-invalid`; `FloatingPortal` listbox of `MenuItem` rows (`MenuItemMark.Tint`, `mousedown` `preventDefault`) using the kit overlay token classes and `useThemeScope()`
- [x] 1.5 Unit tests: `Common/AutocompleteInput/tests/utils.spec.ts` (match on label/value/description, cap, uncapped open-on-focus, filtering off) and `tests/AutocompleteInput.spec.tsx` covering every scenario in `specs/autocomplete-input/spec.md`, queried by role

## 2. Deployment display name

- [x] 2.1 In `components/EntityMainProperties/Properties/DeploymentProperties.tsx` replace the display-name `Select` with `AutocompleteInput` (`id="displayName"`, `openOnFocus`, sorted unique existing names as suggestions, `onChange` → `onChangeDisplayName`, read-only admin → `disabled`)
- [x] 2.2 Update `EntityMainProperties/Properties/tests/DeploymentProperties.spec.tsx`: typed name outside the list reaches `onChangeEntity`, a picked name too, clearing the field blocks Save, read-only admin disables the field

## 3. HuggingFace model name

- [x] 3.1 In `components/Deployments/Fields/ContainerSource/HFModelNameField.tsx` replace the `Select` with `AutocompleteInput`: local text state re-synced from `container.source.modelName`, `onChange` → text + debounced search, `shouldFilterSuggestions={false}`, `onSelect` / `onCommit` → `onChangeModelName`
- [x] 3.2 Update `ContainerSource/tests/HFModelNameField.spec.tsx`: typed id committed on blur, suggestions after three characters, picked id applied, running container disables field and button

## 4. MCP server name

- [x] 4.1 In `components/Deployments/Fields/ContainerSource/McpServerNameField.tsx` replace the `Select` with `AutocompleteInput`: local text re-synced from `serverName`, `onChange` → intent + debounced search, `shouldFilterSuggestions={false}`, options labelled by name and described by version, `onSelect` → `onChangeServerName(option.value)`, `onCommit` → `onChangeServerName(text)`; drop the empty-query and echo guards the `Select` needed
- [x] 4.2 Update `ContainerSource/tests/McpServerNameField.spec.tsx` to the real `AutocompleteInput`: typed name committed on blur runs freeform validation, a pick keeps its version and the following blur starts no second lookup, stale-response cases keep their intent

## 5. Specs and docs

- [x] 5.1 Grep `openspec/specs/` and `docs/` for requirements or docs that still describe these three fields as a searchable `Select` and align them in this change (beyond the `mcp-registry-source` delta)

## 6. Verification

- [x] 6.1 Run the `spec-browser-verify` skill for this change against the local app (auth disabled) and resolve every `fail` verdict

## 7. Quality gates

- [x] 7.1 Run `npm run lint`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test` from the repo root; all pass
