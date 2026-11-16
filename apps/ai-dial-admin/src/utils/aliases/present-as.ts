import { ALIAS_DEFAULT_PRESENT_AS_BY_TARGET_TYPE, ALIAS_PRESENT_AS_BY_TARGET_TYPE } from '@/src/constants/aliases';
import { AliasPresentAs, AliasTargetType } from '@/src/models/dial/alias';

/** The `presentAs` values that fit a target of this type, in display order. */
export const getAliasPresentAsOptions = (type: AliasTargetType): readonly AliasPresentAs[] =>
  ALIAS_PRESENT_AS_BY_TARGET_TYPE[type];

/** What Core lists an alias as when `presentAs` is not written: the type its target is. */
export const getAliasDefaultPresentAs = (type: AliasTargetType): AliasPresentAs =>
  ALIAS_DEFAULT_PRESENT_AS_BY_TARGET_TYPE[type];

/**
 * The `presentAs` to write for the user's choice. The default is not written, so a plain alias stays a plain
 * body; a choice the target type does not allow falls back to the default rather than reaching Core as a 400.
 */
export const toStoredPresentAs = (
  type: AliasTargetType,
  chosen: AliasPresentAs | undefined,
): AliasPresentAs | undefined => {
  if (!chosen || !getAliasPresentAsOptions(type).includes(chosen)) {
    return undefined;
  }

  return chosen === getAliasDefaultPresentAs(type) ? undefined : chosen;
};
