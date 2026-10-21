## 1. Infrastructure & Wiring

- [x] 1.1 Add `PROJECT_KEY = 'PROJECT_KEY'` to `ResourceType` enum in `src/types/resource-type.ts`
- [x] 1.2 Add `AssetsKeys = '/assets-keys'` to `ApplicationRoute` enum in `src/types/routes.ts` (under Assets section)
- [x] 1.3 Add `ApplicationRoute.AssetsKeys` to `FLAT_PLATFORM_VIEWS` in `src/utils/files/root-folder.ts`
- [x] 1.4 Add `MenuI18nKey.AssetsKeys = 'Menu.AssetsKeys'` to `src/constants/i18n.ts` and add the menu item entry in `src/components/Menu/menu-configuration.tsx` (after `AssetsRoles`, with `isPreview: true`)
- [x] 1.5 Add `FileManagerI18nKey` entries for Keys (label, empty state title/description) and corresponding translations in `src/locales/en.ts`

## 2. Model & Context

- [x] 2.1 Add `DialKeyResource` interface to `src/models/dial/resource.ts` (extends `ModifiedEntity`, fields: `name`, `path`, `folderId`, `author?`, `status?`, `validationWarnings?`, `key?`, `project?`, `secured?`, `roles?`, `allowedIpAddressRanges?`) and add it to the `PlatformAsset` union
- [x] 2.2 Create `src/context/assets/KeysFolderContext.tsx` using `createFolderContext` (same pattern as `RolesFolderContext.tsx`)

## 3. Server Actions

- [x] 3.1 Create `src/app/[lang]/assets-keys/actions.ts` with server actions: `getKeys` (list), `getKey` (get with etag), `createKey` (put with generated secret), `updateKey` (put without key field), `removeKey` (delete), `bulkDeleteKeys` (bulk delete). Include `toKeyPayload` that strips `status`, `validationWarnings`, `path`, `folderId`, `author`, `createdAt`, `updatedAt`
- [x] 3.2 Create `src/app/[lang]/assets-keys/actions.spec.ts` — unit tests for `toKeyPayload` stripping logic and action contracts

## 4. Route Pages

- [x] 4.1 Create `src/app/[lang]/assets-keys/page.tsx` — list page wrapping `<KeysList />` in `SaveValidationContextProvider` (same pattern as `assets-roles/page.tsx`)
- [x] 4.2 Create `src/app/[lang]/assets-keys/[id]/page.tsx` — detail page fetching key via `getKey` and rendering `<KeyAssetView />` (same pattern as `assets-roles/[id]/page.tsx`)

## 5. BaseAssetList Wiring

- [x] 5.1 Add `ApplicationRoute.AssetsKeys` to `BaseAssetRoute` and `CreateAssetRoute` types in `src/components/Assets/BaseAssetList/types.ts`
- [x] 5.2 Wire `AssetFolderContextMap`, `GetAssetActionMap`, `CreateAssetActionMap`, `BulkDeleteAssetActionMap` entries in `src/components/Assets/BaseAssetList/utils.tsx`. Add `getFileManagerLabel` and `getEmptyStateContent` switch cases for `AssetsKeys`

## 6. Components

- [x] 6.1 Create `src/components/Assets/Keys/List.tsx` — delegates to `<BaseAssetList view={ApplicationRoute.AssetsKeys} />`
- [x] 6.2 Create `src/components/Assets/Keys/View.tsx` — detail view with save/discard, JSON editor toggle, Rotate button, and delete. Uses `SimpleEntityHeader`, `EntityJsonEditor`, and `TabsContent`. JSON configuration without format switcher
- [x] 6.3 Create `src/components/Assets/Keys/Properties.tsx` — edits `project` (text), `secured` (boolean toggle), `allowedIpAddressRanges` (list editor)
- [x] 6.4 Create `src/components/Assets/Keys/KeyRoles.tsx` — roles tab editing the `roles` field (grants roles to key bearer). Grid + add-modal pattern similar to `AssetRoles` but operating on `roles` instead of `userRoles`
- [x] 6.5 Create `src/components/Assets/Keys/TabsContent.tsx` — switches between Properties and Roles tabs based on `activeTab`
- [x] 6.6 Create `src/components/Assets/Keys/KeyRotateModal.tsx` — confirmation modal for rotation; generates new secret, shows it to user with copy button on success
- [x] 6.7 Create `src/components/Assets/Keys/CreateKeyModal.tsx` — create modal that generates a secret client-side and shows it to the user after successful creation

## 7. Utilities

- [x] 7.1 Create key generation utility (e.g. `src/utils/keys/generate-key.ts`) using `crypto.getRandomValues` for secure random secret generation
- [x] 7.2 Unit tests for key generation utility (`src/utils/keys/tests/generate-key.spec.ts`)

## 8. Component Tests

- [x] 8.1 Create `src/components/Assets/Keys/tests/List.spec.tsx`
- [x] 8.2 Create `src/components/Assets/Keys/tests/View.spec.tsx`
- [x] 8.3 Create `src/components/Assets/Keys/tests/Properties.spec.tsx`
- [x] 8.4 Create `src/components/Assets/Keys/tests/KeyRoles.spec.tsx`
- [x] 8.5 Create `src/components/Assets/Keys/tests/TabsContent.spec.tsx`

## 9. Quality Checks

- [x] 9.1 Run lint (`npm run lint`), format check (`npm run format`), and full test suite (`npm run test`) — fix any failures

## 10. Asset Wiring Fix-ups (post-review)

Found by comparing against the merged routes (#4285) and roles (#4300) PRs — the initial
implementation wired the Keys components but missed the shared asset-infrastructure maps that the
list/grid/create/delete flows branch on.

- [x] 10.1 Add `KEYS_PREFIX = 'keys/platform/'` and `RESOURCE_TYPE_PREFIX[PROJECT_KEY]` in `publications-core.ts` (was the source of the `undefinedplatform/` request URL)
- [x] 10.2 Add `PROJECT_KEY` to `CORE_RESOURCE_URL`, `CORE_RESOURCE_METADATA_URL`, `PLATFORM_BUCKET_RESOURCE_TYPES`, and the `VersionedResourceType` exclusion in `assets-core.ts`
- [x] 10.3 Add `mergeKeyResource` and register `PROJECT_KEY` in `ASSET_MERGERS` in `asset-metadata.ts` (was breaking `getKey`/detail page)
- [x] 10.4 Add `AssetsKeys` case to `getToolbarOptionLabels` in `Assets/utils.ts` (was hiding the Create button)
- [x] 10.5 Add `AssetsKeys` to `getGridActionLabels` (delete + open-in-new-tab, no duplicate) and `getDeleteNotificationContent` in `Assets/utils.ts`
- [x] 10.6 Add `AssetsKeys` to `getBulkActionsToolbarOptions` in `FileManager/utils.ts`
- [x] 10.7 Add `AssetsKeys` cases to `getDeleteModalTitle`/`getDeleteModalDescription` in `Assets/Modals/utils.tsx`

## 11. Create/Update/Rotate Runtime Fixes (post-review)

Surfaced running the surface against Core: Core's `Key.class` + `validateProjectKey` reject
payloads the initial components produced, and the IP-restriction field came back from Core in a
shape the form couldn't round-trip.

- [x] 11.1 `toKeyPayload` strips `name`/`description` — `Key.class` declares neither, and Core's `BLOB_MAPPER` runs with `FAIL_ON_UNKNOWN_PROPERTIES`, so their presence caused the 400 "Failed to parse entity" on PUT
- [x] 11.2 Multi-step `CreateKeyModal` collecting name + project (step 1) and roles (step 2) before generate+create (step 3 reveal) — Core's `validateProjectKey` requires a non-blank `project` AND at least one role, which the name-only modal could never satisfy
- [x] 11.3 Roles step uses a single inline checkbox multi-select grid (mirrors `AddEntitiesGrid`'s grid: `MULTI_ROW_SELECTION` + `withSourceColumn`), no separate selected-grid + Add button
- [x] 11.4 Rotate button restyled to match the entity-key rotate button: `DialPrimaryButton` + `IconRefresh` + label, passed as `SimpleEntityHeader` `children` (was an icon-only `DialNeutralButton` in `leadingActions`)
- [x] 11.5 `AccessRestrictionField` accepts `allowedIpAddressRanges?: string[] | null` and treats `null`/non-array as "allow all" instead of crashing on `.length`/`.map`
- [x] 11.6 `mergeKeyResource` normalizes Core's `null`/object `allowedIpAddressRanges` to `string[] | undefined` so the form's "no restriction" state matches the original on a clean round-trip (was leaving Save/Discard permanently visible because `isEqualSkippingUndefined` saw `null` ≠ absent)
- [x] 11.7 `getKeyRolesOptions` server action so the client-side create modal can fetch the same role option list the detail page uses

## 12. Breadcrumbs, list-path crash, IP-range round-trip (post-review)

- [x] 12.1 Add `AssetsKeys` breadcrumb config in `Breadcrumbs/constants.ts` (was missing — no breadcrumb on the list/detail pages)
- [x] 12.2 `AssetApi.resolveListPath` guards against `undefined`/empty path for platform-bucket types — `stripPrefix(undefined, 'platform/')` was crashing the list read (`getKeys` → `assetApi.list` → `getMetadata` → `resolveListPath`)
- [x] 12.3 `mergeKeyResource` preserves BLOCK_ALL: an empty `{"ranges":[]}` bean from Core maps to `[]` (was dropping to `undefined`, so a saved "deny all" reverted to "allow all" on reload); `null`/populated-bean still map to `undefined` (ALLOW_ALL / unrecoverable byte arrays)

## 13. Create redirect + populated IP-range round-trip (post-review)

- [x] 13.1 `CreateKeyModal` navigates to the new key's detail page when the reveal step closes — matches every other asset's create flow (was only closing the modal)
- [x] 13.2 `mergeKeyResource` normalizes `null` → `undefined` for `allowedIpAddressRanges` and keeps `string[]` (including `[]` for BLOCK_ALL) as-is. The field is only `string[] | null | undefined` on the wire — removed the bean-form reversal (`normalizeIpRanges`/`cidrFromRange`/`decodeBase64Bytes`/`bytesToIp`) per review.

## 14. Delete fetchFiles + IP-range simplification (post-review)

- [x] 14.1 Add `AssetsKeys` to `isAssetView` so `DeleteConfirmationModal` calls `fetchFiles` after a delete from the detail view (was missing — the list didn't refresh post-delete)
- [x] 14.2 Reverted: kept the group-13 `normalizeIpRanges` bean-form reversal in `asset-metadata.ts`. The simpler `null → undefined`-only normalization broke IP-range round-tripping in practice; the bean-form CIDR reconstruction (base64 `mask`/`maskedBaseIp` → `ip/prefix`) is restored as the working implementation. 21 tests cover all shapes.

## 15. IP-range mask notice (post-review)

Core's `IpAddressRangeDeserializer` masks the base IP on write (`192.168.1.1/2` → `192.0.0.0/2`) and stores only the network address + bitmask, so the original host bits are irrecoverable. The reconstructed CIDR is the canonical network address — accepted as Core's inherent behavior, but surfaced to the user so the normalization isn't surprising.

- [x] 15.1 Add an info icon (`IconInfoCircle` + `DialTooltip`) next to the "Only selected ranges" radio option in `AccessRestrictionField`, gated by a new `showMaskNotice` prop, with a message explaining the network-address normalization. Asset keys only — the legacy entity-key surface stores raw CIDR and doesn't mask, so the notice would mislead there.
- [x] 15.2 Add `KeysI18nKey.IpRangesMaskNotice` + translation

## 16. AccessRestrictionField post-save refresh (post-review)

- [x] 16.1 `AccessRestrictionField` reinits from `originalEntity` when it changes (post-save `router.refresh` replaces `originalKey` with Core's masked ranges), not just on mount. Reads `originalEntity` directly to avoid the race where `entity` (a clone the parent updates in a separate effect) is still the pre-refresh value on that render. The discard path (`entity === originalEntity`) is unchanged.

Browser-observable verification task omitted: the local stack environment is not available for
automated Playwright verification in this change's scope.
