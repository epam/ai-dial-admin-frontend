## 1. Separate the offered entity kinds from the accepted ones

- [x] 1.1 In `apps/ai-dial-admin/src/constants/catalog-schemas.ts`, add `OFFERED_CATALOG_ENTITY_TYPES`
      as its own literal list of `model`, `agent`, `toolset`, `interceptor`, and document on both it
      and `CATALOG_ENTITY_TYPES` which side each serves — offered for authoring versus accepted on
      save — naming Issue #4880 as the reason they differ.
- [x] 1.2 Leave `CatalogEntityType`, `CATALOG_ENTITY_TYPES` and
      `apps/ai-dial-admin/src/utils/catalog-schemas/validation.ts` at Core's five values, extending
      only the enum's doc comment in `apps/ai-dial-admin/src/models/dial/catalog-schema.ts` to point
      at the split.
- [x] 1.3 Point `apps/ai-dial-admin/src/components/Assets/Platform/CatalogSchemas/CreateProperties.tsx`
      at `OFFERED_CATALOG_ENTITY_TYPES`, and keep a kind the edited schema already declares in the
      options when it falls outside that list.

## 2. Filter the deployment schema picker

- [x] 2.1 Add `apps/ai-dial-admin/src/utils/catalog-schemas/picker-options.ts` exporting
      `filterCatalogSchemaOptionsByEntityType`, which keeps a schema whose declared kind matches, one
      declaring no kind, and the currently selected `$id`, and returns its input unchanged when given
      no entity type.
- [x] 2.2 Add `CATALOG_SCHEMA_PICKER_ENTITY_TYPE` to `apps/ai-dial-admin/src/constants/catalog-schemas.ts`
      mapping each deployment surface to the kind its picker filters to, with the Applications-to-`agent`
      pairing noted, and leave `CATALOG_SCHEMA_PICKER_COLUMNS` as the three-column "show all" set while
      adding a two-column filtered set to `apps/ai-dial-admin/src/constants/grid-columns/grid-columns.tsx`.
- [x] 2.3 Thread an `entityType` prop through
      `apps/ai-dial-admin/src/components/CatalogProperties/CatalogSchemaField.tsx` so its inline
      selection lists the filtered set, and pass it to the browse modal.
- [x] 2.4 Give `apps/ai-dial-admin/src/components/CatalogProperties/SelectCatalogSchemaModal.tsx` a
      "show all entity kinds" checkbox that relaxes the filter and restores the entity-kind column,
      driving the grid from `rowData` so the toggle re-renders it.
- [x] 2.5 Add the checkbox label to `apps/ai-dial-admin/src/constants/i18n.ts` and
      `apps/ai-dial-admin/src/locales/en.ts`.

## 3. Pass each deployment surface its own kind

- [x] 3.1 Pass the mapped entity type from the four Properties components that render the picker:
      `Assets/Platform/Models/Properties.tsx`, `Assets/Apps/Properties.tsx`,
      `Assets/Toolsets/View/Properties.tsx`, and `Assets/Platform/Interceptors/Properties.tsx`.

## 4. Coverage

- [x] 4.1 Add `apps/ai-dial-admin/src/utils/catalog-schemas/tests/picker-options.spec.ts` covering a
      matching kind, a null kind, the selected `$id` surviving a mismatch, and an absent entity type.
- [x] 4.2 Update `apps/ai-dial-admin/src/components/CatalogProperties/tests/SelectCatalogSchemaModal.spec.tsx`
      for the filtered row set, the two-column filtered view, and the three-column "show all" view the
      checkbox reaches.
- [x] 4.3 Update `apps/ai-dial-admin/src/components/CatalogProperties/tests/CatalogSchemaField.spec.tsx`
      so the inline selection is asserted against the filtered option set.
- [x] 4.4 Extend `apps/ai-dial-admin/src/components/Assets/Platform/CatalogSchemas/tests/CreateProperties.spec.tsx`
      to pin the offered kinds at four with `skill` absent, and to prove a schema already typed `skill`
      still offers its own kind.
- [x] 4.5 Add an assertion to
      `apps/ai-dial-admin/src/utils/catalog-schemas/tests/validation.spec.ts` that the save gate still
      accepts `skill`, so narrowing the accept list to match the offered list fails here.

## 5. Quality checks

- [x] 5.1 Run `npm run typecheck`, `npm run typecheck:specs`, `npm run lint`, and the full test suite
      from `apps/ai-dial-admin/`.

> No browser-verification task: the user declined one for this change when the scope was agreed. The
> filtered picker, the "show all" view and the narrowed entity-type selection are each pinned by the
> component specs in section 4.
