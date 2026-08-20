import { CORE_SKILLS_METADATA_URL, CORE_SKILLS_URL, RESOURCE_TYPE_PREFIX } from '@/src/constants/publications-core';
import { Token } from '@/src/models/auth';
import { DialSkillFile, DialSkillResource } from '@/src/models/dial/resource';
import { ServerActionResponse } from '@/src/models/server-action';
import { ResourceType } from '@/src/types/resource-type';
import { decodeCorePath, encodeCorePath, stripPrefix } from '@/src/server/publications/path';
import { sendRequest } from '@/src/utils/api/send-request';
import { getError, getErrorMessage } from '@/src/utils/api/error';
import { getApiHeaders } from '@/src/utils/auth/api-headers';
import { removeTrailingSlash } from '@/src/utils/files/path';
import { createHeadersForCreate, createIfMatchHeaders } from './asset-headers';
import { CoreResourceMetadataNode } from './asset-metadata';
import { CoreApi } from './core-api';

/** Core's mandatory manifest filename — a skill has no meaning without it (see `SkillDetails.tsx`). */
const SKILL_MANIFEST_FILE = 'SKILL.md';

/** Builds a new skill's `SKILL.md` manifest content from its name and description. */
const buildSkillManifest = (name: string, description: string): string =>
  `---\nname: ${name}\ndescription: ${description}\n---\n`;

interface CoreSkillMetadataItem {
  name: string;
  url?: string;
  nodeType?: string;
  author?: string;
  createdAt?: number;
  updatedAt?: number;
  etag?: string;
}

interface CoreSkillFilesMetadata {
  items?: CoreSkillMetadataItem[];
}

export class SkillsCoreApi extends CoreApi {
  /**
   * Reads a skill's path/folderId, etag, author/created/updated, and files. Confirmed against
   * Core's actual implementation (not just the `skills.md` design doc): `GET
   * /v2/metadata/skills/{bucket}/{path}` always calls Core's `listChildren`, whose `nodeMetadata()`
   * mapper only ever sets `nodeType`/`createdAt`/`updatedAt`/`author`/`etag` — no `name`/
   * `description`/`version` are exposed through *any* metadata endpoint; those live only in
   * `SKILL.md`'s YAML frontmatter, deliberately not parsed here yet (planned alongside in-browser
   * `SKILL.md` editing). So `author`/`createdAt`/`updatedAt`/`etag` all come from a single read of
   * the skill's *parent* folder listing, matching this skill's own row — there is no "get one
   * resource's own listing metadata" call, and no separate manifest fetch is needed since the
   * listing row already carries the same aggregate etag a `SKILL.md` content read would. The only
   * fetch beyond that single listing read is {@link getSkillFiles}, since a skill's own path
   * resolves to an item node Core never populates with file contents.
   */
  async getSkillMetadata(token: Token, path: string): Promise<DialSkillResource | null> {
    const [files, listingEntry] = await Promise.all([
      this.getSkillFiles(token, path),
      this.findSkillListingEntry(token, path),
    ]);

    if (!listingEntry) {
      return null;
    }

    const separatorIndex = path.lastIndexOf('/');
    const folderId = separatorIndex === -1 ? '' : path.slice(0, separatorIndex + 1);
    const name = separatorIndex === -1 ? path : path.slice(separatorIndex + 1);

    return {
      name,
      path,
      folderId,
      etag: listingEntry.etag,
      author: listingEntry.author,
      createdAt: listingEntry.createdAt,
      updatedAt: listingEntry.updatedAt,
      files,
    };
  }

  /**
   * Finds a skill's own row in a single read of its parent folder's listing — the only place Core
   * reports a skill's `author`/`createdAt`/`updatedAt`/`etag` (see {@link getSkillMetadata}'s doc
   * comment). Deliberately reads only the first page rather than paginating through the whole
   * folder: a per-skill read shouldn't cost an unbounded number of Core requests, and a skill
   * missing from the first page is treated the same as a skill that doesn't exist.
   */
  private async findSkillListingEntry(token: Token, path: string): Promise<CoreSkillMetadataItem | undefined> {
    const separatorIndex = path.lastIndexOf('/');
    const parentPath = separatorIndex === -1 ? '' : path.slice(0, separatorIndex + 1);
    const expectedUrl = `${RESOURCE_TYPE_PREFIX[ResourceType.SKILL]}${path}/`;

    const node = await this.listSkillMetadata(token, parentPath);

    return (node?.items as CoreSkillMetadataItem[] | undefined)?.find(
      (item) => item.url != null && decodeCorePath(item.url) === expectedUrl,
    );
  }

  /**
   * Lists the files contained in a skill's bundle (`GET /v2/metadata/skills/{bucket}/{path}/files`,
   * recursive) — a dedicated sub-route, distinct from {@link getSkillMetadata}'s own item metadata:
   * a skill's own path resolves to an `ITEM` node with no `items`, so its files can only be read
   * through this `/files` listing. Each row's `name` is the file's path relative to the skill root
   * (e.g. `scripts/run.sh`), derived from the listing's `url` so nested files stay distinguishable;
   * grouping-folder entries within the bundle are excluded, only `ITEM` rows are returned. Core
   * doesn't report a file's size on this listing, so `DialSkillFile` carries none.
   */
  async getSkillFiles(token: Token, path: string): Promise<DialSkillFile[]> {
    const params = new URLSearchParams({ recursive: 'true' });
    const url = `${CORE_SKILLS_METADATA_URL}/${encodeCorePath(path)}/files?${params.toString()}`;
    const res = await this.get<CoreSkillFilesMetadata>(url, token);
    // The listing's own `url` is rooted under the skill's internal `files/` sub-namespace
    // (`skills/{bucket}/{path}/files/...`), not the skill's bare path — the prefix to strip must
    // include that segment, or every name comes back with a stray leading `files/`. `item.url` comes
    // back encoded (segment-by-segment, like every other Core listing `url`), so the prefix must be
    // built from the encoded path too — comparing it against the raw, undecoded `path` silently
    // failed to strip whenever the path needed encoding (e.g. a folder name with a space), leaving
    // every file's `name` as the full, now-wrongly-decoded url instead of its relative name.
    const prefix = `${RESOURCE_TYPE_PREFIX[ResourceType.SKILL]}${encodeCorePath(path)}/files/`;
    return (res?.items ?? [])
      .filter((item) => (item.nodeType ?? 'ITEM').toUpperCase() !== 'FOLDER')
      .map((item) => ({
        name: item.url ? decodeCorePath(stripPrefix(item.url, prefix)) : item.name,
      }));
  }

  /**
   * Uploads (creates or replaces) a single file within a skill's bundle
   * (`PUT /v2/skills/{bucket}/{path}/files/{filePath}`, multipart). Defaults to overwrite semantics,
   * matching `FilesCoreApi.uploadFile`.
   */
  uploadSkillFile(
    token: Token,
    path: string,
    filePath: string,
    file: File,
    options: { overwrite?: boolean } = {},
  ): Promise<ServerActionResponse> {
    const form = new FormData();
    form.append('file', file);
    const overwrite = options.overwrite ?? true;
    const headers = createHeadersForCreate(overwrite);
    const url = `${CORE_SKILLS_URL}/${encodeCorePath(path)}/files/${encodeCorePath(filePath)}`;
    return this.postFiles(url, form, token, 'PUT', headers);
  }

  /**
   * Creates a brand-new skill (`PUT /v2/skills/{bucket}/{path}`, multipart, a single generated
   * `SKILL.md` part) — the only Core route capable of creating a skill from scratch. Unlike
   * {@link uploadSkillFile}, which only mutates a file inside an *already-existing* bundle, this
   * targets the whole-bundle route. Create-only: sends `If-None-Match: *` (via the same
   * `createHeadersForCreate` convention `AssetApi.put` already uses for every other type's create),
   * so Core rejects the call rather than overwriting a skill that already exists at this path.
   */
  createSkill(token: Token, path: string, name: string, description: string): Promise<ServerActionResponse> {
    const manifest = new File([buildSkillManifest(name, description)], SKILL_MANIFEST_FILE, {
      type: 'text/markdown',
    });
    const form = new FormData();
    form.append('file', manifest);
    const headers = createHeadersForCreate(false);
    const url = `${CORE_SKILLS_URL}/${encodeCorePath(path)}`;
    return this.postFiles(url, form, token, 'PUT', headers);
  }

  /**
   * Creates an empty Skills grouping folder (`PUT /v2/skills/{bucket}/{path}/` — trailing slash, no
   * body), distinct from {@link createSkill}'s whole-bundle route (no trailing slash). Mirrors
   * {@link deleteSkillFolder}'s existing trailing-slash route construction for the same folder-marker
   * resource.
   */
  createSkillFolder(token: Token, path: string): Promise<ServerActionResponse> {
    // `path` isn't reliably trailing-slash-free from every caller (e.g. a folder row's own path
    // carries one) — normalizing here, rather than trusting each call site, keeps this route's own
    // one-appended-slash contract from ever producing a `//` Core doesn't resolve.
    const url = `${CORE_SKILLS_URL}/${encodeCorePath(removeTrailingSlash(path))}/`;
    return this.sendActionRequest(url, 'PUT', token);
  }

  /**
   * Reads `SKILL.md`'s raw content as text (`GET /v2/skills/{bucket}/{path}/files/SKILL.md`) — used
   * to populate the Skill tab's Name/Description/body fields (see `skill-manifest.ts`'s parser).
   * Deliberately bypasses `getAction`/`get`: `BaseApi`'s shared response parsing assumes a body is
   * either JSON or `text/plain` and falls back to `res.json().catch(() => res.text().catch(...))`
   * for anything else — but a `Response` body can only be read once, so when Core returns `SKILL.md`
   * with its own content type (e.g. `text/markdown`, whatever it was uploaded as), the failed
   * `res.json()` already consumes the stream and the fallback `res.text()` comes back empty. Reading
   * `res.text()` directly, once, sidesteps that. Not `downloadSkillFile`/`previewSkillFile` either:
   * those return a streamed `Response` meant to be piped straight to the browser, not read as a
   * string server-side.
   */
  async getSkillManifestContent(token: Token, path: string): Promise<ServerActionResponse> {
    const url = `${this.config.host || ''}${CORE_SKILLS_URL}/${encodeCorePath(path)}/files/${SKILL_MANIFEST_FILE}`;
    const res = await sendRequest(url, 'GET', getApiHeaders(token));
    const etag = res.headers.get('etag') || undefined;
    const content = await res.text();

    if (!(res.status >= 200 && res.status < 300)) {
      const errObject = this.parseErrorBody(content, res.status);
      return {
        success: false,
        errorMessage: getErrorMessage(errObject, res.status),
        errorHeader: getError(errObject),
        status: res.status,
        etag,
      };
    }

    return { success: true, response: content, etag };
  }

  /** Streams a single file's content from a skill's bundle for download (`GET /v2/skills/{bucket}/{path}/files/{filePath}`). */
  downloadSkillFile(token: Token, path: string, filePath: string): Promise<Response> {
    const url = `${CORE_SKILLS_URL}/${encodeCorePath(path)}/files/${encodeCorePath(filePath)}`;
    return this.streamRequest(url, filePath.split('/').pop() || filePath, token);
  }

  /** Streams a single file's content from a skill's bundle for inline preview. */
  previewSkillFile(token: Token, path: string, filePath: string): Promise<Response> {
    const url = `${CORE_SKILLS_URL}/${encodeCorePath(path)}/files/${encodeCorePath(filePath)}`;
    return this.streamRequest(url, filePath.split('/').pop() || filePath, token, true);
  }

  /**
   * Deletes a single file within a skill's bundle (`DELETE /v2/skills/{bucket}/{path}/files/{filePath}`).
   * Unlike {@link deleteSkill}, the etag is optional — Core's per-file route accepts an unconditional
   * delete, and callers that don't need concurrency protection (e.g. removing a single file after a
   * fresh read) aren't forced to thread one through.
   */
  deleteSkillFile(token: Token, path: string, filePath: string, etag?: string): Promise<ServerActionResponse> {
    const url = `${CORE_SKILLS_URL}/${encodeCorePath(path)}/files/${encodeCorePath(filePath)}`;
    return this.sendActionRequest(url, 'DELETE', token, undefined, etag ? createIfMatchHeaders(etag) : undefined);
  }

  /**
   * Lists the direct children of a Skill folder path (`GET /v2/metadata/skills/{bucket}/{path}`) —
   * the folder-listing sibling of {@link getSkillMetadata}: metadata-only, one Core request per
   * page, no per-child content or skill-metadata fetch. Returns Core's raw metadata node (shared
   * `CoreResourceMetadataNode` shape) so callers can feed it through `toSkillList`
   * (`skill-metadata.ts`).
   */
  async listSkillMetadata(
    token: Token,
    path: string,
    options: { nextToken?: string; limit?: number } = {},
  ): Promise<CoreResourceMetadataNode | null> {
    const params = new URLSearchParams();
    params.set('recursive', 'false');
    if (options.nextToken) {
      params.set('token', options.nextToken);
    }
    if (options.limit !== undefined) {
      params.set('limit', String(options.limit));
    }
    const url = `${CORE_SKILLS_METADATA_URL}/${encodeCorePath(path)}?${params.toString()}`;
    return this.get<CoreResourceMetadataNode>(url, token);
  }

  /**
   * Deletes a skill (`DELETE /v2/skills/{bucket}/{path}`). Requires a real etag and always sends
   * `If-Match` — mirrors `FilesCoreApi.deleteFile`'s required-etag guard. The generic `AssetApi`
   * cannot be used here: its delete builds the URL from `CORE_RESOURCE_URL[SKILL]`, a `v1/skills/...`
   * path Core does not serve.
   */
  deleteSkill(token: Token, path: string, etag: string): Promise<ServerActionResponse> {
    if (!etag) {
      return Promise.reject(
        new Error('deleteSkill requires a concrete etag — Core rejects an unconditional skill delete.'),
      );
    }
    const url = `${CORE_SKILLS_URL}/${encodeCorePath(path)}`;
    return this.sendActionRequest(url, 'DELETE', token, undefined, createIfMatchHeaders(etag));
  }

  /**
   * Deletes a DIAL grouping folder marker (`DELETE /v2/skills/{bucket}/{path}/` — trailing slash).
   * A different Core route from {@link deleteSkill}: `ComplexResourceController` dispatches on the
   * trailing slash alone (`folderOp`) to `deleteFolderTarget`/`ComplexResourceService.deleteFolder`,
   * which rejects with a conflict if the folder is not empty, rather than removing a whole tree.
   */
  deleteSkillFolder(token: Token, path: string, etag: string): Promise<ServerActionResponse> {
    // Same normalization as `createSkillFolder` — a folder row's own path may already carry a
    // trailing slash, and this route appends its own.
    const url = `${CORE_SKILLS_URL}/${encodeCorePath(removeTrailingSlash(path))}/`;
    return this.sendActionRequest(url, 'DELETE', token, undefined, createIfMatchHeaders(etag));
  }
}
