# Tasks

- [x] Remove `'7200'` and `'21600'` entries from `AUTOSCALE_OPTIONS` in `src/constants/deployments/containers.tsx`
- [x] Add early return `if (!required && value === void 0) return null;` to `getPortError` in `src/utils/deployments/validation.ts`
- [x] Add `scaleToZeroDisabled?: boolean` param to `getReplicasError` in `src/utils/deployments/validation.ts` — return error when `scaleToZeroDisabled && min === 0`
- [x] Update `ContainerAutoscaling.tsx` to pass `scaleToZeroDisabled` to `getReplicasError` calls based on `scaleToZeroDelaySeconds`
- [x] Add/update unit tests for `getReplicasError` and `getPortError` in validation tests
- [x] Run lint, format, and tests
