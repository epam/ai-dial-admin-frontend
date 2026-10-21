## Context

Assets Applications currently invoke the generic `CreateEntity` form, which presents identity and source-specific fields together. The route uses Core-compatible `DialApplicationResource` drafts, whereas regular Applications use a different model and source serialization. The existing `CreateKeyModal` demonstrates the local `DialFormPopup` multi-step pattern, and the asset Properties view already composes `ResourceSourceField` and `InterfacesField` with the required asset casing and interface-type configuration.

## Goals / Non-Goals

**Goals:**

- Provide a two-step, accessible creation flow only for `ApplicationRoute.AssetsApplications`.
- Preserve existing create action, bucket selection, validation, notifications, refresh, and navigation behavior.
- Make Interfaces the initial source mode without persisting a new unsupported source discriminator.
- Reuse the existing asset source and interface editors rather than duplicating their field behavior.

**Non-Goals:**

- Altering the existing asset application edit form or Core API payload contract.
- Changing public Applications creation.
- Changing Code App availability; it remains conditional on its existing editor-URL configuration.

## Decisions

### Introduce a route-specific CreateApplication modal

Create `Assets/Apps/CreateApplication.tsx` and route Assets Applications creation to it instead of adding step behavior to generic `CreateEntity`. The modal will use a local step enum and `DialFormPopup` branches modeled on `CreateKeyModal`.

The first step retains current creation controls and validation for id, display name, version, and description. It advances only when those existing requirements are met. The second step renders source configuration and submits through the same protected create flow used today, retaining success/error notifications, asset refresh, and destination navigation.

**Alternatives considered:**

- Extend generic `CreateEntity` with optional steps. Rejected because steps and source modes are specific to this one route and would make the generic component responsible for feature-specific layout and state.
- Create directly from the first step. Rejected because it defeats source configuration before persistence.

### Keep source selection UI-only for Interfaces

Define an asset-creation source-mode value for Interfaces and place it first in the creation selector. The new resource draft initializes `interfaces` to an empty object and Interfaces selection renders the existing `InterfacesField` with `ASSET_APPLICATION_INTERFACE_TYPES`, `isAsset`, platform translators, and the resource base URL fallback already used by asset Properties.

Endpoints, App Runner, and conditionally configured Code App continue through `ResourceSourceField` or its extracted/reused selector logic. Interfaces must not be encoded as a new Core `source` type; it is an editor mode for the existing `interfaces` resource field.

**Alternatives considered:**

- Add Interfaces to `SOURCE_TYPE`. Rejected because it would imply a persisted source type not supported by the existing Core resource contract.
- Copy `InterfacesField` into the modal. Rejected because the shared field already handles type availability, row editing, and asset field casing.

### Preserve asset source ordering and configuration gates

The new modal's selector order is Interfaces, Endpoints, App Runner, then Code App only when `CODE_APP_EDITOR_URL` is configured. Its default is Interfaces. Source transitions preserve the existing reset behavior for endpoint/schema/code fields and do not delete populated interface data merely because another mode is selected.

### Bound only the source step content height

Apply a 540px maximum height to the second `DialFormPopup` content area and retain an accessible scrollable region for large interface forms. The first step keeps the established modal sizing.

## Risks / Trade-offs

- [Generic and dedicated create paths drift] → Reuse the existing field controls, create action, protected-request behavior, and shared source/interface components; add targeted component tests.
- [Interfaces is mistaken for a Core source discriminator] → Keep its mode local to the creation UI and serialize only the pre-existing `interfaces` resource field.
- [Long interface configurations obscure submit controls] → Constrain source content to 540px and use the popup's scrolling behavior.
- [Conditional Code App behavior is lost] → Derive its visibility from the current editor-URL configuration, as the existing resource source editor does.

## Migration Plan

No data migration or backend rollout is needed. Deploy the client change; rollback restores the generic Assets Applications creation entry point without affecting stored resources.

## Open Questions

None.
