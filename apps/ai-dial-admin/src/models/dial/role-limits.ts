export type DialRoleLimitsMap = Record<string, DialRoleLimits>;
export type DialRoleShareMap = Record<string, DialRoleShare>;

export interface DialRoleLimits {
  day?: string | null;
  minute?: string | null;
  week?: string | null;
  month?: string | null;
  enabled?: boolean;
}

export interface DialRoleShare {
  invitationTtl?: string | null;
  maxAcceptedUsers?: string | null;
}

/**
 * A role resource's `share` entry as DIAL Core actually serves it — `ShareResourceLimit` carries
 * `@JsonNaming(SnakeCaseStrategy.class)`, unlike `Role`'s `limits`/`costLimit` (`Limit`/`CostLimit`,
 * neither annotated, so those stay camelCase). `DialRoleShare` above is the admin-backend's own
 * camelCase shape for `Entities > Roles` — a different population with its own serialization
 * convention, not Core's. Both `maxAcceptedUsers`/`max_accepted_users` (`int`, max
 * `Integer.MAX_VALUE = 2147483647`) and `invitationTtl`/`invitation_ttl` (documented on Core's own
 * `ShareResourceLimit` as measured in **hours**, not milliseconds) stay within
 * `Number.isSafeInteger` range, so — unlike `costLimit`/`limits` — neither field needs the
 * big-integer-preserving read/write path.
 */
export interface DialCoreRoleShare {
  max_accepted_users?: number | null;
  invitation_ttl?: number | null;
}

/**
 * A role resource's `costLimit`/one `limits` entry as this surface represents it — plain numbers,
 * unlike the admin-backend's string-typed `DialRoleLimits`. Core's `Limit`/`CostLimit` classes have
 * no `@JsonFormat(shape=STRING)`, so every token is a genuine JSON number on the wire; a token whose
 * value overflows `Number.isSafeInteger` (the `Long.MAX_VALUE` "unlimited" default included) is
 * dropped by `normalizeRoleLimits` rather than kept as a lossily-rounded number — see
 * `utils/roles/limits.ts`'s doc comment. No `enabled` field: that flag is an admin-backend/UI-only
 * concept for `Entities > Roles`' Entities tab with no representation on Core's wire format at all.
 */
export interface DialCoreRoleLimits {
  minute?: number;
  day?: number;
  week?: number;
  month?: number;
}
