## 1. Shared Utility

- [x] 1.1 Create `apps/ai-dial-admin/src/utils/audit-tab-return.ts` with `saveAuditTabReturn(entityPath: string): void` and `readAndClearAuditTabReturn(entityPath: string): { mainTab: EntityViewTab; auditTab: EntityViewTab } | null` — both SSR-safe (guard with `typeof window !== 'undefined'`). Storage key: `audit-tab-return:<entityPath>`. Always stores `{ mainTab: EntityViewTab.Audit, auditTab: EntityViewTab.Activities }`.
- [x] 1.2 Add unit tests for `audit-tab-return.ts` in `apps/ai-dial-admin/src/utils/tests/audit-tab-return.spec.ts` covering: save writes correct key/value, read returns value and clears key, read returns null when no entry, both functions no-op/return null in SSR environment (mock `window` as undefined).

## 2. Write on Navigation

- [x] 2.1 In `apps/ai-dial-admin/src/components/ActivityAudit/List/List.tsx`, call `usePathname()` at the component top level and call `saveAuditTabReturn(pathname)` inside `onCellClicked` before `router.push(href)` — only when `entity` is non-null (guard already present in that branch).

## 3. EntityAudit — Accept Initial Sub-Tab

- [x] 3.1 Add optional prop `initialAuditTab?: EntityViewTab` to `EntityAudit` (`apps/ai-dial-admin/src/components/EntityTabs/Audit/EntityAudit.tsx`) and use it as the `useState` initial value: `useState(initialAuditTab ?? tabs[0].id)`.

## 4. TabsContent — Thread initialAuditTab

- [x] 4.1 Add optional prop `initialAuditTab?: EntityViewTab` to `apps/ai-dial-admin/src/components/Adapter/View/TabsContent.tsx` and forward it to `<EntityAudit>`.
- [x] 4.2 Same for `apps/ai-dial-admin/src/components/Models/View/TabsContent.tsx`.
- [x] 4.3 Same for `apps/ai-dial-admin/src/components/Applications/View/TabsContent.tsx`.
- [x] 4.4 Same for `apps/ai-dial-admin/src/components/Interceptors/View/TabsContent.tsx`.
- [x] 4.5 Same for `apps/ai-dial-admin/src/components/Routes/View/TabsContent.tsx`.
- [x] 4.6 Same for `apps/ai-dial-admin/src/components/Keys/View/TabsContent.tsx`.
- [x] 4.7 Same for `apps/ai-dial-admin/src/components/Roles/View/TabsContent.tsx`.
- [x] 4.8 Same for `apps/ai-dial-admin/src/components/Toolsets/View/TabsContent.tsx`.
- [x] 4.9 Same for `apps/ai-dial-admin/src/components/ApplicationRunners/View/TabsContent.tsx`.
- [x] 4.10 Same for `apps/ai-dial-admin/src/components/InterceptorTemplates/View/TabsContent.tsx`.
- [x] 4.11 Same for `apps/ai-dial-admin/src/components/Assets/Toolsets/View/TabsContent.tsx`.

## 5. Entity View Components — Read State and Pass Down

- [x] 5.1 In `apps/ai-dial-admin/src/components/Adapter/View/View.tsx`: add `usePathname()`, read tab state in `useState` lazy initializer via `readAndClearAuditTabReturn`, pass `initialAuditTab` to `<TabsContent>`.
- [x] 5.2 Same for `apps/ai-dial-admin/src/components/Models/View/View.tsx`.
- [x] 5.3 Same for `apps/ai-dial-admin/src/components/Applications/View/View.tsx`.
- [x] 5.4 Same for `apps/ai-dial-admin/src/components/Interceptors/View/View.tsx`.
- [x] 5.5 Same for `apps/ai-dial-admin/src/components/Routes/View/View.tsx`.
- [x] 5.6 Same for `apps/ai-dial-admin/src/components/Keys/View/View.tsx`.
- [x] 5.7 Same for `apps/ai-dial-admin/src/components/Roles/View/View.tsx`.
- [x] 5.8 Same for `apps/ai-dial-admin/src/components/Toolsets/View/View.tsx`.
- [x] 5.9 Same for `apps/ai-dial-admin/src/components/ApplicationRunners/View/View.tsx`.
- [x] 5.10 Same for `apps/ai-dial-admin/src/components/InterceptorTemplates/View/View.tsx`.

## 6. Quality Checks

- [x] 6.1 Run `npm run lint` from the repo root and fix any issues.
- [x] 6.2 Run `npm run test` from `apps/ai-dial-admin/` and confirm all tests pass.
