## 1. Model and i18n

- [x] 1.1 Add `resource?: string` to `DialToolsetResourceAuthSettings` in `src/models/dial/resource.ts`
- [x] 1.2 Add the Resource label, placeholder and helper-text keys to `EntityFieldsI18nKey` / `EntityPlaceholdersI18nKey` in `src/constants/i18n.ts` and their strings to `src/locales/en.ts`

## 2. Editor field

- [x] 2.1 Add an optional `EndpointControl` (not `required`, `isFullWidth`, disabled via `isAuthDisabled`) bound to `resource` after Token endpoint in `src/components/Assets/Resources/Auth/ResourceOAuthSection.tsx`, mapping the `undefined` it emits on clear to `''` so core clears the stored value

## 3. Authorization URL

- [x] 3.1 In `ResourceAuthButtons.tsx` `startOAuthFlow`, set `resource` on the authorization URL when `authSettings.resource` is non-empty
- [x] 3.2 Do the same in `ExternalServiceAuthButtons.tsx` `startOAuthFlow`

## 4. Tests

- [x] 4.1 `ResourceOAuthSection` spec: field renders after Token endpoint, shows the stored value, `onChange` carries `resource` including `''` on clear, invalid URL is rejected, and the field is disabled when signed in
- [x] 4.2 `ResourceAuthButtons` and `ExternalServiceAuthButtons` specs: `resource` present on the redirect URL when set, absent when missing or blank
- [x] 4.3 Server-action specs for `assets-toolsets/actions.ts` and `assets-applications/actions.ts`: `resource` (including `''`) is forwarded in `auth_settings` and external-service auth settings, unlike an empty `client_secret`
- [x] 4.4 Confirm the legacy `OAuthSection` and `Toolsets/Auth/AuthButtons` specs are untouched and still pass

## 5. Docs and quality checks

- [x] 5.1 Check `docs/` for a description of the Assets OAuth form and update it if one exists
- [x] 5.2 Run lint, format, `npm run typecheck`, `npm run typecheck:specs` and the test suite; fix findings
