export type DialRoleLimitsMap = Record<string, DialRoleLimits>;
export type DialRoleShareMap = Record<string, DialRoleShare>;

export interface DialRoleLimits {
  day?: string | null;
  minute?: string | null;
  week?: string | null;
  month?: string | null;
  enabled?: true;
}

export interface DialRoleShare {
  invitationTtl?: string | null;
  maxAcceptedUsers?: string | null;
}
