## 1. Resource-type wiring

- [x] 1.1 Add `ResourceType.ROUTE = 'ROUTE'` to `types/resource-type.ts`; remove the now-stale
      "nothing writes it through `AssetApi`" comment on `INTERCEPTOR` while touching this file.
- [x] 1.2 Add `RESOURCE_TYPE_PREFIX[ResourceType.ROUTE] = 'routes/platform/'` in
      `constants/publications-core.ts`.
- [x] 1.3 Add `ResourceType.ROUTE` entries to `CORE_RESOURCE_URL` and `CORE_RESOURCE_METADATA_URL` in
      `constants/assets-core.ts`.
- [x] 1.4 Add `ResourceType.ROUTE` to `PLATFORM_BUCKET_RESOURCE_TYPES` and to the
      `VersionedResourceType` exclusion list in `constants/assets-core.ts`.
- [x] 1.5 Add `mergeRouteResource` (flat/unversioned, following `mergeInterceptorResource`) and
      register it in `ASSET_MERGERS[ResourceType.ROUTE]` in `server/core/asset-metadata.ts`.
- [x] 1.6 Unit tests for `mergeRouteResource` and the updated `ASSET_MERGERS`/prefix/URL maps.

## 2. Model and server actions

- [x] 2.1 Add `DialRouteResource` to `models/dial/resource.ts` (`name`, `path`, `folderId`, `author`,
      `status`, `validationWarnings`, `paths`, `methods`, `rewritePath`, `response`, `upstreams`,
      `maxRetryAttempts`, `order`, `attachmentPaths`) — no `userRoles`/role-limits (deferred per
      design D4), no `displayName`/`description`/`endpoint`/`features` (Route has none).
- [x] 2.2 Create `app/[lang]/assets-routes/actions.ts` with `toRoutePayload` (stripping `status`,
      `validationWarnings`, `path`, `folderId`) and `createRoute`/`getRoute`/`updateRoute`/
      `removeRoute`/`bulkDeleteRoutes`/`getRoutes`, following `assets-interceptors/actions.ts`.
- [x] 2.3 Unit tests for `actions.ts` (`assets-routes/actions.spec.ts`), following
      `assets-interceptors/actions.spec.ts`.

## 3. List view

- [x] 3.1 Add `ApplicationRoute.AssetsRoutes` to `types/routes.ts` and a new `AssetsRoutes` entry to
      `MenuI18nKey` (`constants/i18n.ts`) plus its `en.ts` label — distinct from the existing
      `Routes`/`Entities > Routes` key.
- [x] 3.2 Add the `Routes` menu item to the Assets section in `components/Menu/menu-configuration.tsx`,
      directly after `AssetsInterceptors`.
- [x] 3.3 Create `components/Assets/Routes/List.tsx` on the shared `BaseAssetList` (flat, no folder
      tree, create/delete/bulk-delete, no create-folder/move), following
      `components/Assets/Interceptors/List.tsx`.
- [x] 3.4 Wire the route asset's create modal to the shared plain-name field `Assets > Models` uses
      (`components/Assets/Modals/utils.tsx`), not a bespoke id control.
- [x] 3.5 Create `app/[lang]/assets-routes/page.tsx` (list page), following
      `app/[lang]/assets-interceptors/page.tsx`.
- [x] 3.6 Component tests for `List.tsx`, following `Assets/Interceptors/tests/List.spec.tsx`.

## 4. Detail view

- [x] 4.1 Create `components/Assets/Routes/Properties.tsx`, composing `Paths`, `DialSwitch`
      (rewritePath), `Multiselect` (methods), the Response/Upstreams `DialRadioGroup`, status/body
      inputs, `UpstreamEndpoints`, `MaxRetryAttempts`, order + reset-to-default, and the
      request/response attachment-path `Paths` pair against `DialRouteResource` — the same controls
      `Entities > Routes`' `RouteProperties.tsx`/`RouteAttachments.tsx` use, not those components
      directly (design D3).
- [x] 4.2 Wire `Assets > Models`' `UpstreamSecretWarning`/`getUpstreamsLosingSecret` into the route
      asset's save flow against `DialRouteResource.upstreams` (design D5).
- [x] 4.3 Create `components/Assets/Routes/TabsContent.tsx` rendering exactly the `Properties` tab,
      following `components/Assets/Interceptors/TabsContent.tsx`.
- [x] 4.4 Create `components/Assets/Routes/View.tsx` (etag/discard/save/JSON-editor wiring), following
      `components/Assets/Interceptors/View.tsx`.
- [x] 4.5 Add `getTabsForAsset` handling for `ApplicationRoute.AssetsRoutes` (`propertiesTab` only) in
      `utils/tabs/utils.ts`.
- [x] 4.6 Create `app/[lang]/assets-routes/[id]/page.tsx` (detail page), following
      `app/[lang]/assets-interceptors/[id]/page.tsx`.
- [x] 4.7 Component tests for `Properties.tsx`, `TabsContent.tsx`, and `View.tsx`, following the
      `Assets/Interceptors/tests/` equivalents.

## 5. Quality gate

- [x] 5.1 Run lint, format, and the full test suite (`npm run lint`, `npm run format`, `npm run test`
      from `apps/ai-dial-admin/`) and fix any failures.

## 6. Post-implementation fix

- [x] 6.1 First pass: strip `description` in `toRoutePayload` alongside the existing read-only-field
      stripping (`app/[lang]/assets-routes/actions.ts`), with a regression test in `actions.spec.ts`.
      Insufficient alone — see 6.2.
- [x] 6.2 Root-cause fix: the generic `EntityProperties` dispatcher branch (reached because
      `isSimpleEntity(AssetsRoutes)` is true) always renders a `DisplayNameControl` alongside the id
      field, writing `entity.displayName` — a field `Route` doesn't have either. Add
      `components/Assets/Routes/CreateProperties.tsx` (just the shared `IdControl`, no display-name or
      description control) and wire it into
      `components/EntityMainProperties/Properties/Properties.tsx` ahead of `isSimpleEntity`, following
      the `AppRunnerCreateProperties`/`SkillCreateProperties` precedent (design D6). Updated
      `specs/assets-routes/spec.md`'s create-form scenarios to match (no display-name/description
      field), with a regression test in `Assets/Routes/tests/CreateProperties.spec.tsx`.
- [x] 6.3 Found on an edit-and-save round-trip: `author`/`createdAt`/`updatedAt` come from Core's
      metadata node (`mergeRouteResource`), not from `Route.class` — same class of bug as 6.1/6.2, since
      `Route` doesn't extend `Deployment` and has none of the three. Strip all three in
      `toRoutePayload` alongside `description` (design D7), with a regression test in
      `actions.spec.ts` reproducing the exact reported payload.
