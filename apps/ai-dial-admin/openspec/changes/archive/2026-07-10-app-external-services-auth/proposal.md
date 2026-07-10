## Why

Apps in DIAL Core can declare `external_services` — named integrations that require their own credentials (OAuth or API key). The admin UI currently has no way to view, configure, or authenticate these services, so app owners cannot manage them without direct API access.

## What Changes

- **New `ResourceMultiAuth` component** placed above `EntityAttachments` in App Properties: shows a list of the app's external services with per-row Edit and Login/Logout buttons.
- **Step-like edit view** within `ResourceMultiAuth`: clicking Add or Edit opens an inline form (Service ID, Display Name, Description + auth settings picker), with a Back button to return to the list.
- **Generalize `ResourceAuthentication`** to accept `authSettings` + `name` + optional `onChangeForwardPerRequestKey` callback instead of a full `DialToolsetResource` — enabling reuse for both toolsets and external services.
- **New `ExternalServiceAuthButtons`** component: login/logout per service row, using APPLICATION and USER credential levels (not GLOBAL), and a new `/external-service-signin` OAuth callback page.
- **New `/external-service-signin` page**: OAuth callback handler for external services, mirroring `/toolset-signin`.
- **New `ExternalServiceOpsApi`** class: Core-direct sign-in/sign-out API (`POST /v1/ops/external-service/signin|signout`), registered in `api.ts`.
- **New server actions** `signInExternalService` / `signOutExternalService` in `assets-applications/actions.ts`.
- **Model additions**: `external_services` field on `DialApplicationResource`; new `DialExternalService` and `DialExternalServiceAuthSettings` types.
- **i18n additions**: strings for external services section, Application/User credential level labels, service fields.

## Capabilities

### New Capabilities

- `app-external-services-auth`: UI for listing, editing, and authenticating an app's external services within App Properties. Covers the multi-service list view, the step-like edit form, login/logout button behavior (APPLICATION + USER credential levels), OAuth callback page, API layer (ops API class + server actions), model types, and generalization of `ResourceAuthentication`.

### Modified Capabilities

<!-- No existing spec-level requirements change — this is purely additive. -->

## Impact

- **`Apps/Properties.tsx`**: adds `ResourceMultiAuth` above `EntityAttachments`.
- **`Assets/Resources/Auth/ResourceAuthentication.tsx`** and **`ResourceAuthTypeSection.tsx`**: props refactored; all existing toolset callers updated.
- **`DialApplicationResource` model** (`src/models/dial/resource.ts`): new `external_services` field.
- **`api.ts`**: new `externalServiceOpsApi` instance.
- **`assets-applications/actions.ts`**: two new server actions.
- **New files**: `ExternalServiceOpsApi`, `ResourceMultiAuth`, `ExternalServiceAuthButtons`, `/external-service-signin` page.
- **No breaking changes to existing toolset auth behavior.**
