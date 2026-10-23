## Why

Issue #5143 exposes a DIAL Core validation failure through AI Gateway → Models: an upstream interface can be saved with both its own Endpoint and the upstream Base URL empty. The form treats the interface Endpoint as optional even though Core can only fall back to a populated upstream Base URL, so the failure occurs only after the backend request.

## What Changes

- Make an upstream interface Endpoint required when its parent upstream has no Base URL, while keeping it optional when that fallback is populated.
- Keep the Endpoint label, field error, and Save button validity synchronized when the upstream Base URL changes.
- Retain the existing normalization of empty interface endpoints to an absent value so Core can use the upstream fallback rather than receiving an empty endpoint string.
- Ensure validation remains registered when an upstream’s details are collapsed, so collapsing does not bypass the required-endpoint rule.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `deployment-interfaces-config`: define conditional requiredness and live validation for an upstream interface endpoint based on its parent upstream Base URL.

## Impact

- `apps/ai-dial-admin/src/components/UpstreamEndpoints/Endpoint/Endpoint.tsx`
- `apps/ai-dial-admin/src/components/BaseControls/InterfacesField/InterfacesField.tsx`
- `apps/ai-dial-admin/src/components/BaseControls/InterfacesField/InterfaceEndpointRow.tsx`
- Component tests for upstream endpoint and interface field validation.
- No API contract, backend, dependency, or persisted-payload shape changes.

## Non-goals

- Changing DIAL Core validation or its absent-versus-empty endpoint semantics.
- Altering entity-level interface Base URL validation, which is already covered by the existing fallback behavior.
- Requiring an interface Endpoint when the parent upstream Base URL is present.
