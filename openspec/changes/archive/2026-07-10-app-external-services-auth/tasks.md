## 1. Models

- [x] 1.1 Add `DialExternalServiceAuthSettings` interface to `src/models/dial/resource.ts` — extends `DialToolsetResourceAuthSettings` with `app_level_auth_status?: ToolsetAuthStatus`
- [x] 1.2 Add `DialExternalService` interface to `src/models/dial/resource.ts` — fields: `display_name?: string`, `description?: string`, `auth_settings?: DialExternalServiceAuthSettings`
- [x] 1.3 Add `external_services?: Record<string, DialExternalService>` field to `DialApplicationResource` interface in `src/models/dial/resource.ts`

## 2. API Layer

- [x] 2.1 Create `src/server/core/external-service-ops-api.ts` — `ExternalServiceOpsApi` class extending `CoreApi`, with `signIn(token, body)` and `signOut(token, body)` methods (`POST v1/ops/external-service/signin` and `POST v1/ops/external-service/signout`)
- [x] 2.2 Register `externalServiceOpsApi` instance in `src/app/api/api.ts` using `DIAL_CORE_API_URL`

## 3. Server Actions

- [x] 3.1 Add `signInExternalService(appId, serviceId, level, authType, redirectUrl?, apiKey?, code?)` server action to `src/app/[lang]/assets-applications/actions.ts` — constructs body with `url = applications/{appId}/external_services/{serviceId}` and calls `externalServiceOpsApi.signIn`
- [x] 3.2 Add `signOutExternalService(appId, serviceId, level, authType)` server action to `src/app/[lang]/assets-applications/actions.ts` — calls `externalServiceOpsApi.signOut`

## 4. Generalize ResourceAuthentication

- [x] 4.1 Update props of `ResourceAuthentication` (`src/components/Assets/Resources/Auth/ResourceAuthentication.tsx`): replace `toolset: DialToolsetResource` with `name: string`, `authSettings?: DialToolsetResourceAuthSettings`, optional `redirectUrl?: string`, optional `onChangeForwardPerRequestKey?: (val: boolean) => void`; update `onChange` to `(authSettings: DialToolsetResourceAuthSettings) => void`
- [x] 4.2 Update `ResourceAuthTypeSection` (`src/components/Assets/Resources/Auth/ResourceAuthTypeSection.tsx`): replace `toolsetName: string` prop (already a string — confirm no type change needed); confirm `authSettings` prop already independent of toolset shape
- [x] 4.3 Update the asset toolset caller(s) of `ResourceAuthentication` to pass the new props: `name`, `authSettings`, `redirectUrl={TOOLSET_AUTH_REDIRECT_URL}`, adapted `onChange`, and `onChangeForwardPerRequestKey`

## 5. OAuth Callback Page

- [x] 5.1 Create localStorage utility helpers for external service OAuth state: `setExternalServiceOAuthState`, `getExternalServiceOAuthState` (parallel to `setLevels`/`getLevels` in `Assets/Resources/Auth/`) — store `{ callbackUrl, appId, serviceId, credentialsLevel }` under a dedicated key
- [x] 5.2 Create `src/app/[lang]/external-service-signin/page.tsx` — reads state from localStorage, calls `signInExternalService` with the OAuth code, navigates back to `callbackUrl` on success, shows error notification on failure

## 6. i18n

- [x] 6.1 Add i18n keys for external services UI: section label (`ExternalServices`), credential level labels (`ApplicationLevel`, `UserLevel`), service fields (`ServiceId`, `ServiceDisplayName`, `ServiceDescription`), and action labels (`AddService`, `BackToServices`) — add to the appropriate i18n enum and locale files

## 7. ExternalServiceAuthButtons Component

- [x] 7.1 Create `src/components/Assets/Resources/Auth/ExternalServiceAuthButtons.tsx` — mirrors `ResourceAuthButtons` but: uses `appId` + `serviceId` for URL construction (`applications/{appId}/external_services/{serviceId}`), uses APPLICATION + USER levels (not GLOBAL), redirects to `/external-service-signin` for OAuth, calls `signInExternalService` / `signOutExternalService` server actions
- [x] 7.2 Implement login status helpers for external services: `isAppLevelSignedIn(service)`, `isUserLevelSignedIn(service)`, `isAnyLevelSignedIn(service)` — based on `app_level_auth_status` and `user_level_auth_status`
- [x] 7.3 Adapt `ResourceLoginPopup` usage in `ExternalServiceAuthButtons` to use "Application" and "User" as level labels (pass label props or create a variant)

## 8. ResourceMultiAuth Component

- [x] 8.1 Create `src/components/Assets/Resources/Auth/ResourceMultiAuth.tsx` — manages `editingServiceId: string | null` state (null = list mode, string = edit mode for that ID, empty string = add mode)
- [x] 8.2 Implement list mode rendering: one row per `external_services` entry showing auth type icon, display name (fallback to ID), Edit button, and `ExternalServiceAuthButtons`; plus "Add Service" button at bottom
- [x] 8.3 Implement edit mode rendering: Back button, Service ID input (editable only when adding), Display Name input, Description input, `ResourceAuthentication` component for auth settings, and a way to trigger deletion (delete from map + return to list)
- [x] 8.4 Wire `ResourceMultiAuth` into `Apps/Properties.tsx` above `EntityAttachments`, passing `asset` and `onChange`; strip auth statuses from `auth_settings` before merging changes into the app object

## 9. Auth Status Stripping

- [x] 9.1 Add a utility function `stripExternalServiceAuthStatuses(services: Record<string, DialExternalService>)` that removes `app_level_auth_status`, `user_level_auth_status`, `global_auth_status` from each service's `auth_settings` — call this in `ResourceMultiAuth`'s `onChange` before passing changes to the parent (ensures statuses are never included in the saved app object)
