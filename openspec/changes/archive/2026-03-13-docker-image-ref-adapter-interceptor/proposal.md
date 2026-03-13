## Why

Adapter and Interceptor containers can only be created from internal images. The backend already supports creating them from direct docker image references (like MCP containers), but the frontend doesn't expose this option. This limits users who want to deploy custom adapter/interceptor containers without first registering an internal image.

## What Changes

- Add "From Docker Image Reference" creation option for Adapter Containers (matching existing MCP flow)
- Add "From Docker Image Reference" creation option for Interceptor Containers (matching existing MCP flow)
- Add i18n keys `FromInternalAdapterImage` and `FromInternalInterceptorImage` for the dropdown labels
- Reuse existing `FromDockerImageReference` translation key for both

## Non-goals

- No new form fields or validation rules — reuse existing `IMAGE_REFERENCE` source type handling
- No changes to `ServingCreate` modal, `ContainerSource`, or `ContainerFields` — they are already source-type driven
- No changes to adapter/interceptor entity configuration (models association, interceptor assignment, etc.)

## Capabilities

### New Capabilities
- `docker-image-ref-adapter-interceptor`: Support creating Adapter and Interceptor containers from direct docker image references via the existing `IMAGE_REFERENCE` source type

### Modified Capabilities

_None — no existing spec-level requirements are changing._

## Impact

- `getContainerTemplate()` in `src/utils/deployments/containers.ts` — new branches for ADAPTER and INTERCEPTOR with IMAGE_REFERENCE
- `HeaderButtons` in `src/components/Containers/List/HeaderButtons.tsx` — dropdown for adapter/interceptor container routes
- i18n constants in `src/constants/i18n.ts` and translations in `src/locales/en.ts`
- No API changes — backend already supports this
