## 1. Skills feature flag

- [x] 1.1 Add `skills_supported: boolean` to `DialResourceFeatures` and a `skillsSupported` `FeaturesI18nKey` with its `en.ts` label
- [x] 1.2 Add `skills_supported` to the tools group and label map in `Assets/Platform/Models/constants.ts` and `Assets/Resources/constants.ts`
- [x] 1.3 Change the `Features.Groups.ToolsFunctionCalling` string in `en.ts` to "Tools, Functions & Skills"
- [x] 1.4 Update/add tests for the Models and Applications Features tabs and the per-interface Features popup

## 2. Override paths

- [x] 2.1 Add `overridePaths?` to `DialResourceInterface` and `BaseUrlInterfaceValue`
- [x] 2.2 Add the per-`DeploymentInterfaceType` operation table (key, id-applicable) to `InterfacesField` constants, with i18n labels
- [x] 2.3 Build the override paths editor component: add button with dropdown (direct add when one operation remains), per-row delete, unknown-key preservation, `{id}` field error via `SaveValidationContext`
- [x] 2.4 Render it in `InterfaceRow` for passthrough rows on Models, Applications and Interceptors; clear and hide it in translator mode
- [x] 2.5 Add tests: per-type inputs, round trip with unknown keys, `{id}` validation, translator clearing, empty map omitted from payload

## 3. Docs and gates

- [x] 3.1 Update any `docs/` page describing interface or feature configuration
- [x] 3.2 Run `npm run typecheck`, `npm run typecheck:specs`, lint and the affected tests
