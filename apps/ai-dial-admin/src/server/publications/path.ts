/**
 * Path helpers for the direct DIAL Core publication flow — a TypeScript port of
 * the backend `PathUtils` / `CoreMetadataUtils` semantics.
 *
 * DIAL Core resource URLs look like `prefix/folder/sub/Name__version` with each
 * segment URL-encoded. Names carry an optional `__version` suffix. These helpers
 * strip prefixes, decode/encode per segment, and parse the versioned name.
 */

export interface PathParts {
  path: string;
  folderId: string;
  name: string;
}

export interface VersionedPathParts extends PathParts {
  version?: string;
}

export const ensureTrailingSlash = (path?: string): string => {
  if (!path) {
    return '/';
  }
  return path.endsWith('/') ? path : `${path}/`;
};

export const stripTrailingSlash = (path: string): string => {
  return path.endsWith('/') ? path.slice(0, -1) : path;
};

export const stripPrefix = (path: string, prefix: string): string => {
  return path.startsWith(prefix) ? path.slice(prefix.length) : path;
};

/** Encodes each `/`-separated segment individually (mirrors `UrlUtil.encodePath`). */
export const encodeCorePath = (path: string): string => {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
};

/** Decodes each `/`-separated segment individually (mirrors `UrlUtil.decodePath`). */
export const decodeCorePath = (path: string): string => {
  return path
    .split('/')
    .map((segment) => decodeURIComponent(segment))
    .join('/');
};

/** Splits a raw name into its base name and optional `__version` suffix. */
export const extractNameAndVersion = (rawName: string): { name: string; version?: string } => {
  const separatorIndex = rawName.lastIndexOf('__');
  if (separatorIndex === -1) {
    return { name: rawName };
  }
  return { name: rawName.slice(0, separatorIndex), version: rawName.slice(separatorIndex + 2) };
};

/** Splits a (trimmed) path into folderId + name. */
export const parsePath = (path: string): PathParts => {
  const trimmed = stripTrailingSlash(path);
  const lastSlashIndex = trimmed.lastIndexOf('/');
  if (lastSlashIndex === -1) {
    throw new Error(`The path does not contain a '/': ${trimmed}`);
  }
  return {
    path: trimmed,
    folderId: trimmed.slice(0, lastSlashIndex + 1),
    name: trimmed.slice(lastSlashIndex + 1),
  };
};

/** Splits a decoded path into folderId + name + version. */
export const parseVersionedPath = (path: string): VersionedPathParts => {
  const lastSlashIndex = path.lastIndexOf('/');
  if (lastSlashIndex === -1) {
    throw new Error(`The path does not contain a '/': ${path}`);
  }
  const folderId = path.slice(0, lastSlashIndex + 1);
  const { name, version } = extractNameAndVersion(path.slice(lastSlashIndex + 1));
  return { path, folderId, name, version };
};

/** Strips the resource prefix, decodes, and parses the versioned path. */
export const parseEncodedVersionedPath = (path: string, prefix: string): VersionedPathParts => {
  return parseVersionedPath(decodeCorePath(stripPrefix(path, prefix)));
};

export const getVersionedName = (name: string, version?: string): string => {
  if (name == null) {
    throw new Error('Name must not be null');
  }
  return version == null || version.trim() === '' ? name : `${name}__${version}`;
};

/** Builds an encoded `folder/Name__version` path (mirrors `PathUtils.buildEncodedPath`). */
export const buildEncodedPath = (folderId: string, name: string, version?: string): string => {
  const cleanFolderId = stripTrailingSlash(folderId);
  return encodeCorePath(`${cleanFolderId}/${getVersionedName(name, version)}`);
};

/** Encodes a folder path segment-by-segment and ensures a trailing slash (mirrors `CoreMetadataUtils.encodeFolderPath`). */
export const encodeFolderPath = (path: string): string => {
  const encoded = path
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return encoded ? `${encoded}/` : '';
};
