import { CoreResource } from '@/src/models/dial/resource';

/** The type an alias is listed and called as; the values are Core's `presentAs` spellings. */
export enum AliasPresentAs {
  Model = 'model',
  Application = 'application',
  Toolset = 'toolset',
  Router = 'router',
}

/** The type of deployment an alias forwards to — the first segment of `target.path`. */
export enum AliasTargetType {
  Model = 'models',
  Application = 'applications',
  Toolset = 'toolsets',
  Router = 'routers',
}

export interface AliasTarget {
  path: string;
}

/**
 * An alias resource (`aliases/{public|platform}/{name}`) as Core reads and writes it, camelCase only. Core keeps
 * exactly these fields for a stored alias and refuses any other on a write; `name`, `status` and
 * `validationWarnings` that a read adds are grafted into `_metadata` by the merge layer, not carried here.
 * Pricing, features and interfaces are the target's, so an alias has none.
 */
export interface DialAliasResource extends CoreResource {
  /** Client-only create-flow identity; a merged read's identity lives in `_metadata`. */
  name?: string;
  /** Client-only create-flow bucket (`public/` or `platform/`); a merged read's lives in `_metadata`. */
  folderId?: string;
  target?: AliasTarget;
  presentAs?: AliasPresentAs;
  userRoles?: string[];
  displayName?: string;
  displayVersion?: string;
  iconUrl?: string;
  description?: string;
  intro?: string;
  descriptionKeywords?: string[];
}
