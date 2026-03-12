# Tasks: Scaling for All Containers

- [x] **Task 1: Update DEFAULT_SCALING and container creation defaults** — Update `DEFAULT_SCALING` to remove the strategy object, and ensure all non-NIM container types get scaling defaults during creation. Files: `src/constants/deployments/containers.tsx`, `src/utils/deployments/containers.ts`
- [x] **Task 2: Add "After 5 Minutes" dropdown option and i18n key** — Add `ScaleToZeroAfter5Minutes` i18n key, translation, and dropdown option to `AUTOSCALE_OPTIONS` after "Never". Files: `src/constants/i18n.ts`, `src/locales/en.ts`, `src/constants/deployments/containers.tsx`
- [x] **Task 3: Change visibility gate in ContainerFields** — Show `ContainerAutoscaling` for all containers except NGC_REGISTRY. File: `src/components/Containers/Fields/ContainerFields.tsx`
- [x] **Task 4: Implement derived UI in ContainerAutoscaling** — Rework to show/hide Strategy + Threshold based on min/max values (`max > min && max > 1`), auto-populate strategy `{ $type: 'active_requests', threshold: 2 }` when conditions met, remove strategy when not, manage state cleanup on transitions. File: `src/components/Deployments/Fields/ContainerAutoscaling.tsx`
- [x] **Task 5: Fix getReplicasError validation** — Rewrite to enforce `min >= 0`, `max >= 1`, `min <= max`. Fix truthiness bug with min=0. File: `src/utils/deployments/validation.ts`
- [x] **Task 6: Tests** — Tests for `getReplicasError` (min=0/max=0, min=0/max=1, min>max, min=-1, valid cases), `createContainer` defaults for all types, and `ContainerAutoscaling` component (strategy show/hide, state cleanup). Files: `src/utils/deployments/tests/containers.spec.ts`, validation tests, component tests
- [x] **Task 7: Run code quality checks** — Run lint, format, and full test suite to verify no regressions
