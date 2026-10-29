## Context

`getAssetDestinationError` already centralizes path validity, 900 UTF-8 byte length, and uniqueness. `AssetVersion` uses its error text and registers validity in `SaveValidationContext`; `CreateApplication` also derives its Next-button state from that helper. `createApp` and `createToolset` reject its errors before Core PUTs. This small change crosses the shared UI/server validation boundary, so the design records the shared enforcement decision.

## Goals / Non-Goals

**Goals:** Enforce the issue #5279 development-team contract (`name__version < 256`), with localized Version feedback, blocked creation, and unchanged storage-path validation.

**Non-Goals:** Migrating existing assets; changing ordinary detail saves, platform resources, import/move, or unrelated version controls; adding browser automation (declined by the user).

## Decisions

### Enforce the combined leaf in the shared destination helper

Use `getVersionedName(name, version)` once and reject a leaf longer than a dedicated `MAX_ASSET_NAME_VERSION_SYMBOLS = 255` constant in `src/constants/validation.ts`. Use JavaScript string length, consistent with the existing name-symbol checks; keep UTF-8 byte measurement separate. The `__` delimiter counts; folders and type/bucket prefixes do not count toward this character limit.

Return `ErrorType.LENGTH` with a distinct localized `ErrorI18nKey.AssetNameVersionTooLong` and `{ max }` message explaining that the name and version combined, including `__`, must not exceed 255 characters. Preserve version/path invalidity checks and retain the existing byte-limit error precedence when both length limits fail, minimizing changes to existing error behavior. Continue checking duplicate destinations after validity checks.

Alternative: separately cap the Version input or validate only in Create modals. Rejected because the allowed Version length depends on name and because separate validators would diverge from server creation, duplication, and publication editing.

### Reuse existing form wiring

Do not add component-local state or a new validation mechanism. `AssetVersion` derives its error from props and dispatches invalidity when name/version changes, while the existing modal and save contexts block submission. The server-create actions inherit the helper check without API changes. Test these boundaries using existing centralized mocks.

### Test the two independent constraints

Cover 255/256-character combined leaves for both resource types, the reported 100-character name plus 160-character version, name-dependent revalidation and error recovery, and a valid multibyte leaf whose character count is below the limit. Rewrite existing 900-byte boundary fixtures to use long valid parent folders with short leaves, so byte-limit tests remain meaningful rather than failing the new character check. Assert exact localized failure responses and no PUT in server-action tests.

## Risks / Trade-offs

- Shared callers also reject oversized newly entered duplicate/publication identities → This matches the existing new-entry validation scope; leave untouched legacy detail saves unchanged.
- Issue title says ≤256 while its expected result and confirmed clarification say <256 → Use maximum 255 and explicit boundary tests.
- A large parent path can exceed 900 bytes even with a valid leaf → Keep independent path-byte tests and the existing localized path error.
- Unicode counting can differ across runtimes → Follow the project's JavaScript string-length convention, record it in acceptance criteria, and do not silently normalize text.

## Migration Plan

Deploy as a frontend validation fix with no data migration or API changes. Existing resources remain readable/editable under the legacy-identity rules. Rollback is reverting the validation and message changes.

## Open Questions

None blocking. Automated browser verification was explicitly declined; regression tests and quality checks remain required.
