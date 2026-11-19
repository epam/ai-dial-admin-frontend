import { AliasPresentAs, DialAliasResource } from '@/src/models/dial/alias';
import { getAliasDefaultPresentAs } from '@/src/utils/aliases/present-as';
import { parseAliasTargetPath } from '@/src/utils/aliases/target';

export const getAliasEffectivePresentAs = (alias: DialAliasResource): AliasPresentAs | undefined => {
  if (alias.presentAs) {
    return alias.presentAs;
  }

  const parsed = parseAliasTargetPath(alias.target?.path);
  return parsed ? getAliasDefaultPresentAs(parsed.type) : undefined;
};

export const canAliasHaveDefaultHeaders = (alias: DialAliasResource): boolean =>
  getAliasEffectivePresentAs(alias) !== AliasPresentAs.Toolset;

export const applyAliasTargetChange = (
  alias: DialAliasResource,
  change: Pick<DialAliasResource, 'target' | 'presentAs'>,
): DialAliasResource => {
  const next = { ...alias, target: change.target, presentAs: change.presentAs };

  return canAliasHaveDefaultHeaders(next) ? next : { ...next, defaultHeaders: undefined };
};
