import { PublicationStatus } from '@/src/models/dial/publications';
import { ResourceType } from '@/src/types/resource-type';

/** DIAL Core publication operation endpoints (`core.client.url` + path). */
export const CORE_PUBLICATION_LIST_URL = 'v1/ops/publication/list';
export const CORE_PUBLICATION_GET_URL = 'v1/ops/publication/get';
export const CORE_PUBLICATION_APPROVE_URL = 'v1/ops/publication/approve';
export const CORE_PUBLICATION_REJECT_URL = 'v1/ops/publication/reject';
export const CORE_PUBLICATION_DELETE_URL = 'v1/ops/publication/delete';
export const CORE_PUBLICATION_UPDATE_URL = 'v1/ops/publication/update';
export const CORE_PUBLICATION_CREATE_URL = 'v1/ops/publication/create';
export const CORE_PUBLICATION_RULES_URL = 'v1/ops/publication/rule/list';

/** DIAL Core file/bucket endpoints used by the publication file flow. */
export const CORE_BUCKET_URL = 'v1/bucket';
export const CORE_FILES_URL = 'v1/files';
export const CORE_FILES_METADATA_URL = 'v1/metadata/files';

/** Core resource URL prefixes (mirror the backend `*ClientMapper` prefixes). */
export const PUBLICATIONS_PREFIX = 'publications/';
export const APPLICATIONS_PREFIX = 'applications/';
export const CONVERSATIONS_PREFIX = 'conversations/';
export const PROMPTS_PREFIX = 'prompts/';
export const TOOLSETS_PREFIX = 'toolsets/';
export const FILES_PREFIX = 'files/';

export const RESOURCE_TYPE_PREFIX: Record<ResourceType, string> = {
  [ResourceType.APPLICATION]: APPLICATIONS_PREFIX,
  [ResourceType.CONVERSATION]: CONVERSATIONS_PREFIX,
  [ResourceType.PROMPT]: PROMPTS_PREFIX,
  [ResourceType.TOOLSET]: TOOLSETS_PREFIX,
  [ResourceType.FILE]: FILES_PREFIX,
};

/** Hardcoded list path — the backend always lists `publications/public/`. */
export const PUBLIC_PUBLICATIONS_PATH = 'publications/public/';

/** Transient bucket folder where publication file updates are staged. */
export const PUBLICATIONS_UPDATES_FOLDER = 'publications_updates/';

/** Statuses for which `getPublication` reports the publication as not found. */
export const PUBLICATION_NOT_FOUND_STATUSES: ReadonlySet<PublicationStatus> = new Set([
  PublicationStatus.APPROVED,
  PublicationStatus.REJECTED,
]);
