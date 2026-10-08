# Tasks

## 1. The inline selection

- [x] 1.1 In `apps/ai-dial-admin/src/components/CatalogProperties/CatalogSchemaField.tsx`, build each
      dropdown option with the schema's `$id` as its label and no description, leaving the leading
      "None" entry and the filtering untouched.

## 2. Coverage

- [x] 2.1 Update `apps/ai-dial-admin/src/components/CatalogProperties/tests/CatalogSchemaField.spec.tsx`
      to query options by `$id` throughout, and turn the same-name case into an assertion that the
      display name is absent while both ids are present.
