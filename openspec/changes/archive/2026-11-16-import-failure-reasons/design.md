## Context

Prompts, applications and toolsets import through one loop, `importAssetsExport` (`server/assets/exim.ts`):
one Core `PUT` per entity. A rejected `PUT` returns `ServerActionResponse` with `errorMessage` — already
flattened from Core's plain-text or `{ error: { message } }` body by `normalizeCoreError`
(`server/core/error.ts`). The loop reduces that to `{ sourcePath, targetPath, status: FAILED }`.

Files import (`server/files/import.ts`) already returns `error: result.errorMessage` per failure. On the
client, `getImportNotificationContent` (`components/Assets/utils.ts`) accepts
`{ targetPath, status, error? }[]` — its own `ImportResult` in `components/Assets/types.ts` — and builds the
failure description as `Set(error || targetPath).join(', ')`, repeated in four route branches.

## Goals / Non-Goals

**Goals:** every failed import item carries Core's reason; the notification shows each reason once with the
paths it applies to, one path per line.

**Non-Goals:** rewording Core's messages, new i18n keys, changes to Core, the success/skipped notifications,
or the entity-list import flow (`getImportResults` in `EntityListView/Import/utils.ts`).

## Decisions

**1. Carry the reason on the result, not in a side channel.** Add `error?: string` to `ImportResult` in
`models/import.ts` and set it from `result.errorMessage` on the failed-`PUT` branch of `importAssetsExport`.
That matches what Files already returns and what the client type already reads, so no client type changes.
*Alternative:* a separate `failures` map in the action response — rejected, it duplicates the per-item shape
that already exists.

**2. Show Core's text as is.** No mapping to friendlier strings. *Alternative:* match on Core's message to
produce the issue's "add client_secret" wording — rejected: it string-matches server text (brittle), needs
new i18n, and the Core message already names the field.

**3. Group by reason in one shared helper.** A pure function in `Assets/utils.ts` takes the failed results and
`t`, and returns the description:

```
<reason A>:
 <path 1>
 <path 2>
<reason B>:
 <path 3>
<ImportErrorDescription>:
 <path 4>          ← results with no reason, last, only if any
```

- Grouping key is the trimmed `error`; empty or missing `error` means "no reason".
- Groups with a reason keep first-seen order; the no-reason group is always last.
- Each path is indented by one space under its header; lines are joined with `\n`. `Notification.tsx` already
  renders `whitespace-pre-wrap` inside a `max-h-40 overflow-y-auto` block, so long lists scroll.
- Paths are not deduplicated: the same path appearing twice (for example a duplicate archive entry, which
  `server/files/import.ts` reports as two failures) stays listed twice, as it is two failures. Only the
  reason is collapsed.

The four route branches (Files, Prompts, Applications, Toolsets) call the helper instead of
`failedMessages.join(', ')`. `failedItems` stays for the title count.

*Alternative:* one path per line with the reason repeated on each — rejected, it repeats long Core text
for every item of a bulk failure.

**4. Reuse `ImportErrorDescription` as the fallback header.** Its text becomes `Error occured while
importing` (no `{list}`); the helper appends `:` so all headers are built the same way. No new key. The
existing misspelling ("occured") is left as is — fixing copy is out of scope.

**5. Failures without a reason.** `exim.ts` pushes `FAILED` with no Core call when an id does not start with
the resource-type prefix; that item has no `error` and lands in the fallback group. A failed `PUT` whose
`errorMessage` is empty does too.

## Risks / Trade-offs

- **[Core message is terse or technical]** → accepted; it is the authoritative reason and it names the field.
- **[Very long toast for a large failed import]** → the description block scrolls (`max-h-40`); the title still
  carries the count.
- **[Files behaviour changes]** — its failures stop being deduplicated into a path-less list and now show
  paths under each reason → intended; covered by the updated spec cases.
- **[Core error text may contain a secret value]** — the validation messages name fields, not values
  (`ClientSecretValidation`), so nothing sensitive is surfaced. New Core messages are not audited here.

## Migration Plan

None — client-only, no stored data or API contract changes. Rollback is a revert.

## Open Questions

None.
