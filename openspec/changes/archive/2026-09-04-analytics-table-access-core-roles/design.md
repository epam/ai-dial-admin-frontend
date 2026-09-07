## Context

See `proposal.md` — Why. The design-relevant state:

- `TableAccessPanel` opens as a form popup, and on open issues one `Promise.all([getTableAccess(name), getRoles()])`. `getRoles()` (`app/[lang]/tables/actions.ts`) wraps `rolesApi.getRolesList` and returns `DialRole[] | null`; the panel treats `null` as "catalog failed" and shows one notification.
- The reader this change moves to, `readConfigEntities(token, ConfigFileEntityType.Roles, warnings)`, has a different failure contract: it **never returns null**. A total failure returns `[]` and pushes `EntitiesI18nKey.OptionListUnavailable` into the caller's `warnings` array; a partial failure returns the population it could read and pushes `OptionListPartial`. Callers today are server components that render those keys as page banners.
- It returns `ConfigEntityRow { name, displayName, origin }`. For roles both fields carry the bare name — `toConfigEntityRows` fills them from the same `option.name`, and `getConfigEntityReference` returns the bare name for the short-name-keyed types, roles among them — so no adaptation is needed either way.
- The two pickers are `DialSelectField multiple`. A closed select renders only the `value` entries that match an `option`, and its `onChange` reports the selection built from the options — so a stored value with no matching option is invisible and is dropped by the next edit.

## Goals / Non-Goals

**Goals:**

- The panel's option source and the panel's failure reporting move together: adopting a reader with a different failure contract must not silently drop the "catalog failed" notification the current panel shows.
- No new prop, branch, or behavior on any shared control, and no new UI shape invented for this surface.
- A grant the catalog does not contain is preserved structurally, not by a guard that a future refactor can drop.

**Non-Goals:**

- Reworking how `readConfigEntities` reports failure. Its warnings-array contract serves five existing callers; this change adapts to it at the action boundary.
- Adopting the `GridView` + `AddEntitiesGrid` shape the other role surfaces use (see D3).

## Decisions

### D1 — Re-point `getRoles()` in place rather than add a second action

`getRoles()` has exactly one caller. Adding a `getTableRoleOptions()` beside it would leave two names for one read and an unused legacy path pointing at a backend being retired. The body is replaced; the name stays, so the panel's `Promise.all` is untouched.

Its return type changes from `DialRole[] | null` to a named shape carrying both halves of the reader's contract (see D2). `actions.spec.ts`'s `getRoles` test moves from asserting the token reached `rolesApi.getRolesList` to asserting it reached the config-entities reader.

### D2 — Carry the reader's warnings out of the action, rather than collapsing them to `null`

The panel needs to know a catalog read failed; the reader says so through a mutable `warnings` array, not a return value. Three shapes were considered:

- **Return `[]` and drop the signal.** Rejected — it turns a Core outage into "no roles are configured", which is exactly the silent option loss the reader was built to prevent.
- **Return `null` when any warning was pushed.** Rejected — it discards the partial read's usable half, and conflates "unreadable" with "incomplete".
- **Return `{ roles, warnings }` (chosen).** `warnings: EntitiesI18nKey[]` is the reader's own vocabulary, already translated, and already how every other caller consumes it. The panel keeps `AnalyticsTablesI18nKey.RolesLoadFailed` as the notification title — it names *which* list failed, which a toast has no page context to supply — and uses the reader's key as the message body, so a total failure and a partial one read differently. The type is declared in `models/analytics/table.ts` beside the other table models rather than inline in the action, per the project's type-placement rule.

A partial read therefore also notifies. That is deliberate: an incomplete option list and an absent one have the same consequence for the user (a role they expect may not be offered) and the same remedy.

### D3 — Keep the closed select; do not adopt the grid-plus-modal role shape

The other role surfaces (`RouteRoles`, `KeyRoles`, `AssetRoles`) render grants in a `GridView` and add through the `AddEntitiesGrid` modal. That shape was considered and rejected here for one concrete reason: this panel *is* a `DialFormPopup`, and `AddEntitiesGrid` opens its own — a modal inside a modal, with two focus traps competing, on a surface whose entire content is two role lists. The grid shape earns its weight on a full tab with descriptions, a Source column and per-row navigation; here it would cost more than the select it replaces and read as a heavier answer to a smaller question.

What that shape gets right is not the grid — it is that what the user sees is derived from the grants, not from the catalog (both files carry a comment saying so). D4 takes that property into the select.

Typed entry was also considered, since the analytics service matches provider role names the identity provider issues and this application cannot enumerate them. Rejected: on a permissions surface a free-text field turns a typo into a grant that looks made and does nothing, and the roles in use are expected to exist in Core. Selection stays closed.

### D4 — Options are the catalog unioned with the grants loaded at open

The preservation requirement is met by what the options are, not by a guard: the option list is `catalog ∪ grantedOnLoad`, so a role the catalog does not offer still has an option, renders as selected, and round-trips. `grantedOnLoad` is captured once from the access response rather than derived from the live `write`/`modify` state, so unchecking such a role leaves its option in place and it can be re-checked within the session — deriving from live state would make an accidental uncheck unrecoverable without reopening the panel.

### D5 — Alphabetical ordering lives in the panel, not in the reader

`unionConfigEntityOptions` orders API-written options first, and its de-duplication depends on that order. Sorting there would touch five other pickers and entangle a presentational concern with the merge semantics. The panel sorts its own options, case-insensitively via `localeCompare`, after the union — the only place where ordering is a presentation decision.

### D6 — Keep the existing `DialSelectField` test double

The spec already mocks `DialSelectField` as a checkbox list, because the real control is a heavy floating dropdown. The rendered control does not change in this update, so the mock still describes it and is kept; the new cases (ordering, out-of-catalog grant) are expressed through it. The union and de-duplication of Core's two populations are **not** re-asserted here — they belong to `utils/config-entities/tests/options.spec.ts`, which already covers them at the reader level, and asserting them through a mocked action would only test the mock.

## Risks / Trade-offs

- **A provider role that exists only in the identity provider cannot be granted from this panel.** → Accepted per D3; the roles in use are expected to be configured in Core, and a free-text field would trade this for silently ineffective grants. If it turns out to be needed, it is an additive change to the same panel.
- **Two Core requests per panel open, where there was one admin-backend request.** → Both are small listings issued concurrently, and the panel is a rarely-opened admin surface. The metadata half paginates, but role populations are small.
- **`grantedOnLoad` keeps an option alive for the session after it is unchecked.** → Intentional (D4); the alternative loses it on a misclick. It disappears on the next open, once it is no longer granted.
- **`AnalyticsTablesI18nKey.RolesLoadFailed` keeps its wording while its meaning narrows** (title, not whole message). → No other caller uses it; the message body now carries the detail.

## Migration Plan

None. No stored data, wire contract, or backend endpoint changes: the access lists hold the same bare role names before and after, so a table's existing grants are unaffected and the change is reversible by reverting the two files.
