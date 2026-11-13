## Context

A role holder on an org unit is a Core `claimsPredicate` subject: `source` (claim name), `function` (`EQUAL` or
`TRUE`) and `targets`. `utils/org-units/subjects.ts` maps a subject to a chip kind (`classifySubject`) and a form
choice back to a subject (`buildSubject`). Both take a `groupClaim` string that `[lang]/layout.tsx` reads from
`ORG_UNITS_GROUP_CLAIM` (default `groups`) and hands down through `OrgUnitsContext` to `UnitInfo`,
`UnitRolesCard` and `AddHolderForm`. Group is the only kind whose `source` is not fixed, which is why the claim is
threaded everywhere.

The kinds today: Email (`source` `email`, or any non-group source with an `@` target), Group (`source` equals the
configured claim), Role (`roles`), Everyone (`TRUE` on `sub`), Raw (anything else).

## Goals / Non-Goals

**Goals**
- One holder kind for any claim, with the claim name entered by the admin.
- No configuration needed to recognise or create it; `groupClaim` disappears from the app.
- A chip that states both claim and value (`key=value`).
- No subject saved from the form changes kind when it is read back.

**Non-Goals**
- Read-only behaviour of other entity views, multi-target editing, new predicate functions, or any Units API
  change.

## Decisions

### Custom claim replaces Group, it does not sit beside it
Group is the special case of Custom claim with a preset key. Keeping both would give two ways to author the same
subject and would keep `groupClaim` alive. Existing group assignments classify as Custom claim and render
`groups=eng`. Alternative considered: keep Group when the env var is set. Rejected: it keeps the plumbing the
change exists to remove, and the chip for such an assignment is no worse as `groups=eng`.

### Classification becomes source-driven and config-free
`classifySubject(subject)` loses its second parameter:

```
TRUE  + source sub + no targets   → EVERYONE   (label '')
EQUAL + source email              → PERSON     (label: targets joined)
EQUAL + source roles              → DIAL_ROLE  (label: targets joined)
EQUAL + any other source          → CLAIM      (label: `${source}=${targets joined}`)
anything else                     → RAW        (label: `${source} = ${targets joined}`)
```

The `@`-in-a-target heuristic is dropped. It existed to catch emails stored under another claim, but with free
claim names it would turn `upn=a@b.com` into a person chip. An assignment stored that way now shows as
`upn=a@b.com`, which is what it is. RAW keeps its spaced label and now only covers shapes the form cannot create
(`TRUE` on another source, `EQUAL` with no targets).

A multi-target assignment renders `key=a, b` (targets joined as before). The form only creates one target.

### `buildSubject(kind, value, claimKey?)`
`SubjectKind.CLAIM` builds `EQUAL` on the trimmed `claimKey` with `[trimmed value]` and throws without a key, as
RAW already throws. The third parameter replaces `groupClaim`; the other kinds ignore it.

### Reserved keys are refused in the form
`email`, `roles` and `sub` are exported from `subjects.ts` as `RESERVED_CLAIM_KEYS`. A key equal to one of them
(exact, after trim) is invalid, because the stored subject would re-classify as Email, Role or Everyone on reload
and the admin would see a different chip than the one they added. Comparison is case-sensitive: claim names are,
and `Email` classifies as a Custom claim on read, so it round-trips. Alternative considered: accept them and let
the chip change kind after Save. Rejected: the add would look wrong and silently differ from what was entered.

### Key and value validation
Both use the existing `isValidHolderValue` (non-blank, at most 256 characters, no control characters). A dotted
path such as `realm_access.roles` is a valid key; the form does not interpret it. A key containing `=` is not
rejected: only the chip label is ambiguous then, and Core receives `source` and `targets` as separate fields.
Draft de-duplication already uses `subjectKey` (source, function, sorted lower-cased targets), so adding the same
key and value twice is still caught.

### Form
`AddHolderForm` keeps its radio group; `ADDABLE_KINDS` becomes Email, Role, Custom claim, Everyone, which gives
the requested order. For Custom claim it renders a Key input before the Value input in the same row; the other
kinds render the single value input as now. State gains a `claimKey` string. Switching kind keeps the typed value
and key (each is only used by its own kind); a successful add clears both. Add stays disabled until the key and
value are valid. Errors appear once the field has content, as today: `HolderInvalid` for an invalid key or value,
and a new message for a reserved key. Both inputs get an accessible name (`aria-label`) and a placeholder from the
same key. Read-only mode is unchanged: `UnitRolesCard` mounts the form only when it is editable, so a read-only
user never sees the inputs and the chips have no remove button.

### Icon
`SubjectKindIcon` maps `CLAIM` to `IconBraces` (`aria-hidden`, `DIAL_ICON_SIZE.SM`) and drops the Group case
(`IconUsers`). `IconKey` was avoided because the app already uses it for API keys. RAW still renders no icon.

### Removing `groupClaim`
Removed from `OrgUnitsContext` (value, type and the `groupClaim` provider prop with its `'groups'` default), from
`[lang]/layout.tsx`, from the `UnitInfo` → `UnitRolesCard` → `AddHolderForm` props, and from the org-units mock in
`test-setup.tsx` and the specs that build the context value. `ORG_UNITS_GROUP_CLAIM` is removed from
`.env.template` and the README table. Nothing reads it afterwards, so a deployment that still sets it is
unaffected.

### i18n
Removed: `HolderGroup`, `HolderGroupPlaceholder`. Added to `FoldersI18nKey` and `en.ts`: `HolderClaim` ("Custom
claim"), `HolderClaimKey` ("Claim name"), `HolderClaimValue` ("Claim value"), `HolderClaimKeyReserved`.
`HolderInvalid` is reused. The radio label for Custom claim is `HolderClaim`.

## Risks / Trade-offs

- [Legacy assignments change appearance: group chips lose the users icon, and an email stored under a non-`email`
  source loses the person icon] → Accepted; the chip text is unchanged apart from `key=` and the data is not
  touched. Called out in the release notes.
- [`key=value` is ambiguous when a key or value contains `=`] → Only the label is affected; the stored fields stay
  separate and the remove button's accessible name uses the same text. Accepted.
- [A deployment relying on `ORG_UNITS_GROUP_CLAIM` to author group holders loses the one-click preset] → The admin
  types the claim name once per holder. Mentioned under Deployment Changes.
- [Case-sensitive reserved-key check lets `Email` through] → Intentional; it is a different claim and round-trips
  as a Custom claim.

## Migration Plan

No data migration: stored subjects are unchanged and old group assignments are read as Custom claims. Ship as one
PR. Add a line to `docs/INFRA-CHANGELOG.md` that `ORG_UNITS_GROUP_CLAIM` is no longer read and can be removed from
deployment values. Rollback is a revert; nothing persisted depends on the new kind.

## Open Questions

- None blocking. Whether `Custom claim` should be renamed (for example "Claim based") is a copy change confined to
  the one `en.ts` value.
