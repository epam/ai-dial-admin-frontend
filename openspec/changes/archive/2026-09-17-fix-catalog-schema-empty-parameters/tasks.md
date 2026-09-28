## 1. The fix

- [x] 1.1 Render `SchemaGrid` unconditionally in
  `components/Assets/Platform/CatalogSchemas/Parameters.tsx`: drop `isNoData`, the
  `DialNoDataContent` branch, and the imports each leaves unused (design D1). Leave
  `AppRunners/Parameters.tsx` alone and note in the catalog file's doc comment why the two differ
  (design D2).

- [x] 1.2 Relabel the deployment-side values tab: `TabsI18nKey.Catalog` becomes
  `TabsI18nKey.CatalogMetadata` with the label `Catalog metadata`, updating its two references
  (`utils/tabs/utils.ts`, `Platform/Toolsets/tests/View.spec.tsx`). Leave `EntityViewTab.Catalog`, the
  tab id the four `TabsContent` components switch on, unchanged (design D3).

## 2. Tests

- [x] 2.1 Extend `components/Assets/Platform/CatalogSchemas/tests/Parameters.spec.tsx`: a schema
  declaring no properties renders the grid rather than the empty state, and a schema with properties
  still renders it — asserting the empty-state text is absent in both.
- [x] 2.2 Assert the add-field path reaches the schema: with no properties, adding a field and
  changing it produces an `onChange` carrying that property.
- [x] 2.3 Keep the App Runner empty state pinned, so the asymmetry cannot be "tidied up" later. Its
  pre-existing test already covers the endpoint-less runner with no properties; document beside it
  what the gate covers and that a failed resolve returns earlier (design D2).

## 3. Quality gate

- [x] 3.1 Run `npm run lint`, `npm run typecheck` and the full `npm run test` suite from
  `apps/ai-dial-admin/`; fix any failures introduced by this change.
