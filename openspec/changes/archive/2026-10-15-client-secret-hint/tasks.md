## 1. Model and i18n

- [x] 1.1 Add `client_secret_hint?: string` to `DialToolsetResourceAuthSettings` in `apps/ai-dial-admin/src/models/dial/resource.ts`
- [x] 1.2 Add the masked placeholder key (`EntityPlaceholdersI18nKey.ClientSecretMasked`, value `••••`) and a minimum-length error key (e.g. `ErrorI18nKey.ClientSecretMinLength`, with an `{min}`-style parameter if the i18n setup supports it) to `src/constants/i18n.ts` and `src/locales/en.ts`; reuse an existing key if one fits
- [x] 1.3 Add `CLIENT_SECRET_MIN_LENGTH = 8` to the feature `constants.ts`, commented as mirroring core's `ClientSecretValidation.MIN_LENGTH`

## 2. Client Secret field

- [x] 2.1 Add optional `hasSecretHint?: boolean` to `Toolsets/Auth/Controls/ClientSecretControl.tsx`: with a hint and an empty value, skip the required error, dispatch `authSettings.clientSecret` valid, and use the masked placeholder; include it in the validation deps
- [x] 2.2 Add an optional `minLength` argument to `getErrorForClientSecret` in `utils/validation/toolset-auth-error.ts` returning a too-short error for a non-empty value below it, and an optional `minLength` prop on `ClientSecretControl` that forwards it and keeps the required / hint rules for empty values
- [x] 2.3 Pass `hasSecretHint={!!authSettings?.client_secret_hint}` and `minLength={CLIENT_SECRET_MIN_LENGTH}` from `Assets/Resources/Auth/ResourceOAuthSection.tsx`

## 3. Save payload

- [x] 3.1 Add a pure util (e.g. `stripClientSecretHint`) that drops `client_secret_hint` and an empty `client_secret` from auth settings; place it under `src/components/Assets/Resources/utils.ts` or `src/utils/toolset/`
- [x] 3.2 Apply it to toolset auth settings in `Assets/Toolsets/View/View.tsx` before `updateToolset`
- [x] 3.3 Apply it to each external service's auth settings in `app/[lang]/assets-applications/actions.ts`, next to `stripExternalServiceAuthStatuses`

## 4. Tests

- [x] 4.1 `ClientSecretControl.spec.tsx`: hint + empty → no error, masked placeholder, valid dispatched; no hint + empty → required error; type-then-clear with hint → valid
- [x] 4.2 `ClientSecretControl.spec.tsx` / `toolset-auth-error.spec.ts`: with `minLength`, 1–7 chars → too-short error and invalid dispatched, 8 chars → valid, with hint + short typed → error; without `minLength` a short value stays valid (legacy)
- [x] 4.3 `ResourceOAuthSection` spec: hint and `minLength` are passed through to the control
- [x] 4.4 Util spec: hint-only, empty secret, real secret kept, undefined settings
- [x] 4.5 Save-path specs (toolset update, `assets-applications` actions): payload has no `client_secret_hint` or empty `client_secret`; a typed secret is kept
- [x] 4.6 Confirm the duplicate specs (`DuplicatePlatformAsset`, `DuplicateAsset`) still pass for OAuth entries carrying a hint

## 5. Quality checks

- [x] 5.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`, all clean
