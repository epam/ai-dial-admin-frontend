import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import {
  CORE_PUBLICATION_APPROVE_URL,
  CORE_PUBLICATION_CREATE_URL,
  CORE_PUBLICATION_DELETE_URL,
  CORE_PUBLICATION_GET_URL,
  CORE_PUBLICATION_LIST_URL,
  CORE_PUBLICATION_REJECT_URL,
  CORE_PUBLICATION_RULES_URL,
  CORE_PUBLICATION_UPDATE_URL,
  PUBLIC_PUBLICATIONS_PATH,
  PUBLICATION_NOT_FOUND_STATUSES,
  PUBLICATIONS_PREFIX,
} from '@/src/constants/publications-core';
import { Token } from '@/src/models/auth';
import { Publication, PublicationFile } from '@/src/models/dial/publications';
import { ServerActionResponse } from '@/src/models/server-action';
import { BaseApiConfig } from '@/src/server/base-api';
import { CoreApi } from '@/src/server/core/core-api';
import { mapPublicationBase, resolvePublicationResourceType } from '@/src/server/publications/mappers';
import {
  CorePublication,
  CorePublicationInfos,
  CorePublicationResource,
  CorePublicationRule,
  CorePublicationRulesResponse,
} from '@/src/server/publications/models';
import { encodeFolderPath } from '@/src/server/publications/path';
import { uploadStagedFiles } from '@/src/server/publications/resolver/file-resource';
import { resolvePublication } from '@/src/server/publications/resolver/resolve';
import { EnrichmentClients } from '@/src/server/publications/resolver/types';
import { sanitizeComment } from '@/src/server/publications/sanitize-comment';
import { buildUpdatePlan } from '@/src/server/publications/update';
import { ResourceType } from '@/src/types/resource-type';

type UpdatablePublication = Publication & { files?: PublicationFile[] };

/**
 * Publication client that talks to DIAL Core directly (`/v1/ops/publication/*`),
 * reproducing the admin backend's transformations.
 * Per-resource enrichment/PUT is delegated to {@link EnrichmentClients}.
 */
export class CorePublicationsApi extends CoreApi {
  private readonly clients: EnrichmentClients;

  constructor(config: BaseApiConfig, clients: EnrichmentClients) {
    super(config);
    this.clients = clients;
  }

  getPublicationApplicationList(token: Token): Promise<Publication[] | undefined> {
    return this.listByType(ResourceType.APPLICATION, token);
  }

  getPublicationToolsetList(token: Token): Promise<Publication[] | undefined> {
    return this.listByType(ResourceType.TOOLSET, token);
  }

  getPublicationPromptList(token: Token): Promise<Publication[] | undefined> {
    return this.listByType(ResourceType.PROMPT, token);
  }

  getPublicationFileList(token: Token): Promise<Publication[] | undefined> {
    return this.listByType(ResourceType.FILE, token);
  }

  getPublicationConversationList(token: Token): Promise<Publication[] | undefined> {
    return this.listByType(ResourceType.CONVERSATION, token);
  }

  private async listByType(type: ResourceType, token: Token): Promise<Publication[] | undefined> {
    const res = await this.post<{ url: string }, CorePublicationInfos>(
      CORE_PUBLICATION_LIST_URL,
      { url: PUBLIC_PUBLICATIONS_PATH },
      token,
    );
    if (!res) {
      return undefined;
    }
    return (res.publications ?? [])
      .filter((publication) => resolvePublicationResourceType(publication.resourceTypes) === type)
      .map((publication) => mapPublicationBase(publication));
  }

  async getPublication(token: Token, path: string): Promise<Publication | null> {
    const res = await this.post<{ url: string }, CorePublication>(
      CORE_PUBLICATION_GET_URL,
      { url: PUBLICATIONS_PREFIX + path },
      token,
    );
    if (!res || PUBLICATION_NOT_FOUND_STATUSES.has(res.status)) {
      return null;
    }
    return resolvePublication(res, token, this.clients);
  }

  /**
   * Creates a publication (`POST /v1/ops/publication/create`). Used **only** by folder
   * rules-update and folder-delete (unpublish) — there is no publication-authoring UI that
   * calls this; publications are reviewed/approved in this FE, never created directly
   * (design D1 of `migrate-folders-to-core`, closing the gap `migrate-publications-to-core-api`
   * deliberately left open).
   */
  createPublication(
    token: Token,
    targetFolder: string,
    resources: CorePublicationResource[],
    rules?: CorePublicationRule[],
  ): Promise<ServerActionResponse> {
    return this.postAction(CORE_PUBLICATION_CREATE_URL, { targetFolder, resources, rules }, token);
  }

  /**
   * Reads a folder's rules (`POST /v1/ops/publication/rule/list`) — the Core op behind folder
   * rules. The backend's `PublicationService.getRules` encodes the path
   * (`encodeFolderPath(path)`) before calling this same Core op — mirrored here so a folder
   * name containing spaces/special characters resolves the same rules the old
   * `foldersApi.getRules` did.
   */
  ruleList(token: Token, path: string): Promise<ServerActionResponse<CorePublicationRulesResponse>> {
    return this.postAction(CORE_PUBLICATION_RULES_URL, { url: encodeFolderPath(path) }, token);
  }

  approvePublication(token: Token, path: string): Promise<ServerActionResponse> {
    return this.postAction(CORE_PUBLICATION_APPROVE_URL, { url: PUBLICATIONS_PREFIX + path }, token);
  }

  declinePublication(token: Token, path: string, comment?: string): Promise<ServerActionResponse> {
    return this.postAction(
      CORE_PUBLICATION_REJECT_URL,
      { url: PUBLICATIONS_PREFIX + path, comment: sanitizeComment(comment) },
      token,
    );
  }

  deletePublication(token: Token, path: string): Promise<ServerActionResponse> {
    return this.postAction(CORE_PUBLICATION_DELETE_URL, { url: PUBLICATIONS_PREFIX + path }, token);
  }

  async updatePublication(token: Token, publication: FormData): Promise<ServerActionResponse> {
    const blob = publication.get('publication');
    if (!(blob instanceof Blob)) {
      return { success: false, status: 400, errorMessage: 'Missing publication payload' };
    }

    const parsed = JSON.parse(await blob.text()) as UpdatablePublication;
    const files = publication.getAll('files').filter((entry): entry is File => entry instanceof File);
    if (files.length > 0) {
      const staged = await uploadStagedFiles(files, parsed.folderId, token, this.clients);
      parsed.files = [...(parsed.files ?? []), ...staged];
    }

    const { dto, resourcePuts } = buildUpdatePlan(parsed);

    const updateRes = await this.postAction(CORE_PUBLICATION_UPDATE_URL, dto, token);
    if (!updateRes.success) {
      return updateRes;
    }

    for (const { asset, type } of resourcePuts) {
      const putRes = await this.clients.updateAsset(token, asset, type, DEFAULT_ETAG);
      if (!putRes.success) {
        return putRes;
      }
    }

    return updateRes;
  }
}
