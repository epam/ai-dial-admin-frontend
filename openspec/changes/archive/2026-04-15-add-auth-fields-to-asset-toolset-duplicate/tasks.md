# Tasks

## Implementation Steps

- [x] **Add imports** to `src/components/Assets/Deployments/DuplicateAsset.tsx`:
  - `AssetToolset` from `@/src/models/dial/deployment-asset`
  - `ToolsetAuthType` from `@/src/models/dial/toolset`
  - `DialPasswordInput` from `@epam/ai-dial-ui-kit`
  - `EndpointControl` from `@/src/components/BaseControls/Endpoint/Endpoint`
  - `EntityFieldsI18nKey`, `EntityPlaceholdersI18nKey`, `ToolsetI18nKey` from `@/src/constants/i18n`
  - `ValidationActionType` from `@/src/context/SaveValidationContext`

- [x] **Add type detection logic** before existing state:
  - Add `isToolsetWithAuth` useMemo to check if entity is AssetToolset with auth
  - Add `authType` useMemo to get authentication type (OAUTH, API_KEY, or null)

- [x] **Add auth field change handlers** after existing handlers:
  - `onChangeClientId` - updates authSettings.clientId and validates
  - `onChangeClientSecret` - updates authSettings.clientSecret and validates
  - `onChangeAuthorizationEndpoint` - updates authSettings.authorizationEndpoint and validates
  - `onChangeApiKeyHeader` - updates authSettings.apiKeyHeader and validates

- [x] **Extend validation in useEffect** to initialize auth field validation:
  - Add OAuth field validation when `authType === ToolsetAuthType.OAUTH`
  - Add API Key field validation when `authType === ToolsetAuthType.API_KEY`
  - Ensure validation runs on mount for auth fields

- [x] **Add auth section heading** in JSX after VersionControl:
  - Conditionally render h3 with "OAuth" or "API Key" label when `isToolsetWithAuth` is true

- [x] **Add OAuth fields** when `authType === ToolsetAuthType.OAUTH`:
  - DialInput for clientId (required)
  - DialPasswordInput for clientSecret (required)
  - EndpointControl for authorizationEndpoint (required)

- [x] **Add API Key field** when `authType === ToolsetAuthType.API_KEY`:
  - DialInput for apiKeyHeader (required)

- [ ] **Test manually**:
  - Duplicate asset toolset with OAuth auth → verify fields appear and validation works
  - Duplicate asset toolset with API Key auth → verify field appears and validation works
  - Duplicate asset toolset without auth → verify no auth fields
  - Duplicate asset app/prompt → verify no auth fields
  - Verify submit button is disabled when required auth fields are empty

- [x] **Run linting and formatting**:
  - `npm run lint`
  - `npm run format:write`

- [x] **Run tests** (if any tests break, fix them):
  - `npm run test`
