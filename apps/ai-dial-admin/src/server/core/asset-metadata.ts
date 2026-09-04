import {
  DialAppRunnerResource,
  DialApplicationResource,
  DialInterceptorResource,
  DialKeyResource,
  DialModelResource,
  DialRoleResource,
  DialRouteResource,
  DialToolsetResource,
} from '@/src/models/dial/resource';
import { DialConversation } from '@/src/models/dial/conversation';
import { CoreAppRunnerRoutes } from '@/src/models/dial/core-app-runner-route';
import { DialFileNodeType } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { fromCoreAppRoutes } from '@/src/utils/app-runners/core-app-routes';
import { fromCoreRunnerName } from '@/src/utils/app-runners/core-runner-name';
import { normalizeRoleLimits } from '@/src/utils/roles/limits';
import { ResourceType } from '@/src/types/resource-type';
import { RESOURCE_TYPE_PREFIX } from '@/src/constants/publications-core';
import { VERSIONED_RESOURCE_TYPES } from '@/src/constants/assets-core';
import {
  decodeCorePath,
  parseEncodedFlatPath,
  parseEncodedVersionedPath,
  stripPrefix,
  VersionedPathParts,
} from '@/src/server/publications/path';
import { isPlatformBucketPath, PLATFORM_ROOT_FOLDER } from '@/src/utils/files/root-folder';

/**
 * DIAL Core's generic resource metadata node (`GET /v1/metadata/{type}/{path}`).
 * Mirrors the shape the backend's `BaseMetadataDto`/`*ClientMapper` classes consume —
 * the same fields already surfaced to the frontend for files via `DialFile`.
 */
export interface CoreResourceMetadataNode {
  name: string;
  parentPath: string | null;
  bucket: string;
  url: string;
  nodeType: 'ITEM' | 'FOLDER';
  resourceType?: string;
  createdAt?: number;
  updatedAt?: number;
  author?: string;
  /**
   * Present on `ITEM` nodes only (Core's `ResourceItemMetadata`). For flat/unversioned types
   * (e.g. `MODEL`), this is the only place the blob etag is exposed — the per-entity content GET
   * never sets an `ETag` response header, so callers must read it from here instead.
   */
  etag?: string;
  items?: CoreResourceMetadataNode[];
  nextToken?: string;
}

/** Lightweight fields every list row needs — metadata-only, no content fetch (matches the backend's `*Info` list mappers). */
export interface ResourceInfo {
  name: string;
  folderId: string;
  path: string;
  version?: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  nodeType?: DialFileNodeType;
  /**
   * Present on `ITEM` nodes (see `CoreResourceMetadataNode.etag`). Unused by most consumers — a
   * type-name lookup carries its own etag from its content GET — but Skill rows need it here since
   * their delete has no content GET to source an etag from (see `skill-resources-core-api`).
   */
  etag?: string;
}

export const isVersioned = (type: ResourceType): boolean => (VERSIONED_RESOURCE_TYPES as ResourceType[]).includes(type);

const toResourceInfo = (metadata: CoreResourceMetadataNode, type: ResourceType): ResourceInfo => {
  const prefix = RESOURCE_TYPE_PREFIX[type];
  const { path, folderId, name, version }: VersionedPathParts = isVersioned(type)
    ? parseEncodedVersionedPath(metadata.url, prefix)
    : { ...parseEncodedFlatPath(metadata.url, prefix), version: undefined };
  return {
    // An app runner's resource name is its percent-encoded `$id`; rows show the `$id` while `path`
    // stays encoded, since that is what the CRUD calls address.
    name: type === ResourceType.APP_TYPE_SCHEMA ? fromCoreRunnerName(name) : name,
    folderId,
    path,
    version,
    author: metadata.author,
    createdAt: metadata.createdAt !== undefined ? String(metadata.createdAt) : undefined,
    updatedAt: metadata.updatedAt !== undefined ? String(metadata.updatedAt) : undefined,
    nodeType: metadata.nodeType.toLowerCase() as DialFileNodeType,
    etag: metadata.etag,
  };
};

/** Flattens a (possibly recursive) metadata tree's `ITEM` nodes into list rows. */
export const toResourceInfoList = (node: CoreResourceMetadataNode | null, type: ResourceType): ResourceInfo[] => {
  if (!node?.items) {
    return [];
  }
  return node.items.map((item) => toResourceInfo(item, type));
};

const metadataFields = (metadata: CoreResourceMetadataNode, prefix: string) => {
  const { path, folderId, name, version } = parseEncodedVersionedPath(metadata.url, prefix);
  return {
    name,
    folderId,
    path,
    version: version ?? '',
    author: metadata.author ?? '',
    createdAt: metadata.createdAt !== undefined ? String(metadata.createdAt) : undefined,
    updatedAt: metadata.updatedAt !== undefined ? String(metadata.updatedAt) : undefined,
  };
};

const flatMetadataFields = (metadata: CoreResourceMetadataNode, prefix: string) => {
  const { path, folderId, name } = parseEncodedFlatPath(metadata.url, prefix);
  return {
    name,
    path,
    folderId,
    author: metadata.author ?? '',
    createdAt: metadata.createdAt !== undefined ? String(metadata.createdAt) : undefined,
    updatedAt: metadata.updatedAt !== undefined ? String(metadata.updatedAt) : undefined,
  };
};

/**
 * Applications and toolsets are dual-bucket (see `DUAL_BUCKET_VIEWS`): `public/…` is hierarchical
 * and versioned, `platform/…` is flat like the other platform-only entities. Which bucket a given
 * resource lives in is a property of its own metadata `url`, not its `ResourceType` — the same type
 * serves both — so it's read off the URL here rather than threaded through as a caller flag. The
 * `platform` segment is folded into the prefix for the flat case, matching how `MODELS_PREFIX` et al.
 * already bake their fixed bucket segment in.
 */
const dualBucketMetadataFields = (metadata: CoreResourceMetadataNode, prefix: string) => {
  const remainder = decodeCorePath(stripPrefix(metadata.url, prefix));
  return isPlatformBucketPath(remainder)
    ? flatMetadataFields(metadata, `${prefix}${PLATFORM_ROOT_FOLDER}/`)
    : metadataFields(metadata, prefix);
};

/**
 * Merges a Core content DTO with its Core metadata node into the frontend model shape,
 * matching the backend's `*ClientMapper` field split: name/folderId/version/author/updatedAt
 * come from metadata, everything else comes from content.
 */
export const mergeApplicationResource = (
  content: Record<string, unknown>,
  metadata: CoreResourceMetadataNode,
): DialApplicationResource => {
  return {
    ...content,
    ...dualBucketMetadataFields(metadata, RESOURCE_TYPE_PREFIX[ResourceType.APPLICATION]),
  } as DialApplicationResource;
};

export const mergeToolsetResource = (
  content: Record<string, unknown>,
  metadata: CoreResourceMetadataNode,
): DialToolsetResource => {
  return {
    ...content,
    ...dualBucketMetadataFields(metadata, RESOURCE_TYPE_PREFIX[ResourceType.TOOLSET]),
  } as DialToolsetResource;
};

export const mergeConversation = (
  content: Record<string, unknown>,
  metadata: CoreResourceMetadataNode,
): DialConversation => {
  return {
    ...content,
    ...metadataFields(metadata, RESOURCE_TYPE_PREFIX[ResourceType.CONVERSATION]),
  } as DialConversation;
};

export const mergePrompt = (content: Record<string, unknown>, metadata: CoreResourceMetadataNode): DialPrompt => {
  return {
    ...content,
    ...metadataFields(metadata, RESOURCE_TYPE_PREFIX[ResourceType.PROMPT]),
    nodeType: DialFileNodeType.ITEM,
  } as DialPrompt;
};

/**
 * Models are flat and unversioned (Core's `models/platform/{name}`, no subfolders, no
 * `__version` suffix) — merged via `flatMetadataFields` rather than `metadataFields`, since the
 * metadata `url`'s remainder after stripping the `models/platform/` prefix is a bare name with
 * no `/` separator to split into folderId + name.
 */
export const mergeModelResource = (
  content: Record<string, unknown>,
  metadata: CoreResourceMetadataNode,
): DialModelResource => {
  return {
    ...content,
    ...flatMetadataFields(metadata, RESOURCE_TYPE_PREFIX[ResourceType.MODEL]),
  } as DialModelResource;
};

/**
 * App runners are flat and unversioned like models, and additionally carry two conversions no other
 * type needs: the resource name is a percent-encoded `$id` (recovered here, since `$id` is the
 * runner's identity everywhere in the UI), and Core's `dial:applicationTypeRoutes` is a name-keyed
 * object that the route editors consume as an array.
 */
export const mergeAppRunnerResource = (
  content: Record<string, unknown>,
  metadata: CoreResourceMetadataNode,
): DialAppRunnerResource => {
  const { name, ...fields } = flatMetadataFields(metadata, RESOURCE_TYPE_PREFIX[ResourceType.APP_TYPE_SCHEMA]);
  const routes = fromCoreAppRoutes(content['dial:applicationTypeRoutes'] as CoreAppRunnerRoutes | undefined);
  return {
    ...content,
    ...fields,
    name,
    $id: fromCoreRunnerName(name),
    ...(routes && { 'dial:applicationTypeRoutes': routes }),
  } as DialAppRunnerResource;
};

/**
 * Interceptors are flat and unversioned like models — merged via `flatMetadataFields` for the same
 * reason `mergeModelResource` is: the metadata `url`'s remainder after stripping
 * `interceptors/platform/` is a bare name with no `/` separator to split into folderId + name.
 */
export const mergeInterceptorResource = (
  content: Record<string, unknown>,
  metadata: CoreResourceMetadataNode,
): DialInterceptorResource => {
  return {
    ...content,
    ...flatMetadataFields(metadata, RESOURCE_TYPE_PREFIX[ResourceType.INTERCEPTOR]),
  } as DialInterceptorResource;
};

/**
 * Routes are flat and unversioned like models and interceptors — merged via `flatMetadataFields` for
 * the same reason: the metadata `url`'s remainder after stripping `routes/platform/` is a bare name
 * with no `/` separator to split into folderId + name.
 */
export const mergeRouteResource = (
  content: Record<string, unknown>,
  metadata: CoreResourceMetadataNode,
): DialRouteResource => {
  return {
    ...content,
    ...flatMetadataFields(metadata, RESOURCE_TYPE_PREFIX[ResourceType.ROUTE]),
  } as DialRouteResource;
};

/**
 * Roles are flat and unversioned like models, interceptors, and routes — merged via
 * `flatMetadataFields` for the same reason: the metadata `url`'s remainder after stripping
 * `roles/platform/` is a bare name with no `/` separator to split into folderId + name.
 *
 * `costLimit`/`limits` are additionally normalized through `normalizeRoleLimits` here — Core's
 * `Limit`/`CostLimit` fields have no `@JsonFormat(shape=STRING)`, so a within-range token arrives as
 * a plain JSON number. An out-of-range one (e.g. the `Long.MAX_VALUE` "unlimited" sentinel, 19
 * digits — far past `Number.MAX_SAFE_INTEGER`) is dropped rather than kept as the lossily-rounded
 * number `JSON.parse` produces for it: Core's own field default already means "unlimited" once a
 * token is missing, and a role write is always a full replace (see `normalizeRoleLimits`'s doc
 * comment), so omitting it here is exactly equivalent to the sentinel, with no precision to lose.
 */
export const mergeRoleResource = (
  content: Record<string, unknown>,
  metadata: CoreResourceMetadataNode,
): DialRoleResource => {
  const { costLimit, limits, ...rest } = content as {
    costLimit?: Record<string, unknown>;
    limits?: Record<string, Record<string, unknown>>;
  };
  return {
    ...rest,
    ...(costLimit !== undefined && { costLimit: normalizeRoleLimits(costLimit) }),
    ...(limits !== undefined && {
      limits: Object.fromEntries(
        Object.entries(limits || {}).map(([name, roleLimits]) => [name, normalizeRoleLimits(roleLimits)]),
      ),
    }),
    ...flatMetadataFields(metadata, RESOURCE_TYPE_PREFIX[ResourceType.ROLE]),
  } as DialRoleResource;
};

/**
 * Project keys are flat and unversioned like roles and routes — merged via `flatMetadataFields`
 * for the same reason: the metadata `url`'s remainder after stripping `keys/platform/` is a bare
 * name with no `/` separator to split into folderId + name.
 *
 * `allowedIpAddressRanges` is normalized here because Core's wire shape is asymmetric: the field
 * deserializes from a JSON array of CIDR strings but serializes (via the default MAPPER, which has
 * no custom serializer for `IpAddressRanges`) as the bean form `{"ranges":[…]}` with base64 byte
 * arrays, or `null` when no restriction is configured. The frontend edits `string[]`, so:
 *   - `null` / absent            → `undefined` (ALLOW_ALL — "no restriction")
 *   - `{"ranges":[]}` (empty)    → `[]`        (BLOCK_ALL — "deny all"), preserved so a saved
 *                                                  block-all survives a reload instead of silently
 *                                                  reverting to allow-all
 *   - `{"ranges":[…]}` populated → `["ip/prefix", …]` reconstructed from each range's base64
 *                                                  `mask`/`maskedBaseIp` byte arrays (see
 *                                                  `cidrFromRange`) — so a saved real range
 *                                                  round-trips instead of degrading to allow-all
 *   - a real `string[]`          → kept as-is (defensive: a future Core serializer would emit it)
 * `undefined` (not `null`) is used for ALLOW_ALL so `isEqualSkippingUndefined` treats it as absent
 * and the Save/Discard buttons clear on a clean round-trip.
 */
export const mergeKeyResource = (
  content: Record<string, unknown>,
  metadata: CoreResourceMetadataNode,
): DialKeyResource => {
  const { allowedIpAddressRanges, ...rest } = content as {
    allowedIpAddressRanges?: string[] | { ranges?: IpRangeBean[] } | null;
  };
  const normalizedRanges = normalizeIpRanges(allowedIpAddressRanges);
  return {
    ...rest,
    ...(normalizedRanges !== undefined && { allowedIpAddressRanges: normalizedRanges }),
    ...flatMetadataFields(metadata, RESOURCE_TYPE_PREFIX[ResourceType.PROJECT_KEY]),
  } as DialKeyResource;
};

/** Core's `IpAddressRange` bean as it appears on the wire: base64-encoded `mask`/`maskedBaseIp`. */
interface IpRangeBean {
  mask?: string;
  maskedBaseIp?: string;
}

/**
 * Maps Core's `allowedIpAddressRanges` wire shape to the `string[] | undefined` the frontend edits.
 * See `mergeKeyResource` for the full asymmetry rationale.
 */
function normalizeIpRanges(value: string[] | { ranges?: IpRangeBean[] } | null | undefined): string[] | undefined {
  if (Array.isArray(value)) {
    return value;
  }
  if (value && typeof value === 'object' && Array.isArray(value.ranges)) {
    // An empty `ranges` array is BLOCK_ALL ("deny all") and must survive a reload. A populated one
    // is the byte-array bean form; reconstruct each CIDR and drop any that fail to decode. If every
    // range failed (so the result is empty but the source wasn't), treat as ALLOW_ALL rather than
    // silently converting an unreadable restriction into "deny all".
    if (value.ranges.length === 0) {
      return [];
    }
    const decoded = value.ranges.map(cidrFromRange).filter(Boolean) as string[];
    return decoded.length > 0 ? decoded : undefined;
  }
  return undefined;
}

/**
 * Reconstructs a CIDR string (`ip/prefix`) from one Core `IpAddressRange` bean. Core stores only the
 * masked base IP and the bitmask (as base64 byte arrays), so the CIDR is `<maskedBaseIp>/<prefixLen>`
 * where `prefixLen` is the count of leading 1-bits in `mask`. Non-canonical inputs (host bits set,
 * non-contiguous masks) normalize to the network address the range actually matches — the same
 * address Core's deserializer stored — so a round-trip is stable. Returns `undefined` for a range
 * that can't be decoded (malformed base64 / missing bytes) so the caller drops it.
 */
function cidrFromRange(range: IpRangeBean): string | undefined {
  const maskBytes = decodeBase64Bytes(range?.mask);
  const ipBytes = decodeBase64Bytes(range?.maskedBaseIp);
  if (!maskBytes || !ipBytes || maskBytes.length !== ipBytes.length) {
    return undefined;
  }
  let prefixLen = 0;
  for (const byte of maskBytes) {
    const bits = byte & 0xff;
    // Count leading 1-bits; stop at the first 0.
    for (let i = 7; i >= 0; i--) {
      if (bits & (1 << i)) {
        prefixLen++;
      } else {
        break;
      }
    }
  }
  return `${bytesToIp(ipBytes)}/${prefixLen}`;
}

/** Decodes a base64 string to a byte array; returns `undefined` for malformed/empty input. */
function decodeBase64Bytes(value?: string): Uint8Array | undefined {
  if (!value) {
    return undefined;
  }
  try {
    const binary = typeof atob === 'function' ? atob(value) : Buffer.from(value, 'base64').toString('binary');
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return undefined;
  }
}

/** Formats an IP byte array as a dotted-quad (IPv4) or colon-hex (IPv6) string. */
function bytesToIp(bytes: Uint8Array): string {
  if (bytes.length === 4) {
    return Array.from(bytes, (b) => b & 0xff).join('.');
  }
  // IPv6: group 16 bytes into 8 big-endian 16-bit words, render as colon-separated hex.
  const groups: string[] = [];
  for (let i = 0; i < bytes.length; i += 2) {
    groups.push(((bytes[i] << 8) | (bytes[i + 1] & 0xff)).toString(16));
  }
  return groups.join(':');
}

export type AssetMerge = (content: Record<string, unknown>, metadata: CoreResourceMetadataNode) => unknown;

export const ASSET_MERGERS: Partial<Record<ResourceType, AssetMerge>> = {
  [ResourceType.APPLICATION]: mergeApplicationResource,
  [ResourceType.TOOLSET]: mergeToolsetResource,
  [ResourceType.CONVERSATION]: mergeConversation,
  [ResourceType.PROMPT]: mergePrompt,
  [ResourceType.MODEL]: mergeModelResource,
  [ResourceType.APP_TYPE_SCHEMA]: mergeAppRunnerResource,
  [ResourceType.INTERCEPTOR]: mergeInterceptorResource,
  [ResourceType.ROUTE]: mergeRouteResource,
  [ResourceType.ROLE]: mergeRoleResource,
  [ResourceType.PROJECT_KEY]: mergeKeyResource,
};
