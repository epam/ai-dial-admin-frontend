## Context

Keys are managed in DIAL Core as `PROJECT_KEY` resources stored in the flat `platform` bucket — the
same `ConfigResourceController` surface as Models, Interceptors, Routes, and Roles. The admin
frontend already has a mature asset infrastructure (`BaseAssetList`, `AssetApi`,
`AssetsFolderContext`, flat-platform-view handling) that every other config resource type uses. This
change slots Keys into that same infrastructure.

The existing `/keys` route uses the admin-backend's custom `/api/keys/` endpoints. The new
`/assets-keys` route bypasses the admin backend entirely, going Core-direct through `AssetApi`'s
blob-storage interface — the same path Roles, Routes, Models, etc. already take.

Core's `Key.class` fields:
- `key` (String, `@JsonProperty(WRITE_ONLY)`, `@EncryptedField`) — the API secret
- `project` (String)
- `role` (String, deprecated single role)
- `secured` (boolean)
- `roles` (List<String>) — roles this key grants to its bearer
- `allowedIpAddressRanges` (IpAddressRanges)

Core's write behavior:
- On PUT, `SecretFieldProcessor.mergePreservingOmittedSecrets` preserves the existing `key` value
  when the request body omits it — so updates without rotation don't need the secret.
- On PUT with a new `key` value, Core revokes the old secret from `ApiKeyStore` and registers the
  new one (atomic rotation).
- `validateKeyForApiWrite` rejects a PUT with blank `key` on CREATE (no prior blob to merge from).
- On GET, `@JsonProperty(WRITE_ONLY)` drops `key` from the response — the secret is never returned.

## Goals / Non-Goals

**Goals:**
- Provide a Core-direct asset surface for Keys at `/assets-keys` following the established
  `BaseAssetList` pattern.
- Support CRUD + bulk delete, key rotation, roles assignment, and IP range editing.
- Reuse as much shared infrastructure as possible (same context factory, same list component,
  same action-map wiring).

**Non-Goals:**
- Replacing or modifying the old `/keys` route.
- Adding folder support (Core's `platform` bucket is flat for Keys).
- Import/export/move operations (Keys are not `CrudAssetRoute`).
- Editing role limits from the Key view.
- Displaying `expiresAt`/`keyGeneratedAt`/`projectContactPoint` (admin-backend-only fields).
- The `ExportFormat.CORE` dual-view toggle.

## Decisions

### D1: ResourceType — `PROJECT_KEY`

The frontend `ResourceType` enum gets `PROJECT_KEY = 'PROJECT_KEY'` matching Core's
`ResourceTypes.PROJECT_KEY` name. The url segment is `keys` (Core handles the mapping internally).

**Alternative considered:** `KEY` — rejected because every other entry matches Core's enum name
exactly (`ROLE`, `ROUTE`, `MODEL`, `INTERCEPTOR`).

### D2: Model — `DialKeyResource`

New interface in `models/dial/resource.ts`, extending `ModifiedEntity` (like `DialRoleResource`):

```ts
export interface DialKeyResource extends ModifiedEntity {
  name: string;
  path: string;
  folderId: string;
  author?: string;
  status?: DialModelResourceStatus;
  validationWarnings?: CoreValidationWarning[];
  key?: string;
  project?: string;
  secured?: boolean;
  roles?: string[];
  allowedIpAddressRanges?: string[];
}
```

Added to `PlatformAsset` union. The `key` field is only used on create/rotate writes — it's never
present on reads.

### D3: Roles tab — custom component, NOT `AssetRoles`

`AssetRoles` edits `userRoles` (which roles can ACCESS this entity — `RoleBasedEntity` pattern).
Keys' `roles` field is the inverse: which roles the key GRANTS to its bearer. `Key` does not extend
`RoleBasedEntity`.

A new `KeyRoles` component under `components/Assets/Keys/` follows the same grid + add-modal
pattern as `AssetRoles` but edits the `roles` field instead. The component is local to Keys because
no other entity type has this "grants roles" semantic.

### D4: Key rotation — PUT with new secret

Rotation uses the standard `updateKey` server action with a freshly generated secret in the `key`
field. Core's `ConfigResourceController` handles the old-secret-revoke + new-secret-register
atomically. The UI generates the secret client-side using `crypto.getRandomValues`.

After successful rotation, the new secret is shown to the user in a confirmation modal with a
copy button — same UX as the existing `KeyRotateModal`.

### D5: Key secret display — create-time only

Since Core never returns `key` on GET, the secret is visible only:
1. After creation (returned from the create action / generated locally).
2. After rotation (the newly generated value).

The Properties tab does NOT display a `key` field.

### D6: Payload stripping — `toKeyPayload`

Same pattern as `toRolePayload` / `toRoutePayload`: strip `status`, `validationWarnings`, `path`,
`folderId`, `author`, `createdAt`, `updatedAt` before PUT. The `key` field is conditionally
included only on create and rotate — omitted on regular property updates so Core preserves the
existing secret.

### D7: Flat platform view registration

`ApplicationRoute.AssetsKeys` added to `FLAT_PLATFORM_VIEWS` in `root-folder.ts`. This disables
folder creation UI and sets root to `platform`.

### D8: Menu placement

Positioned after `AssetsRoles` in the Assets group in `menu-configuration.tsx`, with
`isPreview: true`. Requires `MenuI18nKey.AssetsKeys` and `ApplicationRoute.AssetsKeys = '/assets-keys'`.

## Risks / Trade-offs

**[Risk]** Key rotation requires the generated secret to survive the round-trip from UI →
server action → Core PUT → response. If the server action fails after generating but before
confirming, the user never sees the secret.
→ **Mitigation:** Generate client-side, show immediately in the modal, fire the PUT, then confirm
or show error. The user has the secret before the PUT — if it fails, they know and can retry.

**[Risk]** `validateKeyForApiWrite` rejects blank `key` on PUT. If the create modal accidentally
omits the secret, Core returns 400.
→ **Mitigation:** The create action always generates a secret — it's not user-provided. Unit test
the action to ensure `key` is never blank on create.

**[Risk]** The `role` (singular, deprecated) field on `Key.class` may still be in use by some
deployments. Ignoring it could mean a key that relies on the legacy field loses its grants.
→ **Mitigation:** On read, merge `role` into `roles` for display (same as Core's
`getMergedRoles()`). On write, leave `role` as-is (don't strip it) so existing data is preserved.
