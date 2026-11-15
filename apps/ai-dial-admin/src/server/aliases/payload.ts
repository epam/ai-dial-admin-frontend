import { ALIAS_WRITABLE_FIELDS } from '@/src/constants/aliases';
import { DialAliasResource } from '@/src/models/dial/alias';

/**
 * The body Core accepts for a stored alias. Built by allow-list rather than by stripping: Core answers 400 to
 * any field it does not keep, and a merged read carries more than that (`_metadata`, `name`, timestamps).
 */
export const toAliasPayload = (alias: DialAliasResource): Partial<DialAliasResource> =>
  Object.fromEntries(
    ALIAS_WRITABLE_FIELDS.filter((field) => alias[field] !== undefined && alias[field] !== null).map((field) => [
      field,
      alias[field],
    ]),
  );

/** The alias's own name: flat on a create-flow entity, `_metadata`-nested on a fetched one. */
export const getAliasName = (alias: DialAliasResource): string => alias.name ?? alias._metadata?.name ?? '';
