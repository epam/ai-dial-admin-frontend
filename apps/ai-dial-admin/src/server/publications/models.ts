import type { components } from '@epam/ai-dial-typescript-sdk';

import { PublicationStatus } from '@/src/models/dial/publications';

/** Resource action as returned by DIAL Core (uppercase, distinct from the FE `ActionType`). */
export enum CoreResourceAction {
  ADD = 'ADD',
  ADD_IF_ABSENT = 'ADD_IF_ABSENT',
  DELETE = 'DELETE',
}

/** Core resource type values inside a publication. */
export enum CoreResourceType {
  APPLICATION = 'APPLICATION',
  CONVERSATION = 'CONVERSATION',
  PROMPT = 'PROMPT',
  TOOL_SET = 'TOOL_SET',
  FILE = 'FILE',
  SKILL = 'SKILL',
  PROJECT = 'PROJECT',
}

export type SdkPublication = components['schemas']['Publication'];

/** A resource entry of a publication, as the SDK types it (`action` and the urls are optional there). */
export type CorePublicationResource = components['schemas']['PublicationResource'];

export type CorePublicationRule = components['schemas']['Rule'];

/** Response of `POST /v1/ops/publication/rule/list`. */
export type CorePublicationRules = components['schemas']['Rules'];

/**
 * A publication carrying the two fields the admin cannot work without. Core always sends them; the SDK types them
 * optional, so `toListedPublication` is the one place that decides what a publication without them means.
 */
export type ListedPublication = Omit<SdkPublication, 'url' | 'status'> & { url: string; status: PublicationStatus };
