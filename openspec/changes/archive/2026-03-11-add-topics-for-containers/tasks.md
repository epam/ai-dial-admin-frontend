## 1. Extend TopicsControl to Support Custom getItems

- [x] 1.1 Add an optional `getItems` prop to `TopicsControl` (`apps/ai-dial-admin/src/components/BaseControls/Topics.tsx`) that defaults to `getModelsTopics`. Pass this prop through to the `Multiselect` component's `getItems` prop. This allows deployment entities to use the deployments topics API instead.

## 2. Add Topics to Container Properties Form

- [x] 2.1 Add `TopicsControl` to `ContainerBase` component (`apps/ai-dial-admin/src/components/Deployments/Fields/ContainerBase.tsx`). Place it after `DescriptionControl` and before `Maintainer`. Pass `entity={container}`, `onChange` handler to update container topics, `disabled={isEditDisabled(container)}`, and `getItems={getTopics}` (from `src/app/actions/deployments.ts`). Support both modal and properties views using `isFullWidth={isModal}` pattern.
- [x] 2.2 Verify topics are included in container create/update API payloads by checking `apps/ai-dial-admin/src/server/deployments/containers.ts` — ensure `topics` field is not stripped during serialization.

## 3. Add Topics Column to Container List Grid

- [x] 3.1 Add a `topics` column definition to `CONTAINERS_COLUMNS` in `apps/ai-dial-admin/src/constants/grid-columns/grid-columns.tsx`. The column should be visible by default (consistent with `IMAGES_LIST_COLUMNS` and other deployment entities), display topics as comma-separated values, and support text filtering. Reuse the existing `TOPICS_COLUMN` from `base-columns.ts`.

## 4. Update ImageBase to Use getItems Prop

- [x] 4.1 Update `ImageBase` (`apps/ai-dial-admin/src/components/Deployments/Fields/ImageBase.tsx`) to pass `getItems={getTopics}` to `TopicsControl`, using the deployments topics API explicitly rather than relying on the default `getModelsTopics`.

## 5. Tests

- [x] 5.1 Update `ContainerBase` tests to verify the `TopicsControl` is rendered and handles topic changes correctly. Query by role/label rather than test IDs.
- [x] 5.2 Update grid column tests in `apps/ai-dial-admin/src/constants/grid-columns/tests/grid-columns.spec.ts` to verify the topics column is included in `CONTAINERS_COLUMNS`.

## 6. Quality Checks

- [x] 6.1 Run linting, formatting, and all tests to ensure no regressions (`nx lint ai-dial-admin`, `nx test ai-dial-admin`).
