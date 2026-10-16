## 1. The inline selection

- [x] 1.1 In `apps/ai-dial-admin/src/components/CatalogProperties/CatalogSchemaField.tsx`, build each
      dropdown option with the schema's `dial:catalogDisplayName` as `label` and its `$id` as
      `description`; for a schema with no display name use the `$id` as `label` and no description.
      Leave the leading "None" entry, the entity-kind filtering and the stored `value` (`$id`)
      untouched, and replace the now-wrong doc comment above the options with one stating why the
      `$id` accompanies the name (display names are not unique).

## 2. Coverage

- [x] 2.1 Update `apps/ai-dial-admin/src/components/CatalogProperties/tests/CatalogSchemaField.spec.tsx`:
      turn "identifies an option by its id rather than its display name" into an assertion that both
      the display name and the `$id` are shown for a named schema.
- [x] 2.2 Add a spec case with two schemas sharing a display name: the name appears twice and each
      `$id` appears once.
- [x] 2.3 Update "shows the id once for a schema that has no display name" so it still asserts the
      `$id` is rendered exactly once, and keep "lists both schema populations as options" and
      "stores the picked schema id" green by querying the `$id` text.

## 3. Quality checks

- [x] 3.1 Run `npx vitest run src/components/CatalogProperties`, `npm run lint`, `npm run format`,
      `npm run typecheck` and `npm run typecheck:specs`; all pass at zero.
