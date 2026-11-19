## 1. Plugin options

- [x] 1.1 Register `ConfigFileEntityType.Plugins` in `src/constants/config-file-core.ts` for the failure-preserving `src/server/config-entities/read.ts` metadata/config-file union, including all Platform metadata pages and duplicate-name precedence.
- [x] 1.2 Load plugin options independently of entity and other option reads in the platform model detail page and the standalone Translator list/create and detail flows; propagate successful names and partial/total failure information through their existing View/TabsContent/modal paths using the caller's token.

## 2. Shared base-URL control

- [x] 2.1 Add a focused reusable `BaseControls` base-URL control using existing ui-kit controls and localized Url/Plugin labels; wire accessible radio grouping, selector state, read-only behavior and field-scoped validation without widening generic HTTP URL validation.
- [x] 2.2 Implement Core-compatible plugin URL parsing and option mapping, preserving missing references and suffixes until an explicit source/selection change; handle empty, invalid, required, optional, external reset and discard states without emitting changes on option loading.
- [x] 2.3 Add localized, accessible partial/total option-load warnings and retain surviving options and existing values.

## 3. Model and Translator integration

- [x] 3.1 Replace the platform model entity-level `EndpointControl` in `Assets/Platform/Models/Properties.tsx` with the new control, preserving `baseUrl` persistence, optionality and read-only behavior.
- [x] 3.2 Opt the platform model's `InterfacesField` and `InterfaceRow` passthrough rows into the control; preserve interface `base_url` casing, inheritance and requiredness, existing Translator mode, and other consumers' behavior.
- [x] 3.3 Validate `overridePaths` against each passthrough interface's effective URL, including inherited model changes, without silently removing configured paths; keep explicit HTTP interface overrides valid.
- [x] 3.4 Integrate the control into standalone `Assets/Platform/Translators/CreateProperties.tsx` for both create and detail, retaining requiredness, save/discard, notifications and read-only behavior.

## 4. Tests

- [x] 4.1 Add unit tests for plugin option loading and union, including pagination, duplicate names, caller access, empty lists, partial and total failures.
- [x] 4.2 Add unit/component tests for all new and updated parsing, validation and base-URL control code: prefixed labels/values, source switches, accessibility, suffix and missing-reference preservation, loading failures, reset, discard and read-only state.
- [x] 4.3 Extend platform model, interface and Translator create/detail tests for exact payloads, requiredness and fallback, inherited and explicit plugin override-path conflicts, notifications, and unchanged application/interceptor/custom-translator behavior. Add shared mocks to `test-setup.tsx` if required.

## 5. Final quality checks

- [x] 5.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and `npm run test`; resolve failures and report any environmental blockers.
