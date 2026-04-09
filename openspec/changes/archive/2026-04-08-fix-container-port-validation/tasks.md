## Tasks

### 1. Add non-integer validation to `getPortError`

- [x] Widen type signature from `value: number` to `value: number | string` in `apps/ai-dial-admin/src/utils/deployments/validation.ts`
- [x] Add check: `typeof value === 'string' || !Number.isInteger(value)` before the range check — returns existing `PortError`

### 2. Add unit tests for new validation cases

- [x] Add test for float input (`8080.5`) in `apps/ai-dial-admin/src/utils/deployments/tests/validation.spec.ts`
- [x] Add test for `NaN` input
- [x] Add test for string input (`'-'`)
- [x] Verify existing tests still pass (range check, valid port)

### 3. Run code quality checks

- [x] Run `npm run lint` and `npm run format` — fix any issues
- [x] Run `npm run test` — verify all tests pass
