import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import {
  PUBLIC_PUBLICATIONS_PATH,
  PUBLICATION_NOT_FOUND_STATUSES,
  PUBLICATIONS_PREFIX,
} from '@/src/constants/publications-core';
import { Token } from '@/src/models/auth';
import { Publication, PublicationFile } from '@/src/models/dial/publications';
import { ServerActionResponse } from '@/src/models/server-action';
import { BaseApiConfig } from '@/src/server/base-api';
import { CoreApi } from '@/src/server/core/core-api';
import {
  mapPublicationBase,
  resolvePublicationResourceType,
  toListedPublication,
} from '@/src/server/publications/mappers';
import {
  CorePublicationResource,
  CorePublicationRule,
  CorePublicationRules,
  SdkPublication,
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

  /**
   * Every publication of every resource type, each tagged with its resolved `resourceType`. `undefined` on a 403,
   * `null` on any other failure (`sdkGet` hides the 403 behind `R | null`, so it is typed here).
   */
  async getPublicationList(token: Token): Promise<Publication[] | null | undefined> {
    // The SDK declares this response as a bare `Publication[]`, but Core answers `{ publications: [...] }`.
    // Remove this cast once the SDK types `ListPublication` that way; `core-publications-api.spec.ts` then fails.
    const res = await this.sdkGet<{ publications?: SdkPublication[] }>(token, (init) =>
      this.sdk.getPublications({ ...init, body: { url: PUBLIC_PUBLICATIONS_PATH } }),
    );
    if (!res) {
      return res;
    }
    return (res.publications ?? []).flatMap((publication) => {
      const listed = toListedPublication(publication);
      const resourceType = resolvePublicationResourceType(publication.resourceTypes);
      return listed && resourceType ? [{ ...mapPublicationBase(listed), resourceType }] : [];
    });
  }

  /** `undefined` on a 403, `null` on any other failure, or when the publication is no longer pending. */
  async getPublication(token: Token, path: string): Promise<Publication | null | undefined> {
    const res = await this.sdkGet<SdkPublication>(token, (init) =>
      this.sdk.getPublication({ ...init, body: { url: PUBLICATIONS_PREFIX + path } }),
    );
    if (!res) {
      return res;
    }
    const listed = toListedPublication(res);
    if (!listed || PUBLICATION_NOT_FOUND_STATUSES.has(listed.status)) {
      return null;
    }
    return resolvePublication(listed, token, this.clients);
  }

  /**
   * Creates a publication (`POST /v1/ops/publication/create`). Used **only** by folder
   * rules-update and folder-delete (unpublish) — there is no publication-authoring UI that
   * calls this; publications are reviewed/approved in this FE, never created directly
   * (design D1 of `migrate-folders-to-core`, closing the gap `migrate-publications-to-core-api`
   * deliberately left open).
   *
   * `targetFolder` is sent as given: the caller encodes it (`folders-core.ts`), unlike {@link ruleList}.
   */
  createPublication(
    token: Token,
    targetFolder: string,
    resources: CorePublicationResource[],
    rules?: CorePublicationRule[],
  ): Promise<ServerActionResponse> {
    return this.sdkAction(token, (init) =>
      this.sdk.createPublication({ ...init, body: { targetFolder, resources, rules } }),
    );
  }

  /**
   * Reads a folder's rules (`POST /v1/ops/publication/rule/list`) — the Core op behind folder
   * rules. The backend's `PublicationService.getRules` encodes the path
   * (`encodeFolderPath(path)`) before calling this same Core op — mirrored here so a folder
   * name containing spaces/special characters resolves the same rules the old
   * `foldersApi.getRules` did.
   */
  ruleList(token: Token, path: string): Promise<ServerActionResponse<CorePublicationRules>> {
    return this.sdkAction<CorePublicationRules>(token, (init) =>
      this.sdk.getPublicationRules({ ...init, body: { url: encodeFolderPath(path) } }),
    );
  }

  approvePublication(token: Token, path: string): Promise<ServerActionResponse> {
    return this.sdkAction(token, (init) =>
      this.sdk.approvePublication({ ...init, body: { url: PUBLICATIONS_PREFIX + path } }),
    );
  }

  declinePublication(token: Token, path: string, comment?: string): Promise<ServerActionResponse> {
    return this.sdkAction(token, (init) =>
      this.sdk.rejectPublication({
        ...init,
        body: { url: PUBLICATIONS_PREFIX + path, comment: sanitizeComment(comment) },
      }),
    );
  }

  deletePublication(token: Token, path: string): Promise<ServerActionResponse> {
    return this.sdkAction(token, (init) =>
      this.sdk.deletePublication({ ...init, body: { url: PUBLICATIONS_PREFIX + path } }),
    );
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

    const updateRes = await this.sdkAction(token, (init) => this.sdk.updatePublication({ ...init, body: dto }));
    if (!updateRes.success) {
      return updateRes;
    }

    for (const { asset, type } of resourcePuts) {
      if (type === ResourceType.CONVERSATION) {
        continue;
      }

      const putRes = await this.clients.updateAsset(token, asset, type, DEFAULT_ETAG);
      if (!putRes.success) {
        return putRes;
      }
    }

    return updateRes;
  }
}
