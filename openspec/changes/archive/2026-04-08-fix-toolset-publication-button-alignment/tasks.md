## 1. Fix conditional rendering

- [x] 1.1 Add `ToolsetAuthType` import to `apps/ai-dial-admin/src/components/Publications/View/View.tsx`
- [x] 1.2 Update the conditional rendering block (lines 201-210) to check `toolset.authSettings?.authenticationType !== ToolsetAuthType.NONE` before rendering `AuthButtons`

## 2. Testing

- [x] 2.1 Add unit test for `PublicationView` verifying `AuthButtons` does not render when authentication type is NONE
- [x] 2.2 Add unit test for `PublicationView` verifying `AuthButtons` renders when authentication type is API_KEY
- [x] 2.3 Add unit test for `PublicationView` verifying `AuthButtons` renders when authentication type is OAUTH

## 3. Code quality

- [x] 3.1 Run `npm run lint` and fix any issues
- [x] 3.2 Run `npm run format:write` to ensure consistent formatting
- [x] 3.3 Run `npm run test` to verify all tests pass
