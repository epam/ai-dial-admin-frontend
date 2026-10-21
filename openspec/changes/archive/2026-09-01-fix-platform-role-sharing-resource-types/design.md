## Context

`Assets > Platform > Roles`' Sharing tab (`components/Assets/Platform/Roles/Sharing.tsx`) is the
Core-direct surface for editing a `Role` resource's `share` map — a different backend and wire shape
from `Entities > Roles`' admin-backend-driven `RoleSharing`. Its own doc-comment says it was "adapted
from `Entities > Roles`'... reusing its grid columns/placeholder/reset-visibility helpers verbatim" —
but that reuse went one step too far: it also inherited the admin-backend surface's lowercase
`SharingType` enum and `sharingDefaults` map, neither of which matches Core's actual wire shape.

Core's `ShareService` looks up a role's per-type override by `resourceType.name()` — the Java enum's
name, e.g. `"TOOL_SET"`, `"APPLICATION"`, `"SKILL"` — and falls back to its own hardcoded
`DEFAULT_LIMITS` when no override exists:

```java
private static final Map<ResourceType, ShareResourceLimit> DEFAULT_LIMITS = Map.of(
    ResourceTypes.APPLICATION,  new ShareResourceLimit(10, 72),
    ResourceTypes.CONVERSATION, new ShareResourceLimit(Integer.MAX_VALUE, 72),
    ResourceTypes.FILE,         new ShareResourceLimit(Integer.MAX_VALUE, 72),
    ResourceTypes.PROMPT,       new ShareResourceLimit(Integer.MAX_VALUE, 72),
    ResourceTypes.TOOL_SET,     new ShareResourceLimit(10, 72),
    ResourceTypes.CREDENTIALS,  new ShareResourceLimit(10, 72),
    ResourceTypes.SKILL,        new ShareResourceLimit(10, 72));
```

`ShareResourceLimit` itself defaults both fields to `-1` when unset:

```java
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class ShareResourceLimit {
    int maxAcceptedUsers = -1;   // unset sentinel
    long invitationTtl = -1;     // unset sentinel
}
```

Since `-1` is a primitive `int`/`long` default (not `null`), and an empty JSON string deserializes
into a primitive numeric field as `0` (Jackson's default scalar coercion), both ends of this surface
need to treat "no value" as a value distinct from `0` and `-1` — that's the throughline connecting
every symptom in the linked issue and the follow-up requests.

## Goals / Non-Goals

**Goals:**
- Make `Assets/Platform/Roles`' sharing grid read and write the exact map keys Core uses
  (`resourceType.name()`), so defaults, resets, and persisted overrides all operate on real data.
- Match Core's own default limits (including the two new types) instead of the admin-backend surface's.
- Treat Core's `-1` sentinel as "unset" on read, and never write an empty string or a synthesized `0`
  on clear.
- Keep the fix scoped to `Assets/Platform/Roles` — `Entities > Roles` (`components/Roles/**`) is
  correct for its own backend and stays untouched.

**Non-Goals:**
- No change to `Entities > Roles`' `SharingType`/`sharingDefaults`/`DialRoleShare` — those model a
  genuinely different (admin-backend) wire shape and are out of scope.
- No attempt to unify the two surfaces on one shared resource-type enum. They diverge by design (one
  is Core's `ResourceTypes.name()`, the other is the admin-backend's own lowercase convention); forcing
  them onto one type would make one of the two surfaces read wrong again the next time either backend's
  shape moves independently.
- No change to `ms`↔`hours` handling for `invitationTtl` — Core's field is already hours-native, and
  `Assets/Platform/Roles/utils.ts`'s existing doc-comment on this is correct and unaffected.
- No change to `CostLimits.tsx` — it already implements the "delete key on empty" pattern correctly;
  it's a reference, not a target.

## Decisions

**A platform-only `SharingType`, not a shared/renamed one.** Add
`components/Assets/Platform/Roles/types.ts` (or a `models.ts`, per `code-standards.md`'s
types/interfaces placement) with its own enum:

```ts
export enum PlatformSharingType {
  APPLICATION = 'APPLICATION',
  TOOL_SET = 'TOOL_SET',
  PROMPT = 'PROMPT',
  FILE = 'FILE',
  CONVERSATION = 'CONVERSATION',
  CREDENTIALS = 'CREDENTIALS',
  SKILL = 'SKILL',
}
```

`SKILL`, singular, matching `ResourceTypes.SKILL` — not `SKILLS` as the triggering ticket text says.
The Java enum's `name()` is the literal map key Core reads (`ShareService.getLimit`); a mismatch here
reproduces exactly the class of bug this change fixes. Alternative considered: reuse
`DialModelResourceType`-style naming already in `models/dial/resource.ts` — rejected, because those
enums model different concepts (model kind, not shareable-resource kind) and happen to also be
uppercase by coincidence, not by any shared contract worth coupling to.

**A platform-only defaults map**, alongside the enum, mirroring `ShareService.DEFAULT_LIMITS` exactly
(as placeholder strings, matching the existing `getDefaultPlaceholder` cell-renderer contract):

```ts
export const platformSharingDefaults: Record<PlatformSharingType, SharingGridData placeholder shape> = {
  [PlatformSharingType.APPLICATION]: { invitationTtl: '72', maxAcceptedUsers: '10' },
  [PlatformSharingType.TOOL_SET]:    { invitationTtl: '72', maxAcceptedUsers: '10' },
  [PlatformSharingType.CREDENTIALS]: { invitationTtl: '72', maxAcceptedUsers: '10' },
  [PlatformSharingType.SKILL]:       { invitationTtl: '72', maxAcceptedUsers: '10' },
  [PlatformSharingType.PROMPT]:       { invitationTtl: '72', maxAcceptedUsers: '' },
  [PlatformSharingType.FILE]:        { invitationTtl: '72', maxAcceptedUsers: '' },
  [PlatformSharingType.CONVERSATION]: { invitationTtl: '72', maxAcceptedUsers: '' },
};
```

`CONVERSATION`/`FILE`/`PROMPT` keep an empty max-users placeholder rather than displaying
`Integer.MAX_VALUE` as a number — Core's own default for those is effectively "unlimited", which the
existing `EditableCellRenderer`/`UNLIMITED_ACCEPTED_USERS` machinery already renders as the
"Unlimited" placeholder-primary state once wired to the real sentinel, not as a literal huge number.

Also add a platform-only `platformSharingTypeLabels` map (`PlatformSharingType -> MenuI18nKey`), same
shape as `Roles/constants.ts`'s `sharingTypes`, feeding `SHARING_COLUMNS`' `formatType`. New
`MenuI18nKey.Credentials = 'Menu.Credentials'` key + `en.ts` entry (`Menu.Skills` already exists for
`SKILL`'s label).

**`-1` is "unset" in `getAssetSharingData`.** Change:

```ts
invitationTtl: shareData?.invitation_ttl != null ? String(shareData.invitation_ttl) : undefined,
```

to also exclude `-1`:

```ts
const isUnset = (value?: number | null) => value == null || value === -1;
invitationTtl: isUnset(shareData?.invitation_ttl) ? undefined : String(shareData!.invitation_ttl),
```

applied to both fields. This makes the row fall through to `getDefaultPlaceholder`, showing an empty
input with the default placeholder — exactly the requested behavior — with no special-casing needed
in the cell renderer itself (`EditableCellRenderer` already treats `undefined` as "no value, show
placeholder").

**Per-field delete on clear in `applySharingChange`**, mirroring `CostLimits.tsx`'s `onChangeToken`:

```ts
export const applySharingChange = (role, sharingTypeName, token, value) => {
  const field = toCoreShareField(token);
  const newValue = { ...role.share?.[sharingTypeName] };
  if (value === '' || value == null) {
    delete newValue[field];
  } else {
    newValue[field] = value;
  }
  const share = { ...role.share, [sharingTypeName]: newValue };
  if (Object.keys(newValue).length === 0) {
    delete share[sharingTypeName];
  }
  return { ...role, share };
};
```

This keeps the existing "drop the whole entry once every field is gone" behavior (now driven by
`Object.keys(...).length === 0` instead of `every field is blank`) while fixing the actual defect: a
sibling field that still has a value no longer leaves the cleared field behind as `''`, which is what
was getting silently coerced to `0` server-side. A value of literal `0` (user-typed) still flows
through the `else` branch unchanged, satisfying "save 0 only if the user enters it manually."

**Test rewrite, not patch.** `components/Assets/Platform/Roles/tests/utils.spec.ts` currently encodes
the lowercase-key, 5-type, "blank-entry-only" assumptions as passing assertions — per
`.claude/rules/testing.md`'s general expectation that tests assert real behavior, these get rewritten
against the corrected contract (uppercase keys, 7 types, `-1`-as-unset, per-field delete on clear)
rather than patched around the edges.

## Risks / Trade-offs

- **Existing role resources with lowercase `share` keys** (if any were ever persisted by the buggy
  code) become orphaned — the new uppercase lookup won't find them, and their old override is
  effectively lost on the next load. → Acceptable: the buggy code could never *display* those values
  correctly either (same lowercase/uppercase mismatch bit the read path too), so no working state
  regresses; a role appearing to reset to Core defaults after this fix is a correction, not a
  regression. Not raising this as a migration task per `openspec/config.yaml`'s no-manual-verification
  rule and because there is no read path today that would even notice the difference.
- **Two parallel `SharingType`-like enums in the codebase** (`Roles/types.ts` lowercase,
  `Assets/Platform/Roles/types.ts` uppercase) is a legitimate source of future confusion. →
  Mitigated by each file's doc-comment stating explicitly which backend/surface it belongs to (matching
  the existing convention already established by `Assets/Platform/Roles/utils.ts`'s own doc-comment).
- **`CONVERSATION`/`FILE`/`PROMPT` max-users placeholder stays blank** rather than showing a literal
  "Unlimited" hint out of the gate. → Out of scope per the triggering request, which only calls out the
  toolset default; can be revisited separately if desired.

## Open Questions

None outstanding — the resource-type naming and scope questions were resolved during exploration
(`SKILL` singular, platform-only modules, no `Entities > Roles` changes).
