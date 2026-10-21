/**
 * Raw shape of DIAL Core's `GET /v1/user/info` response. Core reports the caller's own
 * unmapped DIAL roles — `userId`/`userClaims` are populated for a JWT-authenticated caller,
 * `project` for an API-key caller instead (the two are mutually exclusive).
 */
export interface CoreUserInfoResponse {
  roles: string[];
  project?: string;
  userId?: string;
  userClaims?: Record<string, string[]>;
  userDisplayName?: string;
}
