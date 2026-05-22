## 1. i18n keys

- [x] 1.1 Add `NodePoolId` and `NodePoolName` entries to `EntityFieldsI18nKey` in `apps/ai-dial-admin/src/constants/i18n.ts`.
- [x] 1.2 Add the corresponding English strings ("Node pool ID", "Node pool name") to `apps/ai-dial-admin/src/locales/en.ts` under the `EntityFields` group.

## 2. Diff engine — hide nodePool rows when both sides are empty

- [x] 2.1 In `apps/ai-dial-admin/src/components/ActivityAudit/View/utils/generate-diffs.ts`, add a `CONTAINER_HIDE_IF_EMPTY_KEYS` set containing `nodePoolId` and `nodePoolName`.
- [x] 2.2 Extend `getPrimitiveBucket()` so that when `isContainerRow` is true and the key is in `CONTAINER_HIDE_IF_EMPTY_KEYS` and both sides are empty primitives, the function returns `null` (no row emitted). The check runs before the section-routing check so it applies whether or not the key routes to a dedicated section.

## 3. Container formatters — label entries

- [x] 3.1 In `apps/ai-dial-admin/src/components/ActivityAudit/EntityGrid/container-formatters.ts`, add `nodePoolId: EntityFieldsI18nKey.NodePoolId` and `nodePoolName: EntityFieldsI18nKey.NodePoolName` to `CONTAINER_ROW_LABEL_KEYS` so the Parameter column renders "Node pool ID" / "Node pool name".

## 4. Tests

- [x] 4.1 Extend `apps/ai-dial-admin/src/components/ActivityAudit/View/utils/tests/generate-diffs.spec.ts` with container scenarios:
  - Both sides empty (both undefined, mixed null + undefined) → no `nodePoolId` or `nodePoolName` row.
  - One side empty, other set → ADDED row with correct value.
  - Id changed, name preserved → only `nodePoolId` carries `CHANGED` status; `nodePoolName` renders as an unchanged row.
  - Id present, name missing on one side only → `nodePoolId` ADDED row; `nodePoolName` hidden.
  - Fill path (current null) → only non-empty fields produce rows.
  - Hide rule is scoped: `displayName` with both sides empty still emits a row; `nodePoolId` with both sides empty does not.
- [x] 4.2 Add label-mapping assertions in `apps/ai-dial-admin/src/components/ActivityAudit/EntityGrid/tests/container-formatters.spec.ts` for `CONTAINER_ROW_LABEL_KEYS.nodePoolId` → `EntityFieldsI18nKey.NodePoolId` and `CONTAINER_ROW_LABEL_KEYS.nodePoolName` → `EntityFieldsI18nKey.NodePoolName`.
