/** An entity DIAL Core reports as skipped by `/v1/admin/health/config`, with why. */
export interface ConfigHealthSkippedEntity {
  id: string;
  reason: string;
}

export interface ConfigHealthResponse {
  status: string;
  skipped: ConfigHealthSkippedEntity[];
}

/** The reasons Core gives for an alias it keeps but cannot serve; any other reason is free text. */
export enum AliasHealthReason {
  TargetMissing = 'alias_target_missing',
  TargetIncompatible = 'alias_target_incompatible',
}
