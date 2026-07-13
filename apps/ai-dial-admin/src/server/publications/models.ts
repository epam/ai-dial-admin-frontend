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
}

/** A single resource entry within a DIAL Core publication (`PublicationResourceDto`). */
export interface CorePublicationResource {
  action: CoreResourceAction;
  sourceUrl?: string;
  targetUrl?: string;
  reviewUrl?: string;
}

/** A DIAL Core publication (`/v1/ops/publication/get` and list-item shape). */
export interface CorePublication {
  url: string;
  name?: string;
  targetFolder?: string;
  status: PublicationStatus;
  createdAt?: number;
  resources?: CorePublicationResource[];
  resourceTypes?: CoreResourceType[];
  author?: string;
  displayAuthor?: string;
  rules?: CorePublicationRule[];
}

export interface CorePublicationRule {
  function: string;
  source: string;
  targets: string[];
}

export interface CorePublicationInfos {
  publications?: CorePublication[];
}

/** Body sent to `POST /v1/ops/publication/update`. */
export interface CorePublicationUpdateDto {
  url: string;
  name?: string;
  targetFolder: string;
  resources: CorePublicationResource[];
  resourceTypes: CoreResourceType[];
  rules: CorePublicationRule[];
  displayAuthor?: string;
}

/** Body sent to `POST /v1/ops/publication/create` (`CreatePublicationDto`). */
export interface CorePublicationCreateDto {
  targetFolder: string;
  resources: CorePublicationResource[];
  rules?: CorePublicationRule[];
}

/** Response shape of `POST /v1/ops/publication/rule/list` (`RulesDto`). */
export interface CorePublicationRulesResponse {
  rules?: Record<string, CorePublicationRule[]>;
}
