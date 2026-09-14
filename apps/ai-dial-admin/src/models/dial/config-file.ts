import { BaseEntity } from '@/src/models/dial/base-entity';
import { ConfigEntityOrigin, ConfigFileFailureReason } from '@/src/types/config-file-entity';

/**
 * One entry of Core's config-file listing. `FileConfigController.handleList` builds each item as
 * `items.addObject().put("name", key)` — a name and nothing else. Not `ResourceItemMetadata`, and
 * not an entity projection, so there is no author, timestamp or description to read here.
 */
export interface ConfigFileListEntry {
  name: string;
}

export interface ConfigFileListResponse {
  items: ConfigFileListEntry[];
}

export interface ConfigFileReadFailure {
  reason: ConfigFileFailureReason;
  status?: number;
  errorHeader?: string;
  errorMessage?: string;
  requestId?: string;
}

export type ConfigFileReadResult<T> = { success: true; data: T } | { success: false; failure: ConfigFileReadFailure };

/**
 * An entity offered by a picker, normalised to what both of Core's populations provide: a name and
 * where it came from. Deliberately has no description — neither listing carries one (the metadata
 * route returns author and timestamps, the config-file route a name alone), so filling that column
 * would cost one entity read per row. `origin` decides the reference form written on selection.
 */
export interface ConfigEntityOption {
  name: string;
  origin: ConfigEntityOrigin;
}

/**
 * A picker row built from a `ConfigEntityOption`. `name` carries the *reference* Core resolves, while
 * `displayName` carries the bare name — see `toConfigEntityRows`. `origin` is present so the grid can
 * show which population the row came from; rows on admin-backend-backed surfaces have no `origin`,
 * which is what keeps the Source column off those grids.
 */
export interface ConfigEntityRow extends BaseEntity {
  origin: ConfigEntityOrigin;
}

/**
 * A union read that succeeded at least partially. `failures` is non-empty when one population could
 * not be read — the surviving options are still offered rather than silently shrinking the picker.
 */
export interface ConfigEntityOptions {
  options: ConfigEntityOption[];
  failures: ConfigFileReadFailure[];
}
