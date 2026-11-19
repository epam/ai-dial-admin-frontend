import { AliasPresentAs, AliasTargetType } from '@/src/models/dial/alias';

/** The only characters Core accepts in a stored alias name, so the listed id is the id that is called. */
export const ALIAS_NAME_PATTERN = /^[A-Za-z0-9._-]+$/;

/** Which `presentAs` values fit each target type, in display order; the first is the type's own default. */
export const ALIAS_PRESENT_AS_BY_TARGET_TYPE: Readonly<Record<AliasTargetType, readonly AliasPresentAs[]>> = {
  [AliasTargetType.Model]: [AliasPresentAs.Model, AliasPresentAs.Application],
  [AliasTargetType.Application]: [AliasPresentAs.Application, AliasPresentAs.Model, AliasPresentAs.Toolset],
  [AliasTargetType.Toolset]: [AliasPresentAs.Toolset],
  [AliasTargetType.Router]: [AliasPresentAs.Router, AliasPresentAs.Model, AliasPresentAs.Application],
};

/** Target types Core refuses on a Public alias: a router is a config deployment a stored public alias cannot reach. */
export const ALIAS_PLATFORM_ONLY_TARGET_TYPES: readonly AliasTargetType[] = [AliasTargetType.Router];

/** What an alias is listed as when `presentAs` is not set: the type its target is. */
export const ALIAS_DEFAULT_PRESENT_AS_BY_TARGET_TYPE: Readonly<Record<AliasTargetType, AliasPresentAs>> = {
  [AliasTargetType.Model]: AliasPresentAs.Model,
  [AliasTargetType.Application]: AliasPresentAs.Application,
  [AliasTargetType.Toolset]: AliasPresentAs.Toolset,
  [AliasTargetType.Router]: AliasPresentAs.Router,
};

/** The fields Core keeps for a stored alias; a write carrying any other is answered 400. */
export const ALIAS_WRITABLE_FIELDS = [
  'target',
  'presentAs',
  'userRoles',
  'defaultHeaders',
  'displayName',
  'displayVersion',
  'iconUrl',
  'description',
  'intro',
  'descriptionKeywords',
] as const;
