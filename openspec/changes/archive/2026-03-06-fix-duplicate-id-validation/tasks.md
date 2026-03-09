## 1. Fix duplicate ID validation

- [x] 1.1 Pass `names` prop to `IdControl` in `apps/ai-dial-admin/src/components/EntityMainProperties/Properties/DeploymentProperties.tsx` (line 121)

## 2. Testing

- [x] 2.1 Add unit test for `DeploymentProperties` verifying that `IdControl` receives the `names` prop and shows validation error for duplicate IDs — query by role and text content

## 3. Code quality

- [x] 3.1 Run lint, format, and tests to verify no regressions
