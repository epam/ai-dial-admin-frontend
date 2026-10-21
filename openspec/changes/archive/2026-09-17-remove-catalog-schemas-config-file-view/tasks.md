# Tasks

## 1. Withdraw the view

- [x] 1.1 Remove `ApplicationRoute.PlatformCatalogSchemas` from `CONFIG_FILE_ENTITY_VIEWS` and
      rewrite the constant's doc comment: seven views, and why catalog schemas is not one of them
      (Issue #4605).
- [x] 1.2 Delete `components/Assets/Platform/CatalogSchemas/PageList.tsx` and render
      `CatalogSchemasList` directly from `platform-catalog-schemas/page.tsx`, matching
      `platform-keys/page.tsx`.
- [x] 1.3 Remove the `getConfigFileCatalogSchemas` list action; keep `getConfigFileCatalogSchema`
      and note in `READABLE_CONFIG_FILE_TYPES` that the type stays readable for that single read.

## 2. Simplify the detail route

- [x] 2.1 Remove the `configFile=true` branch and the `searchParams` argument from
      `platform-catalog-schemas/[id]/page.tsx`, keeping the fallback read and its read-only marking.

## 3. Tests

- [x] 3.1 Delete `CatalogSchemas/tests/PageList.spec.tsx`.
- [x] 3.2 Rewrite the set assertions in `CatalogSchemas/tests/config-file-actions.spec.ts`: the
      covered views are seven and exclude `PlatformCatalogSchemas`, the readable type survives, and
      the list action is gone.
- [x] 3.3 Replace the `configFile=true` case in
      `platform-catalog-schemas/tests/detail-page.spec.tsx` with one pinning that the flag no longer
      short-circuits the API-written read, so a stale link carrying it still resolves normally.

## 4. Specs

- [x] 4.1 Update both consolidated specs' `## Purpose` — deltas do not carry Purpose — so
      `config-file-entity-views` says seven views and `platform-catalog-schemas` no longer claims
      the file-declared half is behind a toggle.
