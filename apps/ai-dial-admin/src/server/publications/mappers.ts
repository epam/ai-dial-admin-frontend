import { ActionType, Publication, PublicationStatus } from '@/src/models/dial/publications';
import { DialRule, RuleFunction } from '@/src/models/dial/rule';
import { ResourceType } from '@/src/types/resource-type';
import {
  CorePublicationResource,
  CorePublicationRule,
  CoreResourceAction,
  CoreResourceType,
  ListedPublication,
  SdkPublication,
} from './models';
import { PUBLICATIONS_PREFIX } from '@/src/constants/publications-core';
import { decodeCorePath, stripPrefix } from './path';
import { PublishableResourceType } from './resolver/types';

type CoreAction = NonNullable<CorePublicationResource['action']>;

const CORE_ACTION_TO_ACTION_TYPE: Record<CoreAction, ActionType> = {
  [CoreResourceAction.ADD]: ActionType.ADD,
  [CoreResourceAction.ADD_IF_ABSENT]: ActionType.ADD_IF_ABSENT,
  [CoreResourceAction.DELETE]: ActionType.DELETE,
};

/** The SDK types a resource's `action` optional; Core always sends it, and an absent one maps to `undefined`. */
export const coreActionToActionType = (action: CoreAction | undefined): ActionType | undefined => {
  return action == null ? undefined : CORE_ACTION_TO_ACTION_TYPE[action];
};

const ACTION_TYPE_TO_CORE_ACTION: Record<ActionType, CoreResourceAction> = {
  [ActionType.ADD]: CoreResourceAction.ADD,
  [ActionType.ADD_IF_ABSENT]: CoreResourceAction.ADD_IF_ABSENT,
  [ActionType.DELETE]: CoreResourceAction.DELETE,
};

export const actionTypeToCore = (action: ActionType | undefined): CoreResourceAction | undefined => {
  return action == null ? undefined : ACTION_TYPE_TO_CORE_ACTION[action];
};

export const mapRulesToCore = (rules?: DialRule[]): CorePublicationRule[] => {
  return (rules ?? []).map((rule) => ({
    source: rule.source,
    function: rule.function,
    targets: rule.targets,
  }));
};

const CORE_RESOURCE_TYPE_TO_RESOURCE_TYPE: Record<CoreResourceType, PublishableResourceType> = {
  [CoreResourceType.APPLICATION]: ResourceType.APPLICATION,
  [CoreResourceType.CONVERSATION]: ResourceType.CONVERSATION,
  [CoreResourceType.PROMPT]: ResourceType.PROMPT,
  [CoreResourceType.TOOL_SET]: ResourceType.TOOLSET,
  [CoreResourceType.FILE]: ResourceType.FILE,
  [CoreResourceType.SKILL]: ResourceType.SKILL,
  [CoreResourceType.PROJECT]: ResourceType.PROJECT,
};

/** Priority order used to resolve a publication's primary type (mirrors `PublicationResourceTypeResolver`). */
const RESOLUTION_ORDER: CoreResourceType[] = [
  CoreResourceType.APPLICATION,
  CoreResourceType.CONVERSATION,
  CoreResourceType.PROMPT,
  CoreResourceType.TOOL_SET,
  CoreResourceType.FILE,
  CoreResourceType.SKILL,
  CoreResourceType.PROJECT,
];

const RESOURCE_TYPE_TO_CORE_RESOURCE_TYPE: Record<PublishableResourceType, CoreResourceType> = {
  [ResourceType.APPLICATION]: CoreResourceType.APPLICATION,
  [ResourceType.CONVERSATION]: CoreResourceType.CONVERSATION,
  [ResourceType.PROMPT]: CoreResourceType.PROMPT,
  [ResourceType.TOOLSET]: CoreResourceType.TOOL_SET,
  [ResourceType.FILE]: CoreResourceType.FILE,
  [ResourceType.SKILL]: CoreResourceType.SKILL,
  [ResourceType.PROJECT]: CoreResourceType.PROJECT,
};

export const resourceTypeToCore = (type: PublishableResourceType): CoreResourceType => {
  return RESOURCE_TYPE_TO_CORE_RESOURCE_TYPE[type];
};

export const resolvePublicationResourceType = (
  types?: SdkPublication['resourceTypes'],
): PublishableResourceType | undefined => {
  if (!types?.length) {
    return undefined;
  }
  const found = RESOLUTION_ORDER.find((type) => types.includes(type));
  return found ? CORE_RESOURCE_TYPE_TO_RESOURCE_TYPE[found] : undefined;
};

/** Derives the single publication-level action (mirrors `PublicationMapper.getAction`). */
export const derivePublicationAction = (
  resources: CorePublicationResource[] | undefined,
  resourceType: ResourceType,
): ActionType | undefined => {
  const actions = (resources ?? [])
    .filter(Boolean)
    .map((resource) => resource.action)
    .filter((action): action is CoreAction => action != null);
  if (!actions.length) {
    return undefined;
  }

  const allAdd = actions.every(
    (action) => action === CoreResourceAction.ADD || action === CoreResourceAction.ADD_IF_ABSENT,
  );
  if (resourceType === ResourceType.FILE && allAdd) {
    return ActionType.ADD;
  }

  const distinct = [...new Set(actions)];
  if (distinct.length > 1) {
    throw new Error('Different actions found inside publication request');
  }
  return coreActionToActionType(distinct[0]);
};

export const mapRules = (rules?: CorePublicationRule[]): DialRule[] | undefined => {
  if (!rules) {
    return undefined;
  }
  // The SDK types every rule field optional and `function` wider than the admin enum. Core's values pass through
  // unchanged: an unknown `function` stays, a missing `source` / `targets` stays absent, so none is defaulted.
  return rules.map((rule) => ({
    source: rule.source as string,
    function: rule.function as RuleFunction,
    targets: rule.targets as string[],
  }));
};

/** `undefined` for a publication Core sent without a `url` or a `status`: it cannot be shown or resolved. */
export const toListedPublication = (core: SdkPublication): ListedPublication | undefined => {
  if (!core.url || !core.status) {
    return undefined;
  }
  return { ...core, url: core.url, status: core.status as PublicationStatus };
};

/** Maps the publication-level fields shared by list items and the detail view. */
export const mapPublicationBase = (core: ListedPublication): Publication => {
  return {
    path: stripPrefix(core.url, PUBLICATIONS_PREFIX),
    requestName: core.name ?? '',
    folderId: core.targetFolder ? decodeCorePath(core.targetFolder) : '',
    author: core.author ?? '',
    displayAuthor: core.displayAuthor,
    createdAt: (core.createdAt ?? '') as unknown as string,
    status: core.status,
    rules: mapRules(core.rules),
  } as Publication;
};
