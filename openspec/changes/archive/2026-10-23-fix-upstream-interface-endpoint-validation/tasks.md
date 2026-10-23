## 1. Persistent upstream interface validation

- [x] 1.1 Update `apps/ai-dial-admin/src/components/UpstreamEndpoints/Endpoint/Endpoint.tsx` to derive and register persistent SaveValidationContext validity for configured interfaces that have neither an endpoint nor the parent upstream Base URL, using a validation key that remains mounted while details are collapsed.
- [x] 1.2 Pass the current parent upstream Base URL from `Endpoint` into its `InterfacesField` endpoint-variant instances, and clean up the persistent validation field when the upstream is removed.

## 2. Conditional interface endpoint validation

- [x] 2.1 Update `apps/ai-dial-admin/src/components/BaseControls/InterfacesField/InterfacesField.tsx` to thread an upstream Base URL fallback value to `InterfaceEndpointRow` only for `InterfaceFieldVariant.Endpoint`.
- [x] 2.2 Update `apps/ai-dial-admin/src/components/BaseControls/InterfacesField/InterfaceEndpointRow.tsx` to derive endpoint requiredness from the parent upstream Base URL, reflect it in the label and URL validation, and revalidate when the fallback changes while preserving empty endpoints as `undefined`.

## 3. Automated coverage

- [x] 3.1 Extend `apps/ai-dial-admin/src/components/BaseControls/InterfacesField/tests/InterfacesField.spec.tsx` with endpoint-variant coverage for required markers, validation dispatch, and both directions of upstream Base URL changes.
- [x] 3.2 Extend `apps/ai-dial-admin/src/components/UpstreamEndpoints/Endpoint/Endpoint.spec.tsx` with integration coverage that an empty interface endpoint blocks validation without a Base URL, is optional with one, and remains blocked after collapsing the upstream.

## 4. Quality gates

- [x] 4.1 Run the focused Vitest specs for `InterfacesField` and `Endpoint` from `apps/ai-dial-admin/`.
- [x] 4.2 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and `npm run test` from the repository root; resolve regressions introduced by this change.

Browser verification task omitted: the user opted to rely on focused component coverage and quality gates instead of the automated Playwright verification task.
