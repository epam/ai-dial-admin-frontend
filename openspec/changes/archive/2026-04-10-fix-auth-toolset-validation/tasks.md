## 1. Create validation utility

- [x] 1.1 Create `apps/ai-dial-admin/src/utils/validation/toolset-auth-error.ts` with:
  - `getErrorForClientId(clientId?: string, t?: (str: string) => string): FieldError | null`
  - `getErrorForClientSecret(clientSecret?: string, t?: (str: string) => string): FieldError | null`
  - Both check: if empty or whitespace-only, return `{ type: ErrorType.EMPTY, text: t(ErrorI18nKey.RequiredField) }`

## 2. Unit tests for validation

- [x] 2.1 Create `apps/ai-dial-admin/src/utils/validation/tests/toolset-auth-error.spec.ts` with tests for both functions:
  - Empty string returns EMPTY error
  - Whitespace-only string returns EMPTY error
  - Undefined returns EMPTY error
  - Valid non-empty value returns null

## 3. Create ClientIdControl component

- [x] 3.1 Create `apps/ai-dial-admin/src/components/Toolsets/Auth/Controls/` directory
- [x] 3.2 Create `apps/ai-dial-admin/src/components/Toolsets/Auth/Controls/ClientIdControl.tsx` with:
  - Props: `clientId?: string`, `disabled?: boolean`, `isLoggedIn?: boolean`, `onChange?: (clientId: string) => void`
  - Import `useSaveValidationContext` and `getErrorForClientId`
  - Local state: `const [error, setError] = useState<FieldError | null>(null)`
  - `validate` callback: runs `getErrorForClientId`, sets error, dispatches to context (skip dispatch if `isLoggedIn`)
  - `useEffect`: validate on mount with initial `clientId` value
  - `onChangeClientId`: trims value with `trimStart()`, validates, calls `onChange`
  - Render `<DialInput>` with `error` and `invalid` props

## 4. Create ClientSecretControl component

- [x] 4.1 Create `apps/ai-dial-admin/src/components/Toolsets/Auth/Controls/ClientSecretControl.tsx` with same structure as ClientIdControl but:
  - Uses `<DialPasswordInput>` instead of `<DialInput>`
  - Uses `getErrorForClientSecret` validator
  - Field key: `authSettings.clientSecret`
  - Label: `t(EntityFieldsI18nKey.clientSecret)`

## 5. Component tests

- [x] 5.1 Create `apps/ai-dial-admin/src/components/Toolsets/Auth/Controls/tests/ClientIdControl.spec.tsx`:
  - Renders with label "Client ID" and required indicator
  - Shows error when clientId is empty
  - Calls onChange with trimmed value
  - Dispatches validation to SaveValidationContext
  - Validates on mount
  - Skips dispatch when isLoggedIn=true
- [x] 5.2 Create `apps/ai-dial-admin/src/components/Toolsets/Auth/Controls/tests/ClientSecretControl.spec.tsx` with same tests

## 6. Update OAuthSection to use controls

- [x] 6.1 Import `ClientIdControl` and `ClientSecretControl` in `apps/ai-dial-admin/src/components/Toolsets/Auth/Sections/OAuthSection.tsx`
- [x] 6.2 Replace `<DialInput id="clientId">` (lines 73-80) with:
  ```tsx
  <ClientIdControl
    clientId={authSettings?.clientId}
    disabled={isAuthDisabled}
    isLoggedIn={isLoggedIn}
    onChange={(clientId) => onChange?.({ ...(authSettings || {}), clientId } as ToolsetAuthSettings)}
  />
  ```
- [x] 6.3 Replace `<DialPasswordInput id="clientSecret">` (lines 81-88) with:
  ```tsx
  <ClientSecretControl
    clientSecret={authSettings?.clientSecret}
    disabled={isAuthDisabled}
    isLoggedIn={isLoggedIn}
    onChange={(clientSecret) => onChange?.({ ...(authSettings || {}), clientSecret } as ToolsetAuthSettings)}
  />
  ```

## 7. Integration tests

- [x] 7.1 Update `apps/ai-dial-admin/src/components/Toolsets/Auth/Sections/tests/OAuthSection.spec.tsx`:
  - Mock SaveValidationContext
  - Test: emptying Client ID shows error and dispatches isValid=false
  - Test: emptying Client Secret shows error and dispatches isValid=false
  - Test: filling both fields dispatches isValid=true
  - Test: when isLoggedIn=true, errors show but no dispatch occurs

## 8. Quality checks

- [x] 8.1 Run `npm run lint` from repo root and fix any issues
- [x] 8.2 Run `npx vitest run src/utils/validation/tests/toolset-auth-error.spec.ts` from `apps/ai-dial-admin/` and confirm all tests pass
- [x] 8.3 Run `npx vitest run src/components/Toolsets/Auth/Controls/tests/` from `apps/ai-dial-admin/` and confirm all tests pass
- [x] 8.4 Run full test suite `npm run test` and confirm no regressions
