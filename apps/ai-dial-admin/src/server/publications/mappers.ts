import { ActionType, Publication } from '@/src/models/dial/publications';
import { DialRule, RuleFunction } from '@/src/models/dial/rule';
import { ResourceType } from '@/src/types/resource-type';
import {
  CorePublication,
  CorePublicationResource,
  CorePublicationRule,
  CoreResourceAction,
  CoreResourceType,
} from './models';
import { PUBLICATIONS_PREFIX } from '@/src/constants/publications-core';
import { decodeCorePath, stripPrefix } from './path';

const CORE_ACTION_TO_ACTION_TYPE: Record<CoreResourceAction, ActionType> = {
  [CoreResourceAction.ADD]: ActionType.ADD,
  [CoreResourceAction.ADD_IF_ABSENT]: ActionType.ADD_IF_ABSENT,
  [CoreResourceAction.DELETE]: ActionType.DELETE,
};

export const coreActionToActionType = (action: CoreResourceAction): ActionType => {
  return CORE_ACTION_TO_ACTION_TYPE[action];
};

const ACTION_TYPE_TO_CORE_ACTION: Record<ActionType, CoreResourceAction> = {
  [ActionType.ADD]: CoreResourceAction.ADD,
  [ActionType.ADD_IF_ABSENT]: CoreResourceAction.ADD_IF_ABSENT,
  [ActionType.DELETE]: CoreResourceAction.DELETE,
};

export const actionTypeToCore = (action: ActionType): CoreResourceAction => {
  return ACTION_TYPE_TO_CORE_ACTION[action];
};

export const mapRulesToCore = (rules?: DialRule[]): CorePublicationRule[] => {
  return (rules ?? []).map((rule) => ({
    source: rule.source,
    function: rule.function,
    targets: rule.targets,
  }));
};

const CORE_RESOURCE_TYPE_TO_RESOURCE_TYPE: Record<CoreResourceType, ResourceType> = {
  [CoreResourceType.APPLICATION]: ResourceType.APPLICATION,
  [CoreResourceType.CONVERSATION]: ResourceType.CONVERSATION,
  [CoreResourceType.PROMPT]: ResourceType.PROMPT,
  [CoreResourceType.TOOL_SET]: ResourceType.TOOLSET,
  [CoreResourceType.FILE]: ResourceType.FILE,
};

/** Priority order used to resolve a publication's primary type (mirrors `PublicationResourceTypeResolver`). */
const RESOLUTION_ORDER: CoreResourceType[] = [
  CoreResourceType.APPLICATION,
  CoreResourceType.CONVERSATION,
  CoreResourceType.PROMPT,
  CoreResourceType.TOOL_SET,
  CoreResourceType.FILE,
];

const RESOURCE_TYPE_TO_CORE_RESOURCE_TYPE: Record<ResourceType, CoreResourceType> = {
  [ResourceType.APPLICATION]: CoreResourceType.APPLICATION,
  [ResourceType.CONVERSATION]: CoreResourceType.CONVERSATION,
  [ResourceType.PROMPT]: CoreResourceType.PROMPT,
  [ResourceType.TOOLSET]: CoreResourceType.TOOL_SET,
  [ResourceType.FILE]: CoreResourceType.FILE,
};

export const resourceTypeToCore = (type: ResourceType): CoreResourceType => {
  return RESOURCE_TYPE_TO_CORE_RESOURCE_TYPE[type];
};

export const resolvePublicationResourceType = (types?: CoreResourceType[]): ResourceType | undefined => {
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
  const actions = (resources ?? []).filter(Boolean).map((resource) => resource.action);
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
  return rules.map((rule) => ({
    source: rule.source,
    function: rule.function as RuleFunction,
    targets: rule.targets,
  }));
};

/** Maps the publication-level fields shared by list items and the detail view. */
export const mapPublicationBase = (core: CorePublication): Publication => {
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
