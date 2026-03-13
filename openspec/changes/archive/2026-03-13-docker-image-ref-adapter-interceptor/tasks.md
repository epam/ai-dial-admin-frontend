## 1. i18n

- [x] 1.1 Add `FromInternalAdapterImage` and `FromInternalInterceptorImage` keys to `ContainersI18nKey` enum in `src/constants/i18n.ts`
- [x] 1.2 Add English translations for the new keys in `src/locales/en.ts`

## 2. Modal Types

- [x] 2.1 Add `createAdapterDockerImage` and `createInterceptorDockerImage` to the `ModalType` enum in `src/components/EntityListView/Components/Modals.tsx`

## 3. Container Template

- [x] 3.1 Add `IMAGE_REFERENCE` branches for `CONTAINER_TYPE.ADAPTER` and `CONTAINER_TYPE.INTERCEPTOR` in `getContainerTemplate()` in `src/utils/deployments/containers.ts` — include `scaling: DEFAULT_SCALING`, no `transport`

## 4. HeaderButtons

- [x] 4.1 Add `adapterDropdownItems` and `interceptorDropdownItems` arrays in `src/components/Containers/List/HeaderButtons.tsx` using the new i18n keys and modal types
- [x] 4.2 Extend `showDropdown` condition to include `ApplicationRoute.AdapterContainers` and `ApplicationRoute.InterceptorContainers`
- [x] 4.3 Update `dropdownItems` selection to return the correct items per route
- [x] 4.4 Add `ServingCreate` portal blocks for `ModalType.createAdapterDockerImage` and `ModalType.createInterceptorDockerImage` with `CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE`

## 5. Detail Pages

- [x] 5.1 Update `adapter-containers/[id]/page.tsx` to conditionally fetch image only for `INTERNAL_IMAGE` source, use `requiresImage` guard, pass `image ?? void 0`
- [x] 5.2 Update `interceptor-containers/[id]/page.tsx` with the same conditional image fetch pattern

## 6. Tests

- [x] 6.1 Add unit test for `getContainerTemplate` with ADAPTER + IMAGE_REFERENCE and INTERCEPTOR + IMAGE_REFERENCE in `src/utils/deployments/tests/containers.spec.ts`

## 7. Quality Checks

- [x] 7.1 Run lint, format, and all tests to verify no regressions
