Paths are under `apps/ai-dial-admin/src`. No browser-verification task: the requester declined it; the scenarios are covered by the component tests in groups 5 and 6.

## 1. Models, i18n and pure helpers

- [x] 1.1 Add `discovery_url?: string` and `dynamically_registered?: boolean` to `DialToolsetResourceAuthSettings` in `models/dial/resource.ts` (read-only note on `dynamically_registered`: Core ignores it on write)
- [x] 1.2 Add i18n keys (enum in `constants/i18n.ts`, strings in `locales/en.ts`; check `ToolsetI18nKey`/`ExternalServiceI18nKey` for reusable ones first): "Register automatically", "Discovery URL", its caption, "Registered by DIAL Core", "Use an existing client instead"
- [x] 1.3 Add `ClientRegistrationMode` (`Existing`, `Automatic`, `Registered`) in `components/Assets/Resources/Auth/models.ts` (beside `ExternalServiceRowAction`; `constants.ts` holds values, not enums), replacing the local `AuthType` enum in `ResourceOAuthSection.tsx` (design D1)
- [x] 1.4 Add pure helpers under `components/Assets/Resources/Auth/utils/` (named exports, design D1/D3): `getRegistrationMode(authSettings)`, `toAutomaticSettings(authSettings)`, `toExistingSettings(authSettings, redirectUri)`, `toStaticFromRegistered(authSettings)`
- [x] 1.5 Add `isDynamicRegistrationOffered(services, originalId)` (stored-type rule, design D2) next to `external-service-auth-utils.ts`

## 2. Discovery URL field

- [x] 2.1 Add the optional `isDiscoveryUrlSupported` prop to `ResourceOAuthSection`; when set, render Discovery URL with `EndpointControl` (caption from 1.2, `required` only in `Automatic`, disabled while signed in or read-only), mapping a cleared value to `''` as `resource` does (design D4)
- [x] 2.2 Thread `isDiscoveryUrlSupported` through `ResourceAuthentication` and `ResourceAuthTypeSection` (they already forward rest props; keep the toolset call sites untouched) and set it unconditionally in `ResourceMultiAuth`

## 3. Register automatically mode

- [x] 3.1 Add the optional `isDynamicRegistrationOffered` prop through `ResourceMultiAuth` → `ResourceAuthentication` → `ResourceAuthTypeSection` → `ResourceOAuthSection`, and pass the computed `redirectUri` down from `ResourceAuthentication` for the helpers
- [x] 3.2 In `ResourceOAuthSection` keep the mode as local `useState` initialised from `getRegistrationMode`; render the registration type `Select` with "Register automatically" only when `isDynamicRegistrationOffered` (default `Existing`); apply `toAutomaticSettings` / `toExistingSettings` on change (design D1, D3)
- [x] 3.3 In `Automatic` mode render only the type `Select` and Discovery URL; leave the client id/secret/endpoint controls unmounted so their validation entries clear (design D5)
- [x] 3.4 Confirm toolset rendering and payload are unchanged (`Toolsets` OAuth section call sites do not pass the new props)

## 4. Registered client state

- [x] 4.1 In `Registered` mode render the existing controls disabled (client id, scopes, endpoints, resource, auth method, PKCE method, Discovery URL), no client secret control, with the "Registered by DIAL Core" `Notification` (design D6)
- [x] 4.2 Add the "Use an existing client instead" `OutlinedButton` applying `toStaticFromRegistered`; hide it for read-only admins and disable it while signed in; the new client id and secret are required by the existing controls
- [x] 4.3 Check `Assets/Entities/Apps/View.tsx`: after a successful save, `selectedApp` is rebuilt from the refreshed `originalApp`, so the registered client id and `dynamically_registered` appear; fix the reset there if not (design D7)
- [x] 4.4 Confirm `stripExternalServiceAuthStatuses` in `app/[lang]/assets-applications/actions.ts` leaves `discovery_url` and `dynamically_registered` in the PUT body and still drops the statuses and `client_secret_hint`

## 5. Token auth method "None"

- [x] 5.1 Confirm the `TokenEndpointAuthMethod` enum in `models/dial/toolset.ts` agrees with `'none'` in `models/dial/resource.ts`, and that the legacy toolset `OAuthSection` selects "None" for a stored `none` (design D9); fix any disagreement

## 6. Unit and component tests

- [x] 6.1 Specs for the helpers from 1.4 and 1.5: every branch, including a stored `none` method reset, a cleared Discovery URL, and the stored-OAUTH-switched-away-and-back case (`utils/tests/` beside them, per `testing.md`)
- [x] 6.2 Extend `Auth/tests/ResourceOAuthSection.spec.tsx`: Discovery URL shown only with `isDiscoveryUrlSupported` and absent for toolsets; required only in `Automatic`; mode persists with an empty URL; payload after choosing automatic has only `authentication_type` and `discovery_url`; switching back restores `redirect_uri`; registered state is read-only without a secret control; conversion clears credentials; `none` selected and emitted
- [x] 6.3 Extend `Auth/tests/ResourceAuthentication.spec.tsx` and `ResourceMultiAuth.spec.tsx`: props passed for external services and not for toolsets, Apply disabled without a Discovery URL in `Automatic`, no selector for a stored OAUTH service, a failed save surfaces Core's message through the existing toast and keeps the form
- [x] 6.4 Add a spec for the Apps `View` save-then-refresh behaviour from 4.3 and for the PUT body from 4.4 (`stripExternalServiceAuthStatuses`), following the existing `Apps` and `actions` specs
- [x] 6.5 Run `npm run typecheck:specs` and keep it at zero

## 7. Spec and docs

- [x] 7.1 Add an entry to `docs/INFRA-CHANGELOG.md` under `0.24.0` (`Added`): needs Core with epam/ai-dial-core#2311; `toolsets.security.allowedRedirectUris` must contain `<admin origin>/external-service-signin` plus Chat's callback if users sign in from Chat; the empty default makes every "Register automatically" save fail with `400`; a list lacking the admin callback saves but breaks panel sign-in until the client is deleted and re-added (design D10)
- [x] 7.2 Check `docs/areas.md` (`Auth` row) and any `docs/` page describing external-service auth; update what the new behaviour makes stale

## 8. Final quality checks

- [x] 8.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`
- [x] 8.2 Run `npm run test` (full suite with coverage) and fix failures; re-run any failing file in isolation with `npx vitest run <file>` from `apps/ai-dial-admin/` before attributing a failure to this change
