## Why

Importing toolsets, prompts or applications that Core rejects produces an error notification that lists the
failed paths and nothing else — "Error occured while importing: public/ALS toolsets/…, …". The reason is
already known: Core answers each failed `PUT` with a specific `400` (for an OAuth toolset exported without its
secret: `Field 'CLIENT_SECRET' is required for OAUTH authentication.`), but `importAssetsExport`
(`server/assets/exim.ts`) records only `status: FAILED` and discards `result.errorMessage`
([#4003](https://github.com/epam/ai-dial-admin-frontend/issues/4003)).

The notification builder also loses information once a reason does exist: Files import already carries
`error`, but `getImportNotificationContent` reduces failures to `Set(error || targetPath)` joined by `, `, so
identical reasons collapse and their paths disappear.

## What Changes

- `ImportResult` (`models/import.ts`) gains an optional `error`; `importAssetsExport` fills it from Core's
  error message when a `PUT` fails. Core's text is passed through as is — no mapping, no new i18n.
- The import error notification groups failed items by reason: each reason is a header line ending in `:`,
  followed by its paths, one per line, indented by one space. Groups keep first-seen order.
- Failures with no reason (for example an invalid resource id, which fails before any request) form a final
  group under the existing `Error occured while importing` header, shown only when such failures exist.
- One shared helper replaces the four duplicated `failedMessages.join(', ')` blocks in
  `getImportNotificationContent` (Files, Prompts, Applications, Toolsets).
- `FileManagerI18nKey.ImportErrorDescription` becomes a bare header (`{list}` placeholder removed); the
  helper appends the `:`.

## Capabilities

### New Capabilities

<!-- None -->

### Modified Capabilities

- `asset-import-progress`: the error notification presented when an import settles lists failed items grouped
  by Core's reason instead of a comma-joined list of paths.

## Non-goals

- No friendly rewording or mapping of Core's messages, and no extra hint such as "add `client_secret` to the
  file" — Core's text is shown as is.
- No change to the success or skipped notifications, or to the title ("N toolsets import failed").
- No change to `getImportResults` in `EntityListView/Import/utils.ts` (entity-list import, a different flow
  that already prints paths on separate lines).
- No change to Core; no change to the `ENABLE_UNSAFE_TOOLSET_IMPORT` workaround
  (`unsafe-toolset-import-secrets`) — it keeps working, and its users also see Core's reason when a
  secret is cleared or too short.

## Impact

- `apps/ai-dial-admin/src/models/import.ts` — `error?` on `ImportResult`.
- `apps/ai-dial-admin/src/server/assets/exim.ts` — populate `error` on the failed-`PUT` branch.
- `apps/ai-dial-admin/src/components/Assets/utils.ts` — shared grouping helper; four call sites.
- `apps/ai-dial-admin/src/locales/en.ts` — `Import.ErrorDescription` text.
- Shared surface: `getImportNotificationContent` serves Files, Prompts, Applications and Toolsets, so Files
  also changes — its failures stop being deduplicated into a path-less list.
- Tests: `components/Assets/tests/utils.spec.ts` (existing cases assert the `, ` join and the dedup),
  `server/assets/tests`.
